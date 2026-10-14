import type { Card } from './cards.js';
import { anyFormationPossible } from './formations.js';
import type { Rules } from './rules.js';
import type { GameEvent, GameState, Phase, RevealState, RoundResult, Seat, TurnStep } from './types.js';

/** How many recent events travel with every update. */
export const RECENT_EVENTS = 80;

export interface PlayerView {
  id: string;
  name: string;
  isBot: boolean;
  botControlled: boolean;
  total: number;
  ready: boolean;
  handCount: number;
  /** Only your own hand, or everyone's leftovers once the round is scored. */
  hand: Card[] | null;
}

/** What one player is allowed to know. */
export interface GameView {
  you: Seat | null;
  rules: Rules;
  phase: Phase;
  round: number;
  dealer: Seat;
  turn: Seat;
  step: TurnStep;
  drawCount: number;
  discardTop: Card | null;
  discardCount: number;
  reshuffled: boolean;
  mustEnd: boolean;
  /** The card you drew (only visible to you). */
  drawn: Card | null;
  taken: Card | null;
  players: PlayerView[];
  reveal: RevealState | null;
  results: RoundResult[];
  winners: Seat[];
  /** "No more formations possible" notice, only for the player revealing, only if the rule is on. */
  noMoreFormations: boolean;
  /** The most recent events (the full log is fetched with game:history). */
  events: { id: number; e: GameEvent }[];
}

export function viewFor(state: GameState, you: Seat | null): GameView {
  const showAll = state.phase === 'roundOver' || state.phase === 'gameOver';
  const myTurn = you !== null && state.turn === you && state.phase === 'playing';
  const reveal = state.reveal;
  const revealing = reveal && you !== null && reveal.order[reveal.current] === you && !reveal.ride;
  return {
    you,
    rules: state.rules,
    phase: state.phase,
    round: state.round,
    dealer: state.dealer,
    turn: state.turn,
    step: state.step,
    drawCount: state.draw.length,
    discardTop: state.discard.length ? state.discard[state.discard.length - 1] : null,
    discardCount: state.discard.length,
    reshuffled: state.reshuffled,
    mustEnd: myTurn ? state.mustEnd : false,
    drawn: myTurn ? state.drawn : null,
    taken: state.taken,
    players: state.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      isBot: p.isBot,
      botControlled: p.botControlled,
      total: p.total,
      ready: p.ready,
      handCount: p.hand.length,
      hand: showAll || i === you ? [...p.hand] : null,
    })),
    reveal: reveal ? structuredClone(reveal) : null,
    results: state.results,
    winners: state.winners,
    noMoreFormations:
      !!revealing && state.rules.noMoreFormationsNotice && !anyFormationPossible(state.players[you!].hand, state.rules),
    events: state.events.slice(-RECENT_EVENTS),
  };
}
