import { play } from '../audio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { EmoteBubble, EmotePicker } from './Emotes';
import { type GameView, handPoints, leftoverRange, type RoomView, SUIT_SYMBOLS, makeCard, type Suit, RANK_CODES } from '@tximtxom/shared';
import { canDrop, cardsSeenOut, computeBar, layWait, readyForNextRound, sortHand, toggleAutoSort, txiJogBlock, type BarButton } from '../controller';
import { CARD_H, type Layout, type Point } from '../game/layout';
import { drawPileTop, type FormationGroup, revealGroups } from '../game/scene';
import { cardShort, type Key, kindName, lang, t } from '../i18n';
import { leaveRoom, playAgain, startGame } from '../net';
import { useSettings } from '../settings';
import { copyReport } from '../report';
import { type Overlay, store, toast, toggleSide, useStore } from '../store';
import { Button, CardText, ChipIcon, HintBalloon, HoldButton, Label, MiniButton, Modal, RuleName, ShortLabel, UiIcon, withHighlights } from './common';
import { type ChipPop, gameChips, onChipPop, roundChips, useChips } from '../chips';
import { formatCount } from '../stats';
import { useUnreadChat } from './Chat';
import { Badge, BADGE_KINDS, badgeCount, CardIcon, EmoteIcon, Icon, ArtIcon, Wins } from './sprites';

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
      <TxiJogDrop g={g} L={L} />
      {(g.phase === 'reveal' || g.phase === 'roundOver') && <FormationLabels g={g} L={L} />}
      <ChipPops L={L} />
      <HandBar g={g} L={L} />
      <ActionBar />
      {g.phase === 'roundOver' && <RoundSummary g={g} />}
      {g.phase === 'gameOver' && <GameOver g={g} room={room} />}
    </div>
  );
}

/** The rules changed from the defaults, as [art, name, description] for the round chip. */
export function activeRules(r: GameView['rules']): [string, Key, Key][] {
  const out: [string, Key, Key][] = [];
  if (r.softcore) out.push(['softcore', 'rule.softcore', 'rule.softcore.desc']);
  if (r.superposition) out.push(['ace', 'rule.superposition', 'rule.superposition.desc']);
  if (r.mobius) out.push(['ace', 'rule.mobius', 'rule.mobius.desc']);
  if (r.smeared) out.push(['mixed', 'rule.smeared', 'rule.smeared.desc']);
  if (r.rideOrder === 'roundRobin') out.push(['ride', 'rule.rideOrder', 'rule.rideOrder.desc']);
  if (r.rides !== 'any') out.push(['ride', r.rides === 'one' ? 'rule.rides.oneName' : 'rule.rides.noneName', 'rule.rides.desc']);
  if (r.autoRide) out.push(['autoride', 'rule.autoRide', 'rule.autoRide.desc']);
  if (r.sixthSense) out.push(['peek', 'rule.sixthSense', 'rule.sixthSense.desc']);
  if (r.noMoreFormationsNotice) out.push(['notice', 'rule.notice', 'rule.notice.desc']);
  if (r.penalty10) out.push(['penalty', 'rule.penalty10', 'rule.penalty10.desc']);
  if (r.doubleDown) out.push(['double', 'rule.doubleDown', 'rule.doubleDown.desc']);
  if (r.turnTimer > 0) out.push(['timer', 'rule.timer', 'rule.timer.desc']);
  if (r.magicSort) out.push(['magicsort', 'rule.magicSort', 'rule.magicSort.desc']);
  if (r.scramble) out.push(['scramble', 'rule.scramble', 'rule.scramble.desc']);
  return out;
}

/** The rules in play as small cards. Tapping one (or clicking it) explains it in a
 *  balloon, as on the Formations screen; hovering still shows the tooltip. */
