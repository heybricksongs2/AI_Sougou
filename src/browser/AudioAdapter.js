/**
 * src/browser/AudioAdapter.js
 * Procedural Web Audio API sound synthesizer with zero external audio assets.
 * Passively observes GameEngine EventBus and handles browser autoplay policies.
 */

export class AudioAdapter {
  #ctx = null;
  #masterGain = null;
  #volume = 0.3;
  #isMuted = false;
  #isSupported = false;
  #unsubscribers = [];
  #storageKey = 'neon_runner_muted';

  /**
   * @param {Object} [engine] - Optional GameEngine to automatically bind
   * @param {Object} [options] - Configuration options
   */
  constructor(engine, options = {}) {
    this.#volume =
      typeof options.volume === 'number' ? Math.max(0, Math.min(1, options.volume)) : 0.3;
    this.#isMuted = options.muted === true;

    // Load persisted mute state if available
    this.#loadMutePreference();

    this.#initAudioContext();

    if (options.autoUnlock !== false) {
      this.#setupAutoUnlock();
    }

    if (engine) {
      this.attach(engine);
    }
  }

  /**
   * Check if Web Audio API is supported in current environment.
   * @returns {boolean}
   */
  get isSupported() {
    return this.#isSupported;
  }

  get isMuted() {
    return this.#isMuted;
  }

  get volume() {
    return this.#volume;
  }

