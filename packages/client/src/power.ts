import { getSettings, onSettings } from './settings';
import { store } from './store';

// Saving the device's battery: a frame rate cap, and sleep for a game left in the background.

const touch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
const focused = () => document.hasFocus() && !document.hidden;

/** Frames per second for the table and the background. "Auto" is 30 on touch
 *  screens and 60 elsewhere; out of focus, at most 10. */
export function frameRate(): number {
  const f = getSettings().fps;
  const want = f === 'auto' ? (touch ? 30 : 60) : f;
  return focused() ? want : Math.min(10, want);
}

const listeners = new Set<() => void>();
/** Calls `fn` now and whenever the frame rate may have changed. */
export function onFrameRate(fn: () => void): void {
  listeners.add(fn);
  fn();
}

// Out of focus (or hidden) for 3 minutes, 5 in a room: the page swaps itself for
// sleep.html, which frees the music, connections and graphics. Coming back to it
// loads the game again, and a room is rejoined (its seat is kept for 10 minutes).
const SLEEP_MS = 3 * 60_000;
const SLEEP_ROOM_MS = 5 * 60_000;
const WAKE_KEY = 'tximtxom.wake';
let away = 0;
let asleep = false;

/** True while the page is going to sleep: no "leave the game?" question then. */
export const goingToSleep = () => asleep;

function changed(): void {
  if (focused()) away = 0;
  else if (!away) away = Date.now();
  listeners.forEach((fn) => fn());
}
addEventListener('focus', changed);
addEventListener('blur', changed);
document.addEventListener('visibilitychange', changed);
onSettings(changed);
changed();

setInterval(() => {
  if (asleep || !away || Date.now() - away < (store.get().room ? SLEEP_ROOM_MS : SLEEP_MS)) return;
  asleep = true;
  try {
    if (store.get().room) sessionStorage.setItem(WAKE_KEY, '1');
  } catch {
    // Without storage the room is still offered on the menu.
  }
  const url = new URL(`${import.meta.env.BASE_URL}sleep.html`, location.href);
  url.searchParams.set('to', location.pathname + location.search + location.hash);
  location.replace(url);
}, 10_000);

/** After waking from sleep in a room: true once, so the game rejoins it. */
export function wokeInRoom(): boolean {
  try {
    const woke = sessionStorage.getItem(WAKE_KEY) === '1';
    sessionStorage.removeItem(WAKE_KEY);
    return woke;
  } catch {
    return false;
  }
}
