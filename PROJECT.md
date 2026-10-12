# Project: 2D Jump-Action / Runner Browser Game

## Architecture
The application is strictly partitioned into two decoupled layers:
1. **Headless Simulation Core (`src/core/`)**:
   - Zero DOM / Browser API dependencies (runs headlessly in Node.js v24 `agy-node` and in modern browsers via standard ES Modules).
   - Deterministic synchronous timestepping (`tick(dt)`).
   - Pure mathematical calculations (player kinematics, gravity, procedural obstacle generator, AABB collision, timer, score, state transitions).
   - Event-driven publisher (`EventBus`) for decoupling state changes from presentation.
   - Snapshot generator (`getSnapshot()`) exposing read-only game state to renderers.

2. **Browser Presentation & Adapters (`src/browser/`)**:
   - `CanvasRenderer`: Draws high-performance cyber-neon 2D graphics, parallax ground/backdrop, player run/jump frames, obstacles, and particle effects on a 16:9 responsive canvas.
   - `InputAdapter`: Normalizes keyboard (Space / Up Arrow), mouse clicks, and touch/tap events on mobile viewports into semantic actions (`JUMP`, `START`, `RESTART`).
   - `AudioAdapter`: Web Audio API procedural synthesizer playing sound effects (jump, hit, item pickup, victory).
   - `UIRenderer`: Synchronizes HUD (timer, score, high score, speed) and overlay screens (Instructions, Game Over, Victory).
   - `BrowserGameLoop`: `requestAnimationFrame` with fixed timestep accumulator (clamped at 250ms) to ensure consistent 60Hz physics across any display refresh rate (60Hz/120Hz/144Hz).

