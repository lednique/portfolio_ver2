/**
 * Warm-up for the Godot game (game/index.html ≈ 37 MB wasm + 16 MB pck).
 *
 * The landing page does not need it, but /ar renders the game immediately.
 * Strategy:
 *   1. On /ar the iframe starts the download itself — nothing to do here.
 *   2. On any other page we quietly stream the engine files in the background
 *      after `load` + idle time, so the browser HTTP cache already holds them
 *      when the visitor opens /ar later.
 *
 * The stream is read chunk by chunk and thrown away: nothing is kept in memory
 * or duplicated into Cache Storage, and a failed warm-up is silently ignored.
 * Skipped on slow connections / data-saver / reduced-motion / low battery.
 */

export const GAME_URL = './game/index.html';

const GAME_FILES = ['./game/index.wasm', './game/index.pck'];
const IDLE_TIMEOUT_MS = 1200;
const START_DELAY_MS = 2500;

let warmupStarted = false;

function begin() {
  if (warmupStarted) return false;
  warmupStarted = true;
  return true;
}

function isSlowConnection() {
  const conn =
    typeof navigator !== 'undefined' &&
    (navigator.connection || navigator.mozConnection || navigator.webkitConnection);
  if (!conn) return false;
  if (conn.saveData) return true;
  const type = String(conn.effectiveType || '');
  return type === 'slow-2g' || type === '2g';
}

function userPrefersLight() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.a11y === 'true'
    );
  } catch {
    return false;
  }
}

async function lowBattery() {
  try {
    if (typeof navigator === 'undefined' || !navigator.getBattery) return false;
    const battery = await navigator.getBattery();
    return battery.level < 0.2 && !battery.charging;
  } catch {
    return false;
  }
}

function runWhenIdle(fn) {
  if (typeof window === 'undefined') return;
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(fn, { timeout: IDLE_TIMEOUT_MS });
  } else {
    window.setTimeout(fn, 200);
  }
}

/**
 * Stream a file through the network so the browser writes it into its HTTP cache,
 * without keeping the bytes in memory.
 */
async function preloadFile(url) {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  const response = await window.fetch(url, { cache: 'default', credentials: 'same-origin' });
  if (!response || !response.ok || !response.body || !response.body.getReader) return;
  const reader = response.body.getReader();
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }
  } finally {
    reader.releaseLock?.();
  }
}

export function warmUpGame() {
  if (typeof window === 'undefined') return;
  if (!begin()) return;
  if (isSlowConnection() || userPrefersLight()) return;

  let started = false;
  const start = async () => {
    if (started || document.hidden) return;
    started = true;
    if (await lowBattery()) return;
    for (const file of GAME_FILES) {
      try {
        await preloadFile(file);
      } catch {
        // Warm-up is a nicety: never surface an error to the visitor.
        return;
      }
    }
  };

  const schedule = (delay = START_DELAY_MS) => {
    window.setTimeout(() => runWhenIdle(start), delay);
  };

  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule, { once: true });
    // Safety net: `load` may already have fired before this module ran.
    schedule(8000);
  }
}

export function warmUpGameOnIntent() {
  // Triggered when the visitor shows interest in /ar (menu click): pull the files
  // in parallel with the page transition instead of waiting for the iframe.
  if (typeof window === 'undefined') return;
  if (!begin()) return;
  if (isSlowConnection() || userPrefersLight()) return;
  GAME_FILES.forEach((file) => {
    preloadFile(file).catch(() => {});
  });
}
