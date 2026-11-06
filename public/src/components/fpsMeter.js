/* ==========================================
   PERFORMANCE TOOLING: FPS METER 
   ========================================== */

/**
 * Initializes the FPS & Performance Overlay using requestAnimationFrame
 * @param {string} containerId - DOM element ID where FPS is rendered
 */
export function initFPSMeter(containerId = 'fps-meter') {
  const container = document.getElementById(containerId);
  if (!container) return;
  const debugEnabled = new URLSearchParams(location.search).has('debug');
  container.hidden = !debugEnabled;
  if (!debugEnabled) return;

  let frameCount = 0;
  let lastTime = performance.now();
  let fps = 60;
  let frameTime = 0;

  function tick(now) {
    frameCount++;
    const delta = now - lastTime;

    // Update FPS readout every 1 second (1000ms)
    if (delta >= 1000) {
      fps = Math.round((frameCount * 1000) / delta);
      frameTime = (delta / frameCount).toFixed(1);

      // Render readout text
      container.textContent = `FPS: ${fps} | ${frameTime}ms`;

      // Dynamic color coding based on performance threshold
      if (fps >= 55) {
        container.style.color = '#00ff66'; // Green = Good (60 FPS target)
      } else if (fps >= 40) {
        container.style.color = '#ffa502'; // Orange = Minor drops
      } else {
        container.style.color = '#ff4757'; // Red = Critical frame drops
      }

      frameCount = 0;
      lastTime = now;
    }

    // Schedule next frame measurement
    requestAnimationFrame(tick);
  }

  // Start the measurement loop
  requestAnimationFrame(tick);
}