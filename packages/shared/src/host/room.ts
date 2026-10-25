import { botAction } from '../bot.js';
import { cardPoints } from '../cards.js';
import { applyAction, newGame } from '../engine.js';
import type { LobbyPlayer, RoomView } from '../protocol.js';
import { randomSeed } from '../rng.js';
import { BOT_PERSONAS, DEFAULT_RULES, HUMAN_JOKERS, MAX_PLAYERS, MIN_PLAYERS, type Rules, sanitizeRules } from '../rules.js';
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

/** A room closes when no human has done anything for this long. Bots don't count. */
export const ROOM_IDLE_MS = 10 * 60 * 1000;
export const IDLE_REASON = 'Nobody played for 10 minutes';

/**
 * A turn played for someone whose time ran out: the least it takes to pass the
 * turn on. Draw, then let the drawn card go; never Txi jog or TximTxom for them,
 * unless the rules force the round to end (the draw pile ran out).
 */
function timeoutMove(g: GameState, seat: Seat): Action | null {
  if (g.turn !== seat) return null;
  if (g.step === 'choose') return { type: 'draw' };
  if (g.step === 'drawn') return g.mustEnd ? { type: 'endRound', card: g.drawn! } : { type: 'discardDrawn' };
  // Took the discard top: let go of the highest-scoring other card.
  const out = g.players[seat].hand.filter((c) => c !== g.taken).sort((a, b) => cardPoints(b) - cardPoints(a))[0];
  return out === undefined ? null : { type: 'swap', card: out };
}

/** How long bots "think" before acting (ms). */
const BOT_DELAY = { turn: 900, reveal: 700, ride: 600, ready: 400 };
/**
 * A fresh deal plays out on screen first (old cards burn, the new deck appears,
 * every card is dealt, the first discard turns up): a bot opening the round waits for it.
 */
const dealMs = (players: number) => 2600 + players * 7 * 70 + 500;

export interface Member {
  id: string;
  token: string;
  name: string;
  isBot: boolean;
  /** Joker art. */
  avatar: string;
  clientId: string | null;
  /** Games won in this room. Missing in old saves. */
  wins?: number;
  /** Said they're ready, in the lobby. */
  ready?: boolean;
}

/** One line of the host's action log, kept for bug reports. */
export interface LogEntry {
  at: number;
  /** Who did it: a seat's move, or a player joining/leaving. */
  seat?: Seat;
  name?: string;
  what: string;
  /** Made by a bot: a bot player, a bot covering a disconnected human, or the turn timer. */
  auto?: boolean;
  /** Rejected moves, with the engine's reason. */
  error?: string;
}

const LOG_MAX = 600;

export interface RoomSnapshot {
  code: string;
  hostId: string;
  rules: Rules;
  members: Member[];
  game: GameState | null;
  /** When a human last did something (ms since epoch). Missing in old saves. */
  lastHumanActivity?: number;
  log?: LogEntry[];
}

/** A saved room nobody has touched for ROOM_IDLE_MS should not come back. */
export function isExpired(snap: RoomSnapshot, now = Date.now()): boolean {
  return now - (snap.lastHumanActivity ?? 0) >= ROOM_IDLE_MS;
}

export interface RoomHooks {
  /** Push the latest view to one member. */
  send(member: Member, view: RoomView): void;
  /** Called after every change (used to save the room). */
  changed?(): void;
  /** No human activity for ROOM_IDLE_MS: the room should close. */
  expired?(): void;
}

export class Room {
  readonly code: string;
  hostId: string;
  rules: Rules = { ...DEFAULT_RULES };
  members: Member[] = [];
  game: GameState | null = null;
  turnDeadline: number | null = null;
  lastHumanActivity = Date.now();
  /** Moves, connections and rejected moves of this room, newest last. */
  log: LogEntry[] = [];

  private botTimer: Timer | null = null;
  private idleTimer: Timer | null = null;
  private turnTimer: Timer | null = null;
  private timerKey = '';

