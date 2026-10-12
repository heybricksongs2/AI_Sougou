/**
 * src/core/Player.js
 * Player Kinematics & State Machine
 * Zero DOM dependencies, pure mathematical physics simulation.
 */

import {
  GROUND_Y,
  PLAYER_START_X,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_DUCK_WIDTH,
  PLAYER_DUCK_HEIGHT,
  GRAVITY,
  JUMP_INITIAL_VELOCITY,
  TERMINAL_VELOCITY,
  SHORT_HOP_CUTOFF_VELOCITY,
  JUMP_BUFFER_WINDOW,
  COYOTE_TIME_WINDOW,
  PLAYER_MAX_LIVES,
  INVULNERABILITY_DURATION,
  PLAYER_HITBOX_INSET_X,
  PLAYER_HITBOX_INSET_Y,
  PLAYER_DUCK_HITBOX_INSET_X,
  PLAYER_DUCK_HITBOX_INSET_Y,
  MAX_DELTA_TIME
} from './constants.js';

export class Player {
  /**
   * @param {Object} [config] Optional override configuration
   */
  constructor(config = {}) {
    this.groundY = config.groundY ?? GROUND_Y;
    this.startX = config.startX ?? PLAYER_START_X;
    this.gravity = config.gravity ?? GRAVITY;
    this.jumpVelocity = config.jumpVelocity ?? JUMP_INITIAL_VELOCITY;
    this.terminalVelocity = config.terminalVelocity ?? TERMINAL_VELOCITY;
    this.maxLives = config.initialLives ?? config.playerLives ?? config.maxLives ?? PLAYER_MAX_LIVES;
    this.invulnerabilityDuration = config.invulnerabilitySec ?? config.invulnerabilityDuration ?? INVULNERABILITY_DURATION;

    this.reset();
  }

  /**
   * Resets player state to default initial conditions.
   */
  reset() {
    this.x = this.startX;
    this.baseWidth = PLAYER_WIDTH;
    this.baseHeight = PLAYER_HEIGHT;
    this.duckWidth = PLAYER_DUCK_WIDTH;
    this.duckHeight = PLAYER_DUCK_HEIGHT;

    this.width = this.baseWidth;
    this.height = this.baseHeight;
    this.y = this.groundY - this.height;

    this.vx = 0;
    this.vy = 0;

    this.isGrounded = true;
    this.isDucking = false;
    this.lives = this.maxLives;

    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    this.invulnerabilityTimer = 0;
  }

  /**
   * Whether the player is currently invulnerable after taking damage.
   * @returns {boolean}
   */
  get isInvulnerable() {
    return this.invulnerabilityTimer > 0;
  }

  /**
   * Advances player kinematic simulation by dt seconds.
   * Uses Symplectic (Semi-Implicit) Euler integration.
   * @param {number} rawDt Delta time in seconds
   */
  update(rawDt) {
    if (typeof rawDt !== 'number' || rawDt <= 0 || !Number.isFinite(rawDt)) return;
    const dt = Math.min(rawDt, MAX_DELTA_TIME);

    // 1. Advance timers
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }
    if (this.coyoteTimer > 0 && !this.isGrounded) {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer = Math.max(0, this.invulnerabilityTimer - dt);
    }

    // 2. Vertical Kinematic Integration
    if (!this.isGrounded || this.vy < 0) {
      // Semi-Implicit Euler: update velocity then position
      this.vy += this.gravity * dt;
      if (this.vy > this.terminalVelocity) {
        this.vy = this.terminalVelocity;
      }
      this.y += this.vy * dt;
    }

    // 3. Ground Boundary Resolution & Landing
    const bottomY = this.y + this.height;
    if (bottomY >= this.groundY) {
      this.y = this.groundY - this.height;

      // Check Jump Buffering on landing
      if (this.jumpBufferTimer > 0) {
        this.executeJump();
      } else {
        this.vy = 0;
        this.isGrounded = true;
        this.coyoteTimer = COYOTE_TIME_WINDOW;
      }
    } else {
      this.isGrounded = false;
    }
  }

  /**
   * Initiates a jump or buffers it if in mid-air.
   * @returns {boolean} True if jump executed immediately, false if buffered/ignored
   */
  jump() {
    if (this.isGrounded || this.coyoteTimer > 0) {
      this.executeJump();
      return true;
    } else {
      // Buffer the jump input for upcoming landing
      this.jumpBufferTimer = JUMP_BUFFER_WINDOW;
      return false;
    }
  }

  /**
   * Internal jump execution logic.
   */
  executeJump() {
    this.vy = this.jumpVelocity;
    this.isGrounded = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
  }

  /**
   * Called on jump release to allow short hops.
   */
  releaseJump() {
    if (this.vy < SHORT_HOP_CUTOFF_VELOCITY) {
      this.vy = SHORT_HOP_CUTOFF_VELOCITY;
    }
  }

  /**
   * Enters ducking/crouching posture.
   */
  duck() {
    if (this.isDucking) return;
    this.isDucking = true;
    this.width = this.duckWidth;
    this.height = this.duckHeight;
    // Align feet with ground
    if (this.isGrounded) {
      this.y = this.groundY - this.height;
    }
  }

  /**
   * Exits ducking posture and stands up.
   */
  stand() {
    if (!this.isDucking) return;
    this.isDucking = false;
    this.width = this.baseWidth;
    this.height = this.baseHeight;
    // Align feet with ground
    if (this.isGrounded) {
      this.y = this.groundY - this.height;
    }
  }

  /**
   * Applies damage upon collision.
   * @returns {boolean} True if hit registered, false if invulnerable
   */
  hit() {
    if (this.isInvulnerable) {
      return false;
    }
    this.lives = Math.max(0, this.lives - 1);
    this.invulnerabilityTimer = this.invulnerabilityDuration;
    return true;
  }

  /**
   * Alias for hit()
   * @returns {boolean}
   */
  takeDamage() {
    return this.hit();
  }

  /**
   * Raw bounding box.
   * @returns {{ x: number, y: number, width: number, height: number }}
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  /**
   * Computes the inner contracted hitbox for collision tests.
   * @returns {{ x: number, y: number, width: number, height: number }}
   */
  getHitbox() {
    const insetX = this.isDucking ? PLAYER_DUCK_HITBOX_INSET_X : PLAYER_HITBOX_INSET_X;
    const insetY = this.isDucking ? PLAYER_DUCK_HITBOX_INSET_Y : PLAYER_HITBOX_INSET_Y;

    return {
      x: this.x + insetX,
      y: this.y + insetY,
      width: Math.max(1, this.width - 2 * insetX),
      height: Math.max(1, this.height - 2 * insetY)
    };
  }

  /**
   * Returns read-only snapshot conforming to GameSnapshot contract.
   */
  getSnapshot() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      vy: this.vy,
      isGrounded: this.isGrounded,
      lives: this.lives
    };
  }
}
