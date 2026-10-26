export class State {
    constructor(initialState = {}, { batch = 'microtask' } = {}) {
        this.state = initialState;
        this.version = 0;
        this.listeners = new Set();
        this.batch = batch;
        this.scheduled = false;
    }

    getState() {
        return this.state;
    }

    setState(update) {
        const patch = typeof update === 'function' ? update(this.state) : update;
        if (patch == null) return;
        if (typeof patch !== 'object' || Array.isArray(patch)) {
            throw new TypeError('setState expects an object patch (or a function returning one).');
        }
        const changed = Object.keys(patch).some(k => !Object.is(this.state[k], patch[k]));
        if (!changed) return;
        this.state = { ...this.state, ...patch };
        this.version++;
        this.schedule();
    }

    subscribe(listener) {
        if (typeof listener !== 'function') throw new TypeError('Listener must be a function.');
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    schedule() {
        if (this.batch === 'sync') return this.notify();
        if (this.scheduled) return;
        this.scheduled = true;
        const run = () => { this.scheduled = false; this.notify(); };
        if (this.batch === 'raf') requestAnimationFrame(run);
        else queueMicrotask(run);
    }

    notify() {
        for (const listener of [...this.listeners]) {
            if (!this.listeners.has(listener)) continue;
            try { listener(this.state, this.version); }
            catch (err) { console.error('[State] listener error:', err); }
        }
    }
}