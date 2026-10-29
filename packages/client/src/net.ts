// Connection to the game. Two modes:
// - peer-to-peer (default, used on GitHub Pages): the room creator's browser
//   hosts the room; see p2p.ts.
// - server: a Socket.IO server hosts rooms. Used when the build sets
//   VITE_SERVER_URL ("/" means the same origin, as in `npm run dev:server`).
import type { Socket } from 'socket.io-client';
import { carrierId, hasAchievement, onUnlock, unlock } from './achievements';
import { recordLeftGame } from './stats';

/** Sent when joining: whether you're Infected, and your carrier id if so. */
const infection = () => (hasAchievement('infected') ? { infected: true, carrier: carrierId() } : { infected: false });
import { type Action, type ClientToServer, type GameEvent, IDLE_REASON, type JoinResult, randomCode, type Request, type Rules, sanitizeRules, type ServerToClient } from '@tximtxom/shared';
import { Guest, hasSavedHostRoom, Host, type P2PEvents, type Result } from './p2p';
import { t, tError } from './i18n';
import { store, toast } from './store';

const SERVER_URL: string | undefined = import.meta.env.VITE_SERVER_URL || undefined;
export const MODE: 'p2p' | 'server' = SERVER_URL ? 'server' : 'p2p';

const SESSION_KEY = 'tximtxom.session';
const NAME_KEY = 'tximtxom.name';
// The character you used last, and (as host) the rules you set last.
const AVATAR_KEY = 'tximtxom.avatar';
const RULES_KEY = 'tximtxom.rules';

interface Session {
  code: string;
  token: string;
  /** p2p: did this browser host the room? */
  host?: boolean;
  /** Last time this device was in the room (ms timestamp). */
  seen?: number;
}

/** The menu forgets the room code this long after the player left the room. */
const ROOM_MEMORY_MS = 10 * 60_000;

export function savedName(): string {
  return localStorage.getItem(NAME_KEY) ?? '';
}

export function saveName(name: string): void {
  if (name) localStorage.setItem(NAME_KEY, name);
}

function savedAvatar(): string | undefined {
  return localStorage.getItem(AVATAR_KEY) ?? undefined;
}

/** The rules this player last used as host; a new room starts with them. */
export function savedRules(): Partial<Rules> | undefined {
  try {
    const r = JSON.parse(localStorage.getItem(RULES_KEY) ?? 'null');
    return r ? sanitizeRules(r) : undefined;
  } catch {
    return undefined;
  }
}

/** Remembers your character, and the rules while you are the host. */
function rememberPreferences(): void {
  const room = store.get().room;
  const me = room?.players.find((p) => p.id === room.youId);
  if (!room || !me) return;
  // The store changes often; only write when the value did.
  const keep = (key: string, value: string) => {
    if (localStorage.getItem(key) !== value) localStorage.setItem(key, value);
  };
  if (me.avatar) keep(AVATAR_KEY, me.avatar);
  if (room.hostId === room.youId) keep(RULES_KEY, JSON.stringify(room.rules));
}

function saveSession(r: JoinResult, host: boolean): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ code: r.code, token: r.token, host, seen: Date.now() } satisfies Session));
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
  clearLink();
}

/** Drops ?room= from the address bar. */
function clearLink(): void {
  const url = new URL(location.href);
  url.searchParams.delete('room');
  history.replaceState(null, '', url);
}

/** Marks the saved room as visited just now (while in it, and on leaving it). */
function touchSession(): void {
  const s = loadSession();
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify({ ...s, seen: Date.now() } satisfies Session));
}

/** When the menu forgets the saved room's code (ms timestamp), or null if there is none. */
export function savedRoomExpiry(): number | null {
  const s = loadSession();
  if (!s) return null;
  // Saved before codes expired: the ten minutes start now.
  if (!s.seen) touchSession();
  return (s.seen ?? Date.now()) + ROOM_MEMORY_MS;
}

/** The room this device had a seat in before the page loaded, if any. Forgotten
 *  10 minutes after the player left it (idle rooms close after 10 minutes too). */
