import type { Card } from './cards.js';
import type { FormationKind } from './formations.js';
import type { Rules } from './rules.js';

export type Seat = number;

export interface PlayerState {
  id: string;
  name: string;
  isBot: boolean;
  /** Seat is temporarily played by a bot because its human disconnected. */
  botControlled: boolean;
  hand: Card[];
  total: number;
  /** Ready for the next round (roundOver phase). */
  ready: boolean;
}

export type Phase = 'playing' | 'reveal' | 'roundOver' | 'gameOver';

/**
 * Turn steps:
 * - choose:      pick a pile (or call TximTxom)
 * - drawn:       a card was drawn from the draw pile and is in `drawn` (only the player sees it)
 * - tookDiscard: the top discard was taken into the hand (`taken`); one hand card must leave
 */
export type TurnStep = 'choose' | 'drawn' | 'tookDiscard';

export type EndKind = 'manual' | 'pileOut' | 'exhausted';

export interface Formation {
  id: number;
  owner: Seat;
  kind: FormationKind;
  cards: Card[];
  /** Who added which card (Take a Ride). */
  rides: { seat: Seat; card: Card }[];
}

export interface RideWindow {
  formationId: number;
  /** Seats that may ride on this formation. */
  riders: Seat[];
  /** Simultaneous mode: who has passed since the last card was added. */
  passed: Seat[];
  /** Round robin mode: index into riders of whose go it is. */
  rrIndex: number;
  /** Round robin mode: consecutive passes since the last card was added. */
  rrPasses: number;
}

export interface RevealState {
  endKind: EndKind;
  /** Seat that ended the round (null when the deck was exhausted with nobody to end it). */
  ender: Seat | null;
  endCard: Card | null;
  /** Ender earned the -10 full-hand bonus. */
  bonus: boolean;
  ridesAllowed: boolean;
  /** Seats in reveal order. */
  order: Seat[];
  /** Index into `order` of the player currently laying formations (order.length = finished). */
  current: number;
  formations: Formation[];
  ride: RideWindow | null;
}

export interface RoundResult {
  round: number;
  endKind: EndKind;
  ender: Seat | null;
  endCard: Card | null;
  bonus: boolean;
  /** Per seat: cards left unformed and the points scored this round. */
  leftovers: Card[][];
  points: number[];
  penalties: { seat: Seat; doubled: boolean; plus10: boolean }[];
  totals: number[];
}

export type GameEvent =
  | { t: 'cut'; draws: { seat: Seat; card: Card }[][]; dealer: Seat }
  | { t: 'deal'; round: number; dealer: Seat }
  | { t: 'draw'; seat: Seat }
  | { t: 'take'; seat: Seat; card: Card }
  | { t: 'discard'; seat: Seat; card: Card; fromDraw: boolean }
  | { t: 'reshuffle'; count: number }
  | { t: 'end'; seat: Seat | null; card: Card | null; kind: EndKind; bonus: boolean }
  | { t: 'lay'; seat: Seat; formationId: number; kind: FormationKind; cards: Card[] }
  | { t: 'ride'; seat: Seat; formationId: number; card: Card }
  | { t: 'pass'; seat: Seat }
  | { t: 'doneLaying'; seat: Seat }
  | { t: 'score'; round: number }
  | { t: 'tximtxom'; seat: Seat }
  | { t: 'gameOver'; winners: Seat[] };

export interface GameState {
  rules: Rules;
  players: PlayerState[];
  phase: Phase;
  round: number;
  dealer: Seat;
  turn: Seat;
  step: TurnStep;
  /** Top of the pile is the LAST element. */
  draw: Card[];
  /** Top of the pile is the LAST element. Only the top is in play. */
  discard: Card[];
  reshuffled: boolean;
  /** The current player drew the last card of the second draw pile and must end the round. */
  mustEnd: boolean;
  drawn: Card | null;
  taken: Card | null;
  reveal: RevealState | null;
  results: RoundResult[];
  winners: Seat[];
  nextFormationId: number;
  /** Every public event of this game, oldest first. */
  events: { id: number; e: GameEvent }[];
  nextEventId: number;
  rng: number;
}

export type Action =
  | { type: 'draw' }
  | { type: 'takeDiscard' }
  /** Put the drawn card on the discard pile. */
  | { type: 'discardDrawn' }
  /** Discard `card` from hand (the drawn card, if any, replaces it). */
  | { type: 'swap'; card: Card }
  /** End the round, sliding `card` (drawn card or hand card, rank <= 5 unless pile-out) under the discard pile. */
  | { type: 'endRound'; card: Card }
  /** Call TximTxom. `swap` = card to let go first (drawn or hand card) when holding 8. */
  | { type: 'tximtxom'; swap?: Card }
  | { type: 'lay'; cards: Card[] }
  | { type: 'doneLaying' }
  | { type: 'ride'; card: Card }
  | { type: 'pass' }
  | { type: 'ready' };

export type ActionResult = { ok: true; state: GameState } | { ok: false; error: string };
