/**
 * src/core/constants.js
 * Headless Simulation Core - Physical Constants & Configuration
 * Pure ES Module with zero DOM dependencies.
 */

// -------------------------------------------------------------
// 1. Coordinate Space & Dimensions (Virtual 16:9 Canvas)
// -------------------------------------------------------------
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;
export const ASPECT_RATIO = 16 / 9;

// Ground plane definition (top edge of ground collision surface)
export const GROUND_Y = 440;
export const GROUND_HEIGHT = CANVAS_HEIGHT - GROUND_Y; // 100px

// -------------------------------------------------------------
// 2. Simulation Timing & Progression
// -------------------------------------------------------------
export const FIXED_TIMESTEP = 1 / 60; // 0.016666666666666666 (60 Hz)
export const MAX_DELTA_TIME = 0.1;    // Clamp cap to avoid spiral of death
export const GAME_DURATION = 60.0;    // Total run duration in seconds for VICTORY

// Horizontal scroll speed progression over 60 seconds
export const INITIAL_SPEED = 300;     // Speed at t = 0s (px/s)
export const MAX_SPEED = 650;         // Speed at t = 60s (px/s)
export const SPEED_ACCELERATION = (MAX_SPEED - INITIAL_SPEED) / GAME_DURATION; // ~5.833 px/s^2

// -------------------------------------------------------------
// 3. Player Kinematics & Dimensions
// -------------------------------------------------------------
export const PLAYER_START_X = 120;
export const PLAYER_WIDTH = 44;
export const PLAYER_HEIGHT = 60;
export const PLAYER_START_Y = GROUND_Y - PLAYER_HEIGHT; // 380px

// Ducking / crouching dimensions
export const PLAYER_DUCK_WIDTH = 54;
export const PLAYER_DUCK_HEIGHT = 32;

// Vertical Kinematics
export const GRAVITY = 2600;                 // Downward acceleration (px/s^2)
export const JUMP_INITIAL_VELOCITY = -850;   // Upward launch impulse (px/s)
export const TERMINAL_VELOCITY = 1200;       // Max downward fall speed (px/s)
export const SHORT_HOP_CUTOFF_VELOCITY = -300; // Clamped vy on early release (px/s)

// Calculated Parabolic Jump Invariants
export const JUMP_TIME_TO_APEX = Math.abs(JUMP_INITIAL_VELOCITY) / GRAVITY; // ~0.32692s
export const JUMP_HANG_TIME = 2 * JUMP_TIME_TO_APEX;                        // ~0.65385s
export const MAX_JUMP_HEIGHT = (JUMP_INITIAL_VELOCITY ** 2) / (2 * GRAVITY); // ~138.94px
export const PLAYER_APEX_Y = PLAYER_START_Y - MAX_JUMP_HEIGHT;              // ~241.06px

// -------------------------------------------------------------
// 4. Quality of Life (QoL) Jump Buffers
// -------------------------------------------------------------
export const JUMP_BUFFER_WINDOW = 0.12;  // Buffer window before landing (seconds)
export const COYOTE_TIME_WINDOW = 0.08;  // Grace period after leaving ground (seconds)

// -------------------------------------------------------------
// 5. Player Health, Damage & Invulnerability
// -------------------------------------------------------------
export const PLAYER_MAX_LIVES = 3;
export const INVULNERABILITY_DURATION = 1.5; // i-frame duration after hit (seconds)
export const INVULNERABILITY_BLINK_RATE = 0.1; // Flash toggle interval (seconds)

// -------------------------------------------------------------
// 6. Collision Padding & Margins (Visual Fairness)
// -------------------------------------------------------------
export const PLAYER_HITBOX_INSET_X = 6;  // Inset per side (Effective width: 44 - 12 = 32px)
export const PLAYER_HITBOX_INSET_Y = 4;  // Inset per side (Effective height: 60 - 8 = 52px)

export const PLAYER_DUCK_HITBOX_INSET_X = 6;
export const PLAYER_DUCK_HITBOX_INSET_Y = 3;

export const OBSTACLE_HITBOX_INSET_X = 4;
export const OBSTACLE_HITBOX_INSET_Y = 4;

export const ITEM_RADIUS = 16;
export const ITEM_COLLECTION_MARGIN = 4; // Generous pickup margin (px)

// -------------------------------------------------------------
// 7. Enums & Identifiers
// -------------------------------------------------------------
export const GAME_STATES = Object.freeze({
  INIT: 'INIT',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY'
});

export const ACTIONS = Object.freeze({
  START: 'START',
  JUMP: 'JUMP',
  DUCK: 'DUCK',
  STAND: 'STAND',
  PAUSE: 'PAUSE',
  RESTART: 'RESTART'
});

export const OBSTACLE_TYPES = Object.freeze({
  GROUND_HURDLE: 'GROUND_HURDLE', // Standard ground hurdle (must jump)
  LOW_BARRIER: 'LOW_BARRIER',     // Long low barrier (must jump)
  HIGH_OBSTACLE: 'HIGH_OBSTACLE'  // Airborne drone/hazard (run under / stay grounded)
});

export const ITEM_TYPES = Object.freeze({
  APPLE: 'APPLE',
  STAR: 'STAR'
});
