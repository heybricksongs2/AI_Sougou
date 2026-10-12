/**
 * src/browser/UIRenderer.js
 * DOM HUD and Overlay Screen Synchronizer.
 * Decoupled from canvas drawing; syncs via GameEngine snapshots.
 */

export function calculateVictoryRank(score) {
  if (score >= 11000) {
    return { rank: 'S', title: 'CYBER LEGEND', cssClass: 'rank-s' };
  } else if (score >= 9500) {
    return { rank: 'A', title: 'NEON MASTER', cssClass: 'rank-a' };
  } else if (score >= 8500) {
    return { rank: 'B', title: 'GRID RUNNER', cssClass: 'rank-b' };
  } else {
    return { rank: 'C', title: 'SURVIVOR', cssClass: 'rank-c' };
  }
}

export class UIRenderer {
  #engine;
  #callbacks;
  #elements;

  // Cached DOM state to prevent unnecessary layout thrashing
  #lastTimeText = '';
  #lastScoreText = '';
  #lastHighScoreText = '';
  #lastSpeedText = '';
  #lastLives = -1;
  #lastState = null;

  /**
   * @param {Object} engine GameEngine instance
   * @param {Object} [callbacks={}]
   * @param {Function} [callbacks.onStart]
   * @param {Function} [callbacks.onRestart]
   * @param {Function} [callbacks.onResume]
   * @param {Function} [callbacks.onPause]
   * @param {Function} [callbacks.onToggleAudio]
   * @param {Object} [elements={}] Optional element map override for testing
   */
  constructor(engine, callbacks = {}, elements = {}) {
    this.#engine = engine;
    this.#callbacks = callbacks;
    this.#elements = elements;
  }

  /**
   * Initializes DOM bindings and event listeners.
   */
  init() {
    const getEl = (id) =>
      this.#elements[id] || (typeof document !== 'undefined' ? document.getElementById(id) : null);

    this.#elements = {
      // HUD
      hudTimer: getEl('hud-timer'),
      hudScore: getEl('hud-score'),
      hudHigh: getEl('hud-high'),
      hudSpeed: getEl('hud-speed'),
      hudLives: getEl('hud-lives'),

      // Overlays
      overlayContainer: getEl('overlay-container'),
      screenStart: getEl('screen-start'),
      screenPause: getEl('screen-pause'),
      screenGameOver: getEl('screen-gameover'),
      screenVictory: getEl('screen-victory'),

      // Buttons
      btnStart: getEl('btn-start'),
      btnResume: getEl('btn-resume'),
      btnRestart: getEl('btn-restart'),
      btnVictoryRestart: getEl('btn-victory-restart'),
      btnPauseRestart: getEl('btn-pause-restart'),
      btnAudioToggle: getEl('sound-toggle'),

      // Stats fields in overlays
      pauseTime: getEl('pause-time'),
      pauseScore: getEl('pause-score'),
      gameoverTime: getEl('gameover-time'),
      gameoverScore: getEl('gameover-score'),
      gameoverBest: getEl('gameover-best'),
      gameoverNewRecord: getEl('gameover-new-record'),
      victoryScore: getEl('victory-score'),
      victoryBest: getEl('victory-best'),
      victoryRank: getEl('victory-rank'),
      victoryRankTitle: getEl('victory-rank-title'),
      victoryNewRecord: getEl('victory-new-record'),
      ...this.#elements
    };

