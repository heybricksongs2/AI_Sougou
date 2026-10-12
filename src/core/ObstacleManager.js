/**
 * src/core/ObstacleManager.js
 * Procedural Obstacle Generation & Lifecycle
 * Zero DOM dependencies.
 */

import {
  CANVAS_WIDTH,
  GROUND_Y,
  JUMP_HANG_TIME,
  OBSTACLE_TYPES,
  OBSTACLE_HITBOX_INSET_X,
  OBSTACLE_HITBOX_INSET_Y
} from './constants.js';

/**
 * 32-bit Mulberry32 PRNG
 * @param {number} seed 32-bit unsigned integer
 * @returns {() => number} Float generator returning values in [0, 1)
 */
export function createPRNG(seed = 12345) {
  let s = (seed || 12345) >>> 0;
  return function next() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class ObstacleManager {
  /**
   * @param {Object} [config]
   */
  constructor(config = {}) {
    this.canvasWidth = config.canvasWidth ?? CANVAS_WIDTH;
    this.groundY = config.groundY ?? GROUND_Y;
    this.jumpHangTime = config.jumpHangTime ?? JUMP_HANG_TIME;
    this.minReactionTime = config.minReactionTime ?? 0.30;
    this.seed = config.seed ?? 12345;

    this.reset();
  }

  /**
   * Resets obstacle manager state and PRNG.
   */
  reset() {
    this.prng = createPRNG(this.seed);
    this.obstacles = [];
    this.nextId = 1;
    this.nextSpawnDistance = 450; // Spawns first obstacle at t ~ 1.5s
    this.lastObstacleType = null;
    this.totalTimeElapsed = 0;
  }

  /**
   * Advances obstacles and spawns new ones.
   * @param {number} dt Delta time in seconds
   * @param {number} speed Current horizontal speed (px/s)
   * @param {number} [timeElapsed] Run time elapsed in seconds
   */
  update(dt, speed, timeElapsed) {
    if (typeof dt !== 'number' || dt <= 0 || !Number.isFinite(dt)) return;
    const currentSpeed = speed || 300;
    const t = timeElapsed !== undefined ? timeElapsed : this.totalTimeElapsed;
    this.totalTimeElapsed += dt;

    // 1. Move active obstacles leftward
    for (const obs of this.obstacles) {
      obs.x -= currentSpeed * dt;
    }

    // 2. Cull offscreen obstacles
    this.obstacles = this.obstacles.filter(obs => obs.x + obs.width > -100);

    // 3. Spawn countdown
    this.nextSpawnDistance -= currentSpeed * dt;
    if (this.nextSpawnDistance <= 0) {
      this.spawnObstacle(currentSpeed, t);
    }
  }

  /**
   * Spawns an obstacle according to current progression phase.
   * @param {number} speed
   * @param {number} timeElapsed
   */
  spawnObstacle(speed, timeElapsed) {
    const t = Math.max(0, timeElapsed);
    let type = OBSTACLE_TYPES.GROUND_HURDLE;
    const roll = this.prng();

    if (t < 12.0) {
      // Phase 1: Tutorial (0s - 12s) - Ground hurdle only
      type = OBSTACLE_TYPES.GROUND_HURDLE;
    } else if (t < 28.0) {
      // Phase 2: Transition (12s - 28s) - Hurdle 60%, Low Barrier 40%
      type = roll < 0.60 ? OBSTACLE_TYPES.GROUND_HURDLE : OBSTACLE_TYPES.LOW_BARRIER;
    } else if (t < 45.0) {
      // Phase 3: Aerial Hazard (28s - 45s) - Hurdle 40%, Low Barrier 30%, High 30%
      if (roll < 0.40) {
        type = OBSTACLE_TYPES.GROUND_HURDLE;
      } else if (roll < 0.70) {
        type = OBSTACLE_TYPES.LOW_BARRIER;
      } else {
        type = OBSTACLE_TYPES.HIGH_OBSTACLE;
      }
    } else {
      // Phase 4: Climax Sprint (45s - 60s) - Even distribution
      if (roll < 0.34) {
        type = OBSTACLE_TYPES.GROUND_HURDLE;
      } else if (roll < 0.67) {
        type = OBSTACLE_TYPES.LOW_BARRIER;
      } else {
        type = OBSTACLE_TYPES.HIGH_OBSTACLE;
      }
    }

    // Determine dimensions and coordinates
    let width, height, y;
    if (type === OBSTACLE_TYPES.GROUND_HURDLE) {
      width = 36;
      height = 44;
      y = this.groundY - height;
    } else if (type === OBSTACLE_TYPES.LOW_BARRIER) {
      width = 64;
      height = 48;
      y = this.groundY - height;
    } else { // HIGH_OBSTACLE
      width = 48;
      height = 36;
      y = this.groundY - 120; // 320px, leaves 24px clearance above standing player (380px)
    }

    const obstacle = {
      id: this.nextId++,
      x: this.canvasWidth,
      y,
      width,
      height,
      type,
      getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
      },
      getHitbox() {
        return {
          x: this.x + OBSTACLE_HITBOX_INSET_X,
          y: this.y + OBSTACLE_HITBOX_INSET_Y,
          width: Math.max(1, this.width - 2 * OBSTACLE_HITBOX_INSET_X),
          height: Math.max(1, this.height - 2 * OBSTACLE_HITBOX_INSET_Y)
        };
      }
    };

    this.obstacles.push(obstacle);
    this.lastObstacleType = type;

    // Guaranteed minimum clearance gap calculation
    let minGapTime = this.jumpHangTime + Math.max(this.minReactionTime, 0.30 + 0.25 * Math.max(0, 1 - t / 30.0));
    if (t < 12.0) {
      // Phase 1 tutorial spacing (1.8s - 3.2s): allows passive survival during initial 10s
      minGapTime = Math.max(minGapTime, 3.2);
    }
    const minGap = speed * minGapTime;
    const randomVariance = this.prng() * speed * 0.35;
    this.nextSpawnDistance = minGap + randomVariance;
  }

  /**
   * Returns active obstacles array.
   * @returns {Array<Object>}
   */
  getObstacles() {
    return this.obstacles;
  }
}
