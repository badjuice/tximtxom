// Chips: the game's currency, earned by playing and saved on this device.
// The save is scrambled and signed with a key in the game's code. That can't stop
// someone who reads the code, but an edit made in the browser's tools breaks the
// signature, and the game goes back to the last save that was still valid.
import { useEffect, useState } from 'preact/hooks';
import { bustLimit, type GameEvent, type GameView, rankOf, type Rules } from '@tximtxom/shared';
import type { Rarity } from './achievements';
import { kindName, t } from './i18n';

export type ChipSource = 'formed' | 'rides' | 'emptied' | 'survived' | 'roundWins' | 'gameWins' | 'achievements' | 'daily' | 'firstWin';
export const CHIP_SOURCES: ChipSource[] = ['formed', 'rides', 'emptied', 'survived', 'roundWins', 'gameWins', 'achievements', 'daily', 'firstWin'];

/** What pays, and how much. */
export const PAY = {
  /** Your hand runs out of cards: a full hand, a TximTxom, or the last card gone on a ride. Once a round. */
  emptied: 30,
  /** Not over the bust total when a round is scored. */
  survived: 10,
  roundWin: 15,
  gameWin: 50,
  /** On top of a game win, for each other player. */
  perOpponent: 10,
  daily: 25,
  /** The first game you win each day, on top of the win itself. */
  firstWin: 50,
};
export const ACH_PAY: Record<Rarity, number> = { common: 10, uncommon: 25, epic: 50, legendary: 100, secret: 50, unique: 250 };

/**
 * What each rule does to the chips a game pays (cards formed, rides, emptied hands, rounds and games won,
 * not busting; not achievements or the daily bonuses). Rules that make formations easier pay less,
 * rules that make the game harder or riskier pay more. Each value is for the rule's current setting.
 */
export const RULE_PAY: { [K in keyof Rules]?: (r: Rules) => number } = {
  softcore: (r) => (r.softcore ? 0.8 : 1),
  superposition: (r) => (r.superposition ? 0.9 : 1),
  mobius: (r) => (r.mobius ? 0.9 : 1),
  smeared: (r) => (r.smeared ? 0.85 : 1),
  magicSort: (r) => (r.magicSort ? 0.9 : 1),
  sixthSense: (r) => (r.sixthSense ? 0.9 : 1),
  twoDecks: (r) => (r.twoDecks ? 0.85 : 1),
  polydactyly: (r) => (r.polydactyly ? 0.9 : 1),
  rides: (r) => ({ any: 1, one: 1.1, none: 1.2 })[r.rides],
  penalty10: (r) => (r.penalty10 ? 1.15 : 1),
  doubleDown: (r) => (r.doubleDown ? 1.15 : 1),
  turnTimer: (r) => (r.turnTimer === 30 ? 1.15 : r.turnTimer === 60 ? 1.05 : 1),
  scramble: (r) => (r.scramble ? 1.2 : 1),
};
/** What a rule pays when it's on (for the rules list): the value at its riskiest setting for a choice. */
export const RULE_PAY_ON: { [K in keyof Rules]?: number } = {
  softcore: 0.8, superposition: 0.9, mobius: 0.9, smeared: 0.85, magicSort: 0.9, sixthSense: 0.9, twoDecks: 0.85, polydactyly: 0.9,
  penalty10: 1.15, doubleDown: 1.15, scramble: 1.2,
};
/** All the rules together: their values multiplied, kept between ×0.5 and ×2. */
export function chipMultiplier(r: Rules): number {
  const k = Object.values(RULE_PAY).reduce((m, f) => m * f!(r), 1);
  return Math.round(Math.min(2, Math.max(0.5, k)) * 100) / 100;
}
/** The sources a game's rules scale. */
const RULED: ChipSource[] = ['formed', 'rides', 'emptied', 'survived', 'roundWins', 'gameWins'];
/** This game's multiplier, from the event being paid. */
let multiplier = 1;

/** One change to the balance. */
export interface ChipEntry {
  at: number;
  src: ChipSource | 'shop' | 'wagerWon' | 'wagerLost';
  n: number;
}

export interface Chips {
  balance: number;
  /** The highest the balance has ever been. */
  most: number;
  /** Chips earned, by where they came from (wagers won aren't earnings). */
  earned: Record<ChipSource, number>;
  spentShop: number;
  wagerWon: number;
  wagerLost: number;
  /** The day the daily bonus was last paid (Date.toDateString()). */
  lastDaily: string;
  /** Days in a row the daily bonus has been paid, up to lastDaily; and the longest run. */
  dailyStreak: number;
  bestDailyStreak: number;
  /** The day the first-win bonus was last paid. */
  lastWinDay: string;
  /** Achievements unlocked before chips existed have been paid for. */
  backPaid: boolean;
  /** Shop items bought (shop.ts ids). */
  owned: string[];
  /** The latest changes, newest last; older ones live on only in the totals above. */
  log: ChipEntry[];
}

