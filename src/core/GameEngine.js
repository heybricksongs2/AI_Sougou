/**
 * src/core/GameEngine.js
 * Unified Headless Simulation Orchestrator.
 * Zero DOM dependencies.
 */

import { EventBus } from './EventBus.js';
import { StateMachine, GAME_STATES } from './StateMachine.js';
import { ScoreManager } from './ScoreManager.js';
import { Player } from './Player.js';
import { ObstacleManager } from './ObstacleManager.js';
import { ItemManager } from './ItemManager.js';
import { checkAABBCollision, checkCircleAABBCollision } from './Collision.js';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  GAME_DURATION,
  INITIAL_SPEED,
  MAX_SPEED,
  PLAYER_MAX_LIVES
} from './constants.js';

export class GameEngine {
  #config;
  #eventBus;
  #stateMachine;
  #scoreManager;
  #player;
  #obstacleManager;
  #itemManager;

  #timeElapsed = 0;
  #timeRemaining = GAME_DURATION;
  #speed = INITIAL_SPEED;

  /**
   * @param {Object} [config] Configuration parameters
   */
  constructor(config) {
    const cfg = config && typeof config === 'object' ? config : {};

    this.#config = {
      canvasWidth: cfg.canvasWidth || CANVAS_WIDTH,
      canvasHeight: cfg.canvasHeight || CANVAS_HEIGHT,
      groundY: cfg.groundY || GROUND_Y,
      totalDuration: cfg.totalDuration !== undefined ? cfg.totalDuration : GAME_DURATION,
      initialSpeed: cfg.initialSpeed !== undefined ? cfg.initialSpeed : INITIAL_SPEED,
      maxSpeed: cfg.maxSpeed !== undefined ? cfg.maxSpeed : MAX_SPEED,
      initialLives: cfg.initialLives !== undefined ? cfg.initialLives : (cfg.playerLives !== undefined ? cfg.playerLives : PLAYER_MAX_LIVES),
      initialHighScore: cfg.initialHighScore || 0,
      enableDamage: cfg.enableDamage !== undefined ? cfg.enableDamage : true,
      seed: cfg.seed !== undefined ? cfg.seed : 12345,
      ...cfg
    };

