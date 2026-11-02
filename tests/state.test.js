import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { State } from "../public/src/framework/state/index.js";

test("default notification stays synchronous and preserves unrelated state", () => {
  const store = new State({ count: 0, label: "keep" });
  const seen = [];
  store.subscribe((state, version) => seen.push([state, version]));
  store.setState({ count: 1 });
  assert.deepEqual(seen, [[{ count: 1, label: "keep" }, 1]]);
});

test("microtask batching merges immediately and notifies once with latest version", async () => {
  const store = new State({ count: 0 }, { batch: "microtask" });
  const seen = [];
  store.subscribe((state, version) => seen.push([state.count, version]));
  store.setState({ count: 1 });
  store.setState(state => ({ count: state.count + 1 }));
  store.setState(state => ({ count: state.count + 1 }));
  assert.equal(store.getState().count, 3);
  assert.deepEqual(seen, []);
  await Promise.resolve();
  assert.deepEqual(seen, [[3, 3]]);
  store.setState({ count: 4 });
  await Promise.resolve();
  assert.deepEqual(seen, [[3, 3], [4, 4]]);
});

test("invalid/no-op patches preserve state, version and notification count", () => {
  const store = new State({ count: NaN, data: [] });
  const before = store.getState();
  const listener = mock.fn();
  store.subscribe(listener);
  for (const patch of [null, undefined, false, 1, "text", [], {}, { count: NaN }, { data: before.data }]) store.setState(patch);
  assert.equal(store.getState(), before);
  assert.equal(store.version, 0);
  assert.equal(listener.mock.callCount(), 0);
});

test("listener errors do not prevent other subscribers from running", t => {
  const log = t.mock.method(console, "error", () => {});
  const store = new State({ count: 0 });
  const listener = mock.fn();
  store.subscribe(() => { throw new Error("test listener"); });
  store.subscribe(listener);
  store.setState({ count: 1 });
  assert.equal(log.mock.callCount(), 1);
  assert.equal(listener.mock.callCount(), 1);
});

test("unsubscribe before scheduled notification removes the subscriber", async () => {
  const store = new State({ count: 0 }, { batch: "microtask" });
  const listener = mock.fn();
  const off = store.subscribe(listener);
  store.setState({ count: 1 });
  off(); off();
  await Promise.resolve();
  assert.equal(listener.mock.callCount(), 0);
});

test("self-unsubscribe does not skip the next listener", () => {
  const store = new State({ count: 0 });
  const seen = [];
  const off = store.subscribe(() => { seen.push("first"); off(); });
  store.subscribe(() => seen.push("second"));
  store.setState({ count: 1 });
  store.setState({ count: 2 });
  assert.deepEqual(seen, ["first", "second", "second"]);
});

test("updates from microtask listeners schedule another notification", async () => {
  const store = new State({ count: 0 }, { batch: "microtask" });
  const seen = [];
  store.subscribe(state => {
    seen.push(state.count);
    if (state.count === 1) store.setState({ count: 2 });
  });
  store.setState({ count: 1 });
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(seen, [1, 2]);
});

test("raf batches and schedules again after notification", t => {
  const callbacks = [];
  const previous = Object.getOwnPropertyDescriptor(globalThis, "requestAnimationFrame");
  Object.defineProperty(globalThis, "requestAnimationFrame", {
    configurable: true, writable: true, value: callback => callbacks.push(callback),
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "requestAnimationFrame", previous);
    else delete globalThis.requestAnimationFrame;
  });
  const store = new State({ count: 0 }, { batch: "raf" });
  const listener = mock.fn();
  store.subscribe(listener);
  store.setState({ count: 1 }); store.setState({ count: 2 });
  assert.equal(callbacks.length, 1);
  assert.equal(listener.mock.callCount(), 0);
  callbacks.shift()();
  assert.equal(listener.mock.callCount(), 1);
  assert.equal(listener.mock.calls[0].arguments[0].count, 2);
  store.setState({ count: 3 });
  assert.equal(callbacks.length, 1);
});

test("invalid batch modes and subscriber types fail clearly", () => {
  assert.throws(() => new State({}, { batch: "later" }), TypeError);
  assert.throws(() => new State().subscribe(null), TypeError);
});
