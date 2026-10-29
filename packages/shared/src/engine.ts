import { type Card, canEndWith, fullDeck, handPoints, rankOf } from './cards.js';
import { bestPartition, canRide, classifyFormation, isFullyFormed, isTximTxom } from './formations.js';
import { shuffle } from './rng.js';
import { FULL_HAND_BONUS, HAND_SIZE, MAX_PLAYERS, MIN_PLAYERS, PENALTY_POINTS, type Rules } from './rules.js';
import type {
  Action,
  ActionResult,
  EndKind,
  Formation,
  GameEvent,
  GameState,
  PlayerState,
  RevealState,
  RideWindow,
  Seat,
} from './types.js';

/** The whole game's move log is kept (bounded) so players can read the history. */
const MAX_EVENTS = 5000;

export interface NewPlayer {
  id: string;
  name: string;
  isBot: boolean;
  avatar?: string;
}

/**
 * Creates a game: cuts for the first dealer (lowest card deals, ties redraw
 * from the remaining cards) and deals the first round.
 * Seat order is turn order: seat i+1 plays after seat i.
 */
export function newGame(players: NewPlayer[], rules: Rules, seed: number): GameState {
  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    throw new Error(`TximTxom needs ${MIN_PLAYERS}-${MAX_PLAYERS} players`);
  }
  const state: GameState = {
    rules,
    players: players.map<PlayerState>((p) => ({
      id: p.id,
      name: p.name,
      isBot: p.isBot,
      avatar: p.avatar ?? '',
      botControlled: false,
      hand: [],
      total: 0,
      ready: false,
    })),
    phase: 'playing',
    round: 0,
    dealer: 0,
    turn: 0,
    step: 'choose',
    draw: [],
    discard: [],
    reshuffled: false,
    mustEnd: false,
    drawn: null,
    taken: null,
    reveal: null,
    results: [],
    winners: [],
    nextFormationId: 1,
    events: [],
    nextEventId: 1,
    rng: seed | 0,
  };
  cutForDealer(state);
  startRound(state);
  return state;
}

function cutForDealer(state: GameState): void {
  const deck = shuffle(state, fullDeck());
  const draws: { seat: Seat; card: Card }[][] = [];
  let contenders = state.players.map((_, i) => i);
  while (contenders.length > 1 && deck.length >= contenders.length) {
    const round = contenders.map((seat) => ({ seat, card: deck.pop()! }));
    draws.push(round);
    const low = Math.min(...round.map((d) => rankOf(d.card)));
    contenders = round.filter((d) => rankOf(d.card) === low).map((d) => d.seat);
  }
  state.dealer = contenders[0];
  emit(state, { t: 'cut', draws, dealer: state.dealer });
}

export function nextSeat(state: GameState, seat: Seat): Seat {
  return (seat + 1) % state.players.length;
}

function startRound(state: GameState): void {
  state.round += 1;
  const deck = shuffle(state, fullDeck());
  for (const p of state.players) {
    p.hand = [];
    p.ready = false;
  }
  // Deal one at a time, starting with the player after the dealer.
  let seat = nextSeat(state, state.dealer);
  for (let i = 0; i < HAND_SIZE * state.players.length; i++) {
    state.players[seat].hand.push(deck.pop()!);
    seat = nextSeat(state, seat);
  }
  // The bottom card of the draw pile starts the discard pile.
  state.discard = [deck.shift()!];
  state.draw = deck;
  state.reshuffled = false;
  state.mustEnd = false;
  state.drawn = null;
  state.taken = null;
  state.reveal = null;
  state.step = 'choose';
  state.phase = 'playing';
  state.turn = state.dealer;
  emit(state, { t: 'deal', round: state.round, dealer: state.dealer });
}

function emit(state: GameState, e: GameEvent): void {
  state.events.push({ id: state.nextEventId++, e });
  if (state.events.length > MAX_EVENTS) state.events.splice(0, state.events.length - MAX_EVENTS);
}

