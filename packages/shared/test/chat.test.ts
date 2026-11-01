import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CHAT_BURST, CHAT_KEEP, CHAT_MAX, CHAT_WINDOW_MS, EMOTE_GAP_MS, RoomServer, type RoomView } from '../src/index.js';

function setup() {
  const views = new Map<string, RoomView>();
  const server = new RoomServer({ send: (id, v) => views.set(id, v), closed: () => {} });
  const { code, token } = server.handle('a', { event: 'room:create', msg: { name: 'Nox' } }) as { ok: true; code: string; token: string };
  server.handle('b', { event: 'room:join', msg: { code, name: 'Manci' } });
  return { server, views, code, token };
}
const say = (server: RoomServer, who: string, text: string) => server.handle(who, { event: 'room:chat', msg: { text } });

describe('chat', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('reaches everyone in the room, cleaned up and cut to size', () => {
    const { server, views } = setup();
    expect(say(server, 'a', '  hello \n\t there  ').ok).toBe(true);
    expect(views.get('b')!.chat.at(-1)).toMatchObject({ from: views.get('a')!.youId, text: 'hello there', at: expect.any(Number) });
    say(server, 'b', 'x'.repeat(CHAT_MAX + 50));
    expect(views.get('a')!.chat.at(-1)!.text.length).toBe(CHAT_MAX);
    expect(say(server, 'a', ' \n ').ok).toBe(false);
  });

  it(`allows ${CHAT_BURST} messages per window, then asks to slow down`, () => {
    const { server } = setup();
    for (let i = 0; i < CHAT_BURST; i++) expect(say(server, 'a', `m${i}`).ok).toBe(true);
    expect(say(server, 'a', 'one more')).toEqual({ ok: false, error: 'Slow down a little' });
    expect(say(server, 'b', 'mine is fine').ok).toBe(true);
    vi.advanceTimersByTime(CHAT_WINDOW_MS);
    expect(say(server, 'a', 'back').ok).toBe(true);
  });

  it(`keeps the last ${CHAT_KEEP}, and a player who comes back sees them`, () => {
    const { server, views, code, token } = setup();
    for (let i = 0; i < CHAT_KEEP + 5; i++) {
      say(server, i % 2 ? 'a' : 'b', `m${i}`);
      vi.advanceTimersByTime(CHAT_WINDOW_MS / CHAT_BURST);
    }
    server.disconnect('a');
    server.handle('a2', { event: 'room:join', msg: { code, name: 'Nox', token } });
    const chat = views.get('a2')!.chat;
    expect(chat.length).toBe(CHAT_KEEP);
    expect(chat.at(-1)!.text).toBe(`m${CHAT_KEEP + 4}`);
  });
});

describe('emotes', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  const emote = (server: RoomServer, who: string, id: string) => server.handle(who, { event: 'room:emote', msg: { emote: id } });

  it('shows known emotes to everyone, one per player every EMOTE_GAP_MS', () => {
    const { server, views } = setup();
    expect(emote(server, 'a', 'heart').ok).toBe(true);
    expect(views.get('b')!.emotes.at(-1)).toMatchObject({ from: views.get('a')!.youId, emote: 'heart' });
    expect(emote(server, 'a', 'laugh')).toEqual({ ok: false, error: 'Slow down a little' });
    expect(emote(server, 'b', 'laugh').ok).toBe(true);
    vi.advanceTimersByTime(EMOTE_GAP_MS);
    expect(emote(server, 'a', 'laugh').ok).toBe(true);
    expect(emote(server, 'b', '<script>')).toEqual({ ok: false, error: 'Unknown emote' });
  });
});
