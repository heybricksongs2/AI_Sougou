/**
 * src/core/StateMachine.js
 * Lifecycle State Machine with strict transition rules.
 */
import { GAME_STATES } from './constants.js';

export { GAME_STATES };

export class StateMachine {
  #state;
  #onTransition;

  static #ALLOWED_TRANSITIONS = {
    [GAME_STATES.INIT]: [GAME_STATES.RUNNING],
    [GAME_STATES.RUNNING]: [GAME_STATES.PAUSED, GAME_STATES.GAME_OVER, GAME_STATES.VICTORY, GAME_STATES.INIT],
    [GAME_STATES.PAUSED]: [GAME_STATES.RUNNING, GAME_STATES.INIT],
    [GAME_STATES.GAME_OVER]: [GAME_STATES.RUNNING, GAME_STATES.INIT],
    [GAME_STATES.VICTORY]: [GAME_STATES.RUNNING, GAME_STATES.INIT]
  };

  /**
   * @param {string} [initialState=GAME_STATES.INIT]
   * @param {(to: string, from: string, data?: object) => void} [onTransition]
   */
  constructor(initialState = GAME_STATES.INIT, onTransition = null) {
    this.#state = initialState;
    this.#onTransition = onTransition;
  }

  get state() {
    return this.#state;
  }

  /**
   * Check if current state matches target.
   * @param {string} state
   * @returns {boolean}
   */
  is(state) {
    return this.#state === state;
  }

  /**
   * Check whether a transition to targetState is permitted.
   * @param {string} targetState
   * @returns {boolean}
   */
  canTransitionTo(targetState) {
    if (this.#state === targetState) return false;
    const allowed = StateMachine.#ALLOWED_TRANSITIONS[this.#state];
    return Array.isArray(allowed) && allowed.includes(targetState);
  }

  /**
   * Transition to target state if permitted.
   * @param {string} targetState
   * @param {object} [data={}]
   * @returns {boolean} True if transitioned, false if rejected.
   */
  transition(targetState, data = {}) {
    if (!this.canTransitionTo(targetState)) {
      return false;
    }
    const fromState = this.#state;
    this.#state = targetState;
    if (typeof this.#onTransition === 'function') {
      this.#onTransition(targetState, fromState, data);
    }
    return true;
  }

  /**
   * Force reset state to INIT (always allowed).
   * @param {object} [data={}]
   */
  reset(data = {}) {
    const fromState = this.#state;
    this.#state = GAME_STATES.INIT;
    if (typeof this.#onTransition === 'function' && fromState !== GAME_STATES.INIT) {
      this.#onTransition(GAME_STATES.INIT, fromState, data);
    }
  }
}
