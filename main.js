/**
 * main.js - Application bootstrap & entry point
 * High-octane 60-second 2D cyber-neon runner.
 * ES Module running in modern browsers for GitHub Pages static hosting.
 */

import { GameEngine } from './src/core/GameEngine.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, FIXED_TIMESTEP } from './src/core/constants.js';
import { CanvasRenderer } from './src/browser/CanvasRenderer.js';
import { InputAdapter } from './src/browser/InputAdapter.js';
import { AudioAdapter } from './src/browser/AudioAdapter.js';
import { UIRenderer } from './src/browser/UIRenderer.js';
import { BrowserGameLoop } from './src/browser/BrowserGameLoop.js';

const STORAGE_KEY_HIGH_SCORE = 'neon_runner_high_score';

function bootstrap() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('[main.js] Fatal: Canvas element #game-canvas not found.');
    return;
  }

  // 1. Read persisted high score
  let savedHighScore = 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HIGH_SCORE);
    if (raw) savedHighScore = parseInt(raw, 10) || 0;
  } catch (e) {
    console.warn('[main.js] LocalStorage not accessible:', e);
  }

  // 2. Headless Core Engine
  const engine = new GameEngine({
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    initialHighScore: savedHighScore
  });

  // Persist high scores across sessions
  const persistScore = (data) => {
    try {
      if (data && data.highScore > savedHighScore) {
        savedHighScore = data.highScore;
        localStorage.setItem(STORAGE_KEY_HIGH_SCORE, String(savedHighScore));
      }
    } catch (e) {
      // LocalStorage error handling
    }
  };
  engine.on('game_over', persistScore);
  engine.on('victory', persistScore);

  // 3. Audio Adapter (Procedural Web Audio API)
  const audioAdapter = new AudioAdapter(engine, { volume: 0.35 });

  // 4. UI Renderer (DOM HUD & Overlays)
  const uiRenderer = new UIRenderer(engine, {
    onStart: () => {
      audioAdapter.unlock();
      engine.handleAction('START');
    },
    onRestart: () => {
      audioAdapter.unlock();
      engine.handleAction('RESTART');
    },
    onResume: () => {
      audioAdapter.unlock();
      engine.handleAction('PAUSE');
    },
    onPause: () => {
      engine.handleAction('PAUSE');
    },
    onToggleAudio: () => {
      return audioAdapter.toggle();
    }
  });

  // 5. Canvas Renderer (Cyber-Neon 2D Graphics)
  const canvasRenderer = new CanvasRenderer(canvas, {
    virtualWidth: CANVAS_WIDTH,
    virtualHeight: CANVAS_HEIGHT
  });
  canvasRenderer.attachEngine(engine);

  // Responsive canvas resize binding
  const handleResize = () => {
    const container = canvas.parentElement;
    if (container) {
      canvasRenderer.resize(container.clientWidth, container.clientHeight);
    } else {
      canvasRenderer.resize(window.innerWidth, window.innerHeight);
    }
  };
  window.addEventListener('resize', handleResize);
  handleResize();

  // 6. Input Adapter (Multi-device Keyboard, Mouse, Touch)
  const inputAdapter = new InputAdapter(engine, canvas, {
    enableSwipeDuck: true,
    onUserGesture: () => {
      audioAdapter.unlock();
    }
  });

  // 7. Browser Game Loop
  const gameLoop = new BrowserGameLoop({
    engine,
    canvasRenderer,
    uiRenderer,
    fixedDt: FIXED_TIMESTEP,
    maxAccumulator: 0.25
  });

  // Subsystem initialization
  uiRenderer.init();
  if (typeof inputAdapter.init === 'function') inputAdapter.init();
  if (typeof canvasRenderer.init === 'function') canvasRenderer.init();

  // Sync initial sound toggle button status
  uiRenderer.updateAudioButton(!audioAdapter.isMuted);

  // Render initial frame and sync HUD
  const initialSnapshot = engine.getSnapshot();
  if (typeof canvasRenderer.render === 'function') {
    canvasRenderer.render(initialSnapshot, 0);
  }
  uiRenderer.sync(initialSnapshot);

  // Begin RAF loop
  gameLoop.start();
}

// Ensure execution when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
}
