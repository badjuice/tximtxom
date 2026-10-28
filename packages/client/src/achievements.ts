// Achievements: unlocked on this device and saved with it, like your stats.
// Each one unlocks once; a toast at the top of the screen announces it, one at
// a time. Infected is the odd one: it passes between players who share a room
// (see `infected` in the room protocol), and the very first player to start a
// game gets it from nobody (see claimPatientZero in stats.ts).
import type { GameEvent, GameView, RoomView } from '@tximtxom/shared';
import { useEffect, useState } from 'preact/hooks';
import { play } from './audio';
import { claimPatientZero, countInfected } from './stats';
import { store } from './store';

export type AchievementId =
  'dealtIn' | 'lowRoller' | 'champion' | 'competitor' | 'tximtxom' | 'bitter' | 'busted' | 'likeIce' | 'nuts' | 'infected' | 'scholar';

export interface Achievement {
  id: AchievementId;
  /** Card art (art atlas) shown once it's unlocked. */
  art: string;
  /** Hidden until unlocked: no name, no description. */
  secret?: boolean;
}

/** In the order they tend to unlock; the secret ones last. */
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'dealtIn', art: 'villager' },
  { id: 'lowRoller', art: 'ace' },
  { id: 'champion', art: 'princess' },
  { id: 'competitor', art: 'barbarian' },
  { id: 'tximtxom', art: 'tximtxom' },
  { id: 'bitter', art: 'snail' },
  { id: 'busted', art: 'bust' },
  { id: 'likeIce', art: 'fantasma' },
  { id: 'nuts', art: 'crab' },
  { id: 'infected', art: 'slime', secret: true },
  { id: 'scholar', art: 'elder', secret: true },
];

const KEY = 'tximtxom.achievements';
/** Time a toast stays up, and the pause before the next one. */
const TOAST_MS = 3600;
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
export function achievementEvent(e: GameEvent, g: GameView): void {
  const me = g.you;
  if (me === null) return;
  const threshold = g.rules.threshold;
  switch (e.t) {
    case 'deal':
      unlock('dealtIn');
      if (!unlocked.infected && !triedPatientZero) {
        triedPatientZero = true;
        void claimPatientZero().then((first) => first && unlock('infected', true));
      }
      break;
    case 'score': {
      const r = g.results.at(-1);
      if (!r) return;
      if (r.points[me] === Math.min(...r.points)) unlock('lowRoller');
      if (r.totals[me] === 69 && r.totals[me] > threshold) unlock('nuts');
      break;
    }
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
      break;
    }
  }
}

/** Catches Infected from anyone else in the room who has it. */
function catchInfection(room: RoomView | null): void {
  if (!room || unlocked.infected) return;
  if (room.players.some((p) => p.id !== room.youId && p.infected)) unlock('infected');
}

export function initAchievements(): void {
  store.subscribe(() => catchInfection(store.get().room));
}
