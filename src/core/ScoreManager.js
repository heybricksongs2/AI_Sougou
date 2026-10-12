/**
 * src/core/ScoreManager.js
 * Distance-based and bonus scoring with high score tracking.
 * Zero DOM dependencies.
 */
export class ScoreManager {
  #distance = 0;       // Total pixels traveled (float)
  #bonusScore = 0;     // Sum of items and victory bonuses
  #highScore = 0;      // All-time best score
  #itemsCollected = 0; // Number of items picked up
  #distanceMultiplier;

  /**
   * @param {Object} [config={}]
   * @param {number} [config.initialHighScore=0]
   * @param {number} [config.distanceMultiplier=0.1]
   */
  constructor(config = {}) {
    this.#highScore = Number(config.initialHighScore) || 0;
    this.#distanceMultiplier = Number(config.distanceMultiplier) || 0.1;
  }

  get score() {
    return Math.floor(this.#distance * this.#distanceMultiplier) + this.#bonusScore;
  }

  get highScore() {
    return this.#highScore;
  }

  get distance() {
    return Math.floor(this.#distance);
  }

  get itemsCollected() {
    return this.#itemsCollected;
  }

  /**
   * Advance distance and update score.
   * @param {number} speed - Current scroll speed in px/s.
   * @param {number} dt - Delta time in seconds.
   */
  update(speed, dt) {
    if (typeof speed !== 'number' || typeof dt !== 'number' || speed <= 0 || dt <= 0 || !Number.isFinite(speed) || !Number.isFinite(dt)) {
      return;
    }
    this.#distance += speed * dt;
    const current = this.score;
    if (current > this.#highScore) {
      this.#highScore = current;
    }
  }

  /**
   * Add bonus points for collectible item.
   * @param {number} [points=250]
   * @returns {number} Added points
   */
  addItemScore(points = 250) {
    const pts = Math.max(0, points);
    this.#bonusScore += pts;
    this.#itemsCollected += 1;
    const current = this.score;
    if (current > this.#highScore) {
      this.#highScore = current;
    }
    return pts;
  }

  /**
   * Award victory clear bonus.
   * @param {number} [bonus=5000]
   * @returns {number} Updated total score.
   */
  addVictoryBonus(bonus = 5000) {
    this.#bonusScore += Math.max(0, bonus);
    const current = this.score;
    if (current > this.#highScore) {
      this.#highScore = current;
    }
    return current;
  }

  /**
   * Reset current run progress while preserving high score.
   */
  reset() {
    this.#distance = 0;
    this.#bonusScore = 0;
    this.#itemsCollected = 0;
  }

  /**
   * Manually seed high score (e.g. from localStorage).
   * @param {number} value
   */
  setHighScore(value) {
    this.#highScore = Math.max(this.#highScore, Number(value) || 0);
  }

  /**
   * Get scoring snapshot.
   * @returns {{ score: number, highScore: number, distance: number, itemsCollected: number }}
   */
  getSnapshot() {
    return {
      score: this.score,
      highScore: this.#highScore,
      distance: this.distance,
      itemsCollected: this.#itemsCollected
    };
  }
}
