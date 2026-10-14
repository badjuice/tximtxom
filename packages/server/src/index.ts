import fs from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sirv from 'sirv';
import { Server, type Socket } from 'socket.io';
import { type ClientToServer, NAME_MAX, ROOM_CODE_LENGTH, type ServerToClient } from '@tximtxom/shared';
import { type Member, Room } from './room.js';

const PORT = Number(process.env.PORT ?? 3001);
/** Rooms with no connected humans are closed after this long. */
const ROOM_IDLE_MS = 15 * 60 * 1000;
// No easily-confused letters (I, O, 0, 1).
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientDist = [path.resolve(here, '../../client/dist'), path.resolve(here, '../client')].find((p) =>
  fs.existsSync(path.join(p, 'index.html')),
);
const serveClient = clientDist ? sirv(clientDist, { single: true, gzip: true, brotli: true, maxAge: 3600 }) : null;

const http = createServer((req, res) => {
  if (req.url === '/healthz') {
    res.end('ok');
    return;
  }
  if (serveClient) {
    serveClient(req, res);
    return;
  }
  res.statusCode = 404;
  res.end('TximTxom server. Run the client with `npm run dev`.');
});

const io = new Server<ClientToServer, ServerToClient>(http, {
  cors: { origin: process.env.CORS_ORIGIN ?? true },
  pingInterval: 10000,
  pingTimeout: 8000,
});

const rooms = new Map<string, Room>();
const socketRoom = new Map<string, Room>();

function newCode(): string {
  for (;;) {
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    if (!rooms.has(code)) return code;
  }
}

function cleanName(name: unknown): string {
  const s = String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
  return s || 'Player';
}

function createRoom(): Room {
  const room = new Room(newCode(), {
    send: (m: Member, view) => {
      if (m.socketId) io.to(m.socketId).emit('room:state', view);
    },
  });
  rooms.set(room.code, room);
  return room;
}

function leave(socket: Socket): void {
  const room = socketRoom.get(socket.id);
  if (!room) return;
  socketRoom.delete(socket.id);
  const m = room.bySocket(socket.id);
  if (m) room.disconnect(m);
}

io.on('connection', (socket) => {
  const memberOf = (): { room: Room; member: Member } | null => {
    const room = socketRoom.get(socket.id);
    const member = room?.bySocket(socket.id);
    return room && member ? { room, member } : null;
  };

  socket.on('room:create', (msg, ack) => {
    leave(socket);
    const room = createRoom();
    room.setRules(msg?.rules ?? {});
    const m = room.addHuman(cleanName(msg?.name), socket.id);
    socketRoom.set(socket.id, room);
    ack({ ok: true, code: room.code, token: m.token, playerId: m.id });
    room.connect(m, socket.id);
  });

  socket.on('room:join', (msg, ack) => {
    const room = rooms.get(String(msg?.code ?? '').toUpperCase().trim());
    if (!room) return ack({ ok: false, error: 'Room not found' });
    leave(socket);
    let m = room.byToken(String(msg?.token ?? ''));
    if (m) {
      // Rejoining: kick any stale socket still holding the seat.
      if (m.socketId && m.socketId !== socket.id) {
        io.sockets.sockets.get(m.socketId)?.emit('room:closed', 'You joined from another tab');
        socketRoom.delete(m.socketId);
      }
    } else {
      if (room.game) return ack({ ok: false, error: 'That game has already started' });
      if (room.isFull) return ack({ ok: false, error: 'That room is full' });
      m = room.addHuman(cleanName(msg?.name), socket.id);
    }
    socketRoom.set(socket.id, room);
    ack({ ok: true, code: room.code, token: m.token, playerId: m.id });
    room.connect(m, socket.id);
  });

  socket.on('room:rules', (msg, ack) => {
    const ctx = memberOf();
    if (!ctx) return ack({ ok: false, error: 'Not in a room' });
    if (ctx.room.hostId !== ctx.member.id) return ack({ ok: false, error: 'Only the host can change rules' });
    if (ctx.room.game) return ack({ ok: false, error: 'The game has started' });
    ctx.room.setRules(msg?.rules ?? {});
    ack({ ok: true });
  });

  socket.on('room:addBot', (ack) => {
    const ctx = memberOf();
    if (!ctx) return ack({ ok: false, error: 'Not in a room' });
    if (ctx.room.hostId !== ctx.member.id) return ack({ ok: false, error: 'Only the host can add bots' });
    if (ctx.room.game) return ack({ ok: false, error: 'The game has started' });
    if (ctx.room.isFull) return ack({ ok: false, error: 'The room is full' });
    ctx.room.addBot();
    ctx.room.broadcast();
    ack({ ok: true });
  });

  socket.on('room:kick', (msg, ack) => {
    const ctx = memberOf();
    if (!ctx) return ack({ ok: false, error: 'Not in a room' });
    if (ctx.room.hostId !== ctx.member.id) return ack({ ok: false, error: 'Only the host can do that' });
    if (ctx.room.game) return ack({ ok: false, error: 'The game has started' });
    const target = ctx.room.members.find((m) => m.id === msg?.playerId);
    if (!target || target.id === ctx.member.id) return ack({ ok: false, error: 'Unknown player' });
    if (target.socketId) {
      io.sockets.sockets.get(target.socketId)?.emit('room:closed', 'The host removed you from the room');
      socketRoom.delete(target.socketId);
    }
    ctx.room.remove(target.id);
    ctx.room.broadcast();
    ack({ ok: true });
  });

  socket.on('room:start', (ack) => {
    const ctx = memberOf();
    if (!ctx) return ack({ ok: false, error: 'Not in a room' });
    if (ctx.room.hostId !== ctx.member.id) return ack({ ok: false, error: 'Only the host can start' });
    if (ctx.room.game && ctx.room.game.phase !== 'gameOver') return ack({ ok: false, error: 'Already playing' });
    if (ctx.room.game) {
      ctx.room.backToLobby();
      return ack({ ok: true });
    }
    const err = ctx.room.start();
    ack(err ? { ok: false, error: err } : { ok: true });
  });

  socket.on('room:leave', () => {
    const ctx = memberOf();
    leave(socket);
    // Leaving on purpose before the game starts frees the seat.
    if (ctx && !ctx.room.game) ctx.room.remove(ctx.member.id);
    ctx?.room.broadcast();
  });

  socket.on('game:action', (action, ack) => {
    const ctx = memberOf();
    if (!ctx) return ack?.({ ok: false, error: 'Not in a room' });
    if (!action || typeof action !== 'object' || typeof action.type !== 'string') return ack?.({ ok: false, error: 'Bad action' });
    const err = ctx.room.act(ctx.member, action);
    ack?.(err ? { ok: false, error: err } : { ok: true });
  });

  socket.on('game:history', (ack) => {
    const ctx = memberOf();
    if (!ctx?.room.game) return ack({ ok: false, error: 'No game' });
    ack({ ok: true, events: ctx.room.game.events });
  });

  socket.on('disconnect', () => leave(socket));
});

setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (room.humansConnected === 0 && now - room.lastActivity > ROOM_IDLE_MS) {
      room.dispose();
      rooms.delete(code);
    }
  }
}, 60 * 1000).unref();

http.listen(PORT, () => {
  console.log(`TximTxom server on http://localhost:${PORT}${clientDist ? ` (serving ${clientDist})` : ''}`);
});