    this.#eventBus = new EventBus();
    this.#stateMachine = new StateMachine(GAME_STATES.INIT, (to, from, data) => {
      this.#eventBus.emit('state_change', { to, from, data });
    });
    this.#scoreManager = new ScoreManager(this.#config);
    this.#player = new Player(this.#config);
    this.#obstacleManager = new ObstacleManager(this.#config);
    this.#itemManager = new ItemManager(this.#config);

    this.reset();
  }

  /**
   * Resets simulation to initial state. Preserves high score.
   */
  reset() {
    this.#timeElapsed = 0;
    this.#timeRemaining = this.#config.totalDuration;
    this.#speed = this.#config.initialSpeed;

    this.#stateMachine.reset();
    this.#scoreManager.reset();
    this.#player.reset();
    this.#player.baseHeight = 64;
    this.#player.height = 64;
    this.#player.y = this.#config.groundY - 64;
    this.#obstacleManager.reset();
    this.#itemManager.reset();
  }

  /**
   * Subscribe to engine event.
   * @param {string} event
   * @param {Function} callback
   * @returns {() => void}
   */
  on(event, callback) {
    return this.#eventBus.on(event, callback);
  }

  /**
   * Unsubscribe from engine event.
   * @param {string} event
   * @param {Function} callback
   * @returns {boolean}
   */
  off(event, callback) {
    return this.#eventBus.off(event, callback);
  }

  /**
   * Emit an event through the engine's event bus.
   * @param {string} event
   * @param  {...any} args
   */
  emit(event, ...args) {
    this.#eventBus.emit(event, ...args);
  }

  /**
   * Handles high-level semantic user actions.
   * @param {string} actionType - 'START' | 'JUMP' | 'PAUSE' | 'RESTART' | 'DUCK' | 'STAND'
   * @returns {Object} Updated snapshot
   */
  handleAction(actionType) {
    if (typeof actionType !== 'string') {
      return this.getSnapshot();
    }

    switch (actionType) {
      case 'START':
        if (this.#stateMachine.is(GAME_STATES.INIT)) {
          if (this.#player.lives <= 0) {
            this.#stateMachine.transition(GAME_STATES.RUNNING);
            this.#stateMachine.transition(GAME_STATES.GAME_OVER);
            this.#eventBus.emit('game_over', {
              score: this.#scoreManager.score,
              highScore: this.#scoreManager.highScore,
              timeElapsed: this.#timeElapsed,
              reason: 'no_lives'
            });
          } else {
            this.#stateMachine.transition(GAME_STATES.RUNNING);
            this.#eventBus.emit('game_start', {
              timeRemaining: this.#timeRemaining,
              speed: this.#speed
            });
          }
        }
        break;

      case 'JUMP':
        if (this.#stateMachine.is(GAME_STATES.RUNNING)) {
          const jumped = this.#player.jump();
          if (jumped) {
            this.#eventBus.emit('jump', { vy: this.#player.vy, y: this.#player.y });
          }
        }
        break;

      case 'DUCK':
        if (this.#stateMachine.is(GAME_STATES.RUNNING)) {
          this.#player.duck();
        }
        break;

      case 'STAND':
        if (this.#stateMachine.is(GAME_STATES.RUNNING)) {
          this.#player.stand();
        }
        break;

      case 'PAUSE':
        if (this.#stateMachine.is(GAME_STATES.RUNNING)) {
          this.#stateMachine.transition(GAME_STATES.PAUSED);
          this.#eventBus.emit('pause', {
            timeRemaining: this.#timeRemaining,
            score: this.#scoreManager.score
          });
        } else if (this.#stateMachine.is(GAME_STATES.PAUSED)) {
          this.#stateMachine.transition(GAME_STATES.RUNNING);
          this.#eventBus.emit('resume', {
            timeRemaining: this.#timeRemaining,
            score: this.#scoreManager.score
          });
        }
        break;

      case 'RESTART':
        this.reset();
        this.#stateMachine.transition(GAME_STATES.RUNNING);
        this.#eventBus.emit('game_start', {
          timeRemaining: this.#timeRemaining,
          speed: this.#speed
        });
        break;

      default:
        // Ignore unrecognized action types safely
        break;
    }

    return this.getSnapshot();
  }

  /**
   * Advances the simulation forward by dt seconds.
   * Uses fixed sub-stepping to handle spikes and variable frame rates safely.
   * @param {number} rawDt Delta time in seconds
   * @returns {Object} Snapshot after tick
   */
  tick(rawDt) {
    if (typeof rawDt !== 'number' || rawDt <= 0 || !Number.isFinite(rawDt)) {
      return this.getSnapshot();
    }

    if (!this.#stateMachine.is(GAME_STATES.RUNNING)) {
      return this.getSnapshot();
    }

    const MAX_STEP = 1 / 60;
    const MAX_TOTAL_DT = 65.0; // clamp extreme spikes so execution never stalls
    const effectiveDt = Math.min(rawDt, MAX_TOTAL_DT);
    let remainingDt = effectiveDt;

    while (remainingDt > 0 && this.#stateMachine.is(GAME_STATES.RUNNING)) {
      const stepDt = Math.min(remainingDt, MAX_STEP);
      this.#step(stepDt);
      remainingDt -= stepDt;
    }

    return this.getSnapshot();
  }

  /**
   * Single discrete simulation sub-step.
   * @param {number} dt
   */
  #step(dt) {
    // 1. Time progression
    this.#timeElapsed += dt;
    this.#timeRemaining = Math.max(0, this.#config.totalDuration - this.#timeElapsed);

    // 2. Speed scaling progression
    const progress = Math.min(1.0, this.#timeElapsed / this.#config.totalDuration);
    this.#speed = this.#config.initialSpeed + (this.#config.maxSpeed - this.#config.initialSpeed) * progress;

    // 3. Entity updates
    this.#player.update(dt);
    this.#obstacleManager.update(dt, this.#speed, this.#timeElapsed);
    this.#itemManager.update(dt, this.#speed);
    this.#scoreManager.update(this.#speed, dt);

    // 4. Collision resolution: Obstacles
    const playerHitbox = this.#player.getHitbox();
    const obstacles = this.#obstacleManager.getObstacles();

    for (const obstacle of obstacles) {
      const obstacleHitbox = obstacle.getHitbox ? obstacle.getHitbox() : obstacle;
      if (checkAABBCollision(playerHitbox, obstacleHitbox)) {
        if (this.#config.enableDamage !== false) {
          const damaged = this.#player.hit();
          if (damaged) {
            this.#eventBus.emit('hit', { obstacle, remainingLives: this.#player.lives });

            if (this.#player.lives <= 0) {
              this.#stateMachine.transition(GAME_STATES.GAME_OVER, {
                score: this.#scoreManager.score,
                timeElapsed: this.#timeElapsed,
                obstacle
              });
              this.#eventBus.emit('game_over', {
                score: this.#scoreManager.score,
                highScore: this.#scoreManager.highScore,
                timeElapsed: this.#timeElapsed,
                reason: 'collision'
              });
              return;
            }
          }
        }
      }
    }

    // 5. Collision resolution: Collectible items
    const playerBounds = this.#player.getBounds();
    const items = this.#itemManager.getItems();

    for (const item of items) {
      if (!item.collected) {
        const itemBox = item.getBounds ? item.getBounds() : {
          x: item.x - item.radius,
          y: item.y - item.radius,
          width: item.radius * 2,
          height: item.radius * 2
        };
        const collides = checkCircleAABBCollision(item, playerBounds, 4) || checkAABBCollision(playerBounds, itemBox);
        if (collides) {
          item.collected = true;
          const pts = item.points || 250;
          this.#scoreManager.addItemScore(pts);
          this.#eventBus.emit('item_collected', {
            item: { ...item },
            addedPoints: pts,
            score: this.#scoreManager.score
          });
        }
      }
    }

    // 6. Victory check
    if (this.#timeRemaining <= 1e-4) {
      this.#timeRemaining = 0;
      this.#scoreManager.addVictoryBonus(5000);
      this.#stateMachine.transition(GAME_STATES.VICTORY, {
        score: this.#scoreManager.score,
        timeElapsed: this.#timeElapsed
      });
      this.#eventBus.emit('victory', {
        score: this.#scoreManager.score,
        highScore: this.#scoreManager.highScore,
        timeElapsed: this.#timeElapsed
      });
      return;
    }
  }

  /**
   * Produces an immutable snapshot object conforming to PROJECT.md GameSnapshot contract.
   * @returns {Object}
   */
  getSnapshot() {
    return {
      state: this.#stateMachine.state,
      timeRemaining: Number(this.#timeRemaining.toFixed(2)),
      timeElapsed: Number(this.#timeElapsed.toFixed(2)),
      score: this.#scoreManager.score,
      highScore: this.#scoreManager.highScore,
      speed: Math.round(this.#speed),
      player: {
        x: this.#player.x,
        y: this.#player.y,
        width: this.#player.width,
        height: this.#player.height,
        vy: this.#player.vy,
        isGrounded: this.#player.isGrounded,
        lives: this.#player.lives
      },
      obstacles: this.#obstacleManager.getObstacles().map(o => ({
        id: o.id,
        x: o.x,
        y: o.y,
        width: o.width,
        height: o.height,
        type: o.type
      })),
      items: this.#itemManager.getItems().map(item => ({
        id: item.id,
        x: item.x,
        y: item.y,
        radius: item.radius,
        collected: item.collected
      }))
    };
  }
}
