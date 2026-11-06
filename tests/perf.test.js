import test from 'node:test';
import assert from 'node:assert/strict';
import { createFpsMeter } from '../public/src/perf/fpsMeter.js';

test('FPS meter reports rolling frame timing and long-frame counts', () => {
  const meter = createFpsMeter();
  meter.frame(0);
  for (let frame = 1; frame <= 60; frame++) {
    meter.frame(frame * 16);
  }
  meter.frame(60 * 16 + 40);

  const stats = meter.getStats();
  assert.equal(stats.fps, 61);
  assert.ok(stats.frameMsAvg > 16);
  assert.equal(stats.frameMsMax, 40);
  assert.equal(stats.over20ms, 1);
  assert.equal(stats.over33ms, 1);

  meter.reset();
  assert.deepEqual(meter.getStats(), {
    fps: 0,
    frameMsAvg: 0,
    frameMsMax: 0,
    over20ms: 0,
    over33ms: 0
  });
});

test('performance overlay is debug-gated and caches updates for 250 ms', async () => {
  const originalLocation = globalThis.location;
  try {
    globalThis.location = { search: '?debug=1' };
    const { perfOverlay } = await import('../public/src/perf/perfOverlay.js?enabled-test');
    const first = perfOverlay(0);
    assert.ok(first);
    assert.equal(perfOverlay(249), first);
    assert.notEqual(perfOverlay(250), first);

    globalThis.location = { search: '?notdebug=1' };
    const { perfOverlay: disabledOverlay } = await import('../public/src/perf/perfOverlay.js?disabled-test');
    assert.equal(disabledOverlay(1000), null);
  } finally {
    if (originalLocation === undefined) delete globalThis.location;
    else globalThis.location = originalLocation;
  }
});