    // Attach button listeners safely
    if (this.#elements.btnStart && this.#callbacks.onStart) {
      this.#elements.btnStart.addEventListener('click', (e) => {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        this.#callbacks.onStart();
      });
    }

    if (this.#elements.btnResume && this.#callbacks.onResume) {
      this.#elements.btnResume.addEventListener('click', (e) => {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        this.#callbacks.onResume();
      });
    }

    const triggerRestart = (e) => {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      if (this.#callbacks.onRestart) this.#callbacks.onRestart();
    };

    if (this.#elements.btnRestart) this.#elements.btnRestart.addEventListener('click', triggerRestart);
    if (this.#elements.btnVictoryRestart)
      this.#elements.btnVictoryRestart.addEventListener('click', triggerRestart);
    if (this.#elements.btnPauseRestart)
      this.#elements.btnPauseRestart.addEventListener('click', triggerRestart);

    if (this.#elements.btnAudioToggle && this.#callbacks.onToggleAudio) {
      this.#elements.btnAudioToggle.addEventListener('click', (e) => {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        const enabled = this.#callbacks.onToggleAudio();
        this.updateAudioButton(enabled);
      });
    }
  }

  /**
   * Update audio button display text.
   * @param {boolean} isEnabled
   */
  updateAudioButton(isEnabled) {
    if (this.#elements.btnAudioToggle) {
      this.#elements.btnAudioToggle.textContent = isEnabled ? '🔊 サウンド: ON' : '🔇 サウンド: OFF';
    }
  }

  /**
   * Synchronize DOM display to match GameEngine snapshot.
   * Call once per frame in RAF loop.
   * @param {Object} snapshot
   */
  sync(snapshot) {
    if (!snapshot) return;

    // 1. Sync Timer HUD (Format: "60.0s")
    const formattedTime = `${Math.max(0, snapshot.timeRemaining).toFixed(1)}s`;
    if (formattedTime !== this.#lastTimeText && this.#elements.hudTimer) {
      this.#elements.hudTimer.textContent = formattedTime;
      this.#lastTimeText = formattedTime;

      // Pulse red when under 10 seconds during active run
      if (snapshot.timeRemaining <= 10.0 && snapshot.state === 'RUNNING') {
        if (this.#elements.hudTimer.classList) {
          this.#elements.hudTimer.classList.add('time-critical');
        }
      } else {
        if (this.#elements.hudTimer.classList) {
          this.#elements.hudTimer.classList.remove('time-critical');
        }
      }
    }

    // 2. Sync Score HUD
    const formattedScore = Math.floor(snapshot.score).toLocaleString();
    if (formattedScore !== this.#lastScoreText && this.#elements.hudScore) {
      this.#elements.hudScore.textContent = formattedScore;
      this.#lastScoreText = formattedScore;
    }

    // 3. Sync High Score HUD
    const formattedHigh = Math.floor(snapshot.highScore).toLocaleString();
    if (formattedHigh !== this.#lastHighScoreText && this.#elements.hudHigh) {
      this.#elements.hudHigh.textContent = formattedHigh;
      this.#lastHighScoreText = formattedHigh;
    }

    // 4. Sync Speed Multiplier HUD (Initial speed 300 = 1.0x)
    const baseSpeed = 300;
    const formattedSpeed = `${(snapshot.speed / baseSpeed).toFixed(1)}x`;
    if (formattedSpeed !== this.#lastSpeedText && this.#elements.hudSpeed) {
      this.#elements.hudSpeed.textContent = formattedSpeed;
      this.#lastSpeedText = formattedSpeed;
    }

    // 5. Sync Lives HUD
    const lives = snapshot.player ? snapshot.player.lives : 0;
    if (lives !== this.#lastLives && this.#elements.hudLives) {
      this.#elements.hudLives.textContent = '❤️'.repeat(Math.max(0, lives));
      this.#lastLives = lives;
    }

    // 6. Sync Screen Overlays if State Changed
    if (snapshot.state !== this.#lastState) {
      this.#updateScreens(snapshot);
      this.#lastState = snapshot.state;
    }
  }

  /**
   * Transitions overlay screen visibility and updates final stat screens.
   * @param {Object} snapshot
   */
  #updateScreens(snapshot) {
    const {
      overlayContainer,
      screenStart,
      screenPause,
      screenGameOver,
      screenVictory
    } = this.#elements;

    if (!overlayContainer) return;

    // Helper to switch active sub-screen
    const activateScreen = (activeScreen) => {
      if (overlayContainer.classList) {
        overlayContainer.classList.add('active');
      }
      [screenStart, screenPause, screenGameOver, screenVictory].forEach((screen) => {
        if (screen && screen.classList) {
          if (screen === activeScreen) {
            screen.classList.add('active');
          } else {
            screen.classList.remove('active');
          }
        }
      });
    };

    switch (snapshot.state) {
      case 'INIT':
        activateScreen(screenStart);
        break;

      case 'RUNNING':
        if (overlayContainer.classList) {
          overlayContainer.classList.remove('active');
        }
        [screenStart, screenPause, screenGameOver, screenVictory].forEach((screen) => {
          if (screen && screen.classList) screen.classList.remove('active');
        });
        break;

      case 'PAUSED':
        if (this.#elements.pauseTime) {
          this.#elements.pauseTime.textContent = `${Math.max(0, snapshot.timeRemaining).toFixed(1)}s`;
        }
        if (this.#elements.pauseScore) {
          this.#elements.pauseScore.textContent = Math.floor(snapshot.score).toLocaleString();
        }
        activateScreen(screenPause);
        break;

      case 'GAME_OVER':
        if (this.#elements.gameoverTime) {
          this.#elements.gameoverTime.textContent = `${snapshot.timeElapsed.toFixed(1)}s / 60.0s`;
        }
        if (this.#elements.gameoverScore) {
          this.#elements.gameoverScore.textContent = Math.floor(snapshot.score).toLocaleString();
        }
        if (this.#elements.gameoverBest) {
          this.#elements.gameoverBest.textContent = Math.floor(snapshot.highScore).toLocaleString();
        }
        if (this.#elements.gameoverNewRecord && this.#elements.gameoverNewRecord.classList) {
          const isNewRecord = snapshot.score >= snapshot.highScore && snapshot.score > 0;
          this.#elements.gameoverNewRecord.classList.toggle('hidden', !isNewRecord);
        }
        activateScreen(screenGameOver);
        break;

      case 'VICTORY': {
        const score = Math.floor(snapshot.score);
        if (this.#elements.victoryScore) {
          this.#elements.victoryScore.textContent = score.toLocaleString();
        }
        if (this.#elements.victoryBest) {
          this.#elements.victoryBest.textContent = Math.floor(snapshot.highScore).toLocaleString();
        }

        const rankInfo = calculateVictoryRank(score);
        if (this.#elements.victoryRank) {
          this.#elements.victoryRank.textContent = rankInfo.rank;
          this.#elements.victoryRank.className = `rank-badge ${rankInfo.cssClass}`;
        }
        if (this.#elements.victoryRankTitle) {
          this.#elements.victoryRankTitle.textContent = rankInfo.title;
        }
        if (this.#elements.victoryNewRecord && this.#elements.victoryNewRecord.classList) {
          const isNewRecord = score >= snapshot.highScore && score > 0;
          this.#elements.victoryNewRecord.classList.toggle('hidden', !isNewRecord);
        }
        activateScreen(screenVictory);
        break;
      }

      default:
        break;
    }
  }
}
