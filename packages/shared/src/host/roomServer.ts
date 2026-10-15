// Handles client requests for one or more rooms. Transport-agnostic: the Node
// server feeds it Socket.IO messages, and in peer-to-peer mode the host's
// browser feeds it WebRTC messages (and its own player's calls directly).
import type { Action } from '../types.js';
import type { ClientToServer, JoinResult, RoomView } from '../protocol.js';
import { NAME_MAX, ROOM_CODE_LENGTH } from '../protocol.js';
import type { GameEvent } from '../types.js';
import { IDLE_REASON, isExpired, type Member, Room, type RoomSnapshot } from './room.js';

// No easily-confused letters (I, O).
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

export function randomCode(): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return code;
}

export interface ServerHooks {
  /** Push a room view to one client. */
  send(clientId: string, view: RoomView): void;
  /** Tell a client it was removed (kicked, or replaced by another tab). */
  closed(clientId: string, reason: string): void;
  /** Called after any change, e.g. to save state. */
  changed?(): void;
  /** A room closed by itself (nobody played for a while). */
  roomClosed?(code: string): void;
}

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export type Request =
  | { event: 'room:create'; msg: Parameters<ClientToServer['room:create']>[0] }
  | { event: 'room:join'; msg: Parameters<ClientToServer['room:join']>[0] }
  | { event: 'room:rules'; msg: Parameters<ClientToServer['room:rules']>[0] }
  | { event: 'room:addBot' }
  | { event: 'room:kick'; msg: Parameters<ClientToServer['room:kick']>[0] }
  | { event: 'room:rename'; msg: Parameters<ClientToServer['room:rename']>[0] }
  | { event: 'room:avatar'; msg: Parameters<ClientToServer['room:avatar']>[0] }
  | { event: 'room:start' }
  | { event: 'room:again' }
  | { event: 'room:debug' }
  | { event: 'room:leave' }
  | { event: 'room:ping' }
  | { event: 'game:action'; msg: Action }
  | { event: 'game:history' };

function cleanName(name: unknown): string {
  const s = String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
  return s || 'Player';
}

export class RoomServer {
  readonly rooms = new Map<string, Room>();
  private clientRoom = new Map<string, Room>();

  constructor(
    private hooks: ServerHooks,
    /** Picks the code for a new room (peer-to-peer hosts use a fixed one). */
    private newCode: () => string = () => {
      for (;;) {
        const c = randomCode();
        if (!this.rooms.has(c)) return c;
      }
    },
  ) {}

  private roomHooks(code: string) {
    return {
      send: (m: Member, view: RoomView) => {
        if (m.clientId) this.hooks.send(m.clientId, view);
      },
      changed: () => this.hooks.changed?.(),
      expired: () => {
        const room = this.rooms.get(code);
        if (room) this.closeRoom(room, IDLE_REASON);
      },
    };
  }

  private makeRoom(code: string): Room {
    const room = new Room(code, this.roomHooks(code));
    this.rooms.set(code, room);
    return room;
  }

  /** Restores a saved room (peer-to-peer host refreshed the page). Stale rooms stay closed. */
  restore(snap: RoomSnapshot): Room | null {
    if (isExpired(snap)) return null;
    const room = Room.restore(snap, this.roomHooks(snap.code));
    this.rooms.set(room.code, room);
    room.resume();
    return room;
  }

  private ctx(clientId: string): { room: Room; member: Member } | null {
    const room = this.clientRoom.get(clientId);
    const member = room?.byClient(clientId);
    return room && member ? { room, member } : null;
  }

  /** Ends a room and sends everyone in it back to the title screen. */
  closeRoom(room: Room, reason: string): void {
    for (const m of room.members) {
      if (!m.clientId) continue;
      this.hooks.closed(m.clientId, reason);
      this.clientRoom.delete(m.clientId);
      m.clientId = null;
    }
    room.dispose();
    this.rooms.delete(room.code);
    this.hooks.roomClosed?.(room.code);
  }

  /** A client went away (socket closed / peer connection dropped). */
  disconnect(clientId: string): void {
    const room = this.clientRoom.get(clientId);
    if (!room) return;
    this.clientRoom.delete(clientId);
    const m = room.byClient(clientId);
    if (m) room.disconnect(m);
  }