export function savedRoom(): string {
  const s = loadSession();
  if (!s) return '';
  if (Date.now() >= savedRoomExpiry()!) {
    if (linkedRoom() === s.code) clearLink();
    clearSession();
    return '';
  }
  return s.code;
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
    // Back after a dropped connection: reclaim the seat. (After a refresh the
    // menu shows first, and rejoinRoom does it.)
    const s = loadSession();
    if (s && store.get().room) {
      socket!.emit('room:join', { code: s.code, name: savedName(), token: s.token, ...infection() }, (res) => {
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

async function initP2PMode(): Promise<void> {
  store.set({ connected: true });
}

/** Back to the room this device had a seat in, after a refresh (the menu's Rejoin). */
export async function rejoinRoom(): Promise<void> {
  const s = loadSession();
  if (!s) return;
  if (MODE === 'server') {
    const res = await call<JoinResult>({ event: 'room:join', msg: { code: s.code, name: savedName(), token: s.token, ...infection() } });
    if (!res.ok) {
      clearSession();
      toast(t('err.roomGone'), 'error');
    }
    return;
  }
  try {
    if (s.host && hasSavedHostRoom(s.code)) {
      toast(t('err.reopening'));
      host = await Host.resume(p2pEvents);
      if (!host) throw new Error('gone');
      const r = host.request({ event: 'room:join', msg: { code: s.code, name: savedName(), token: s.token, ...infection() } });
      if (!r.ok) throw new Error(r.error);
    } else if (!s.host) {
      await connectGuest(s.code, { code: s.code, name: savedName(), token: s.token, ...infection() });
    } else {
      throw new Error('gone');
    }
  } catch (err) {
    clearSession();
    store.set({ room: null });
    toast(err instanceof Error && err.message === IDLE_REASON ? tError(IDLE_REASON) : t('err.roomGone'), 'error');
  }
}

async function connectGuest(code: string, join: { code: string; name: string; token?: string; avatar?: string; infected?: boolean }): Promise<Result> {
  guest?.stop();
  const g = await Guest.connect(code, p2pEvents);
  guest = g;
  const res = await g.request({ event: 'room:join', msg: join });
  if (res.ok) {
    const token = (res as unknown as JoinResult).token;
    g.onReconnect = () => void g.request({ event: 'room:join', msg: { code, name: savedName(), token, ...infection() } });
  } else {
    g.stop();
    guest = null;
  }
  return res;
}

export function initNet(): void {
  store.subscribe(rememberPreferences);
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
  // Caught Infected while in a room: the host passes it on at the next round start.
  onUnlock((id) => {
    if (id === 'infected' && store.get().room) void request({ event: 'room:infected', msg: { carrier: carrierId() } });
  });
  addEventListener('keydown', ping, { capture: true, passive: true });
  // While in a room the saved code stays fresh; closing the tab counts as leaving.
  setInterval(() => {
    if (store.get().room) touchSession();
  }, 30_000);
  addEventListener('pagehide', () => {
    if (store.get().room) touchSession();
  });
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

export async function createRoom(name: string, rules: Partial<Rules> | undefined = savedRules()) {
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
  const r = await call<JoinResult>({ event: 'room:create', msg: { name, rules, avatar: savedAvatar(), ...infection() } });
  if (r.ok) saveSession(r, MODE === 'p2p');
  return r;
}

export async function joinRoom(code: string, name: string) {
  localStorage.setItem(NAME_KEY, name);
  if (MODE === 'p2p') {
    try {
      const r = await connectGuest(code, { code, name, avatar: savedAvatar(), ...infection() });
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
  const r = await call<JoinResult>({ event: 'room:join', msg: { code, name, avatar: savedAvatar(), ...infection() } });
  if (r.ok) saveSession(r, false);
  return r;
}

export const setRules = (rules: Partial<Rules>) => call({ event: 'room:rules', msg: { rules } });
export const addBot = () => call({ event: 'room:addBot' });
export const kick = (playerId: string) => call({ event: 'room:kick', msg: { playerId } });
export const startGame = () => call({ event: 'room:start' });
export const setReady = (ready: boolean) => call({ event: 'room:ready', msg: { ready } });
export const playAgain = () => call({ event: 'room:again' });
export const renamePlayer = (playerId: string, name: string) => {
  if (playerId === store.get().room?.youId) localStorage.setItem(NAME_KEY, name);
  return call({ event: 'room:rename', msg: { playerId, name } });
};
export const cycleAvatar = (playerId: string) => call({ event: 'room:avatar', msg: { playerId } });

export function leaveRoom(): void {
  // A guest leaving a game in progress keeps the seat (a bot plays it): the
  // menu's Join can take it back. The host's room closes with them.
  const midGame = !!store.get().room?.game && store.get().room?.game?.phase !== 'gameOver';
  const keepSeat = midGame && !host;
  if (midGame && store.get().room?.game?.you != null) {
    recordLeftGame();
    unlock('ragequit');
  }
  void request({ event: 'room:leave' });
  host?.close('The host closed the room');
  guest?.stop();
  host = null;
  guest = null;
  if (keepSeat) {
    clearLink();
    touchSession();
  } else clearSession();
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
