/**
 * tests/adversarial/empirical_challenge_harness.test.js
 * Empirical Challenger Verification Harness for Headless Simulation Core (Milestone 1)
 *
 * Explicitly stress-tests:
 * 1. Rapid jump buffering and coyote time edge timings
 * 2. Extreme dt inputs (dt = 0, negative dt, dt = 10.0s spikes, dt = 0.0001s micro-ticks, pathological values)
 * 3. High-velocity tunneling checks against thin obstacles (Continuous Swept AABB & Discrete Sub-stepping)
 * 4. Exact collision boundary intersection precision (Sub-pixel, zero-area touching, degenerate boxes, Circle-AABB)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../../src/core/GameEngine.js';
import { Player } from '../../src/core/Player.js';
import {
  checkAABBCollision,
  checkSweptAABB,
  checkCircleAABBCollision,
  getContractedBox
} from '../../src/core/Collision.js';
import {
  CANVAS_WIDTH,
  GROUND_Y,
  PLAYER_START_X,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  GRAVITY,
  JUMP_INITIAL_VELOCITY,
  TERMINAL_VELOCITY,
  JUMP_BUFFER_WINDOW,
  COYOTE_TIME_WINDOW,
  SHORT_HOP_CUTOFF_VELOCITY,
  MAX_SPEED
} from '../../src/core/constants.js';

describe('Empirical Challenger Harness: Milestone 1 Physics & Collision', () => {

  // =========================================================================
  // Challenge Area 1: Rapid Jump Buffering & Coyote Time Edge Timings
  // =========================================================================
  describe('Area 1: Rapid Jump Buffering & Coyote Time Edge Timings', () => {

    it('1.1: Coyote Time - Jump succeeds within coyote window when falling off ground', () => {
      // Create player with ground level at 440
      const player = new Player({ groundY: 440 });
      assert.strictEqual(player.isGrounded, true);
      // Simulate running on ground for 1 frame to establish grounded baseline
      player.update(1 / 60);
      assert.strictEqual(player.isGrounded, true);
      assert.strictEqual(player.coyoteTimer, COYOTE_TIME_WINDOW, 'Coyote timer should be primed while grounded');

      // Player steps off a ledge: simulate by dropping groundY to 540
      player.groundY = 540;
      // In first frame of becoming airborne without jumping
      player.update(0.01);
      assert.strictEqual(player.isGrounded, false, 'Player should now be airborne');
      assert.ok(player.coyoteTimer > 0, `Coyote timer should be active, got ${player.coyoteTimer}`);

      // Advance by 0.05s (total 0.06s in air < 0.08s window)
      player.update(0.05);
      assert.ok(player.coyoteTimer > 0, `Coyote timer should still be positive, got ${player.coyoteTimer}`);

      // Trigger jump during coyote grace period
      const jumped = player.jump();
      assert.strictEqual(jumped, true, 'Jump must succeed during coyote window');
      assert.strictEqual(player.vy, JUMP_INITIAL_VELOCITY, 'Vertical velocity should be launched upward');
      assert.strictEqual(player.coyoteTimer, 0, 'Coyote timer must be consumed immediately');

      // Attempting immediate second jump in air must be rejected
      const secondJump = player.jump();
      assert.strictEqual(secondJump, false, 'Second jump in air must be rejected');
    });

    it('1.2: Coyote Time - Jump is rejected/buffered after coyote window expires', () => {
      const player = new Player({ groundY: 440 });
      player.groundY = 540; // drop ledge
      player.update(0.01); // airborne, coyote timer active

      // Advance past coyote window (> 0.08s)
      player.update(0.08); // total 0.09s
      assert.strictEqual(player.coyoteTimer, 0, 'Coyote timer must have expired to 0');

      // Calling jump must now fail to launch immediately
      const jumped = player.jump();
      assert.strictEqual(jumped, false, 'Jump after coyote window must not execute immediately');
      assert.ok(player.vy > 0, `Player should continue falling, got vy = ${player.vy}`);
      assert.ok(player.jumpBufferTimer > 0, 'Jump input must be buffered instead');
    });

    it('1.3: Jump Buffering - Jump buffered within window (0.10s before landing) executes on landing', () => {
      const player = new Player();
      player.jump(); // Full jump
      assert.strictEqual(player.isGrounded, false);

      // Simulate jump up to descent near landing (hang time ~ 0.654s)
      // Advance to 0.55s into jump (approx 0.10s before landing)
      let elapsed = 0;
      while (elapsed < 0.55) {
        player.update(1 / 60);
        elapsed += 1 / 60;
      }
      assert.strictEqual(player.isGrounded, false, 'Player must still be airborne before landing');

      // Buffer jump input 0.10s before landing (< JUMP_BUFFER_WINDOW = 0.12s)
      const directJump = player.jump();
      assert.strictEqual(directJump, false, 'Mid-air jump must be buffered, not immediately executed');
      assert.ok(player.jumpBufferTimer > 0, 'Jump buffer timer must be active');

      // Advance frames until landing
      let landedAndJumped = false;
      for (let i = 0; i < 20; i++) {
        player.update(1 / 60);
        // If buffered jump executes on landing, player vy becomes JUMP_INITIAL_VELOCITY (-850)
        if (player.vy === JUMP_INITIAL_VELOCITY) {
          landedAndJumped = true;
          break;
        }
      }

      assert.strictEqual(landedAndJumped, true, 'Buffered jump must execute upon touching the ground');
    });

    it('1.4: Jump Buffering - Jump buffered too early (> 0.12s before landing) expires and does not jump', () => {
      const player = new Player();
      player.jump();

      // At t = 0.35s (apex), buffer a jump. Landing is at ~0.654s, so > 0.30s away.
      let elapsed = 0;
      while (elapsed < 0.35) {
        player.update(1 / 60);
        elapsed += 1 / 60;
      }
      assert.strictEqual(player.isGrounded, false);

      // Buffer jump at apex
      player.jump();
      assert.ok(player.jumpBufferTimer > 0);

      // Advance until landing (~0.66s)
      while (!player.isGrounded) {
        player.update(1 / 60);
      }

      // On landing, buffer should have long expired; player must remain grounded with vy = 0
      assert.strictEqual(player.isGrounded, true, 'Player must land normally without auto-jump');
      assert.strictEqual(player.vy, 0, 'Vertical velocity must be 0 on normal landing');
      assert.strictEqual(player.jumpBufferTimer, 0, 'Jump buffer timer must be 0');
    });

    it('1.5: Adversarial Spam - 100 rapid jump inputs in single tick do not compound or corrupt state', () => {
      const player = new Player();
      assert.strictEqual(player.isGrounded, true);

      // Spam 100 jump calls
      const results = [];
      for (let i = 0; i < 100; i++) {
        results.push(player.jump());
      }

      // First call executes, next 99 calls buffer without error
      assert.strictEqual(results[0], true, 'First jump must succeed');
      for (let i = 1; i < 100; i++) {
        assert.strictEqual(results[i], false, `Spam call ${i} must return false`);
      }

      // Invariants check
      assert.strictEqual(player.vy, JUMP_INITIAL_VELOCITY, 'Upward impulse must not compound beyond JUMP_INITIAL_VELOCITY');
      assert.strictEqual(player.isGrounded, false, 'Player must be airborne');
      assert.strictEqual(player.jumpBufferTimer, JUMP_BUFFER_WINDOW, 'Buffer timer must clamp at JUMP_BUFFER_WINDOW');
    });

    it('1.6: Short-hop cutoff - releaseJump clips velocity if upward speed exceeds threshold', () => {
      const player = new Player();
      player.jump();
      assert.strictEqual(player.vy, JUMP_INITIAL_VELOCITY); // -850

      // Immediately release jump
      player.releaseJump();
      assert.strictEqual(player.vy, SHORT_HOP_CUTOFF_VELOCITY, 'Short hop must clamp vy to SHORT_HOP_CUTOFF_VELOCITY (-300)');

      // Calling releaseJump again when vy >= SHORT_HOP_CUTOFF_VELOCITY should be no-op
      player.releaseJump();
      assert.strictEqual(player.vy, SHORT_HOP_CUTOFF_VELOCITY);
    });
  });

  // =========================================================================
  // Challenge Area 2: Extreme Delta Time (dt) Inputs
  // =========================================================================
  describe('Area 2: Extreme Delta Time (dt) Inputs', () => {

    it('2.1: dt = 0 is a strict no-op leaving all engine and player states intact', () => {
      const engine = new GameEngine();
      engine.handleAction('START');
      const snapBefore = engine.getSnapshot();

      const snapAfter = engine.tick(0);

      assert.strictEqual(snapAfter.timeElapsed, snapBefore.timeElapsed);
      assert.strictEqual(snapAfter.timeRemaining, snapBefore.timeRemaining);
      assert.strictEqual(snapAfter.player.y, snapBefore.player.y);
      assert.strictEqual(snapAfter.player.vy, snapBefore.player.vy);
      assert.strictEqual(snapAfter.score, snapBefore.score);
      assert.strictEqual(snapAfter.speed, snapBefore.speed);
    });

    it('2.2: Negative dt values are safely rejected without rewinding time or corrupting physics', () => {
      const engine = new GameEngine();
      engine.handleAction('START');
      engine.tick(1.0); // Advance 1 second
      const snapBefore = engine.getSnapshot();

      for (const negDt of [-0.001, -0.016, -1.0, -60.0, -Infinity]) {
        const snap = engine.tick(negDt);
        assert.strictEqual(snap.timeElapsed, snapBefore.timeElapsed, `Negative dt ${negDt} must not change timeElapsed`);
        assert.strictEqual(snap.timeRemaining, snapBefore.timeRemaining, `Negative dt ${negDt} must not change timeRemaining`);
        assert.strictEqual(snap.score, snapBefore.score, `Negative dt ${negDt} must not mutate score`);
      }
    });

    it('2.3: 10.0s extreme dt spike executes sub-steps safely without stall or NaN', () => {
      const engine = new GameEngine();
      engine.handleAction('START');
      const snapBefore = engine.getSnapshot();

      const snapAfter = engine.tick(10.0);

      // Verify that engine advanced 10 seconds or cleanly resolved collisions
      assert.ok(snapAfter.timeElapsed >= snapBefore.timeElapsed + 9.99, 'timeElapsed should advance by ~10.0s');
      assert.ok(snapAfter.timeRemaining <= snapBefore.timeRemaining - 9.99, 'timeRemaining should decrease by ~10.0s');
      assert.ok(Number.isFinite(snapAfter.player.y), 'Player y must remain finite');
      assert.ok(Number.isFinite(snapAfter.player.vy), 'Player vy must remain finite');
      assert.ok(Number.isFinite(snapAfter.score), 'Score must remain finite');
      assert.ok(Number.isFinite(snapAfter.speed), 'Speed must remain finite');
    });

    it('2.4: 10,000 micro-ticks (dt = 0.0001s) integrate without precision drift or floor penetration', () => {
      const player = new Player({ groundY: 440 });
      const initialY = player.y; // 380

      for (let i = 0; i < 10000; i++) {
        player.update(0.0001); // 1 second total
      }

      assert.strictEqual(player.y, initialY, 'Player on ground must remain exactly at ground baseline');
      assert.strictEqual(player.vy, 0, 'Player on ground must maintain vy = 0 across micro-ticks');
      assert.strictEqual(player.isGrounded, true, 'Player must remain grounded');
      assert.ok(Number.isFinite(player.y), 'Player y must be finite');
    });

    it('2.5: Pathological non-numeric and boundary dt values are safely ignored', () => {
      const engine = new GameEngine();
      engine.handleAction('START');
      const snapBefore = engine.getSnapshot();

      const pathologicalInputs = [
        NaN,
        null,
        undefined,
        '0.016',
        '',
        {},
        [],
        Infinity,
        -Infinity,
        Number.MIN_VALUE // positive subnormal; negligible advance
      ];

      for (const val of pathologicalInputs) {
        assert.doesNotThrow(() => engine.tick(val), `tick(${String(val)}) must not throw`);
      }

      const snapAfter = engine.getSnapshot();
      assert.ok(snapAfter.timeElapsed < 0.001, 'Pathological inputs should not cause unexpected time leaps');
    });
  });

  // =========================================================================
  // Challenge Area 3: High Velocity Tunneling Checks against Thin Obstacles
  // =========================================================================
  describe('Area 3: High Velocity Tunneling Checks against Thin Obstacles', () => {

    it('3.1: Continuous Swept AABB detects collision of ultra-thin 1px obstacle moving at high speed', () => {
      // Player contracted hitbox: x: 120, y: 384, width: 32, height: 52
      const playerBox = { x: 120, y: 384, width: 32, height: 52 };

      // Ultra-thin 1px obstacle located to the right of player: x: 140, y: 390, width: 1, height: 40
      const thinObstacle = { x: 140, y: 390, width: 1, height: 40 };

      // High horizontal speed approaching player leftward: -3000 px/s over dt = 1/60s (moves 50px left!)
      const relVx = -3000;
      const relVy = 0;
      const dt = 1 / 60;

      // Notice: at t=0, obstacle is at x=140 (outside player [120..152] but inside? Wait: player right is 152!)
      // Let's place thinObstacle strictly outside player: x: 160.
      const outsideThinObstacle = { x: 160, y: 390, width: 1, height: 40 };
      // At t=0: obstacle is at [160..161]. Player is at [120..152]. Gap = 8px.
      // At t=dt: obstacle is at [110..111]. Player is at [120..152]. Obstacle is past player!
      // Discrete check at t=0 and t=dt would both be FALSE (tunneling)!
      const discreteAtStart = checkAABBCollision(playerBox, outsideThinObstacle);
      const discreteAtEnd = checkAABBCollision(playerBox, { ...outsideThinObstacle, x: 160 + relVx * dt });
      assert.strictEqual(discreteAtStart, false, 'Discrete at start must be false (separated)');
      assert.strictEqual(discreteAtEnd, false, 'Discrete at end must be false (tunneled past)');

      // Swept AABB MUST catch this tunneling collision!
      const sweptHit = checkSweptAABB(playerBox, outsideThinObstacle, relVx, relVy, dt);
      assert.strictEqual(sweptHit, true, 'Continuous Swept AABB must detect high-speed tunneling through 1px obstacle');
    });

    it('3.2: Continuous Swept AABB tests across multiple extreme velocities (-500 to -10000 px/s)', () => {
      const playerBox = { x: 120, y: 384, width: 32, height: 52 };
      const dt = 1 / 60;

      for (const speed of [500, 1000, 2000, 5000, 10000]) {
        const relVx = -speed;
        const obstacleDist = speed * dt * 0.5; // Start halfway into the step distance
        const obstacle = { x: playerBox.x + playerBox.width + obstacleDist, y: 390, width: 2, height: 40 };

        const hit = checkSweptAABB(playerBox, obstacle, relVx, 0, dt);
        assert.strictEqual(hit, true, `Swept collision must be detected at speed ${speed} px/s`);
      }
    });

    it('3.3: Continuous Swept AABB correctly returns false when obstacle trajectory passes strictly above or below', () => {
      const playerBox = { x: 120, y: 384, width: 32, height: 52 }; // y from 384 to 436
      const dt = 1 / 60;
      const relVx = -2000;

      // Obstacle passing strictly above player (y: 300 to 340, gap = 44px)
      const highObstacle = { x: 200, y: 300, width: 20, height: 40 };
      assert.strictEqual(checkSweptAABB(playerBox, highObstacle, relVx, 0, dt), false, 'High obstacle trajectory must not collide');

      // Obstacle passing strictly below player (y: 450 to 480, gap = 14px)
      const lowObstacle = { x: 200, y: 450, width: 20, height: 30 };
      assert.strictEqual(checkSweptAABB(playerBox, lowObstacle, relVx, 0, dt), false, 'Low obstacle trajectory must not collide');
    });

    it('3.4: Engine Sub-Stepping guarantees discrete collision detection even at MAX_SPEED', () => {
      // In GameEngine, max speed is 650 px/s, sub-step dt <= 1/60s.
      // Max displacement per sub-step = 650 / 60 = 10.83px.
      // Smallest obstacle width = 36px (effective 28px), player hitbox = 32px.
      // Total overlap interval = 60px >> 10.83px displacement.
      // Therefore, tunneling is mathematically impossible in discrete engine sub-stepping.
      const engine = new GameEngine({
        initialSpeed: MAX_SPEED,
        maxSpeed: MAX_SPEED,
        totalDuration: 10.0,
        enableDamage: true
      });
      engine.handleAction('START');

      let hitOccurred = false;
      engine.on('hit', () => { hitOccurred = true; });

      // Run until first obstacle reaches player
      for (let i = 0; i < 300; i++) {
        engine.tick(1 / 60);
        if (hitOccurred) break;
      }

      assert.strictEqual(hitOccurred, true, 'Discrete sub-stepping must register collision without tunneling');
    });
  });

  // =========================================================================
  // Challenge Area 4: Exact Collision Boundary Intersection Precision
  // =========================================================================
  describe('Area 4: Exact Collision Boundary Intersection Precision', () => {

    const baseBox = { x: 100, y: 100, width: 50, height: 50 };

    it('4.1: Edge-touching (zero area overlap) returns false across all 4 cardinal directions', () => {
      // Left edge touching: boxB right edge == baseBox left edge (100)
      const touchLeft = { x: 50, y: 100, width: 50, height: 50 };
      assert.strictEqual(checkAABBCollision(baseBox, touchLeft), false, 'Left edge touch must return false');

      // Right edge touching: boxB left edge == baseBox right edge (150)
      const touchRight = { x: 150, y: 100, width: 50, height: 50 };
      assert.strictEqual(checkAABBCollision(baseBox, touchRight), false, 'Right edge touch must return false');

      // Top edge touching: boxB bottom edge == baseBox top edge (100)
      const touchTop = { x: 100, y: 50, width: 50, height: 50 };
      assert.strictEqual(checkAABBCollision(baseBox, touchTop), false, 'Top edge touch must return false');

      // Bottom edge touching: boxB top edge == baseBox bottom edge (150)
      const touchBottom = { x: 100, y: 150, width: 50, height: 50 };
      assert.strictEqual(checkAABBCollision(baseBox, touchBottom), false, 'Bottom edge touch must return false');
    });

    it('4.2: Sub-pixel overlap (1e-6 px) returns true across all 4 cardinal directions', () => {
      const epsilon = 1e-6;

      // Left overlap by epsilon
      const overlapLeft = { x: 50 + epsilon, y: 100, width: 50, height: 50 };
      assert.strictEqual(checkAABBCollision(baseBox, overlapLeft), true, 'Left sub-pixel overlap must be true');

      // Right overlap by epsilon
      const overlapRight = { x: 150 - epsilon, y: 100, width: 50, height: 50 };
      assert.strictEqual(checkAABBCollision(baseBox, overlapRight), true, 'Right sub-pixel overlap must be true');

      // Top overlap by epsilon
      const overlapTop = { x: 100, y: 50 + epsilon, width: 50, height: 50 };
      assert.strictEqual(checkAABBCollision(baseBox, overlapTop), true, 'Top sub-pixel overlap must be true');

      // Bottom overlap by epsilon
      const overlapBottom = { x: 100, y: 150 - epsilon, width: 50, height: 50 };
      assert.strictEqual(checkAABBCollision(baseBox, overlapBottom), true, 'Bottom sub-pixel overlap must be true');
    });

    it('4.3: Diagonal corner-touching returns false', () => {
      const cornerTouch = { x: 150, y: 150, width: 50, height: 50 };
      assert.strictEqual(checkAABBCollision(baseBox, cornerTouch), false, 'Diagonal corner touch must be false');
    });

    it('4.4: Degenerate boxes (zero/negative width or height) return false', () => {
      assert.strictEqual(checkAABBCollision(baseBox, { x: 110, y: 110, width: 0, height: 50 }), false, '0 width must return false');
      assert.strictEqual(checkAABBCollision(baseBox, { x: 110, y: 110, width: 50, height: 0 }), false, '0 height must return false');
      assert.strictEqual(checkAABBCollision(baseBox, { x: 110, y: 110, width: -10, height: 50 }), false, 'Negative width must return false');
      assert.strictEqual(checkAABBCollision(baseBox, { x: 110, y: 110, width: 50, height: -10 }), false, 'Negative height must return false');
    });

    it('4.5: Circle-to-AABB collision boundary precision', () => {
      const circle = { x: 100, y: 100, radius: 10 };

      // Exact tangent contact: distance from center (100, 100) to box left edge (110) is exactly radius (10)
      const tangentBox = { x: 110, y: 90, width: 20, height: 20 };
      assert.strictEqual(checkCircleAABBCollision(circle, tangentBox), false, 'Tangent circle contact must return false (no overlap)');

      // Sub-pixel circle overlap: distance is 9.999 < 10
      const overlapBox = { x: 109.999, y: 90, width: 20, height: 20 };
      assert.strictEqual(checkCircleAABBCollision(circle, overlapBox), true, 'Sub-pixel circle overlap must return true');

      // Corner proximity test: diagonal corner distance sqrt(dx^2 + dy^2)
      // dx = 7, dy = 7 -> distSq = 49 + 49 = 98 < 100 (r^2) -> inside!
      const cornerOverlap = { x: 107, y: 107, width: 20, height: 20 };
      assert.strictEqual(checkCircleAABBCollision(circle, cornerOverlap), true, 'Circle corner overlap (distSq 98 < 100) must return true');

      // dx = 8, dy = 8 -> distSq = 64 + 64 = 128 > 100 -> outside!
      const cornerSeparated = { x: 108, y: 108, width: 20, height: 20 };
      assert.strictEqual(checkCircleAABBCollision(circle, cornerSeparated), false, 'Circle corner outside (distSq 128 > 100) must return false');
    });

    it('4.6: Margin insets produce fair visual hitbox contraction', () => {
      const playerBox = { x: 100, y: 100, width: 44, height: 60 };
      const obstacleBox = { x: 140, y: 100, width: 36, height: 44 };

      // Raw boxes overlap: [100..144] overlaps [140..176] by 4px
      assert.strictEqual(checkAABBCollision(playerBox, obstacleBox), true, 'Raw boxes overlap by 4px');

      // With visual fairness insets: player insetX = 6, obstacle insetX = 4
      // Player effective x: [106..138], Obstacle effective x: [144..172]
      // Gap between effective hitboxes is 144 - 138 = 6px!
      const contractedPlayer = getContractedBox(playerBox, 6, 4);
      const contractedObstacle = getContractedBox(obstacleBox, 4, 4);
      assert.strictEqual(checkAABBCollision(contractedPlayer, contractedObstacle), false, 'Inset hitboxes must not collide when within sprite margin');
    });
  });

  // =========================================================================
  // Challenge Area 5: Extended Numerical Stability & Fuzzing Stress
  // =========================================================================
  describe('Area 5: Extended Numerical Stability & Fuzzing Stress', () => {

    it('5.1: 1,000 consecutive jump cycles maintain exact ground baseline (y=380, vy=0) with zero drift', () => {
      const player = new Player();
      for (let cycle = 0; cycle < 1000; cycle++) {
        player.jump();
        while (!player.isGrounded) {
          player.update(1 / 60);
        }
        assert.strictEqual(player.y, 380, `Cycle ${cycle}: y coordinate must be exactly 380`);
        assert.strictEqual(player.vy, 0, `Cycle ${cycle}: vy must be exactly 0`);
      }
    });

    it('5.2: Severe lag spike (dt = 0.25s) executes 15 internal sub-steps and registers collision without tunneling', () => {
      const engine = new GameEngine({ initialSpeed: 650, maxSpeed: 650 });
      engine.handleAction('START');
      let collisionDetected = false;
      engine.on('hit', () => { collisionDetected = true; });

      for (let i = 0; i < 40; i++) {
        engine.tick(0.25);
        if (collisionDetected) break;
      }

      assert.strictEqual(collisionDetected, true, 'Lag spike sub-stepping must register obstacle collision');
    });

    it('5.3: 10,000 chaotic fuzzer steps (random actions + random positive/negative dt) execute without error', () => {
      const engine = new GameEngine();
      const actions = ['START', 'JUMP', 'DUCK', 'STAND', 'PAUSE', 'RESTART', 'BOGUS', null, undefined, 42];
      let errorCount = 0;

      for (let step = 0; step < 10000; step++) {
        const action = actions[Math.floor(Math.random() * actions.length)];
        const dt = (Math.random() - 0.2) * 0.1; // Range [-0.02s, 0.08s]
        try {
          engine.handleAction(action);
          engine.tick(dt);
        } catch (err) {
          errorCount++;
        }
      }

      assert.strictEqual(errorCount, 0, '10,000 chaotic fuzzer steps must complete with 0 uncaught errors');
      const snap = engine.getSnapshot();
      assert.ok(Number.isFinite(snap.timeElapsed), 'Snapshot timeElapsed must be finite');
      assert.ok(Number.isFinite(snap.score), 'Snapshot score must be finite');
    });
  });

});