function fail(error: string): ActionResult {
  return { ok: false, error };
}

function removeCard(hand: Card[], card: Card): void {
  const i = hand.indexOf(card);
  if (i < 0) throw new Error('card not in hand');
  hand.splice(i, 1);
}

/** Applies an action for a seat. Never mutates the input state. */
export function applyAction(input: GameState, seat: Seat, action: Action): ActionResult {
  if (seat < 0 || seat >= input.players.length) return fail('Unknown seat');
  const state = structuredClone(input);
  const err = reduce(state, seat, action);
  return err ? fail(err) : { ok: true, state };
}

function reduce(state: GameState, seat: Seat, action: Action): string | null {
  switch (action.type) {
    case 'draw':
    case 'takeDiscard':
    case 'discardDrawn':
    case 'swap':
    case 'endRound':
    case 'tximtxom':
      if (state.phase !== 'playing') return 'Not in play';
      if (seat !== state.turn) return 'Not your turn';
      return turnAction(state, seat, action);
    case 'lay':
    case 'doneLaying':
    case 'ride':
    case 'pass':
      if (state.phase !== 'reveal' || !state.reveal) return 'Not revealing';
      return revealAction(state, state.reveal, seat, action);
    case 'ready':
      if (state.phase !== 'roundOver') return 'Round is not over';
      state.players[seat].ready = true;
      if (state.players.every((p) => p.ready)) {
        state.dealer = nextSeat(state, state.dealer);
        startRound(state);
      }
      return null;
    default:
      return 'Unknown action';
  }
}

// ------------------------------------------------------------------ turns

function turnAction(state: GameState, seat: Seat, action: Action): string | null {
  const player = state.players[seat];
  const hand = player.hand;
  switch (action.type) {
    case 'draw': {
      if (state.step !== 'choose') return 'You already picked a card';
      if (state.draw.length === 0) return 'The draw pile is empty';
      state.drawn = state.draw.pop()!;
      state.step = 'drawn';
      if (state.draw.length === 0 && state.reshuffled) state.mustEnd = true;
      emit(state, { t: 'draw', seat });
      return null;
    }
    case 'takeDiscard': {
      if (state.step !== 'choose') return 'You already picked a card';
      if (state.discard.length === 0) return 'The discard pile is empty';
      const card = state.discard.pop()!;
      hand.push(card);
      state.taken = card;
      state.step = 'tookDiscard';
      emit(state, { t: 'take', seat, card });
      return null;
    }
    case 'discardDrawn': {
      if (state.step !== 'drawn') return 'You have no drawn card';
      if (state.mustEnd) return 'The draw pile is gone: you must end the round';
      const card = state.drawn!;
      state.discard.push(card);
      emit(state, { t: 'discard', seat, card, fromDraw: true });
      finishTurn(state);
      return null;
    }
    case 'swap': {
      const card = action.card;
      if (!hand.includes(card)) return 'That card is not in your hand';
      if (state.step === 'drawn') {
        if (state.mustEnd) return 'The draw pile is gone: you must end the round';
        hand[hand.indexOf(card)] = state.drawn!;
      } else if (state.step === 'tookDiscard') {
        if (card === state.taken) return "You can't discard the card you just took";
        removeCard(hand, card);
      } else {
        return 'Pick a card first';
      }
      state.discard.push(card);
      emit(state, { t: 'discard', seat, card, fromDraw: false });
      finishTurn(state);
      return null;
    }
    case 'endRound': {
      const card = action.card;
      if (state.step === 'choose') return 'Pick a card first';
      const fromHand = hand.includes(card);
      if (state.step === 'drawn') {
        if (card !== state.drawn && !fromHand) return 'That card is not yours';
        if (!state.mustEnd && !canEndWith(card)) return 'You can only end the round with a 5 or lower';
        if (fromHand) hand[hand.indexOf(card)] = state.drawn!;
      } else {
        if (!fromHand) return 'That card is not in your hand';
        if (card === state.taken) return "You can't end the round with the card you just took";
        if (!canEndWith(card)) return 'You can only end the round with a 5 or lower';
        removeCard(hand, card);
      }
      // The ending card is shown and slid under the discard pile.
      state.discard.unshift(card);
      const kind: EndKind = state.mustEnd ? 'pileOut' : 'manual';
      state.drawn = null;
      state.taken = null;
      state.mustEnd = false;
      startReveal(state, kind, seat, card);
      return null;
    }
    case 'tximtxom': {
      let candidate = [...hand];
      if (state.step === 'drawn') candidate.push(state.drawn!);
      if (candidate.length > HAND_SIZE) {
        if (action.swap === undefined || !candidate.includes(action.swap)) return 'Choose a card to let go first';
        if (action.swap === state.taken) return "You can't let go of the card you just took";
        candidate = candidate.filter((c) => c !== action.swap);
      }
      if (!isTximTxom(candidate, state.rules)) return 'Not a TximTxom!';
      player.hand = candidate;
      state.drawn = null;
      state.taken = null;
      state.phase = 'gameOver';
      state.winners = [seat];
      emit(state, { t: 'tximtxom', seat });
      emit(state, { t: 'gameOver', winners: [seat] });
      return null;
    }
  }
  return 'Unknown action';
}

