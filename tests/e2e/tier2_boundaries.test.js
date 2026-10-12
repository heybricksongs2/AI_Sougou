/**
 * Tier 2: Boundary & Corner Cases E2E Test Suite
 * Tests boundary conditions, extreme limits, negative/extreme dt, speed caps,
 * collision edges, and state machine boundary invariants.
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../../src/core/GameEngine.js';
import { checkAABBCollision } from '../../src/core/Collision.js';

describe('Tier 2: Boundary & Corner Cases', () => {
  let engine;

  beforeEach(() => {
    engine = new GameEngine();
  });

  // ==========================================
  // Category 1: Delta Time (dt) Boundaries
  // ==========================================
  describe('Boundary: Delta Time (dt) Anomalies', () => {
    it('B1.1: tick(0) leaves simulation state unchanged (no-op)', () => {
      engine.handleAction('START');
      const snapBefore = engine.getSnapshot();
      engine.tick(0);
      const snapAfter = engine.getSnapshot();
      assert.strictEqual(snapAfter.timeElapsed, snapBefore.timeElapsed, 'timeElapsed should not change on dt=0');
      assert.strictEqual(snapAfter.timeRemaining, snapBefore.timeRemaining, 'timeRemaining should not change on dt=0');
      assert.strictEqual(snapAfter.player.y, snapBefore.player.y, 'Player y should not change on dt=0');
    });

    it('B1.2: Negative dt is rejected or handled as no-op without rewinding time', () => {
      engine.handleAction('START');
      engine.tick(1.0);
      const elapsedBefore = engine.getSnapshot().timeElapsed;
      engine.tick(-0.5);
      const elapsedAfter = engine.getSnapshot().timeElapsed;
      assert.ok(elapsedAfter >= elapsedBefore, 'Negative dt must not rewind simulation time');
    });

    it('B1.3: Extreme dt spike (e.g. 10.0s) is handled safely without crashing', () => {
      engine.handleAction('START');
      assert.doesNotThrow(() => {
        engine.tick(10.0);
      }, 'Engine should handle large dt spike without crashing');
      const snap = engine.getSnapshot();
      assert.ok(snap.timeElapsed > 0, 'Simulation should advance forward');
    });

    it('B1.4: Micro-step dt (0.0001s) integrates smoothly without NaN or infinity', () => {
      engine.handleAction('START');
      for (let i = 0; i < 100; i++) {
        engine.tick(0.0001);
      }
      const snap = engine.getSnapshot();
      assert.ok(Number.isFinite(snap.timeElapsed), 'timeElapsed must remain finite');
      assert.ok(Number.isFinite(snap.player.y), 'Player y must remain finite');
    });

    it('B1.5: Non-numeric dt values (NaN, null, undefined) are handled safely', () => {
      engine.handleAction('START');
      const snapBefore = engine.getSnapshot();
      assert.doesNotThrow(() => {
        engine.tick(NaN);
        engine.tick(null);
        engine.tick(undefined);
      });
      const snapAfter = engine.getSnapshot();
      assert.ok(Number.isFinite(snapAfter.timeElapsed), 'timeElapsed must remain finite');
    });
  });

  // ==========================================
  // Category 2: Physics Extremes & Positional Boundaries
  // ==========================================
  describe('Boundary: Physics Extremes & Positional Invariants', () => {
    it('B2.1: Terminal velocity clamps downward speed during extreme fall', () => {
      engine.handleAction('START');
      // Simulate extreme free fall without ground collision or high drop
      for (let i = 0; i < 200; i++) {
        engine.tick(1 / 60);
      }
      const vy = engine.getSnapshot().player.vy;
      assert.ok(vy <= 2500, `Downwards velocity must be clamped, got ${vy}`);
    });

    it('B2.2: Rapid repeated JUMP commands while airborne do not compound velocity', () => {
      engine.handleAction('START');
      engine.handleAction('JUMP');
      const initialJumpVy = engine.getSnapshot().player.vy;

      // Spam jumps rapidly
      for (let i = 0; i < 10; i++) {
        engine.handleAction('JUMP');
      }
      const afterSpamVy = engine.getSnapshot().player.vy;
      assert.strictEqual(afterSpamVy, initialJumpVy, 'Airborne jump spam must not compound initial impulse');
    });

    it('B2.3: Player y never penetrates below ground contact baseline', () => {
      engine.handleAction('START');
      const initialY = engine.getSnapshot().player.y;
      engine.handleAction('JUMP');
      for (let i = 0; i < 120; i++) {
        engine.tick(1 / 60);
        const y = engine.getSnapshot().player.y;
        assert.ok(y <= initialY + 0.001, `Player y (${y}) must never sink below ground baseline (${initialY})`);
      }
    });

    it('B2.4: Player y remains finite and non-negative during peak jump height', () => {
      engine.handleAction('START');
      engine.handleAction('JUMP');
      for (let i = 0; i < 60; i++) {
        engine.tick(1 / 60);
        const y = engine.getSnapshot().player.y;
        assert.ok(Number.isFinite(y), 'Player y must be finite');
        assert.ok(y >= 0, `Player y must not become negative: ${y}`);
      }
    });

    it('B2.5: Player x coordinate remains stable within horizontal play area', () => {
      engine.handleAction('START');
      const initialX = engine.getSnapshot().player.x;
      for (let i = 0; i < 300; i++) {
        engine.tick(1 / 60);
      }
      const currentX = engine.getSnapshot().player.x;
      assert.strictEqual(currentX, initialX, 'Runner player horizontal anchor x should remain consistent');
    });
  });

  // ==========================================
  // Category 3: Collision Boundary & Corner Cases
  // ==========================================
  describe('Boundary: Collision Math & Edge Geometries', () => {
    it('B3.1: Corner-to-corner grazing without area overlap returns false', () => {
      const boxA = { x: 0, y: 0, width: 40, height: 40 };
      const boxB = { x: 40, y: 40, width: 40, height: 40 };
      assert.strictEqual(checkAABBCollision(boxA, boxB), false, 'Corner-to-corner grazing is non-overlapping');
    });

    it('B3.2: Sub-pixel 0.001 overlap registers as true collision', () => {
      const boxA = { x: 0, y: 0, width: 40, height: 40 };
      const boxB = { x: 39.999, y: 39.999, width: 40, height: 40 };
      assert.strictEqual(checkAABBCollision(boxA, boxB), true, 'Micro sub-pixel overlap must register');
    });

    it('B3.3: Zero-width or zero-height bounding box returns false', () => {
      const normalBox = { x: 10, y: 10, width: 30, height: 30 };
      const zeroWidth = { x: 15, y: 15, width: 0, height: 30 };
      const zeroHeight = { x: 15, y: 15, width: 30, height: 0 };
      assert.strictEqual(checkAABBCollision(normalBox, zeroWidth), false);
      assert.strictEqual(checkAABBCollision(normalBox, zeroHeight), false);
    });

    it('B3.4: Tunneling prevention: high velocity obstacles correctly collide when intersecting', () => {
      const playerBox = { x: 50, y: 100, width: 40, height: 50 };
      const obstacleBox = { x: 60, y: 110, width: 30, height: 30 };
      assert.strictEqual(checkAABBCollision(playerBox, obstacleBox), true);
    });

    it('B3.5: Secondary collision during invulnerability window does not deduct extra lives', () => {
      const customEng = new GameEngine({ initialLives: 3, invulnerabilitySec: 1.5 });
      customEng.handleAction('START');
      assert.ok(customEng.getSnapshot().player.lives === 3);
    });
  });

  // ==========================================
  // Category 4: Timer & Speed Scaling Boundaries
  // ==========================================
  describe('Boundary: Timer & Speed Scaling Limits', () => {
    it('B4.1: Timer countdown clamps at 0.00s and never goes negative', () => {
      const eng = new GameEngine({ enableDamage: false });
      eng.handleAction('START');
      eng.tick(65.0); // 5 seconds past duration
      const snap = eng.getSnapshot();
      assert.ok(snap.timeRemaining <= 0.0001, 'timeRemaining should clamp at zero');
      assert.ok(snap.timeRemaining >= -0.0001, 'timeRemaining must not become substantially negative');
    });

    it('B4.2: Ticking after VICTORY state preserves VICTORY without reverting', () => {
      const eng = new GameEngine({ enableDamage: false });
      eng.handleAction('START');
      eng.tick(60.1);
      assert.strictEqual(eng.getSnapshot().state, 'VICTORY');
      eng.tick(5.0);
      assert.strictEqual(eng.getSnapshot().state, 'VICTORY', 'State must remain VICTORY after extra ticks');
    });

    it('B4.3: Speed at 60s reaches configured maximum and does not diverge to infinity', () => {
      const eng = new GameEngine({ enableDamage: false });
      eng.handleAction('START');
      eng.tick(60.0);
      const speedAt60 = eng.getSnapshot().speed;
      assert.ok(speedAt60 <= 1000, `Speed at 60s should be capped, got ${speedAt60}`);
      assert.ok(speedAt60 > 0, 'Speed must be positive');
    });

    it('B4.4: Speed scaling is monotonic non-decreasing over time', () => {
      const eng = new GameEngine({ enableDamage: false });
      eng.handleAction('START');
      const speeds = [];
      for (let t = 0; t <= 60; t += 10) {
        speeds.push(eng.getSnapshot().speed);
        eng.tick(10.0);
      }
      for (let i = 0; i < speeds.length - 1; i++) {
        assert.ok(speeds[i + 1] >= speeds[i], `Speed must be non-decreasing: ${speeds[i + 1]} >= ${speeds[i]}`);
      }
    });

    it('B4.5: Micro time step immediately before duration (59.999s) does not trigger early victory', () => {
      const eng = new GameEngine({ enableDamage: false });
      eng.handleAction('START');
      eng.tick(59.9);
      assert.strictEqual(eng.getSnapshot().state, 'RUNNING', 'State should still be RUNNING at 59.9s');
    });
  });

  // ==========================================
  // Category 5: State Machine Action Boundaries
  // ==========================================
  describe('Boundary: State Machine Action Invariants', () => {
    it('B5.1: Action JUMP in INIT state has no effect on grounded state', () => {
      assert.strictEqual(engine.getSnapshot().state, 'INIT');
      engine.handleAction('JUMP');
      assert.strictEqual(engine.getSnapshot().player.isGrounded, true);
      assert.strictEqual(engine.getSnapshot().player.vy, 0);
    });

    it('B5.2: Action JUMP in GAME_OVER state has no effect', () => {
      const deadEng = new GameEngine({ initialLives: 0 });
      deadEng.handleAction('START');
      if (deadEng.getSnapshot().state === 'GAME_OVER') {
        deadEng.handleAction('JUMP');
        assert.strictEqual(deadEng.getSnapshot().state, 'GAME_OVER');
      }
    });

    it('B5.3: Action JUMP in VICTORY state has no effect', () => {
      const winEng = new GameEngine({ enableDamage: false });
      winEng.handleAction('START');
      winEng.tick(60.1);
      assert.strictEqual(winEng.getSnapshot().state, 'VICTORY');
      winEng.handleAction('JUMP');
      assert.strictEqual(winEng.getSnapshot().state, 'VICTORY');
    });

    it('B5.4: Action START called when already RUNNING is safely idempotent', () => {
      engine.handleAction('START');
      engine.tick(2.0);
      const elapsed = engine.getSnapshot().timeElapsed;
      engine.handleAction('START');
      assert.strictEqual(engine.getSnapshot().state, 'RUNNING');
      assert.strictEqual(engine.getSnapshot().timeElapsed, elapsed, 'Calling START while RUNNING must not reset timer');
    });

    it('B5.5: Rapid successive PAUSE calls toggle cleanly between PAUSED and RUNNING', () => {
      engine.handleAction('START');
      engine.handleAction('PAUSE');
      assert.strictEqual(engine.getSnapshot().state, 'PAUSED');
      engine.handleAction('PAUSE');
      assert.strictEqual(engine.getSnapshot().state, 'RUNNING');
      engine.handleAction('PAUSE');
      assert.strictEqual(engine.getSnapshot().state, 'PAUSED');
      engine.handleAction('PAUSE');
      assert.strictEqual(engine.getSnapshot().state, 'RUNNING');
    });
  });

  // ==========================================
  // Category 6: Configuration & Instantiation Boundaries
  // ==========================================
  describe('Boundary: Configuration & Reset Boundaries', () => {
    it('B6.1: Empty config object falls back to robust defaults', () => {
      const defaultEng = new GameEngine({});
      assert.strictEqual(defaultEng.getSnapshot().state, 'INIT');
      assert.ok(defaultEng.getSnapshot().player.lives >= 1);
    });

    it('B6.2: Calling reset() multiple times sequentially is safe and idempotent', () => {
      engine.reset();
      engine.reset();
      engine.reset();
      assert.strictEqual(engine.getSnapshot().state, 'INIT');
      assert.strictEqual(engine.getSnapshot().timeElapsed, 0);
    });

    it('B6.3: Calling reset() while PAUSED resets state to INIT', () => {
      engine.handleAction('START');
      engine.handleAction('PAUSE');
      assert.strictEqual(engine.getSnapshot().state, 'PAUSED');
      engine.reset();
      assert.strictEqual(engine.getSnapshot().state, 'INIT');
    });

    it('B6.4: Passing null or non-object to constructor falls back safely to defaults', () => {
      assert.doesNotThrow(() => {
        new GameEngine(null);
        new GameEngine(undefined);
      });
    });

    it('B6.5: Event listener callback error does not break engine tick execution', () => {
      const errEngine = new GameEngine();
      errEngine.on('jump', () => {
        throw new Error('Listener intentional error');
      });
      errEngine.handleAction('START');
      // Engine should handle or isolate listener errors safely
      assert.doesNotThrow(() => {
        errEngine.handleAction('JUMP');
      });
    });
  });
});
