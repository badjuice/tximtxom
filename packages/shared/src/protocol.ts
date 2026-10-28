import type { Rules } from './rules.js';
import type { Action, GameEvent } from './types.js';
import type { GameView } from './view.js';

export interface LobbyPlayer {
  id: string;
  name: string;
  isBot: boolean;
  avatar: string;
  connected: boolean;
  /** Games won in this room. */
  wins: number;
  /** Ready to start (bots and the host always are). */
  ready: boolean;
  /** Has the Infected achievement: anyone at a table with them catches it. */
  infected: boolean;
}

/** Everything a client needs, sent after every change. */
export interface RoomView {
  code: string;
  hostId: string;
  /** Your player id. */
  youId: string;
  players: LobbyPlayer[];
  rules: Rules;
  game: GameView | null;
  /** Epoch ms when the current turn times out (null = no timer). */
  turnDeadline: number | null;
}

export type Ack<T = object> = (res: ({ ok: true } & T) | { ok: false; error: string }) => void;

export interface JoinResult {
  code: string;
  token: string;
  playerId: string;
}

export interface ClientToServer {
  'room:create': (msg: { name: string; rules?: Partial<Rules>; avatar?: string; infected?: boolean }, ack: Ack<JoinResult>) => void;
  'room:join': (msg: { code: string; name: string; token?: string; avatar?: string; infected?: boolean }, ack: Ack<JoinResult>) => void;
  'room:rules': (msg: { rules: Partial<Rules> }, ack: Ack) => void;
  'room:addBot': (ack: Ack) => void;
  'room:kick': (msg: { playerId: string }, ack: Ack) => void;
  /** Rename yourself, or (host only) a bot. Lobby only. */
  'room:rename': (msg: { playerId: string; name: string }, ack: Ack) => void;
  /** Switch to the next free Joker art: your own, or (host only) a bot's, which also renames it. Lobby only. */
  'room:avatar': (msg: { playerId: string }, ack: Ack) => void;
  'room:start': (ack: Ack) => void;
  /** A player who isn't the host says they're ready to start (or not). Lobby only. */
  'room:ready': (msg: { ready: boolean }, ack: Ack) => void;
  /** After a game ends: the host's action log and the full final state, for bug reports. */
  'room:debug': (ack: Ack<{ log: unknown[]; state: unknown; members: unknown[] }>) => void;
  /** Host, after a game ends: a new game with the same table (wins are kept). */
  'room:again': (ack: Ack) => void;
  'room:leave': () => void;
  /** The player clicked or typed: keeps the room from closing as idle. */
  'room:ping': (ack: Ack) => void;
  'game:action': (action: Action, ack: Ack) => void;
  /** The full move log of the current game. */
  'game:history': (ack: Ack<{ events: { id: number; e: GameEvent }[] }>) => void;
}

export interface ServerToClient {
  'room:state': (view: RoomView) => void;
  'room:closed': (reason: string) => void;
}

export const NAME_MAX = 16;
export const ROOM_CODE_LENGTH = 4;
