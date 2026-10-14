import type { Rules } from './rules.js';
import type { Action, GameEvent } from './types.js';
import type { GameView } from './view.js';

export interface LobbyPlayer {
  id: string;
  name: string;
  isBot: boolean;
  connected: boolean;
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
  'room:create': (msg: { name: string; rules?: Partial<Rules> }, ack: Ack<JoinResult>) => void;
  'room:join': (msg: { code: string; name: string; token?: string }, ack: Ack<JoinResult>) => void;
  'room:rules': (msg: { rules: Partial<Rules> }, ack: Ack) => void;
  'room:addBot': (ack: Ack) => void;
  'room:kick': (msg: { playerId: string }, ack: Ack) => void;
  'room:start': (ack: Ack) => void;
  'room:leave': () => void;
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