  /**
   * Explicitly unlock or resume AudioContext upon user gesture.
   * @returns {Promise<void>}
   */
  async unlock() {
    if (!this.#isSupported || !this.#ctx) return;

    if (this.#ctx.state === 'suspended') {
      try {
        await this.#ctx.resume();
      } catch (err) {
        // Safe catch for environment policy differences
      }
    }

    // iOS Safari silent buffer wake-up hack
    try {
      const buffer = this.#ctx.createBuffer(1, 1, 22050);
      const source = this.#ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.#ctx.destination);
      source.start(0);
    } catch {
      // Ignore fallback errors
    }
  }

  /**
   * Alias for unlock()
   */
  async resume() {
    return this.unlock();
  }

  /**
   * Toggle mute state and persist preference.
   * @returns {boolean} New mute state
   */
  toggleMute() {
    this.setMuted(!this.#isMuted);
    return this.#isMuted;
  }

  /**
   * Alias for toggleMute()
   */
  toggle() {
    return !this.toggleMute(); // returns enabled boolean
  }

  /**
   * Set mute state explicitly.
   * @param {boolean} muted
   */
  setMuted(muted) {
    this.#isMuted = Boolean(muted);
    this.#persistMutePreference();

    if (this.#masterGain && this.#ctx) {
      const targetGain = this.#isMuted ? 0 : this.#volume;
      const t = this.#ctx.currentTime;
      this.#masterGain.gain.cancelScheduledValues(t);
      this.#masterGain.gain.linearRampToValueAtTime(targetGain, t + 0.03);
    }
  }

  /**
   * Adjust master volume (0.0 to 1.0).
   * @param {number} vol
   */
  setVolume(vol) {
    if (typeof vol !== 'number' || Number.isNaN(vol)) return;
    this.#volume = Math.max(0, Math.min(1, vol));

    if (this.#masterGain && this.#ctx && !this.#isMuted) {
      const t = this.#ctx.currentTime;
      this.#masterGain.gain.cancelScheduledValues(t);
      this.#masterGain.gain.linearRampToValueAtTime(this.#volume, t + 0.03);
    }
  }

  /**
   * Attach passive listeners to GameEngine EventBus.
   * @param {Object} engine
   */
  attach(engine) {
    if (!engine || typeof engine.on !== 'function') return;
    this.detach(); // Clean up existing subscriptions

    this.#unsubscribers.push(
      engine.on('jump', () => this.playJump()),
      engine.on('hit', () => this.playHit()),
      engine.on('item_collected', (data) => this.playItemCollected(data?.item?.type)),
      engine.on('victory', () => this.playVictory()),
      engine.on('game_over', () => this.playGameOver()),
      engine.on('pause', () => this.playPause()),
      engine.on('resume', () => this.playResume())
    );
  }

  /**
   * Unsubscribe all EventBus listeners.
   */
  detach() {
    for (const unsub of this.#unsubscribers) {
      if (typeof unsub === 'function') unsub();
    }
    this.#unsubscribers = [];
  }

  /**
   * Destroy adapter and close AudioContext.
   */
  async destroy() {
    this.detach();
    if (this.#ctx && this.#ctx.state !== 'closed') {
      try {
        await this.#ctx.close();
      } catch {
        // Safe close
      }
    }
  }

  // ========================================================
  // Procedural Sound Generators
  // ========================================================

  playJump() {
    if (!this.#canPlay()) return;
    const ctx = this.#ctx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.12);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.#masterGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  playHit() {
    if (!this.#canPlay()) return;
    const ctx = this.#ctx;
    const t = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';

    osc1.frequency.setValueAtTime(220, t);
    osc1.frequency.exponentialRampToValueAtTime(40, t + 0.25);

    osc2.frequency.setValueAtTime(232, t);
    osc2.frequency.exponentialRampToValueAtTime(38, t + 0.25);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.25);
    filter.Q.setValueAtTime(4.0, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.#masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.26);
    osc2.stop(t + 0.26);
  }

  playItemCollected(itemType) {
    if (!this.#canPlay()) return;
    const ctx = this.#ctx;
    const t = ctx.currentTime;

    const isStar = itemType === 'STAR';
    const notes = isStar ? [1046.5, 1567.98, 2093.0] : [1046.5, 1567.98];
    const delayStep = 0.055;

    notes.forEach((freq, idx) => {
      const noteTime = t + idx * delayStep;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.28, noteTime + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.12);

      osc.connect(gain);
      gain.connect(this.#masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.13);
    });
  }

  playVictory() {
    if (!this.#canPlay()) return;
    const ctx = this.#ctx;
    const t = ctx.currentTime;

    const chords = [
      { freq: 523.25, time: 0.0, dur: 0.14, gain: 0.25 },
      { freq: 659.25, time: 0.13, dur: 0.14, gain: 0.25 },
      { freq: 783.99, time: 0.26, dur: 0.16, gain: 0.28 },
      { freq: 1046.5, time: 0.4, dur: 0.7, gain: 0.35 }
    ];

    for (const note of chords) {
      const noteTime = t + note.time;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, noteTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2600, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(note.gain, noteTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + note.dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.#masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + note.dur + 0.02);
    }
  }

  playGameOver() {
    if (!this.#canPlay()) return;
    const ctx = this.#ctx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.6);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.6);
    filter.Q.setValueAtTime(2.5, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.#masterGain);

    osc.start(t);
    osc.stop(t + 0.68);
  }

  playPause() {
    if (!this.#canPlay()) return;
    this.#playBeep(520, 390, 0.06);
  }

  playResume() {
    if (!this.#canPlay()) return;
    this.#playBeep(390, 520, 0.06);
  }

  #playBeep(startFreq, endFreq, dur) {
    const ctx = this.#ctx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(this.#masterGain);

    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  #canPlay() {
    return Boolean(
      this.#isSupported &&
        this.#ctx &&
        this.#masterGain &&
        !this.#isMuted &&
        this.#ctx.state === 'running'
    );
  }

  #initAudioContext() {
    if (typeof window === 'undefined') return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      this.#ctx = new AudioContextClass();
      this.#masterGain = this.#ctx.createGain();
      this.#masterGain.gain.setValueAtTime(
        this.#isMuted ? 0 : this.#volume,
        this.#ctx.currentTime
      );
      this.#masterGain.connect(this.#ctx.destination);
      this.#isSupported = true;
    } catch (err) {
      // AudioContext init error handling
    }
  }

  #setupAutoUnlock() {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.unlock();
    };

    const opts = { once: true, capture: true };
    window.addEventListener('pointerdown', unlockHandler, opts);
    window.addEventListener('keydown', unlockHandler, opts);
    window.addEventListener('touchstart', unlockHandler, opts);
  }

  #loadMutePreference() {
    if (typeof localStorage === 'undefined') return;
    try {
      const val = localStorage.getItem(this.#storageKey);
      if (val !== null) {
        this.#isMuted = val === 'true';
      }
    } catch {
      // Ignore private browsing exceptions
    }
  }

  #persistMutePreference() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.#storageKey, String(this.#isMuted));
    } catch {
      // Ignore private browsing exceptions
    }
  }
}
