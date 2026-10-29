// Player stats. Your own are counted from the game events this browser sees and
// saved on this device. The global counters (players, visits, rounds) live on
// Abacus (https://jasoncameron.dev/abacus/), a free counting service: the game
// has no server of its own.
import { useEffect, useState } from 'preact/hooks';
import type { FormationKind, GameEvent, GameView, RoomView } from '@tximtxom/shared';
import { store } from './store';

/** What this device has played. */
export interface MyStats {
  /** Rounds dealt to you (counted as they start). */
  roundsPlayed: number;
  /** Scored rounds where you had the fewest points (ties count), and the rest. */
  roundsWon: number;
  roundsLost: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  /** Games won in a row: now, and the longest run. */
  winStreak: number;
  bestStreak: number;
  /** Rounds you ended yourself (Txi jog). */
  roundsEnded: number;
  tximtxoms: number;
  /** Formations you showed, in all and by kind. */
  formations: number;
  kinds: Record<FormationKind, number>;
  /** Most cards in one straight you showed. */
  longestStraight: number;
  rides: number;
  cardsDrawn: number;
  /** Cards picked up from the discard pile. */
  cardsTaken: number;
  /** Most rounds in one game you played to the end. */
  longestGame: number;
  /** Fewest and most points in one round, or null before the first round. */
  bestRound: number | null;
  worstRound: number | null;
  /** Points scored over every round. */
  totalPoints: number;
  /** Highest total you went bust with, or null if you never did. */
  recordBust: number | null;
  /** Lowest your points total has ever been in a game, or null before the first round. */
  lowestTotal: number | null;
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
  /** Players with the Infected achievement. */
  infected: number | null;
  /** The counting service could not be reached. */
  offline: boolean;
}

const KEY = 'tximtxom.stats';
const COUNTED_KEY = 'tximtxom.counted'; // this device was counted as a player

const EMPTY: MyStats = {
  roundsPlayed: 0,
  roundsWon: 0,
  roundsLost: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  winStreak: 0,
  bestStreak: 0,
  roundsEnded: 0,
  tximtxoms: 0,
  formations: 0,
  kinds: { pair: 0, trio: 0, quad: 0, straight: 0 },
  longestStraight: 0,
  rides: 0,
  cardsDrawn: 0,
  cardsTaken: 0,
  longestGame: 0,
  bestRound: null,
  worstRound: null,
  totalPoints: 0,
  recordBust: null,
  lowestTotal: null,
  timePlayed: 0,
  visits: 0,
  since: Date.now(),
};

function load(): MyStats {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return { ...EMPTY, ...saved, kinds: { ...EMPTY.kinds, ...saved.kinds } };
  } catch {
    return { ...EMPTY };
  }
}

let mine = load();
let global: GlobalStats = { players: null, visits: null, rounds: null, infected: null, offline: false };
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

type Counter = 'players' | 'visits' | 'rounds' | 'infected';

/** Reads or adds one to a global counter; resolves to its value, or null when offline. */
async function abacus(op: 'hit' | 'get', key: Counter): Promise<number | null> {
  if (op === 'hit' && !COUNTING) op = 'get';
  let value: unknown = null;
  try {
    const res = await fetch(`${ABACUS}/${op}/${NAMESPACE}/tximtxom-${key}`);
    // A counter nobody has hit yet doesn't exist: that's a zero.
    value = res.status === 404 ? 0 : res.ok ? (await res.json()).value : null;
  } catch {
    // Offline or blocked: the counter stays hidden.
  }
  global = typeof value === 'number' ? { ...global, [key]: value, offline: false } : { ...global, offline: true };
  notify();
  return typeof value === 'number' ? value : null;
}

/** Fetches how many players are Infected (shown with the achievements). */
export function refreshInfected(): void {
  void abacus('get', 'infected');
}

/** Counts this device as Infected. */
export function countInfected(): void {
  void abacus('hit', 'infected');
}

/**
 * Patient zero: the first player to start a game, before anyone else has the
 * Infected achievement, gets it. True when that's you. The counter only ever
 * goes up, so of two players starting at once only the one who reaches 1 wins.
 */
export async function claimPatientZero(): Promise<boolean> {
  if (!COUNTING || (await abacus('get', 'infected')) !== 0) return false;
  return (await abacus('hit', 'infected')) === 1;
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
  // A round counts as it starts. The host counts each one once for everyone.
  if (e.t === 'deal' && room.hostId === room.youId) void abacus('hit', 'rounds');
  if (me === null) return;
  switch (e.t) {
    case 'deal':
      bump((s) => ({ roundsPlayed: s.roundsPlayed + 1 }));
      break;
    case 'score': {
      const r = g.results.at(-1);
      if (!r) return;
      const pts = r.points[me];
      const won = pts === Math.min(...r.points);
      const total = r.totals[me];
      bump((s) => ({
        roundsWon: s.roundsWon + (won ? 1 : 0),
        roundsLost: s.roundsLost + (won ? 0 : 1),
        bestRound: s.bestRound === null ? pts : Math.min(s.bestRound, pts),
        worstRound: s.worstRound === null ? pts : Math.max(s.worstRound, pts),
        totalPoints: s.totalPoints + pts,
        recordBust: total > g.rules.threshold ? Math.max(s.recordBust ?? total, total) : s.recordBust,
        lowestTotal: s.lowestTotal === null ? total : Math.min(s.lowestTotal, total),
      }));
      break;
    }
    case 'draw':
      if (e.seat === me) bump((s) => ({ cardsDrawn: s.cardsDrawn + 1 }));
      break;
    case 'take':
      if (e.seat === me) bump((s) => ({ cardsTaken: s.cardsTaken + 1 }));
      break;
    case 'end':
      if (e.seat === me && e.kind === 'manual') bump((s) => ({ roundsEnded: s.roundsEnded + 1 }));
      break;
    case 'tximtxom':
      if (e.seat === me) bump((s) => ({ tximtxoms: s.tximtxoms + 1 }));
      break;
    case 'lay':
      if (e.seat === me)
        bump((s) => ({
          formations: s.formations + 1,
          kinds: { ...s.kinds, [e.kind]: s.kinds[e.kind] + 1 },
          longestStraight: e.kind === 'straight' ? Math.max(s.longestStraight, e.cards.length) : s.longestStraight,
        }));
      break;
    case 'ride':
      if (e.seat === me) bump((s) => ({ rides: s.rides + 1 }));
      break;
    case 'gameOver': {
      const won = e.winners.includes(me);
      bump((s) => {
        const winStreak = won ? s.winStreak + 1 : 0;
        return {
          gamesPlayed: s.gamesPlayed + 1,
          gamesWon: s.gamesWon + (won ? 1 : 0),
          gamesLost: s.gamesLost + (won ? 0 : 1),
          winStreak,
          bestStreak: Math.max(s.bestStreak, winStreak),
          longestGame: Math.max(s.longestGame, g.round),
        };
      });
      break;
    }
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
  // Every load is a visit (a hit on the site); players are the unique devices above.
  void abacus('hit', 'visits');

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
