import { describe, expect, it } from 'vitest';
import {
  type Action,
  type GameState,
  applyAction,
  DEFAULT_RULES,
  newGame,
  parseCard as C,
  parseCards as P,
  type Rules,
  viewFor,
} from '../src/index.js';

// The scoring cases below are built with pairs, so Softcore is on unless a test says otherwise.
function game(n = 2, rules: Partial<Rules> = {}): GameState {
  const players = Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, isBot: false }));
  return newGame(players, { ...DEFAULT_RULES, softcore: true, ...rules }, 1234);
}

/** Rigs a fresh round: hands, draw pile (top = last) and discard pile. */
function rig(s: GameState, hands: string[], draw: string, discard: string, turn = 0): GameState {
  s.players.forEach((p, i) => (p.hand = P(hands[i])));
  s.draw = P(draw);
  s.discard = P(discard);
  s.turn = turn;
  s.dealer = turn;
  s.step = 'choose';
  return s;
}

function act(s: GameState, seat: number, a: Action): GameState {
  const r = applyAction(s, seat, a);
  if (!r.ok) throw new Error(r.error);
  return r.state;
}

function err(s: GameState, seat: number, a: Action): string {
  const r = applyAction(s, seat, a);
  if (r.ok) throw new Error('expected an error');
  return r.error;
}

describe('setup', () => {
  it('deals 7 each, flips the bottom card, dealer starts', () => {
    const s = game(4);
    expect(s.players.every((p) => p.hand.length === 7)).toBe(true);
    expect(s.discard.length).toBe(1);
    expect(s.draw.length).toBe(52 - 28 - 1);
    expect(s.turn).toBe(s.dealer);
    const all = [...s.draw, ...s.discard, ...s.players.flatMap((p) => p.hand)];
    expect(new Set(all).size).toBe(52);
  });
});

describe('turns', () => {
  const hands = ['2H 9S 9D KC QC JD 10S', '3H 4H 5H 6S 7S 8S 9C'];

  it('take discard then must swap a different card', () => {
    let s = rig(game(), hands, 'AS KD', '9H');
    s = act(s, 0, { type: 'takeDiscard' });
    expect(err(s, 0, { type: 'swap', card: C('9H') })).toMatch(/just took/);
    s = act(s, 0, { type: 'swap', card: C('KC') });
    expect(s.players[0].hand).toContain(C('9H'));
    expect(s.discard.at(-1)).toBe(C('KC'));
    expect(s.turn).toBe(1);
  });

  it('draw then keep or discard the drawn card', () => {
    let s = rig(game(), hands, '4C KD', '9H');
    s = act(s, 0, { type: 'draw' });
    expect(s.drawn).toBe(C('KD'));
    expect(viewFor(s, 1).drawn).toBeNull();
    expect(viewFor(s, 0).drawn).toBe(C('KD'));
    s = act(s, 0, { type: 'discardDrawn' });
    expect(s.discard.at(-1)).toBe(C('KD'));
    s = act(s, 1, { type: 'draw' });
    s = act(s, 1, { type: 'swap', card: C('9C') });
    expect(s.players[1].hand).toContain(C('4C'));
  });

  it('ending the round needs a 5 or lower', () => {
    let s = rig(game(), hands, '4C KD', '9H');
    s = act(s, 0, { type: 'draw' });
    expect(err(s, 0, { type: 'endRound', card: C('KD') })).toMatch(/5 or lower/);
    expect(err(s, 0, { type: 'endRound', card: C('9S') })).toMatch(/5 or lower/);
    s = act(s, 0, { type: 'endRound', card: C('2H') });
    expect(s.phase).toBe('reveal');
    expect(s.players[0].hand).toContain(C('KD'));
    expect(s.players[0].hand.length).toBe(7);
    expect(s.discard[0]).toBe(C('2H'));
    expect(s.reveal!.ridesAllowed).toBe(true);
  });

  it("can't end with the card just taken from the discard", () => {
    let s = rig(game(), hands, '4C KD', '3D');
    s = act(s, 0, { type: 'takeDiscard' });
    expect(err(s, 0, { type: 'endRound', card: C('3D') })).toMatch(/just took/);
    s = act(s, 0, { type: 'endRound', card: C('2H') });
    expect(s.phase).toBe('reveal');
  });

  it('reshuffles once, then the last card forces an end with any card', () => {
    let s = rig(game(), hands, 'KD', '9H 8D');
    s = act(s, 0, { type: 'draw' });
    s = act(s, 0, { type: 'discardDrawn' });
    expect(s.reshuffled).toBe(true);
    expect([...s.draw].sort()).toEqual(P('9H 8D').sort());
    expect(s.discard).toEqual(P('KD'));
    s.draw = P('9H 8D');
    s = act(s, 1, { type: 'draw' }); // 8D
    s = act(s, 1, { type: 'discardDrawn' });
    s = act(s, 0, { type: 'draw' }); // 9H, the last one
    expect(s.mustEnd).toBe(true);
    expect(err(s, 0, { type: 'discardDrawn' })).toMatch(/must end/);
    s = act(s, 0, { type: 'endRound', card: C('KC') });
    expect(s.reveal!.endKind).toBe('pileOut');
    expect(s.reveal!.ridesAllowed).toBe(false);
  });
});

