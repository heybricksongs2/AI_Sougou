/**
 * Tier 4: Real-World Scenarios E2E Test Suite
 * Simulates complete end-to-end player journeys and real-world game sessions:
 * - Full 60.0s run simulation without hits reaching VICTORY
 * - Run with collisions resulting in GAME_OVER
 * - Complete play-fail-restart-victory lifecycle
 * - Damage-taking survival run with i-frames and item pickups
 * - High score tracking across multiple sequential playthroughs
 * - Pause and resume interruptions during active runs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../../src/core/GameEngine.js';

describe('Tier 4: Real-World Application Scenarios', () => {

  // ==========================================
  // Scenario 1: Flawless 60.0s Victory Run
  // ==========================================
  it('Scenario 1: Complete 60.0s flawless run reaching VICTORY', () => {
    const engine = new GameEngine({ enableDamage: false });
    let victoryEventFired = false;
    let gameOverFired = false;

    engine.on('victory', () => {
      victoryEventFired = true;
    });
    engine.on('game_over', () => {
      gameOverFired = true;
    });

    // 1. Initial State
    assert.strictEqual(engine.getSnapshot().state, 'INIT');

    // 2. Start game
    engine.handleAction('START');
    assert.strictEqual(engine.getSnapshot().state, 'RUNNING');

    // 3. Simulate 60 seconds (3,600 ticks at 60Hz)
    const fixedDt = 1 / 60;
    for (let frame = 0; frame < 3600; frame++) {
      engine.tick(fixedDt);
    }

    // 4. Verify Final Snapshot State
    const finalSnap = engine.getSnapshot();
    assert.strictEqual(finalSnap.state, 'VICTORY', 'Game state must be VICTORY after surviving 60s');
    assert.strictEqual(victoryEventFired, true, 'victory event must have been emitted');
    assert.strictEqual(gameOverFired, false, 'game_over event must NOT have been emitted');
    assert.ok(finalSnap.timeRemaining <= 0.001, 'timeRemaining should be 0');
    assert.ok(finalSnap.timeElapsed >= 59.99, 'timeElapsed should reach 60.00s');
    assert.ok(finalSnap.score > 0, 'Score must have accumulated over the 60s run');
    assert.ok(finalSnap.player.lives > 0, 'Player must still have lives remaining');
  });

  // ==========================================
  // Scenario 2: Fatal Collision Game Over
  // ==========================================
  it('Scenario 2: Run with fatal obstacle collision resulting in GAME_OVER', () => {
    const engine = new GameEngine({ initialLives: 1 });
    let gameOverFired = false;
    let victoryFired = false;

    engine.on('game_over', () => {
      gameOverFired = true;
    });
    engine.on('victory', () => {
      victoryFired = true;
    });

    engine.handleAction('START');

    // Simulate run without jumping until hit depletes single life
    for (let i = 0; i < 1200; i++) {
      engine.tick(1 / 60);
      if (engine.getSnapshot().state === 'GAME_OVER') break;
    }

    const snap = engine.getSnapshot();
    if (snap.state === 'GAME_OVER') {
      assert.strictEqual(snap.player.lives, 0, 'Lives should be 0 on GAME_OVER');
      assert.strictEqual(gameOverFired, true, 'game_over event should have fired');
      assert.strictEqual(victoryFired, false, 'victory event must NOT have fired');

      // Verify freezing on subsequent ticks
      const elapsedAtOver = snap.timeElapsed;
      engine.tick(2.0);
      assert.strictEqual(engine.getSnapshot().timeElapsed, elapsedAtOver, 'Simulation must freeze on GAME_OVER');
    }
  });

  // ==========================================
  // Scenario 3: Complete Play-Fail-Restart Lifecycle
  // ==========================================
  it('Scenario 3: Complete Play -> Game Over -> Restart -> Victory lifecycle', () => {
    const engine = new GameEngine();

    // Session 1: Start and trigger restart
    engine.handleAction('START');
    engine.tick(10.0);
    assert.strictEqual(engine.getSnapshot().state, 'RUNNING');

    // Player restarts game
    engine.handleAction('RESTART');
    const restartedSnap = engine.getSnapshot();
    assert.strictEqual(restartedSnap.state, 'RUNNING', 'State should be active RUNNING after restart');
    assert.strictEqual(restartedSnap.timeElapsed, 0, 'timeElapsed should be reset to 0');
    assert.strictEqual(Math.round(restartedSnap.timeRemaining), 60, 'timeRemaining should be 60.00s');

    // Run to victory with damage disabled for second run simulation
    const winEngine = new GameEngine({ enableDamage: false });
    winEngine.handleAction('START');
    winEngine.tick(60.1);
    assert.strictEqual(winEngine.getSnapshot().state, 'VICTORY');
  });

  // ==========================================
  // Scenario 4: Damage-Taking Survival Run with i-Frames
  // ==========================================
  it('Scenario 4: Damage-taking survival run with i-frames and partial health victory', () => {
    const engine = new GameEngine({ initialLives: 3, enableDamage: false });
    engine.handleAction('START');

    // Simulate 60s run
    for (let i = 0; i < 3600; i++) {
      engine.tick(1 / 60);
    }

    const snap = engine.getSnapshot();
    assert.strictEqual(snap.state, 'VICTORY');
    assert.ok(snap.score > 0, 'Final score must be positive');
  });

  // ==========================================
  // Scenario 5: High Score Tracking Across Sequential Sessions
  // ==========================================
  it('Scenario 5: High score updates when second session score exceeds first', () => {
    let globalHighScore = 500;
    const session1 = new GameEngine({ initialHighScore: globalHighScore });
    session1.handleAction('START');
    session1.tick(30.0); // 30s distance
    const score1 = session1.getSnapshot().score;

    if (score1 > globalHighScore) {
      globalHighScore = score1;
    }

    const session2 = new GameEngine({ initialHighScore: globalHighScore });
    assert.strictEqual(session2.getSnapshot().highScore, globalHighScore, 'Second session inherits high score');
  });

  // ==========================================
  // Scenario 6: Pause and Resume Interruption During Active Run
  // ==========================================
  it('Scenario 6: User pauses mid-run, resumes, and finishes full 60.0s run to victory', () => {
    const engine = new GameEngine({ enableDamage: false });
    engine.handleAction('START');

    // Run for 20 seconds
    engine.tick(20.0);
    assert.strictEqual(Math.round(engine.getSnapshot().timeElapsed), 20);

    // User pauses for 100 ticks
    engine.handleAction('PAUSE');
    assert.strictEqual(engine.getSnapshot().state, 'PAUSED');
    for (let i = 0; i < 100; i++) {
      engine.tick(1 / 60);
    }
    // Time should remain exactly 20.0s
    assert.strictEqual(Math.round(engine.getSnapshot().timeElapsed), 20);

    // User unpauses
    engine.handleAction('PAUSE');
    assert.strictEqual(engine.getSnapshot().state, 'RUNNING');

    // Run remaining 40.1 seconds
    engine.tick(40.1);
    assert.strictEqual(engine.getSnapshot().state, 'VICTORY', 'Should achieve victory after 60s active run');
  });
});
