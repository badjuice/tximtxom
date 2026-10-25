import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomServer } from '../src/index.js';

describe('turn timer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('only draws and discards for a player who runs out of time: never ends the round for them', () => {
    const server = new RoomServer({ send: () => {}, closed: () => {}, roomClosed: () => {} });
    const { code } = server.handle('a', { event: 'room:create', msg: { name: 'Nox' } }) as { ok: true; code: string };
    server.handle('b', { event: 'room:join', msg: { code, name: 'Manci' } });
    server.handle('a', { event: 'room:rules', msg: { rules: { turnTimer: 30 } } });
    server.handle('a', { event: 'room:start' });
    const room = server.rooms.get(code)!;
    // Nobody plays: every turn runs out until the draw pile does.
    // A ping now and then stands in for someone at the screen, so the idle check
    // doesn't close the room.
    for (let i = 0; i < 400 && room.game!.phase === 'playing'; i++) {
      server.handle('a', { event: 'room:ping' });
      vi.advanceTimersByTime(30_000);
    }
    const ends = room.game!.events.filter((x) => x.e.t === 'end').map((x) => x.e);
    expect(ends.length).toBeGreaterThan(0);
    for (const e of ends) expect(e.t === 'end' && e.kind).not.toBe('manual');
    expect(room.game!.events.some((x) => x.e.t === 'tximtxom')).toBe(false);
  });
});
