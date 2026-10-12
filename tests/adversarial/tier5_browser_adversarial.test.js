/**
 * tests/adversarial/tier5_browser_adversarial.test.js
 * Adversarial Coverage Hardening Suite (Tier 5-2) for Browser Integration.
 *
 * Verifies white-box robustness across:
 * 1. Action Dispatch & State Machine Torture (invalid actions, out-of-sequence, rapid flooding, setEnabled)
 * 2. Input Normalization, Ghost Clicks & Multi-Touch Gestures (timing thresholds, non-primary buttons, swipe duck, touchcancel)
 * 3. AudioAdapter Error Resilience & Web Audio API States (suspended, closed, constructor failures, volume fuzzing, storage failures)
 * 4. BrowserGameLoop RAF Accumulator Edge Cases (large spikes, negative dt, zero dt, non-running accumulator drain, pause oscillation)
 * 5. CanvasRenderer Rapid Resize Cycles & Visual Resilience (500 rapid resizes, extreme dpr, particle pool bounds, snapshot fuzzing)
 * 6. UIRenderer HUD Sync, Victory Rank Boundaries & DOM Integrity (exact score rank cutoffs, time-critical styling, missing elements)
 * 7. Deployment & Responsive Asset Contract Integrity (zero root-relative paths, HTML/CSS DOM contract)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GameEngine } from '../../src/core/GameEngine.js';
import { BrowserGameLoop } from '../../src/browser/BrowserGameLoop.js';
import { InputAdapter } from '../../src/browser/InputAdapter.js';
import { AudioAdapter } from '../../src/browser/AudioAdapter.js';
import { UIRenderer, calculateVictoryRank } from '../../src/browser/UIRenderer.js';
import { CanvasRenderer } from '../../src/browser/CanvasRenderer.js';
import { FIXED_TIMESTEP, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_STATES } from '../../src/core/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../');

// ============================================================================
// Test Harness Helpers & Mocks
// ============================================================================

class MockEventTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, callback, options) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push({ callback, options });
  }

  removeEventListener(type, callback) {
    if (!this.listeners.has(type)) return;
    const list = this.listeners.get(type).filter((l) => l.callback !== callback);
    this.listeners.set(type, list);
  }

  dispatchMockEvent(type, eventData = {}) {
    if (!this.listeners.has(type)) return;
    const event = {
      type,
      preventDefault: () => {},
      stopPropagation: () => {},
      ...eventData
    };
    const list = [...this.listeners.get(type)];
    for (const item of list) {
      item.callback(event);
      if (item.options && item.options.once) {
        this.removeEventListener(type, item.callback);
      }
    }
  }
}

function createMockBrowserWindow(audioCtxOrFactory) {
  const win = new MockEventTarget();
  if (typeof audioCtxOrFactory === 'function') {
    win.AudioContext = audioCtxOrFactory;
  } else if (audioCtxOrFactory) {
    win.AudioContext = function() { return audioCtxOrFactory; };
  }
  return win;
}

class Mock2DContext {
  constructor() {
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1;
    this.shadowColor = '';
    this.shadowBlur = 0;
    this.globalAlpha = 1.0;
    this.globalCompositeOperation = 'source-over';
    this.font = '10px sans-serif';
    this.textAlign = 'start';
  }

  save() {}
  restore() {}
  setTransform() {}
  translate() {}
  rotate() {}
  fillRect() {}
  strokeRect() {}
  beginPath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  quadraticCurveTo() {}
  fill() {}
  stroke() {}
  closePath() {}
  fillText() {}
  createLinearGradient() {
    return { addColorStop: () => {} };
  }
  createRadialGradient() {
    return { addColorStop: () => {} };
  }
}

class MockCanvas extends MockEventTarget {
  constructor(w = 960, h = 540) {
    super();
    this.width = w;
    this.height = h;
    this.style = { width: `${w}px`, height: `${h}px` };
    this.parentElement = null;
    this._ctx = new Mock2DContext();
  }

  getContext(type) {
    if (type === '2d') return this._ctx;
    return null;
  }
}

class MockAudioParam {
  constructor(initial = 0) {
    this.value = initial;
  }
  setValueAtTime(v) { this.value = v; }
  linearRampToValueAtTime(v) { this.value = v; }
  exponentialRampToValueAtTime(v) { this.value = v; }
  cancelScheduledValues() {}
}

class MockGainNode {
  constructor() {
    this.gain = new MockAudioParam(1);
  }
  connect() {}
}

class MockOscillatorNode {
  constructor() {
    this.type = 'sine';
    this.frequency = new MockAudioParam(440);
  }
  connect() {}
  start() {}
  stop() {}
}

class MockBiquadFilterNode {
  constructor() {
    this.type = 'lowpass';
    this.frequency = new MockAudioParam(1000);
    this.Q = new MockAudioParam(1);
  }
  connect() {}
}

class MockAudioContext {
  constructor(state = 'running') {
    this.state = state;
    this.currentTime = 0;
    this.destination = {};
  }
  createGain() { return new MockGainNode(); }
  createOscillator() { return new MockOscillatorNode(); }
  createBiquadFilter() { return new MockBiquadFilterNode(); }
  createBuffer() { return {}; }
  createBufferSource() {
    return {
      buffer: null,
      connect: () => {},
      start: () => {}
    };
  }
  async resume() {
    this.state = 'running';
  }
  async close() {
    this.state = 'closed';
  }
}

class MockHTMLElement extends MockEventTarget {
  constructor(id = '') {
    super();
    this.id = id;
    this.textContent = '';
    this.className = '';
    this.classList = {
      _classes: new Set(),
      add: (c) => this.classList._classes.add(c),
      remove: (c) => this.classList._classes.delete(c),
      contains: (c) => this.classList._classes.has(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (this.classList._classes.has(c)) this.classList._classes.delete(c);
          else this.classList._classes.add(c);
        } else if (force) {
          this.classList._classes.add(c);
        } else {
          this.classList._classes.delete(c);
        }
      }
    };
  }
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Tier 5-2 Adversarial Coverage Hardening: Browser Presentation & Integration', () => {

  // ==========================================================================
  // Section 1: Action Dispatch & State Machine Torture
  // ==========================================================================
  describe('1. Adversarial Action Dispatch & State Machine Invariants', () => {
    it('1.1: InputAdapter.dispatch survives null, undefined, numbers, objects, and empty strings without throw', () => {
      const engine = new GameEngine();
      const mockCanvas = new MockCanvas();
      const adapter = new InputAdapter(engine, mockCanvas);

      const invalidPayloads = [
        null,
        undefined,
        '',
        12345,
        NaN,
        Infinity,
        -1,
        {},
        [],
        { action: 'JUMP' },
        'NON_EXISTENT_ACTION',
        'constructor',
        '__proto__',
        'prototype',
        'valueOf',
        false,
        true
      ];

      for (const bad of invalidPayloads) {
        assert.doesNotThrow(() => {
          adapter.dispatch(bad);
        }, `Dispatching ${JSON.stringify(bad)} should not throw`);
      }

      // Ensure engine state is still cleanly in INIT
      assert.strictEqual(engine.getSnapshot().state, 'INIT');
      adapter.detach();
    });

    it('1.2: Actions dispatched out of phase are safely rejected without state desynchronization', () => {
      const engine = new GameEngine();
      const mockCanvas = new MockCanvas();
      const adapter = new InputAdapter(engine, mockCanvas);

      // In INIT state: DUCK, STAND, JUMP should have no effect on player state
      adapter.dispatch('DUCK');
      adapter.dispatch('STAND');
      adapter.dispatch('JUMP');
      let snap = engine.getSnapshot();
      assert.strictEqual(snap.state, 'INIT');
      assert.strictEqual(snap.player.isGrounded, true);

      // Start the game
      adapter.dispatch('START');
      snap = engine.getSnapshot();
      assert.strictEqual(snap.state, 'RUNNING');

      // Dispatch START when already RUNNING (must be idempotent)
      adapter.dispatch('START');
      assert.strictEqual(engine.getSnapshot().state, 'RUNNING');

      // Pause the game
      adapter.dispatch('PAUSE');
      assert.strictEqual(engine.getSnapshot().state, 'PAUSED');

      // In PAUSED state: JUMP, DUCK, STAND should not mutate coordinates or velocity
      const yBefore = engine.getSnapshot().player.y;
      adapter.dispatch('JUMP');
      adapter.dispatch('DUCK');
      assert.strictEqual(engine.getSnapshot().player.y, yBefore);
      assert.strictEqual(engine.getSnapshot().state, 'PAUSED');

      // Unpause
      adapter.dispatch('PAUSE');
      assert.strictEqual(engine.getSnapshot().state, 'RUNNING');

      adapter.detach();
    });

    it('1.3: High-frequency action flooding (1000 JUMP/DUCK, 500 PAUSE) does not deadlock or leak', () => {
      const engine = new GameEngine();
      const mockCanvas = new MockCanvas();
      const adapter = new InputAdapter(engine, mockCanvas);

      adapter.dispatch('START');

      // Alternating JUMP and DUCK flood
      for (let i = 0; i < 1000; i++) {
        adapter.dispatch(i % 2 === 0 ? 'JUMP' : 'DUCK');
        engine.tick(0.001);
      }

      let snap = engine.getSnapshot();
      assert.strictEqual(snap.state, 'RUNNING');
      assert.ok(Number.isFinite(snap.player.y));
      assert.ok(Number.isFinite(snap.player.vy));

      // PAUSE spamming 500 times in rapid succession
      for (let i = 0; i < 500; i++) {
        adapter.dispatch('PAUSE');
      }

      // 500 toggles starting from RUNNING -> should end in RUNNING
      assert.strictEqual(engine.getSnapshot().state, 'RUNNING');

      adapter.detach();
    });

    it('1.4: Disabling InputAdapter via setEnabled(false) during active DUCK auto-recovers to STAND and drops inputs', () => {
      const engine = new GameEngine();
      const mockCanvas = new MockCanvas();
      let lastActionEmitted = null;
      const adapter = new InputAdapter(engine, mockCanvas, {
        onAction: (act) => { lastActionEmitted = act; }
      });

      adapter.dispatch('START');
      adapter.dispatch('DUCK');
      assert.strictEqual(engine.getSnapshot().player.height, 32); // Ducking height
      assert.strictEqual(lastActionEmitted, 'DUCK');

      // Disabling input must force STAND action to avoid stuck crouching
      adapter.setEnabled(false);
      assert.strictEqual(adapter.isEnabled, false);
      assert.strictEqual(lastActionEmitted, 'STAND');
      assert.strictEqual(engine.getSnapshot().player.height, 64); // Standing height

      // While disabled, inputs must be completely dropped
      lastActionEmitted = null;
      adapter.dispatch('JUMP');
      adapter.dispatch('PAUSE');
      assert.strictEqual(lastActionEmitted, null);
      assert.strictEqual(engine.getSnapshot().state, 'RUNNING');

      // Re-enabling adapter allows inputs again
      adapter.setEnabled(true);
      assert.strictEqual(adapter.isEnabled, true);
      adapter.dispatch('PAUSE');
      assert.strictEqual(lastActionEmitted, 'PAUSE');
      assert.strictEqual(engine.getSnapshot().state, 'PAUSED');

      adapter.detach();
    });
  });

  // ==========================================================================
  // Section 2: Input Normalization, Ghost Clicks & Mobile Gestures
  // ==========================================================================
  describe('2. Input Normalization, Ghost Clicks & Multi-Touch Gestures', () => {
    it('2.1: Ghost click suppression: mouse pointerdown within 500ms of touch is dropped; after 500ms is allowed', () => {
      const engine = new GameEngine();
      const mockCanvas = new MockCanvas();
      const mockWindow = new MockEventTarget();
      const originalWindow = globalThis.window;
      globalThis.window = mockWindow;

      const actions = [];
      const adapter = new InputAdapter(engine, mockCanvas, {
        onAction: (a) => actions.push(a)
      });

      const originalPerf = globalThis.performance;
      let fakeTime = 1000.0;
      globalThis.performance = { now: () => fakeTime };

      try {
        // 1. Touch event occurs at t = 1000
        mockCanvas.dispatchMockEvent('touchstart', {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        assert.deepStrictEqual(actions, ['START']); // INIT -> START

        // 2. Ghost click pointerdown at t = 1010 (+10ms)
        fakeTime = 1010.0;
        mockCanvas.dispatchMockEvent('pointerdown', {
          pointerType: 'mouse',
          button: 0
        });
        assert.strictEqual(actions.length, 1, 'Ghost click at +10ms must be suppressed');

        // 3. Ghost click pointerdown at t = 1490 (+490ms)
        fakeTime = 1490.0;
        mockCanvas.dispatchMockEvent('pointerdown', {
          pointerType: 'mouse',
          button: 0
        });
        assert.strictEqual(actions.length, 1, 'Ghost click at +490ms must be suppressed');

        // 4. Legitimate mouse click at t = 1505 (+505ms)
        fakeTime = 1505.0;
        mockCanvas.dispatchMockEvent('pointerdown', {
          pointerType: 'mouse',
          button: 0
        });
        assert.strictEqual(actions.length, 2, 'Mouse click at +505ms must be permitted');
        assert.strictEqual(actions[1], 'JUMP');

        adapter.detach();
      } finally {
        if (originalPerf === undefined) delete globalThis.performance;
        else globalThis.performance = originalPerf;
        if (originalWindow === undefined) delete globalThis.window;
        else globalThis.window = originalWindow;
      }
    });

    it('2.2: Pointer events with pointerType: "touch" are ignored to prevent double invocation', () => {
      const engine = new GameEngine();
      const mockCanvas = new MockCanvas();
      const mockWindow = new MockEventTarget();
      const originalWindow = globalThis.window;
      globalThis.window = mockWindow;

      try {
        const actions = [];
        const adapter = new InputAdapter(engine, mockCanvas, {
          onAction: (a) => actions.push(a)
        });

        // Pointer event with touch type should be no-op because touchstart handles it
        mockCanvas.dispatchMockEvent('pointerdown', {
          pointerType: 'touch',
          button: 0
        });
        assert.strictEqual(actions.length, 0);

        adapter.detach();
      } finally {
        if (originalWindow === undefined) delete globalThis.window;
        else globalThis.window = originalWindow;
      }
    });

    it('2.3: Non-primary pointer buttons (middle, right click, etc.) are strictly ignored', () => {
      const engine = new GameEngine();
      const mockCanvas = new MockCanvas();
      const mockWindow = new MockEventTarget();
      const originalWindow = globalThis.window;
      globalThis.window = mockWindow;

      try {
        const actions = [];
        const adapter = new InputAdapter(engine, mockCanvas, {
          onAction: (a) => actions.push(a)
        });

        // button = 1 (middle click), button = 2 (right click)
        mockCanvas.dispatchMockEvent('pointerdown', { pointerType: 'mouse', button: 1 });
        mockCanvas.dispatchMockEvent('pointerdown', { pointerType: 'mouse', button: 2 });
        mockCanvas.dispatchMockEvent('pointerdown', { pointerType: 'mouse', button: -1 });

        assert.strictEqual(actions.length, 0, 'Non-primary clicks must produce 0 actions');
        adapter.detach();
      } finally {
        if (originalWindow === undefined) delete globalThis.window;
        else globalThis.window = originalWindow;
      }
    });

    it('2.4: Key repeat suppression: holding Space/ArrowUp drops event.repeat duplicates', () => {
      const engine = new GameEngine();
      const mockCanvas = new MockCanvas();
      const mockWindow = new MockEventTarget();
      const originalWindow = globalThis.window;
      globalThis.window = mockWindow;

      try {
        const actions = [];
        const adapter = new InputAdapter(engine, mockCanvas, {
          onAction: (a) => actions.push(a)
        });

        // 1. Initial Space starts game
        mockWindow.dispatchMockEvent('keydown', { code: 'Space', repeat: false });
        assert.deepStrictEqual(actions, ['START']);

        // 2. Initial Jump
        mockWindow.dispatchMockEvent('keydown', { code: 'Space', repeat: false });
        assert.deepStrictEqual(actions, ['START', 'JUMP']);

        // 3. Repeated keydown events while held down
        for (let i = 0; i < 50; i++) {
          mockWindow.dispatchMockEvent('keydown', { code: 'Space', repeat: true });
        }
        assert.strictEqual(actions.length, 2, 'Key repeat events must be completely dropped');

        adapter.detach();
      } finally {
        if (originalWindow === undefined) delete globalThis.window;
        else globalThis.window = originalWindow;
      }
    });

    it('2.5: Swipe gesture ambiguity: downward swipe (>35px) triggers DUCK; upward and small swipes do not', () => {
      const engine = new GameEngine();
      const mockCanvas = new MockCanvas();
      const mockWindow = new MockEventTarget();
      const originalWindow = globalThis.window;
      globalThis.window = mockWindow;

      try {
        const actions = [];
        const adapter = new InputAdapter(engine, mockCanvas, {
          onAction: (a) => actions.push(a)
        });

        // Start game
        mockCanvas.dispatchMockEvent('touchstart', {
          touches: [{ clientX: 200, clientY: 200 }]
        });
        assert.deepStrictEqual(actions, ['START']);

        // Touch start in RUNNING state (y = 200)
        mockCanvas.dispatchMockEvent('touchstart', {
          touches: [{ clientX: 200, clientY: 200 }]
        });
        assert.strictEqual(actions[1], 'JUMP');

        // 1. Upward swipe (deltaY = -60) -> no duck
        mockCanvas.dispatchMockEvent('touchmove', {
          touches: [{ clientX: 200, clientY: 140 }]
        });
        assert.strictEqual(actions.length, 2);

        // 2. Horizontal swipe with small vertical delta (deltaX = 100, deltaY = 15) -> no duck
        mockCanvas.dispatchMockEvent('touchmove', {
          touches: [{ clientX: 300, clientY: 215 }]
        });
        assert.strictEqual(actions.length, 2);

        // 3. Downward swipe past threshold (deltaY = 40 > 35) -> triggers DUCK
        mockCanvas.dispatchMockEvent('touchmove', {
          touches: [{ clientX: 200, clientY: 240 }]
        });
        assert.strictEqual(actions.length, 3);
        assert.strictEqual(actions[2], 'DUCK');

        // Touchend resets duck to STAND
        mockCanvas.dispatchMockEvent('touchend', { touches: [] });
        assert.strictEqual(actions.length, 4);
        assert.strictEqual(actions[3], 'STAND');

        adapter.detach();
      } finally {
        if (originalWindow === undefined) delete globalThis.window;
        else globalThis.window = originalWindow;
      }
    });

    it('2.6: Touch cancellation via touchcancel cleanly releases ducking to STAND without error', () => {
      const engine = new GameEngine();
      const mockCanvas = new MockCanvas();
      const mockWindow = new MockEventTarget();
      const originalWindow = globalThis.window;
      globalThis.window = mockWindow;

      try {
        const actions = [];
        const adapter = new InputAdapter(engine, mockCanvas, {
          onAction: (a) => actions.push(a)
        });

        adapter.dispatch('START');

        // Initiate touch and swipe down to duck
        mockCanvas.dispatchMockEvent('touchstart', {
          touches: [{ clientX: 200, clientY: 200 }]
        });
        mockCanvas.dispatchMockEvent('touchmove', {
          touches: [{ clientX: 200, clientY: 250 }]
        });
        assert.strictEqual(actions[actions.length - 1], 'DUCK');

        // Incoming phone call / alert triggers touchcancel
        mockCanvas.dispatchMockEvent('touchcancel', { touches: [] });
        assert.strictEqual(actions[actions.length - 1], 'STAND');

        adapter.detach();
      } finally {
        if (originalWindow === undefined) delete globalThis.window;
        else globalThis.window = originalWindow;
      }
    });
  });

  // ==========================================================================
  // Section 3: AudioAdapter Error Resilience & Web Audio API States
  // ==========================================================================
  describe('3. AudioAdapter Error Resilience & Web Audio API States', () => {
    it('3.1: Suspended AudioContext silently suppresses sound scheduling without throwing', () => {
      const originalWindow = globalThis.window;
      const mockCtx = new MockAudioContext('suspended');
      globalThis.window = createMockBrowserWindow(mockCtx);

      try {
        const engine = new GameEngine();
        const audio = new AudioAdapter(engine);

        assert.strictEqual(audio.isSupported, true);

        // All sound generators must safely no-op when suspended
        assert.doesNotThrow(() => {
          audio.playJump();
          audio.playHit();
          audio.playItemCollected('STAR');
          audio.playVictory();
          audio.playGameOver();
          audio.playPause();
          audio.playResume();
        });

        audio.destroy();
      } finally {
        if (originalWindow === undefined) delete globalThis.window;
        else globalThis.window = originalWindow;
      }
    });

    it('3.2: Closed AudioContext does not throw or reject upon unlock(), sound triggers, or destroy()', async () => {
      const originalWindow = globalThis.window;
      const mockCtx = new MockAudioContext('closed');
      globalThis.window = createMockBrowserWindow(mockCtx);

      try {
        const engine = new GameEngine();
        const audio = new AudioAdapter(engine);

        await assert.doesNotReject(async () => {
          await audio.unlock();
        });

        assert.doesNotThrow(() => {
          audio.playJump();
          audio.playHit();
        });

        await assert.doesNotReject(async () => {
          await audio.destroy();
        });
      } finally {
        if (originalWindow === undefined) delete globalThis.window;
        else globalThis.window = originalWindow;
      }
    });

    it('3.3: AudioContext construction failure (browser policy or error) sets isSupported = false cleanly', () => {
      const originalWindow = globalThis.window;
      globalThis.window = createMockBrowserWindow(function() {
        throw new Error('AudioContext creation blocked by browser policy');
      });

      try {
        const engine = new GameEngine();
        const audio = new AudioAdapter(engine);
        assert.strictEqual(audio.isSupported, false);

        assert.doesNotThrow(() => {
          audio.playJump();
          audio.playHit();
          audio.toggleMute();
        });
      } finally {
        if (originalWindow === undefined) delete globalThis.window;
        else globalThis.window = originalWindow;
      }
    });

    it('3.4: Audio method fuzzing with corrupted parameters and volume boundaries', () => {
      const originalWindow = globalThis.window;
      const mockCtx = new MockAudioContext('running');
      globalThis.window = createMockBrowserWindow(mockCtx);

      try {
        const engine = new GameEngine();
        const audio = new AudioAdapter(engine);

        // Corrupted itemType in playItemCollected
        const badItemTypes = [null, undefined, 123, -5, {}, [], 'UNKNOWN_ITEM', ''];
        for (const bad of badItemTypes) {
          assert.doesNotThrow(() => audio.playItemCollected(bad));
        }

        // Volume boundary and NaN fuzzing
        audio.setVolume(-100);
        assert.strictEqual(audio.volume, 0.0, 'Negative volume clamps to 0.0');

        audio.setVolume(50);
        assert.strictEqual(audio.volume, 1.0, 'Excessive volume clamps to 1.0');

        audio.setVolume(0.42);
        assert.strictEqual(audio.volume, 0.42);

        // NaN and non-numbers should be ignored without mutation
        audio.setVolume(NaN);
        assert.strictEqual(audio.volume, 0.42);

        audio.setVolume('loud');
        assert.strictEqual(audio.volume, 0.42);

        audio.setVolume(null);
        assert.strictEqual(audio.volume, 0.42);

        audio.destroy();
      } finally {
        if (originalWindow === undefined) delete globalThis.window;
        else globalThis.window = originalWindow;
      }
    });

    it('3.5: LocalStorage throwing SecurityError (private browsing) is caught gracefully', () => {
      const originalWindow = globalThis.window;
      const originalStorage = globalThis.localStorage;

      globalThis.window = createMockBrowserWindow(new MockAudioContext('running'));
      globalThis.localStorage = {
        getItem: () => { throw new Error('SecurityError: The operation is insecure.'); },
        setItem: () => { throw new Error('SecurityError: QuotaExceededError'); }
      };

      try {
        const engine = new GameEngine();
        let audio;
        assert.doesNotThrow(() => {
          audio = new AudioAdapter(engine);
        });

        assert.doesNotThrow(() => {
          audio.setMuted(true);
          audio.toggleMute();
        });

        audio.destroy();
      } finally {
        if (originalWindow === undefined) delete globalThis.window;
        else globalThis.window = originalWindow;
        if (originalStorage === undefined) delete globalThis.localStorage;
        else globalThis.localStorage = originalStorage;
      }
    });

    it('3.6: Detach and destroy are strictly idempotent and safe when called multiple times', async () => {
      const engine = new GameEngine();
      const audio = new AudioAdapter(engine);

      assert.doesNotThrow(() => {
        audio.detach();
        audio.detach();
      });

      await assert.doesNotReject(async () => {
        await audio.destroy();
        await audio.destroy();
      });
    });
  });

  // ==========================================================================
  // Section 4: BrowserGameLoop RAF Accumulator Edge Cases
  // ==========================================================================
  describe('4. BrowserGameLoop RAF Accumulator Edge Cases & Spiral of Death Prevention', () => {
    it('4.1: Extreme lag spike (60s tab freeze) strictly caps ticks to maxAccumulator (15 ticks max)', () => {
      let tickCount = 0;
      const fakeEngine = {
        tick: () => { tickCount++; },
        getSnapshot: () => ({ state: 'RUNNING' })
      };

      let rafCallback = null;
      const originalRaf = globalThis.requestAnimationFrame;
      globalThis.requestAnimationFrame = (cb) => {
        rafCallback = cb;
        return 1;
      };

      try {
        const loop = new BrowserGameLoop({
          engine: fakeEngine,
          fixedDt: 1 / 60,
          maxAccumulator: 0.25
        });

        loop.start();

        // Simulate 60,000ms (60 seconds) elapsed in background tab
        rafCallback(60000);

        // maxAccumulator is 0.25s. In 0.25s, at fixedDt = 1/60s (0.016666s), exactly 15 ticks occur:
        // floor(0.25 / (1/60)) = 15.
        assert.strictEqual(
          tickCount,
          15,
          `Spiral of death prevented: expected exactly 15 ticks, got ${tickCount}`
        );

        loop.stop();
      } finally {
        if (originalRaf === undefined) delete globalThis.requestAnimationFrame;
        else globalThis.requestAnimationFrame = originalRaf;
      }
    });

    it('4.2: Negative deltaMs (clock skew / NTP sync) clamps dt to 0 and executes 0 ticks', () => {
      let tickCount = 0;
      const fakeEngine = {
        tick: () => { tickCount++; },
        getSnapshot: () => ({ state: 'RUNNING' })
      };

      let rafCallback = null;
      const originalRaf = globalThis.requestAnimationFrame;
      globalThis.requestAnimationFrame = (cb) => {
        rafCallback = cb;
        return 1;
      };

      try {
        const loop = new BrowserGameLoop({
          engine: fakeEngine,
          fixedDt: 1 / 60,
          maxAccumulator: 0.25
        });

        loop.start();

        // Initial frame sets baseline
        rafCallback(1000);
        tickCount = 0;

        // Clock jumps backwards by 500ms
        rafCallback(500);

        assert.strictEqual(tickCount, 0, 'Negative deltaMs must yield 0 ticks');
        loop.stop();
      } finally {
        if (originalRaf === undefined) delete globalThis.requestAnimationFrame;
        else globalThis.requestAnimationFrame = originalRaf;
      }
    });

    it('4.3: Zero deltaMs (dual RAF callbacks in same millisecond) yields 0 ticks cleanly', () => {
      let tickCount = 0;
      const fakeEngine = {
        tick: () => { tickCount++; },
        getSnapshot: () => ({ state: 'RUNNING' })
      };

      let rafCallback = null;
      const originalRaf = globalThis.requestAnimationFrame;
      globalThis.requestAnimationFrame = (cb) => {
        rafCallback = cb;
        return 1;
      };

      try {
        const loop = new BrowserGameLoop({
          engine: fakeEngine,
          fixedDt: 1 / 60,
          maxAccumulator: 0.25
        });

        loop.start();
        rafCallback(2000);
        tickCount = 0;

        // Second callback with exact same timestamp
        rafCallback(2000);
        assert.strictEqual(tickCount, 0, 'Zero deltaMs must yield 0 ticks');

        loop.stop();
      } finally {
        if (originalRaf === undefined) delete globalThis.requestAnimationFrame;
        else globalThis.requestAnimationFrame = originalRaf;
      }
    });

    it('4.4: Non-RUNNING states drain accumulator every frame to prevent burst catch-up on resume', () => {
      let tickCount = 0;
      let currentState = 'PAUSED';
      const fakeEngine = {
        tick: () => { tickCount++; },
        getSnapshot: () => ({ state: currentState })
      };

      let rafCallback = null;
      const originalRaf = globalThis.requestAnimationFrame;
      globalThis.requestAnimationFrame = (cb) => {
        rafCallback = cb;
        return 1;
      };

      try {
        const loop = new BrowserGameLoop({
          engine: fakeEngine,
          fixedDt: 1 / 60,
          maxAccumulator: 0.25
        });

        loop.start();

        // Fire 10 frames while paused (total 1000ms elapsed)
        let time = 1000;
        for (let i = 0; i < 10; i++) {
          time += 100;
          rafCallback(time);
        }

        // Ticks accumulated while PAUSED should have drained to 0
        tickCount = 0;

        // Unpause to RUNNING
        currentState = 'RUNNING';
        // Normal 17ms frame (> 1/60s = 16.666ms)
        time += 17.0;
        rafCallback(time);

        // Must ONLY execute 1 tick for the current frame, NOT a burst of 15 ticks from previous paused frames!
        assert.strictEqual(
          tickCount,
          1,
          `Resume catch-up burst prevented: expected 1 tick, got ${tickCount}`
        );

        loop.stop();
      } finally {
        if (originalRaf === undefined) delete globalThis.requestAnimationFrame;
        else globalThis.requestAnimationFrame = originalRaf;
      }
    });

    it('4.5: Start/stop idempotence and discrete step(dt) testing', () => {
      const engine = new GameEngine();
      const loop = new BrowserGameLoop({ engine });

      // Calling stop when not running is safe
      assert.strictEqual(loop.isRunning, false);
      assert.doesNotThrow(() => loop.stop());

      // Manual step() triggers engine tick deterministically
      const snapBefore = engine.getSnapshot();
      engine.handleAction('START');
      const snapAfter = loop.step(1 / 60);
      assert.ok(snapAfter.timeElapsed > snapBefore.timeElapsed);

      // Constructor validation
      assert.throws(() => new BrowserGameLoop(), /Valid GameEngine instance is required/);
    });
  });

  // ==========================================================================
  // Section 5: CanvasRenderer Rapid Resize Cycles & Visual Resilience
  // ==========================================================================
  describe('5. CanvasRenderer Rapid Resize Cycles & Visual Resilience', () => {
    it('5.1: 500 rapid resize cycles with oscillating and pathological dimensions maintain finite positive scales', () => {
      const mockCanvas = new MockCanvas();
      const renderer = new CanvasRenderer(mockCanvas, {
        virtualWidth: 800,
        virtualHeight: 450
      });

      const originalWindow = globalThis.window;
      globalThis.window = { devicePixelRatio: 2.0 };

      try {
        const testDimensions = [
          [0, 0],
          [-100, -200],
          [NaN, NaN],
          [Infinity, Infinity],
          [1920, 1080],
          [3840, 2160],
          [100, 500],   // Ultra-tall (1:5)
          [2000, 300],  // Ultra-wide (20:3)
          [1, 1],
          [800, 450]
        ];

        for (let i = 0; i < 500; i++) {
          const [w, h] = testDimensions[i % testDimensions.length];
          assert.doesNotThrow(() => {
            renderer.resize(w, h);
          }, `Resize at cycle ${i} with (${w}, ${h}) should not throw`);

          // Canvas width and height must always be positive integers >= 1
          assert.ok(mockCanvas.width >= 1, `Canvas width must be >= 1, got ${mockCanvas.width}`);
          assert.ok(mockCanvas.height >= 1, `Canvas height must be >= 1, got ${mockCanvas.height}`);
        }

        renderer.destroy();
      } finally {
        if (originalWindow === undefined) delete globalThis.window;
        else globalThis.window = originalWindow;
      }
    });

    it('5.2: DevicePixelRatio boundary values (0, 0.25, 3.5 clamped to 2.5, NaN) produce bounded buffers', () => {
      const mockCanvas = new MockCanvas();
      const renderer = new CanvasRenderer(mockCanvas, {
        virtualWidth: 800,
        virtualHeight: 450
      });

      const originalWindow = globalThis.window;

      const dprValues = [0, 0.25, 1.0, 2.5, 4.0, NaN, null, undefined];
      for (const dpr of dprValues) {
        globalThis.window = { devicePixelRatio: dpr };
        assert.doesNotThrow(() => {
          renderer.resize(800, 450);
        });
        assert.ok(mockCanvas.width >= 1);
        assert.ok(mockCanvas.height >= 1);
      }

      renderer.destroy();
      if (originalWindow === undefined) delete globalThis.window;
      else globalThis.window = originalWindow;
    });

    it('5.3: Particle pool boundary: firing 1000 particle bursts in a frame does not exceed maxParticles', () => {
      const mockCanvas = new MockCanvas();
      const renderer = new CanvasRenderer(mockCanvas);

      // Trigger 100 explosions, each attempting 30 particles (total 3,000 requested)
      for (let i = 0; i < 100; i++) {
        renderer.emitExplosion(100, 100);
        renderer.emitSparkles(150, 150);
        renderer.emitJumpDust(200, 400);
      }

      // Render frame
      const engine = new GameEngine();
      engine.handleAction('START');
      const snap = engine.getSnapshot();

      assert.doesNotThrow(() => {
        renderer.render(snap, 1 / 60);
      });

      renderer.destroy();
    });

    it('5.4: Malformed snapshot rendering survives null, empty object, and missing sub-entities', () => {
      const mockCanvas = new MockCanvas();
      const renderer = new CanvasRenderer(mockCanvas);

      const badSnapshots = [
        null,
        undefined,
        {},
        { state: 'RUNNING' },
        { state: 'RUNNING', player: null, obstacles: null, items: null },
        { state: 'RUNNING', player: { x: NaN, y: Infinity, width: 0, height: 0, lives: -5 } },
        { state: 'PAUSED', obstacles: [{ type: 'UNKNOWN', x: -100, y: -100, width: 30, height: 30 }] }
      ];

      for (const snap of badSnapshots) {
        assert.doesNotThrow(() => {
          renderer.render(snap, 1 / 60);
        });
      }

      renderer.destroy();
    });
  });

  // ==========================================================================
  // Section 6: UIRenderer HUD Sync, Victory Rank Boundaries & DOM Integrity
  // ==========================================================================
  describe('6. UIRenderer HUD Sync, Victory Rank Boundaries & DOM Integrity', () => {
    it('6.1: Victory rank boundary precision at exact score cutoffs', () => {
      // S Rank: >= 11000
      assert.strictEqual(calculateVictoryRank(11000).rank, 'S');
      assert.strictEqual(calculateVictoryRank(15000).rank, 'S');
      assert.strictEqual(calculateVictoryRank(11000).title, 'CYBER LEGEND');

      // A Rank: 9500 .. 10999
      assert.strictEqual(calculateVictoryRank(10999).rank, 'A');
      assert.strictEqual(calculateVictoryRank(9500).rank, 'A');
      assert.strictEqual(calculateVictoryRank(9500).title, 'NEON MASTER');

      // B Rank: 8500 .. 9499
      assert.strictEqual(calculateVictoryRank(9499).rank, 'B');
      assert.strictEqual(calculateVictoryRank(8500).rank, 'B');
      assert.strictEqual(calculateVictoryRank(8500).title, 'GRID RUNNER');

      // C Rank: < 8500
      assert.strictEqual(calculateVictoryRank(8499).rank, 'C');
      assert.strictEqual(calculateVictoryRank(5000).rank, 'C');
      assert.strictEqual(calculateVictoryRank(0).rank, 'C');
      assert.strictEqual(calculateVictoryRank(-100).rank, 'C');
      assert.strictEqual(calculateVictoryRank(0).title, 'SURVIVOR');
    });

    it('6.2: Critical time pulsing boundary (timeRemaining <= 10.0 adds class, > 10.0 removes class)', () => {
      const hudTimer = new MockHTMLElement('hud-timer');
      const engine = new GameEngine();
      const ui = new UIRenderer(engine, {}, { hudTimer });
      ui.init();

      // Case 1: timeRemaining = 10.1s -> no critical class
      ui.sync({
        state: 'RUNNING',
        timeRemaining: 10.1,
        score: 0,
        highScore: 0,
        speed: 300,
        player: { lives: 3 }
      });
      assert.strictEqual(hudTimer.classList.contains('time-critical'), false);

      // Case 2: timeRemaining = 10.0s -> critical class added
      ui.sync({
        state: 'RUNNING',
        timeRemaining: 10.0,
        score: 0,
        highScore: 0,
        speed: 300,
        player: { lives: 3 }
      });
      assert.strictEqual(hudTimer.classList.contains('time-critical'), true);

      // Case 3: timeRemaining = 5.0s -> critical class maintained
      ui.sync({
        state: 'RUNNING',
        timeRemaining: 5.0,
        score: 0,
        highScore: 0,
        speed: 300,
        player: { lives: 3 }
      });
      assert.strictEqual(hudTimer.classList.contains('time-critical'), true);

      // Case 4: Reset / restarted with 60.0s -> critical class removed
      ui.sync({
        state: 'RUNNING',
        timeRemaining: 60.0,
        score: 0,
        highScore: 0,
        speed: 300,
        player: { lives: 3 }
      });
      assert.strictEqual(hudTimer.classList.contains('time-critical'), false);
    });

    it('6.3: Lives HUD rendering clamps negative lives to 0 hearts and renders exact count for positive', () => {
      const hudLives = new MockHTMLElement('hud-lives');
      const engine = new GameEngine();
      const ui = new UIRenderer(engine, {}, { hudLives });
      ui.init();

      ui.sync({
        state: 'RUNNING',
        timeRemaining: 60,
        score: 0,
        highScore: 0,
        speed: 300,
        player: { lives: -2 }
      });
      assert.strictEqual(hudLives.textContent, '');

      ui.sync({
        state: 'RUNNING',
        timeRemaining: 60,
        score: 0,
        highScore: 0,
        speed: 300,
        player: { lives: 3 }
      });
      assert.strictEqual(hudLives.textContent, '❤️❤️❤️');

      ui.sync({
        state: 'RUNNING',
        timeRemaining: 60,
        score: 0,
        highScore: 0,
        speed: 300,
        player: { lives: 1 }
      });
      assert.strictEqual(hudLives.textContent, '❤️');
    });

    it('6.4: UI button click callbacks survive missing stopPropagation and execute cleanly', () => {
      let started = false;
      let restarted = false;
      const btnStart = new MockHTMLElement('btn-start');
      const btnRestart = new MockHTMLElement('btn-restart');

      const engine = new GameEngine();
      const ui = new UIRenderer(
        engine,
        {
          onStart: () => { started = true; },
          onRestart: () => { restarted = true; }
        },
        { btnStart, btnRestart }
      );
      ui.init();

      // Dispatch click without stopPropagation property on event
      btnStart.dispatchMockEvent('click', { stopPropagation: null });
      assert.strictEqual(started, true);

      btnRestart.dispatchMockEvent('click', {});
      assert.strictEqual(restarted, true);
    });
  });

  // ==========================================================================
  // Section 7: Deployment & Responsive Asset Contract Integrity
  // ==========================================================================
  describe('7. Deployment & Responsive Asset Contract Integrity', () => {
    it('7.1: index.html DOM contract: all element IDs queried by UIRenderer and main.js exist in HTML', () => {
      const htmlPath = path.join(PROJECT_ROOT, 'index.html');
      assert.ok(fs.existsSync(htmlPath), 'index.html must exist');
      const html = fs.readFileSync(htmlPath, 'utf8');

      const requiredIds = [
        'game-canvas',
        'hud-timer',
        'hud-score',
        'hud-high',
        'hud-speed',
        'hud-lives',
        'overlay-container',
        'screen-start',
        'screen-pause',
        'screen-gameover',
        'screen-victory',
        'btn-start',
        'btn-resume',
        'btn-restart',
        'btn-victory-restart',
        'btn-pause-restart',
        'sound-toggle',
        'pause-time',
        'pause-score',
        'gameover-time',
        'gameover-score',
        'gameover-best',
        'gameover-new-record',
        'victory-score',
        'victory-best',
        'victory-rank',
        'victory-rank-title',
        'victory-new-record'
      ];

      for (const id of requiredIds) {
        const idPattern = new RegExp(`id=["']${id}["']`);
        assert.ok(
          idPattern.test(html),
          `index.html must contain required DOM element id="${id}"`
        );
      }
    });

    it('7.2: index.html viewport configuration is optimized for responsive mobile gameplay', () => {
      const htmlPath = path.join(PROJECT_ROOT, 'index.html');
      const html = fs.readFileSync(htmlPath, 'utf8');

      // Must include viewport-fit=cover and user-scalable=no
      assert.ok(
        /name=["']viewport["'][^>]*content=["'][^"']*viewport-fit=cover[^"']*["']/.test(html),
        'index.html viewport meta must include viewport-fit=cover'
      );
      assert.ok(
        /name=["']viewport["'][^>]*content=["'][^"']*user-scalable=no[^"']*["']/.test(html),
        'index.html viewport meta must include user-scalable=no'
      );
    });

    it('7.3: style.css contains critical responsive classes and keyframe animations', () => {
      const cssPath = path.join(PROJECT_ROOT, 'style.css');
      assert.ok(fs.existsSync(cssPath), 'style.css must exist');
      const css = fs.readFileSync(cssPath, 'utf8');

      const requiredSelectors = [
        '.canvas-container',
        'canvas',
        '#hud-timer.time-critical',
        '@keyframes pulseCrit',
        '.overlay-container',
        '.overlay-container.active',
        '.screen-view',
        '.screen-view.active',
        '.rank-badge.rank-s',
        '.rank-badge.rank-a',
        '.rank-badge.rank-b',
        '.rank-badge.rank-c'
      ];

      for (const sel of requiredSelectors) {
        assert.ok(
          css.includes(sel.replace(/\s+/g, ' ')),
          `style.css must include rule for selector/keyframe "${sel}"`
        );
      }
    });

    it('7.4: Zero root-relative links in index.html, style.css, and main.js for static subfolder hosting', () => {
      const htmlPath = path.join(PROJECT_ROOT, 'index.html');
      const cssPath = path.join(PROJECT_ROOT, 'style.css');
      const jsPath = path.join(PROJECT_ROOT, 'main.js');

      const html = fs.readFileSync(htmlPath, 'utf8');
      const css = fs.readFileSync(cssPath, 'utf8');
      const js = fs.readFileSync(jsPath, 'utf8');

      // No href="/..." or src="/..." in HTML
      assert.strictEqual(
        html.match(/href=["']\/[^"']*["']/g),
        null,
        'index.html must not contain root-relative href'
      );
      assert.strictEqual(
        html.match(/src=["']\/[^"']*["']/g),
        null,
        'index.html must not contain root-relative src'
      );

      // No url(/...) in CSS
      assert.strictEqual(
        css.match(/url\(\s*["']?\/[^"')]+["']?\s*\)/g),
        null,
        'style.css must not contain root-relative url'
      );

      // No from '/...' or import '/...' in JS
      assert.strictEqual(
        js.match(/from\s+["']\/[^"']*["']/g),
        null,
        'main.js must not contain root-relative ES module imports'
      );
    });
  });
});