  constructor(code: string, private hooks: RoomHooks) {
    this.code = code;
    this.hostId = '';
    this.armIdle();
  }

  /** A human clicked, typed or made a move. */
  markHumanActive(): void {
    this.lastHumanActivity = Date.now();
    this.armIdle();
  }

  private armIdle(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    const wait = Math.max(0, this.lastHumanActivity + ROOM_IDLE_MS - Date.now());
    this.idleTimer = setTimeout(() => {
      this.idleTimer = null;
      if (Date.now() - this.lastHumanActivity >= ROOM_IDLE_MS) this.hooks.expired?.();
      else this.armIdle();
    }, wait);
  }

  // ------------------------------------------------------------ membership

  /** The next entry after `current` whose art nobody at the table uses yet. */
  private nextFree<T>(list: readonly T[], art: (x: T) => string, current = ''): T | null {
    const used = new Set(this.members.map((m) => m.avatar));
    const start = list.findIndex((x) => art(x) === current);
    for (let i = 1; i <= list.length; i++) {
      const x = list[(start + i + list.length) % list.length];
      if (!used.has(art(x))) return x;
    }
    return null;
  }

  /** Bots are the dungeon characters from BOT_PERSONAS. */
  private freePersona(current = '') {
    return this.nextFree(BOT_PERSONAS, (p) => p.avatar, current);
  }

  /** Humans pick from their own set of characters. */
  private freeHumanArt(current = ''): string | null {
    return this.nextFree(HUMAN_JOKERS, (a) => a, current);
  }

  /** `preferred` is the character this player used last time; they get it back if nobody has it. */
  addHuman(name: string, clientId: string, preferred?: string): Member {
    const known = (HUMAN_JOKERS as readonly string[]).includes(preferred ?? '');
    const taken = this.members.some((x) => x.avatar === preferred);
    const art = known && !taken ? preferred! : (this.freeHumanArt() ?? 'villager');
    const m: Member = { id: randomId(8), token: randomId(18), name, isBot: false, avatar: art, clientId };
    this.members.push(m);
    if (!this.hostId) this.hostId = m.id;
    return m;
  }

  addBot(): Member {
    // The next bot character not already at the table.
    const persona = this.freePersona() ?? BOT_PERSONAS[0];
    const m: Member = { id: randomId(8), token: '', name: persona.name, isBot: true, avatar: persona.avatar, clientId: null };
    this.members.push(m);
    return m;
  }

  rename(id: string, name: string): boolean {
    const m = this.members.find((x) => x.id === id);
    if (!m) return false;
    m.name = name;
    this.touch();
    return true;
  }

