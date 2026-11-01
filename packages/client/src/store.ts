import { getSettings, updateSettings } from './settings';
import { useEffect, useState } from 'preact/hooks';
import type { Card, GameEvent, GameView, RoomView } from '@tximtxom/shared';

/** A finished game's log: its events, the view to name its players by, and the cards you drew. */
export interface PastGame {
  events: { id: number; e: GameEvent }[];
  g: GameView;
  myDraws: Record<number, Card>;
}
import type { Layout } from './game/layout';

/** One colour per seat, used on plates, callouts and in the history. */
export { SEAT_COLORS } from './seatColors';

/** A move picked on screen but not sent yet (sent on "End Turn"). */
export type Staged =
  | { type: 'discardDrawn'; card: Card }
  | { type: 'swap'; card: Card }
  | { type: 'endRound'; card: Card };

export type Overlay = null | 'scoreboard' | 'formations' | 'settings' | 'help' | 'rules' | 'changelog' | 'leave' | 'language' | 'stats' | 'achievements';

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
  /** Connecting to a room is taking a while: a screen like the loading one covers everything. */
  joining: 'join' | 'create' | null;
  /** The card being dragged, if any. */
  dragCard: number | null;
  /** The dragged card is over the Txi jog button. */
  overTxiJog: boolean;
  /** The loading screen is gone and the player sees the menu. */
  entered: boolean;
  layout: Layout | null;
  /** Full move log of the current game, oldest first. */
  history: { id: number; e: GameEvent }[];
  /** Cards you drew yourself, by event id (only you know them). */
  myDraws: Record<number, Card>;
  /** Earlier games in this room, oldest first, kept for the History panel until you leave. */
  pastGames: PastGame[];
  /** The last chat message you've seen, and in which room. */
  chatSeen: { code: string; id: number };
  /** The History panel's tab. */
  sideTab: 'history' | 'chat';
  /** The cards are being dealt: the pile counters wait until they've landed. */
  dealing: boolean;
  /** No card of yours fits the open formation: when you pass on your own (ms timestamp). */
  autoPassAt: number | null;
}

/** The History and Chat buttons (and H, C): open the side panel on that tab, or close it if it's showing it already. */
export function toggleSide(tab: 'history' | 'chat'): void {
  const open = getSettings().historyOpen;
  if (open && store.get().sideTab === tab) updateSettings({ historyOpen: false });
  else {
    store.set({ sideTab: tab });
    if (!open) updateSettings({ historyOpen: true });
  }
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
  joining: null,
  dragging: false,
  dragCard: null,
  overTxiJog: false,
  entered: false,
  layout: null,
  history: [],
  myDraws: {},
  pastGames: [],
  chatSeen: { code: '', id: 0 },
  sideTab: 'history',
  dealing: false,
  autoPassAt: null,
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
