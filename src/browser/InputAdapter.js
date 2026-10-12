/**
 * src/browser/InputAdapter.js
 * Bridges DOM keyboard, pointer, and mobile touch events to GameEngine semantic actions.
 * Supports flexible constructor signatures and headless Node.js safety.
 */

export class InputAdapter {
  #engine;
  #targetElement;
  #options;
  #enabled = true;
  #isDucking = false;
  #lastTouchTime = 0;
  #touchStartY = 0;
  #touchStartX = 0;

  // Bound event listeners for clean detachment
  #onKeyDownBound;
  #onKeyUpBound;
  #onPointerDownBound;
  #onTouchStartBound;
  #onTouchMoveBound;
  #onTouchEndBound;

  /**
   * @param {Object} engine - GameEngine instance
   * @param {HTMLElement|Window|Object} [targetElementOrOptions=window] - Target DOM element or options object
   * @param {Object} [maybeOptions={}] - Custom configuration if element passed as 2nd arg
   */
  constructor(engine, targetElementOrOptions = (typeof window !== 'undefined' ? window : null), maybeOptions = {}) {
    if (!engine || typeof engine.handleAction !== 'function') {
      throw new TypeError('[InputAdapter] Valid GameEngine instance with handleAction is required.');
    }

    this.#engine = engine;

    let targetElement = typeof window !== 'undefined' ? window : null;
    let options = {};

    if (
      targetElementOrOptions &&
      (typeof targetElementOrOptions.addEventListener === 'function' ||
        (typeof window !== 'undefined' && targetElementOrOptions === window))
    ) {
      targetElement = targetElementOrOptions;
      options = maybeOptions || {};
    } else if (targetElementOrOptions && typeof targetElementOrOptions === 'object') {
      options = targetElementOrOptions;
      targetElement =
        options.targetElement || options.target || (typeof window !== 'undefined' ? window : null);
    }

    this.#targetElement = targetElement;
    this.#options = {
      enableKeyboard: options.enableKeyboard !== false,
      enablePointer: options.enablePointer !== false,
      enableTouch: options.enableTouch !== false,
      enableSwipeDuck: options.enableSwipeDuck !== false,
      onAction: typeof options.onAction === 'function' ? options.onAction : null,
      onUserGesture: typeof options.onUserGesture === 'function' ? options.onUserGesture : null,
      ...options
    };

    this.#onKeyDownBound = this.#handleKeyDown.bind(this);
    this.#onKeyUpBound = this.#handleKeyUp.bind(this);
    this.#onPointerDownBound = this.#handlePointerDown.bind(this);
    this.#onTouchStartBound = this.#handleTouchStart.bind(this);
    this.#onTouchMoveBound = this.#handleTouchMove.bind(this);
    this.#onTouchEndBound = this.#handleTouchEnd.bind(this);