function RuleCards({ g }: { g: GameView }) {
  const [open, setOpen] = useState<{ art: string; at: DOMRect } | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const rules = activeRules(g.rules);
  const shown = open && rules.find(([art]) => art === open.art);
  return (
    <span class="rule-cards">
      {rules.map(([art, name, desc]) => (
        <button
          type="button"
          class={`f-rule${open?.art === art ? ' on' : ''}`}
          aria-label={t(name)}
          aria-expanded={open?.art === art}
          onClick={(e) => {
            play('button', { volume: 0.5 });
            setOpen(open?.art === art ? null : { art, at: (e.currentTarget as HTMLElement).getBoundingClientRect() });
          }}
        >
          <ArtIcon name={art} scale={0.26} title={`${t(name)}\n${t(desc)}`} rule />
        </button>
      ))}
      {open && shown && (
        <HintBalloon at={open.at} onClose={close} keep=".rule-cards .f-rule">
          <b>{withHighlights(t(shown[1]))}</b> {withHighlights(t(shown[2]))}
        </HintBalloon>
      )}
    </span>
  );
}

function TopBar({ g }: { g: GameView }) {
  const open = (overlay: NonNullable<Overlay>) => store.set({ overlay });
  const { historyOpen } = useSettings();
  const unread = useUnreadChat();
  const sideTab = useStore((s) => s.sideTab);
  return (
    <nav class="topbar" aria-label="Game menu">
      <div class="round-chip">
        <Label k="top.round" vars={{ n: g.round }} />
        <span class="bust-chip">
          <Label k="top.bust" vars={{ n: g.rules.threshold }} />
        </span>
        <RuleCards g={g} />
        <button class="rules-btn" onClick={() => open('rules')}>
          <Label k="top.rules" />
        </button>
      </div>
      {/* Every menu button is small, like the Rules button, so the table keeps the space. */}
      <div class="topbar-buttons">
        <MiniButton color="red" onClick={() => open('scoreboard')} kbd="S">
          <Label k="top.scores" />
        </MiniButton>
        <MiniButton color="blue" onClick={() => open('formations')} kbd="F">
          <Label k="top.formations" />
        </MiniButton>
        <MiniButton color="green" onClick={() => open('help')}>
          <Label k="top.help" />
        </MiniButton>
      </div>
      <div class="topbar-mini">
        <MiniButton color="purple" onClick={() => toggleSide('history')} label={t('top.history')} kbd="H" pressed={historyOpen && sideTab === 'history'}>
          <UiIcon name="history" />
          <span class="mini-text">
            <Label k="top.history" />
          </span>
        </MiniButton>
        <MiniButton color="blue" onClick={() => toggleSide('chat')} label={t('top.chat')} kbd="C" pressed={historyOpen && sideTab === 'chat'}>
          <span class="ui-icon chat-icon" aria-hidden="true">
            <EmoteIcon id="chat" scale={1.25} />
          </span>
          {/* Messages you haven't seen: a count on the button. Always there (hidden at 0), so nothing moves. */}
          <span class={`unread-dot${unread > 0 && !(historyOpen && sideTab === 'chat') ? '' : ' none'}`}>{unread}</span>
          <span class="mini-text">
            <Label k="top.chat" />
          </span>
        </MiniButton>
        <MiniButton color="orange" onClick={() => open('settings')} label={t('top.settings')}>
          <UiIcon name="settings" />
          <span class="mini-text">
            <Label k="top.settings" />
          </span>
        </MiniButton>
        <MiniButton color="leave" onClick={() => open('leave')} label={t('top.leave')}>
          <UiIcon name="leave" />
          <span class="mini-text">
            <Label k="top.leave" />
          </span>
        </MiniButton>
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
      <EmoteBubble player={p.id} />
      {me && <EmotePicker class="on-plate" once />}
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
      {/* The seconds left, in the middle of the bar. */}
      <span class="timer-secs" aria-hidden="true">
        {Math.ceil(left)}s
      </span>
    </div>
  );
}

