# Test Infrastructure Specification (TEST_INFRA)

## 1. Overview & Test Philosophy
This document defines the automated test infrastructure for the **2D Jump-Action / Runner Browser Game** (Neon Runner 60s).
The game architecture strictly separates the headless simulation core (`src/core/`) from the browser presentation layer (`src/browser/`).
All logic tests operate completely **opaque-box** and headlessly via the public interface contracts defined in `PROJECT.md`.

### Core Principles:
1. **Zero External Test Dependencies**: Tests run using Node.js native built-in test runner (`node:test`) and assertion library (`node:assert/strict`). No `node_modules`, Jest, or Babel required.
2. **Pure Headless Simulation**: Tests execute against pure ES modules with zero DOM, zero Canvas, and zero Web Audio API dependencies.
3. **Deterministic Timestepping**: Discrete synchronous `tick(dt)` execution permits warping time (simulating an entire 60.0-second run of 3,600 ticks in < 10 milliseconds).
4. **Opaque-Box Contract Verification**: All assertions query only the public contract (`handleAction()`, `tick()`, `getSnapshot()`, `on()`, and `reset()`), without accessing private internals.

---

## 2. Test Suite Structure & Tier Organization

```
tests/
├── e2e/
│   ├── package.json               # ESM module declaration for native node:test
│   ├── tier1_features.test.js     # Tier 1: Feature coverage (F1 - F11 in isolation)
│   ├── tier2_boundaries.test.js   # Tier 2: Edge cases, limits, and boundary math
│   ├── tier3_combinations.test.js # Tier 3: Pairwise cross-feature interactions
│   └── tier4_scenarios.test.js    # Tier 4: Full lifecycle & 60.0s end-to-end simulations
└── adversarial/                   # Tier 5: Stress & adversarial testing (Hardening phase)
```

### Tier Descriptions & Coverage Requirements

| Tier | File | Scope | Minimum Target |
|------|------|-------|----------------|
| **Tier 1** | `tests/e2e/tier1_features.test.js` | Isolated feature verification for each feature F1 through F11 against public contracts. | $\ge 5$ test cases per feature ($\ge 55$ total) |
| **Tier 2** | `tests/e2e/tier2_boundaries.test.js` | Boundary conditions, limits, dt variations (0, negative, extreme spikes), terminal velocities, 0.0s timer bounds, corner collisions. | $\ge 5$ test cases per feature category ($\ge 30$ total) |
| **Tier 3** | `tests/e2e/tier3_combinations.test.js` | Cross-feature interactions and pairwise state permutations (jumping over obstacles, item collection while landing, mid-air pause/resume, high-speed collision). | $\ge 10$ combination test cases |
| **Tier 4** | `tests/e2e/tier4_scenarios.test.js` | Full end-to-end realistic user playthrough simulations (60s perfect run victory, game over life depletion, restart lifecycle, high score persistence). | $\ge 5$ complete scenario simulations |

---

## 3. Public Interface Contracts Under Test

### 3.1 `GameEngine` (`src/core/GameEngine.js`)
```javascript
export class GameEngine {
  constructor(config = {})
  reset()
  handleAction(actionType) // 'JUMP', 'START', 'RESTART', 'PAUSE'
  tick(dt)                 // dt in seconds, e.g. 1/60
  getSnapshot()            // Immutable or decoupled state snapshot
  on(event, callback)      // 'jump', 'hit', 'item_collected', 'victory', 'game_over'
}
```

### 3.2 State Snapshot Structure (`getSnapshot()`)
```javascript
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

### 3.3 Collision Math (`src/core/Collision.js`)
```javascript
export function checkAABBCollision(boxA, boxB): boolean
```

---

## 4. Test Execution & Tooling

### Test Execution Commands
- **Local Antigravity CLI**:
  ```bash
  agy-node --test tests/e2e/*.test.js
  ```
- **Standard Node.js (v18+)**:
  ```bash
  node --test tests/e2e/*.test.js
  ```
- **NPM Integration** (`package.json`):
  ```bash
  npm test
  ```
- **Single Tier Execution**:
  ```bash
  agy-node --test tests/e2e/tier1_features.test.js
  agy-node --test tests/e2e/tier2_boundaries.test.js
  agy-node --test tests/e2e/tier3_combinations.test.js
  agy-node --test tests/e2e/tier4_scenarios.test.js
  ```

### Syntax Verification Command
```bash
agy-node --check tests/e2e/tier1_features.test.js
agy-node --check tests/e2e/tier2_boundaries.test.js
agy-node --check tests/e2e/tier3_combinations.test.js
agy-node --check tests/e2e/tier4_scenarios.test.js
```

---

## 5. Maintenance & Escalation Rules
1. **Test Code Isolation**: Test suite writers own `tests/e2e/*`, `TEST_INFRA.md`, and `TEST_READY.md`.
2. **Implementation Protection**: Test writers must NOT modify `src/*`. Implementation bugs or contract discrepancies discovered during test runs are escalated to the implementing worker.
3. **No Facade Tests**: Tests must assert genuine mathematical, kinematic, and state machine invariants.
