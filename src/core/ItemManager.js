/**
 * src/core/ItemManager.js
 * Collectible Bonus Items Spawner & Manager
 * Zero DOM dependencies.
 */

import {
  CANVAS_WIDTH,
  GROUND_Y,
  ITEM_RADIUS,
  ITEM_TYPES
} from './constants.js';
import { createPRNG } from './ObstacleManager.js';

export class ItemManager {
  /**
   * @param {Object} [config]
   */
  constructor(config = {}) {
    this.canvasWidth = config.canvasWidth ?? CANVAS_WIDTH;
    this.groundY = config.groundY ?? GROUND_Y;
    this.seed = (config.seed ?? 54321) + 999;

    this.reset();
  }

  /**
   * Resets active items and spawner state.
   */
  reset() {
    this.prng = createPRNG(this.seed);
    this.items = [];
    this.nextId = 100;
    this.nextSpawnDistance = 200; // Spawns early items
    this.totalTimeElapsed = 0;
  }

  /**
   * Advances active items and manages procedural spawning.
   * @param {number} dt Delta time in seconds
   * @param {number} speed Current horizontal speed in px/s
   */
  update(dt, speed) {
    if (typeof dt !== 'number' || dt <= 0 || !Number.isFinite(dt)) return;
    const currentSpeed = speed || 300;
    this.totalTimeElapsed += dt;

    // 1. Move active items leftward
    for (const item of this.items) {
      item.x -= currentSpeed * dt;
    }

    // 2. Cull offscreen items (keeping collected items until offscreen for visuals)
    this.items = this.items.filter(item => item.x + item.radius > -100);

    // 3. Procedural spawn countdown
    this.nextSpawnDistance -= currentSpeed * dt;
    if (this.nextSpawnDistance <= 0) {
      this.spawnRandomPattern(currentSpeed);
    }
  }

  /**
   * Spawns a procedural group of items according to a pattern.
   * @param {number} speed
   */
  spawnRandomPattern(speed) {
    const roll = this.prng();

    if (roll < 0.45) {
      // Pattern A: Parabolic Jump Arc (3 apples)
      const centerX = this.canvasWidth + 70;
      const offsets = [-60, 0, 60];
      const yCoords = [330, 260, 330];

      for (let i = 0; i < 3; i++) {
        this.items.push(this.createItem(
          centerX + offsets[i],
          yCoords[i],
          14,
          ITEM_TYPES.APPLE,
          250
        ));
      }
    } else if (roll < 0.80) {
      // Pattern B: Ground Trail (3 apples)
      const startX = this.canvasWidth;
      const groundItemY = this.groundY - 26; // 414px (ground contact)
      for (let i = 0; i < 3; i++) {
        this.items.push(this.createItem(
          startX + i * 50,
          groundItemY,
          14,
          ITEM_TYPES.APPLE,
          250
        ));
      }
    } else {
      // Pattern C: High-Risk Aerial Star (1 star at apex)
      this.items.push(this.createItem(
        this.canvasWidth + 50,
        250,
        ITEM_RADIUS,
        ITEM_TYPES.STAR,
        500
      ));
    }

    // Schedule next spawn distance
    this.nextSpawnDistance = 350 + this.prng() * 300;
  }

  /**
   * Helper to construct a single item object conforming to snapshot contract.
   */
  createItem(x, y, radius, type, points) {
    return {
      id: this.nextId++,
      x,
      y,
      radius,
      type,
      points,
      collected: false,
      getBounds() {
        return {
          x: this.x - this.radius,
          y: this.y - this.radius,
          width: this.radius * 2,
          height: this.radius * 2
        };
      }
    };
  }

  /**
   * Returns snapshot array of active items.
   * @returns {Array<Object>}
   */
  getItems() {
    return this.items;
  }
}