function finishTurn(state: GameState): void {
  state.drawn = null;
  state.taken = null;
  state.step = 'choose';
  if (state.draw.length === 0) {
    if (state.reshuffled) {
      // Can't normally happen: drawing the last card of the second pile forces an end.
      startReveal(state, 'exhausted', null, null);
      return;
    }
    // First time the draw pile runs out: everything but the top discard is reshuffled, once.
    const top = state.discard.pop()!;
    state.draw = shuffle(state, state.discard);
    state.discard = [top];
    state.reshuffled = true;
    emit(state, { t: 'reshuffle', count: state.draw.length });
    if (state.draw.length === 0) {
      startReveal(state, 'exhausted', null, null);
      return;
    }
  }
  state.turn = nextSeat(state, state.turn);
}

// ------------------------------------------------------------------ reveal

function startReveal(state: GameState, endKind: EndKind, ender: Seat | null, endCard: Card | null): void {
  const first = ender ?? state.turn;
  const order: Seat[] = [];
  for (let i = 0, s = first; i < state.players.length; i++, s = nextSeat(state, s)) order.push(s);

  const bonus = ender !== null && endCard !== null && canEndWith(endCard) && isFullyFormed(state.players[ender].hand, state.rules);
  const reveal: RevealState = {
    endKind,
    ender,
    endCard,
    bonus,
    ridesAllowed: endKind === 'manual' && !bonus,
    order,
    current: 0,
    formations: [],
    ride: null,
  };
  state.phase = 'reveal';
  state.reveal = reveal;
  state.step = 'choose';
  emit(state, { t: 'end', seat: ender, card: endCard, kind: endKind, bonus });

  if (bonus) {
    // A full hand is shown all at once; nobody may ride on it.
    const owner = ender!;
    for (const f of bestPartition(state.players[owner].hand, state.rules).formations) {
      addFormation(state, reveal, owner, f.cards);
    }
  }
  advanceReveal(state, reveal);
}

function addFormation(state: GameState, reveal: RevealState, owner: Seat, cards: Card[]): Formation {
  const info = classifyFormation(cards, state.rules)!;
  const hand = state.players[owner].hand;
  for (const c of cards) removeCard(hand, c);
  const f: Formation = { id: state.nextFormationId++, owner, kind: info.kind, cards: info.cards, rides: [] };
  reveal.formations.push(f);
  emit(state, { t: 'lay', seat: owner, formationId: f.id, kind: f.kind, cards: [...f.cards] });
  return f;
}

