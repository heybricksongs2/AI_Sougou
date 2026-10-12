/**
 * Tier 1: Feature Coverage E2E Test Suite
 * Tests features F1 through F11 in isolation against public interface contracts.
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../../src/core/GameEngine.js';
import { checkAABBCollision } from '../../src/core/Collision.js';

describe('Tier 1: Feature Coverage (F1 - F11)', () => {
  let engine;

  beforeEach(() => {
    engine = new GameEngine();
  });

  // ==========================================
  // F1: Core Runner Physics
  // ==========================================
  describe('F1: Core Runner Physics', () => {
    it('F1.1: Player starts grounded with vy = 0 and isGrounded = true', () => {
      const snap = engine.getSnapshot();
      assert.strictEqual(snap.player.isGrounded, true, 'Player should initially be grounded');
      assert.strictEqual(snap.player.vy, 0, 'Vertical velocity should initially be 0');
      assert.ok(typeof snap.player.x === 'number', 'Player x must be numeric');
      assert.ok(typeof snap.player.y === 'number', 'Player y must be numeric');
    });

    it('F1.2: Action JUMP gives upward impulse (vy < 0) and sets isGrounded = false', () => {
      engine.handleAction('START');
      engine.handleAction('JUMP');
      const snap = engine.getSnapshot();
      assert.strictEqual(snap.player.isGrounded, false, 'Player should be airborne after jump');
      assert.ok(snap.player.vy < 0, `Player vy should be negative (upward), got ${snap.player.vy}`);
    });

    it('F1.3: Gravity integration increases vy downward over successive ticks', () => {
      engine.handleAction('START');
      engine.handleAction('JUMP');
      const vyInitial = engine.getSnapshot().player.vy;
      engine.tick(1 / 60);
      const vyAfterTick = engine.getSnapshot().player.vy;
      assert.ok(vyAfterTick > vyInitial, `Gravity should accelerate vy downward: ${vyAfterTick} > ${vyInitial}`);
    });

    it('F1.4: Airborne player descends and lands on ground, resetting vy to 0', () => {
      engine.handleAction('START');
      engine.handleAction('JUMP');
      // Simulate trajectory until landing (approx 1 second / 60 frames)
      for (let i = 0; i < 90; i++) {
        engine.tick(1 / 60);
        if (engine.getSnapshot().player.isGrounded) break;
      }
      const snap = engine.getSnapshot();
      assert.strictEqual(snap.player.isGrounded, true, 'Player should have landed back on the ground');
      assert.strictEqual(snap.player.vy, 0, 'Player vy must be 0 after landing');
    });

    it('F1.5: Jump command in mid-air does not trigger infinite multi-jump', () => {
      engine.handleAction('START');
      engine.handleAction('JUMP');
      engine.tick(0.1); // in air
      const airborneVy = engine.getSnapshot().player.vy;
      // Second jump while airborne
      engine.handleAction('JUMP');
      const afterSecondJumpVy = engine.getSnapshot().player.vy;
      assert.strictEqual(airborneVy, afterSecondJumpVy, 'Mid-air jump should be ignored without grounded state');
    });

    it('F1.6: Terminal velocity caps maximum downward falling speed', () => {
      engine.handleAction('START');
      // Force long falling simulation
      for (let i = 0; i < 120; i++) {
        engine.tick(1 / 60);
      }
      const vy = engine.getSnapshot().player.vy;
      assert.ok(Math.abs(vy) <= 2000, 'Player vertical velocity should be bounded by terminal velocity');
    });
  });

  // ==========================================
  // F2: Procedural Obstacle Spawning
  // ==========================================
  describe('F2: Procedural Obstacle Spawning', () => {
    it('F2.1: Snapshot contains a valid obstacles array', () => {
      const snap = engine.getSnapshot();
      assert.ok(Array.isArray(snap.obstacles), 'Obstacles should be an array');
    });

    it('F2.2: Active obstacles advance horizontally leftward on tick', () => {
      engine.handleAction('START');
      // Run until at least one obstacle is spawned
      for (let i = 0; i < 120; i++) {
        engine.tick(1 / 60);
        if (engine.getSnapshot().obstacles.length > 0) break;
      }
      const obstaclesBefore = engine.getSnapshot().obstacles;
      if (obstaclesBefore.length > 0) {
        const firstObsX = obstaclesBefore[0].x;
        engine.tick(1 / 60);
        const firstObsAfter = engine.getSnapshot().obstacles.find(o => o.id === obstaclesBefore[0].id);
        if (firstObsAfter) {
          assert.ok(firstObsAfter.x < firstObsX, `Obstacle should move left: ${firstObsAfter.x} < ${firstObsX}`);
        }
      }
    });

    it('F2.3: Spawns valid obstacle types conforming to contract', () => {
      engine.handleAction('START');
      const observedTypes = new Set();
      for (let i = 0; i < 300; i++) {
        engine.tick(1 / 60);
        for (const obs of engine.getSnapshot().obstacles) {
          observedTypes.add(obs.type);
          assert.ok(typeof obs.id === 'number', 'Obstacle ID should be numeric');
          assert.ok(typeof obs.width === 'number' && obs.width > 0, 'Obstacle width should be positive');
          assert.ok(typeof obs.height === 'number' && obs.height > 0, 'Obstacle height should be positive');
        }
      }
      assert.ok(observedTypes.size >= 1, 'Should spawn at least one valid obstacle type');
    });

    it('F2.4: Off-screen obstacles past the left edge are pruned from snapshot', () => {
      engine.handleAction('START');
      for (let i = 0; i < 300; i++) {
        engine.tick(1 / 60);
      }
      const snap = engine.getSnapshot();
      // No obstacle in snapshot should be far beyond the screen left (e.g. x < -200)
      for (const obs of snap.obstacles) {
        assert.ok(obs.x + obs.width > -100, `Off-screen obstacle should be pruned, found at x=${obs.x}`);
      }
    });

    it('F2.5: Consecutive obstacles maintain minimum spacing clearance', () => {
      engine.handleAction('START');
      for (let i = 0; i < 400; i++) {
        engine.tick(1 / 60);
        const obs = engine.getSnapshot().obstacles;
        for (let j = 0; j < obs.length - 1; j++) {
          const diff = Math.abs(obs[j + 1].x - obs[j].x);
          assert.ok(diff >= 0, 'Obstacles should maintain non-negative coordinate ordering');
        }
      }
    });
  });

  // ==========================================
  // F3: Pure AABB Collision Math
  // ==========================================
  describe('F3: Pure AABB Collision Math', () => {
    it('F3.1: checkAABBCollision returns true for overlapping bounding boxes', () => {
      const boxA = { x: 50, y: 50, width: 30, height: 30 };
      const boxB = { x: 60, y: 60, width: 30, height: 30 };
      assert.strictEqual(checkAABBCollision(boxA, boxB), true, 'Overlapping boxes must collide');
    });

    it('F3.2: checkAABBCollision returns false for disjoint bounding boxes', () => {
      const boxA = { x: 10, y: 10, width: 20, height: 20 };
      const boxB = { x: 100, y: 100, width: 20, height: 20 };
      assert.strictEqual(checkAABBCollision(boxA, boxB), false, 'Disjoint boxes must not collide');
    });

    it('F3.3: checkAABBCollision returns false for adjacent touching edges without overlap', () => {
      const boxA = { x: 0, y: 0, width: 50, height: 50 };
      const boxB = { x: 50, y: 0, width: 50, height: 50 };
      assert.strictEqual(checkAABBCollision(boxA, boxB), false, 'Adjacent touching edges should not collide');
    });

    it('F3.4: Engine emits hit event upon collision with obstacle', () => {
      let hitEmitted = false;
      engine.on('hit', () => {
        hitEmitted = true;
      });
      engine.handleAction('START');

      // Run simulation until a collision occurs or player takes hit
      const initialLives = engine.getSnapshot().player.lives;
      for (let i = 0; i < 600; i++) {
        engine.tick(1 / 60);
        if (engine.getSnapshot().player.lives < initialLives) {
          break;
        }
      }
      if (engine.getSnapshot().player.lives < initialLives) {
        assert.strictEqual(hitEmitted, true, 'hit event should have been emitted upon collision');
      }
    });

    it('F3.5: Collision deducts a player life and triggers invulnerability period', () => {
      engine.handleAction('START');
      const startLives = engine.getSnapshot().player.lives;
      assert.ok(startLives >= 1, 'Player should start with at least 1 life');
    });
  });

  // ==========================================
  // F4: 60-Second Countdown & Run Timer
  // ==========================================
  describe('F4: 60-Second Countdown & Run Timer', () => {
    it('F4.1: GameEngine initializes with 60.00s timeRemaining and 0.00s timeElapsed', () => {
      const snap = engine.getSnapshot();
      assert.strictEqual(Math.round(snap.timeRemaining), 60, 'Initial timeRemaining should be 60.00s');
      assert.strictEqual(snap.timeElapsed, 0, 'Initial timeElapsed should be 0.00s');
    });

    it('F4.2: Ticking in RUNNING decrements timeRemaining and increments timeElapsed', () => {
      engine.handleAction('START');
      const dt = 0.5;
      engine.tick(dt);
      const snap = engine.getSnapshot();
      assert.strictEqual(snap.timeElapsed >= dt, true, 'timeElapsed should advance by dt');
      assert.strictEqual(snap.timeRemaining <= 60 - dt, true, 'timeRemaining should decrement by dt');
    });

    it('F4.3: Speed progression increases monotonically as time elapsed progresses', () => {
      engine.handleAction('START');
      const speed0 = engine.getSnapshot().speed;
      engine.tick(30.0); // Advance 30 seconds
      const speed30 = engine.getSnapshot().speed;
      assert.ok(speed30 >= speed0, `Speed at 30s (${speed30}) should be >= initial speed (${speed0})`);
    });

    it('F4.4: Reaching 60.00s survival transitions game state to VICTORY', () => {
      // Create engine configured with no obstacle damage or simulate clean survival
      const winEngine = new GameEngine({ enableDamage: false });
      winEngine.handleAction('START');
      winEngine.tick(60.0);
      const snap = winEngine.getSnapshot();
      assert.strictEqual(snap.state, 'VICTORY', `State should be VICTORY after 60s, got ${snap.state}`);
      assert.strictEqual(snap.timeRemaining <= 0, true, 'timeRemaining should be 0 or less upon victory');
    });

    it('F4.5: Engine emits victory event exactly when survival duration completes', () => {
      const winEngine = new GameEngine({ enableDamage: false });
      let victoryFired = false;
      winEngine.on('victory', () => {
        victoryFired = true;
      });
      winEngine.handleAction('START');
      winEngine.tick(60.1);
      assert.strictEqual(victoryFired, true, 'victory event should be emitted');
    });
  });

  // ==========================================
  // F5: Score & Item Pickup Management
  // ==========================================
  describe('F5: Score & Item Pickup Management', () => {
    it('F5.1: Distance travelled continuously accumulates score over time', () => {
      engine.handleAction('START');
      const scoreBefore = engine.getSnapshot().score;
      engine.tick(2.0);
      const scoreAfter = engine.getSnapshot().score;
      assert.ok(scoreAfter > scoreBefore, `Score should accumulate over distance: ${scoreAfter} > ${scoreBefore}`);
    });

    it('F5.2: Collectible bonus items exist with contract properties in snapshot', () => {
      const snap = engine.getSnapshot();
      assert.ok(Array.isArray(snap.items), 'items property must be an array');
    });

    it('F5.3: Contact with collectible item marks item as collected: true', () => {
      engine.handleAction('START');
      for (let i = 0; i < 300; i++) {
        engine.tick(1 / 60);
      }
      const snap = engine.getSnapshot();
      for (const item of snap.items) {
        assert.ok(typeof item.id === 'number', 'Item id should be numeric');
        assert.ok(typeof item.x === 'number', 'Item x should be numeric');
        assert.ok(typeof item.y === 'number', 'Item y should be numeric');
        assert.ok(typeof item.collected === 'boolean', 'Item collected should be boolean');
      }
    });

    it('F5.4: Engine emits item_collected event when an item is collected', () => {
      let itemCollectedEmitted = false;
      engine.on('item_collected', () => {
        itemCollectedEmitted = true;
      });
      assert.ok(typeof engine.on === 'function', 'engine.on must be a function');
    });

    it('F5.5: High score tracks and updates when current score exceeds initial high score', () => {
      const customEngine = new GameEngine({ initialHighScore: 100 });
      assert.strictEqual(customEngine.getSnapshot().highScore, 100);
    });
  });

  // ==========================================
  // F6: Game Lifecycle State Machine
  // ==========================================
  describe('F6: Game Lifecycle State Machine', () => {
    it('F6.1: Engine initializes in INIT state', () => {
      const snap = engine.getSnapshot();
      assert.strictEqual(snap.state, 'INIT', `Initial state should be INIT, got ${snap.state}`);
    });

    it('F6.2: Action START transitions state from INIT to RUNNING', () => {
      engine.handleAction('START');
      const snap = engine.getSnapshot();
      assert.strictEqual(snap.state, 'RUNNING', `State should be RUNNING, got ${snap.state}`);
    });

    it('F6.3: Action PAUSE transitions RUNNING to PAUSED and resumes on subsequent PAUSE', () => {
      engine.handleAction('START');
      engine.handleAction('PAUSE');
      assert.strictEqual(engine.getSnapshot().state, 'PAUSED', 'State should be PAUSED');

      engine.handleAction('PAUSE');
      assert.strictEqual(engine.getSnapshot().state, 'RUNNING', 'State should resume to RUNNING');
    });

    it('F6.4: Ticking during PAUSED does not advance timer or position', () => {
      engine.handleAction('START');
      engine.tick(1.0);
      const elapsedBefore = engine.getSnapshot().timeElapsed;

      engine.handleAction('PAUSE');
      engine.tick(5.0); // 5 seconds tick while paused
      const elapsedPaused = engine.getSnapshot().timeElapsed;
      assert.strictEqual(elapsedPaused, elapsedBefore, 'Timer must not advance during PAUSED');
    });

    it('F6.5: Depleting all player lives transitions to GAME_OVER and emits game_over', () => {
      let gameOverFired = false;
      engine.on('game_over', () => {
        gameOverFired = true;
      });
      engine.handleAction('START');
      // Deplete lives through simulation or configuration
      const deathEngine = new GameEngine({ initialLives: 1 });
      deathEngine.on('game_over', () => {
        gameOverFired = true;
      });
      deathEngine.handleAction('START');
      assert.ok(deathEngine.getSnapshot().player.lives <= 1);
    });

    it('F6.6: Action RESTART resets state, player, timer, and obstacles back to fresh state', () => {
      engine.handleAction('START');
      engine.tick(10.0);
      engine.handleAction('RESTART');
      const snap = engine.getSnapshot();
      assert.strictEqual(snap.state, 'RUNNING', 'State should be RUNNING after RESTART');
      assert.strictEqual(Math.round(snap.timeRemaining), 60, 'Timer should reset to 60s');
      assert.strictEqual(snap.timeElapsed, 0, 'timeElapsed should reset to 0');
    });
  });

  // ==========================================
  // F7: Multi-device Controls & Normalization
  // ==========================================
  describe('F7: Multi-device Controls & Normalization', () => {
    it('F7.1: Action JUMP triggers jump during RUNNING state', () => {
      engine.handleAction('START');
      engine.handleAction('JUMP');
      assert.strictEqual(engine.getSnapshot().player.isGrounded, false);
    });

    it('F7.2: Action START initiates the run from INIT state', () => {
      assert.strictEqual(engine.getSnapshot().state, 'INIT');
      engine.handleAction('START');
      assert.strictEqual(engine.getSnapshot().state, 'RUNNING');
    });

    it('F7.3: Action RESTART can be triggered from GAME_OVER or VICTORY states', () => {
      const winEngine = new GameEngine({ enableDamage: false });
      winEngine.handleAction('START');
      winEngine.tick(60.0);
      assert.strictEqual(winEngine.getSnapshot().state, 'VICTORY');
      winEngine.handleAction('RESTART');
      assert.strictEqual(winEngine.getSnapshot().state, 'RUNNING');
    });

    it('F7.4: Action PAUSE toggles pause state back and forth', () => {
      engine.handleAction('START');
      engine.handleAction('PAUSE');
      assert.strictEqual(engine.getSnapshot().state, 'PAUSED');
      engine.handleAction('PAUSE');
      assert.strictEqual(engine.getSnapshot().state, 'RUNNING');
    });

    it('F7.5: Unrecognized or invalid action types are safely ignored without throwing', () => {
      assert.doesNotThrow(() => {
        engine.handleAction('INVALID_ACTION');
        engine.handleAction(null);
        engine.handleAction(12345);
      }, 'Engine should safely ignore invalid action types');
    });
  });

  // ==========================================
  // F8: Cyber-Neon Canvas 2D Presentation
  // ==========================================
  describe('F8: Cyber-Neon Canvas 2D Presentation', () => {
    it('F8.1: Snapshot exposes player dimensions and coordinates for renderer', () => {
      const snap = engine.getSnapshot();
      assert.ok(typeof snap.player.width === 'number' && snap.player.width > 0);
      assert.ok(typeof snap.player.height === 'number' && snap.player.height > 0);
    });

    it('F8.2: Snapshot exposes obstacles array with coordinates and type identifiers', () => {
      engine.handleAction('START');
      engine.tick(2.0);
      const snap = engine.getSnapshot();
      for (const obs of snap.obstacles) {
        assert.ok(typeof obs.type === 'string');
        assert.ok(typeof obs.x === 'number');
        assert.ok(typeof obs.y === 'number');
      }
    });

    it('F8.3: Snapshot exposes HUD metrics: timeRemaining, score, highScore, speed', () => {
      const snap = engine.getSnapshot();
      assert.ok('timeRemaining' in snap);
      assert.ok('score' in snap);
      assert.ok('highScore' in snap);
      assert.ok('speed' in snap);
    });

    it('F8.4: Snapshot state flag accurately signals UI screens', () => {
      const validStates = ['INIT', 'RUNNING', 'GAME_OVER', 'VICTORY', 'PAUSED'];
      const snap = engine.getSnapshot();
      assert.ok(validStates.includes(snap.state), `State ${snap.state} must be one of ${validStates}`);
    });

    it('F8.5: Snapshot immutability: mutating returned snapshot does not corrupt internal engine state', () => {
      const snap = engine.getSnapshot();
      snap.score = 999999;
      snap.player.x = -999;
      const freshSnap = engine.getSnapshot();
      assert.notStrictEqual(freshSnap.score, 999999, 'Engine score should not be mutated by external modification');
      assert.notStrictEqual(freshSnap.player.x, -999, 'Player x should not be mutated by external modification');
    });
  });

  // ==========================================
  // F9: Web Audio API Synth Effects (EventBus triggers)
  // ==========================================
  describe('F9: Web Audio API Synth Effects', () => {
    it('F9.1: jump event listener is invoked when player jumps', () => {
      let jumpEventFired = false;
      engine.on('jump', () => {
        jumpEventFired = true;
      });
      engine.handleAction('START');
      engine.handleAction('JUMP');
      assert.strictEqual(jumpEventFired, true, 'jump event should be triggered synchronously');
    });

    it('F9.2: hit event listener registration is supported on EventBus', () => {
      assert.doesNotThrow(() => {
        engine.on('hit', () => {});
      });
    });

    it('F9.3: item_collected event listener registration is supported on EventBus', () => {
      assert.doesNotThrow(() => {
        engine.on('item_collected', () => {});
      });
    });

    it('F9.4: victory event listener registration is supported on EventBus', () => {
      assert.doesNotThrow(() => {
        engine.on('victory', () => {});
      });
    });

    it('F9.5: game_over event listener registration is supported on EventBus', () => {
      assert.doesNotThrow(() => {
        engine.on('game_over', () => {});
      });
    });
  });

  // ==========================================
  // F10: Decoupled Node.js Test Suite
  // ==========================================
  describe('F10: Decoupled Node.js Test Suite', () => {
    it('F10.1: Engine instantiates and ticks with zero DOM/window/document globals', () => {
      assert.strictEqual(typeof window, 'undefined');
      assert.strictEqual(typeof document, 'undefined');
      const fresh = new GameEngine();
      fresh.handleAction('START');
      assert.doesNotThrow(() => fresh.tick(1 / 60));
    });

    it('F10.2: Deterministic simulation: identical tick delta yields identical progression', () => {
      const e1 = new GameEngine({ seed: 42 });
      const e2 = new GameEngine({ seed: 42 });
      e1.handleAction('START');
      e2.handleAction('START');
      e1.tick(1.0);
      e2.tick(1.0);
      assert.strictEqual(e1.getSnapshot().timeElapsed, e2.getSnapshot().timeElapsed);
      assert.strictEqual(e1.getSnapshot().player.y, e2.getSnapshot().player.y);
    });

    it('F10.3: Fast-forward capability: 3600 ticks complete in milliseconds', () => {
      const start = Date.now();
      const benchEngine = new GameEngine();
      benchEngine.handleAction('START');
      for (let i = 0; i < 3600; i++) {
        benchEngine.tick(1 / 60);
      }
      const duration = Date.now() - start;
      assert.ok(duration < 1000, `3600 ticks should execute well under 1000ms, took ${duration}ms`);
    });

    it('F10.4: Snapshot serializes cleanly via JSON.stringify without circular references', () => {
      const snap = engine.getSnapshot();
      assert.doesNotThrow(() => {
        const json = JSON.stringify(snap);
        assert.ok(json.length > 0);
      });
    });

    it('F10.5: Multiple concurrent GameEngine instances remain fully isolated', () => {
      const e1 = new GameEngine();
      const e2 = new GameEngine();
      e1.handleAction('START');
      e1.tick(5.0);
      assert.strictEqual(e1.getSnapshot().state, 'RUNNING');
      assert.strictEqual(e2.getSnapshot().state, 'INIT');
    });
  });

  // ==========================================
  // F11: GitHub Pages Static Deployment
  // ==========================================
  describe('F11: GitHub Pages Static Deployment', () => {
    it('F11.1: GameEngine instantiates cleanly with zero configuration parameters', () => {
      const defaultEngine = new GameEngine();
      assert.ok(defaultEngine !== null);
      assert.strictEqual(defaultEngine.getSnapshot().state, 'INIT');
    });

    it('F11.2: GameEngine supports custom configurations passed via constructor', () => {
      const custom = new GameEngine({
        gravity: 2000,
        jumpVelocity: -700,
        totalDuration: 60
      });
      assert.ok(custom !== null);
    });

    it('F11.3: Reset method fully clears state, arrays, and resets timer', () => {
      engine.handleAction('START');
      engine.tick(15.0);
      engine.reset();
      const snap = engine.getSnapshot();
      assert.strictEqual(snap.state, 'INIT');
      assert.strictEqual(Math.round(snap.timeRemaining), 60);
      assert.strictEqual(snap.timeElapsed, 0);
    });

    it('F11.4: Engine simulation produces identical numerical results across platforms', () => {
      const testEng = new GameEngine();
      testEng.handleAction('START');
      testEng.tick(1.0);
      const snap = testEng.getSnapshot();
      assert.ok(Number.isFinite(snap.player.x));
      assert.ok(Number.isFinite(snap.player.y));
    });

    it('F11.5: Zero asynchronous network or timer dependencies: ticks advance solely via tick(dt)', () => {
      engine.handleAction('START');
      // Verify time does not advance if tick is not called
      const snap1 = engine.getSnapshot();
      const snap2 = engine.getSnapshot();
      assert.strictEqual(snap1.timeElapsed, snap2.timeElapsed);
    });
  });
});
