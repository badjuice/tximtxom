// Formation achievements go by exact size: showing a quad isn't showing a trio,
// and a long straight doesn't also count as the shorter ones.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_RULES, type GameEvent, type GameView, makeCard, type RoomView } from '@tximtxom/shared';

vi.mock('../src/audio', () => ({ play: () => {} }));
vi.mock('../src/settings', () => ({ getSettings: () => ({ lang: 'en' }), onSettings: () => () => {} }));
vi.mock('../src/store', () => ({ store: { get: () => ({}), set: () => {}, subscribe: () => () => {} } }));
vi.mock('../src/chips', () => ({ ACH_PAY: new Proxy({}, { get: () => 0 }), chipsEarned: () => 0, chipsNow: () => ({ bestDailyStreak: 0 }), earn: () => {}, grantItem: () => {}, onChips: () => () => {}, payBack: () => {} }));
vi.mock('../src/shop', () => ({ ownsEverything: () => false, SOLD: [] }));
vi.mock('../src/stats', () => ({ claimPatientZero: () => {}, countInfected: () => {}, creditCarrier: () => {}, myStats: () => ({}), onStats: () => () => {} }));

const load = async () => {
  vi.resetModules();
  const m = await import('../src/achievements');
  const got = new Set<string>();
  m.onUnlock((id) => got.add(id));
  return { ...m, got };
};

const g = { you: 0, rules: DEFAULT_RULES, players: [{}, {}], events: [], results: [], round: 1, reveal: null } as unknown as GameView;
const room = { players: [], youId: 'me' } as unknown as RoomView;
const lay = (kind: string, cards: number[]) => ({ t: 'lay', seat: 0, kind, cards, formationId: 1 }) as unknown as GameEvent;
const set = (n: number) => Array.from({ length: n }, (_, i) => makeCard(9, (i % 4) as 0) + (i >= 4 ? 52 : 0));
const run = (n: number) => Array.from({ length: n }, (_, i) => makeCard(2 + i, 0));

describe('formation achievements unlock by exact size', () => {
  let a: Awaited<ReturnType<typeof load>>;
  beforeEach(async () => {
    a = await load();
  });

  it('a quad is not a trio', () => {
    a.achievementEvent(lay('quad', set(4)), g, room);
    expect(a.got.has('firstTrio')).toBe(false);
    expect(a.got.has('firstPair')).toBe(false);
  });

  it('a trio is a trio', () => {
    a.achievementEvent(lay('trio', set(3)), g, room);
    expect(a.got.has('firstTrio')).toBe(true);
  });

  it('six of a rank is not five', () => {
    a.achievementEvent(lay('sextet', set(6)), g, room);
    expect(a.got.has('sixPack')).toBe(true);
    expect(a.got.has('highFive')).toBe(false);
    expect(a.got.has('firstTrio')).toBe(false);
  });

  it('a straight of 7 is not a 3, 4 or 6', () => {
    a.achievementEvent(lay('straight', run(7)), g, room);
    expect(a.got.has('sevenUp')).toBe(true);
    for (const id of ['straight3', 'straight4', 'straight6']) expect(a.got.has(id)).toBe(false);
  });

  it('a straight of 4 is not a 3', () => {
    a.achievementEvent(lay('straight', run(4)), g, room);
    expect(a.got.has('straight4')).toBe(true);
    expect(a.got.has('straight3')).toBe(false);
  });
});