/** Moves past players with nothing left to lay, and scores when everyone is done. */
function advanceReveal(state: GameState, reveal: RevealState): void {
  if (reveal.ride) return;
  while (reveal.current < reveal.order.length && state.players[reveal.order[reveal.current]].hand.length === 0) {
    reveal.current++;
  }
  if (reveal.current >= reveal.order.length) scoreRound(state, reveal);
}

function revealAction(state: GameState, reveal: RevealState, seat: Seat, action: Action): string | null {
  const hand = state.players[seat].hand;
  switch (action.type) {
    case 'lay': {
      if (reveal.ride) return 'Wait for the ride to finish';
      if (reveal.order[reveal.current] !== seat) return 'Not your turn to reveal';
      const cards = action.cards;
      if (new Set(cards).size !== cards.length || !cards.every((c) => hand.includes(c))) return 'Those cards are not in your hand';
      if (!classifyFormation(cards, state.rules)) return 'That is not a valid formation';
      const f = addFormation(state, reveal, seat, cards);
      if (reveal.ridesAllowed) openRide(state, reveal, f);
      advanceReveal(state, reveal);
      return null;
    }
    case 'doneLaying': {
      if (reveal.ride) return 'Wait for the ride to finish';
      if (reveal.order[reveal.current] !== seat) return 'Not your turn to reveal';
      emit(state, { t: 'doneLaying', seat });
      reveal.current++;
      advanceReveal(state, reveal);
      return null;
    }
    case 'ride': {
      const w = reveal.ride;
      if (!w) return 'Nothing to ride on';
      if (!w.riders.includes(seat)) return "You can't ride on this one";
      if (state.rules.rideOrder === 'roundRobin' && w.riders[w.rrIndex] !== seat) return 'Wait for your go';
      if (!hand.includes(action.card)) return 'That card is not in your hand';
      const f = reveal.formations.find((x) => x.id === w.formationId)!;
      const err = rideError(state, f, seat, action.card);
      if (err) return err;
      const after = canRide(f.cards, action.card, state.rules)!;
      removeCard(hand, action.card);
      f.cards = after.cards;
      f.kind = after.kind;
      f.rides.push({ seat, card: action.card });
      w.passed = [];
      w.rrPasses = 0;
      emit(state, { t: 'ride', seat, formationId: f.id, card: action.card });
      if (state.rules.rideOrder === 'roundRobin' && hand.length === 0) advanceRoundRobin(state, w);
      maybeCloseRide(state, reveal);
      return null;
    }
    case 'pass': {
      const w = reveal.ride;
      if (!w) return 'Nothing to pass on';
      if (!w.riders.includes(seat)) return 'Not riding';
      if (state.rules.rideOrder === 'roundRobin') {
        if (w.riders[w.rrIndex] !== seat) return 'Wait for your go';
        w.rrPasses++;
        advanceRoundRobin(state, w);
      } else if (!w.passed.includes(seat)) {
        w.passed.push(seat);
      }
      emit(state, { t: 'pass', seat });
      maybeCloseRide(state, reveal);
      return null;
    }
  }
  return 'Unknown action';
}

/** Why `seat` can't add `card` to formation `f` (null = allowed). */
export function rideError(state: GameState, f: Formation, seat: Seat, card: Card): string | null {
  if (f.owner === seat) return "You can't ride on your own formation";
  if (f.kind !== 'straight' && f.rides.some((r) => r.seat === seat)) {
    return 'Only one card per player on a pair or trio';
  }
  if (!canRide(f.cards, card, state.rules)) return "That card doesn't fit";
  return null;
}

function activeRiders(state: GameState, w: RideWindow): Seat[] {
  return w.riders.filter((s) => state.players[s].hand.length > 0);
}

function openRide(state: GameState, reveal: RevealState, f: Formation): void {
  const riders = reveal.order.filter((s) => s !== f.owner && state.players[s].hand.length > 0);
  if (riders.length === 0) return;
  const w: RideWindow = { formationId: f.id, riders, passed: [], rrIndex: 0, rrPasses: 0 };
  reveal.ride = w;
  if (state.rules.autoRide) {
    autoRide(state, reveal, f);
    reveal.ride = null;
  }
}

