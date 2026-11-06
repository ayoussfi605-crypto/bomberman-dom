const SAMPLE_CAPACITY = 120;
const WINDOW_MS = 1000;

function createFpsMeter() {
  const timestamps = new Float64Array(SAMPLE_CAPACITY);
  const deltas = new Float64Array(SAMPLE_CAPACITY);
  let nextIndex = 0;
  let sampleCount = 0;
  let previousFrame = null;
  let latestTime = 0;

  function frame(now) {
    if (!Number.isFinite(now)) return;
    latestTime = now;
    if (previousFrame !== null) {
      const delta = now - previousFrame;
      if (delta >= 0) {
        timestamps[nextIndex] = now;
        deltas[nextIndex] = delta;
        nextIndex = (nextIndex + 1) % SAMPLE_CAPACITY;
        sampleCount = Math.min(sampleCount + 1, SAMPLE_CAPACITY);
      }
    }
    previousFrame = now;
  }

  function getStats() {
    const cutoff = latestTime - WINDOW_MS;
    let frames = 0;
    let total = 0;
    let max = 0;
    let over20ms = 0;
    let over33ms = 0;

    for (let offset = 0; offset < sampleCount; offset++) {
      const index = (nextIndex - 1 - offset + SAMPLE_CAPACITY) % SAMPLE_CAPACITY;
      if (timestamps[index] < cutoff) break;
      const delta = deltas[index];
      frames++;
      total += delta;
      if (delta > max) max = delta;
      if (delta > 20) over20ms++;
      if (delta > 33) over33ms++;
    }

    return {
      fps: total ? Math.round((frames * 1000) / total) : 0,
      frameMsAvg: frames ? total / frames : 0,
      frameMsMax: max,
      over20ms,
      over33ms
    };
  }

  function reset() {
    timestamps.fill(0);
    deltas.fill(0);
    nextIndex = 0;
    sampleCount = 0;
    previousFrame = null;
    latestTime = 0;
  }

  return { frame, getStats, reset };
}

export const fpsMeter = createFpsMeter();
export { createFpsMeter };
