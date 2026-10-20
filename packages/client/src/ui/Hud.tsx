import { useEffect, useState } from 'preact/hooks';
import { type GameView, handPoints, type RoomView, SUIT_SYMBOLS, makeCard, type Suit, RANK_CODES } from '@tximtxom/shared';
import { type BarButton, cardsSeenOut, computeBar, readyForNextRound, sortHand, toggleAutoSort } from '../controller';
import { CARD_H, type Layout, type Point } from '../game/layout';
import { revealGroups } from '../game/scene';
import { kindName, t } from '../i18n';
import { leaveRoom, playAgain, startGame } from '../net';
import { updateSettings, useSettings } from '../settings';
import { copyReport } from '../report';
import { type Overlay, store, toast, useStore } from '../store';
import { Button, CardText, HoldButton, Modal, UiIcon } from './common';
import { CardIcon, Icon, ArtIcon, Wins } from './sprites';

function toScreen(L: Layout, p: Point) {
  return { left: `${L.offsetX + p.x * L.scale}px`, top: `${L.offsetY + p.y * L.scale}px` };
}

/** Plates have a fixed width (--pw); keep them fully on screen near the edges. */
function onScreen(pos: { left: string; top: string }) {
  return { ...pos, left: `clamp(calc(var(--pw) / 2 + 4px), ${pos.left}, calc(100% - var(--pw) / 2 - 4px))` };
}

import { SEAT_COLORS } from '../store';
export { SEAT_COLORS };

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
      <HandBar g={g} L={L} />
      <ActionBar />
      {g.phase === 'roundOver' && <RoundSummary g={g} />}
      {g.phase === 'gameOver' && <GameOver g={g} room={room} />}
    </div>
  );
}