function advanceRoundRobin(state: GameState, w: RideWindow): void {
  if (activeRiders(state, w).length === 0) return;
  do {
    w.rrIndex = (w.rrIndex + 1) % w.riders.length;
  } while (state.players[w.riders[w.rrIndex]].hand.length === 0);
}

function maybeCloseRide(state: GameState, reveal: RevealState): void {
  const w = reveal.ride!;
  const active = activeRiders(state, w);
  const closed =
    state.rules.rideOrder === 'roundRobin'
      ? active.length === 0 || w.rrPasses >= active.length
      : active.every((s) => w.passed.includes(s));
  if (closed) {
    reveal.ride = null;
    advanceReveal(state, reveal);
  }
}

/**
 * Cards `seat` would sensibly ride with: anything that fits, except cards it
 * still needs for its own formations (if it hasn't revealed yet).
 */
export function rideCandidates(state: GameState, seat: Seat, f: Formation): Card[] {
  const reveal = state.reveal!;
  const hand = state.players[seat].hand;
  const stillToReveal = reveal.order.indexOf(seat) >= reveal.current;
  const keep = new Set<Card>();
  if (stillToReveal) {
    for (const g of bestPartition(hand, state.rules).formations) for (const c of g.cards) keep.add(c);
  }
  return hand.filter((c) => !keep.has(c) && rideError(state, f, seat, c) === null);
}

function autoRide(state: GameState, reveal: RevealState, f: Formation): void {
  let changed = true;
  while (changed) {
    changed = false;
    for (const seat of reveal.ride!.riders) {
      const c = rideCandidates(state, seat, f)[0];
      if (c === undefined) continue;
      const after = canRide(f.cards, c, state.rules)!;
      removeCard(state.players[seat].hand, c);
      f.cards = after.cards;
      f.kind = after.kind;
      f.rides.push({ seat, card: c });
      emit(state, { t: 'ride', seat, formationId: f.id, card: c });
      changed = true;
    }
  }
}

// ------------------------------------------------------------------ scoring

function scoreRound(state: GameState, reveal: RevealState): void {
  const n = state.players.length;
  const leftovers = state.players.map((p) => [...p.hand]);
  const points = leftovers.map((h) => handPoints(h));
  const penalties: { seat: Seat; doubled: boolean; plus10: boolean }[] = [];
  const ender = reveal.ender;

  if (ender !== null && reveal.bonus) points[ender] = FULL_HAND_BONUS;

  if (ender !== null && reveal.endKind === 'manual' && (state.rules.doubleDown || state.rules.penalty10)) {
    const others = points.filter((_, i) => i !== ender);
    const strictlyLowest = others.every((p) => points[ender] < p);
    // An ender with nothing in hand (0 points) is pardoned: tying at 0 is no reason for a fine.
    const pardoned = points[ender] === 0;
    if (!strictlyLowest && !pardoned) {
      if (state.rules.doubleDown) points[ender] *= 2;
      if (state.rules.penalty10) points[ender] += PENALTY_POINTS;
      penalties.push({ seat: ender, doubled: state.rules.doubleDown, plus10: state.rules.penalty10 });
    }
  }

  for (let i = 0; i < n; i++) state.players[i].total += points[i];
  const totals = state.players.map((p) => p.total);
  state.results.push({
    round: state.round,
    endKind: reveal.endKind,
    ender,
    endCard: reveal.endCard,
    bonus: reveal.bonus,
    leftovers,
    points,
    penalties,
    totals,
  });
  emit(state, { t: 'score', round: state.round });

  if (totals.some((t) => t > state.rules.threshold)) {
    const low = Math.min(...totals);
    state.winners = totals.flatMap((t, i) => (t === low ? [i] : []));
    state.phase = 'gameOver';
    emit(state, { t: 'gameOver', winners: state.winners });
  } else {
    state.phase = 'roundOver';
    for (const p of state.players) p.ready = false;
  }
}
