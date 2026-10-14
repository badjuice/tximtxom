import { useEffect, useState } from 'preact/hooks';
import { type GameView, handPoints, type RoomView } from '@tximtxom/shared';
import { computeBar, sortHand } from '../controller';
import type { Layout, Point } from '../game/layout';
import { revealGroups } from '../game/scene';
import { leaveRoom, startGame } from '../net';
import { updateSettings, useSettings } from '../settings';
import { store, useStore } from '../store';
import { Button } from './common';
import { CardIcon, JokerIcon } from './sprites';

function toScreen(L: Layout, p: Point) {
  return { left: `${L.offsetX + p.x * L.scale}px`, top: `${L.offsetY + p.y * L.scale}px` };
}

const KIND_LABEL: Record<string, string> = { pair: 'Pair', trio: 'Trio', quad: 'Quad', straight: 'Straight' };

export function Hud() {
  const room = useStore((s) => s.room)!;
  const L = useStore((s) => s.layout);
  const g = room.game!;
  if (!L) return null;
  return (
    <div class="hud">
      <TopBar g={g} />
      {g.players.map((_, seat) => (
        <Plate g={g} room={room} seat={seat} L={L} />
      ))}
      <PileInfo g={g} L={L} />
      {(g.phase === 'reveal' || g.phase === 'roundOver') && <FormationLabels g={g} L={L} />}
      <ActionBar />
      {g.phase === 'roundOver' && <RoundSummary g={g} />}
      {g.phase === 'gameOver' && <GameOver g={g} room={room} />}
    </div>
  );
}

function TopBar({ g }: { g: GameView }) {
  const open = (overlay: 'scoreboard' | 'formations' | 'settings' | 'help') => store.set({ overlay });
  const { historyOpen } = useSettings();
  return (
    <nav class="topbar" aria-label="Game menu">
      <div class="round-chip" aria-label={`Round ${g.round}. Bust over ${g.rules.threshold}.`}>
        <span class="muted">Round</span> <b>{g.round}</b>
        <span class="muted"> · bust &gt;</span> <b>{g.rules.threshold}</b>
        {g.rules.hardcore && <JokerIcon name="trio" scale={0.22} title="Hardcore: no pairs" />}
        {g.rules.superposition && <JokerIcon name="superposition" scale={0.22} title="Superposition: Ace high or low" />}
      </div>
      <div class="topbar-buttons">
        <Button color="red" onClick={() => open('scoreboard')} kbd="S" title="Scoreboard">
          Scores
        </Button>
        <Button color="blue" onClick={() => open('formations')} kbd="F" title="Formations">
          Formations
        </Button>
        <Button
          color="purple"
          onClick={() => updateSettings({ historyOpen: !historyOpen })}
          kbd="H"
          title="Move history"
          class={historyOpen ? 'pressed' : ''}
        >
          History
        </Button>
        <Button color="grey" onClick={() => open('help')} title="How to play">
          ?
        </Button>
        <Button color="orange" onClick={() => open('settings')} title="Settings">
          ⚙
        </Button>
      </div>
    </nav>
  );
}

function Plate({ g, room, seat, L }: { g: GameView; room: RoomView; seat: number; L: Layout }) {
  const p = g.players[seat];
  const me = seat === g.you;
  const lobby = room.players.find((x) => x.id === p.id);
  const offline = lobby ? !lobby.connected : false;
  const active =
    (g.phase === 'playing' && g.turn === seat) ||
    (g.phase === 'reveal' && g.reveal && !g.reveal.ride && g.reveal.order[g.reveal.current] === seat);
  const ride = g.reveal?.ride;
  let chip: string | null = null;
  if (ride && ride.riders.includes(seat)) {
    if (p.handCount === 0) chip = 'out of cards';
    else if (g.rules.rideOrder === 'roundRobin') chip = ride.riders[ride.rrIndex] === seat ? 'riding…' : 'waiting';
    else chip = ride.passed.includes(seat) ? 'passed' : 'riding…';
  }
  if (g.phase === 'roundOver' && p.ready) chip = 'ready';
  const result = g.results.at(-1);
  const pos = L.seats[seat]?.plate;
  if (!pos) return null;
  const danger = p.total > g.rules.threshold * 0.75;
  return (
    <div
      class={`plate${active ? ' active' : ''}${me ? ' me' : ''}${offline ? ' offline' : ''}`}
      style={toScreen(L, pos)}
      aria-label={`${me ? 'You' : p.name}: ${p.total} points${active ? ', playing now' : ''}${g.dealer === seat ? ', dealer' : ''}`}
    >
      <div class="plate-name">
        {(p.isBot || p.botControlled) && <JokerIcon name="joker" scale={0.2} title={p.isBot ? 'Bot' : 'A bot is playing for them'} />}
        <span>{me ? 'You' : p.name}</span>
        {g.dealer === seat && (
          <span class="dealer-chip" title="Dealer">
            D
          </span>
        )}
      </div>
      <div class="plate-stats">
        <span class={`total${danger ? ' danger' : ''}`}>{p.total}</span>
        <span class="muted">pts</span>
        {!me && g.phase !== 'roundOver' && g.phase !== 'gameOver' && <span class="muted">· {p.handCount} cards</span>}
        {(g.phase === 'roundOver' || g.phase === 'gameOver') && result && (
          <span class={`delta ${result.points[seat] < 0 ? 'good' : ''}`}>{result.points[seat] >= 0 ? `+${result.points[seat]}` : result.points[seat]}</span>
        )}
      </div>
      {offline && <div class="plate-chip bad">reconnecting…</div>}
      {chip && <div class="plate-chip">{chip}</div>}
      {active && room.turnDeadline && <TimerBar deadline={room.turnDeadline} total={g.rules.turnTimer} />}
    </div>
  );
}

