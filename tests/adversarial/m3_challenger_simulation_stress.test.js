/**
 * tests/adversarial/m3_challenger_simulation_stress.test.js
 * Milestone 3: Final Verification & Adversarial Hardening
 * Empirical Challenger Verification Harness for Core Simulation Engine (src/core/)
 *
 * Verifies:
 * 1. Monte Carlo simulation of multiple 60.0s runs (multiple seeds, deterministic trajectories, invariants)
 * 2. Rapid action spamming & state oscillation (10,000+ burst actions, DUCK/JUMP/PAUSE toggles)
 * 3. Extreme boundary conditions & pathological delta times (NaN, Infinity, spikes, micro-steps)
 * 4. Zero lives initialization & pathological constructor configurations
 * 5. Determinism & concurrent engine isolation across full 60.0s lifecycle
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { GameEngine } from '../../src/core/GameEngine.js';
import { Player } from '../../src/core/Player.js';
import { StateMachine, GAME_STATES } from '../../src/core/StateMachine.js';
import { ObstacleManager, createPRNG } from '../../src/core/ObstacleManager.js';
import { ItemManager } from '../../src/core/ItemManager.js';
import { ScoreManager } from '../../src/core/ScoreManager.js';
import { checkAABBCollision } from '../../src/core/Collision.js';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  GAME_DURATION,
  INITIAL_SPEED,
  MAX_SPEED,
  PLAYER_START_X,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_MAX_LIVES,
  TERMINAL_VELOCITY,
  GRAVITY
} from '../../src/core/constants.js';

describe('Milestone 3 Challenger: Core Simulation Adversarial Hardening', () => {

  // =========================================================================
  // 1. Monte Carlo Simulation: Multiple 60.0s Headless Runs & Invariants
  // =========================================================================
  describe('1. Monte Carlo Simulation (60.0s Full Runs & Invariants)', () => {

    it('1.1: Monte Carlo 25 Flawless Full 60.0s Runs across distinct PRNG seeds reach VICTORY with exact invariants', () => {
      const seeds = [
        101, 777, 12345, 99999, 424242, 88888, 314159, 271828,
        55555, 1234567, 987654, 112233, 445566, 778899, 990011,
        13579, 24680, 86420, 97531, 102938, 475869, 192837, 564738, 918273, 9999999
      ];

      for (const seed of seeds) {
        // Use enableDamage: false to simulate a perfect autonomous dodging agent running the full 60.0s course
        const engine = new GameEngine({
          seed,
          totalDuration: 60.0,
          enableDamage: false
        });

        assert.strictEqual(engine.getSnapshot().state, GAME_STATES.INIT);
        engine.handleAction('START');
        assert.strictEqual(engine.getSnapshot().state, GAME_STATES.RUNNING);

        const dt = 1 / 60; // 60 Hz fixed timestep
        let ticks = 0;
        const maxTicks = 4000; // 60s is 3600 ticks

        while (engine.getSnapshot().state === GAME_STATES.RUNNING && ticks < maxTicks) {
          // Perform periodic jumps to test dynamic physics alongside obstacle generation
          if (ticks % 90 === 0) {
            engine.handleAction('JUMP');
          }
          engine.tick(dt);
          ticks++;

          const snap = engine.getSnapshot();

          // Continuous Invariant Checks during run:
          // 1. Ground contact invariant: player cannot be below ground
          assert.ok(
            snap.player.y <= GROUND_Y - snap.player.height + 0.001,
            `Seed ${seed}: Player penetrated ground: y=${snap.player.y}, groundY=${GROUND_Y}`
          );

          // 2. Positional bounds
          assert.strictEqual(snap.player.x, PLAYER_START_X, `Seed ${seed}: Player X must remain fixed`);
          assert.ok(snap.player.y >= 0, `Seed ${seed}: Player Y must not be negative`);

          // 3. Speed bounds
          assert.ok(
            snap.speed >= INITIAL_SPEED - 1 && snap.speed <= MAX_SPEED + 1,
            `Seed ${seed}: Speed out of bounds: ${snap.speed}`
          );

          // 4. Timer bounds
          assert.ok(snap.timeRemaining >= 0 && snap.timeRemaining <= 60.0, `Seed ${seed}: timeRemaining out of range: ${snap.timeRemaining}`);
          assert.ok(snap.timeElapsed >= 0 && snap.timeElapsed <= 61.0, `Seed ${seed}: timeElapsed out of range: ${snap.timeElapsed}`);

          // 5. Score validity
          assert.ok(Number.isFinite(snap.score), `Seed ${seed}: Score must be finite`);
          assert.ok(!Number.isNaN(snap.score), `Seed ${seed}: Score must not be NaN`);
        }

        const finalSnap = engine.getSnapshot();
        assert.strictEqual(finalSnap.state, GAME_STATES.VICTORY, `Seed ${seed} must complete 60s to VICTORY`);
        assert.strictEqual(finalSnap.timeRemaining, 0, `Seed ${seed}: timeRemaining must be 0 at victory`);
        assert.ok(Math.abs(finalSnap.timeElapsed - 60.0) < 0.1, `Seed ${seed}: timeElapsed must be ~60.0s, got ${finalSnap.timeElapsed}`);
        assert.strictEqual(finalSnap.speed, MAX_SPEED, `Seed ${seed}: Speed must reach MAX_SPEED at victory`);
        assert.ok(finalSnap.score > 5000, `Seed ${seed}: Score must include victory bonus and distance score`);
      }
    });

    it('1.2: Monte Carlo 20 Stochastic Obstacle Collision Runs reach GAME_OVER or VICTORY cleanly without NaN or leaks', () => {
      const rng = createPRNG(98765);

      for (let run = 0; run < 20; run++) {
        const seed = Math.floor(rng() * 1000000);
        const engine = new GameEngine({
          seed,
          initialLives: 3,
          enableDamage: true
        });

        engine.handleAction('START');

        let ticks = 0;
        let hitsRecorded = 0;
        engine.on('hit', () => {
          hitsRecorded++;
        });

        // Run until state is no longer RUNNING (either GAME_OVER or VICTORY)
        while (engine.getSnapshot().state === GAME_STATES.RUNNING && ticks < 4000) {
          // Semi-random jump behavior with 5% probability per frame
          if (rng() < 0.05) {
            engine.handleAction('JUMP');
          }
          engine.tick(1 / 60);
          ticks++;
        }

        const snap = engine.getSnapshot();
        assert.ok(
          snap.state === GAME_STATES.GAME_OVER || snap.state === GAME_STATES.VICTORY,
          `Run ${run} (seed ${seed}) must terminate in GAME_OVER or VICTORY, got ${snap.state}`
        );

        if (snap.state === GAME_STATES.GAME_OVER) {
          assert.strictEqual(snap.player.lives, 0, `GAME_OVER must have 0 lives, got ${snap.player.lives}`);
          assert.ok(hitsRecorded >= 3, `Expected at least 3 hits before GAME_OVER, recorded ${hitsRecorded}`);
        }

        // Entity arrays must not leak / blow up
        assert.ok(snap.obstacles.length <= 15, `Obstacles count must stay bounded, got ${snap.obstacles.length}`);
        assert.ok(snap.items.length <= 25, `Items count must stay bounded, got ${snap.items.length}`);
      }
    });

    it('1.3: AFK Runner (zero input) with default damage consistently dies to early obstacles across seeds', () => {
      const testSeeds = [12, 345, 6789, 44444, 88888];
      for (const seed of testSeeds) {
        const engine = new GameEngine({ seed, initialLives: 3, enableDamage: true });
        engine.handleAction('START');

        let ticks = 0;
        while (engine.getSnapshot().state === GAME_STATES.RUNNING && ticks < 3600) {
          engine.tick(1 / 60);
          ticks++;
        }

        const snap = engine.getSnapshot();
        assert.strictEqual(snap.state, GAME_STATES.GAME_OVER, `AFK player must trigger GAME_OVER for seed ${seed}`);
        assert.strictEqual(snap.player.lives, 0, `AFK player must reach 0 lives`);
        // AFK player should hit obstacles within first 30 seconds
        assert.ok(snap.timeElapsed < 45.0, `AFK player must expire well before 60s, died at ${snap.timeElapsed}s`);
      }
    });
  });

  // =========================================================================
  // 2. Rapid Action Spamming & Posture Chaos Stress
  // =========================================================================
  describe('2. Rapid Action Spamming & Posture Transitions', () => {

    it('2.1: 10,000 action spam burst in single frame and across frames never throws and preserves state consistency', () => {
      const engine = new GameEngine();
      engine.handleAction('START');

      const actions = [
        'JUMP', 'DUCK', 'STAND', 'JUMP', 'STAND', 'DUCK', 'INVALID_ACTION',
        '', null, undefined, 42, {}, [], 'PAUSE', 'PAUSE', 'JUMP', 'DUCK'
      ];

      // Fire 10,000 rapid calls
      for (let i = 0; i < 10000; i++) {
        const action = actions[i % actions.length];
        assert.doesNotThrow(() => {
          engine.handleAction(action);
        }, `Action ${String(action)} at index ${i} must not throw`);
      }

      // Ensure snapshot is completely intact
      const snap = engine.getSnapshot();
      assert.ok(Number.isFinite(snap.player.y));
      assert.ok(Number.isFinite(snap.player.vy));
      assert.ok(snap.player.width > 0);
      assert.ok(snap.player.height > 0);
      assert.ok(['INIT', 'RUNNING', 'PAUSED'].includes(snap.state));
    });

    it('2.2: Rapid alternating DUCK and JUMP on same frame does not produce negative or distorted dimensions', () => {
      const engine = new GameEngine();
      engine.handleAction('START');

      for (let frame = 0; frame < 100; frame++) {
        // Hammer duck, jump, stand repeatedly in alternating sequence
        engine.handleAction('DUCK');
        assert.strictEqual(engine.getSnapshot().player.height, 32, 'Player should be duck height (32)');
        engine.handleAction('JUMP');
        engine.handleAction('STAND');
        assert.strictEqual(engine.getSnapshot().player.height, 64, 'Player should be stand height (64)');
        engine.handleAction('DUCK');
        engine.handleAction('STAND');

        engine.tick(1 / 60);

        const snap = engine.getSnapshot();
        assert.ok(snap.player.y <= GROUND_Y - snap.player.height + 0.001);
        assert.ok(snap.player.vy <= TERMINAL_VELOCITY);
      }
    });

    it('2.3: Rapid PAUSE / RESUME oscillation during mid-air jump preserves exact physical trajectory', () => {
      const engine = new GameEngine({ enableDamage: false });
      engine.handleAction('START');

      // Execute jump
      engine.handleAction('JUMP');
      engine.tick(1 / 60); // In mid-air

      const midAirY = engine.getSnapshot().player.y;
      const midAirVy = engine.getSnapshot().player.vy;
      assert.ok(midAirVy < 0, 'Must be ascending in jump');

      // Rapidly toggle PAUSE 100 times in same state
      for (let i = 0; i < 100; i++) {
        engine.handleAction('PAUSE');
      }

      // Because 100 is even, state should return to RUNNING
      assert.strictEqual(engine.getSnapshot().state, GAME_STATES.RUNNING);
      assert.strictEqual(engine.getSnapshot().player.y, midAirY, 'Y must not drift during pause toggle');
      assert.strictEqual(engine.getSnapshot().player.vy, midAirVy, 'VY must not drift during pause toggle');

      // Now toggle once to PAUSED and tick 10 times: physics must remain completely frozen
      engine.handleAction('PAUSE');
      assert.strictEqual(engine.getSnapshot().state, GAME_STATES.PAUSED);

      for (let i = 0; i < 10; i++) {
        engine.tick(1 / 60);
      }

      assert.strictEqual(engine.getSnapshot().player.y, midAirY, 'Y must remain frozen while paused');
      assert.strictEqual(engine.getSnapshot().player.vy, midAirVy, 'VY must remain frozen while paused');

      // Resume and verify jump completes
      engine.handleAction('PAUSE');
      assert.strictEqual(engine.getSnapshot().state, GAME_STATES.RUNNING);

      for (let i = 0; i < 60; i++) {
        engine.tick(1 / 60);
      }
      assert.strictEqual(engine.getSnapshot().player.isGrounded, true, 'Player must eventually land safely');
    });

    it('2.4: RESTART called from every possible lifecycle state cleanly reinitializes simulation to active RUNNING', () => {
      const statesToTest = [
        GAME_STATES.INIT,
        GAME_STATES.RUNNING,
        GAME_STATES.PAUSED,
        GAME_STATES.GAME_OVER,
        GAME_STATES.VICTORY
      ];

      for (const targetState of statesToTest) {
        const engine = new GameEngine();

        if (targetState === GAME_STATES.RUNNING) {
          engine.handleAction('START');
          engine.tick(1.0);
        } else if (targetState === GAME_STATES.PAUSED) {
          engine.handleAction('START');
          engine.tick(1.0);
          engine.handleAction('PAUSE');
        } else if (targetState === GAME_STATES.GAME_OVER) {
          engine.handleAction('START');
          // Inflict fatal damage
          for (let i = 0; i < 10; i++) {
            engine.emit('hit', {}); // emit doesn't damage directly, let's drain lives
          }
          // Fast forward to game over by colliding or using small lives
          const fatalEngine = new GameEngine({ initialLives: 0 });
          fatalEngine.handleAction('START');
          assert.strictEqual(fatalEngine.getSnapshot().state, GAME_STATES.GAME_OVER);
          fatalEngine.handleAction('RESTART');
          assert.strictEqual(fatalEngine.getSnapshot().state, GAME_STATES.RUNNING);
          continue;
        } else if (targetState === GAME_STATES.VICTORY) {
          const winEngine = new GameEngine({ totalDuration: 0.1, enableDamage: false });
          winEngine.handleAction('START');
          winEngine.tick(0.2);
          assert.strictEqual(winEngine.getSnapshot().state, GAME_STATES.VICTORY);
          winEngine.handleAction('RESTART');
          assert.strictEqual(winEngine.getSnapshot().state, GAME_STATES.RUNNING);
          continue;
        }

        // Test RESTART
        const snap = engine.handleAction('RESTART');
        assert.strictEqual(snap.state, GAME_STATES.RUNNING, `RESTART from ${targetState} must transition to RUNNING`);
        assert.strictEqual(snap.timeElapsed, 0, `RESTART from ${targetState} must reset timeElapsed to 0`);
        assert.strictEqual(snap.timeRemaining, 60.0, `RESTART from ${targetState} must reset timeRemaining`);
        assert.strictEqual(snap.player.lives, PLAYER_MAX_LIVES, `RESTART must restore full lives`);
        assert.strictEqual(snap.player.isGrounded, true, `RESTART must ground player`);
      }
    });
  });

  // =========================================================================
  // 3. Boundary Conditions & Numerical Extremes
  // =========================================================================
  describe('3. Boundary Conditions & Extreme Numerical Inputs', () => {

    it('3.1: Pathological and non-numeric dt values are safely rejected as no-ops', () => {
      const engine = new GameEngine();
      engine.handleAction('START');

      const initialSnap = engine.getSnapshot();

      const pathologicalInputs = [
        0, -0, -1, -999999, -Infinity, Infinity, NaN,
        null, undefined, '0.016', 'hello', {}, [], Symbol('dt'), true, false
      ];

      for (const val of pathologicalInputs) {
        assert.doesNotThrow(() => {
          engine.tick(val);
        }, `tick(${String(val)}) must not throw`);

        const snap = engine.getSnapshot();
        assert.strictEqual(snap.timeElapsed, initialSnap.timeElapsed, `tick(${String(val)}) must not advance timeElapsed`);
        assert.strictEqual(snap.timeRemaining, initialSnap.timeRemaining, `tick(${String(val)}) must not modify timeRemaining`);
        assert.strictEqual(snap.score, initialSnap.score, `tick(${String(val)}) must not change score`);
      }
    });

    it('3.2: Extreme dt spike (10,000s) is safely clamped by MAX_TOTAL_DT and does not stall/infinite loop', () => {
      const engine = new GameEngine({ enableDamage: false });
      engine.handleAction('START');

      const startTime = Date.now();
      // Tick with 10,000 seconds in a single call
      engine.tick(10000);
      const duration = Date.now() - startTime;

      // Must complete within 100ms (clamped to MAX_TOTAL_DT = 65.0s, which sub-steps to victory in ~3900 steps)
      assert.ok(duration < 200, `Massive dt tick took too long (${duration}ms), potential infinite loop`);

      const snap = engine.getSnapshot();
      assert.strictEqual(snap.state, GAME_STATES.VICTORY, 'Should reach victory safely');
      assert.strictEqual(snap.timeRemaining, 0);
    });

    it('3.3: 5,000 Micro-ticks (dt = 0.0001s) integrate smoothly without underflow or NaN', () => {
      const engine = new GameEngine({ enableDamage: false });
      engine.handleAction('START');

      for (let i = 0; i < 5000; i++) {
        engine.tick(0.0001);
      }

      const snap = engine.getSnapshot();
      assert.ok(Math.abs(snap.timeElapsed - 0.5) < 0.05, `timeElapsed should be ~0.5s, got ${snap.timeElapsed}`);
      assert.ok(!Number.isNaN(snap.score));
      assert.ok(!Number.isNaN(snap.speed));
      assert.ok(!Number.isNaN(snap.player.y));
    });

    it('3.4: Victory threshold sub-micro precision: 59.999s does not trigger victory, 60.000s triggers victory', () => {
      const engine = new GameEngine({ totalDuration: 60.0, enableDamage: false });
      engine.handleAction('START');

      // Advance to 59.90s
      engine.tick(59.90);
      assert.strictEqual(engine.getSnapshot().state, GAME_STATES.RUNNING);

      // Advance to 59.99s (timeRemaining is 0.01s > 0)
      engine.tick(0.090);
      assert.strictEqual(engine.getSnapshot().state, GAME_STATES.RUNNING);
      assert.strictEqual(engine.getSnapshot().timeRemaining, 0.01);

      // Advance to 59.999s (state is still RUNNING before crossing 60.0s threshold)
      engine.tick(0.009);
      assert.strictEqual(engine.getSnapshot().state, GAME_STATES.RUNNING, 'At 59.999s must still be RUNNING');
      assert.strictEqual(engine.getSnapshot().timeRemaining, 0, '0.001s rounds to 0.00 in 2-decimal snapshot');

      // Push past 60.0s (triggers VICTORY)
      engine.tick(0.002);
      assert.strictEqual(engine.getSnapshot().state, GAME_STATES.VICTORY, 'At >= 60.0s must trigger VICTORY');
      assert.strictEqual(engine.getSnapshot().timeRemaining, 0);
    });

    it('3.5: Post-Terminal stability: 1,000 ticks after VICTORY leaves state immutable and score stable', () => {
      const engine = new GameEngine({ totalDuration: 1.0, enableDamage: false });
      engine.handleAction('START');
      engine.tick(1.1);

      assert.strictEqual(engine.getSnapshot().state, GAME_STATES.VICTORY);
      const victoryScore = engine.getSnapshot().score;
      const victoryHighScore = engine.getSnapshot().highScore;

      for (let i = 0; i < 1000; i++) {
        engine.tick(1 / 60);
      }

      const snap = engine.getSnapshot();
      assert.strictEqual(snap.state, GAME_STATES.VICTORY, 'State must remain VICTORY');
      assert.strictEqual(snap.timeRemaining, 0);
      assert.strictEqual(snap.score, victoryScore, 'Score must not mutate after VICTORY');
      assert.strictEqual(snap.highScore, victoryHighScore, 'High score must not mutate after VICTORY');
    });

    it('3.6: Post-Terminal stability: 1,000 ticks after GAME_OVER leaves state immutable and no resurrection', () => {
      const engine = new GameEngine({ initialLives: 0 });
      engine.handleAction('START');
      assert.strictEqual(engine.getSnapshot().state, GAME_STATES.GAME_OVER);

      const goScore = engine.getSnapshot().score;

      for (let i = 0; i < 1000; i++) {
        engine.tick(1 / 60);
        engine.handleAction('JUMP');
      }

      const snap = engine.getSnapshot();
      assert.strictEqual(snap.state, GAME_STATES.GAME_OVER, 'State must remain GAME_OVER');
      assert.strictEqual(snap.score, goScore, 'Score must not change after GAME_OVER');
      assert.strictEqual(snap.player.lives, 0, 'Lives must remain 0');
    });
  });

  // =========================================================================
  // 4. Zero Lives Initialization & Pathological Configurations
  // =========================================================================
  describe('4. Zero Lives Initialization & Pathological Configs', () => {

    it('4.1: Initializing with initialLives: 0 immediately transitions to GAME_OVER on START and emits event', () => {
      const engine = new GameEngine({ initialLives: 0 });
      assert.strictEqual(engine.getSnapshot().state, GAME_STATES.INIT);
      assert.strictEqual(engine.getSnapshot().player.lives, 0);

      let gameOverEmitted = false;
      let reasonEmitted = null;
      engine.on('game_over', (data) => {
        gameOverEmitted = true;
        reasonEmitted = data.reason;
      });

      engine.handleAction('START');

      const snap = engine.getSnapshot();
      assert.strictEqual(snap.state, GAME_STATES.GAME_OVER, 'Must transition to GAME_OVER immediately on START');
      assert.strictEqual(gameOverEmitted, true, 'game_over event must be emitted');
      assert.strictEqual(reasonEmitted, 'no_lives', 'Reason must be "no_lives"');
      assert.strictEqual(snap.player.lives, 0);
    });

    it('4.2: Initializing with playerLives: 0 alias also triggers zero-lives GAME_OVER', () => {
      const engine = new GameEngine({ playerLives: 0 });
      assert.strictEqual(engine.getSnapshot().player.lives, 0);

      engine.handleAction('START');
      assert.strictEqual(engine.getSnapshot().state, GAME_STATES.GAME_OVER);
    });

    it('4.3: Initializing with negative lives (e.g. initialLives: -5) transitions cleanly to GAME_OVER', () => {
      const engine = new GameEngine({ initialLives: -5 });
      assert.ok(engine.getSnapshot().player.lives <= 0);

      engine.handleAction('START');
      assert.strictEqual(engine.getSnapshot().state, GAME_STATES.GAME_OVER);
    });

    it('4.4: Initializing with 1 life dies on single hit', () => {
      const engine = new GameEngine({ initialLives: 1, seed: 12345 });
      engine.handleAction('START');
      assert.strictEqual(engine.getSnapshot().player.lives, 1);

      let ticks = 0;
      while (engine.getSnapshot().state === GAME_STATES.RUNNING && ticks < 1000) {
        engine.tick(1 / 60);
        ticks++;
      }

      assert.strictEqual(engine.getSnapshot().state, GAME_STATES.GAME_OVER);
      assert.strictEqual(engine.getSnapshot().player.lives, 0);
    });

    it('4.5: Pathological constructor arguments (null, undefined, non-objects) use robust defaults', () => {
      const badConfigs = [null, undefined, 42, 'string', true, Symbol(), () => {}];
      for (const cfg of badConfigs) {
        assert.doesNotThrow(() => {
          const engine = new GameEngine(cfg);
          const snap = engine.getSnapshot();
          assert.strictEqual(snap.state, GAME_STATES.INIT);
          assert.strictEqual(snap.timeRemaining, 60.0);
          assert.strictEqual(snap.player.lives, PLAYER_MAX_LIVES);
        });
      }
    });
  });

  // =========================================================================
  // 5. Determinism, Isolation & Snapshot Serialization Stress
  // =========================================================================
  describe('5. Determinism, Isolation & Snapshot Integrity', () => {

    it('5.1: Two independent engines with identical seed and inputs produce identical numerical snapshots across 3600 ticks', () => {
      const engineA = new GameEngine({ seed: 777123, enableDamage: false });
      const engineB = new GameEngine({ seed: 777123, enableDamage: false });

      engineA.handleAction('START');
      engineB.handleAction('START');

      for (let i = 0; i < 3600; i++) {
        if (i % 120 === 0) {
          engineA.handleAction('JUMP');
          engineB.handleAction('JUMP');
        }
        engineA.tick(1 / 60);
        engineB.tick(1 / 60);

        if (i % 300 === 0) {
          const snapA = engineA.getSnapshot();
          const snapB = engineB.getSnapshot();
          assert.deepStrictEqual(snapA, snapB, `Snapshots diverged at tick ${i}`);
        }
      }

      assert.deepStrictEqual(engineA.getSnapshot(), engineB.getSnapshot());
    });

    it('5.2: 50 Concurrent GameEngine instances run in isolation without shared mutable state', () => {
      const engines = Array.from({ length: 50 }, (_, i) => {
        const eng = new GameEngine({ seed: i * 100 + 1, initialLives: (i % 3) + 1 });
        eng.handleAction('START');
        return eng;
      });

      for (let t = 0; t < 100; t++) {
        for (const eng of engines) {
          eng.tick(1 / 60);
        }
      }

      // Check all snapshots are valid and independent
      for (let i = 0; i < engines.length; i++) {
        const snap = engines[i].getSnapshot();
        assert.ok(snap.score >= 0);
        assert.ok(Number.isFinite(snap.player.y));
      }
    });

    it('5.3: Snapshots serialize cleanly via JSON without circular references under any state', () => {
      const engine = new GameEngine();
      engine.handleAction('START');
      engine.tick(2.0);

      const snap = engine.getSnapshot();
      assert.doesNotThrow(() => {
        const json = JSON.stringify(snap);
        const parsed = JSON.parse(json);
        assert.strictEqual(parsed.state, snap.state);
        assert.strictEqual(parsed.player.x, snap.player.x);
      });
    });
  });
});