function TopBar({ g }: { g: GameView }) {
  const open = (overlay: NonNullable<Overlay>) => store.set({ overlay });
  const { historyOpen } = useSettings();
  return (
    <nav class="topbar" aria-label="Game menu">
      <div class="round-chip">
        <span>{t('top.round', { n: g.round })}</span>
        <span class="bust-chip">{t('top.bust', { n: g.rules.threshold })}</span>
        {g.rules.hardcore && <ArtIcon name="hardcore" scale={0.26} title={t('rule.hardcore')} />}
        {g.rules.superposition && <ArtIcon name="ace" scale={0.26} title={t('rule.superposition')} />}
        {g.rules.smeared && <ArtIcon name="mixed" scale={0.26} title={t('rule.smeared')} />}
        {g.rules.sixthSense && <ArtIcon name="peek" scale={0.26} title={t('rule.sixthSense')} />}
        <button class="rules-btn" onClick={() => open('rules')}>
          {t('top.rules')}
        </button>
      </div>
      <div class="topbar-buttons">
        <Button color="red" onClick={() => open('scoreboard')} kbd="S">
          {t('top.scores')}
        </Button>
        <Button color="blue" onClick={() => open('formations')} kbd="F">
          {t('top.formations')}
        </Button>
        <Button color="purple" onClick={() => updateSettings({ historyOpen: !historyOpen })} kbd="H" class={historyOpen ? 'pressed' : ''}>
          {t('top.history')}
        </Button>
      </div>
      {/* Small, like the Rules button: menus you need now and then. */}
      <div class="topbar-mini">
        <button class="mini-btn" onClick={() => open('help')} title={t('top.help')} aria-label={t('top.help')}>
          <UiIcon name="help" />
        </button>
        <button class="mini-btn mini-orange" onClick={() => open('settings')} title={t('top.settings')} aria-label={t('top.settings')}>
          <UiIcon name="settings" />
        </button>
        <button class="mini-btn mini-leave" onClick={() => open('leave')} title={t('top.leave')} aria-label={t('top.leave')}>
          <UiIcon name="leave" />
          <span class="mini-text">{t('top.leave')}</span>
        </button>
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
    (g.phase === 'playing' && g.turn === seat) || (g.phase === 'reveal' && g.reveal && !g.reveal.ride && g.reveal.order[g.reveal.current] === seat);
  const ride = g.reveal?.ride;
  let chip: string | null = null;
  if (ride && ride.riders.includes(seat)) {
    if (p.handCount === 0) chip = t('plate.out');
    else if (g.rules.rideOrder === 'roundRobin') chip = ride.riders[ride.rrIndex] === seat ? t('plate.riding') : t('plate.waiting');
    else chip = ride.passed.includes(seat) ? t('plate.passed') : t('plate.riding');
  }
  if (g.phase === 'roundOver' && p.ready) chip = t('plate.ready');
  const result = g.results.at(-1);
  const pos = L.seats[seat]?.plate;
  if (!pos) return null;
  const danger = p.total > g.rules.threshold * 0.75;
  return (
    <div
      class={`plate${p.avatar ? ' has-art' : ''}${active ? ' active' : ''}${me ? ' me' : ''}${offline ? ' offline' : ''}`}
      style={{ ...onScreen(toScreen(L, pos)), '--seat': SEAT_COLORS[seat] }}
      aria-label={`${me ? t('you') : p.name}: ${p.total} ${t('pts')}`}
    >
      {p.avatar && (
        // The Joker shakes like a Balatro trigger when this player's turn starts.
        <span class={`plate-art${active ? ' juice' : ''}`} key={active ? 'on' : 'off'}>
          <ArtIcon name={p.avatar} scale={0.42} title={p.isBot ? t('plate.bot') : p.botControlled ? t('plate.botFor') : undefined} />
        </span>
      )}
      <div class="plate-name">
        {!p.isBot && p.botControlled && <span class="tag" title={t('plate.botFor')}>{t('lobby.bot')}</span>}
        <span class="seat-dot" aria-hidden="true" />
        <span class="plate-nm">{me ? t('you') : p.name}</span>
        <Wins n={lobby?.wins ?? 0} scale={0.5} />
        {g.dealer === seat && (
          <span class="dealer-chip" title={t('dealer')}>
            D
          </span>
        )}
      </div>
      <div class="plate-stats">
        <span class={`total${danger ? ' danger' : ''}`}>{p.total}</span>
        <span class="muted">{t('pts')}</span>
        {!me && g.phase !== 'roundOver' && g.phase !== 'gameOver' && <span class="muted">· {t('plate.cards', { n: p.handCount })}</span>}
        {(g.phase === 'roundOver' || g.phase === 'gameOver') && result && (
          <span class={`delta ${result.points[seat] < 0 ? 'good' : ''}`}>{result.points[seat] >= 0 ? `+${result.points[seat]}` : result.points[seat]}</span>
        )}
      </div>
      {/* Balatro's Handy Tag marks the player whose turn it is; the Rare Tag marks the host. */}
      {active && <Icon name="turn" scale={0.9} class="turn-tag" title={me ? t('b.yourTurn') : t('plate.theirTurn')} />}
      {p.id === room.hostId && <Icon name="host" scale={0.7} class="host-tag" title={t('lobby.hostTitle')} />}
      {offline && <div class="plate-chip bad">{t('plate.reconnecting')}</div>}
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
    <div class="timer" role="timer" aria-label={`${Math.ceil(left)}s`}>
      <div class={`timer-fill${left < 8 ? ' low' : ''}`} style={{ width: `${(100 * left) / total}%` }} />
    </div>
  );
}

function PileInfo({ g, L }: { g: GameView; L: Layout }) {
  if (g.phase !== 'playing') return null;
  const below = (p: Point) => ({ x: p.x, y: p.y + (CARD_H * L.pileScale) / 2 + 20 });
  return (
    <>
      <div class="pile-label" style={toScreen(L, below(L.draw))}>
        <span class="muted">{t('drawPile')}</span> <b>{g.drawCount}</b>
        {g.reshuffled && (
          <span class="last-pile" title={t('pile.lastTitle')}>
            {t('pile.last')}
          </span>
        )}
      </div>
      <div class="pile-label" style={toScreen(L, below(L.discard))}>
        <span class="muted">{t('discardPile')}</span> <b>{g.discardCount}</b>
      </div>
      {g.rules.sixthSense && <SixthSense g={g} L={L} />}
    </>
  );
}

/** "Peek" between the piles: which cards are still in play, like Balatro's deck view. */
function SixthSense({ g, L }: { g: GameView; L: Layout }) {
  const [open, setOpen] = useState(false);
  const mid = { x: (L.draw.x + L.discard.x) / 2, y: L.draw.y };
  const hand = new Set(g.you !== null ? g.players[g.you].hand ?? [] : []);
  if (g.drawn !== null) hand.add(g.drawn);
  const out = cardsSeenOut();
  const ranks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  const inPlay = (c: number) => !hand.has(c) && !out.has(c);
  const total = Array.from({ length: 52 }, (_, i) => i).filter(inPlay).length;
  return (
    <div class="peek" style={toScreen(L, mid)} onPointerEnter={() => setOpen(true)} onPointerLeave={() => setOpen(false)}>
      <button class="peek-btn" type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <ArtIcon name="peek" scale={0.34} />
        <span>{t('ss.peek')}</span>
      </button>
      {open && (
        <div class="peek-panel panel" role="dialog" aria-label={t('ss.title')}>
          <h3>
            {t('ss.title')} <span class="muted">· {t('ss.left', { n: total })}</span>
          </h3>
          <div class="peek-grid">
            {[0, 1, 2, 3].map((s) => (
              <div class="peek-row">
                <span class={`peek-suit suit-${'hcds'[s]}`}>
                  {SUIT_SYMBOLS[s]} {ranks.filter((r) => inPlay(makeCard(r, s as Suit))).length}
                </span>
                {ranks.map((r) => {
                  const c = makeCard(r, s as Suit);
                  return <CardIcon card={c} scale={0.36} dim={!inPlay(c)} />;
                })}
              </div>
            ))}
            <div class="peek-row peek-ranks">
              <span class="peek-suit" />
              {ranks.map((r) => (
                <span class="peek-rank">
                  {RANK_CODES[r]}
                  <b>{[0, 1, 2, 3].filter((s) => inPlay(makeCard(r, s as Suit))).length}</b>
                </span>
              ))}
            </div>
          </div>
          <p class="muted small">{t('ss.note')}</p>
        </div>
      )}
    </div>
  );
}

function FormationLabels({ g, L }: { g: GameView; L: Layout }) {
  const groups = revealGroups(g, L);
  return (
    <>
      {groups.map((grp) => (
        <div class={`formation-label${grp.active ? ' active' : ''}`} style={{ ...toScreen(L, { x: grp.x + grp.w / 2, y: grp.y - 4 }), '--seat': SEAT_COLORS[grp.owner] }}>
          {grp.owner === g.you ? t('you') : g.players[grp.owner].name} · {kindName(grp.kind)}
        </div>
      ))}
      {g.reveal?.endCard != null && (
        <div class="formation-label end" style={toScreen(L, { x: L.endCard.x, y: L.endCard.y - (CARD_H * L.pileScale) / 2 - 12 })}>
          {g.reveal.endKind === 'manual' ? t('label.endingCard') : t('label.lastCard')}
        </div>
      )}
    </>
  );
}

/** Sort buttons and hand points, in a row just under the hand. */
function HandBar({ g, L }: { g: GameView; L: Layout }) {
  const s = useSettings();
  if (g.you === null || g.phase === 'gameOver') return null;
  const hand = g.players[g.you].hand ?? [];
  if (hand.length < 2) return null;
  const y = L.hand.y + (CARD_H * L.hand.cardScale) / 2 + 22;
  return (
    <div class="hand-bar" style={toScreen(L, { x: L.hand.x, y })}>
      <div class="sort-row" role="group" aria-label={t('sort.label')}>
        <span class="muted">{t('sort.label')}</span>
        <button class={`mini${s.sortBy === 'rank' ? ' on' : ''}`} onClick={() => sortHand('rank')}>
          {t('sort.rank')}
        </button>
        <button class={`mini${s.sortBy === 'suit' ? ' on' : ''}`} onClick={() => sortHand('suit')}>
          {t('sort.suit')}
        </button>
        <span class="sort-sep" aria-hidden="true" />
        {/* A switch, not a third sort option: keeps the hand sorted as cards come and go. */}
        <button class={`auto-toggle${s.autoSort ? ' on' : ''}`} role="switch" aria-checked={s.autoSort} title={t('sort.autoTitle')} onClick={toggleAutoSort}>
          <span class="mini-switch" aria-hidden="true">
            <span class="knob" />
          </span>
          {t('sort.auto')}
        </button>
      </div>
      <div class="hand-points" title={t('handPoints')}>
        <span class="muted">{t('handPoints')}</span> <b>{handPoints(hand)}</b>
      </div>
    </div>
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
    const tm = setTimeout(() => setShaking(false), 400);
    return () => clearTimeout(tm);
  }, [shake]);
  const bar = computeBar(room, selected, staged);
  // While a card is held in a drag, no button may fire (a drop is coming).
  const dragging = useStore((s) => s.dragging);
  const on = (b: BarButton) => b.enabled && !dragging;

  // Keyboard shortcuts for the everyday buttons (the hold buttons handle their own keys).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (store.get().overlay || store.get().dragging || (e.target as HTMLElement)?.tagName === 'INPUT' || e.repeat) return;
      const k = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      for (const b of bar.main) {
        if (b.enabled && !b.hold && b.key === k) {
          e.preventDefault();
          b.onClick();
          return;
        }
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [bar]);

  if (!bar.main.length && !bar.status && !bar.txiJog && !bar.tximtxom) return null;
  return (
    <div class="action-area">
      {bar.status && (
        <div class="bar-status" role="status">
          <CardText text={bar.status} />
        </div>
      )}
      <div class={`action-bar${shaking ? ' shake' : ''}`}>
        <div class="corner left">
          {bar.tximtxom && (
            <HoldButton color="orange" label={bar.tximtxom.label} enabled={on(bar.tximtxom)} onConfirm={bar.tximtxom.onClick} hotkey="T" title={bar.tximtxom.title} class="special" />
          )}
        </div>
        <div class="main-actions">
          {bar.main.map((b) =>
            b.hold ? (
              <HoldButton color={b.color} label={b.label} enabled={on(b)} onConfirm={b.onClick} hotkey={b.key} title={b.title} />
            ) : (
              <Button color={b.color} disabled={!on(b)} onClick={b.onClick} kbd={b.key === 'Enter' ? '⏎' : b.key === 'Backspace' ? '⌫' : b.key} title={b.title} big>
                <CardText text={b.label} />
              </Button>
            ),
          )}
        </div>
        <div class="corner right">
          {bar.txiJog && <HoldButton color="red" label={bar.txiJog.label} enabled={on(bar.txiJog)} onConfirm={bar.txiJog.onClick} hotkey="R" title={bar.txiJog.title} class="special" />}
        </div>
      </div>
    </div>
  );
}

