// Achievements: unlocked on this device and saved with it, like your stats.
// Each one unlocks once; a toast at the top of the screen announces it, one at
// a time. Infected is the odd one: it passes between players who share a room
// (see `infected` in the room protocol), and the very first player to start a
// game gets it from nobody (see claimPatientZero in stats.ts).
import type { GameEvent, GameView, RoomView, Rules } from '@tximtxom/shared';
import { useEffect, useState } from 'preact/hooks';
import { play } from './audio';
import { store } from './store';
import { claimPatientZero, countInfected, creditCarrier, type MyStats, myStats, onStats } from './stats';

const CARRIER_KEY = 'tximtxom.carrier';
const newCarrierId = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
/** Used when storage is blocked: a new id each visit. */
let carrierFallback = '';
/** This device's anonymous carrier id: a random token, so the players who catch
 *  Infected from you can be counted without knowing who you are. */
export function carrierId(): string {
  try {
    let id = localStorage.getItem(CARRIER_KEY);
    if (!id || !/^[a-z0-9]{12}$/.test(id)) {
      id = newCarrierId();
      localStorage.setItem(CARRIER_KEY, id);
    }
    return id;
  } catch {
    return (carrierFallback ||= newCarrierId());
  }
}

export type AchievementId =
  | 'tipTap' | 'dealtIn' | 'lowRoller' | 'champion' | 'competitor' | 'tximtxom' | 'bitter' | 'busted' | 'likeIce' | 'nuts'
  | 'ragequit' | 'chips10' | 'chips100' | 'chips1000' | 'roundWins10' | 'gameWins10' | 'fullParty' | 'midas' | 'firstLoser'
  | 'addicted' | 'busPass' | 'rtfm' | 'badTiming' | 'fullHand' | 'newLook' | 'distracted' | 'allRules' | `rule_${RuleAch}`
  | 'closeCall' | 'flawless' | 'comeback' | 'generous' | `${Track}${number}`
  | 'infected' | 'scholar' | 'prettyBasic' | 'nerd';

/** One achievement per rule, for playing a round with it on: its card art, and whether it's on. */
export const RULE_ACHIEVEMENTS = {
  bust100: { art: 'bust', on: (r: Rules) => r.threshold === 100 },
  softcore: { art: 'softcore', on: (r: Rules) => r.softcore },
  superposition: { art: 'ace', on: (r: Rules) => r.superposition },
  smeared: { art: 'mixed', on: (r: Rules) => r.smeared },
  inTurns: { art: 'ride', on: (r: Rules) => r.rideOrder === 'roundRobin' },
  autoRide: { art: 'autoride', on: (r: Rules) => r.autoRide },
  sixthSense: { art: 'peek', on: (r: Rules) => r.sixthSense },
  notice: { art: 'notice', on: (r: Rules) => r.noMoreFormationsNotice },
  penalty10: { art: 'penalty', on: (r: Rules) => r.penalty10 },
  doubleDown: { art: 'double', on: (r: Rules) => r.doubleDown },
  timer: { art: 'timer', on: (r: Rules) => r.turnTimer > 0 },
} satisfies Record<string, { art: string; on: (r: Rules) => boolean }>;
export type RuleAch = keyof typeof RULE_ACHIEVEMENTS;
const RULE_ACH_IDS = Object.keys(RULE_ACHIEVEMENTS) as RuleAch[];

/** Running counts with a row of achievements each (5, 25 and 100), from your stats. */
export const TRACKS = {
  roundsWon: { art: 'ace', count: (s: MyStats) => s.roundsWon },
  gamesWon: { art: 'princess', count: (s: MyStats) => s.gamesWon },
  formations: { art: 'softcore', count: (s: MyStats) => s.formations },
  straights: { art: 'mixed', count: (s: MyStats) => s.kinds.straight },
  quads: { art: 'double', count: (s: MyStats) => s.kinds.quad },
  ridesTaken: { art: 'ride', count: (s: MyStats) => s.rides },
  ridesGiven: { art: 'autoride', count: (s: MyStats) => s.ridesGiven },
  txiJogs: { art: 'txijog', count: (s: MyStats) => s.roundsEnded },
  draws: { art: 'turn', count: (s: MyStats) => s.cardsDrawn },
} satisfies Record<string, { art: string; count: (s: MyStats) => number }>;
export type Track = keyof typeof TRACKS;
const GOALS: [number, Rarity][] = [
  [5, 'common'],
  [25, 'uncommon'],
  [100, 'epic'],
];
/** Goals an older achievement already covers (Midas is 5 games won, Bus Pass 25 rides): no second card for them. */
const COVERED: Partial<Record<Track, number[]>> = { gamesWon: [5], ridesTaken: [25] };

