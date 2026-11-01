// Emotes: a bubble over the sender's plate (in a game) or their row (in the
// lobby) for a moment. Nothing goes to the chat.
import { EMOTE_GAP_MS, EMOTES, type RoomView } from '@tximtxom/shared';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { unlock } from '../achievements';
import { play } from '../audio';
import { type Key, t } from '../i18n';
import { sendEmote } from '../net';
import { store } from '../store';
import { EmoteIcon } from './sprites';

const SHOW_MS = 2600;

/** The emote each player is showing right now, by player id. */
let bubbles: Record<string, { emote: string; key: number }> = {};
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Shows new emotes as they arrive (not the ones already sent when you joined). */
export function initEmotes(): void {
  let seen = { code: '', id: 0 };
  store.subscribe(() => {
    const room: RoomView | null = store.get().room;
    if (!room) return;
    const last = room.emotes.at(-1)?.id ?? 0;
    if (seen.code !== room.code) {
      seen = { code: room.code, id: last };
      return;
    }
    const fresh = room.emotes.filter((e) => e.id > seen.id);
    seen = { code: room.code, id: last };
    for (const e of fresh) {
      bubbles = { ...bubbles, [e.from]: { emote: e.emote, key: e.id } };
      if (e.from !== room.youId) play('card3', { volume: 0.5 });
      setTimeout(() => {
        if (bubbles[e.from]?.key !== e.id) return;
        const { [e.from]: _, ...rest } = bubbles;
        bubbles = rest;
        notify();
      }, SHOW_MS);
    }
    if (fresh.length) notify();
  });
}

/** The emote over a player, while there is one. */
export function EmoteBubble({ player }: { player: string }) {
  const [, redraw] = useState(0);
  useEffect(() => {
    const l = () => redraw((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  const b = bubbles[player];
  if (!b) return null;
  return (
    <span class="emote-bubble" key={b.key} aria-label={t(`emote.${b.emote}` as Key)} role="img">
      <EmoteIcon id={b.emote} scale={2.5} />
    </span>
  );
}

/** Until when your emotes rest after sending one (the host refuses them sooner). */
let coolUntil = 0;
const coolers = new Set<() => void>();

/** True while emotes rest. Sets `--cool` (1 down to 0) on `el` each frame for the ring. */
function useCooldown(el: { current: HTMLElement | null }): boolean {
  const [cooling, setCooling] = useState(() => Date.now() < coolUntil);
  useEffect(() => {
    const start = () => setCooling(Date.now() < coolUntil);
    coolers.add(start);
    return () => void coolers.delete(start);
  }, []);
  useEffect(() => {
    if (!cooling) return;
    let frame = 0;
    const step = () => {
      const left = coolUntil - Date.now();
      if (left <= 0) return setCooling(false);
      el.current?.style.setProperty('--cool', String(left / EMOTE_GAP_MS));
      frame = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(frame);
  }, [cooling]);
  return cooling;
}

/** A ring that empties as the rest runs out. */
const CoolRing = () => <span class="emote-ring" aria-hidden="true" />;

const touch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;

/** A button that opens the grid of emotes. It stays open while you pick, and closes
 *  on a tap anywhere else. On a phone in a game (`once`) it closes after one emote,
 *  so it doesn't sit over the table. */
export function EmotePicker({ class: cls, once }: { class?: string; once?: boolean }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  const grid = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);
  const cooling = useCooldown(box);
  // Kept inside the screen (a plate near the edge would push it off). offsetLeft ignores the pop-in scale.
  useLayoutEffect(() => {
    if (!open || !box.current || !grid.current) return setShift(0);
    const left = box.current.getBoundingClientRect().left + grid.current.offsetLeft;
    const right = left + grid.current.offsetWidth;
    setShift(Math.max(8 - left, Math.min(0, window.innerWidth - 8 - right)));
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc, true);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', esc, true);
    };
  }, [open]);
  return (
    <span class={`emote-picker${cls ? ` ${cls}` : ''}${cooling ? ' cooling' : ''}`} ref={box}>
      <button type="button" class="emote-btn" aria-label={t('emote.open')} title={t('emote.open')} aria-expanded={open} onClick={() => setOpen(!open)}>
        <EmoteIcon id="faceHappy" scale={1.5} />
        {cooling && !open && <CoolRing />}
      </button>
      {open && (
        <span class="emote-grid" role="menu" ref={grid} style={{ marginLeft: `${shift}px`, marginRight: `${-shift}px` }}>
          {EMOTES.map((id) => (
            <button
              type="button"
              role="menuitem"
              aria-label={t(`emote.${id}` as Key)}
              title={t(`emote.${id}` as Key)}
              disabled={cooling}
              onClick={() => {
                if (once && touch) setOpen(false);
                coolUntil = Date.now() + EMOTE_GAP_MS;
                coolers.forEach((c) => c());
                void sendEmote(id).then((ok) => ok && unlock('showDontTell'));
              }}
            >
              <EmoteIcon id={id} scale={2} />
            </button>
          ))}
          {cooling && <CoolRing />}
        </span>
      )}
    </span>
  );
}
