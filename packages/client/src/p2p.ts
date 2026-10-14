// Peer-to-peer play: the player who creates a room runs it in their browser
// (RoomServer from @tximtxom/shared) and the others connect to them over
// WebRTC. PeerJS's public broker only introduces the browsers; game traffic
// goes directly between them.
import Peer, { type DataConnection } from 'peerjs';
import { type Request, type RoomSnapshot, RoomServer, type RoomView } from '@tximtxom/shared';

export type Result = { ok: true; [k: string]: unknown } | { ok: false; error: string };

/** Messages over the data channel. */
type Wire =
  | { t: 'req'; id: number; req: Request }
  | { t: 'res'; id: number; res: Result }
  | { t: 'state'; view: RoomView }
  | { t: 'closed'; reason: string };

export interface P2PEvents {
  state(view: RoomView): void;
  closed(reason: string): void;
  connection(up: boolean): void;
}

const PREFIX = 'tximtxom-v1-';
const LOCAL = 'local';
const SAVE_KEY = 'tximtxom.hostRoom';

export const peerIdFor = (code: string) => PREFIX + code;

/** Broker errors worth retrying: its WebSocket failed or dropped. */
const TRANSIENT = new Set(['network', 'server-error', 'socket-error', 'socket-closed', 'disconnected']);

