// server/lobby/loop.js
// Drift-corrected fixed-step loop. A bare setInterval(step, 33) drifts; an
// accumulator over process.hrtime.bigint() keeps the simulation rate exact.

import { TICK_MS } from "../../shared/constants.js";

const SCHEDULE_MS = 5; // how often we look at the clock
const MAX_CATCH_UP = 5; // never replay more than 5 ticks after a stall

export function createLoop(
  stepFn,
  tickMs = TICK_MS,
  {
    now = () => process.hrtime.bigint(),
    schedule = setTimeout,
    cancel = clearTimeout,
    maxCatchUp = MAX_CATCH_UP,
  } = {},
) {
  const tickNs = BigInt(Math.round(tickMs * 1_000_000));

  let running = false;
  let handle = null;
  let last = 0n;
  let carry = 0n;

  function pump() {
    if (!running) return;

    const current = now();
    const elapsed = current > last ? current - last : 0n;
    last = current;
    carry += elapsed;

    let steps = 0;
    while (carry >= tickNs && steps < maxCatchUp) {
      carry -= tickNs;
      steps += 1;
    }
    // A long stall (laptop sleep, debugger) must not replay minutes of ticks.
    if (carry >= tickNs) carry %= tickNs;

    for (let i = 0; i < steps; i += 1) stepFn(tickMs);

    handle = schedule(pump, SCHEDULE_MS);
    if (handle && typeof handle.unref === "function") handle.unref();
  }

  function start() {
    if (running) return;
    running = true;
    last = now();
    carry = 0n;
    pump();
  }

  function stop() {
    running = false;
    if (handle !== null) {
      cancel(handle);
      handle = null;
    }
  }

  return {
    start,
    stop,
    get running() {
      return running;
    },
  };
}
