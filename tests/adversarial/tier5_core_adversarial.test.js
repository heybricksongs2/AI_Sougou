/**
 * tests/adversarial/tier5_core_adversarial.test.js
 * Milestone 3 Phase 2: Tier 5 Core Adversarial Coverage Hardening
 *
 * White-box adversarial testing suite targeting src/core/:
 * - constants.js
 * - EventBus.js
 * - StateMachine.js
 * - Player.js
 * - ObstacleManager.js
 * - ItemManager.js
 * - Collision.js
 * - ScoreManager.js
 * - GameEngine.js
 *
 * Uses node:test and node:assert/strict.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { GameEngine } from '../../src/core/GameEngine.js';
import { Player } from '../../src/core/Player.js';
import { StateMachine, GAME_STATES } from '../../src/core/StateMachine.js';
import { EventBus } from '../../src/core/EventBus.js';
import { ObstacleManager, createPRNG } from '../../src/core/ObstacleManager.js';
import { ItemManager } from '../../src/core/ItemManager.js';
import { ScoreManager } from '../../src/core/ScoreManager.js';
import {
  checkAABBCollision,
  checkSweptAABB,
  checkCircleAABBCollision,
  getContractedBox
} from '../../src/core/Collision.js';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  GAME_DURATION,
  INITIAL_SPEED,
  MAX_SPEED,
  GRAVITY,
  JUMP_INITIAL_VELOCITY,
  TERMINAL_VELOCITY,
  SHORT_HOP_CUTOFF_VELOCITY,
  PLAYER_START_X,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_DUCK_WIDTH,
  PLAYER_DUCK_HEIGHT,
  PLAYER_MAX_LIVES,
  INVULNERABILITY_DURATION,
  JUMP_BUFFER_WINDOW,
  COYOTE_TIME_WINDOW,
  OBSTACLE_TYPES,
  ITEM_TYPES,
  ACTIONS
} from '../../src/core/constants.js';

describe('Tier 5 Adversarial Coverage Hardening Suite', () => {

  // =========================================================================
  // Suite 1: Numerical Drift & Time Accumulation Invariants
  // =========================================================================
  describe('Suite 1: Numerical Drift & Time Accumulation Invariants', () => {

    it('1.1: Micro-step integration drift test (12,000 sub-steps) does not diverge', () => {
      // Use enableDamage: false to isolate mathematical drift without obstacle mortality
      const engine = new GameEngine({ totalDuration: 60.0, enableDamage: false });
      engine.handleAction('START');

      const microDt = 0.005; // 200 Hz
      const totalSteps = 12000; // 60.0 seconds
      for (let i = 0; i < totalSteps; i++) {
        engine.tick(microDt);
        if (engine.getSnapshot().state === GAME_STATES.VICTORY) break;
      }

      const snap = engine.getSnapshot();
      assert.strictEqual(snap.state, GAME_STATES.VICTORY, 'Should reach victory cleanly');
      assert.strictEqual(snap.timeRemaining, 0, 'timeRemaining must clamp exactly to 0');
      assert.ok(Math.abs(snap.timeElapsed - 60.0) < 0.05, `timeElapsed must be ~60.0s, got ${snap.timeElapsed}`);
      assert.strictEqual(snap.speed, MAX_SPEED, 'Speed at 60s must reach MAX_SPEED');
      assert.ok(Number.isFinite(snap.score), 'Score must remain finite');
      assert.ok(!Number.isNaN(snap.score), 'Score must not be NaN');
    });

    it('1.2: Variable delta time jitter over 60s run reaches victory reliably', () => {
      // Use enableDamage: false to isolate variable timestep integration
      const engine = new GameEngine({ totalDuration: 60.0, enableDamage: false });
      engine.handleAction('START');

      const dtJitterPattern = [0.00833, 0.01667, 0.03333, 0.005, 0.02, 0.0125];
      let stepIndex = 0;
      let totalPushedDt = 0;

      while (engine.getSnapshot().state === GAME_STATES.RUNNING && totalPushedDt < 70) {
        const dt = dtJitterPattern[stepIndex % dtJitterPattern.length];
        engine.tick(dt);
        totalPushedDt += dt;
        stepIndex++;
      }

      const finalSnap = engine.getSnapshot();
      assert.strictEqual(finalSnap.state, GAME_STATES.VICTORY, 'Jittered dt must reach victory');
      assert.strictEqual(finalSnap.timeRemaining, 0);
      assert.strictEqual(finalSnap.speed, MAX_SPEED);
    });

    it('1.3: Snapshot numeric format invariants (2-decimal precision, never negative)', () => {
      const engine = new GameEngine({ totalDuration: 10.0 });
      engine.handleAction('START');

      for (let i = 0; i < 600; i++) {
        engine.tick(1 / 60);
        const snap = engine.getSnapshot();

        assert.strictEqual(typeof snap.timeRemaining, 'number');
        assert.strictEqual(typeof snap.timeElapsed, 'number');
        assert.ok(snap.timeRemaining >= 0, `timeRemaining must be >= 0, got ${snap.timeRemaining}`);
        assert.ok(snap.timeElapsed >= 0, `timeElapsed must be >= 0, got ${snap.timeElapsed}`);
        assert.ok(!Object.is(snap.timeRemaining, -0), 'timeRemaining must never be -0');
        assert.ok(!Object.is(snap.timeElapsed, -0), 'timeElapsed must never be -0');

        // Check 2-decimal precision round-trip
        const remStr = snap.timeRemaining.toFixed(2);
        assert.strictEqual(Number(remStr), snap.timeRemaining);
      }
    });

    it('1.4: Speed progression monotonicity across entire run', () => {
      const engine = new GameEngine({ totalDuration: 60.0, enableDamage: false });
      engine.handleAction('START');

      let prevSpeed = engine.getSnapshot().speed;
      assert.strictEqual(prevSpeed, INITIAL_SPEED);

      for (let i = 0; i < 3600; i++) {
        engine.tick(1 / 60);
        const currSpeed = engine.getSnapshot().speed;
        assert.ok(
          currSpeed >= prevSpeed,
          `Speed must be monotonic non-decreasing: prev ${prevSpeed}, curr ${currSpeed}`
        );
        assert.ok(currSpeed <= MAX_SPEED, `Speed cannot exceed MAX_SPEED: ${currSpeed}`);
        prevSpeed = currSpeed;
      }

      assert.strictEqual(prevSpeed, MAX_SPEED);
    });
  });

  // =========================================================================
  // Suite 2: Extreme Delta Time (dt) & Pathological Input Clamping
  // =========================================================================
  describe('Suite 2: Extreme Delta Time (dt) & Pathological Input Clamping', () => {

    it('2.1: Single massive dt spike (dt = 500.0s) clamps safely without stalling or hanging', () => {
      const engine = new GameEngine({ totalDuration: 60.0 });
      engine.handleAction('START');

      const startTime = Date.now();
      const snap = engine.tick(500.0);
      const elapsedMs = Date.now() - startTime;

      assert.ok(elapsedMs < 1000, `Execution took ${elapsedMs}ms, should complete in < 1000ms`);
      assert.ok(
        snap.state === GAME_STATES.VICTORY || snap.state === GAME_STATES.GAME_OVER,
        `Expected VICTORY or GAME_OVER after 500s spike, got ${snap.state}`
      );
    });

    it('2.2: Pathological tick inputs (negative, NaN, strings, null, undefined, Infinity)', () => {
      const engine = new GameEngine();
      engine.handleAction('START');
      const baseline = engine.getSnapshot();

      const pathologicalValues = [
        0,
        -1,
        -0.0001,
        -Infinity,
        Infinity,
        NaN,
        null,
        undefined,
        '0.016',
        '',
        {},
        [],
        () => 0.016
      ];

      for (const badDt of pathologicalValues) {
        const snap = engine.tick(badDt);
        assert.strictEqual(snap.timeElapsed, baseline.timeElapsed);
        assert.strictEqual(snap.timeRemaining, baseline.timeRemaining);
        assert.strictEqual(snap.state, GAME_STATES.RUNNING);
        assert.strictEqual(snap.score, baseline.score);
      }
    });

    it('2.3: Core sub-modules handle invalid dt and speed safely', () => {
      const score = new ScoreManager();
      score.update(-100, -1);
      score.update(NaN, 0.016);
      score.update(300, NaN);
      score.update(300, -0.5);
      score.update(0, 0.016);
      assert.strictEqual(score.score, 0);
      assert.strictEqual(score.distance, 0);

      const player = new Player();
      const initialY = player.y;
      player.update(0);
      player.update(-1);
      player.update(NaN);
      player.update(Infinity);
      assert.strictEqual(player.y, initialY);

      const obsMgr = new ObstacleManager();
      obsMgr.update(0, 300);
      obsMgr.update(-1, 300);
      obsMgr.update(NaN, 300);
      obsMgr.update(0.016, -500);
      assert.strictEqual(obsMgr.getObstacles().length, 0);

      const itemMgr = new ItemManager();
      itemMgr.update(0, 300);
      itemMgr.update(-1, 300);
      itemMgr.update(NaN, 300);
      assert.strictEqual(itemMgr.getItems().length, 0);
    });
  });

  // =========================================================================
  // Suite 3: State Machine Edge Transitions & Action Injection Attacks
  // =========================================================================
  describe('Suite 3: State Machine Edge Transitions & Action Injection Attacks', () => {

    it('3.1: Illegal actions in non-RUNNING states are strictly rejected without side effects', () => {
      const nonRunningStates = [GAME_STATES.INIT, GAME_STATES.PAUSED, GAME_STATES.VICTORY];

      for (const state of nonRunningStates) {
        const engine = new GameEngine();

        if (state === GAME_STATES.PAUSED) {
          engine.handleAction('START');
          engine.handleAction('PAUSE');
        } else if (state === GAME_STATES.VICTORY) {
          engine.handleAction('START');
          engine.tick(61.0);
        }

        if (engine.getSnapshot().state === state) {
          const preSnap = engine.getSnapshot();

          // Attempt JUMP
          engine.handleAction('JUMP');
          let postSnap = engine.getSnapshot();
          assert.strictEqual(postSnap.player.y, preSnap.player.y, `y should not change on JUMP in ${state}`);
          assert.strictEqual(postSnap.player.vy, preSnap.player.vy, `vy should not change on JUMP in ${state}`);

          // Attempt DUCK
          engine.handleAction('DUCK');
          postSnap = engine.getSnapshot();
          assert.strictEqual(postSnap.player.height, preSnap.player.height, `height should not change on DUCK in ${state}`);

          // Attempt STAND
          engine.handleAction('STAND');
          postSnap = engine.getSnapshot();
          assert.strictEqual(postSnap.player.height, preSnap.player.height, `height should not change on STAND in ${state}`);
        }
      }
    });

    it('3.2: Chaotic action fuzzing with 1,000 rapid random actions does not throw or corrupt state', () => {
      const engine = new GameEngine();
      const possibleActions = [
        'START', 'JUMP', 'DUCK', 'STAND', 'PAUSE', 'RESTART',
        'UNKNOWN', '', null, undefined, 123, -1, {}, [], true, false,
        'jump', 'start', 'pause', 'duck', 'stand' // lowercase variant fuzz
      ];

      const prng = createPRNG(98765);

      assert.doesNotThrow(() => {
        for (let i = 0; i < 1000; i++) {
          const action = possibleActions[Math.floor(prng() * possibleActions.length)];
          const snap = engine.handleAction(action);

          assert.ok(snap, 'handleAction must always return snapshot');
          assert.ok(
            Object.values(GAME_STATES).includes(snap.state),
            `State must be valid GAME_STATES, got ${snap.state}`
          );

          // Interleave occasional physics ticks
          if (i % 5 === 0) {
            engine.tick(1 / 60);
          }
        }
      });
    });

    it('3.3: Zero and negative initial lives game start transitions immediately to GAME_OVER', () => {
      const zeroLivesEngine = new GameEngine({ initialLives: 0 });
      assert.strictEqual(zeroLivesEngine.getSnapshot().player.lives, 0);

      let gameOverEmitted = false;
      let reasonEmitted = null;
      zeroLivesEngine.on('game_over', (data) => {
        gameOverEmitted = true;
        reasonEmitted = data.reason;
      });

      zeroLivesEngine.handleAction('START');
      const snap = zeroLivesEngine.getSnapshot();

      // GAP / BUG TARGET:
      // In src/core/GameEngine.js:126, if lives <= 0, GameEngine calls:
      //   this.#stateMachine.transition(GAME_STATES.GAME_OVER)
      // However, StateMachine only permits INIT -> [RUNNING].
      // Thus, transition fails and state machine remains stuck in INIT,
      // despite game_over event being emitted with reason: 'no_lives'!
      assert.strictEqual(gameOverEmitted, true, 'game_over event must be emitted');
      assert.strictEqual(reasonEmitted, 'no_lives', 'game_over reason must be no_lives');
      assert.strictEqual(
        snap.state,
        GAME_STATES.GAME_OVER,
        'GameEngine state must transition to GAME_OVER when started with 0 lives'
      );
    });

    it('3.4: RESTART transitions cleanly to RUNNING from any state', () => {
      const targetStates = [GAME_STATES.INIT, GAME_STATES.RUNNING, GAME_STATES.PAUSED, GAME_STATES.VICTORY];

      for (const st of targetStates) {
        const engine = new GameEngine({ totalDuration: 5.0 });
        if (st === GAME_STATES.RUNNING) {
          engine.handleAction('START');
        } else if (st === GAME_STATES.PAUSED) {
          engine.handleAction('START');
          engine.handleAction('PAUSE');
        } else if (st === GAME_STATES.VICTORY) {
          engine.handleAction('START');
          engine.tick(6.0);
        }

        assert.strictEqual(engine.getSnapshot().state, st);

        // Perform RESTART
        let gameStartFired = false;
        engine.on('game_start', () => { gameStartFired = true; });

        engine.handleAction('RESTART');
        const snap = engine.getSnapshot();
        assert.strictEqual(snap.state, GAME_STATES.RUNNING, `Should be RUNNING after RESTART from ${st}`);
        assert.strictEqual(snap.timeElapsed, 0);
        assert.strictEqual(snap.timeRemaining, 5.0);
        assert.strictEqual(snap.player.lives, PLAYER_MAX_LIVES);
        assert.strictEqual(gameStartFired, true);
      }
    });
  });

  // =========================================================================
  // Suite 4: Player Kinematics, Ducking & Hitbox Geometry Under Stress
  // =========================================================================
  describe('Suite 4: Player Kinematics, Ducking & Hitbox Geometry Under Stress', () => {

    it('4.1: Ducking while mid-air modifies dimensions, landing resolves y correctly', () => {
      const player = new Player({ groundY: 440 });
      player.jump(); // Airborne launch vy = -850

      // Advance into air
      player.update(0.1);
      assert.strictEqual(player.isGrounded, false);
      const preDuckY = player.y;

      // Duck mid-air
      player.duck();
      assert.strictEqual(player.isDucking, true);
      assert.strictEqual(player.width, PLAYER_DUCK_WIDTH);
      assert.strictEqual(player.height, PLAYER_DUCK_HEIGHT);
      assert.strictEqual(player.y, preDuckY, 'Airborne duck should not snap y to ground');

      // Free-fall until landing
      for (let i = 0; i < 120; i++) {
        player.update(1 / 60);
      }

      assert.strictEqual(player.isGrounded, true, 'Player should land');
      assert.strictEqual(player.y, 440 - PLAYER_DUCK_HEIGHT, 'Landed y must equal groundY - duckHeight');
      assert.strictEqual(player.vy, 0, 'Landed vy must be 0');
    });

    it('4.2: Ducking then jumping while ducking preserves duck status until stand is called', () => {
      const player = new Player({ groundY: 440 });
      player.duck();
      assert.strictEqual(player.isDucking, true);
      assert.strictEqual(player.y, 440 - PLAYER_DUCK_HEIGHT);

      const jumped = player.jump();
      assert.strictEqual(jumped, true);
      assert.strictEqual(player.isGrounded, false);
      assert.strictEqual(player.isDucking, true);
      assert.strictEqual(player.height, PLAYER_DUCK_HEIGHT);

      // Stand up mid-jump
      player.stand();
      assert.strictEqual(player.isDucking, false);
      assert.strictEqual(player.height, PLAYER_HEIGHT);
    });

    it('4.3: Rapid 100-cycle duck/stand toggling remains strictly at ground contact baseline', () => {
      const player = new Player({ groundY: 440 });
      assert.strictEqual(player.y, 440 - PLAYER_HEIGHT);

      for (let i = 0; i < 100; i++) {
        player.duck();
        assert.strictEqual(player.y, 440 - PLAYER_DUCK_HEIGHT);
        player.stand();
        assert.strictEqual(player.y, 440 - PLAYER_HEIGHT);
      }
    });

    it('4.4: Short hop cutoff clamps upward velocity accurately without disturbing downward fall', () => {
      const player = new Player();
      player.jump();
      assert.strictEqual(player.vy, JUMP_INITIAL_VELOCITY); // -850

      player.releaseJump();
      assert.strictEqual(player.vy, SHORT_HOP_CUTOFF_VELOCITY, 'vy should clamp to -300');

      // Release jump when vy is already slower upward than -300
      player.vy = -150;
      player.releaseJump();
      assert.strictEqual(player.vy, -150, 'vy should remain -150');

      // Release jump while falling
      player.vy = 400;
      player.releaseJump();
      assert.strictEqual(player.vy, 400, 'vy should remain 400 when falling');
    });

    it('4.5: Exact boundary verification for Jump Buffer (0.12s) and Coyote Time (0.08s)', () => {
      // Jump buffer test
      const p1 = new Player({ groundY: 440 });
      p1.jump(); // Airborne
      p1.update(0.05);
      p1.update(0.05); // Mid-air, descending

      // Buffer jump at 0.12s
      p1.jump();
      assert.strictEqual(p1.jumpBufferTimer, JUMP_BUFFER_WINDOW);

      // Advance by 0.14s using two 0.07s steps (<= MAX_DELTA_TIME 0.1s to avoid cap)
      p1.update(0.07);
      p1.update(0.07);
      assert.strictEqual(p1.jumpBufferTimer, 0, 'Buffer should expire after 0.14s');

      // Coyote time boundary test
      const p2 = new Player({ groundY: 440 });
      p2.update(0.016); // Prime coyote timer
      assert.strictEqual(p2.coyoteTimer, COYOTE_TIME_WINDOW);

      // Drop ground to simulate stepping off ledge
      p2.groundY = 540;
      p2.update(0.05); // 0.05s in air < 0.08s window
      assert.strictEqual(p2.isGrounded, false);
      assert.ok(p2.coyoteTimer > 0);

      // Jump should succeed
      const jumped = p2.jump();
      assert.strictEqual(jumped, true, 'Jump must succeed within coyote window');
      assert.strictEqual(p2.coyoteTimer, 0, 'Coyote timer must reset upon jump');
    });

    it('4.6: Hitbox contracted geometry invariants', () => {
      const player = new Player();

      // Standing hitbox
      const standHitbox = player.getHitbox();
      const standBounds = player.getBounds();
      assert.ok(standHitbox.width < standBounds.width);
      assert.ok(standHitbox.height < standBounds.height);
      assert.strictEqual(standHitbox.x, standBounds.x + 6);
      assert.strictEqual(standHitbox.y, standBounds.y + 4);

      // Ducking hitbox
      player.duck();
      const duckHitbox = player.getHitbox();
      const duckBounds = player.getBounds();
      assert.ok(duckHitbox.width < duckBounds.width);
      assert.ok(duckHitbox.height < duckBounds.height);
      assert.strictEqual(duckHitbox.x, duckBounds.x + 6);
      assert.strictEqual(duckHitbox.y, duckBounds.y + 3);
    });

    it('4.7: Running under HIGH_OBSTACLE avoids collision, but jumping into it hits', () => {
      // Ground level 440. Player height 60 -> y = 380..440.
      // HIGH_OBSTACLE: y = groundY - 120 = 320, height = 36 -> y = 320..356.
      const groundY = 440;
      const player = new Player({ groundY });
      const standingHitbox = player.getHitbox(); // y: 384, height: 52 -> bottom: 436

      const highObs = {
        x: player.x,
        y: groundY - 120, // 320
        width: 48,
        height: 36,
        getHitbox() {
          return {
            x: this.x + 4,
            y: this.y + 4,
            width: this.width - 8,
            height: this.height - 8
          };
        }
      };

      // 1. Standing on ground: NO collision with HIGH_OBSTACLE
      assert.strictEqual(
        checkAABBCollision(standingHitbox, highObs.getHitbox()),
        false,
        'Standing player must pass safely under HIGH_OBSTACLE'
      );

      // 2. Ducking on ground: NO collision
      player.duck();
      assert.strictEqual(
        checkAABBCollision(player.getHitbox(), highObs.getHitbox()),
        false,
        'Ducking player must pass safely under HIGH_OBSTACLE'
      );
      player.stand();

      // 3. Player jumps into air: at apex (y ~ 241), intersects HIGH_OBSTACLE
      player.jump();
      for (let i = 0; i < 20; i++) {
        player.update(1 / 60); // Advance to apex area (around y=241..320)
        if (checkAABBCollision(player.getHitbox(), highObs.getHitbox())) {
          break;
        }
      }
      assert.strictEqual(
        checkAABBCollision(player.getHitbox(), highObs.getHitbox()),
        true,
        'Jumping into HIGH_OBSTACLE must register collision'
      );
    });
  });

  // =========================================================================
  // Suite 5: Continuous Swept AABB & Ray Cast Extremes
  // =========================================================================
  describe('Suite 5: Continuous Swept AABB & Ray Cast Extremes', () => {

    it('5.1: Negative relative velocity symmetry in checkSweptAABB', () => {
      const boxA = { x: 100, y: 100, width: 50, height: 50 };
      const boxB = { x: 300, y: 100, width: 50, height: 50 };

      // Moving left at 400 px/s over dt = 0.5s -> dx = -200 (reaches x=100)
      const hitLeft = checkSweptAABB(boxA, boxB, -400, 0, 0.5);
      assert.strictEqual(hitLeft, true, 'Moving left should collide with boxA');

      // Moving right away from boxA
      const missRight = checkSweptAABB(boxA, boxB, 400, 0, 0.5);
      assert.strictEqual(missRight, false, 'Moving right away from boxA should not collide');
    });

    it('5.2: Stationary or axis-aligned zero-velocity ray cast branches in checkSweptAABB', () => {
      const boxA = { x: 100, y: 100, width: 50, height: 50 };
      const boxB = { x: 100, y: 300, width: 50, height: 50 };

      // Horizontal velocity is 0, vertical is moving up
      const hitVertical = checkSweptAABB(boxA, boxB, 0, -400, 0.5);
      assert.strictEqual(hitVertical, true, 'Vertical upward sweep should collide');

      // Neither velocity component moving
      const noVel = checkSweptAABB(boxA, boxB, 0, 0, 1.0);
      assert.strictEqual(noVel, false, 'Zero velocity should not collide if not overlapping initially');
    });

    it('5.3: Grazing clearance (0.001px) vs minimal intersection (0.001px)', () => {
      const boxA = { x: 100, y: 100, width: 50, height: 50 };
      // boxB passes right beside boxA without touching
      const boxBGraze = { x: 150.001, y: 0, width: 50, height: 50 };
      const missGraze = checkSweptAABB(boxA, boxBGraze, 0, 200, 1.0);
      assert.strictEqual(missGraze, false, 'Grazing with 0.001px clearance should not collide');

      // boxB overlaps by 0.001px
      const boxBOverlap = { x: 149.999, y: 0, width: 50, height: 50 };
      const hitOverlap = checkSweptAABB(boxA, boxBOverlap, 0, 200, 1.0);
      assert.strictEqual(hitOverlap, true, '0.001px overlap sweep should collide');
    });

    it('5.4: Hyper-velocity bullet (100,000 px/s) tunneling prevention', () => {
      const target = { x: 500, y: 100, width: 20, height: 20 };
      const bullet = { x: 0, y: 100, width: 5, height: 5 };

      // Bullet travels 1600px in one 1/60s frame, jumping straight over x=500
      const collides = checkSweptAABB(target, bullet, 100000, 0, 1 / 60);
      assert.strictEqual(collides, true, 'Swept AABB must catch high-speed tunneling bullet');
    });
  });

  // =========================================================================
  // Suite 6: EventBus Hardening & Error Containment
  // =========================================================================
  describe('Suite 6: EventBus Hardening & Error Containment', () => {

    it('6.1: Listener throwing error does not halt other listeners or crash emit()', () => {
      const bus = new EventBus();
      let listener2Fired = false;
      let listener3Fired = false;

      bus.on('test', () => {
        throw new Error('Explosion in listener 1');
      });
      bus.on('test', () => {
        listener2Fired = true;
      });
      bus.on('test', () => {
        listener3Fired = true;
      });

      assert.doesNotThrow(() => {
        bus.emit('test');
      });

      assert.strictEqual(listener2Fired, true);
      assert.strictEqual(listener3Fired, true);
    });

    it('6.2: Listener mutating listeners during emit() executes safely', () => {
      const bus = new EventBus();
      let l2Called = false;
      let l3Called = false;

      const l1 = () => {
        // Remove l2 during dispatch
        bus.off('test', l2);
        // Register new listener during dispatch
        bus.on('test', () => { l3Called = true; });
      };

      const l2 = () => {
        l2Called = true;
      };

      bus.on('test', l1);
      bus.on('test', l2);

      assert.doesNotThrow(() => {
        bus.emit('test');
      });

      // Defensive copying ensures l2 is called or removed safely without crash
      assert.strictEqual(bus.listenerCount('test'), 2); // l1 + l3
    });

    it('6.3: once() listener self-deregisters even when callback throws', () => {
      const bus = new EventBus();
      bus.once('fail', () => {
        throw new Error('One-time failure');
      });

      assert.strictEqual(bus.listenerCount('fail'), 1);
      bus.emit('fail');
      assert.strictEqual(bus.listenerCount('fail'), 0, 'once() listener must be removed after firing');
    });

    it('6.4: Passing invalid argument types to on/off/once/clear/listenerCount', () => {
      const bus = new EventBus();

      assert.doesNotThrow(() => {
        const unsub1 = bus.on(null, null);
        unsub1();
        const unsub2 = bus.once(undefined, {});
        unsub2();
        assert.strictEqual(bus.off(123, null), false);
        assert.strictEqual(bus.listenerCount(null), 0);
        bus.clear(null);
        bus.clear();
      });
    });
  });

  // =========================================================================
  // Suite 7: Procedural Obstacle & Item Determinism & Culling Bounds
  // =========================================================================
  describe('Suite 7: Procedural Obstacle & Item Determinism & Culling Bounds', () => {

    it('7.1: Deterministic Mulberry32 produces identical sequence across separate runs', () => {
      const prng1 = createPRNG(4242);
      const prng2 = createPRNG(4242);

      for (let i = 0; i < 5000; i++) {
        assert.strictEqual(prng1(), prng2(), `Mismatch at iteration ${i}`);
      }
    });

    it('7.2: Long-duration simulation (120 seconds) maintains bounded entity memory (no leaks)', () => {
      const engine = new GameEngine({
        totalDuration: 120.0,
        enableDamage: false // Allow run to survive without death
      });
      engine.handleAction('START');

      for (let i = 0; i < 7200; i++) {
        engine.tick(1 / 60);
        const snap = engine.getSnapshot();

        // Check active obstacle count bounds
        assert.ok(
          snap.obstacles.length < 15,
          `Obstacles array leaked: ${snap.obstacles.length} active`
        );

        // Check active item count bounds
        assert.ok(
          snap.items.length < 25,
          `Items array leaked: ${snap.items.length} active`
        );
      }
    });

    it('7.3: Item collection single-shot invariant: bonus awarded exactly once', () => {
      const engine = new GameEngine();
      engine.handleAction('START');

      let itemCollectedEvents = 0;
      engine.on('item_collected', () => {
        itemCollectedEvents++;
      });

      // Advance until first item spawned and collected
      for (let i = 0; i < 600; i++) {
        engine.tick(1 / 60);
      }

      const snap = engine.getSnapshot();
      const collectedItems = snap.items.filter(item => item.collected);

      if (collectedItems.length > 0) {
        assert.strictEqual(
          itemCollectedEvents,
          collectedItems.length,
          'item_collected event count must exactly match number of collected items'
        );
      }
    });
  });

  // =========================================================================
  // Suite 8: Full Engine Adversarial Invariants & Contract Verification
  // =========================================================================
  describe('Suite 8: Full Engine Adversarial Invariants & Contract Verification', () => {

    it('8.1: Snapshot immutability: mutating returned snapshot does not corrupt engine state', () => {
      const engine = new GameEngine();
      engine.handleAction('START');
      engine.tick(0.5);

      const snap1 = engine.getSnapshot();
      // Attempt mutation of snapshot properties
      snap1.score = 999999;
      snap1.state = 'CORRUPTED';
      snap1.player.x = -9999;
      snap1.player.lives = 0;
      if (snap1.obstacles.length > 0) snap1.obstacles[0].x = 0;
      if (snap1.items.length > 0) snap1.items[0].collected = true;

      const snap2 = engine.getSnapshot();
      assert.strictEqual(snap2.state, GAME_STATES.RUNNING);
      assert.notStrictEqual(snap2.score, 999999);
      assert.strictEqual(snap2.player.x, PLAYER_START_X);
      assert.strictEqual(snap2.player.lives, PLAYER_MAX_LIVES);
    });

    it('8.2: Concurrent isolated engines remain strictly independent', () => {
      const engines = Array.from({ length: 10 }, (_, i) => new GameEngine({ seed: i * 100 + 1 }));

      for (const e of engines) {
        e.handleAction('START');
      }

      // Step each engine with different dt
      for (let step = 0; step < 100; step++) {
        for (let i = 0; i < engines.length; i++) {
          engines[i].tick((i + 1) * 0.005);
        }
      }

      // Verify states are distinct and uncorrupted
      for (let i = 0; i < engines.length; i++) {
        const snap = engines[i].getSnapshot();
        assert.strictEqual(snap.state, GAME_STATES.RUNNING);
        assert.ok(snap.timeElapsed > 0);
      }
    });

    it('8.3: Custom configuration boundary limits', () => {
      const customEngine = new GameEngine({
        canvasWidth: 1280,
        canvasHeight: 720,
        groundY: 600,
        initialSpeed: 400,
        maxSpeed: 800,
        totalDuration: 30.0,
        initialLives: 5,
        initialHighScore: 10000,
        enableDamage: false // Isolate config limits without player death
      });

      assert.strictEqual(customEngine.getSnapshot().highScore, 10000);
      assert.strictEqual(customEngine.getSnapshot().player.lives, 5);

      customEngine.handleAction('START');
      customEngine.tick(31.0);

      const endSnap = customEngine.getSnapshot();
      assert.strictEqual(endSnap.state, GAME_STATES.VICTORY);
      assert.strictEqual(endSnap.speed, 800);
      assert.strictEqual(endSnap.timeRemaining, 0);
    });
  });
});