  handle(clientId: string, req: Request): Result<JoinResult> | Result<{ events: { id: number; e: GameEvent }[] }> | Result<{ log: unknown[]; state: unknown; members: unknown[] }> | Result {
    // Anything a human sends counts as activity (create/join count via Room.connect).
    this.ctx(clientId)?.room.markHumanActive();
    switch (req.event) {
      case 'room:ping':
        return this.ctx(clientId) ? { ok: true } : { ok: false, error: 'Not in a room' };
      case 'room:create': {
        this.disconnect(clientId);
        const room = this.makeRoom(this.newCode());
        room.setRules(req.msg?.rules ?? {});
        const m = room.addHuman(cleanName(req.msg?.name), clientId);
        this.clientRoom.set(clientId, room);
        room.connect(m, clientId);
        return { ok: true, code: room.code, token: m.token, playerId: m.id };
      }
      case 'room:join': {
        const room = this.rooms.get(String(req.msg?.code ?? '').toUpperCase().trim());
        if (!room) return { ok: false, error: 'Room not found' };
        let m = room.byToken(String(req.msg?.token ?? ''));
        if (m) {
          // Rejoining: drop any stale connection still holding the seat.
          if (m.clientId && m.clientId !== clientId) {
            this.hooks.closed(m.clientId, 'You joined from another tab');
            this.clientRoom.delete(m.clientId);
          }
        } else {
          if (room.game) return { ok: false, error: 'That game has already started' };
          if (room.isFull) return { ok: false, error: 'That room is full' };
          m = room.addHuman(cleanName(req.msg?.name), clientId);
        }
        this.clientRoom.set(clientId, room);
        room.connect(m, clientId);
        return { ok: true, code: room.code, token: m.token, playerId: m.id };
      }
      case 'room:leave': {
        const c = this.ctx(clientId);
        this.disconnect(clientId);
        // Leaving on purpose before the game starts frees the seat.
        if (c && !c.room.game) c.room.remove(c.member.id);
        c?.room.broadcast();
        return { ok: true };
      }
      case 'game:action': {
        const c = this.ctx(clientId);
        if (!c) return { ok: false, error: 'Not in a room' };
        const a = req.msg;
        if (!a || typeof a !== 'object' || typeof a.type !== 'string') return { ok: false, error: 'Bad action' };
        const err = c.room.act(c.member, a);
        return err ? { ok: false, error: err } : { ok: true };
      }
      case 'room:debug': {
        // Only once the game is over: the full state shows everyone's cards.
        const c = this.ctx(clientId);
        if (!c) return { ok: false, error: 'Not in a room' };
        if (c.room.game && c.room.game.phase !== 'gameOver') return { ok: false, error: 'The game is not over' };
        const members = c.room.members.map((m) => ({ id: m.id, name: m.name, isBot: m.isBot, connected: !!m.clientId, wins: m.wins ?? 0 }));
        return { ok: true, log: c.room.log, state: c.room.game, members };
      }
      case 'game:history': {
        const c = this.ctx(clientId);
        if (!c?.room.game) return { ok: false, error: 'No game' };
        return { ok: true, events: c.room.game.events };
      }
    }

    // Host-only lobby requests.
    const c = this.ctx(clientId);
    if (!c) return { ok: false, error: 'Not in a room' };
    const { room, member } = c;

    // Your own name and art, or (host only) a bot's.
    if (req.event === 'room:rename' || req.event === 'room:avatar') {
      if (room.game) return { ok: false, error: 'The game has started' };
      const target = room.members.find((x) => x.id === req.msg?.playerId);
      if (!target) return { ok: false, error: 'Unknown player' };
      if (target.id !== member.id && !(target.isBot && room.hostId === member.id)) return { ok: false, error: 'Only the host can do that' };
      if (req.event === 'room:rename') room.rename(target.id, cleanName(req.msg?.name));
      else room.cycleAvatar(target.id);
      return { ok: true };
    }

    if (room.hostId !== member.id) return { ok: false, error: 'Only the host can do that' };
    switch (req.event) {
      case 'room:rules':
        if (room.game) return { ok: false, error: 'The game has started' };
        room.setRules(req.msg?.rules ?? {});
        return { ok: true };
      case 'room:addBot':
        if (room.game) return { ok: false, error: 'The game has started' };
        if (room.isFull) return { ok: false, error: 'The room is full' };
        room.addBot();
        room.broadcast();
        return { ok: true };
      case 'room:kick': {
        if (room.game) return { ok: false, error: 'The game has started' };
        const target = room.members.find((x) => x.id === req.msg?.playerId);
        if (!target || target.id === member.id) return { ok: false, error: 'Unknown player' };
        if (target.clientId) {
          this.hooks.closed(target.clientId, 'The host removed you from the room');
          this.clientRoom.delete(target.clientId);
        }
        room.remove(target.id);
        room.broadcast();
        return { ok: true };
      }
      case 'room:again': {
        if (room.game?.phase !== 'gameOver') return { ok: false, error: 'The game is not over' };
        const err = room.playAgain();
        return err ? { ok: false, error: err } : { ok: true };
      }
      case 'room:start': {
        if (room.game && room.game.phase !== 'gameOver') return { ok: false, error: 'Already playing' };
        if (room.game) {
          room.backToLobby();
          return { ok: true };
        }
        const err = room.start();
        return err ? { ok: false, error: err } : { ok: true };
      }
    }
  }
}
