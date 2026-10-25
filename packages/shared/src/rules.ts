export type RideOrder = 'simultaneous' | 'roundRobin';

/** Room settings. Everything here is chosen by the host before the game starts. */
export interface Rules {
  /** A player busts when their total goes OVER this. */
  threshold: number;
  /** Pairs count as formations too (off: trios, quads and straights only). */
  softcore: boolean;
  /** Aces can also be high (Q-K-A), but never in the middle of a straight. */
  superposition: boolean;
  /** The server places ride cards for everyone. */
  autoRide: boolean;
  /** Tell a revealing player when nothing else can be formed (no other hints). */
  noMoreFormationsNotice: boolean;
  rideOrder: RideOrder;
  /** Ender doesn't have the strictly lowest round score: their round points double. */
  doubleDown: boolean;
  /** Ender doesn't have the strictly lowest round score: +10. Applied after doubling. */
  penalty10: boolean;
  /** Seconds per turn, 0 = no timer. */
  turnTimer: number;
  /** Players can peek at which cards are still in play (not in their hand, not seen discarded). */
  sixthSense: boolean;
  /** Straights may mix suits. TximTxom still needs a single suit. */
  smeared: boolean;
}

export const DEFAULT_RULES: Rules = {
  threshold: 40,
  softcore: false,
  superposition: false,
  autoRide: false,
  noMoreFormationsNotice: true,
  rideOrder: 'simultaneous',
  doubleDown: false,
  penalty10: false,
  turnTimer: 0,
  sixthSense: false,
  smeared: false,
};

export const THRESHOLD_OPTIONS = [40, 100] as const;
export const TIMER_OPTIONS = [0, 30, 60] as const;

export function sanitizeRules(input: Partial<Rules> | undefined): Rules {
  const r = { ...DEFAULT_RULES, ...(input ?? {}) };
  return {
    threshold: (THRESHOLD_OPTIONS as readonly number[]).includes(r.threshold) ? r.threshold : 40,
    softcore: !!r.softcore,
    superposition: !!r.superposition,
    autoRide: !!r.autoRide,
    noMoreFormationsNotice: !!r.noMoreFormationsNotice,
    rideOrder: r.rideOrder === 'roundRobin' ? 'roundRobin' : 'simultaneous',
    doubleDown: !!r.doubleDown,
    penalty10: !!r.penalty10,
    turnTimer: (TIMER_OPTIONS as readonly number[]).includes(r.turnTimer) ? r.turnTimer : 0,
    sixthSense: !!r.sixthSense,
    smeared: !!r.smeared,
  };
}

/** Bots are dungeon characters with Kriolu nicknames: a default name and the art that goes with it. */
export const BOT_PERSONAS = [
  { name: 'Mágiku', avatar: 'magiku' },
  { name: 'Kabaleru', avatar: 'kabaleru' },
  { name: 'Bikingu', avatar: 'bikingu' },
  { name: 'Fantasma', avatar: 'fantasma' },
  { name: 'Ziku', avatar: 'ziku' },
  { name: 'Frei', avatar: 'frei' },
] as const;

/** Character art human players cycle through in the room. */
export const HUMAN_JOKERS = [
  'villager', 'bearded', 'barbarian', 'guard', 'squire', 'princess', 'elder',
  'slime', 'crab', 'ranger', 'bat', 'spider', 'snail', 'boar',
] as const;

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const HAND_SIZE = 7;
export const FULL_HAND_BONUS = -10;
export const PENALTY_POINTS = 10;