/** How hard it is to get, shown as the colour down the card's side. Secret ones are red. */
export type Rarity = 'common' | 'uncommon' | 'epic' | 'legendary' | 'secret';

export interface Achievement {
  id: AchievementId;
  /** Card art (art atlas) shown once it's unlocked; `cards:<frame>` for one from the cards atlas. */
  art: string;
  rarity: Rarity;
  /** Hidden until unlocked: no name, no description. */
  secret?: boolean;
  /** Not in the game yet (needs chips): left out of the list. */
  soon?: boolean;
  /** Framed in moving rainbow colours instead of its rarity's (kept for a future Completionist). */
  rainbow?: boolean;
  /** One of the per-rule achievements: its text is made from the rule's name. */
  rule?: RuleAch;
  /** Unlocked when this running count reaches `goal`; the card shows how far along it is (and keeps counting). */
  track?: Track;
  goal?: number;
  /** Made from its track ("Hitchhiker II"): the tier's number, from 1. */
  tier?: number;
}

/** Common to legendary, then the secret ones. */
const ALL: Achievement[] = [
  { id: 'tipTap', art: 'notice', rarity: 'common' },
  { id: 'dealtIn', art: 'villager', rarity: 'common' },
  { id: 'lowRoller', art: 'ace', rarity: 'common' },
  { id: 'champion', art: 'princess', rarity: 'common' },
  { id: 'busted', art: 'bust', rarity: 'common' },
  { id: 'firstLoser', art: 'bearded', rarity: 'common' },
  { id: 'ragequit', art: 'bat', rarity: 'common' },
  { id: 'rtfm', art: 'help', rarity: 'common' },
  { id: 'newLook', art: 'magiku', rarity: 'common' },
  { id: 'distracted', art: 'frei', rarity: 'common' },
  { id: 'chips10', art: 'guard', rarity: 'common', soon: true },
  { id: 'competitor', art: 'barbarian', rarity: 'uncommon' },
  { id: 'fullHand', art: 'txijog', rarity: 'uncommon' },
  { id: 'fullParty', art: 'turn', rarity: 'uncommon' },
  { id: 'roundWins10', art: 'squire', rarity: 'uncommon', track: 'roundsWon', goal: 10 },
  { id: 'busPass', art: 'ride', rarity: 'uncommon', track: 'ridesTaken', goal: 25 },
  { id: 'generous', art: 'villager', rarity: 'uncommon' },
  { id: 'addicted', art: 'timer', rarity: 'uncommon' },
  { id: 'chips100', art: 'ranger', rarity: 'uncommon', soon: true },
  { id: 'gameWins10', art: 'boar', rarity: 'epic', track: 'gamesWon', goal: 10 },
  { id: 'midas', art: 'ziku', rarity: 'epic', track: 'gamesWon', goal: 5 },
  { id: 'closeCall', art: 'bust', rarity: 'epic' },
  { id: 'comeback', art: 'boar', rarity: 'epic' },
  { id: 'bitter', art: 'snail', rarity: 'epic' },
  { id: 'likeIce', art: 'fantasma', rarity: 'epic' },
  { id: 'nuts', art: 'crab', rarity: 'epic' },
  { id: 'badTiming', art: 'autoride', rarity: 'epic' },
  { id: 'tximtxom', art: 'tximtxom', rarity: 'legendary' },
  { id: 'flawless', art: 'kabaleru', rarity: 'legendary' },
  // The running counts, each track's goals in a row.
  ...(Object.keys(TRACKS) as Track[]).flatMap((track) =>
    GOALS.filter(([goal]) => !COVERED[track]?.includes(goal)).map(
      ([goal, rarity], i): Achievement => ({ id: `${track}${goal}`, art: TRACKS[track].art, rarity, track, goal, tier: i + 1 }),
    ),
  ),
  { id: 'allRules', art: 'bikingu', rarity: 'legendary' },
  { id: 'chips1000', art: 'kabaleru', rarity: 'legendary', soon: true },
  ...RULE_ACH_IDS.map((rule): Achievement => ({ id: `rule_${rule}`, art: RULE_ACHIEVEMENTS[rule].art, rarity: 'common', rule })),
  { id: 'infected', art: 'slime', rarity: 'secret', secret: true },
  { id: 'scholar', art: 'elder', rarity: 'secret', secret: true },
  { id: 'prettyBasic', art: 'cards:base', rarity: 'secret', secret: true },
  { id: 'nerd', art: 'spider', rarity: 'secret', secret: true },
];
/** The achievements you can get now. */
export const ACHIEVEMENTS = ALL.filter((a) => !a.soon);

