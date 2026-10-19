import { describe, expect, it } from 'vitest';
import { BOT_PERSONAS, HUMAN_JOKERS, makeCard, RoomServer } from '../src/index.js';

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
  it('gives humans character art too, never shared', () => {
    const { room } = setup();
    const arts = room.members.map((m) => m.avatar);
    expect(arts.every(Boolean)).toBe(true);
    expect(new Set(arts).size).toBe(arts.length);
  });

  it('cycles through free characters only; bots take the character name', () => {
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

  it('humans cycle through the player characters only', () => {
    const { server, room, guest } = setup();
    for (let i = 0; i < HUMAN_JOKERS.length * 2; i++) {
      server.handle('guest', { event: 'room:avatar', msg: { playerId: guest.id } });
      expect(HUMAN_JOKERS).toContain(guest.avatar);
      const arts = room.members.map((m) => m.avatar);
      expect(new Set(arts).size).toBe(arts.length);
    }
  });

  it('gives players their last character back when it is free', () => {
    const server = new RoomServer({ send: () => {}, closed: () => {} });
    const { code } = server.handle('host', { event: 'room:create', msg: { name: 'Nox', avatar: 'crab' } }) as { ok: true; code: string };
    server.handle('a', { event: 'room:join', msg: { code, name: 'Ana', avatar: 'crab' } }); // taken: gets another
    server.handle('b', { event: 'room:join', msg: { code, name: 'Rui', avatar: 'canio' } }); // not a player character
    const [host, ana, rui] = server.rooms.get(code)!.members;
    expect(host.avatar).toBe('crab');
    expect(ana.avatar).not.toBe('crab');
    expect(HUMAN_JOKERS).toContain(ana.avatar);
    expect(HUMAN_JOKERS).toContain(rui.avatar);
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

describe('wins and play again', () => {
  it('counts wins and starts a new game with the same table', () => {
    const server = new RoomServer({ send: () => {}, closed: () => {} });
    const { code } = server.handle('host', { event: 'room:create', msg: { name: 'Nox' } }) as { ok: true; code: string };
    server.handle('host', { event: 'room:addBot' });
    server.handle('host', { event: 'room:start' });
    const room = server.rooms.get(code)!;
    expect(server.handle('host', { event: 'room:again' }).ok).toBe(false); // not over yet
    // A TximTxom hand ends the game at once.
    const g = room.game!;
    const seat = g.turn;
    const hand = [1, 2, 3, 4, 5, 6, 7].map((r) => makeCard(r, 0)); // A-7 of one suit
    const others = g.players.flatMap((p) => p.hand).filter((c) => !hand.includes(c));
    for (const p of g.players) p.hand = [];
    g.players[seat].hand = hand;
    g.players[1 - seat].hand = others.slice(0, 7);
    const member = room.members.find((m) => m.id === g.players[seat].id)!;
    const err = room.act(member, { type: 'tximtxom' });
    expect(err).toBeNull();
    expect(room.game!.phase).toBe('gameOver');
    expect(member.wins).toBe(1);
    expect(room.viewFor(room.members[0]).players.find((p) => p.id === member.id)!.wins).toBe(1);
    expect(server.handle('host', { event: 'room:again' }).ok).toBe(true);
    expect(room.game!.phase).not.toBe('gameOver');
    expect(member.wins).toBe(1);
  });
});
