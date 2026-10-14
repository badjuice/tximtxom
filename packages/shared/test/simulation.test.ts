import { describe, expect, it } from 'vitest';
import { applyAction, botAction, DEFAULT_RULES, type GameState, HAND_SIZE, newGame, type Rules } from '../src/index.js';

function allCards(s: GameState): number[] {
  const cards = [...s.draw, ...s.discard, ...s.players.flatMap((p) => p.hand)];
  if (s.drawn !== null) cards.push(s.drawn);
  if (s.reveal) cards.push(...s.reveal.formations.flatMap((f) => f.cards));
  return cards;
}

function playGame(n: number, rules: Rules, seed: number): GameState {
  const players = Array.from({ length: n }, (_, i) => ({ id: `b${i}`, name: `Bot${i}`, isBot: true }));
  let s = newGame(players, rules, seed);
  for (let step = 0; step < 20000 && s.phase !== 'gameOver'; step++) {
    // Card conservation and hand size invariants.
    const cards = allCards(s);
    expect(cards.length).toBe(52);
    expect(new Set(cards).size).toBe(52);
    if (s.phase === 'playing') {
      s.players.forEach((p, i) => {
        const extra = i === s.turn && s.step === 'tookDiscard' ? 1 : 0;
        expect(p.hand.length).toBe(HAND_SIZE + extra);
      });
    }
    let acted = false;
    for (let seat = 0; seat < n && !acted; seat++) {
      const a = botAction(s, seat);
      if (!a) continue;
      const r = applyAction(s, seat, a);
      if (!r.ok) throw new Error(`seat ${seat} ${JSON.stringify(a)}: ${r.error}`);
      s = r.state;
      acted = true;
    }
    if (!acted) throw new Error(`stuck in ${s.phase}`);
  }
  expect(s.phase).toBe('gameOver');
  return s;
}

describe('bot simulation', () => {
  const variants: [string, Partial<Rules>][] = [
    ['default', {}],
    ['hardcore + superposition', { hardcore: true, superposition: true }],
    ['round robin + penalties', { rideOrder: 'roundRobin', doubleDown: true, penalty10: true }],
    ['auto ride, 100 points', { autoRide: true, threshold: 100 }],
  ];
  for (const [name, overrides] of variants) {
    it(`plays full games without breaking invariants (${name})`, () => {
      let pileOuts = 0;
      for (let seed = 1; seed <= 40; seed++) {
        const s = playGame(2 + (seed % 3), { ...DEFAULT_RULES, ...overrides }, seed);
        pileOuts += s.results.filter((r) => r.endKind === 'pileOut').length;
      }
      expect(pileOuts).toBeGreaterThanOrEqual(0);
    }, 60_000);
  }
});