const KEY = 'tximtxom.achievements';
/** Time a toast is on screen (about 4 s to read it, plus sliding in and out),
 *  and the pause before the next one. Real time: the game speed doesn't touch it. */
export const TOAST_MS = 4800;
const TOAST_GAP_MS = 500;

/** When each achievement was unlocked (ms timestamp). */
export type Unlocked = Partial<Record<AchievementId, number>>;

function load(): Unlocked {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

let unlocked = load();
let toastQueue: AchievementId[] = [];
let showing: AchievementId | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const unlockHooks = new Set<(id: AchievementId) => void>();

/** Calls `hook` with each achievement as it's unlocked. */
export function onUnlock(hook: (id: AchievementId) => void): void {
  unlockHooks.add(hook);
}

export const hasAchievement = (id: AchievementId) => !!unlocked[id];

/** Unlocks `id` (once) and queues its toast. Infected also adds to the global
 *  count, unless claiming patient zero just did. */
export function unlock(id: AchievementId, counted = false): void {
  if (unlocked[id]) return;
  if (id === 'infected' && !counted) countInfected();
  unlocked = { ...unlocked, [id]: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(unlocked));
  } catch {
    // Storage blocked: unlocked for this visit only.
  }
  toastQueue.push(id);
  notify();
  unlockHooks.forEach((h) => h(id));
  if (!showing) nextToast();
}

function nextToast(): void {
  showing = toastQueue.shift() ?? null;
  notify();
  if (!showing) return;
  play('coin1', { volume: 0.7 });
  setTimeout(() => {
    showing = null;
    notify();
    setTimeout(nextToast, TOAST_GAP_MS);
  }, TOAST_MS);
}

