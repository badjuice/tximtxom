import { botAction } from '../bot.js';
import { applyAction, newGame } from '../engine.js';
import type { LobbyPlayer, RoomView } from '../protocol.js';
import { randomSeed } from '../rng.js';
import { BOT_PERSONAS, DEFAULT_RULES, MAX_PLAYERS, MIN_PLAYERS, type Rules, sanitizeRules } from '../rules.js';
import type { Action, GameState, Seat } from '../types.js';
import { viewFor } from '../view.js';

// Runs a room: lobby, game state, bots and the turn timer. Plain TypeScript
// with no Node or browser APIs, so the same code runs on the Node server or
// inside the host player's browser (peer-to-peer mode).

type Timer = ReturnType<typeof setTimeout>;

function randomId(bytes: number): string {
  const a = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** How long bots "think" before acting (ms). */
const BOT_DELAY = { turn: 900, reveal: 700, ride: 600, ready: 400 };

export interface Member {
  id: string;
  token: string;
  name: string;
  isBot: boolean;
  /** Joker art for bots ('' for humans). */
  avatar: string;
  clientId: string | null;
}

export interface RoomSnapshot {
  code: string;
  hostId: string;
  rules: Rules;
  members: Member[];
  game: GameState | null;
}

export interface RoomHooks {
  /** Push the latest view to one member. */
  send(member: Member, view: RoomView): void;
  /** Called after every change (used to save the room). */
  changed?(): void;
}

export class Room {
  readonly code: string;
  hostId: string;
  rules: Rules = { ...DEFAULT_RULES };
  members: Member[] = [];
  game: GameState | null = null;
  turnDeadline: number | null = null;
  lastActivity = Date.now();

  private botTimer: Timer | null = null;
  private turnTimer: Timer | null = null;
  private timerKey = '';

  constructor(code: string, private hooks: RoomHooks) {
    this.code = code;
    this.hostId = '';
  }

  // ------------------------------------------------------------ membership

  addHuman(name: string, clientId: string): Member {
    const m: Member = { id: randomId(8), token: randomId(18), name, isBot: false, avatar: '', clientId };
    this.members.push(m);
    if (!this.hostId) this.hostId = m.id;
    return m;
  }

  addBot(): Member {
    // The next Joker not already at the table.
    const usedArt = new Set(this.members.map((m) => m.avatar));
    const persona = BOT_PERSONAS.find((p) => !usedArt.has(p.avatar)) ?? BOT_PERSONAS[0];
    const m: Member = { id: randomId(8), token: '', name: persona.name, isBot: true, avatar: persona.avatar, clientId: null };
    this.members.push(m);
    return m;
  }

  renameBot(id: string, name: string): boolean {
    const m = this.members.find((x) => x.id === id && x.isBot);
    if (!m) return false;
    m.name = name;
    return true;
  }

  remove(id: string): void {
    this.members = this.members.filter((m) => m.id !== id);
    if (this.hostId === id) this.hostId = this.members.find((m) => !m.isBot)?.id ?? '';
  }

  byToken(token: string): Member | undefined {
    return token ? this.members.find((m) => m.token === token) : undefined;
  }

  byClient(clientId: string): Member | undefined {
    return this.members.find((m) => m.clientId === clientId);
  }

  seatOf(member: Member): Seat | null {
    if (!this.game) return null;
    const i = this.game.players.findIndex((p) => p.id === member.id);
    return i < 0 ? null : i;
  }

  get humansConnected(): number {
    return this.members.filter((m) => !m.isBot && m.clientId).length;
  }

  get isFull(): boolean {
    return this.members.length >= MAX_PLAYERS;
  }

  /** A human connected (or came back). They take their seat back from the bot. */
  connect(member: Member, clientId: string): void {
    member.clientId = clientId;
    const seat = this.seatOf(member);
    if (this.game && seat !== null) this.game.players[seat].botControlled = false;
    if (!this.members.some((m) => m.id === this.hostId && m.clientId)) this.hostId = member.id;
    this.touch();
  }

  /** A human dropped. In a game, a bot keeps their seat warm until they return. */
  disconnect(member: Member): void {
    member.clientId = null;
    const seat = this.seatOf(member);
    if (this.game && seat !== null) {
      this.game.players[seat].botControlled = true;
    } else if (!this.game) {
      this.remove(member.id);
    }
    if (this.hostId === member.id) {
      const next = this.members.find((m) => !m.isBot && m.clientId);
      if (next) this.hostId = next.id;
    }
    this.touch();
  }

  // ------------------------------------------------------------ game

  setRules(input: Partial<Rules>): void {
    this.rules = sanitizeRules({ ...this.rules, ...input });
    this.touch();
  }

  start(): string | null {
    if (this.members.length < MIN_PLAYERS) return `Need at least ${MIN_PLAYERS} players`;
    if (this.members.length > MAX_PLAYERS) return `At most ${MAX_PLAYERS} players`;
    this.game = newGame(
      this.members.map((m) => ({ id: m.id, name: m.name, isBot: m.isBot, avatar: m.avatar })),
      this.rules,
      randomSeed(),
    );
    for (const m of this.members) {
      if (!m.isBot && !m.clientId) this.game.players[this.seatOf(m)!].botControlled = true;
    }
    this.touch();
    return null;
  }

  /** Back to the lobby after a finished game (keeps everyone seated). */
  backToLobby(): void {
    this.game = null;
    this.members = this.members.filter((m) => m.isBot || m.clientId);
    this.touch();
  }

  act(member: Member, action: Action): string | null {
    if (!this.game) return 'The game has not started';
    const seat = this.seatOf(member);
    if (seat === null) return 'You are not playing';
    return this.apply(seat, action);
  }

  private apply(seat: Seat, action: Action): string | null {
    const res = applyAction(this.game!, seat, action);
    if (!res.ok) return res.error;
    this.game = res.state;
    this.touch();
    return null;
  }

  private touch(): void {
    this.lastActivity = Date.now();
    this.scheduleBots();
    this.scheduleTurnTimer();
    this.broadcast();
    this.hooks.changed?.();
  }

  broadcast(): void {
    for (const m of this.members) {
      if (m.clientId) this.hooks.send(m, this.viewFor(m));
    }
  }

  viewFor(m: Member): RoomView {
    const players: LobbyPlayer[] = this.members.map((x) => ({
      id: x.id,
      name: x.name,
      isBot: x.isBot,
      avatar: x.avatar,
      connected: x.isBot || !!x.clientId,
    }));
    return {
      code: this.code,
      hostId: this.hostId,
      youId: m.id,
      players,
      rules: this.rules,
      game: this.game ? viewFor(this.game, this.seatOf(m)) : null,
      turnDeadline: this.turnDeadline,
    };
  }

  // ------------------------------------------------------------ bots & timers

  private isAutomated(seat: Seat): boolean {
    const p = this.game!.players[seat];
    return p.isBot || p.botControlled;
  }

  private nextBotMove(): { seat: Seat; action: Action } | null {
    const g = this.game;
    if (!g || g.phase === 'gameOver') return null;
    for (let seat = 0; seat < g.players.length; seat++) {
      if (!this.isAutomated(seat)) continue;
      const action = botAction(g, seat);
      if (action) return { seat, action };
    }
    return null;
  }

  private scheduleBots(): void {
    if (this.botTimer) return;
    const move = this.nextBotMove();
    if (!move) return;
    const t = move.action.type;
    const delay =
      t === 'ready' ? BOT_DELAY.ready : t === 'ride' || t === 'pass' ? BOT_DELAY.ride : this.game!.phase === 'reveal' ? BOT_DELAY.reveal : BOT_DELAY.turn;
    this.botTimer = setTimeout(() => {
      this.botTimer = null;
      const m = this.nextBotMove();
      if (!m) return;
      const err = this.apply(m.seat, m.action);
      if (err) console.error(`[${this.code}] bot ${m.seat} ${JSON.stringify(m.action)}: ${err}`);
    }, delay);
  }

  /** Seats a human is expected to act for right now. */
  private pendingHumans(): Seat[] {
    const g = this.game;
    if (!g) return [];
    const out: Seat[] = [];
    for (let s = 0; s < g.players.length; s++) {
      if (this.isAutomated(s)) continue;
      const a = botAction(g, s);
      if (a && a.type !== 'ready') out.push(s);
    }
    return out;
  }

  private scheduleTurnTimer(): void {
    const g = this.game;
    const secs = this.rules.turnTimer;
    const pending = secs > 0 && g && g.phase !== 'gameOver' ? this.pendingHumans() : [];
    const key = pending.length && g ? `${g.phase}|${g.turn}|${g.reveal?.current}|${g.reveal?.ride?.formationId}|${pending}` : '';
    if (key === this.timerKey) return;
    this.timerKey = key;
    if (this.turnTimer) clearTimeout(this.turnTimer);
    this.turnTimer = null;
    this.turnDeadline = null;
    if (!key) return;
    this.turnDeadline = Date.now() + secs * 1000;
    this.turnTimer = setTimeout(() => this.onTimeout(pending), secs * 1000);
  }

  /** Out of time: the bot logic finishes the move for whoever was too slow. */
  private onTimeout(seats: Seat[]): void {
    this.turnTimer = null;
    this.timerKey = '';
    for (const seat of seats) {
      for (let i = 0; i < 20 && this.game; i++) {
        const a = botAction(this.game, seat);
        if (!a || a.type === 'ready') break;
        if (this.apply(seat, a)) break;
      }
    }
  }

  /** Plain data to save and restore the room (e.g. across a host refresh). */
  snapshot(): RoomSnapshot {
    return { code: this.code, hostId: this.hostId, rules: this.rules, members: this.members, game: this.game };
  }

  static restore(snap: RoomSnapshot, hooks: RoomHooks): Room {
    const room = new Room(snap.code, hooks);
    room.hostId = snap.hostId;
    room.rules = snap.rules;
    // Everyone starts disconnected; bots cover for humans until they come back.
    room.members = snap.members.map((m) => ({ ...m, avatar: m.avatar ?? '', clientId: null }));
    room.game = snap.game;
    if (room.game) for (const p of room.game.players) if (!p.isBot) p.botControlled = true;
    return room;
  }

  /** Re-arms bots and timers after a restore. */
  resume(): void {
    this.touch();
  }

  dispose(): void {
    if (this.botTimer) clearTimeout(this.botTimer);
    if (this.turnTimer) clearTimeout(this.turnTimer);
  }
}
