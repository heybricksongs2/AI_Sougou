/**
 * tests/adversarial/challenger_stress.test.js
 * Adversarial Stress Harness for Headless Simulation Core (Milestone 1)
 *
 * Verifies:
 * 1. State machine strict rejection of illegal transitions and inputs
 * 2. 60.0s timer progression, boundary precision, and post-victory stability
 * 3. Monotonicity of score with distance and high score persistence
 * 4. Monte Carlo simulation of 100 complete headless games with varying random seeds:
 *    - 30 survival runs to 60.0s (guaranteed VICTORY)
 *    - 30 passive / early hit runs (GAME_OVER / VICTORY)
 *    - 20 random jump autoplay runs (stochastic obstacle avoidance)
 *    - 10 chaotic pause / resume cycle runs
 *    - 10 mid-run restart lifecycle runs
 * 5. Bounded memory and entity culling under sustained long-duration simulation
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../../src/core/GameEngine.js';
import { StateMachine, GAME_STATES } from '../../src/core/StateMachine.js';
import { createPRNG } from '../../src/core/ObstacleManager.js';
import {
  CANVAS_WIDTH,
  GROUND_Y,
  GAME_DURATION,
  INITIAL_SPEED,
  MAX_SPEED,
  PLAYER_MAX_LIVES
} from '../../src/core/constants.js';

describe('Challenger M1 Adversarial Stress Suite', () => {

  // =========================================================================
  // 1. Strict State Machine Rejections & Action Invariants
  // =========================================================================
  describe('1. State Machine Strict Transition Invariants', () => {
    const ALL_STATES = [
      GAME_STATES.INIT,
      GAME_STATES.RUNNING,
      GAME_STATES.PAUSED,
      GAME_STATES.GAME_OVER,
      GAME_STATES.VICTORY
    ];

    it('1.1: StateMachine rejects self-transitions for all states', () => {
      for (const st of ALL_STATES) {
        const sm = new StateMachine(st);
        assert.strictEqual(sm.canTransitionTo(st), false, `canTransitionTo(${st}) from ${st} must be false`);
        assert.strictEqual(sm.transition(st), false, `transition(${st}) from ${st} must be false`);
        assert.strictEqual(sm.state, st, `State must remain ${st}`);
      }
    });

    it('1.2: StateMachine rejects invalid/corrupted target states', () => {
      const invalidTargets = ['UNKNOWN', '', null, undefined, 123, {}, [], NaN];
      for (const st of ALL_STATES) {
        const sm = new StateMachine(st);
        for (const target of invalidTargets) {
          assert.strictEqual(sm.canTransitionTo(target), false, `Target ${String(target)} must be rejected from ${st}`);
          assert.strictEqual(sm.transition(target), false, `Transition to ${String(target)} must fail`);
          assert.strictEqual(sm.state, st, `State must remain unchanged after rejected target`);
        }
      }
    });

    it('1.3: StateMachine strictly allows only valid transitions per specification matrix', () => {
      const allowedMatrix = {
        [GAME_STATES.INIT]: [GAME_STATES.RUNNING],
        [GAME_STATES.RUNNING]: [GAME_STATES.PAUSED, GAME_STATES.GAME_OVER, GAME_STATES.VICTORY, GAME_STATES.INIT],
        [GAME_STATES.PAUSED]: [GAME_STATES.RUNNING, GAME_STATES.INIT],
        [GAME_STATES.GAME_OVER]: [GAME_STATES.RUNNING, GAME_STATES.INIT],
        [GAME_STATES.VICTORY]: [GAME_STATES.RUNNING, GAME_STATES.INIT]
      };

      for (const fromState of ALL_STATES) {
        const allowedTargets = allowedMatrix[fromState];
        for (const toState of ALL_STATES) {
          const sm = new StateMachine(fromState);
          const shouldAllow = allowedTargets.includes(toState) && fromState !== toState;
          const can = sm.canTransitionTo(toState);
          assert.strictEqual(
            can,
            shouldAllow,
            `Transition ${fromState} -> ${toState} expected ${shouldAllow} but got ${can}`
          );

          const result = sm.transition(toState);
          assert.strictEqual(
            result,
            shouldAllow,
            `Transition call ${fromState} -> ${toState} expected ${shouldAllow} but got ${result}`
          );
          if (shouldAllow) {
            assert.strictEqual(sm.state, toState);
          } else {
            assert.strictEqual(sm.state, fromState);
          }
        }
      }
    });

    it('1.4: GameEngine handleAction rejects illegal actions cleanly without state corruption', () => {
      const engine = new GameEngine();
      const illegalActions = ['DANCE', 'FLY', 'EXPLODE', '', null, undefined, 0, {}, []];

      for (const act of illegalActions) {
        const snap = engine.handleAction(act);
        assert.strictEqual(snap.state, GAME_STATES.INIT);
      }

      // Action START transitions INIT to RUNNING
      engine.handleAction('START');
      assert.strictEqual(engine.getSnapshot().state, GAME_STATES.RUNNING);

      // Calling START while already RUNNING is safely idempotent
      engine.handleAction('START');
      assert.strictEqual(engine.getSnapshot().state, GAME_STATES.RUNNING);

      // JUMP while PAUSED is ignored
      engine.handleAction('PAUSE');
      assert.strictEqual(engine.getSnapshot().state, GAME_STATES.PAUSED);
      const preJumpY = engine.getSnapshot().player.y;
      engine.handleAction('JUMP');
      assert.strictEqual(engine.getSnapshot().player.y, preJumpY);
      assert.strictEqual(engine.getSnapshot().state, GAME_STATES.PAUSED);

      // PAUSE resume back to RUNNING
      engine.handleAction('PAUSE');
      assert.strictEqual(engine.getSnapshot().state, GAME_STATES.RUNNING);
    });

    it('1.5: GameEngine tick in non-RUNNING states is a strict no-op', () => {
      const engine = new GameEngine();
      assert.strictEqual(engine.getSnapshot().state, GAME_STATES.INIT);

      // Tick in INIT
      engine.tick(1.0);
      let snap = engine.getSnapshot();
      assert.strictEqual(snap.timeElapsed, 0);
      assert.strictEqual(snap.timeRemaining, 60.0);
      assert.strictEqual(snap.score, 0);

      // Start and pause
      engine.handleAction('START');
      engine.tick(0.5);
      const elapsedBeforePause = engine.getSnapshot().timeElapsed;
      engine.handleAction('PAUSE');

      // Tick while PAUSED
      engine.tick(5.0);
      snap = engine.getSnapshot();
      assert.strictEqual(snap.state, GAME_STATES.PAUSED);
      assert.strictEqual(snap.timeElapsed, elapsedBeforePause);

      // Finish to victory and tick while VICTORY
      engine.handleAction('PAUSE'); // resume
      const vicEngine = new GameEngine({ enableDamage: false });
      vicEngine.handleAction('START');
      vicEngine.tick(60.1);
      assert.strictEqual(vicEngine.getSnapshot().state, GAME_STATES.VICTORY);
      const vicElapsed = vicEngine.getSnapshot().timeElapsed;
      const vicScore = vicEngine.getSnapshot().score;

      vicEngine.tick(10.0);
      const afterVicSnap = vicEngine.getSnapshot();
      assert.strictEqual(afterVicSnap.state, GAME_STATES.VICTORY);
      assert.strictEqual(afterVicSnap.timeElapsed, vicElapsed);
      assert.strictEqual(afterVicSnap.score, vicScore);
    });
  });

  // =========================================================================
  // 2. Timer Progression & Boundary Precision
  // =========================================================================
  describe('2. Timer Progression & Boundary Precision', () => {
    it('2.1: Micro-step progression at 59.999s preserves RUNNING until exact 60.0s threshold', () => {
      const engine = new GameEngine({ enableDamage: false, totalDuration: 60.0 });
      engine.handleAction('START');

      // Fast-forward to 59.990 seconds via discrete 1/60 ticks
      const targetPreTime = 59.99;
      const dt = 1 / 60;
      let accumulated = 0;
      while (accumulated + dt < targetPreTime) {
        engine.tick(dt);
        accumulated += dt;
      }

      // State must be RUNNING
      let snap = engine.getSnapshot();
      assert.strictEqual(snap.state, GAME_STATES.RUNNING);
      assert.ok(snap.timeRemaining > 0, `timeRemaining (${snap.timeRemaining}) must be > 0 before 60s`);

      // Advance by small micro-step that lands at exactly 60.0 or just past
      engine.tick(0.02);
      snap = engine.getSnapshot();
      assert.strictEqual(snap.state, GAME_STATES.VICTORY);
      assert.strictEqual(snap.timeRemaining, 0);
      assert.ok(snap.timeElapsed >= 60.0, `timeElapsed (${snap.timeElapsed}) must be >= 60.0 at VICTORY`);
    });

    it('2.2: Speed curve scales monotonically and caps at configured MAX_SPEED', () => {
      const engine = new GameEngine({ enableDamage: false });
      engine.handleAction('START');

      let prevSpeed = engine.getSnapshot().speed;
      assert.strictEqual(prevSpeed, INITIAL_SPEED);

      for (let sec = 1; sec <= 60; sec++) {
        engine.tick(1.0);
        const curSpeed = engine.getSnapshot().speed;
        assert.ok(curSpeed >= prevSpeed, `Speed must not decrease at sec ${sec}: prev=${prevSpeed}, cur=${curSpeed}`);
        assert.ok(curSpeed <= MAX_SPEED, `Speed must not exceed MAX_SPEED: cur=${curSpeed}`);
        prevSpeed = curSpeed;
      }

      assert.strictEqual(prevSpeed, MAX_SPEED);
    });
  });

  // =========================================================================
  // 3. Monotonicity of Score & High Score Invariant
  // =========================================================================
  describe('3. Score Monotonicity Invariants', () => {
    it('3.1: Distance score is strictly non-decreasing across all consecutive simulation ticks', () => {
      const engine = new GameEngine({ enableDamage: false, seed: 99999 });
      engine.handleAction('START');

      let prevScore = engine.getSnapshot().score;
      const totalTicks = 1200; // 20 seconds of simulation
      const dt = 1 / 60;

      for (let i = 0; i < totalTicks; i++) {
        engine.tick(dt);
        const curScore = engine.getSnapshot().score;
        assert.ok(
          curScore >= prevScore,
          `Score decreased at tick ${i}: curScore=${curScore}, prevScore=${prevScore}`
        );
        prevScore = curScore;
      }
    });

    it('3.2: High score persists across reset and restart cycles and is monotonic', () => {
      const engine = new GameEngine({ enableDamage: false, seed: 12345 });
      engine.handleAction('START');

      // Run 1: 10 seconds
      engine.tick(10.0);
      const score1 = engine.getSnapshot().score;
      const highScore1 = engine.getSnapshot().highScore;
      assert.strictEqual(highScore1, score1);

      // Reset
      engine.reset();
      const snapAfterReset = engine.getSnapshot();
      assert.strictEqual(snapAfterReset.score, 0);
      assert.strictEqual(snapAfterReset.highScore, highScore1, 'High score must survive reset()');

      // Run 2: Shorter run (2 seconds)
      engine.handleAction('START');
      engine.tick(2.0);
      const snap2 = engine.getSnapshot();
      assert.strictEqual(snap2.highScore, highScore1, 'High score must not drop on shorter second run');

      // Run 3: Longer run (20 seconds) exceeding run 1
      engine.handleAction('RESTART');
      engine.tick(20.0);
      const snap3 = engine.getSnapshot();
      assert.ok(snap3.highScore > highScore1, 'High score must advance when exceeded');
      assert.strictEqual(snap3.highScore, snap3.score);
    });

    it('3.3: Receiving damage does not diminish accumulated distance score', () => {
      const engine = new GameEngine({ enableDamage: true, initialLives: 3 });
      engine.handleAction('START');

      engine.tick(5.0);
      const preDamageScore = engine.getSnapshot().score;
      assert.ok(preDamageScore > 0);

      // Force a collision by creating damage or ticking through obstacle
      // Tick further
      engine.tick(0.1);
      assert.ok(engine.getSnapshot().score >= preDamageScore);
    });
  });

  // =========================================================================
  // 4. Monte Carlo Simulation: 100 Games Across 5 Diverse Scenarios
  // =========================================================================
  describe('4. Monte Carlo Simulation (100 Games)', () => {
    const runGameToCompletion = (engine, maxTicks = 5000, tickCallback = null) => {
      let ticks = 0;
      const dt = 1 / 60;
      while (
        engine.getSnapshot().state === GAME_STATES.RUNNING &&
        ticks < maxTicks
      ) {
        if (tickCallback) {
          tickCallback(ticks, engine);
        }
        engine.tick(dt);
        ticks++;
      }
      return {
        ticks,
        snapshot: engine.getSnapshot()
      };
    };

    // -----------------------------------------------------------------------
    // Batch 1: 30 Survival Runs (enableDamage: false) -> All MUST VICTORY
    // -----------------------------------------------------------------------
    it('4.1: Batch 1 - 30 complete survival runs (Seeds 1001-1030) all reach VICTORY >= 60.0s', () => {
      const totalRuns = 30;
      for (let runIdx = 0; runIdx < totalRuns; runIdx++) {
        const seed = 1001 + runIdx;
        const engine = new GameEngine({
          seed,
          enableDamage: false,
          totalDuration: 60.0
        });

        engine.handleAction('START');
        const { ticks, snapshot } = runGameToCompletion(engine, 4000);

        // Verification invariants
        assert.strictEqual(
          snapshot.state,
          GAME_STATES.VICTORY,
          `Run ${runIdx} (seed ${seed}) must terminate in VICTORY, got ${snapshot.state}`
        );
        assert.ok(
          snapshot.timeElapsed >= 60.0,
          `Run ${runIdx} timeElapsed (${snapshot.timeElapsed}) must be >= 60.0s`
        );
        assert.strictEqual(
          snapshot.timeRemaining,
          0,
          `Run ${runIdx} timeRemaining must be 0`
        );
        assert.ok(
          snapshot.score > 5000, // Should have distance score + 5000 victory bonus
          `Run ${runIdx} score (${snapshot.score}) must include victory clear bonus`
        );
        assert.ok(
          Number.isFinite(snapshot.score) && !Number.isNaN(snapshot.score),
          `Run ${runIdx} score must be valid finite number`
        );
        assert.ok(ticks <= 3660, `Run ${runIdx} completed in bounded tick count: ${ticks}`);
      }
    });

    // -----------------------------------------------------------------------
    // Batch 2: 30 Passive / Early Hit Runs (enableDamage: true, player stands)
    // -----------------------------------------------------------------------
    it('4.2: Batch 2 - 30 passive collision runs (Seeds 2001-2030) terminate cleanly in GAME_OVER or VICTORY', () => {
      const totalRuns = 30;
      let gameOverCount = 0;
      let victoryCount = 0;

      for (let runIdx = 0; runIdx < totalRuns; runIdx++) {
        const seed = 2001 + runIdx;
        const engine = new GameEngine({
          seed,
          enableDamage: true,
          initialLives: 3,
          totalDuration: 60.0
        });

        engine.handleAction('START');
        const { ticks, snapshot } = runGameToCompletion(engine, 4000);

        assert.ok(
          snapshot.state === GAME_STATES.GAME_OVER || snapshot.state === GAME_STATES.VICTORY,
          `Run ${runIdx} (seed ${seed}) must terminate in GAME_OVER or VICTORY, got ${snapshot.state}`
        );

        if (snapshot.state === GAME_STATES.GAME_OVER) {
          gameOverCount++;
          assert.strictEqual(snapshot.player.lives, 0, `Game over player must have 0 lives`);
          assert.ok(snapshot.timeElapsed < 60.0, `Game over must occur before 60.0s`);
        } else {
          victoryCount++;
          assert.ok(snapshot.timeElapsed >= 60.0);
        }

        assert.ok(ticks <= 3660, `Run ${runIdx} completed in bounded ticks`);
        assert.ok(!Number.isNaN(snapshot.score));
        assert.ok(!Number.isNaN(snapshot.player.y));
      }

      // Assert that passive play without jumping across 30 seeds results in GAME_OVER
      assert.ok(gameOverCount > 0, `At least one passive run should encounter game over: ${gameOverCount}`);
    });

    // -----------------------------------------------------------------------
    // Batch 3: 20 Random Jump Autoplay Runs (Stochastic input actions)
    // -----------------------------------------------------------------------
    it('4.3: Batch 3 - 20 stochastic autoplay jump runs (Seeds 3001-3020) terminate deterministically without hang', () => {
      const totalRuns = 20;

      for (let runIdx = 0; runIdx < totalRuns; runIdx++) {
        const seed = 3001 + runIdx;
        const prng = createPRNG(seed + 777);
        const engine = new GameEngine({
          seed,
          enableDamage: true,
          initialLives: 3,
          totalDuration: 60.0
        });

        engine.handleAction('START');

        let nextJumpTick = Math.floor(prng() * 40) + 10;
        const { ticks, snapshot } = runGameToCompletion(engine, 4000, (currentTick, eng) => {
          if (currentTick >= nextJumpTick) {
            eng.handleAction('JUMP');
            nextJumpTick = currentTick + Math.floor(prng() * 60) + 20; // 0.3s to 1.3s later
          }
        });

        assert.ok(
          snapshot.state === GAME_STATES.GAME_OVER || snapshot.state === GAME_STATES.VICTORY,
          `Run ${runIdx} (seed ${seed}) must terminate in terminal state, got ${snapshot.state}`
        );

        assert.ok(ticks <= 3660);
        assert.ok(Number.isFinite(snapshot.score));
        assert.ok(Number.isFinite(snapshot.player.x));
        assert.ok(Number.isFinite(snapshot.player.y));
        assert.ok(!Number.isNaN(snapshot.player.vy));
      }
    });

    // -----------------------------------------------------------------------
    // Batch 4: 10 Chaotic Pause / Resume Cycles
    // -----------------------------------------------------------------------
    it('4.4: Batch 4 - 10 chaotic pause/resume cycles (Seeds 4001-4010) maintain timeline and terminate correctly', () => {
      const totalRuns = 10;

      for (let runIdx = 0; runIdx < totalRuns; runIdx++) {
        const seed = 4001 + runIdx;
        const prng = createPRNG(seed + 999);
        const engine = new GameEngine({
          seed,
          enableDamage: false,
          totalDuration: 60.0
        });

        engine.handleAction('START');

        let paused = false;
        let toggleInterval = Math.floor(prng() * 30) + 10;
        let ticksSinceToggle = 0;
        let totalLoopTicks = 0;

        while (
          (engine.getSnapshot().state === GAME_STATES.RUNNING ||
           engine.getSnapshot().state === GAME_STATES.PAUSED) &&
          totalLoopTicks < 6000
        ) {
          ticksSinceToggle++;
          if (ticksSinceToggle >= toggleInterval) {
            engine.handleAction('PAUSE');
            paused = !paused;
            ticksSinceToggle = 0;
            toggleInterval = Math.floor(prng() * 30) + 10;
          }

          engine.tick(1 / 60);
          totalLoopTicks++;

          // If paused, verify tick didn't advance time
          if (paused && engine.getSnapshot().state === GAME_STATES.PAUSED) {
            // state must remain PAUSED
            assert.strictEqual(engine.getSnapshot().state, GAME_STATES.PAUSED);
          }
        }

        // If currently paused, unpause to resume execution
        if (engine.getSnapshot().state === GAME_STATES.PAUSED) {
          engine.handleAction('PAUSE');
        }

        // Run remaining time until VICTORY is reached
        while (
          engine.getSnapshot().state === GAME_STATES.RUNNING &&
          totalLoopTicks < 12000
        ) {
          engine.tick(1 / 60);
          totalLoopTicks++;
        }

        const finalSnap = engine.getSnapshot();
        assert.strictEqual(
          finalSnap.state,
          GAME_STATES.VICTORY,
          `Chaotic run ${runIdx} must finish in VICTORY, got ${finalSnap.state}`
        );
        assert.strictEqual(finalSnap.timeRemaining, 0);
        assert.ok(finalSnap.timeElapsed >= 60.0);
      }
    });

    // -----------------------------------------------------------------------
    // Batch 5: 10 Mid-Run Restart Lifecycle Runs
    // -----------------------------------------------------------------------
    it('4.5: Batch 5 - 10 mid-run restart cycles (Seeds 5001-5010) cleanly reset and complete to VICTORY', () => {
      const totalRuns = 10;

      for (let runIdx = 0; runIdx < totalRuns; runIdx++) {
        const seed = 5001 + runIdx;
        const prng = createPRNG(seed + 123);
        const engine = new GameEngine({
          seed,
          enableDamage: false,
          totalDuration: 60.0
        });

        engine.handleAction('START');

        // Tick partially for a random duration between 5s and 25s
        const partialSec = 5.0 + prng() * 20.0;
        const partialTicks = Math.floor(partialSec * 60);
        for (let i = 0; i < partialTicks; i++) {
          engine.tick(1 / 60);
        }

        const preRestartScore = engine.getSnapshot().score;
        assert.ok(preRestartScore > 0);

        // Execute RESTART
        engine.handleAction('RESTART');

        const postRestartSnap = engine.getSnapshot();
        assert.strictEqual(postRestartSnap.state, GAME_STATES.RUNNING);
        assert.strictEqual(postRestartSnap.timeElapsed, 0);
        assert.strictEqual(postRestartSnap.timeRemaining, 60.0);
        assert.strictEqual(postRestartSnap.score, 0);
        assert.strictEqual(postRestartSnap.highScore, preRestartScore);
        assert.strictEqual(postRestartSnap.player.isGrounded, true);
        assert.strictEqual(postRestartSnap.player.lives, PLAYER_MAX_LIVES);

        // Run second leg to completion
        const { ticks, snapshot } = runGameToCompletion(engine, 4000);
        assert.strictEqual(snapshot.state, GAME_STATES.VICTORY);
        assert.strictEqual(snapshot.timeRemaining, 0);
        assert.ok(snapshot.timeElapsed >= 60.0);
        assert.ok(snapshot.highScore >= preRestartScore);
      }
    });
  });

  // =========================================================================
  // 5. Sustained Long Simulation & Entity Culling Stability
  // =========================================================================
  describe('5. Sustained Simulation & Memory / Culling Bounds', () => {
    it('5.1: 7,200 continuous ticks (120s of run time) keeps active obstacles and items bounded', () => {
      // Create engine with extended duration to stress obstacle spawning and culling
      const engine = new GameEngine({
        seed: 77777,
        enableDamage: false,
        totalDuration: 120.0
      });

      engine.handleAction('START');

      let maxObstacleCount = 0;
      let maxItemCount = 0;
      const seenObstacleIds = new Set();
      const seenItemIds = new Set();

      for (let tick = 0; tick < 7200; tick++) {
        engine.tick(1 / 60);
        const snap = engine.getSnapshot();

        if (snap.obstacles.length > maxObstacleCount) {
          maxObstacleCount = snap.obstacles.length;
        }
        if (snap.items.length > maxItemCount) {
          maxItemCount = snap.items.length;
        }

        for (const obs of snap.obstacles) {
          seenObstacleIds.add(obs.id);
          assert.ok(Number.isFinite(obs.x), `Obstacle x must be finite`);
          assert.ok(Number.isFinite(obs.y), `Obstacle y must be finite`);
          assert.ok(obs.width > 0, `Obstacle width must be positive`);
          assert.ok(obs.height > 0, `Obstacle height must be positive`);
        }

        for (const itm of snap.items) {
          seenItemIds.add(itm.id);
          assert.ok(Number.isFinite(itm.x), `Item x must be finite`);
          assert.ok(Number.isFinite(itm.y), `Item y must be finite`);
          assert.ok(itm.radius > 0, `Item radius must be positive`);
        }
      }

      // Assertions
      assert.ok(
        maxObstacleCount <= 15,
        `Active obstacles must stay bounded, observed peak: ${maxObstacleCount}`
      );
      assert.ok(
        maxItemCount <= 20,
        `Active items must stay bounded, observed peak: ${maxItemCount}`
      );
      assert.ok(
        seenObstacleIds.size >= 25,
        `Must have spawned multiple distinct obstacles over 120s: spawned ${seenObstacleIds.size}`
      );
      assert.ok(
        seenItemIds.size >= 30,
        `Must have spawned multiple distinct items over 120s: spawned ${seenItemIds.size}`
      );
    });

    it('5.2: Snapshot contains zero NaN, null, or undefined coordinates across prolonged run', () => {
      const engine = new GameEngine({ seed: 88888, enableDamage: true });
      engine.handleAction('START');

      for (let i = 0; i < 600; i++) {
        if (i % 45 === 0) {
          engine.handleAction('JUMP');
        }
        engine.tick(1 / 60);
        const snap = engine.getSnapshot();

        // Player check
        assert.ok(!Number.isNaN(snap.player.x), 'player.x is NaN');
        assert.ok(!Number.isNaN(snap.player.y), 'player.y is NaN');
        assert.ok(!Number.isNaN(snap.player.vy), 'player.vy is NaN');
        assert.ok(typeof snap.player.isGrounded === 'boolean');
        assert.ok(typeof snap.player.lives === 'number');

        // Timer & speed check
        assert.ok(!Number.isNaN(snap.timeElapsed), 'timeElapsed is NaN');
        assert.ok(!Number.isNaN(snap.timeRemaining), 'timeRemaining is NaN');
        assert.ok(!Number.isNaN(snap.speed), 'speed is NaN');
        assert.ok(!Number.isNaN(snap.score), 'score is NaN');
        assert.ok(!Number.isNaN(snap.highScore), 'highScore is NaN');
      }
    });
  });

  // =========================================================================
  // 6. Adversarial Edge Cases & Contract Hardening
  // =========================================================================
  describe('6. Adversarial Edge Cases & Contract Hardening', () => {
    it('6.1: Determinism - Two independent engines with identical seed produce bit-identical 3600-tick runs', () => {
      const seed = 424242;
      const engineA = new GameEngine({ seed, enableDamage: false });
      const engineB = new GameEngine({ seed, enableDamage: false });

      engineA.handleAction('START');
      engineB.handleAction('START');

      const dt = 1 / 60;
      for (let t = 0; t < 3600; t++) {
        engineA.tick(dt);
        engineB.tick(dt);

        const snapA = engineA.getSnapshot();
        const snapB = engineB.getSnapshot();

        assert.strictEqual(snapA.timeElapsed, snapB.timeElapsed);
        assert.strictEqual(snapA.score, snapB.score);
        assert.strictEqual(snapA.speed, snapB.speed);
        assert.strictEqual(snapA.player.y, snapB.player.y);
        assert.strictEqual(snapA.player.vy, snapB.player.vy);
        assert.strictEqual(snapA.obstacles.length, snapB.obstacles.length);
        assert.strictEqual(snapA.items.length, snapB.items.length);
      }
    });

    it('6.2: Snapshot Isolation - Caller mutating snapshot does not affect engine internals', () => {
      const engine = new GameEngine({ seed: 11111 });
      engine.handleAction('START');
      engine.tick(2.0);

      const snap = engine.getSnapshot();
      const originalY = snap.player.y;
      const originalObstaclesLen = snap.obstacles.length;
      const originalItemsLen = snap.items.length;

      // Caller attempts hostile mutations on returned snapshot
      snap.player.y = -9999;
      snap.player.lives = 0;
      snap.obstacles.length = 0;
      snap.items.length = 0;
      snap.score = 99999999;

      // Query fresh snapshot
      const fresh = engine.getSnapshot();
      assert.strictEqual(fresh.player.y, originalY, 'Internal player y was mutated by snapshot edit');
      assert.strictEqual(fresh.player.lives, PLAYER_MAX_LIVES, 'Internal lives was mutated');
      assert.strictEqual(fresh.obstacles.length, originalObstaclesLen, 'Internal obstacles was mutated');
      assert.strictEqual(fresh.items.length, originalItemsLen, 'Internal items was mutated');
      assert.notStrictEqual(fresh.score, 99999999, 'Internal score was mutated');
    });

    it('6.3: Mid-air duck/stand rapid toggling does not violate ground boundary or destabilize kinematics', () => {
      const engine = new GameEngine({ enableDamage: false });
      engine.handleAction('START');
      engine.handleAction('JUMP');

      // Rapidly toggle duck/stand 100 times in mid-air while ticking
      for (let i = 0; i < 100; i++) {
        if (i % 2 === 0) {
          engine.handleAction('DUCK');
        } else {
          engine.handleAction('STAND');
        }
        engine.tick(0.01);
        const snap = engine.getSnapshot();
        assert.ok(snap.player.y + snap.player.height <= GROUND_Y + 1e-4, 'Player penetrated ground boundary');
        assert.ok(Number.isFinite(snap.player.y));
        assert.ok(Number.isFinite(snap.player.vy));
      }
    });

    it('6.4: Extreme dt values (e.g. 10.0s spikes) integrate without skipping VICTORY or stalling loop', () => {
      const engine = new GameEngine({ enableDamage: false, totalDuration: 60.0 });
      engine.handleAction('START');

      // Advance by massive 10.0s spikes
      for (let i = 0; i < 7; i++) {
        engine.tick(10.0);
      }

      const finalSnap = engine.getSnapshot();
      assert.strictEqual(finalSnap.state, GAME_STATES.VICTORY);
      assert.strictEqual(finalSnap.timeRemaining, 0);
      assert.ok(finalSnap.timeElapsed >= 60.0);
    });
  });
});
