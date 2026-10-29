// Optional dedicated server. The GitHub Pages build doesn't use it (the room
// creator's browser hosts the game), but `npm run dev:server` and Docker
// deployments do. All room logic lives in @tximtxom/shared (RoomServer).
import fs from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sirv from 'sirv';
import { Server } from 'socket.io';
import { type ClientToServer, type Request, RoomServer, type ServerToClient } from '@tximtxom/shared';

const PORT = Number(process.env.PORT ?? 3001);

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

const server = new RoomServer({
  send: (clientId, view) => io.to(clientId).emit('room:state', view),
  closed: (clientId, reason) => io.sockets.sockets.get(clientId)?.emit('room:closed', reason),
});

// Every client event maps 1:1 onto a RoomServer request.
const EVENTS = ['room:create', 'room:join', 'room:rules', 'room:addBot', 'room:kick', 'room:rename', 'room:avatar', 'room:start', 'room:ready', 'room:again', 'room:debug', 'room:leave', 'room:ping', 'room:infected', 'game:action', 'game:history'] as const;

io.on('connection', (socket) => {
  for (const event of EVENTS) {
    socket.on(event, (...args: unknown[]) => {
      const ack = typeof args.at(-1) === 'function' ? (args.pop() as (r: unknown) => void) : undefined;
      const res = server.handle(socket.id, { event, msg: args[0] } as Request);
      ack?.(res);
    });
  }
  socket.on('disconnect', () => server.disconnect(socket.id));
});

http.listen(PORT, () => {
  console.log(`TximTxom server on http://localhost:${PORT}${clientDist ? ` (serving ${clientDist})` : ''}`);
});
