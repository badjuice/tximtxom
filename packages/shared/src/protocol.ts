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
  /** Games lost without busting (silver badge), and lost by busting. */
  silvers: number;
  busts: number;
  /** Moves the turn timer has made for them so far, when they ran out of time. */
  timeouts: number;
  /** Ready to start (bots and the host always are). */
  ready: boolean;
  /** Has the Infected achievement: anyone at a table with them catches it. */
  infected: boolean;
  /** An infected player's anonymous carrier id: whoever catches it from them counts it towards theirs. */
  carrier?: string;
}

/** One chat message. */
export interface ChatLine {
  /** Counts up within the room: what's new since you last looked. */
  id: number;
  /** The sender's player id. */
  from: string;
  text: string;
  /** When the host got it (ms since 1970). Missing from hosts older than 0.49.8. */
  at?: number;
}

/** The emotes a player can send: a bubble over their plate for a moment. */
export const EMOTES = ['faceHappy', 'faceSad', 'faceAngry', 'laugh', 'heart', 'heartBroken', 'exclamation', 'question', 'idea', 'sleeps', 'cash', 'stars'] as const;
export type EmoteId = (typeof EMOTES)[number];
/** Shortest time between two emotes from one player (a little over a bubble's 2.6s). */
export const EMOTE_GAP_MS = 3000;
export const EMOTE_KEEP = 8;

/** One emote sent. */
export interface EmoteLine {
  /** Counts up within the room. */
  id: number;
  from: string;
  emote: EmoteId;
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
  /** The room's chat, oldest first (the last CHAT_KEEP messages). */
  chat: ChatLine[];
  /** The last few emotes sent, oldest first. Not kept when the host restarts. */
  emotes: EmoteLine[];
}

export type Ack<T = object> = (res: ({ ok: true } & T) | { ok: false; error: string }) => void;

export interface JoinResult {
  code: string;
  token: string;
  playerId: string;
}

export interface ClientToServer {
  'room:create': (msg: { name: string; rules?: Partial<Rules>; avatar?: string; infected?: boolean; carrier?: string }, ack: Ack<JoinResult>) => void;
  'room:join': (msg: { code: string; name: string; token?: string; avatar?: string; infected?: boolean; carrier?: string }, ack: Ack<JoinResult>) => void;
  'room:rules': (msg: { rules: Partial<Rules> }, ack: Ack) => void;
  'room:addBot': (ack: Ack) => void;
  'room:kick': (msg: { playerId: string }, ack: Ack) => void;
  /** Rename yourself, or (host only) a bot. Lobby only. */
  'room:rename': (msg: { playerId: string; name: string }, ack: Ack) => void;
  /** Switch to the next free Joker art: your own, or (host only) a bot's, which also renames it. Lobby only. */
  /** `owned`: your shop characters, which the cycle includes (only for your own art). */
  'room:avatar': (msg: { playerId: string; owned?: string[] }, ack: Ack) => void;
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
  /** You caught the Infected achievement here: the rest of the table catches it at the next round start. */
  'room:infected': (msg: { carrier?: string }, ack: Ack) => void;
  /** Say something in the room's chat (lobby and game). */
  'room:chat': (msg: { text: string }, ack: Ack) => void;
  /** Show an emote over your plate. */
  'room:emote': (msg: { emote: string }, ack: Ack) => void;
  'game:action': (action: Action, ack: Ack) => void;
  /** The full move log of the current game. */
  'game:history': (ack: Ack<{ events: { id: number; e: GameEvent }[] }>) => void;
}

export interface ServerToClient {
  'room:state': (view: RoomView) => void;
  'room:closed': (reason: string) => void;
}

/** Longest player name: short enough for a player's plate on a phone (see FitName in the client's Hud). */
export const NAME_MAX = 10;
/** Longest chat message, messages kept, and how many one player may send per CHAT_WINDOW_MS. */
export const CHAT_MAX = 120;
export const CHAT_KEEP = 50;
export const CHAT_BURST = 5;
export const CHAT_WINDOW_MS = 10_000;
export const ROOM_CODE_LENGTH = 4;
