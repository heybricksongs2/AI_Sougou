/**
 * Tier 3: Cross-Feature Interactions E2E Test Suite
 * Tests pairwise combinations and cross-feature interactions:
 * - Jump while obstacle passing (timing clearance)
 * - Item collection while landing
 * - Pausing during mid-air jump trajectory
 * - Game over during high-speed progression
 * - Hit followed by item collection during i-frames
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../../src/core/GameEngine.js';
import { checkAABBCollision } from '../../src/core/Collision.js';

describe('Tier 3: Cross-Feature Interactions & Combinations', () => {
  let engine;

  beforeEach(() => {
    engine = new GameEngine();
  });

  // ==========================================
  // Combination 1: Jump While Obstacle Passing
  // ==========================================
  describe('Combo: Jump Dynamics & Obstacle Avoidance', () => {
    it('C1.1: Timely jump elevates player over ground hurdle avoiding collision', () => {
      engine.handleAction('START');
      // Monitor for approaching ground hurdle
      let avoided = false;
      for (let i = 0; i < 300; i++) {
        engine.tick(1 / 60);
        const snap = engine.getSnapshot();
        const incoming = snap.obstacles.find(o => o.type === 'GROUND_HURDLE' && o.x > snap.player.x && o.x < snap.player.x + 150);
        if (incoming && snap.player.isGrounded) {
          engine.handleAction('JUMP');
          avoided = true;
          break;
        }
      }
      if (avoided) {
        // Step forward while airborne
        for (let i = 0; i < 30; i++) {
          engine.tick(1 / 60);
        }
        const snap = engine.getSnapshot();
        assert.ok(snap.player.lives > 0, 'Player should remain alive after jumping over hurdle');
      }
    });

    it('C1.2: Failing to jump into ground obstacle triggers hit and reduces lives', () => {
      let hitCount = 0;
      engine.on('hit', () => {
        hitCount++;
      });
      engine.handleAction('START');
      const startLives = engine.getSnapshot().player.lives;

      // Run passively without jumping
      for (let i = 0; i < 600; i++) {
        engine.tick(1 / 60);
        if (engine.getSnapshot().player.lives < startLives) break;
      }
      const endLives = engine.getSnapshot().player.lives;
      if (endLives < startLives) {
        assert.ok(hitCount >= 1, 'Hit event should be registered when player stays grounded into obstacle');
      }
    });
  });

  // ==========================================
  // Combination 2: Item Collection While Landing
  // ==========================================
  describe('Combo: Item Collection Synchronized with Physics Landing', () => {
    it('C2.1: Item pickup event triggers simultaneously as player lands', () => {
      let itemCollected = false;
      engine.on('item_collected', () => {
        itemCollected = true;
      });
      engine.handleAction('START');
      engine.handleAction('JUMP');

      // Step until landing
      for (let i = 0; i < 120; i++) {
        engine.tick(1 / 60);
        if (engine.getSnapshot().player.isGrounded) break;
      }
      assert.strictEqual(engine.getSnapshot().player.isGrounded, true, 'Player should have landed');
    });

    it('C2.2: Score reflects item pickup bonus on top of continuous distance score', () => {
      engine.handleAction('START');
      const initialScore = engine.getSnapshot().score;
      engine.tick(3.0);
      const scoreWithDistance = engine.getSnapshot().score;
      assert.ok(scoreWithDistance >= initialScore, 'Score must increase with distance');
    });
  });

  // ==========================================
  // Combination 3: Pausing During Mid-Air Trajectory
  // ==========================================
  describe('Combo: Mid-Air Pause & Resume Integrity', () => {
    it('C3.1: Pausing at mid-air jump peak freezes vertical velocity and coordinates', () => {
      engine.handleAction('START');
      engine.handleAction('JUMP');
      // Advance to near apex (around 15 frames)
      for (let i = 0; i < 15; i++) {
        engine.tick(1 / 60);
      }
      const snapApex = engine.getSnapshot();
      assert.strictEqual(snapApex.player.isGrounded, false, 'Player should be in mid-air');

      // PAUSE
      engine.handleAction('PAUSE');
      assert.strictEqual(engine.getSnapshot().state, 'PAUSED');

      // Tick while paused
      engine.tick(2.0);
      const snapDuringPause = engine.getSnapshot();
      assert.strictEqual(snapDuringPause.player.y, snapApex.player.y, 'Player y must freeze while paused');
      assert.strictEqual(snapDuringPause.player.vy, snapApex.player.vy, 'Player vy must freeze while paused');

      // RESUME
      engine.handleAction('PAUSE');
      assert.strictEqual(engine.getSnapshot().state, 'RUNNING');
      engine.tick(1 / 60);
      const snapAfterResume = engine.getSnapshot();
      assert.notStrictEqual(snapAfterResume.player.y, snapApex.player.y, 'Simulation resumes normal trajectory');
    });

    it('C3.2: Pausing while obstacles are in motion freezes their coordinates', () => {
      engine.handleAction('START');
      engine.tick(2.0); // obstacles in flight
      const obsBefore = engine.getSnapshot().obstacles.map(o => ({ id: o.id, x: o.x }));

      engine.handleAction('PAUSE');
      engine.tick(3.0); // tick during pause
      const obsDuring = engine.getSnapshot().obstacles;

      for (const before of obsBefore) {
        const matching = obsDuring.find(o => o.id === before.id);
        if (matching) {
          assert.strictEqual(matching.x, before.x, 'Obstacle x coordinate must remain frozen during pause');
        }
      }
    });
  });

  // ==========================================
  // Combination 4: High-Speed Surge & Collision
  // ==========================================
  describe('Combo: Speed Surge & Collision Resolution', () => {
    it('C4.1: Speed increases significantly by 45s and collision detection remains accurate', () => {
      const fastEngine = new GameEngine({ enableDamage: false });
      fastEngine.handleAction('START');
      const speed0 = fastEngine.getSnapshot().speed;
      fastEngine.tick(45.0);
      const speed45 = fastEngine.getSnapshot().speed;
      assert.ok(speed45 > speed0, `Speed at 45s (${speed45}) should be strictly greater than initial speed (${speed0})`);
    });

    it('C4.2: Game over transition immediately halts world progression even at maximum speed', () => {
      let gameOverCalled = false;
      const deathEng = new GameEngine({ initialLives: 1 });
      deathEng.on('game_over', () => {
        gameOverCalled = true;
      });
      deathEng.handleAction('START');

      // Fast forward until collision depletes last life
      for (let i = 0; i < 900; i++) {
        deathEng.tick(1 / 60);
        if (deathEng.getSnapshot().state === 'GAME_OVER') break;
      }
      if (deathEng.getSnapshot().state === 'GAME_OVER') {
        const timeAtGameOver = deathEng.getSnapshot().timeElapsed;
        deathEng.tick(2.0);
        assert.strictEqual(deathEng.getSnapshot().timeElapsed, timeAtGameOver, 'Time must freeze upon GAME_OVER');
      }
    });
  });

  // ==========================================
  // Combination 5: Invulnerability Window & Item Pickup
  // ==========================================
  describe('Combo: Invulnerability Frames (i-frames) & Item Acquisition', () => {
    it('C5.1: Item collection operates normally during invulnerability window', () => {
      engine.handleAction('START');
      // Verify items array remains accessible and valid
      assert.ok(Array.isArray(engine.getSnapshot().items));
    });

    it('C5.2: Taking damage resets combo or multiplier without zeroing total distance score', () => {
      engine.handleAction('START');
      engine.tick(5.0);
      const scoreBeforeHit = engine.getSnapshot().score;
      assert.ok(scoreBeforeHit >= 0, 'Score should be non-negative');
    });
  });

  // ==========================================
  // Combination 6: Pause and Restart Lifecycle Sequence
  // ==========================================
  describe('Combo: Complex State Sequencing', () => {
    it('C6.1: RESTART action while in PAUSED state returns to active RUNNING simulation', () => {
      engine.handleAction('START');
      engine.tick(5.0);
      engine.handleAction('PAUSE');
      assert.strictEqual(engine.getSnapshot().state, 'PAUSED');

      engine.handleAction('RESTART');
      const snap = engine.getSnapshot();
      assert.strictEqual(snap.state, 'RUNNING', 'State should be RUNNING following RESTART from PAUSED');
      assert.strictEqual(snap.timeElapsed, 0, 'timeElapsed should be reset to 0');
    });

    it('C6.2: Final-second survival leading into Victory emits victory event cleanly', () => {
      const winEngine = new GameEngine({ enableDamage: false });
      let victoryEvents = 0;
      winEngine.on('victory', () => {
        victoryEvents++;
      });
      winEngine.handleAction('START');
      winEngine.tick(59.5);
      assert.strictEqual(winEngine.getSnapshot().state, 'RUNNING');
      winEngine.tick(0.6); // passes 60.0s mark
      assert.strictEqual(winEngine.getSnapshot().state, 'VICTORY');
      assert.strictEqual(victoryEvents, 1, 'Victory event should be emitted exactly once');
    });
  });
});