function TimerBar({ deadline, total }: { deadline: number; total: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  const left = Math.max(0, deadline - now) / 1000;
  return (
    <div class="timer" role="timer" aria-label={`${Math.ceil(left)} seconds left`}>
      <div class={`timer-fill${left < 8 ? ' low' : ''}`} style={{ width: `${(100 * left) / total}%` }} />
    </div>
  );
}

function PileInfo({ g, L }: { g: GameView; L: Layout }) {
  if (g.phase !== 'playing') return null;
  const below = (p: Point) => ({ x: p.x, y: p.y + 95 * L.pileScale * 0.5 + 18 });
  return (
    <>
      <div class="pile-label" style={toScreen(L, below(L.draw))} aria-label={`Draw pile: ${g.drawCount} cards${g.reshuffled ? ', last pile' : ''}`}>
        <b>{g.drawCount}</b> <span class="muted">draw</span>
        {g.reshuffled && <span class="last-pile" title="Already reshuffled once: when this runs out, the round ends">LAST</span>}
      </div>
      <div class="pile-label" style={toScreen(L, below(L.discard))} aria-label={`Discard pile: ${g.discardCount} cards`}>
        <b>{g.discardCount}</b> <span class="muted">discard</span>
      </div>
    </>
  );
}

function FormationLabels({ g, L }: { g: GameView; L: Layout }) {
  const groups = revealGroups(g, L);
  return (
    <>
      {groups.map((grp) => (
        <div class={`formation-label${grp.active ? ' active' : ''}`} style={toScreen(L, { x: grp.x + grp.w / 2, y: grp.y - 4 })}>
          {grp.owner === g.you ? 'You' : g.players[grp.owner].name} · {KIND_LABEL[grp.kind] ?? grp.kind}
        </div>
      ))}
      {g.reveal?.endCard != null && (
        <div class="formation-label end" style={toScreen(L, { x: L.endCard.x, y: L.endCard.y - 95 * L.pileScale * 0.5 - 12 })}>
          {g.reveal.endKind === 'manual' ? 'Ending card' : 'Last card'}
        </div>
      )}
    </>
  );
}

export function ActionBar() {
  const room = useStore((s) => s.room);
  const selected = useStore((s) => s.selected);
  const staged = useStore((s) => s.staged);
  const shake = useStore((s) => s.shake);
  const [shaking, setShaking] = useState(false);
  useEffect(() => {
    if (!shake) return;
    setShaking(true);
    const t = setTimeout(() => setShaking(false), 400);
    return () => clearTimeout(t);
  }, [shake]);
  const bar = computeBar(room, selected, staged);
  const g = room?.game;
  const showSort = g && g.you !== null && (g.players[g.you].hand?.length ?? 0) > 1 && g.phase !== 'gameOver';
  const myPoints = g && g.you !== null ? handPoints(g.players[g.you].hand ?? []) : 0;

  // Keyboard shortcuts for the bar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (store.get().overlay || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      const k = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      for (const b of [bar.left, bar.middle, bar.right]) {
        if (b && b.enabled && b.key === k) {
          e.preventDefault();
          b.onClick();
          return;
        }
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [bar]);

  return (
    <div class="action-area">
      {bar.status && (
        <div class="bar-status" role="status">
          {bar.status}
        </div>
      )}
      <div class={`action-bar${shaking ? ' shake' : ''}`}>
        {showSort && (
          <div class="sort-box" aria-label="Sort hand">
            <span class="muted">Sort</span>
            <button class="mini" onClick={() => sortHand('rank')}>
              Rank
            </button>
            <button class="mini" onClick={() => sortHand('suit')}>
              Suit
            </button>
          </div>
        )}
        {[bar.left, bar.middle, bar.right].map((b, i) =>
          b ? (
            <Button color={b.color} disabled={!b.enabled} onClick={b.onClick} kbd={b.key === 'Enter' ? '⏎' : b.key === 'Backspace' ? '⌫' : b.key} title={b.title} class={`slot slot-${i}`}>
              {b.label}
            </Button>
          ) : (
            <span class={`slot slot-${i} slot-empty`} />
          ),
        )}
        {showSort && (
          <div class="hand-points" title="Points in your hand if nothing is formed">
            <span class="muted">Hand</span> <b>{myPoints}</b>
          </div>
        )}
      </div>
    </div>
  );
}