function PileInfo({ g, L }: { g: GameView; L: Layout }) {
  // Hidden (not removed) while the cards are dealt, and shown once they've landed.
  const dealing = useStore((s) => s.dealing);
  if (g.phase !== 'playing') return null;
  const below = (p: Point) => ({ x: p.x, y: p.y + (CARD_H * L.pileScale) / 2 + 20 });
  const cls = `pile-label${dealing ? ' pre-deal' : ''}`;
  return (
    <>
      <div class={cls} style={toScreen(L, below(L.draw))}>
        <span class="muted">
          <Label k="drawPile" />
        </span> <b>{g.drawCount}</b>
        {g.reshuffled && (
          <span class="last-pile" title={t('pile.lastTitle')}>
            {t('pile.last')}
          </span>
        )}
      </div>
      <div class={cls} style={toScreen(L, below(L.discard))}>
        <span class="muted">
          <Label k="discardPile" />
        </span> <b>{g.discardCount}</b>
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

/** While a card that can end the round is held, the draw pile says it takes it. */
/** While you hold a card on your turn: the sign over the Draw Pile. It takes the drop too,
 *  and when this card can't end the round it's grey and says why. */
function TxiJogDrop({ g, L }: { g: GameView; L: Layout }) {
  const card = useStore((s) => s.dragCard);
  const over = useStore((s) => s.overTxiJog);
  useStore((s) => s.room);
  const why = card === null ? undefined : txiJogBlock(card);
  if (why === undefined) return null;
  const top = drawPileTop(L, Math.min(g.drawCount, 6));
  return (
    <div
      class={`txijog-drop${why ? ' blocked' : ''}${over ? ' over' : ''}`}
      data-drop="txiJog"
      style={toScreen(L, { x: top.x, y: top.y - (CARD_H * L.pileScale) / 2 - 6 })}
    >
      <ArtIcon name="txijog" scale={0.4} />
      {why ? t(why) : t('drop.txiJog')}
    </div>
  );
}

function FormationLabels({ g, L }: { g: GameView; L: Layout }) {
  const groups = revealGroups(g, L);
  return (
    <>
      {groups.map((grp) => (
        <FormationLabel key={grp.id} grp={grp} g={g} L={L} />
      ))}
    </>
  );
}

/**
 * A formation's name badge. It waits for the cards to land, then pops in with a
 * shine; every card added on a ride shines it again. When the formation closes
 * (its cards tighten), one shine crosses the cards.
 */
function FormationLabel({ grp, g, L }: { grp: FormationGroup; g: GameView; L: Layout }) {
  const fresh = useRef(true);
  const wasActive = useRef(grp.active);
  const closed = useRef(false);
  // Laid now (not already on the table when you joined or refreshed).
  const laidNow = useRef(g.phase === 'reveal');
  const wait = useRef((layWait.get(grp.id) ?? 0) / 1000).current;
  if (!fresh.current && wasActive.current && !grp.active) closed.current = true;
  // Laid with nobody able to ride: it's closed straight away.
  if (fresh.current && !grp.active && laidNow.current) closed.current = true;
  const first = fresh.current;
  fresh.current = false;
  wasActive.current = grp.active;
  const owner = grp.owner === g.you ? t('you') : g.players[grp.owner].name;
  const name = kindName(grp.kind, grp.cards.length - grp.rides);
  const h = CARD_H * L.reveal.cardScale * L.scale;
  return (
    <>
      {/* In its owner's colour, so no name is needed (long names overlapped);
          "+2" counts the cards other players added on rides. */}
      <div
        class={`formation-label${grp.active ? ' active' : ''}${laidNow.current ? ' fl-in' : ''}`}
        style={{ ...toScreen(L, { x: grp.x + grp.w / 2, y: grp.y - 4 }), '--seat': SEAT_COLORS[grp.owner], '--fl-wait': `${wait}s` }}
        aria-label={`${owner}: ${name}${grp.rides ? ` +${grp.rides}` : ''}`}
      >
        {name}
        {grp.rides > 0 && <b class="fl-rides">+{grp.rides}</b>}
        {laidNow.current && <span class="fl-shine" key={grp.cards.length} style={{ animationDelay: first || grp.rides === 0 ? `${wait + 0.85}s` : '0.4s' }} aria-hidden="true" />}
      </div>
      {closed.current && (
        <div
          class="formation-shine"
          key={`c${grp.id}`}
          style={{ ...toScreen(L, { x: grp.x, y: grp.y }), width: `${grp.w * L.scale}px`, height: `${h}px`, animationDelay: wasActive.current || !first ? '0.4s' : `${wait + 1.4}s` }}
          aria-hidden="true"
        />
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
  // What the hand would still be worth once formations are laid, best way to worst.
  const after = leftoverRange(hand, g.rules);
  // Magic picked in Settings, in a room without the Magic Sort rule: the hand goes by rank.
  const sortBy = s.sortBy === 'magic' && !g.rules.magicSort ? 'rank' : s.sortBy;
  return (
    <div class="hand-bar" style={toScreen(L, { x: L.hand.x, y })}>
      <div class="sort-row" role="group" aria-label={t('sort.label')}>
        {g.rules.scramble ? (
          // Scramble: nothing to sort with, just the rule's name.
          <span class="sort-scrambled">
            <RuleName name={t('rule.scramble')} tone="funny" />
          </span>
        ) : (
          <>
            <span class="muted">
              <Label k="sort.label" />
            </span>
            <button class={`mini${sortBy === 'rank' ? ' on' : ''}`} onClick={() => sortHand('rank')}>
              <Label k="sort.rank" />
            </button>
            <button class={`mini${sortBy === 'suit' ? ' on' : ''}`} onClick={() => sortHand('suit')}>
              <Label k="sort.suit" />
            </button>
            {g.rules.magicSort && (
              <button class={`mini${sortBy === 'magic' ? ' on' : ''}`} onClick={() => sortHand('magic')} title={t('sort.magicTitle')}>
                <Label k="sort.magic" />
              </button>
            )}
            <span class="sort-sep" aria-hidden="true" />
            {/* A switch, not a third sort option: keeps the hand sorted as cards come and go. */}
            <button class={`auto-toggle${s.autoSort ? ' on' : ''}`} role="switch" aria-checked={s.autoSort} title={t('sort.autoTitle')} onClick={toggleAutoSort}>
              <span class="mini-switch" aria-hidden="true">
                <span class="knob" />
              </span>
              <Label k="sort.auto" />
            </button>
          </>
        )}
      </div>
      <div class="hand-points" title={t('handPoints.title')}>
        <span class="muted">
          <Label k="handPoints" />
        </span>
        <b>{handPoints(hand)}</b>
        <span class="muted">
          <Label k="handPoints.after" />
        </span>
        <b class="after">{after.min === after.max ? after.min : `${after.min}–${after.max}`}</b>
      </div>
    </div>
  );
}

/** Seconds until a button presses itself, with a bar draining along its bottom. */
function Countdown({ at, ms }: { at: number; ms: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [at]);
  const left = Math.max(0, at - now);
  const secs = (left / 1000).toFixed(1);
  // The bar runs as a CSS animation (smooth every frame), started as far in as time has passed.
  const start = useMemo(() => Date.now(), [at]);
  return (
    <>
      <span class="btn-count">{t('act.autoSkip', { s: lang() === 'pt' ? secs.replace('.', ',') : secs })}</span>
      <span class="btn-drain" key={at} style={{ animationDuration: `${ms}ms`, animationDelay: `${at - ms - start}ms` }} aria-hidden="true" />
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
    const tm = setTimeout(() => setShaking(false), 400);
    return () => clearTimeout(tm);
  }, [shake]);
  const bar = computeBar(room, selected, staged);
  // While a card is held in a drag, no button may fire (a drop is coming).
  const dragging = useStore((s) => s.dragging);
  const on = (b: BarButton) => b.enabled && !dragging;
  // A card that can end the round is being dragged: the Txi jog button takes it.
  const dragCard = useStore((s) => s.dragCard);
  const overTxiJog = useStore((s) => s.overTxiJog);
  const txiJogTakes = dragCard !== null && canDrop(dragCard, { kind: 'txiJog' });

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
              <HoldButton color={b.color} label={b.label} short={b.short} enabled={on(b)} onConfirm={b.onClick} hotkey={b.key} title={b.title} />
            ) : (
              <Button color={b.color} disabled={!on(b)} onClick={b.onClick} kbd={b.key === 'Enter' ? '⏎' : b.key === 'Backspace' ? '⌫' : b.key} title={b.title} big>
                <ShortLabel text={b.label} short={b.short} />
                {b.deadline && <Countdown {...b.deadline} />}
              </Button>
            ),
          )}
        </div>
        <div class="corner right">
          {bar.txiJog && (
            <HoldButton
              color="red"
              label={txiJogTakes ? t('act.txiJog', { card: cardShort(dragCard) }) : bar.txiJog.label}
              sub={txiJogTakes ? t('act.dropHere') : undefined}
              enabled={on(bar.txiJog)}
              onConfirm={bar.txiJog.onClick}
              hotkey="R"
              title={bar.txiJog.title}
              class={`special${txiJogTakes ? ' drop-ready' : ''}${txiJogTakes && overTxiJog ? ' drop-over' : ''}`}
              drop="txiJog"
            />
          )}
        </div>
      </div>
    </div>
  );
}

