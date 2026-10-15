// Connection to the game. Two modes:
// - peer-to-peer (default, used on GitHub Pages): the room creator's browser
//   hosts the room; see p2p.ts.
// - server: a Socket.IO server hosts rooms. Used when the build sets
//   VITE_SERVER_URL ("/" means the same origin, as in `npm run dev:server`).
import type { Socket } from 'socket.io-client';
import { type Action, type ClientToServer, type GameEvent, IDLE_REASON, type JoinResult, randomCode, type Request, type Rules, type ServerToClient } from '@tximtxom/shared';
import { Guest, hasSavedHostRoom, Host, type P2PEvents, type Result } from './p2p';
import { t, tError } from './i18n';
import { store, toast } from './store';

const SERVER_URL: string | undefined = import.meta.env.VITE_SERVER_URL || undefined;
export const MODE: 'p2p' | 'server' = SERVER_URL ? 'server' : 'p2p';

const SESSION_KEY = 'tximtxom.session';
const NAME_KEY = 'tximtxom.name';

interface Session {
  code: string;
  token: string;
  /** p2p: did this browser host the room? */
  host?: boolean;
}

export function savedName(): string {
  return localStorage.getItem(NAME_KEY) ?? '';
}

function saveSession(r: JoinResult, host: boolean): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ code: r.code, token: r.token, host } satisfies Session));
  const url = new URL(location.href);
  url.searchParams.set('room', r.code);
  history.replaceState(null, '', url);
}

function loadSession(): Session | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null');
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  const url = new URL(location.href);
  url.searchParams.delete('room');
  history.replaceState(null, '', url);
}

/** Room code from a shared link (?room=ABCD), if any. */
export function linkedRoom(): string {
  return new URL(location.href).searchParams.get('room')?.toUpperCase() ?? '';
}

function onClosed(reason: string): void {
  clearSession();
  host = null;
  guest = null;
  store.set({ room: null, staged: null, selected: [], connected: true });
  toast(tError(reason), 'error');
}

// ------------------------------------------------------------------ transports

let socket: Socket<ServerToClient, ClientToServer> | null = null;
let host: Host | null = null;
let guest: Guest | null = null;

const p2pEvents: P2PEvents = {
  state: (room) => store.set({ room }),
  closed: onClosed,
  connection: (up) => store.set({ connected: up }),
};

async function initServerMode(): Promise<void> {
  const { io } = await import('socket.io-client');
  socket = io(SERVER_URL === '/' ? undefined : SERVER_URL, { transports: ['websocket', 'polling'], reconnectionDelayMax: 3000 });
  socket.on('connect', () => {
    store.set({ connected: true });
    // Back after a refresh or a dropped connection: reclaim the seat.
    const s = loadSession();
    if (s) {
      socket!.emit('room:join', { code: s.code, name: savedName(), token: s.token }, (res) => {
        if (!res.ok) {
          clearSession();
          store.set({ room: null });
        }
      });
    }
  });
  socket.on('disconnect', () => store.set({ connected: false }));
  socket.on('room:state', (room) => store.set({ room }));
  socket.on('room:closed', onClosed);
}

/** Peer-to-peer: pick up where we left off after a refresh. */
async function initP2PMode(): Promise<void> {
  store.set({ connected: true });
  const s = loadSession();
  if (!s) return;
  try {
    if (s.host && hasSavedHostRoom(s.code)) {
      toast(t('err.reopening'));
      host = await Host.resume(p2pEvents);
      if (!host) throw new Error('gone');
      const r = host.request({ event: 'room:join', msg: { code: s.code, name: savedName(), token: s.token } });
      if (!r.ok) throw new Error(r.error);
    } else if (!s.host) {
      await connectGuest(s.code, { code: s.code, name: savedName(), token: s.token });
    } else {
      throw new Error('gone');
    }
  } catch (err) {
    clearSession();
    store.set({ room: null });
    toast(err instanceof Error && err.message === IDLE_REASON ? tError(IDLE_REASON) : t('err.roomGone'), 'error');
  }
}

async function connectGuest(code: string, join: { code: string; name: string; token?: string }): Promise<Result> {
  guest?.stop();
  const g = await Guest.connect(code, p2pEvents);
  guest = g;
  const res = await g.request({ event: 'room:join', msg: join });
  if (res.ok) {
    const token = (res as unknown as JoinResult).token;
    g.onReconnect = () => void g.request({ event: 'room:join', msg: { code, name: savedName(), token } });
  } else {
    g.stop();
    guest = null;
  }
  return res;
}

