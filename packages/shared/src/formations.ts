import { type Card, cardPoints, rankOf, suitOf } from './cards.js';
import { HAND_SIZE, type Rules } from './rules.js';

export type FormationKind = 'pair' | 'trio' | 'quad' | 'straight';

export interface FormationInfo {
  kind: FormationKind;
  /** Cards in display order (straights low to high). */
  cards: Card[];
}

type RuleFlags = Pick<Rules, 'hardcore' | 'superposition'> & { smeared?: boolean };

function setKind(n: number): FormationKind | null {
  return n === 2 ? 'pair' : n === 3 ? 'trio' : n === 4 ? 'quad' : null;
}

/** Sorts straight cards low to high, or returns null if they are not a straight. */
function straightOrder(cards: readonly Card[], aceHigh: boolean): Card[] | null {
  const value = (c: Card) => (aceHigh && rankOf(c) === 1 ? 14 : rankOf(c));
  const sorted = [...cards].sort((a, b) => value(a) - value(b));
  for (let i = 1; i < sorted.length; i++) {
    if (value(sorted[i]) !== value(sorted[i - 1]) + 1) return null;
  }
  return sorted;
}

/**
 * Checks whether a group of cards is a legal formation.
 * - Sets: 2-4 cards of one rank (3-4 in Hardcore).
 * - Straights: 3+ consecutive cards of ONE suit (any suits with Smeared). Ace is low (A-2-3); with
 *   Superposition it may instead be high (Q-K-A). Since an Ace takes exactly
 *   one value per straight, it can never sit in the middle and nothing wraps.
 */
export function classifyFormation(cards: readonly Card[], rules: RuleFlags): FormationInfo | null {
  if (cards.length < 2 || new Set(cards).size !== cards.length) return null;

  const r0 = rankOf(cards[0]);
  if (cards.every((c) => rankOf(c) === r0)) {
    const kind = setKind(cards.length);
    if (!kind) return null;
    if (kind === 'pair' && rules.hardcore) return null;
    return { kind, cards: [...cards].sort((a, b) => suitOf(a) - suitOf(b)) };
  }

  if (cards.length < 3) return null;
  const s0 = suitOf(cards[0]);
  if (!rules.smeared && !cards.every((c) => suitOf(c) === s0)) return null;
  const low = straightOrder(cards, false);
  if (low) return { kind: 'straight', cards: low };
  if (rules.superposition) {
    const high = straightOrder(cards, true);
    if (high) return { kind: 'straight', cards: high };
  }
  return null;
}

export function isValidFormation(cards: readonly Card[], rules: RuleFlags): boolean {
  return classifyFormation(cards, rules) !== null;
}

/**
 * Can `card` be added to an existing formation (Take a Ride)?
 * Pairs/trios take a single card of the same rank; straights take cards at
 * either end (same suit unless Smeared). The "one card per player per pair/trio" limit is
 * enforced by the engine, which knows who already rode.
 */
export function canRide(formation: readonly Card[], card: Card, rules: RuleFlags): FormationInfo | null {
  const before = classifyFormation(formation, rules);
  if (!before) return null;
  const after = classifyFormation([...formation, card], rules);
  if (!after) return null;
  const wasSet = before.kind !== 'straight';
  const isSet = after.kind !== 'straight';
  return wasSet === isSet ? after : null;
}

/** A 7-card straight of one suit. Smeared does not apply here. */
export function isTximTxom(hand: readonly Card[], rules: RuleFlags): boolean {
  if (hand.length !== HAND_SIZE) return false;
  const f = classifyFormation(hand, { ...rules, smeared: false });
  return f?.kind === 'straight';
}

export interface Partition {
  formations: FormationInfo[];
  /** Cards left over. */
  leftover: Card[];
  /** Points of the leftover cards. */
  points: number;
}

/**
 * Finds the arrangement of formations that leaves the fewest points.
 * Hands are small (7-8 cards), so this checks every subset with a DP over bitmasks.
 */
export function bestPartition(hand: readonly Card[], rules: RuleFlags): Partition {
  const n = hand.length;
  const full = (1 << n) - 1;
  const valid: (FormationInfo | null)[] = new Array(1 << n).fill(null);
  for (let m = 1; m <= full; m++) {
    if (popcount(m) < 2) continue;
    valid[m] = classifyFormation(pick(hand, m), rules);
  }
  // best[m] = min leftover points using only cards in mask m
  const best = new Array<number>(1 << n).fill(0);
  const choice = new Array<number>(1 << n).fill(0);
  for (let m = 1; m <= full; m++) {
    const low = m & -m;
    const lowIdx = 31 - Math.clz32(low);
    // Option 1: lowest card stays unformed.
    best[m] = best[m ^ low] + cardPoints(hand[lowIdx]);
    choice[m] = 0;
    // Option 2: lowest card is part of a formation `sub` within m.
    const rest = m ^ low;
    for (let s = rest; ; s = (s - 1) & rest) {
      const sub = s | low;
      if (valid[sub] && best[m ^ sub] < best[m]) {
        best[m] = best[m ^ sub];
        choice[m] = sub;
      }
      if (s === 0) break;
    }
  }
  const formations: FormationInfo[] = [];
  const leftover: Card[] = [];
  let m = full;
  while (m) {
    const sub = choice[m];
    if (sub) {
      formations.push(valid[sub]!);
      m ^= sub;
    } else {
      const low = m & -m;
      leftover.push(hand[31 - Math.clz32(low)]);
      m ^= low;
    }
  }
  return { formations, leftover, points: best[full] };
}

/** True if every card in the hand can be placed in formations. */
export function isFullyFormed(hand: readonly Card[], rules: RuleFlags): boolean {
  return hand.length > 0 && bestPartition(hand, rules).leftover.length === 0;
}

/** True if at least one formation can still be made from these cards. */
export function anyFormationPossible(hand: readonly Card[], rules: RuleFlags): boolean {
  const n = hand.length;
  for (let m = 1; m < 1 << n; m++) {
    if (popcount(m) >= 2 && classifyFormation(pick(hand, m), rules)) return true;
  }
  return false;
}

function popcount(m: number): number {
  let c = 0;
  while (m) {
    m &= m - 1;
    c++;
  }
  return c;
}

function pick<T>(arr: readonly T[], mask: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < arr.length; i++) if (mask & (1 << i)) out.push(arr[i]);
  return out;
}
