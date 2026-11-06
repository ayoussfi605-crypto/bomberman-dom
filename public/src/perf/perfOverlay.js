import { h } from '../framework/index.js';
import { fpsMeter } from './fpsMeter.js';

const enabled = new URLSearchParams(globalThis.location?.search ?? '').has('debug');
const REFRESH_MS = 250;
let cachedVNode = null;
let lastRefresh = -Infinity;

export function perfOverlay(now = performance.now()) {
  if (!enabled) return null;
  if (cachedVNode && now - lastRefresh < REFRESH_MS) return cachedVNode;

  const stats = fpsMeter.getStats();
  lastRefresh = now;
  cachedVNode = h('aside', { class: 'perf-overlay', 'aria-label': 'Performance stats' },
    h('strong', {}, `${stats.fps} FPS`),
    h('span', {}, `Frame avg ${stats.frameMsAvg.toFixed(1)} ms`),
    h('span', {}, `max ${stats.frameMsMax.toFixed(1)} ms`),
    h('span', {}, `>20 ms ${stats.over20ms} · >33 ms ${stats.over33ms}`)
  );
  return cachedVNode;
}

export function resetPerfOverlayCache() {
  cachedVNode = null;
  lastRefresh = -Infinity;
}