export function initNet(): void {
  void (MODE === 'server' ? initServerMode() : initP2PMode());
  // Closing the host's tab pauses the game for everyone: ask first.
  addEventListener('beforeunload', (e) => {
    if (host?.busy) e.preventDefault();
  });
  // Clicks and key presses tell the host a human is still here (at most every 30s).
  // Rooms with no human activity for 10 minutes close.
  let lastPing = 0;
  const ping = () => {
    if (!store.get().room || Date.now() - lastPing < 30_000) return;
    lastPing = Date.now();
    void request({ event: 'room:ping' });
  };
  addEventListener('pointerdown', ping, { capture: true, passive: true });
  addEventListener('keydown', ping, { capture: true, passive: true });
}

/** Sends a request over whichever connection is active. */
async function request(req: Request): Promise<Result> {
  if (MODE === 'server') {
    if (!socket?.connected) return { ok: false, error: 'Not connected to the server' };
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve({ ok: false, error: 'No answer from the server' }), 8000);
      const done = (r: Result) => {
        clearTimeout(timer);
        resolve(r);
      };
      const s = socket as unknown as { emit: (event: string, ...args: unknown[]) => void };
      if ('msg' in req) s.emit(req.event, req.msg, done);
      else s.emit(req.event, done);
    });
  }
  if (host) return host.request(req);
  if (guest) return guest.request(req);
  return { ok: false, error: 'Not in a room' };
}

async function call<T extends object = object>(req: Request): Promise<({ ok: true } & T) | { ok: false; error: string }> {
  const r = await request(req);
  if (!r.ok) toast(tError(r.error), 'error');
  return r as ({ ok: true } & T) | { ok: false; error: string };
}

// ------------------------------------------------------------------ API

export async function createRoom(name: string, rules?: Partial<Rules>) {
  localStorage.setItem(NAME_KEY, name);
  if (MODE === 'p2p') {
    try {
      host?.close('The host left');
      host = await Host.create(p2pEvents, randomCode);
    } catch {
      toast(t('err.offline'), 'error');
      return { ok: false as const, error: 'offline' };
    }
  }
  const r = await call<JoinResult>({ event: 'room:create', msg: { name, rules } });
  if (r.ok) saveSession(r, MODE === 'p2p');
  return r;
}

export async function joinRoom(code: string, name: string) {
  localStorage.setItem(NAME_KEY, name);
  if (MODE === 'p2p') {
    try {
      const r = await connectGuest(code, { code, name });
      if (!r.ok) {
        toast(tError(r.error), 'error');
        return r;
      }
      saveSession(r as unknown as JoinResult, false);
      return r;
    } catch (err) {
      toast(tError(err instanceof Error ? err.message : 'Room not found'), 'error');
      return { ok: false as const, error: 'not found' };
    }
  }
  const r = await call<JoinResult>({ event: 'room:join', msg: { code, name } });
  if (r.ok) saveSession(r, false);
  return r;
}

export const setRules = (rules: Partial<Rules>) => call({ event: 'room:rules', msg: { rules } });
export const addBot = () => call({ event: 'room:addBot' });
export const kick = (playerId: string) => call({ event: 'room:kick', msg: { playerId } });
export const startGame = () => call({ event: 'room:start' });
export const playAgain = () => call({ event: 'room:again' });
export const renamePlayer = (playerId: string, name: string) => {
  if (playerId === store.get().room?.youId) localStorage.setItem(NAME_KEY, name);
  return call({ event: 'room:rename', msg: { playerId, name } });
};
export const cycleAvatar = (playerId: string) => call({ event: 'room:avatar', msg: { playerId } });

export function leaveRoom(): void {
  void request({ event: 'room:leave' });
  host?.close('The host closed the room');
  guest?.stop();
  host = null;
  guest = null;
  clearSession();
  store.set({ room: null, staged: null, selected: [], overlay: null });
}

export function act(action: Action) {
  return call({ event: 'game:action', msg: action });
}

/** The host's action log and the final state (only after the game ends). */
export async function fetchDebug(): Promise<{ log: unknown[]; state: unknown; members: unknown[] } | { error: string }> {
  const r = await request({ event: 'room:debug' });
  return r.ok ? (r as unknown as { log: unknown[]; state: unknown; members: unknown[] }) : { error: r.error };
}

/** Full move log of the current game (used after joining or missing updates). */
export async function fetchHistory(): Promise<{ id: number; e: GameEvent }[] | null> {
  const r = await request({ event: 'game:history' });
  return r.ok ? (r as unknown as { events: { id: number; e: GameEvent }[] }).events : null;
}