const LOG_KEEP = 50;
const KEY = 'tximtxom.chips';
/** The save before the current one: where an edited save falls back to. */
const PREV_KEY = 'tximtxom.chips.prev';
const SECRET = 'txim-txom:chips:7f3a91c2';

const EMPTY: Chips = {
  balance: 0,
  most: 0,
  earned: { formed: 0, rides: 0, emptied: 0, survived: 0, roundWins: 0, gameWins: 0, achievements: 0, daily: 0, firstWin: 0 },
  spentShop: 0,
  wagerWon: 0,
  wagerLost: 0,
  lastDaily: '',
  dailyStreak: 0,
  bestDailyStreak: 0,
  lastWinDay: '',
  backPaid: false,
  owned: [],
  log: [],
};

/** A 53-bit string hash (cyrb53), as hex. */
function hash(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

/** The JSON, XORed with the secret and in base64, so the numbers can't be read or edited in place. */
function scramble(text: string): string {
  const bytes = new TextEncoder().encode(text);
  for (let i = 0; i < bytes.length; i++) bytes[i] ^= SECRET.charCodeAt(i % SECRET.length);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function unscramble(data: string): string {
  const bytes = Uint8Array.from(atob(data), (ch) => ch.charCodeAt(0));
  for (let i = 0; i < bytes.length; i++) bytes[i] ^= SECRET.charCodeAt(i % SECRET.length);
  return new TextDecoder().decode(bytes);
}

const seal = (c: Chips) => {
  const data = scramble(JSON.stringify(c));
  return JSON.stringify({ data, sig: hash(SECRET + data) });
};

/** The save in `raw`, or null if it's missing or its signature doesn't match. */
function open(raw: string | null): Chips | null {
  if (!raw) return null;
  try {
    const { data, sig } = JSON.parse(raw);
    if (typeof data !== 'string' || sig !== hash(SECRET + data)) return null;
    const c = JSON.parse(unscramble(data));
    return { ...EMPTY, ...c, earned: { ...EMPTY.earned, ...c.earned } };
  } catch {
    return null;
  }
}

function load(): Chips {
  try {
    const now = localStorage.getItem(KEY);
    const ok = open(now) ?? open(localStorage.getItem(PREV_KEY));
    // An edited save: put the last valid one back.
    if (now && !open(now) && ok) localStorage.setItem(KEY, seal(ok));
    return ok ?? { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

let chips = load();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function save(): void {
  try {
    const old = localStorage.getItem(KEY);
    if (old && open(old)) localStorage.setItem(PREV_KEY, old);
    localStorage.setItem(KEY, seal(chips));
  } catch {
    // Storage blocked: the chips last for this visit only.
  }
}

/** Where on the table a gain floats up from (table coordinates), and after how long. */
export interface ChipPop {
  id: number;
  n: number;
  /** Without a spot it floats up from your plate. */
  x?: number;
  y?: number;
  delay: number;
  /** What paid: "3-Straight", "Hand emptied". */
  label?: string;
}
type Spot = { x?: number; y?: number; delay?: number };
const popListeners = new Set<(p: ChipPop) => void>();
let popId = 0;

/** Chips earned in the current round and game, for the summaries. */
let roundEarned = 0;
let gameEarned = 0;

/** Adds `n` earned chips from `src`. With `at`, a "+n" floats up there on the table. */
export function earn(src: ChipSource, n: number, at?: Spot, label?: string): void {
  if (n <= 0) return;
  if (RULED.includes(src)) n = Math.max(1, Math.round(n * multiplier));
  const balance = chips.balance + n;
  chips = {
    ...chips,
    balance,
    most: Math.max(chips.most, balance),
    earned: { ...chips.earned, [src]: chips.earned[src] + n },
    log: [...chips.log, { at: Date.now(), src, n }].slice(-LOG_KEEP),
  };
  roundEarned += n;
  gameEarned += n;
  save();
  notify();
  if (at) {
    const pop = { id: ++popId, n, x: at.x, y: at.y, delay: at.delay ?? 0, label };
    popListeners.forEach((l) => l(pop));
  }
}

/** Buys shop item `id` for `price` chips. False if it's owned already or there aren't enough chips. */
export function buyItem(id: string, price: number): boolean {
  if (chips.owned.includes(id) || chips.balance < price) return false;
  chips = {
    ...chips,
    balance: chips.balance - price,
    spentShop: chips.spentShop + price,
    owned: [...chips.owned, id],
    log: [...chips.log, { at: Date.now(), src: 'shop' as const, n: -price }].slice(-LOG_KEEP),
  };
  save();
  notify();
  return true;
}

/** Gives item `id` for free (an achievement's reward). */
export function grantItem(id: string): void {
  if (chips.owned.includes(id)) return;
  chips = { ...chips, owned: [...chips.owned, id] };
  save();
  notify();
}

export const chipsNow = (): Chips => chips;
/** Every chip ever earned (what the chip achievements count). */
export const chipsEarned = (c: Chips = chips): number => CHIP_SOURCES.reduce((n, s) => n + c.earned[s], 0);
export const roundChips = () => roundEarned;
export const gameChips = () => gameEarned;

export function onChips(l: () => void): () => void {
  listeners.add(l);
  return () => void listeners.delete(l);
}

export function onChipPop(l: (p: ChipPop) => void): () => void {
  popListeners.add(l);
  return () => void popListeners.delete(l);
}

/** Preact hook: the chips, live. */
export function useChips(): Chips {
  const [c, set] = useState(chips);
  useEffect(() => onChips(() => set(chips)), []);
  return c;
}

/** Pays once for achievements unlocked before chips existed. */
export function payBack(rarities: Rarity[]): void {
  if (chips.backPaid) return;
  chips = { ...chips, backPaid: true };
  earn('achievements', rarities.reduce((n, r) => n + ACH_PAY[r], 0));
  if (!rarities.length) save();
}

/** A ride card pays half its rank, rounded up. */
export const ridePay = (card: number) => Math.ceil(rankOf(card) / 2);

/** On top of the cards' ranks, for formations bigger than a normal hand allows (Polydactyly, two decks). */
export const BIG_PAY: { straight: Record<number, number>; set: Record<number, number> } = {
  straight: { 8: 50, 9: 100 },
  set: { 5: 40, 6: 60, 7: 100, 8: 150 },
};
const bigPay = (kind: string, size: number) => (kind === 'straight' ? BIG_PAY.straight : BIG_PAY.set)[size] ?? 0;

/** Formation sizes this round, so a ride that makes a formation big pays its bonus. */
const sizes = new Map<number, { kind: string; n: number }>();
/** The once-a-round bonus for an empty hand has been paid. */
let emptiedPaid = false;

/** After a play of yours: an empty hand pays, once a round, a moment after the play's own pop. */
function checkEmptied(g: GameView, me: number, at?: Spot): void {
  if (emptiedPaid || g.players[me].handCount > 0) return;
  emptiedPaid = true;
  earn('emptied', PAY.emptied, { ...at, delay: (at?.delay ?? 0) + 500 }, t('chips.pop.emptied'));
}

/**
 * Chips from one game event, for you. Called once per event, as it happens.
 * `spot` says where a formation is on the table, for the floating "+n".
 */
export function chipsEvent(e: GameEvent, g: GameView, spot: (formationId: number) => { x: number; y: number; delay: number } | null): void {
  const me = g.you;
  if (me === null) return;
  multiplier = chipMultiplier(g.rules);
  switch (e.t) {
    case 'deal':
      roundEarned = 0;
      sizes.clear();
      emptiedPaid = false;
      if (g.round === 1) {
        gameEarned = 0;
        const today = new Date().toDateString();
        if (chips.lastDaily !== today) {
          // Yesterday's bonus too: the streak goes on; otherwise it starts again.
          const yesterday = new Date(Date.now() - 864e5).toDateString();
          const dailyStreak = chips.lastDaily === yesterday ? chips.dailyStreak + 1 : 1;
          chips = { ...chips, lastDaily: today, dailyStreak, bestDailyStreak: Math.max(chips.bestDailyStreak, dailyStreak) };
          earn('daily', PAY.daily);
        }
      }
      break;
    case 'lay': {
      sizes.set(e.formationId, { kind: e.kind, n: e.cards.length });
      if (e.seat !== me) break;
      const at = spot(e.formationId) ?? undefined;
      const name = kindName(e.kind, e.cards.length);
      earn('formed', e.cards.reduce((n, c) => n + rankOf(c), 0) + bigPay(e.kind, e.cards.length), at, name);
      checkEmptied(g, me, at);
      break;
    }
    case 'ride': {
      const f = sizes.get(e.formationId);
      if (f) f.n++;
      if (e.seat !== me) break;
      const at = spot(e.formationId) ?? undefined;
      const big = f ? bigPay(f.kind, f.n) : 0;
      earn('rides', ridePay(e.card) + big, at, big && f ? kindName(f.kind, f.n) : t('chips.pop.ride'));
      checkEmptied(g, me, at);
      break;
    }
    case 'tximtxom':
      if (e.seat === me && !emptiedPaid) {
        emptiedPaid = true;
        earn('emptied', PAY.emptied, {}, 'TximTxom!');
      }
      break;
    case 'score': {
      const r = g.results.at(-1);
      if (!r) break;
      if (r.totals[me] <= bustLimit(g.rules)) earn('survived', PAY.survived);
      if (r.points[me] === Math.min(...r.points)) earn('roundWins', PAY.roundWin);
      break;
    }
    case 'gameOver':
      if (e.winners.includes(me)) {
        earn('gameWins', PAY.gameWin + PAY.perOpponent * (g.players.length - 1));
        const today = new Date().toDateString();
        if (chips.lastWinDay !== today) {
          chips = { ...chips, lastWinDay: today };
          earn('firstWin', PAY.firstWin);
        }
      }
      break;
  }
}
