// Player stats. Your own are counted from the game events this browser sees and
// saved on this device. The global counters (players, visits, rounds) live on
// Abacus (https://jasoncameron.dev/abacus/), a free counting service: the game
// has no server of its own.
import { useEffect, useState } from 'preact/hooks';
import type { GameEvent, GameView, RoomView } from '@tximtxom/shared';
import { store } from './store';

/** What this device has played. */
export interface MyStats {
  roundsPlayed: number;
  /** Rounds where you scored the fewest points (ties count). */
  roundsWon: number;
  gamesPlayed: number;
  gamesWon: number;
  /** Rounds you ended yourself (Txi jog). */
  roundsEnded: number;
  tximtxoms: number;
  formations: number;
  rides: number;
  /** Fewest points in one round, or null before the first round. */
  bestRound: number | null;
  /** Time spent at the table during a game, in ms. */
  timePlayed: number;
  /** Page loads of the game on this device. */
  visits: number;
  /** When this device first opened the game (ms timestamp). */
  since: number;
}

export interface GlobalStats {
  players: number | null;
  visits: number | null;
  rounds: number | null;
  /** The counting service could not be reached. */
  offline: boolean;
}

const KEY = 'tximtxom.stats';
const COUNTED_KEY = 'tximtxom.counted'; // this device was counted as a player
const VISIT_KEY = 'tximtxom.visited'; // this browser session was counted as a visit

const EMPTY: MyStats = {
  roundsPlayed: 0,
  roundsWon: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  roundsEnded: 0,
  tximtxoms: 0,
  formations: 0,
  rides: 0,
  bestRound: null,
  timePlayed: 0,
  visits: 0,
  since: Date.now(),
};

function load(): MyStats {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return { ...EMPTY };
  }
}

let mine = load();
let global: GlobalStats = { players: null, visits: null, rounds: null, offline: false };
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function save(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(mine));
  } catch {
    // Storage full or blocked: the stats live for this visit only.
  }
}

function bump(patch: (s: MyStats) => Partial<MyStats>): void {
  mine = { ...mine, ...patch(mine) };
  save();
  notify();
}

// ---------------------------------------------------------------- global counters

const ABACUS = 'https://abacus.jasoncameron.dev';
const NAMESPACE = 'badjuice.github.io';
// Dev builds and test browsers read the counters but never add to them.
const COUNTING = !import.meta.env.DEV && !navigator.webdriver;

async function abacus(op: 'hit' | 'get', key: 'players' | 'visits' | 'rounds'): Promise<void> {
  if (op === 'hit' && !COUNTING) op = 'get';
  try {
    const res = await fetch(`${ABACUS}/${op}/${NAMESPACE}/tximtxom-${key}`);
    // A counter nobody has hit yet doesn't exist: that's a zero.
    const value = res.status === 404 ? 0 : res.ok ? (await res.json()).value : null;
    global = typeof value === 'number' ? { ...global, [key]: value, offline: false } : { ...global, offline: true };
  } catch {
    // Offline or blocked: the counter stays hidden.
    global = { ...global, offline: true };
  }
  notify();
}

/** Fetches the global rounds count (only shown in the Stats tab). */
export function refreshGlobalRounds(): void {
  void abacus('get', 'rounds');
}

/** The page's locale, for numbers and dates. */
export const locale = () => document.documentElement.lang || 'en';

/** 1234 → "1,234" in English, "1 234" in Portuguese. */
export function formatCount(n: number): string {
  return n.toLocaleString(locale());
}

// ---------------------------------------------------------------- counting

/** Counts one game event for you. Called once per event, as it happens. */
export function recordEvent(e: GameEvent, g: GameView, room: RoomView): void {
  const me = g.you;
  // The host counts each round once for everyone.
  if (e.t === 'score' && room.hostId === room.youId) void abacus('hit', 'rounds');
  if (me === null) return;
  switch (e.t) {
    case 'score': {
      const r = g.results.at(-1);
      if (!r) return;
      const pts = r.points[me];
      bump((s) => ({
        roundsPlayed: s.roundsPlayed + 1,
        roundsWon: s.roundsWon + (pts === Math.min(...r.points) ? 1 : 0),
        bestRound: s.bestRound === null ? pts : Math.min(s.bestRound, pts),
      }));
      break;
    }
    case 'end':
      if (e.seat === me && e.kind === 'manual') bump((s) => ({ roundsEnded: s.roundsEnded + 1 }));
      break;
    case 'tximtxom':
      if (e.seat === me) bump((s) => ({ tximtxoms: s.tximtxoms + 1 }));
      break;
    case 'lay':
      if (e.seat === me) bump((s) => ({ formations: s.formations + 1 }));
      break;
    case 'ride':
      if (e.seat === me) bump((s) => ({ rides: s.rides + 1 }));
      break;
    case 'gameOver':
      bump((s) => ({ gamesPlayed: s.gamesPlayed + 1, gamesWon: s.gamesWon + (e.winners.includes(me) ? 1 : 0) }));
      break;
  }
}

const TICK_MS = 1000;
const SAVE_EVERY = 15; // ticks

/** Counts this visit, and starts the clock for time spent in games. */
export function initStats(): void {
  mine = { ...mine, visits: mine.visits + 1 };
  save();
  let counted = false;
  try {
    counted = !!localStorage.getItem(COUNTED_KEY);
    if (!counted && COUNTING) localStorage.setItem(COUNTED_KEY, '1');
  } catch {
    // Without storage every visit would count as a new player: don't count.
    counted = true;
  }
  void abacus(counted ? 'get' : 'hit', 'players');
  // Reloads within one browser session are the same visit.
  let visited = false;
  try {
    visited = !!sessionStorage.getItem(VISIT_KEY);
    if (!visited && COUNTING) sessionStorage.setItem(VISIT_KEY, '1');
  } catch {
    // No session storage: count every load.
  }
  void abacus(visited ? 'get' : 'hit', 'visits');

  // The clock runs while a game is on screen, not over, and the tab is visible.
  let ticks = 0;
  setInterval(() => {
    const g = store.get().room?.game;
    if (!g || g.you === null || g.phase === 'gameOver' || document.visibilityState !== 'visible') return;
    mine = { ...mine, timePlayed: mine.timePlayed + TICK_MS };
    if (++ticks % SAVE_EVERY === 0) save();
    notify();
  }, TICK_MS);
  addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') save();
  });
}

/** Preact hook: your stats and the global counters, live. */
export function useStats(): { mine: MyStats; global: GlobalStats } {
  const [s, set] = useState({ mine, global });
  useEffect(() => {
    const l = () => set({ mine, global });
    listeners.add(l);
    l();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return s;
}