/** Connects to the PeerJS broker, retrying brief outages (up to 4 tries). */
async function openPeer(id?: string): Promise<Peer> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await openPeerOnce(id);
    } catch (err) {
      const type = (err as { type?: string }).type ?? '';
      if (!TRANSIENT.has(type) || attempt >= 4) throw err;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

function openPeerOnce(id?: string): Promise<Peer> {
  return new Promise((resolve, reject) => {
    const peer = id ? new Peer(id, { debug: 1 }) : new Peer({ debug: 1 });
    const onError = (err: { type?: string }) => {
      peer.off('open', onOpen);
      peer.destroy();
      reject(err);
    };
    const onOpen = () => {
      peer.off('error', onError);
      resolve(peer);
    };
    peer.once('open', onOpen);
    peer.once('error', onError);
  });
}

// ------------------------------------------------------------------ host

/** Runs a room in this browser and accepts guests. */
export class Host {
  private server: RoomServer;
  private conns = new Map<string, DataConnection>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor(
    private peer: Peer,
    readonly code: string,
    events: P2PEvents,
  ) {
    this.server = new RoomServer(
      {
        send: (clientId, view) => (clientId === LOCAL ? events.state(view) : this.post(clientId, { t: 'state', view })),
        closed: (clientId, reason) => (clientId === LOCAL ? events.closed(reason) : this.post(clientId, { t: 'closed', reason })),
        changed: () => this.scheduleSave(),
      },
      () => code,
    );
    peer.on('connection', (conn) => this.accept(conn));
    // The broker connection can drop (e.g. phone asleep); guests already
    // connected keep playing, and we reconnect so new guests can find us.
    peer.on('disconnected', () => setTimeout(() => !peer.destroyed && peer.reconnect(), 1000));
  }

  /** Starts hosting under a fresh room code. */
  static async create(events: P2PEvents, makeCode: () => string): Promise<Host> {
    for (let tries = 0; ; tries++) {
      const code = makeCode();
      try {
        const peer = await openPeer(peerIdFor(code));
        return new Host(peer, code, events);
      } catch (err) {
        if ((err as { type?: string }).type !== 'unavailable-id' || tries > 5) throw err;
      }
    }
  }

  /** Brings a saved room back after a refresh. The old peer id may take a moment to free up. */
  static async resume(events: P2PEvents): Promise<Host | null> {
    const saved = loadSaved();
    if (!saved) return null;
    for (let tries = 0; ; tries++) {
      try {
        const peer = await openPeer(peerIdFor(saved.code));
        const host = new Host(peer, saved.code, events);
        host.server.restore(saved);
        return host;
      } catch (err) {
        if ((err as { type?: string }).type !== 'unavailable-id' || tries > 20) throw err;
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  /** Requests from this browser's own player. */
  request(req: Request): Result {
    return this.server.handle(LOCAL, req) as Result;
  }

  private accept(conn: DataConnection): void {
    const clientId = `${conn.peer}:${conn.connectionId}`;
    conn.on('open', () => this.conns.set(clientId, conn));
    conn.on('data', (raw) => {
      const msg = raw as Wire;
      if (msg?.t !== 'req') return;
      const res = this.server.handle(clientId, msg.req) as Result;
      conn.send({ t: 'res', id: msg.id, res } satisfies Wire);
    });
    const drop = () => {
      this.conns.delete(clientId);
      this.server.disconnect(clientId);
    };
    conn.on('close', drop);
    conn.on('error', drop);
  }

  private post(clientId: string, msg: Wire): void {
    const conn = this.conns.get(clientId);
    if (conn?.open) conn.send(msg);
  }

  private scheduleSave(): void {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      const room = this.server.rooms.get(this.code);
      if (room) localStorage.setItem(SAVE_KEY, JSON.stringify(room.snapshot()));
    }, 300);
  }

  /** Is a game running that guests depend on? */
  get busy(): boolean {
    const room = this.server.rooms.get(this.code);
    return !!room?.game && room.game.phase !== 'gameOver' && room.members.some((m) => !m.isBot && m.clientId && m.clientId !== LOCAL);
  }

  /** Ends the room for everyone. */
  close(reason: string): void {
    for (const conn of this.conns.values()) {
      if (conn.open) conn.send({ t: 'closed', reason } satisfies Wire);
    }
    localStorage.removeItem(SAVE_KEY);
    this.server.rooms.get(this.code)?.dispose();
    setTimeout(() => this.peer.destroy(), 300);
  }
}

function loadSaved(): RoomSnapshot | null {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null');
  } catch {
    return null;
  }
}

export function hasSavedHostRoom(code: string): boolean {
  return loadSaved()?.code === code;
}

// ------------------------------------------------------------------ guest

/** Connects to a host's room. Reconnects by itself if the link drops. */
export class Guest {
  private conn: DataConnection | null = null;
  private nextId = 1;
  private pending = new Map<number, (r: Result) => void>();
  private stopped = false;
  /** Called after every (re)connection, to rejoin the room. */
  onReconnect: () => void = () => {};

  private constructor(
    private peer: Peer,
    readonly code: string,
    private events: P2PEvents,
  ) {
    peer.on('disconnected', () => setTimeout(() => !peer.destroyed && peer.reconnect(), 1000));
  }

  static async connect(code: string, events: P2PEvents): Promise<Guest> {
    const peer = await openPeer();
    const guest = new Guest(peer, code, events);
    await guest.open();
    return guest;
  }

  private open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const conn = this.peer.connect(peerIdFor(this.code), { reliable: true, serialization: 'json' });
      const fail = (err: { type?: string }) => {
        this.peer.off('error', fail);
        reject(err.type === 'peer-unavailable' ? new Error('Room not found (is the host online?)') : err);
      };
      this.peer.once('error', fail);
      const timer = setTimeout(() => fail({ type: 'peer-unavailable' }), 15000);
      conn.on('open', () => {
        clearTimeout(timer);
        this.peer.off('error', fail);
        this.conn = conn;
        this.events.connection(true);
        resolve();
      });
      conn.on('data', (raw) => this.onData(raw as Wire));
      conn.on('close', () => this.onDrop(conn));
      conn.on('error', () => this.onDrop(conn));
    });
  }

  private onData(msg: Wire): void {
    if (msg.t === 'res') {
      this.pending.get(msg.id)?.(msg.res);
      this.pending.delete(msg.id);
    } else if (msg.t === 'state') {
      this.events.state(msg.view);
    } else if (msg.t === 'closed') {
      this.stop();
      this.events.closed(msg.reason);
    }
  }

  private onDrop(conn: DataConnection): void {
    // Ignore failed attempts closing late; only the live connection matters.
    if (this.stopped || conn !== this.conn) return;
    this.conn = null;
    this.events.connection(false);
    for (const resolve of this.pending.values()) resolve({ ok: false, error: 'Lost connection to the host' });
    this.pending.clear();
    void this.retry();
  }

  /** Keeps trying to reach the host (they may be refreshing their page). */
  private async retry(): Promise<void> {
    for (let i = 0; !this.stopped && i < 120; i++) {
      await new Promise((r) => setTimeout(r, 2500));
      if (this.stopped) return;
      try {
        await this.open();
        this.onReconnect();
        return;
      } catch {
        /* keep trying */
      }
    }
    if (!this.stopped) this.events.closed('The host is gone');
  }

  request(req: Request): Promise<Result> {
    const conn = this.conn;
    if (!conn?.open) return Promise.resolve({ ok: false, error: 'Not connected to the host' });
    const id = this.nextId++;
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        resolve({ ok: false, error: 'No answer from the host' });
      }, 10000);
      this.pending.set(id, (r) => {
        clearTimeout(timer);
        resolve(r);
      });
      conn.send({ t: 'req', id, req } satisfies Wire);
    });
  }

  stop(): void {
    this.stopped = true;
    this.conn?.close();
    setTimeout(() => this.peer.destroy(), 300);
  }
}

