const BATCH_MODES = ["sync", "microtask", "raf"];

export class State {
  constructor(initialState = {}, { batch = "sync" } = {}) {
    if (!BATCH_MODES.includes(batch)) {
      throw new TypeError(`State: batch must be one of ${BATCH_MODES.join(", ")}`);
    }
    this.state = initialState;
    this.listeners = [];
    this.version = 0;
    this.batch = batch;
    this.pending = false;
  }

  getState() {
    return this.state;
  }

  setState(update) {
    const changes = typeof update === "function" ? update(this.state) : update;
    if (changes == null || typeof changes !== "object" || Array.isArray(changes)) return;
    const keys = Object.keys(changes);
    if (keys.length === 0 || keys.every(key => Object.is(this.state[key], changes[key]))) return;

    this.state = { ...this.state, ...changes };
    this.version++;
    this.schedule();
  }

  schedule() {
    if (this.batch === "sync") {
      this.notify();
      return;
    }
    if (this.pending) return;
    this.pending = true;
    const run = () => {
      this.pending = false;
      this.notify();
    };
    if (this.batch === "raf") requestAnimationFrame(run);
    else queueMicrotask(run);
  }

  notify() {
    const state = this.state;
    const version = this.version;
    for (const listener of [...this.listeners]) {
      try {
        listener(state, version);
      } catch (error) {
        console.error("State listener failed:", error);
      }
    }
  }

  subscribe(listener) {
    if (typeof listener !== "function") {
      throw new TypeError("State.subscribe(): listener must be a function");
    }
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(item => item !== listener);
    };
  }
}