function RoundSummary({ g }: { g: GameView }) {
  const r = g.results.at(-1);
  if (!r) return null;
  const me = g.you;
  const ready = me !== null && g.players[me].ready;
  const order = g.players.map((_, i) => i).sort((a, b) => r.points[a] - r.points[b]);
  const who = (i: number) => (i === me ? t('you') : g.players[i].name);
  return (
    <Modal
      title={t('sum.round', { n: r.round })}
      wide
      class="summary-modal"
      footer={
        ready ? (
          <span class="muted">{t('st.waitingOthers')}</span>
        ) : (
          <Button color="blue" big onClick={readyForNextRound} kbd="⏎">
            {t('act.nextRound')}
          </Button>
        )
      }
    >
      <p class="center muted">
        {r.ender !== null ? t('sum.endedBy', { name: who(r.ender) }) : t('sum.deckOut')}
        {r.endKind === 'pileOut' && ` ${t('sum.pileOut')}`}
        {r.bonus && ` ${t('sum.fullHand')}`}
      </p>
      <table class="score-table">
        <thead>
          <tr>
            <th>{t('sum.player')}</th>
            <th>{t('sum.leftover')}</th>
            <th class="num">{t('sum.thisRound')}</th>
            <th class="num">{t('sum.total')}</th>
          </tr>
        </thead>
        <tbody>
          {order.map((i) => {
            const pen = r.penalties.find((p) => p.seat === i);
            return (
              <tr style={{ '--seat': SEAT_COLORS[i] }}>
                <td class="pname">
                  <span class="seat-dot" />
                  {who(i)}
                </td>
                <td class="cards">
                  {r.leftovers[i].map((c) => (
                    <CardIcon card={c} scale={0.48} />
                  ))}
                  {r.leftovers[i].length === 0 && <span class="good">{t('sum.allFormed')}</span>}
                </td>
                <td class={`num pts ${r.points[i] < 0 ? 'good' : ''}`}>
                  {r.points[i] >= 0 ? '+' : ''}
                  {r.points[i]}
                  {pen && (
                    <span class="pen">
                      {pen.doubled && <ArtIcon name="double" scale={0.22} title={t('sum.doubled')} />}
                      {pen.plus10 && <ArtIcon name="penalty" scale={0.22} title={t('sum.plus10')} />}
                    </span>
                  )}
                </td>
                <td class="num total">{r.totals[i]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <RoundEnterKey onEnter={() => !ready && readyForNextRound()} />
    </Modal>
  );
}

function RoundEnterKey({ onEnter }: { onEnter: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Enter' && !e.repeat && onEnter();
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [onEnter]);
  return null;
}

function GameOver({ g, room }: { g: GameView; room: RoomView }) {
  const isHost = room.hostId === room.youId;
  const tximtxom = g.events.some((e) => e.e.t === 'tximtxom');
  const who = (i: number) => (i === g.you ? t('you') : g.players[i].name);
  const order = g.players.map((_, i) => i).sort((a, b) => g.players[a].total - g.players[b].total);
  const title = g.winners.length > 1 ? t('go.tie') : g.winners[0] === g.you ? t('go.youWin') : t('go.wins', { name: who(g.winners[0]) });
  return (
    <Modal
      title={title}
      class="summary-modal"
      corner={
        <button
          class="report-btn"
          title={t('go.copyReport')}
          aria-label={t('go.copyReport')}
          onClick={async () => toast((await copyReport()) ? t('go.reportCopied') : t('go.reportFailed'), 'info')}
        >
          ⧉
        </button>
      }
      footer={
        <>
          <Button color="orange" onClick={leaveRoom}>
            {t('top.leave')}
          </Button>
          {isHost ? (
            <>
              <Button color="blue" onClick={() => void startGame()}>
                {t('go.backToLobby')}
              </Button>
              <Button color="green" onClick={() => void playAgain()}>
                {t('go.playAgain')}
              </Button>
            </>
          ) : (
            <span class="muted">{t('go.waitingHost')}</span>
          )}
        </>
      }
    >
      {tximtxom && (
        <p class="good center">
          <ArtIcon name="tximtxom" scale={0.32} /> {t('go.tximtxom')}
        </p>
      )}
      <table class="score-table">
        <tbody>
          {order.map((i, rank) => (
            <tr class={g.winners.includes(i) ? 'winner' : g.players[i].total > g.rules.threshold ? 'bust' : ''} style={{ '--seat': SEAT_COLORS[i] }}>
              <td>{rank + 1}.</td>
              <td class="pname">
                <span class="seat-dot" />
                {who(i)}
                <Wins n={room.players.find((x) => x.id === g.players[i].id)?.wins ?? 0} />
              </td>
              <td class="num total">{g.players[i].total}</td>
              <td>{g.players[i].total > g.rules.threshold ? t('go.bust') : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}