  /** Moves a member to the next character nobody else has. Bots take that character's name too. */
  cycleAvatar(id: string): boolean {
    const m = this.members.find((x) => x.id === id);
    if (!m) return false;
    if (m.isBot) {
      const next = this.freePersona(m.avatar);
      if (!next) return false;
      m.avatar = next.avatar;
      m.name = next.name;
    } else {
      const next = this.freeHumanArt(m.avatar);
      if (!next) return false;
      m.avatar = next;
    }
    this.touch();
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
  private record(e: Omit<LogEntry, 'at'>): void {
    this.log.push({ at: Date.now(), ...e });
    if (this.log.length > LOG_MAX) this.log.splice(0, this.log.length - LOG_MAX);
  }

  connect(member: Member, clientId: string): void {
    this.record({ name: member.name, what: 'connect' });
    member.clientId = clientId;
    const seat = this.seatOf(member);
    if (this.game && seat !== null) this.game.players[seat].botControlled = false;
    if (!this.members.some((m) => m.id === this.hostId && m.clientId)) this.hostId = member.id;
    this.lastHumanActivity = Date.now();
    this.armIdle();
    this.touch();
  }

  /** A human dropped. In a game, a bot keeps their seat warm until they return. */
  disconnect(member: Member): void {
    this.record({ name: member.name, what: 'disconnect' });
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

  /** Bots and the host don't need to say so; everyone else does. */
  isReady(m: Member): boolean {
    return m.isBot || m.id === this.hostId || !!m.ready;
  }

  start(): string | null {
    if (this.members.length < MIN_PLAYERS) return `Need at least ${MIN_PLAYERS} players`;
    if (!this.members.every((m) => this.isReady(m))) return 'Not everyone is ready';
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

  /** Straight into a new game after one ends, with whoever is still here. */
  playAgain(): string | null {
    this.game = null;
    this.members = this.members.filter((m) => m.isBot || m.clientId);
    // Everyone at the table was just playing: they count as ready.
    for (const m of this.members) m.ready = true;
    return this.start();
  }

  /** Back to the lobby after a finished game (keeps everyone seated). */
  backToLobby(): void {
    this.game = null;
    this.members = this.members.filter((m) => m.isBot || m.clientId);
    for (const m of this.members) m.ready = false;
    this.touch();
  }

  act(member: Member, action: Action): string | null {
    if (!this.game) return 'The game has not started';
    const seat = this.seatOf(member);
    if (seat === null) return 'You are not playing';
    return this.apply(seat, action, false);
  }

  private apply(seat: Seat, action: Action, auto: boolean): string | null {
    const before = this.game!.phase;
    const res = applyAction(this.game!, seat, action);
    this.record({ seat, what: JSON.stringify(action), auto: auto || undefined, error: res.ok ? undefined : res.error });
    if (!res.ok) return res.error;
    this.game = res.state;
    if (before !== 'gameOver' && this.game.phase === 'gameOver') {
      // Every winner (all of them on a tie) gets a win.
      for (const s of this.game.winners) {
        const m = this.members.find((x) => x.id === this.game!.players[s].id);
        if (m) m.wins = (m.wins ?? 0) + 1;
      }
    }
    this.touch();
    return null;
  }

  private touch(): void {
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
      wins: x.wins ?? 0,
      ready: this.isReady(x),
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
    const g = this.game!;
    const justDealt = g.events.at(-1)?.e.t === 'deal';
    const delay =
      t === 'ready'
        ? BOT_DELAY.ready
        : t === 'ride' || t === 'pass'
          ? BOT_DELAY.ride
          : g.phase === 'reveal'
            ? BOT_DELAY.reveal
            : BOT_DELAY.turn + (justDealt ? dealMs(g.players.length) : 0);
    this.botTimer = setTimeout(() => {
      this.botTimer = null;
      const m = this.nextBotMove();
      if (!m) return;
      const err = this.apply(m.seat, m.action, true);
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
        const a = this.game.phase === 'playing' ? timeoutMove(this.game, seat) : botAction(this.game, seat);
        if (!a || a.type === 'ready') break;
        if (this.apply(seat, a, true)) break;
      }
    }
  }

  /** Plain data to save and restore the room (e.g. across a host refresh). */
  snapshot(): RoomSnapshot {
    return { code: this.code, hostId: this.hostId, rules: this.rules, members: this.members, game: this.game, lastHumanActivity: this.lastHumanActivity, log: this.log };
  }

  static restore(snap: RoomSnapshot, hooks: RoomHooks): Room {
    const room = new Room(snap.code, hooks);
    room.hostId = snap.hostId;
    room.rules = snap.rules;
    // Everyone starts disconnected; bots cover for humans until they come back.
    room.members = snap.members.map((m) => ({ ...m, avatar: m.avatar ?? '', clientId: null }));
    room.game = snap.game;
    room.lastHumanActivity = snap.lastHumanActivity ?? 0;
    room.log = snap.log ?? [];
    room.record({ what: 'restored after a host refresh' });
    room.armIdle();
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
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.botTimer = this.turnTimer = this.idleTimer = null;
  }
}
