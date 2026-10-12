/**
 * src/core/EventBus.js
 * Pure ES Module Event Emitter with zero external dependencies.
 */
export class EventBus {
  #listeners = new Map(); // Map<string, Set<Function>>

  /**
   * Register an event listener.
   * @param {string} event - Name of the event.
   * @param {Function} callback - Handler function to invoke.
   * @returns {() => void} Unsubscribe function.
   */
  on(event, callback) {
    if (typeof event !== 'string' || typeof callback !== 'function') {
      return () => {};
    }
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  /**
   * Unregister an event listener.
   * @param {string} event - Name of the event.
   * @param {Function} callback - Handler function to remove.
   * @returns {boolean} True if removed, false if not found.
   */
  off(event, callback) {
    if (!this.#listeners.has(event)) return false;
    const set = this.#listeners.get(event);
    const removed = set.delete(callback);
    if (set.size === 0) {
      this.#listeners.delete(event);
    }
    return removed;
  }

  /**
   * Register a one-time event listener.
   * @param {string} event - Name of the event.
   * @param {Function} callback - Handler function to invoke once.
   * @returns {() => void} Unsubscribe function.
   */
  once(event, callback) {
    if (typeof event !== 'string' || typeof callback !== 'function') {
      return () => {};
    }
    const wrapper = (...args) => {
      this.off(event, wrapper);
      callback(...args);
    };
    return this.on(event, wrapper);
  }

  /**
   * Synchronously invoke all registered listeners for an event.
   * Defensively copies handlers to allow safe listener removal during dispatch.
   * @param {string} event - Name of the event.
   * @param {...any} args - Arguments passed to listeners.
   */
  emit(event, ...args) {
    if (!this.#listeners.has(event)) return;
    const handlers = [...this.#listeners.get(event)];
    for (const handler of handlers) {
      try {
        handler(...args);
      } catch (err) {
        // Log error without crashing engine loop
        console.error(`[EventBus] Error in listener for event "${event}":`, err);
      }
    }
  }

  /**
   * Clear listeners for a specific event or all events.
   * @param {string} [event] - Optional event to clear. If omitted, clears all.
   */
  clear(event) {
    if (event !== undefined) {
      this.#listeners.delete(event);
    } else {
      this.#listeners.clear();
    }
  }

  /**
   * Get the number of active listeners for an event.
   * @param {string} event - Event name.
   * @returns {number}
   */
  listenerCount(event) {
    return this.#listeners.get(event)?.size || 0;
  }
}
