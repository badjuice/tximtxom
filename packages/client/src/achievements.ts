// Achievements: unlocked on this device and saved with it, like your stats.
// Each one unlocks once; a toast at the top of the screen announces it, one at
// a time. Infected is the odd one: it passes between players who share a room
// (see `infected` in the room protocol), and the very first player to start a
// game gets it from nobody (see claimPatientZero in stats.ts).
import type { GameEvent, GameView, RoomView } from '@tximtxom/shared';
import { useEffect, useState } from 'preact/hooks';
import { play } from './audio';
import { claimPatientZero, countInfected, creditCarrier, myStats, onStats } from './stats';

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
  | 'addicted' | 'busPass' | 'rtfm' | 'badTiming' | 'fullHand'
  | 'infected' | 'scholar' | 'prettyBasic' | 'nerd';

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
  { id: 'chips10', art: 'guard', rarity: 'common', soon: true },
  { id: 'competitor', art: 'barbarian', rarity: 'uncommon' },
  { id: 'fullHand', art: 'txijog', rarity: 'uncommon' },
  { id: 'fullParty', art: 'turn', rarity: 'uncommon' },
  { id: 'roundWins10', art: 'squire', rarity: 'uncommon' },
  { id: 'busPass', art: 'ride', rarity: 'uncommon' },
  { id: 'addicted', art: 'timer', rarity: 'uncommon' },
  { id: 'chips100', art: 'ranger', rarity: 'uncommon', soon: true },
  { id: 'gameWins10', art: 'boar', rarity: 'epic' },
  { id: 'midas', art: 'ziku', rarity: 'epic' },
  { id: 'bitter', art: 'snail', rarity: 'epic' },
  { id: 'likeIce', art: 'fantasma', rarity: 'epic' },
  { id: 'nuts', art: 'crab', rarity: 'epic' },
  { id: 'badTiming', art: 'autoride', rarity: 'epic' },
  { id: 'tximtxom', art: 'tximtxom', rarity: 'legendary' },
  { id: 'chips1000', art: 'kabaleru', rarity: 'legendary', soon: true },
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

/** Checks one game event for achievements. Called once per event, as it happens. */
export function achievementEvent(e: GameEvent, g: GameView, room: RoomView): void {
  const me = g.you;
  if (me === null) return;
  const threshold = g.rules.threshold;
  switch (e.t) {
    case 'deal':
      unlock('dealtIn');
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
      } else if (total > threshold) unlock('busted');
      else unlock('firstLoser');
      if (g.players.length > 1 && g.players.every((p) => !p.isBot)) unlock('fullParty');
      break;
    }
  }
}

/** Achievements that come from your running stats, checked as they change. */
export function initAchievements(): void {
  const check = () => {
    const s = myStats();
    if (s.roundsWon >= 10) unlock('roundWins10');
    if (s.gamesWon >= 5) unlock('midas');
    if (s.gamesWon >= 10) unlock('gameWins10');
    if (s.rides >= 25) unlock('busPass');
    if (s.timePlayed >= 60 * 60 * 1000) unlock('addicted');
  };
  check();
  onStats(check);
}
