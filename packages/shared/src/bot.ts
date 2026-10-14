import { type Card, canEndWith } from './cards.js';
import { rideCandidates } from './engine.js';
import { bestPartition, isFullyFormed, isTximTxom } from './formations.js';
import type { Action, GameState, Seat } from './types.js';

/** Leftover points the bot is happy to end the round with. */
const END_THRESHOLD = 6;
/** Minimum improvement needed to take the visible discard instead of drawing blind. */
const TAKE_GAIN = 3;

function deadwood(state: GameState, hand: Card[]): number {
  return bestPartition(hand, state.rules).points;
}

function without(hand: Card[], card: Card): Card[] {
  const i = hand.indexOf(card);
  return i < 0 ? [...hand] : [...hand.slice(0, i), ...hand.slice(i + 1)];
}

/** Best card to let go from `pool` (never `forbidden`) to minimise leftover points. */
function bestDrop(state: GameState, pool: Card[], forbidden: Card | null): { card: Card; points: number } {
  let best = { card: -1, points: Infinity };
  for (const c of pool) {
    if (c === forbidden) continue;
    const pts = deadwood(state, without(pool, c));
    // Tie-break: get rid of the highest card.
    if (pts < best.points || (pts === best.points && c % 13 > best.card % 13)) best = { card: c, points: pts };
  }
  return best;
}

/** Best way to end the round from `pool` (8 cards), or null if no legal ending card. */
function bestEnd(state: GameState, pool: Card[], forbidden: Card | null, anyCard: boolean) {
  let best: { card: Card; points: number; full: boolean } | null = null;
  for (const c of pool) {
    if (c === forbidden || (!anyCard && !canEndWith(c))) continue;
    const rest = without(pool, c);
    const pts = deadwood(state, rest);
    const full = canEndWith(c) && isFullyFormed(rest, state.rules);
    const score = full ? -10 : pts;
    if (!best || score < (best.full ? -10 : best.points)) best = { card: c, points: pts, full };
  }
  return best;
}

/** Picks the next action for `seat`, or null if it has nothing to do right now. */
export function botAction(state: GameState, seat: Seat): Action | null {
  const me = state.players[seat];
  if (state.phase === 'roundOver') return me.ready ? null : { type: 'ready' };

  if (state.phase === 'playing' && state.turn === seat) {
    const hand = me.hand;
    if (state.step === 'choose') {
      if (isTximTxom(hand, state.rules)) return { type: 'tximtxom' };
      const top = state.discard[state.discard.length - 1];
      if (top !== undefined) {
        const now = deadwood(state, hand);
        const withTop = bestDrop(state, [...hand, top], top).points;
        if (now - withTop >= TAKE_GAIN) return { type: 'takeDiscard' };
      }
      return { type: 'draw' };
    }

    const pool = state.step === 'drawn' ? [...hand, state.drawn!] : [...hand];
    const forbidden = state.step === 'tookDiscard' ? state.taken : null;

    for (const c of pool) {
      if (c !== forbidden && isTximTxom(without(pool, c), state.rules)) return { type: 'tximtxom', swap: c };
    }

    const end = bestEnd(state, pool, forbidden, state.mustEnd);
    if (state.mustEnd) return { type: 'endRound', card: end!.card };
    if (end && (end.full || end.points <= END_THRESHOLD)) return { type: 'endRound', card: end.card };

    const drop = bestDrop(state, pool, forbidden);
    if (state.step === 'drawn' && drop.card === state.drawn) return { type: 'discardDrawn' };
    return { type: 'swap', card: drop.card };
  }

  if (state.phase === 'reveal' && state.reveal) {
    const r = state.reveal;
    const w = r.ride;
    if (w) {
      if (!w.riders.includes(seat) || me.hand.length === 0) return null;
      if (state.rules.rideOrder === 'roundRobin' ? w.riders[w.rrIndex] !== seat : w.passed.includes(seat)) return null;
      const f = r.formations.find((x) => x.id === w.formationId)!;
      const c = rideCandidates(state, seat, f)[0];
      return c === undefined ? { type: 'pass' } : { type: 'ride', card: c };
    }
    if (r.order[r.current] === seat) {
      const f = bestPartition(me.hand, state.rules).formations[0];
      return f ? { type: 'lay', cards: f.cards } : { type: 'doneLaying' };
    }
  }
  return null;
}