function RoundSummary({ g }: { g: GameView }) {
  const r = g.results.at(-1);
  if (!r) return null;
  const order = g.players.map((_, i) => i).sort((a, b) => r.points[a] - r.points[b]);
  return (
    <section class="panel summary" aria-label="Round summary">
      <h2>Round {r.round}</h2>
      <p class="muted">
        {r.ender !== null ? `${r.ender === g.you ? 'You' : g.players[r.ender].name} ended the round` : 'The deck ran out'}
        {r.endKind === 'pileOut' && ' (draw pile empty)'}
        {r.bonus && ' with a full hand: -10!'}
      </p>
      <table class="score-table">
        <tbody>
          {order.map((i) => {
            const pen = r.penalties.find((p) => p.seat === i);
            return (
              <tr>
                <td class="pname">{i === g.you ? 'You' : g.players[i].name}</td>
                <td class="cards">
                  {r.leftovers[i].map((c) => (
                    <CardIcon card={c} scale={0.32} />
                  ))}
                  {r.leftovers[i].length === 0 && <span class="good">all formed</span>}
                </td>
                <td class={`pts ${r.points[i] < 0 ? 'good' : ''}`}>
                  {r.points[i] >= 0 ? '+' : ''}
                  {r.points[i]}
                  {pen && (
                    <span class="pen">
                      {pen.doubled && <JokerIcon name="duo" scale={0.2} title="Double Down" />}
                      {pen.plus10 && <JokerIcon name="credit_card" scale={0.2} title="Penalty +10" />}
                    </span>
                  )}
                </td>
                <td class="total">{r.totals[i]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function GameOver({ g, room }: { g: GameView; room: RoomView }) {
  const isHost = room.hostId === room.youId;
  const tximtxom = g.events.some((e) => e.e.t === 'tximtxom');
  const winners = g.winners.map((w) => (w === g.you ? 'You' : g.players[w].name));
  const order = g.players.map((_, i) => i).sort((a, b) => g.players[a].total - g.players[b].total);
  return (
    <section class="panel summary gameover" aria-label="Game over">
      <h2>{g.winners.length > 1 ? "It's a tie!" : `${winners[0]} win${winners[0] === 'You' ? '' : 's'}!`}</h2>
      {tximtxom && (
        <p class="good">
          <JokerIcon name="superposition" scale={0.3} /> TximTxom! A 7-card straight flush.
        </p>
      )}
      <table class="score-table">
        <tbody>
          {order.map((i, rank) => (
            <tr class={g.winners.includes(i) ? 'winner' : g.players[i].total > g.rules.threshold ? 'bust' : ''}>
              <td>{rank + 1}.</td>
              <td class="pname">{i === g.you ? 'You' : g.players[i].name}</td>
              <td class="total">{g.players[i].total}</td>
              <td>{g.players[i].total > g.rules.threshold ? 'BUST' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div class="lobby-actions">
        <Button color="orange" onClick={leaveRoom}>
          Leave
        </Button>
        {isHost ? (
          <Button color="blue" onClick={() => void startGame()}>
            Back to lobby
          </Button>
        ) : (
          <span class="muted">Waiting for the host…</span>
        )}
      </div>
    </section>
  );
}
