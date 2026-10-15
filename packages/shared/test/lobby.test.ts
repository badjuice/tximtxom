import { describe, expect, it } from 'vitest';
import { BOT_PERSONAS, RoomServer } from '../src/index.js';

function setup() {
  const server = new RoomServer({ send: () => {}, closed: () => {} });
  const { code } = server.handle('host', { event: 'room:create', msg: { name: 'Nox' } }) as { ok: true; code: string };
  server.handle('guest', { event: 'room:join', msg: { code, name: 'Ana' } });
  server.handle('host', { event: 'room:addBot' });
  const room = server.rooms.get(code)!;
  const [host, guest, bot] = room.members;
  return { server, room, host, guest, bot };
}

describe('lobby art and names', () => {
  it('gives humans Joker art too, never shared', () => {
    const { room } = setup();
    const arts = room.members.map((m) => m.avatar);
    expect(arts.every(Boolean)).toBe(true);
    expect(new Set(arts).size).toBe(arts.length);
  });

  it('cycles through free Jokers only; bots take the Joker name', () => {
    const { server, room, bot } = setup();
    server.handle('host', { event: 'room:addBot' });
    for (let i = 0; i < BOT_PERSONAS.length * 2; i++) {
      expect(server.handle('host', { event: 'room:avatar', msg: { playerId: bot.id } }).ok).toBe(true);
      const arts = room.members.map((m) => m.avatar);
      expect(new Set(arts).size).toBe(arts.length);
      expect(bot.name).toBe(BOT_PERSONAS.find((p) => p.avatar === bot.avatar)!.name);
      const names = room.members.filter((m) => m.isBot).map((m) => m.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('players rename and re-art themselves; only the host edits bots', () => {
    const { server, host, guest, bot } = setup();
    expect(server.handle('guest', { event: 'room:rename', msg: { playerId: guest.id, name: 'Ana B' } }).ok).toBe(true);
    expect(guest.name).toBe('Ana B');
    expect(server.handle('guest', { event: 'room:rename', msg: { playerId: host.id, name: 'x' } }).ok).toBe(false);
    expect(server.handle('guest', { event: 'room:rename', msg: { playerId: bot.id, name: 'x' } }).ok).toBe(false);
    expect(server.handle('guest', { event: 'room:avatar', msg: { playerId: bot.id } }).ok).toBe(false);
    const art = guest.avatar;
    expect(server.handle('guest', { event: 'room:avatar', msg: { playerId: guest.id } }).ok).toBe(true);
    expect(guest.avatar).not.toBe(art);
    expect(server.handle('host', { event: 'room:rename', msg: { playerId: bot.id, name: 'Bob' } }).ok).toBe(true);
    expect(bot.name).toBe('Bob');
  });

  it('locks names and art once the game starts', () => {
    const { server, guest } = setup();
    server.handle('host', { event: 'room:start' });
    expect(server.handle('guest', { event: 'room:rename', msg: { playerId: guest.id, name: 'x' } }).ok).toBe(false);
    expect(server.handle('guest', { event: 'room:avatar', msg: { playerId: guest.id } }).ok).toBe(false);
  });
});