/** Chips you earn on the table float up from there as "+13". */
function ChipPops({ L }: { L: Layout }) {
  const [pops, setPops] = useState<ChipPop[]>([]);
  useEffect(
    () =>
      onChipPop((p) => {
        setTimeout(() => setPops((ps) => [...ps, p]), p.delay);
        setTimeout(() => setPops((ps) => ps.filter((x) => x.id !== p.id)), p.delay + POP_MS);
      }),
    [],
  );
  return (
    <>
      {pops.map((p) => (
        <span class="chip-pop" key={p.id} style={toScreen(L, p)} aria-hidden="true">
          <ChipIcon size={18} />+{p.n}
        </span>
      ))}
    </>
  );
}
const POP_MS = 1500;

/** "+42 chips" under a summary (none while there are none). */
function ChipsEarned({ n, label }: { n: number; label: 'chips.round' | 'chips.game' }) {
  useChips(); // redraw when chips come in after the summary opens
  if (n <= 0) return null;
  return (
    <p class="chips-earned center">
      <ChipIcon /> {t(label, { n: formatCount(n) })}
    </p>
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
                <td class="num total">
                  {r.totals[i]} {t('pts')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <ChipsEarned n={roundChips()} label="chips.round" />
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
          {/* Two overlapping sheets: copy. A drawn icon, so it sits dead centre (the ⧉ glyph didn't). */}
          <svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">
            <path d="M5 1h9v9h-2V3H5z" fill="currentColor" />
            <path d="M2 5h9v10H2zm2 2v6h5V7z" fill="currentColor" fill-rule="evenodd" />
          </svg>
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
              </td>
              {/* One column per badge, so they line up down the table. */}
              {BADGE_KINDS.map((kind) => (
                <td class="badge-cell">
                  <Badge kind={kind} n={badgeCount(room.players.find((x) => x.id === g.players[i].id), kind)} scale={0.5} />
                </td>
              ))}
              <td class="num total">
                {g.players[i].total} {t('pts')}
              </td>
              <td>{g.players[i].total > g.rules.threshold && <span class="bust-tag">{t('go.bust')}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ChipsEarned n={gameChips()} label="chips.game" />
    </Modal>
  );
}
