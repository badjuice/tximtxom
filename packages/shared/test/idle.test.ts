import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDLE_REASON, ROOM_IDLE_MS, RoomServer, type RoomSnapshot } from '../src/index.js';

const MIN = 60 * 1000;

function setup() {
  const closed: [string, string][] = [];
  const roomsClosed: string[] = [];
  const server = new RoomServer({
    send: () => {},
    closed: (clientId, reason) => closed.push([clientId, reason]),
    roomClosed: (code) => roomsClosed.push(code),
  });
  const res = server.handle('human', { event: 'room:create', msg: { name: 'Nox' } }) as { ok: true; code: string };
  return { server, code: res.code, closed, roomsClosed };
}

describe('idle rooms', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('closes a game of bots after 10 minutes, even though the bots keep playing', () => {
    const { server, code, closed, roomsClosed } = setup();
    server.handle('human', { event: 'room:addBot' });
    server.handle('human', { event: 'room:addBot' });
    server.handle('human', { event: 'room:start' });
    server.disconnect('human');
    const room = server.rooms.get(code)!;
    const before = JSON.stringify(room.game);

    vi.advanceTimersByTime(ROOM_IDLE_MS - MIN);
    expect(JSON.stringify(room.game)).not.toBe(before); // bots moved
    expect(server.rooms.has(code)).toBe(true);

    vi.advanceTimersByTime(MIN);
    expect(server.rooms.has(code)).toBe(false);
    expect(roomsClosed).toEqual([code]);
    expect(closed).toEqual([]); // nobody was connected to tell
  });

  it('sends connected humans away with the idle reason', () => {
    const { server, code, closed } = setup();
    server.handle('guest', { event: 'room:join', msg: { code, name: 'Ana' } });
    vi.advanceTimersByTime(ROOM_IDLE_MS);
    expect(closed.map(([id]) => id).sort()).toEqual(['guest', 'human']);
    expect(closed.every(([, reason]) => reason === IDLE_REASON)).toBe(true);
    expect(server.handle('human', { event: 'room:ping' }).ok).toBe(false);
  });

  it('a ping keeps the room open for another 10 minutes', () => {
    const { server, code } = setup();
    vi.advanceTimersByTime(9 * MIN);
    expect(server.handle('human', { event: 'room:ping' }).ok).toBe(true);
    vi.advanceTimersByTime(9 * MIN);
    expect(server.rooms.has(code)).toBe(true);
    vi.advanceTimersByTime(MIN);
    expect(server.rooms.has(code)).toBe(false);
  });

  it('does not restore a stale saved room', () => {
    const { server, code } = setup();
    const snap: RoomSnapshot = server.rooms.get(code)!.snapshot();
    const other = new RoomServer({ send: () => {}, closed: () => {} });
    expect(other.restore({ ...snap, lastHumanActivity: Date.now() - ROOM_IDLE_MS - 1 })).toBeNull();
    expect(other.restore({ ...snap, lastHumanActivity: undefined })).toBeNull();
    expect(other.restore(snap)).not.toBeNull();
  });
});