describe('scoring', () => {
  it('-10 for a full hand ended with a 5 or lower; no rides', () => {
    let s = rig(game(), ['7H 7S 2D 3D 4D KC KH', 'QH QS 9D 9C 6H 6S 10C'], '5C', '8H');
    s = act(s, 0, { type: 'draw' });
    s = act(s, 0, { type: 'endRound', card: C('5C') });
    expect(s.reveal!.bonus).toBe(true);
    expect(s.reveal!.ridesAllowed).toBe(false);
    expect(s.reveal!.order[s.reveal!.current]).toBe(1);
    s = act(s, 1, { type: 'lay', cards: P('QH QS') });
    expect(s.reveal!.ride).toBeNull();
    s = act(s, 1, { type: 'doneLaying' });
    expect(s.phase).toBe('roundOver');
    expect(s.results[0].points).toEqual([-10, 9 + 9 + 6 + 6 + 10]);
  });

  it('a pile-out with a full hand and a 5 or lower also earns -10', () => {
    let s = rig(game(), ['7H 7S 2D 3D 4D KC KH', 'QH QS 9D 9C 6H 6S 10C'], '5C', '8H');
    s.reshuffled = true;
    s = act(s, 0, { type: 'draw' });
    expect(s.mustEnd).toBe(true);
    s = act(s, 0, { type: 'endRound', card: C('5C') });
    expect(s.reveal!.bonus).toBe(true);
    expect(s.reveal!.endKind).toBe('pileOut');
  });

  it('a pile-out ended with a high card: no bonus even if formed', () => {
    let s = rig(game(), ['7H 7S 2D 3D 4D KC KH', 'QH QS 9D 9C 6H 6S 10C'], 'JC', '8H');
    s.reshuffled = true;
    s = act(s, 0, { type: 'draw' });
    s = act(s, 0, { type: 'endRound', card: C('JC') });
    expect(s.reveal!.bonus).toBe(false);
    s = act(s, 0, { type: 'lay', cards: P('7H 7S') });
    s = act(s, 0, { type: 'lay', cards: P('2D 3D 4D') });
    s = act(s, 0, { type: 'lay', cards: P('KC KH') });
    s = act(s, 1, { type: 'doneLaying' });
    expect(s.results[0].points[0]).toBe(0);
  });

  it('take a ride: one card per player on sets, many on straights', () => {
    let s = rig(game(3), ['2H 7H 7S 4D 5D 6D KC', '7D 7C 3D AD 9D JS 10D', 'QH 2D 8H 9H AS AC 10S'], '5C', 'KD');
    s = act(s, 0, { type: 'draw' });
    s = act(s, 0, { type: 'endRound', card: C('5C') });
    s = act(s, 0, { type: 'lay', cards: P('7H 7S') });
    expect(s.reveal!.ride).not.toBeNull();
    s = act(s, 1, { type: 'ride', card: C('7D') });
    expect(err(s, 1, { type: 'ride', card: C('7C') })).toMatch(/one card per player/);
    s = act(s, 1, { type: 'pass' });
    s = act(s, 2, { type: 'pass' });
    expect(s.reveal!.ride).toBeNull();
    s = act(s, 0, { type: 'lay', cards: P('4D 5D 6D') });
    s = act(s, 1, { type: 'ride', card: C('3D') });
    s = act(s, 2, { type: 'ride', card: C('2D') });
    s = act(s, 1, { type: 'ride', card: C('AD') });
    expect(s.reveal!.formations[1].cards).toEqual(P('AD 2D 3D 4D 5D 6D'));
    s = act(s, 1, { type: 'pass' });
    s = act(s, 2, { type: 'pass' });
    s = act(s, 0, { type: 'doneLaying' });
    expect(s.reveal!.order[s.reveal!.current]).toBe(1);
  });

  it('double down and +10 when the ender is not strictly lowest', () => {
    let s = rig(game(2, { doubleDown: true, penalty10: true }), ['AH 9S 9D KC QC JD 10S', 'AS 2C 3H 4S 5C 6H 8C'], '4C', '8H');
    s = act(s, 0, { type: 'draw' });
    s = act(s, 0, { type: 'endRound', card: C('4C') });
    s = act(s, 0, { type: 'lay', cards: P('9S 9D') });
    s = act(s, 1, { type: 'pass' });
    s = act(s, 0, { type: 'doneLaying' });
    s = act(s, 1, { type: 'doneLaying' });
    const pts = 1 + 13 + 12 + 11 + 10;
    expect(s.results[0].points).toEqual([pts * 2 + 10, 1 + 2 + 3 + 4 + 5 + 6 + 8]);
    expect(s.phase).toBe('gameOver');
  });

  it('TximTxom wins the game instantly', () => {
    let s = rig(game(), ['AS 2S 3S 4S 5S 6S 9H', 'QH QS 9D 9C 6H 6D 10C'], '7S', '8H');
    expect(err(s, 0, { type: 'tximtxom' })).toMatch(/Not a TximTxom/);
    s = act(s, 0, { type: 'draw' });
    s = act(s, 0, { type: 'tximtxom', swap: C('9H') });
    expect(s.phase).toBe('gameOver');
    expect(s.winners).toEqual([0]);
  });

  it('next round rotates the dealer', () => {
    let s = rig(game(), ['AH 2S 3D 4C 5H 6S 7D', 'AS 2C 3H 4S 5C 6H 8C'], '3C', '8H');
    s = act(s, 0, { type: 'draw' });
    s = act(s, 0, { type: 'endRound', card: C('3C') });
    s = act(s, 0, { type: 'doneLaying' });
    s = act(s, 1, { type: 'doneLaying' });
    expect(s.phase).toBe('roundOver');
    s = act(s, 0, { type: 'ready' });
    s = act(s, 1, { type: 'ready' });
    expect(s.round).toBe(2);
    expect(s.dealer).toBe(1);
    expect(s.turn).toBe(1);
  });
});
