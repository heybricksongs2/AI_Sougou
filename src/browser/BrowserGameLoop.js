/**
 * src/browser/BrowserGameLoop.js
 * requestAnimationFrame loop with fixed timestep accumulator.
 * Clamps dt to prevent lag spikes on tab switch; calls GameEngine.tick(1/60) deterministically.
 */

export class BrowserGameLoop {
  #engine;
  #canvasRenderer;
  #uiRenderer;
  #fixedDt;
  #maxAccumulator;
  #isRunning = false;
  #rafId = null;
  #lastTime = 0;
  #accumulator = 0;

  /**
   * @param {Object} arg1 - Options object OR GameEngine instance
   * @param {Object} [arg2] - CanvasRenderer instance if arg1 is GameEngine
   * @param {Object} [arg3] - UIRenderer instance if arg1 is GameEngine
   */
  constructor(arg1, arg2, arg3) {
    let options = {};
    if (arg1 && typeof arg1.tick === 'function') {
      options = {
        engine: arg1,
        canvasRenderer: arg2 || null,
        uiRenderer: arg3 || null
      };
    } else {
      options = arg1 || {};
    }

    if (!options.engine) {
      throw new Error('[BrowserGameLoop] Valid GameEngine instance is required');
    }

    this.#engine = options.engine;
    this.#canvasRenderer = options.canvasRenderer || null;
    this.#uiRenderer = options.uiRenderer || null;
    this.#fixedDt = typeof options.fixedDt === 'number' ? options.fixedDt : 1 / 60;
    this.#maxAccumulator =
      typeof options.maxAccumulator === 'number' ? options.maxAccumulator : 0.25;
  }

  get isRunning() {
    return this.#isRunning;
  }

  /**
   * Starts the animation frame loop.
   */
  start() {
    if (this.#isRunning) return;
    this.#isRunning = true;
    this.#lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.#accumulator = 0;

    const frame = (currentTime) => {
      if (!this.#isRunning) return;

      const deltaMs = currentTime - this.#lastTime;
      this.#lastTime = currentTime;

      // Convert delta to seconds and cap to prevent lag spike / spiral of death
      const rawDt = Math.max(0, deltaMs / 1000);
      const clampedDt = Math.min(rawDt, this.#maxAccumulator);
      this.#accumulator += clampedDt;

      // Step simulation deterministically in fixed increments
      while (this.#accumulator >= this.#fixedDt) {
        this.#engine.tick(this.#fixedDt);
        this.#accumulator -= this.#fixedDt;
      }

      const snapshot = this.#engine.getSnapshot();

      // Drain accumulator if game is paused or finished to prevent burst catch-up
      if (snapshot.state !== 'RUNNING') {
        this.#accumulator = 0;
      }

      // Visual render pass (executed at display refresh rate)
      if (this.#canvasRenderer && typeof this.#canvasRenderer.render === 'function') {
        this.#canvasRenderer.render(snapshot, clampedDt);
      }

      // DOM UI synchronization pass
      if (this.#uiRenderer && typeof this.#uiRenderer.sync === 'function') {
        this.#uiRenderer.sync(snapshot);
      }

      if (typeof requestAnimationFrame !== 'undefined') {
        this.#rafId = requestAnimationFrame(frame);
      }
    };

    if (typeof requestAnimationFrame !== 'undefined') {
      this.#rafId = requestAnimationFrame(frame);
    }
  }

  /**
   * Stops the animation loop cleanly.
   */
  stop() {
    if (!this.#isRunning) return;
    this.#isRunning = false;
    if (this.#rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
  }

  /**
   * Manual discrete step (primarily for testing and debug control).
   * @param {number} [dt]
   * @returns {Object} snapshot
   */
  step(dt = this.#fixedDt) {
    this.#engine.tick(dt);
    const snapshot = this.#engine.getSnapshot();
    if (this.#canvasRenderer && typeof this.#canvasRenderer.render === 'function') {
      this.#canvasRenderer.render(snapshot, dt);
    }
    if (this.#uiRenderer && typeof this.#uiRenderer.sync === 'function') {
      this.#uiRenderer.sync(snapshot);
    }
    return snapshot;
  }
}
