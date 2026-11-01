// The room's chat: the same conversation in the lobby and, as a tab of the
// History panel, during the game.
import { CHAT_MAX, type RoomView } from '@tximtxom/shared';
import { useEffect, useRef, useState } from 'preact/hooks';
import { play } from '../audio';
import { t } from '../i18n';
import { sendChat } from '../net';
import { SEAT_COLORS } from '../seatColors';
import { store, useStore } from '../store';

/** Messages from other players you haven't seen yet. */
export function unreadChat(room: RoomView | null, seen: ClientSeen): number {
  if (!room) return 0;
  const after = seen.code === room.code ? seen.id : 0;
  return room.chat.filter((l) => l.id > after && l.from !== room.youId).length;
}
type ClientSeen = { code: string; id: number };

export const useUnreadChat = () => useStore((s) => unreadChat(s.room, s.chatSeen));

/** A short sound when someone else writes. */
export function initChat(): void {
  let last = { code: '', id: 0 };
  store.subscribe(() => {
    const room = store.get().room;
    const line = room?.chat.at(-1);
    if (!room || !line) return;
    if (last.code === room.code && line.id > last.id && line.from !== room.youId) play('highlight2', { volume: 0.4 });
    last = { code: room.code, id: line.id };
  });
}

/** The messages and a field to write in. Marks everything read while it's on screen. */
export function ChatBox({ room }: { room: RoomView }) {
  const list = useRef<HTMLOListElement>(null);
  const atBottom = useRef(true);
  const [text, setText] = useState('');
  const lastId = room.chat.at(-1)?.id ?? 0;

  useEffect(() => {
    const seen = store.get().chatSeen;
    if (seen.code !== room.code || seen.id !== lastId) store.set({ chatSeen: { code: room.code, id: lastId } });
    const el = list.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [room.code, lastId]);

  const send = async () => {
    const msg = text.trim();
    if (!msg) return;
    atBottom.current = true;
    if (await sendChat(msg)) setText('');
  };

  return (
    <div class="chat">
      <ol
        class="chat-list"
        ref={list}
        aria-live="polite"
        onScroll={(ev) => {
          const el = ev.currentTarget;
          atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
        }}
      >
        {room.chat.map((l) => {
          const i = room.players.findIndex((p) => p.id === l.from);
          const who = l.from === room.youId ? t('you') : (room.players[i]?.name ?? t('chat.gone'));
          return (
            <li key={l.id} class={l.from === room.youId ? 'mine' : ''}>
              <b style={{ color: i >= 0 ? SEAT_COLORS[i] : undefined }}>{who}</b> {l.text}
            </li>
          );
        })}
        {room.chat.length === 0 && <li class="muted">{t('chat.empty')}</li>}
      </ol>
      <form
        class="chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          type="text"
          value={text}
          maxLength={CHAT_MAX}
          placeholder={t('chat.placeholder')}
          aria-label={t('chat.placeholder')}
          enterKeyHint="send"
          autoComplete="off"
          onInput={(e) => setText((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => {
            // Esc leaves the field instead of opening Settings.
            if (e.key === 'Escape') {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        <button type="submit" class="chat-send" disabled={!text.trim()} aria-label={t('chat.send')} title={t('chat.send')}>
          <svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">
            <path d="M2 2h2v1h2v1h2v1h2v1h2v1h2v2h-2v1h-2v1h-2v1h-2v1h-2v1H2v-5h6V7H2z" fill="currentColor" />
          </svg>
        </button>
      </form>
    </div>
  );
}
