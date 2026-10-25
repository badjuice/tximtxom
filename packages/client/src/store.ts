import { useEffect, useState } from 'preact/hooks';
import type { Card, GameEvent, RoomView } from '@tximtxom/shared';
import type { Layout } from './game/layout';

/** One colour per seat, used on plates, callouts and in the history. */
export const SEAT_COLORS = ['#009dff', '#fe5f55', '#fda200', '#4bc292'];

/** A move picked on screen but not sent yet (sent on "End Turn"). */
export type Staged =
  | { type: 'discardDrawn'; card: Card }
  | { type: 'swap'; card: Card }
  | { type: 'endRound'; card: Card };

export type Overlay = null | 'scoreboard' | 'formations' | 'settings' | 'help' | 'rules' | 'changelog' | 'leave';

export interface ClientState {
  connected: boolean;
  room: RoomView | null;
  /** Hand cards currently selected. */
  selected: Card[];
  staged: Staged | null;
  overlay: Overlay;
  toast: { id: number; text: string; kind: 'info' | 'error' } | null;
  banner: { id: number; text: string; sub?: string; joker?: string; tone?: 'good' | 'bad' | 'info' } | null;
  /** Balatro-style pop-up text over a spinning polygon ("Your turn", "TximTxom!"). */
  callout: { id: number; text: string; color: string; small?: boolean; ms: number } | null;
  /** Bumped to trigger a "nope" shake on the action bar. */
  shake: number;
  /** A card is being dragged on the table: the action bar is locked meanwhile. */
  dragging: boolean;
  /** The card being dragged, if any. */
  dragCard: number | null;
  /** The loading screen is gone and the player sees the menu. */
  entered: boolean;
  layout: Layout | null;
  /** Full move log of the current game, oldest first. */
  history: { id: number; e: GameEvent }[];
  /** Cards you drew yourself, by event id (only you know them). */
  myDraws: Record<number, Card>;
}

type Listener = () => void;

function createStore<T extends object>(initial: T) {
  let state = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => state,
    set(patch: Partial<T> | ((s: T) => Partial<T>)) {
      const p = typeof patch === 'function' ? patch(state) : patch;
      state = { ...state, ...p };
      listeners.forEach((l) => l());
    },
    subscribe(l: Listener) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

export const store = createStore<ClientState>({
  connected: false,
  room: null,
  selected: [],
  staged: null,
  overlay: null,
  toast: null,
  banner: null,
  callout: null,
  shake: 0,
  dragging: false,
  dragCard: null,
  entered: false,
  layout: null,
  history: [],
  myDraws: {},
});

/** Preact hook: re-renders when the selected slice changes. */
export function useStore<R>(select: (s: ClientState) => R): R {
  const [value, setValue] = useState(() => select(store.get()));
  useEffect(() => {
    const update = () => setValue(() => select(store.get()));
    update();
    return store.subscribe(update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

let toastId = 0;
export function toast(text: string, kind: 'info' | 'error' = 'info'): void {
  const id = ++toastId;
  store.set({ toast: { id, text, kind } });
  setTimeout(() => {
    if (store.get().toast?.id === id) store.set({ toast: null });
  }, kind === 'error' ? 2600 : 2000);
}

let calloutId = 0;
/** Shows a callout for `ms`. `small` is for less important ones (other players' turns). */
export function callout(text: string, color: string, opts: { ms?: number; small?: boolean } = {}): void {
  const id = ++calloutId;
  const ms = opts.ms ?? 1250;
  store.set({ callout: { id, text, color, small: opts.small, ms } });
  setTimeout(() => {
    if (store.get().callout?.id === id) store.set({ callout: null });
  }, ms);
}

let bannerId = 0;
export function banner(text: string, opts: { sub?: string; joker?: string; tone?: 'good' | 'bad' | 'info'; ms?: number } = {}): void {
  const id = ++bannerId;
  store.set({ banner: { id, text, sub: opts.sub, joker: opts.joker, tone: opts.tone } });
  setTimeout(() => {
    if (store.get().banner?.id === id) store.set({ banner: null });
  }, opts.ms ?? 1800);
}