    this.attach();
  }

  /**
   * Optional lifecycle init helper.
   */
  init() {
    this.attach();
  }

  /**
   * Attach all DOM listeners.
   */
  attach() {
    if (typeof window === 'undefined') return; // Headless guard

    this.detach(); // Avoid duplicate listeners

    if (this.#options.enableKeyboard) {
      window.addEventListener('keydown', this.#onKeyDownBound, { passive: false });
      window.addEventListener('keyup', this.#onKeyUpBound, { passive: false });
    }

    if (this.#options.enablePointer && this.#targetElement && typeof this.#targetElement.addEventListener === 'function') {
      this.#targetElement.addEventListener('pointerdown', this.#onPointerDownBound, { passive: false });
    }

    if (this.#options.enableTouch && this.#targetElement && typeof this.#targetElement.addEventListener === 'function') {
      this.#targetElement.addEventListener('touchstart', this.#onTouchStartBound, { passive: false });
      this.#targetElement.addEventListener('touchmove', this.#onTouchMoveBound, { passive: false });
      this.#targetElement.addEventListener('touchend', this.#onTouchEndBound, { passive: false });
      this.#targetElement.addEventListener('touchcancel', this.#onTouchEndBound, { passive: false });
    }
  }

  /**
   * Detach all DOM listeners to avoid memory leaks.
   */
  detach() {
    if (typeof window === 'undefined') return;

    window.removeEventListener('keydown', this.#onKeyDownBound);
    window.removeEventListener('keyup', this.#onKeyUpBound);

    if (this.#targetElement && typeof this.#targetElement.removeEventListener === 'function') {
      this.#targetElement.removeEventListener('pointerdown', this.#onPointerDownBound);
      this.#targetElement.removeEventListener('touchstart', this.#onTouchStartBound);
      this.#targetElement.removeEventListener('touchmove', this.#onTouchMoveBound);
      this.#targetElement.removeEventListener('touchend', this.#onTouchEndBound);
      this.#targetElement.removeEventListener('touchcancel', this.#onTouchEndBound);
    }
  }

  /**
   * Enable or disable adapter input dispatching.
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    const nextEnabled = Boolean(enabled);
    if (!nextEnabled && this.#enabled && (this.#isDucking || this.#isEnginePlayerDucking())) {
      this.#dispatchAction('STAND');
      this.#isDucking = false;
    }
    this.#enabled = nextEnabled;
  }

  get isEnabled() {
    return this.#enabled;
  }

  /**
   * Manually dispatch a semantic action (e.g. from on-screen HUD buttons).
   * @param {string} actionType
   */
  dispatch(actionType) {
    this.#dispatchAction(actionType);
  }

  #notifyGesture() {
    if (this.#options.onUserGesture) {
      this.#options.onUserGesture();
    }
  }

  #dispatchAction(actionType) {
    if (!this.#enabled) return;
    if (actionType === 'DUCK') {
      this.#isDucking = true;
    } else if (actionType === 'STAND' || actionType === 'START' || actionType === 'RESTART') {
      this.#isDucking = false;
    }
    this.#notifyGesture();
    this.#engine.handleAction(actionType);
    if (this.#options.onAction) {
      this.#options.onAction(actionType);
    }
  }

  #isEnginePlayerDucking() {
    try {
      const snap = typeof this.#engine.getSnapshot === 'function' ? this.#engine.getSnapshot() : null;
      if (snap && snap.player) {
        return snap.player.isDucking === true || snap.player.height < 64;
      }
    } catch (_) {}
    return false;
  }

  #getState() {
    const snapshot = this.#engine.getSnapshot();
    return snapshot ? snapshot.state : 'INIT';
  }

  #handleKeyDown(event) {
    if (!this.#enabled) return;

    const code = event.code;
    const isJumpKey = code === 'Space' || code === 'ArrowUp' || code === 'KeyW';
    const isDuckKey = code === 'ArrowDown' || code === 'KeyS';
    const isPauseKey = code === 'KeyP' || code === 'Escape';
    const isEnterKey = code === 'Enter';

    // Prevent default scrolling for standard game navigation keys
    if (code === 'Space' || code === 'ArrowUp' || code === 'ArrowDown') {
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }

    const state = this.#getState();

    if (isJumpKey || isEnterKey) {
      if (state === 'INIT') {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        this.#dispatchAction('START');
        return;
      }
      if (state === 'GAME_OVER' || state === 'VICTORY') {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        this.#dispatchAction('RESTART');
        return;
      }
    }

    if (isJumpKey && state === 'RUNNING') {
      // Disallow keyrepeat spamming for jump buffering
      if (!event.repeat) {
        this.#dispatchAction('JUMP');
      }
      return;
    }

    if (isDuckKey && state === 'RUNNING') {
      if (!this.#isDucking) {
        this.#isDucking = true;
        this.#dispatchAction('DUCK');
      }
      return;
    }

    if (isPauseKey) {
      if (state === 'RUNNING' || state === 'PAUSED') {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        this.#dispatchAction('PAUSE');
      }
    }
  }

  #handleKeyUp(event) {
    if (!this.#enabled) return;

    const code = event.code;
    const isDuckKey = code === 'ArrowDown' || code === 'KeyS';

    if (isDuckKey) {
      if (this.#isDucking) {
        this.#isDucking = false;
        this.#dispatchAction('STAND');
      }
    }
  }

  #handlePointerDown(event) {
    if (!this.#enabled) return;
    // Primary button only (left click / touch)
    if (typeof event.button === 'number' && event.button !== 0) return;

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();

    // Reject mouse events generated shortly after touch (ghost click suppression)
    if (event.pointerType === 'mouse' && now - this.#lastTouchTime < 500) {
      return;
    }

    // Touch events are separately handled via touchstart for high precision
    if (event.pointerType === 'touch') {
      return;
    }

    this.#handleInteractionTrigger();
  }

  #handleTouchStart(event) {
    this.#lastTouchTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (!this.#enabled) return;

    // Prevent scrolling, zooming, and synthetic mouse emulation
    if (typeof event.preventDefault === 'function') event.preventDefault();

    if (event.touches && event.touches.length > 0) {
      this.#touchStartX = event.touches[0].clientX;
      this.#touchStartY = event.touches[0].clientY;
    }

    this.#handleInteractionTrigger();
  }

  #handleTouchMove(event) {
    if (!this.#enabled || !this.#options.enableSwipeDuck) return;
    if (typeof event.preventDefault === 'function') event.preventDefault();

    if (event.touches && event.touches.length > 0) {
      const currentY = event.touches[0].clientY;
      const deltaY = currentY - this.#touchStartY;

      // Swiping downward (> 35px) initiates ducking
      if (deltaY > 35 && !this.#isDucking && this.#getState() === 'RUNNING') {
        this.#isDucking = true;
        this.#dispatchAction('DUCK');
      }
    }
  }

  #handleTouchEnd(event) {
    if (!this.#enabled) return;

    if (this.#isDucking) {
      this.#isDucking = false;
      this.#dispatchAction('STAND');
    }
  }

  #handleInteractionTrigger() {
    const state = this.#getState();
    if (state === 'INIT') {
      this.#dispatchAction('START');
    } else if (state === 'RUNNING') {
      this.#dispatchAction('JUMP');
    } else if (state === 'GAME_OVER' || state === 'VICTORY') {
      this.#dispatchAction('RESTART');
    }
  }
}