function useAchievementState<R>(pick: () => R): R {
  const [, redraw] = useState(0);
  useEffect(() => {
    const l = () => redraw((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return pick();
}

export const useUnlocked = () => useAchievementState(() => unlocked);
/** The achievement whose toast is up, or null. */
export const useAchievementToast = () => useAchievementState(() => showing);

// ---------------------------------------------------------------- unlocking

let triedPatientZero = false;

/** Where this round's events start in the game's log. */
function lastDealIndex(g: GameView): number {
  let i = g.events.length - 1;
  while (i > 0 && g.events[i].e.t !== 'deal') i--;
  return Math.max(0, i);
}

/** Checks one game event for achievements. Called once per event, as it happens. */
export function achievementEvent(e: GameEvent, g: GameView, room: RoomView): void {
  const me = g.you;
  if (me === null) return;
  const threshold = g.rules.threshold;
  switch (e.t) {
    case 'deal':
      unlock('dealtIn');
      // Each rule on in this round, and all of them once they've all been played.
      for (const rule of RULE_ACH_IDS) if (RULE_ACHIEVEMENTS[rule].on(g.rules)) unlock(`rule_${rule}`);
      if (RULE_ACH_IDS.every((rule) => unlocked[`rule_${rule}`])) unlock('allRules');
      // Every round start, Infected passes to anyone at the table who doesn't have it yet.
      const carriers = room.players.filter((p) => p.id !== room.youId && p.infected);
      if (carriers.length) {
        // Caught it just now: it counts for one of the players you caught it from.
        const ids = carriers.flatMap((p) => p.carrier ?? []);
        if (!unlocked.infected && ids.length) creditCarrier(ids[Math.floor(Math.random() * ids.length)]);
        unlock('infected');
      }
      else if (!unlocked.infected && !triedPatientZero) {
        triedPatientZero = true;
        void claimPatientZero().then((first) => first && unlock('infected', true));
      }
      break;
    case 'score': {
      const r = g.results.at(-1);
      if (!r) return;
      if (r.points[me] === Math.min(...r.points)) unlock('lowRoller');
      // Three different players riding on one formation of yours, this round.
      const mine = new Set(g.events.flatMap((x) => (x.e.t === 'lay' && x.e.seat === me ? [x.e.formationId] : [])));
      const riders = new Map<number, Set<number>>();
      for (const { e: x } of g.events.slice(lastDealIndex(g)))
        if (x.t === 'ride' && mine.has(x.formationId) && x.seat !== me) riders.set(x.formationId, (riders.get(x.formationId) ?? new Set()).add(x.seat));
      if ([...riders.values()].some((r) => r.size >= 3)) unlock('generous');
      // All seven formed, but someone else ended the round first.
      if (r.ender !== null && r.ender !== me && r.leftovers[me].length === 0) unlock('badTiming');
      if (r.totals[me] === 69 && r.totals[me] > threshold) unlock('nuts');
      break;
    }
    case 'end':
      if (e.bonus && e.seat === me) unlock('fullHand');
      break;
    case 'tximtxom':
      if (e.seat === me) unlock('tximtxom');
      else if (g.round === 1) unlock('bitter');
      break;
    case 'gameOver': {
      const total = g.players[me].total;
      if (e.winners.includes(me)) {
        unlock('champion');
        if (g.players.some((p, i) => i !== me && !p.isBot)) unlock('competitor');
        if (total < 0) unlock('likeIce');
        // Every round of the game (three at least) won too.
        if (g.results.length >= 3 && g.results.every((r) => r.points[me] === Math.min(...r.points))) unlock('flawless');
        // Out in front on points (the worst place to be) at some point, and still won.
        if (g.players.length > 1 && g.results.some((r) => r.totals.every((x, i) => i === me || r.totals[me] > x))) unlock('comeback');
      } else if (total > threshold) unlock('busted');
      else unlock('firstLoser');
      if (g.players.length > 1 && g.players.every((p) => !p.isBot)) unlock('fullParty');
      // Right on the limit, and not over it.
      if (total === threshold) unlock('closeCall');
      break;
    }
  }
}

/** Achievements that come from your running stats, checked as they change. */
export function initAchievements(): void {
  const check = () => {
    const s = myStats();
    for (const a of ACHIEVEMENTS) if (a.track && a.goal && TRACKS[a.track].count(s) >= a.goal) unlock(a.id);
    if (s.timePlayed >= 60 * 60 * 1000) unlock('addicted');
  };
  check();
  onStats(check);
  let room: RoomView | null = null;
  store.subscribe(() => {
    const next = store.get().room;
    if (next === room) return;
    room = next;
    achievementRoom(room);
  });
}

/** Moves the turn timer made for you, in the room's last view: Distracted when it goes up. */
let myTimeouts: number | null = null;

/** Checks each new room view for achievements that aren't game events. */
export function achievementRoom(room: RoomView | null): void {
  const me = room?.players.find((p) => p.id === room.youId);
  if (!me) {
    myTimeouts = null;
    return;
  }
  if (myTimeouts !== null && me.timeouts > myTimeouts) unlock('distracted');
  myTimeouts = me.timeouts;
}