```
   ┌────────────────────────────────────────────────────────┐
   │                    Browser Layer                       │
   │  [InputAdapter]    [CanvasRenderer]    [AudioAdapter]  │
   │  (PC & Mobile)     (Cyber-Neon 16:9)   (Web Audio Synth)│
   └──────────┬─────────────────▲───────────────────▲───────┘
              │ actions         │ snapshot          │ events
              ▼                 │                   │
   ┌────────────────────────────┴───────────────────┴───────┐
   │             Headless Core Simulation (Node.js)         │
   │  [GameEngine] ──── [StateMachine] ──── [EventBus]      │
   │       │                    │                           │
   │  [PlayerPhysics]   [ObstacleManager]   [CollisionMath] │
   └────────────────────────────────────────────────────────┘
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Core Runner Physics | Player jump, gravity, terminal velocity, ground detection, jump buffering | M1 | Survey (Explorer 1, 2) |
| F2 | Procedural Obstacle Spawning | Ground hurdles, floating obstacles, speed progression over time | M1 | Survey (Explorer 1, 2) |
| F3 | Pure AABB Collision Math | Bounding box intersection with safety envelopes, tunneling prevention | M1 | Survey (Explorer 1, 2) |
| F4 | 60-Second Countdown & Run Timer | Deterministic 60s countdown, speed multiplier scaling, 60s survival win | M1 | Survey (Explorer 1, 2, 3) |
| F5 | Score & Item Pickup Management | Distance accumulation score, collectible bonus items, high score | M1 | Survey (Explorer 1, 2) |
| F6 | Game Lifecycle State Machine | INIT/TITLE -> RUNNING -> PAUSED -> GAME_OVER / VICTORY transitions | M1 | Survey (Explorer 1, 2) |
| F7 | Multi-device Controls & Normalization | Keyboard (Space/Up), Mouse Click, Touch/Tap on mobile viewports | M2 | Survey (Explorer 1, 2) |
| F8 | Cyber-Neon Canvas 2D Presentation | Responsive 16:9 Canvas, parallax scroll, particle bursts, visual HUD | M2 | Survey (Explorer 1, 2) |
| F9 | Web Audio API Synth Effects | Procedural sound generation (jump chime, hit buzz, win fanfare, mute) | M2 | Survey (Explorer 1, 2) |
| F10 | Decoupled Node.js Test Suite | Automated test runner with node:test & assert, 100% pass, npm test | E2E & M3 | Survey (Explorer 2, 3) |
| F11 | GitHub Pages Static Deployment | 0-backend static hosting, strict relative `./` paths, mobile touch-action | M2 | Survey (Explorer 1, 3) |


## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Independent opaque-box test suite (Tiers 1-4) & test infra | None | DONE |
| M1 | Headless Simulation Core | Pure JS physics, obstacles, collision, timer, scoring, state machine | None | DONE |
| M2 | Browser Presentation & Web Integration | Canvas 2D renderer, multi-device input, Web Audio synth, HUD, index/CSS/main.js | M1 | DONE |
| M3 | Final Milestone: Full Verification & Hardening | Phase 1: Pass 100% E2E tests (Tiers 1-4); Phase 2: Adversarial coverage hardening (Tier 5) | E2E, M2 | DONE |




## Interface Contracts

### GameEngine ↔ Presenters (`src/core/GameEngine.js`)
```javascript
export class GameEngine {
  constructor(config = {})
  reset()
  handleAction(actionType) // 'JUMP', 'START', 'RESTART', 'PAUSE'
  tick(dt) // dt in seconds, e.g. 1/60
  getSnapshot() // Read-only representation of entire state
  on(event, callback) // 'jump', 'hit', 'item_collected', 'victory', 'game_over'
}
```

### GameSnapshot Contract (`src/core/types.js`)
```javascript
// Snapshot emitted by GameEngine.getSnapshot():
{
  state: 'INIT' | 'RUNNING' | 'GAME_OVER' | 'VICTORY' | 'PAUSED',
  timeRemaining: number, // 60.00 down to 0.00
  timeElapsed: number,   // 0.00 up to 60.00
  score: number,
  highScore: number,
  speed: number,         // pixels per second (e.g. 300 to 650)
  player: {
    x: number,
    y: number,
    width: number,
    height: number,
    vy: number,
    isGrounded: boolean,
    lives: number
  },
  obstacles: Array<{
    id: number,
    x: number,
    y: number,
    width: number,
    height: number,
    type: 'GROUND_HURDLE' | 'LOW_BARRIER' | 'HIGH_OBSTACLE'
  }>,
  items: Array<{
    id: number,
    x: number,
    y: number,
    radius: number,
    collected: boolean
  }>
}
```

### Collision Interface (`src/core/Collision.js`)
```javascript
export function checkAABBCollision(boxA, boxB): boolean
```

## Code Layout
```
c:\Users\yoton\Documents\Antigravity_SANDBOX\github-pages-site\
├── .agents/teamwork/             # Agent metadata only (NO source code)
├── src/
│   ├── core/                     # Pure JS Headless Simulation (0 DOM dependencies)
│   │   ├── constants.js          # Physics & timing constants (60s, gravity, speed curve)
│   │   ├── EventBus.js           # Decoupled publish/subscribe bus
│   │   ├── StateMachine.js       # Game lifecycle states (INIT, RUNNING, GAMEOVER, VICTORY)
│   │   ├── Player.js             # Player kinematics & jump physics
│   │   ├── ObstacleManager.js    # Procedural obstacle spawning and scrolling
│   │   ├── ItemManager.js        # Collectible bonus items
│   │   ├── Collision.js          # AABB collision math
│   │   ├── ScoreManager.js       # Score and distance calculation
│   │   └── GameEngine.js         # Unified headless simulation orchestrator
│   └── browser/                  # Browser Adapters & Presentation
│       ├── InputAdapter.js       # Keyboard, mouse, touch event listener & action dispatcher
│       ├── CanvasRenderer.js     # 2D canvas drawing (cyber-neon theme, parallax, particles)
│       ├── AudioAdapter.js       # Procedural Web Audio API sound synthesizer
│       ├── UIRenderer.js         # DOM HUD & overlay screen manager
│       └── BrowserGameLoop.js    # RAF loop with accumulator fixed timestep
├── tests/                        # Automated Node.js test suite
│   ├── e2e/                      # Opaque-box requirements tests (Tiers 1-4)
│   │   ├── tier1_features.test.js
│   │   ├── tier2_boundaries.test.js
│   │   ├── tier3_combinations.test.js
│   │   └── tier4_scenarios.test.js
│   └── adversarial/              # Tier 5 Adversarial tests
├── index.html                    # Static HTML entry point (relative paths)
├── style.css                     # Responsive styling & cyber-neon theme
├── main.js                       # Browser bootstrap entry point (ESM)
├── package.json                  # Test scripts ("test": "agy-node --test" / "node --test")
└── README.md                     # Documentation & GitHub Pages live link
```
