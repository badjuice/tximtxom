import { io, type Socket } from 'socket.io-client';
import type { Action, ClientToServer, GameEvent, JoinResult, Rules, ServerToClient } from '@tximtxom/shared';
import { store, toast } from './store';

const SESSION_KEY = 'tximtxom.session';
const NAME_KEY = 'tximtxom.name';

interface Session {
  code: string;
  token: string;
}

export const socket: Socket<ServerToClient, ClientToServer> = io({
  transports: ['websocket', 'polling'],
  reconnectionDelayMax: 3000,
});

export function savedName(): string {
  return localStorage.getItem(NAME_KEY) ?? '';
}

function saveSession(r: JoinResult): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ code: r.code, token: r.token } satisfies Session));
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

socket.on('connect', () => {
  store.set({ connected: true });
  // Coming back after a refresh or a dropped connection: reclaim the seat.
  const s = loadSession();
  if (s) {
    socket.emit('room:join', { code: s.code, name: savedName(), token: s.token }, (res) => {
      if (!res.ok) {
        clearSession();
        store.set({ room: null });
      }
    });
  }
});

socket.on('disconnect', () => store.set({ connected: false }));

socket.on('room:state', (room) => store.set({ room }));

socket.on('room:closed', (reason) => {
  clearSession();
  store.set({ room: null, staged: null, selected: [] });
  toast(reason, 'error');
});

function call<T extends object>(fn: (ack: (r: ({ ok: true } & T) | { ok: false; error: string }) => void) => void): Promise<({ ok: true } & T) | { ok: false; error: string }> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ ok: false, error: 'No answer from the server' }), 8000);
    fn((r) => {
      clearTimeout(timer);
      if (!r.ok) toast(r.error, 'error');
      resolve(r);
    });
  });
}

export async function createRoom(name: string, rules?: Partial<Rules>) {
  localStorage.setItem(NAME_KEY, name);
  const r = await call<JoinResult>((ack) => socket.emit('room:create', { name, rules }, ack));
  if (r.ok) saveSession(r);
  return r;
}

export async function joinRoom(code: string, name: string) {
  localStorage.setItem(NAME_KEY, name);
  const r = await call<JoinResult>((ack) => socket.emit('room:join', { code, name }, ack));
  if (r.ok) saveSession(r);
  return r;
}

export const setRules = (rules: Partial<Rules>) => call((ack) => socket.emit('room:rules', { rules }, ack));
export const addBot = () => call((ack) => socket.emit('room:addBot', ack));
export const kick = (playerId: string) => call((ack) => socket.emit('room:kick', { playerId }, ack));
export const startGame = () => call((ack) => socket.emit('room:start', ack));

export function leaveRoom(): void {
  socket.emit('room:leave');
  clearSession();
  store.set({ room: null, staged: null, selected: [], overlay: null });
}

export function act(action: Action) {
  return call((ack) => socket.emit('game:action', action, ack));
}

/** Full move log of the current game (used after joining or missing updates). */
export function fetchHistory(): Promise<{ id: number; e: GameEvent }[] | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 8000);
    socket.emit('game:history', (r) => {
      clearTimeout(timer);
      resolve(r.ok ? r.events : null);
    });
  });
}
