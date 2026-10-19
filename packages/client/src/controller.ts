import { type Action, type Card, canEndWith, canRide, type GameEvent, type GameView, type RoomView } from '@tximtxom/shared';
import { play, type Sfx, vibrate } from './audio';
import { setMood, shuffleTablePalette, swirl } from './background';
import { drawPileTop, revealGroups, sortedCards } from './game/scene';
import type { DropTarget, SpawnHints, Table } from './game/table';
import { cardShort, cardSpoken, kindName, t, tError } from './i18n';
import { act, fetchHistory } from './net';
import { getSettings, onSettings, updateSettings } from './settings';
import { banner, callout, SEAT_COLORS, type Staged, store, toast } from './store';

let table: Table;
let lastEventId = 0;
let lastRoomCode = '';
let handOrder: Card[] = [];
let wasMyTurn = false;
/** Which ride chance we last announced ("" = none open for us). */
let lastRideKey = '';
let wasMyReveal = false;
/** While the deal animation runs (ms timestamp), turn callouts wait. */
let dealUntil = 0;

/** A turn callout, held back until the deal is over; dropped if the moment has passed by then. */
function turnCallout(text: string, color: string, opts: { small?: boolean; ms?: number }, stillValid: (g: GameView) => boolean): void {
  const wait = dealUntil - Date.now();
  if (wait <= 0) return callout(text, color, opts);
  setTimeout(() => {
    const g = store.get().room?.game;
    if (g && stillValid(g)) callout(text, color, opts);
  }, wait);
}
let lastTximTxomAt = 0;

/** How long "Take a ride!" shows; a formation that opens the ride waits for it. */
const RIDE_CALLOUT_MS = 1250;
const CALLOUT = { you: '#009dff', ride: '#4bc292', tximtxom: '#fda200', gameOver: '#fe5f55', nope: '#fe5f55', reveal: '#8867a5' };

/** Set when it's our moment to ride on the open formation. */
function myRideKey(g: GameView): string {
  const me = g.you;
  const w = g.reveal?.ride;
  if (me === null || !w || g.rules.autoRide || !w.riders.includes(me) || !(g.players[me].hand ?? []).length) return '';
  if (g.rules.rideOrder === 'roundRobin' ? w.riders[w.rrIndex] !== me : w.passed.includes(me)) return '';
  return `${w.formationId}`;
}
let announce: (text: string) => void = () => {};

export function setAnnouncer(fn: (text: string) => void): void {
  announce = fn;
}

export function initController(tb: Table): void {
  table = tb;
  store.subscribe(onStore);
  onSettings(() => {
    if (getSettings().autoSort) applyAutoSort();
  });
}

// ---------------------------------------------------------------- hand order

export function getHandOrder(): Card[] {
  return handOrder;
}

export function setHandOrder(order: Card[]): void {
  // Dropping a card back where it was is not a move.
  if (order.join() === handOrder.join()) {
    pushToTable();
    return;
  }
  handOrder = order;
  // Moving cards by hand turns auto-sort off; it would undo the move.
  if (getSettings().autoSort) updateSettings({ autoSort: false });
  pushToTable();
}

export function sortHand(by: 'rank' | 'suit'): void {
  const g = store.get().room?.game;
  if (!g || g.you === null) return;
  play('cardFan2', { volume: 0.6 });
  updateSettings({ sortBy: by });
  handOrder = sortedCards(g.players[g.you].hand ?? [], by);
  pushToTable();
}

export function toggleAutoSort(): void {
  const on = !getSettings().autoSort;
  play('button', { volume: 0.5, rate: on ? 1.2 : 0.9 });
  updateSettings({ autoSort: on });
  if (on) applyAutoSort();
}

/** With auto-sort on, the hand is re-sorted whenever cards come or go. */
function applyAutoSort(): void {
  const g = store.get().room?.game;
  if (!g || g.you === null) return;
  const s = getSettings();
  const next = sortedCards(g.players[g.you].hand ?? [], s.sortBy);
  if (next.join() !== handOrder.join()) {
    handOrder = next;
    pushToTable();
  }
}

// ---------------------------------------------------------------- sixth sense

/** Cards this player has seen go out of play this round (discards still in the pile). */
let seenOut = new Set<Card>();

export function cardsSeenOut(): Set<Card> {
  return seenOut;
}

function trackSeen(e: GameEvent | null, g: GameView): void {
  if (e?.t === 'deal' || e?.t === 'reshuffle') seenOut = new Set();
  if (e?.t === 'discard') seenOut.add(e.card);
  if (e?.t === 'take') seenOut.delete(e.card);
  if (g.discardTop !== null) seenOut.add(g.discardTop);
}

// ---------------------------------------------------------------- room updates

function name(g: GameView, seat: number | null): string {
  if (seat === null) return '—';
  return seat === g.you ? t('you') : g.players[seat].name;
}

let prevRoom: RoomView | null = null;
/** onRoom is running: its own store updates must not redraw the table before it passes its spawn hints. */
let inRoomUpdate = false;

function onStore(): void {
  const s = store.get();
  const room = s.room;
  if (room !== prevRoom) {
    const prev = prevRoom;
    prevRoom = room;
    inRoomUpdate = true;
    try {
      onRoom(room, prev);
    } finally {
      inRoomUpdate = false;
    }
  }
  if (!inRoomUpdate) pushToTable();
}

function pushToTable(hints?: SpawnHints): void {
  const s = store.get();
  const { autoSort, sortBy } = getSettings();
  table.set({ game: s.room?.game ?? null, handOrder, autoSortBy: autoSort ? sortBy : null, selected: s.selected, staged: s.staged }, hints);
}

function onRoom(room: RoomView | null, prev: RoomView | null): void {
  const g = room?.game ?? null;
  syncHistory(g);
  if (!room || !g) {
    // A new room gets new colours; the red and blue stay on the title screen.
    if (room && room.code !== prev?.code) shuffleTablePalette();
    setMood(room ? 'table' : 'menu');
    lastEventId = 0;
    lastRideKey = '';
    wasMyTurn = false;
    wasMyReveal = false;
    seenOut = new Set();
    return;
  }
  // We watched this game start (from the lobby, or Play again): play its
  // opening events (cut, deal) like any other, so round 1 is dealt on screen.
  const lastId = g.events.at(-1)?.id ?? 0;
  const justStarted = !!prev && prev.code === room.code && (!prev.game || lastId < lastEventId) && g.round === 1;
  if (justStarted) {
    lastRoomCode = room.code;
    lastEventId = 0;
    seenOut = new Set();
    const me = g.you;
    if (me !== null) handOrder = [...(g.players[me].hand ?? [])];
  }
  // First view of this game (joined or rejoined): no replays of old events.
  else if (room.code !== lastRoomCode || !prev?.game) {
    lastRoomCode = room.code;
    lastEventId = g.events.at(-1)?.id ?? 0;
    setMood(g.phase === 'reveal' ? 'reveal' : 'table');
    const me = g.you;
    if (me !== null) handOrder = [...(g.players[me].hand ?? [])];
    trackSeen(null, g);
    if (getSettings().autoSort) applyAutoSort();
    turnCallouts(g, null);
    return;
  }

  const fresh = g.events.filter((e) => e.id > lastEventId);
  lastEventId = g.events.at(-1)?.id ?? lastEventId;
  const hints: SpawnHints = new Map();
  for (const { e } of fresh) {
    handleEvent(e, g, hints);
    trackSeen(e, g);
  }
  trackSeen(null, g);

  // Clear selections/staging when the situation changed under us.
  const s = store.get();
  const me = g.you;
  const prevG = prev.game;
  const stepChanged = !prevG || prevG.step !== g.step || prevG.turn !== g.turn || prevG.phase !== g.phase;
  const rideChanged = prevG?.reveal?.ride?.formationId !== g.reveal?.ride?.formationId || prevG?.reveal?.current !== g.reveal?.current;
  if (stepChanged || rideChanged) {
    const hand = me !== null ? g.players[me].hand ?? [] : [];
    store.set({ staged: null, selected: s.selected.filter((c) => hand.includes(c) && !stepChanged) });
  }

  turnCallouts(g, prevG);
  if (getSettings().autoSort) {
    const hand = me !== null ? g.players[me].hand ?? [] : [];
    handOrder = sortedCards(hand, getSettings().sortBy);
  }
  pushToTable(hints);
}

/** "Your turn!", "Chicot's turn", "Take a Ride!": announced when they start. */
function turnCallouts(g: GameView, prevG: GameView | null): void {
  const me = g.you;
  const myTurn = me !== null && g.phase === 'playing' && g.turn === me;
  if (myTurn && !wasMyTurn) {
    play('highlight2');
    vibrate(40);
    turnCallout(t('c.yourTurn'), CALLOUT.you, {}, (x) => x.phase === 'playing' && x.turn === me);
    announce(t('sr.yourTurn'));
  } else if (g.phase === 'playing' && g.turn !== me && (prevG?.phase !== 'playing' || prevG.turn !== g.turn)) {
    const turn = g.turn;
    turnCallout(t('c.turnOf', { name: g.players[turn].name }), SEAT_COLORS[turn], { small: true, ms: 1000 }, (x) => x.phase === 'playing' && x.turn === turn);
  }
  wasMyTurn = myTurn;
  // Our turn to lay formations (not while a ride window is open).
  const myReveal = me !== null && g.phase === 'reveal' && !!g.reveal && !g.reveal.ride && g.reveal.order[g.reveal.current] === me;
  if (myReveal && !wasMyReveal) {
    play('highlight2');
    vibrate(40);
    callout(t('c.showYours'), CALLOUT.reveal);
    announce(t('sr.showYours'));
  }
  wasMyReveal = myReveal;
  const rideKey = myRideKey(g);
  if (rideKey && rideKey !== lastRideKey) {
    play('highlight1');
    callout(t('c.ride'), CALLOUT.ride, { ms: RIDE_CALLOUT_MS });
  }
  lastRideKey = rideKey;
}

/** Keeps the full move log: merges the recent events, fetches everything if there's a gap. */
let historyFetching = false;
function syncHistory(g: GameView | null): void {
  const s = store.get();
  if (!g) {
    if (s.history.length) store.set({ history: [], myDraws: {} });
    return;
  }
  const known = s.history;
  const lastKnown = known.at(-1)?.id ?? 0;
  const fresh = g.events.filter((x) => x.id > lastKnown);
  // A new game restarts ids; an id gap means we missed something (joined late, reconnected).
  const restarted = g.events.length > 0 && g.events.at(-1)!.id < lastKnown;
  const gap = fresh.length > 0 && fresh[0].id !== lastKnown + 1;
  if (restarted || gap) {
    store.set({ history: restarted ? [] : known, myDraws: restarted ? {} : s.myDraws });
    if (!historyFetching) {
      historyFetching = true;
      void fetchHistory().then((events) => {
        historyFetching = false;
        if (events) store.set({ history: events });
      });
    }
    return;
  }
  if (!fresh.length) return;
  // Only you know what you drew: remember it while it's still in view.
  const myDraws = { ...s.myDraws };
  const myDraw = [...fresh].reverse().find((x) => x.e.t === 'draw' && x.e.seat === g.you);
  if (myDraw && g.drawn !== null) myDraws[myDraw.id] = g.drawn;
  store.set({ history: [...known, ...fresh], myDraws });
}

function seatPos(g: GameView, seat: number) {
  return table.layout.seats[seat] ?? table.layout.draw;
}

function handleEvent(e: GameEvent, g: GameView, hints: SpawnHints): void {
  const L = table.layout;
  const me = g.you;
  const sfx = (n: Sfx, o?: Parameters<typeof play>[1]) => play(n, o);
  switch (e.t) {
    case 'cut':
      banner(t('b.deals', { name: name(g, e.dealer) }), { sub: t('b.lowestDeals'), tone: 'info' });
      announce(t('sr.cut', { name: name(g, e.dealer) }));
      break;
    case 'deal': {
      handOrder = me !== null ? [...(g.players[me].hand ?? [])] : [];
      const n = g.players.length;
      const speedK = getSettings().reducedMotion ? 0.3 : 1;
      const from = drawPileTop(L, 6);
      // Cards left from the last round burn away (Balatro's Hanged Man), then a
      // fresh deck is placed in the middle and slides to the draw pile.
      let lead = 0; // seconds before the deal starts
      if (table.hasCards) {
        const clear = table.dissolveAll();
        const hold = 0.45;
        const middle = { x: L.w / 2, y: L.h / 2 };
        for (let i = 0; i < 6; i++) hints.set(`d${i}`, { from: { x: middle.x - i * 0.8, y: middle.y - i * 2 }, hidden: clear, hold });
        sfx('tarot1', { volume: 0.6 });
        sfx('cardFan2', { delay: clear * 1000, volume: 0.6 });
        lead = clear + hold + 0.35;
      }
      const gs = Math.max(0.25, getSettings().gameSpeed);
      for (let j = 0; j < n; j++) {
        const seat = (e.dealer + 1 + j) % n;
        const p = g.players[seat];
        const count = seat === me ? (p.hand?.length ?? 0) : p.handCount;
        for (let k = 0; k < count; k++) {
          const key = seat === me ? `c${p.hand![k]}` : `o${seat}_${k}`;
          hints.set(key, { from, delay: (k * n + j) * 0.07 * speedK, hidden: lead, faceDown: true, reset: true });
        }
      }
      if (g.discardTop !== null) hints.set(`c${g.discardTop}`, { from, delay: 7 * n * 0.07 * speedK, hidden: lead, faceDown: true, reset: true });
      // Turn callouts wait until the cards have landed.
      dealUntil = Date.now() + lead * 1000 + ((7 * n + 4) * 70 * speedK) / gs;
      for (let i = 0; i < 7 * n; i += 2) sfx('cardSlide1', { delay: lead * 1000 + (i * 70 * speedK) / gs, volume: 0.5 });
      // Every round is dealt on a new colour, like a new blind in Balatro.
      shuffleTablePalette();
      setMood('table');
      swirl(1);
      banner(t('b.round', { n: e.round }), { sub: t('b.dealsPlays', { name: name(g, e.dealer) }), tone: 'info' });
      announce(t('sr.round', { n: e.round, name: name(g, e.dealer) }));
      store.set({ selected: [], staged: null });
      break;
    }
    case 'draw':
      sfx('card1');
      if (e.seat === me) {
        if (g.drawn !== null) {
          // Off the top of the pile, face down; it turns over when it lands.
          hints.set(`c${g.drawn}`, { from: drawPileTop(L, g.drawCount + 1), faceDown: true });
          announce(t('sr.youDrew', { card: cardSpoken(g.drawn) }));
        }
      } else {
        hints.set(`o${e.seat}_x`, { from: drawPileTop(L, g.drawCount + 1) });
        announce(t('sr.drew', { name: name(g, e.seat) }));
      }
      break;
    case 'take':
      sfx('card3');
      if (e.seat !== me) hints.set(`o${e.seat}_${g.players[e.seat].handCount - 1}`, { from: L.discard });
      announce(t('sr.took', { name: name(g, e.seat), card: cardSpoken(e.card) }));
      break;
    case 'discard':
      sfx('cardSlide2');
      if (e.seat !== me) hints.set(`c${e.card}`, { from: seatPos(g, e.seat) });
      announce(t('sr.discarded', { name: name(g, e.seat), card: cardSpoken(e.card) }));
      break;
    case 'reshuffle':
      sfx('cardFan2');
      swirl(1.5);
      banner(t('b.reshuffled'), { sub: t('b.reshuffledSub'), tone: 'info' });
      announce(t('sr.reshuffle', { n: e.count }));
      break;
    case 'end': {
      const who = name(g, e.seat);
      if (e.card !== null && e.seat !== null && e.seat !== me) hints.set(`c${e.card}`, { from: seatPos(g, e.seat) });
      sfx('tarot1');
      sfx('whoosh1', { delay: 120 });
      table.shake.add(8);
      swirl(2);
      setMood('reveal');
      const how = e.kind === 'pileOut' ? t('b.pileOut') : e.kind === 'exhausted' ? t('b.noCards') : t('b.txiJog', { name: who });
      if (e.bonus) {
        setTimeout(() => {
          sfx('foil1');
          sfx('multhit2', { delay: 200 });
          table.particles.sparkle(L.hand.x, L.h / 2, L.w * 0.6, 200, 50);
          banner(t('b.fullHand'), { sub: t('b.fullHandSub', { name: who }), joker: 'ride', tone: 'good', ms: 2600 });
        }, 900);
      } else if (e.kind !== 'manual') {
        setTimeout(() => banner(t('b.noRides'), { sub: t('b.noRidesSub'), joker: 'ride', tone: 'bad', ms: 2200 }), 1300);
      }
      banner(how, { sub: e.card !== null ? t('b.endingCard', { card: cardShort(e.card) }) : undefined, tone: 'bad' });
      announce(
        t('sr.end', {
          how,
          card: e.card !== null ? t('sr.withCard', { card: cardSpoken(e.card) }) : '',
          after: e.bonus ? t('sr.fullHand', { name: who }) : e.kind === 'manual' ? t('sr.ridesOpen') : t('sr.noRides'),
        }),
      );
      break;
    }
    case 'lay': {
      // If this formation opens a ride for us, "Take a ride!" plays first and
      // the cards land as it fades, so the callout doesn't cover them.
      const rideKey = myRideKey(g);
      const wait = rideKey === `${e.formationId}` && rideKey !== lastRideKey ? RIDE_CALLOUT_MS - 330 : 0;
      if (e.seat !== me) for (const c of e.cards) hints.set(`c${c}`, { from: seatPos(g, e.seat), hidden: wait / 1000 });
      sfx('card3', { delay: wait });
      sfx('chips1', { delay: wait + 150 });
      const grp = revealGroups(g, L).find((x) => x.id === e.formationId);
      if (grp) setTimeout(() => table.particles.burst(grp.x + grp.w / 2, grp.y + 40, { count: 14, colors: [0x009dff, 0xffffff] }), wait + 250);
      announce(t('sr.laid', { name: name(g, e.seat), kind: kindName(e.kind), cards: e.cards.map(cardSpoken).join(', ') }));
      break;
    }
    case 'ride': {
      // The card leaves the rider's hand and flies to the formation.
      hints.set(`c${e.card}`, { from: seatPos(g, e.seat) });
      sfx('multhit1');
      const grp = revealGroups(g, L).find((x) => x.id === e.formationId);
      if (grp) setTimeout(() => table.particles.burst(grp.x + grp.w / 2, grp.y + 40, { count: 16, colors: [0x4bc292, 0xffffff] }), 250);
      if (e.seat !== me) toast(t('b.rode', { name: name(g, e.seat), card: cardShort(e.card) }));
      announce(t('sr.rode', { name: name(g, e.seat), card: cardSpoken(e.card) }));
      break;
    }
    case 'pass':
      if (e.seat !== me) sfx('button', { volume: 0.3, rate: 0.8 });
      break;
    case 'doneLaying':
      announce(t('sr.doneLaying', { name: name(g, e.seat) }));
      break;
    case 'score': {
      const r = g.results.at(-1);
      if (!r) break;
      for (let i = 0; i < g.players.length; i++) sfx(i % 2 ? 'coin2' : 'coin1', { delay: 300 + i * 220 });
      setMood('table');
      announce(t('sr.score', { parts: r.points.map((p, i) => `${name(g, i)} ${p}`).join(', ') }));
      break;
    }
    case 'tximtxom':
      sfx('explosion1');
      sfx('win', { delay: 300 });
      table.shake.add(16);
      swirl(3);
      setMood('win');
      table.particles.burst(L.w / 2, L.h / 2, { count: 80, speed: 520, size: 8, colors: [0xfda200, 0xfe5f55, 0x009dff, 0xffffff] });
      lastTximTxomAt = Date.now();
      callout(t('b.tximtxom'), CALLOUT.tximtxom, { ms: 2200 });
      announce(t('sr.tximtxom', { name: name(g, e.seat) }));
      break;
    case 'gameOver': {
      const iWon = me !== null && e.winners.includes(me);
      const tie = e.winners.length > 1;
      if (iWon) {
        setMood('win');
        sfx('win');
        table.particles.sparkle(L.w / 2, L.h / 2, L.w * 0.8, L.h * 0.6, 70);
      } else {
        setMood('bust');
        sfx('negative');
        table.shake.add(6);
      }
      // After a TximTxom, let its callout finish first.
      setTimeout(() => callout(t('c.gameOver'), CALLOUT.gameOver, { ms: 1800 }), Math.max(0, lastTximTxomAt + 2200 - Date.now()));
      // The game-over modal says who won; no banner on top of it.
      const names = e.winners.map((w) => name(g, w)).join(' & ');
      announce(t('sr.gameOver', { who: tie ? t('sr.tieBetween', { names }) : t('sr.wins', { names }) }));
      break;
    }
  }
}

// ---------------------------------------------------------------- input

export function tapHand(card: Card): void {
  const s = store.get();
  const g = s.room?.game;
  if (!g || g.you === null || s.staged) return;
  const multi = isMultiSelect(g);
  const sel = s.selected.includes(card) ? s.selected.filter((c) => c !== card) : multi ? [...s.selected, card] : [card];
  play(sel.includes(card) ? 'card1' : 'cardSlide1', { volume: 0.5, rate: sel.includes(card) ? 1.15 : 0.9 });
  store.set({ selected: sel });
}

/** Drag-and-drop rules (the host re-checks everything). */
export function canDrop(card: Card, target: DropTarget): boolean {
  const s = store.get();
  const g = s.room?.game;
  if (!g || g.you === null || s.staged) return false;
  const me = g.you;
  const hand = g.players[me].hand ?? [];
  if (g.phase === 'playing' && g.turn === me) {
    if (g.mustEnd) return false;
    if (target.kind === 'discard') {
      if (g.step === 'drawn') return card === g.drawn || hand.includes(card);
      if (g.step === 'tookDiscard') return hand.includes(card) && card !== g.taken;
      return false;
    }
    if (target.kind === 'handCard') return g.step === 'drawn' && card === g.drawn && hand.includes(target.card);
    return false;
  }
  const r = g.reveal;
  if (g.phase === 'reveal' && r && !r.ride && target.kind === 'table') {
    return r.order[r.current] === me && hand.includes(card);
  }
  if (g.phase === 'reveal' && r?.ride && target.kind === 'formation' && target.id === r.ride.formationId) {
    const w = r.ride;
    if (!w.riders.includes(me) || !hand.includes(card)) return false;
    if (g.rules.rideOrder === 'roundRobin' ? w.riders[w.rrIndex] !== me : w.passed.includes(me)) return false;
    const f = r.formations.find((x) => x.id === w.formationId);
    if (!f || f.owner === me) return false;
    if (f.kind !== 'straight' && f.rides.some((x) => x.seat === me)) return false;
    return canRide(f.cards, card, g.rules) !== null;
  }
  return false;
}

export function drop(card: Card, target: DropTarget): void {
  const g = store.get().room?.game;
  if (!g) return;
  // Like the buttons, a dropped discard waits for End Turn (with "confirm moves"
  // on), so other players don't see the card until the turn is sent.
  if (target.kind === 'discard') stage(card === g.drawn ? { type: 'discardDrawn', card } : { type: 'swap', card });
  else if (target.kind === 'handCard') stage({ type: 'swap', card: target.card });
  else if (target.kind === 'table') {
    const sel = store.get().selected;
    void send({ type: 'lay', cards: sel.includes(card) ? sel : [...sel, card] });
  } else void send({ type: 'ride', card });
}

/** Balatro's "Nope!": a ride card that doesn't fit. */
function nope(): void {
  play('cancel');
  vibrate([30, 40, 30]);
  callout(t('c.nope'), CALLOUT.nope, { ms: 1000 });
}

export function badDrop(_card: Card, target: DropTarget): void {
  const g = store.get().room?.game;
  if (g && target.kind === 'formation' && myRideKey(g)) nope();
}

export function tapDrawn(card: Card): void {
  const s = store.get();
  if (s.staged) return;
  const sel = s.selected.includes(card) ? [] : [card];
  play('card1', { volume: 0.5, rate: 1.15 });
  store.set({ selected: sel });
}

function isMultiSelect(g: GameView): boolean {
  if (g.phase === 'reveal' && g.reveal) {
    if (g.reveal.ride) return false;
    return g.reveal.order[g.reveal.current] === g.you;
  }
  if (g.phase === 'playing' && g.turn === g.you && g.step !== 'choose') return false;
  return true;
}

export async function send(action: Action): Promise<boolean> {
  play('button');
  const r = await act(action);
  if (!r.ok && action.type === 'ride') {
    nope();
    return false;
  }
  if (!r.ok) {
    play('cancel');
    vibrate([30, 40, 30]);
    store.set((s) => ({ shake: s.shake + 1 }));
    return false;
  }
  store.set({ selected: [], staged: null });
  return true;
}

export function stage(st: Staged): void {
  if (!getSettings().confirmMoves) {
    void send(st);
    return;
  }
  play('cardSlide2', { volume: 0.7 });
  store.set({ staged: st, selected: [] });
}

export function undo(): void {
  play('cancel', { volume: 0.6 });
  store.set({ staged: null });
}

export function confirmStaged(): void {
  const st = store.get().staged;
  if (st) void send(st);
}

// ---------------------------------------------------------------- action bar
//
// Everyday actions (draw, take, discard, end turn, show, pass) sit in the
// middle. The two moves that end things, Txi jog and TximTxom, live in their
// own corners and need a press-and-hold, so a stray click can't trigger them.

export interface BarButton {
  label: string;
  color: 'red' | 'blue' | 'orange' | 'green' | 'grey';
  enabled: boolean;
  onClick: () => void;
  key?: string;
  title?: string;
}

export interface Bar {
  /** Basic actions, centre. */
  main: BarButton[];
  /** Hold-to-confirm: TximTxom (left corner). */
  tximtxom: BarButton | null;
  /** Hold-to-confirm: Txi jog (right corner). */
  txiJog: BarButton | null;
  status: string | null;
}

const EMPTY: Bar = { main: [], tximtxom: null, txiJog: null, status: null };

export function computeBar(room: RoomView | null, selected: Card[], staged: Staged | null): Bar {
  const g = room?.game;
  if (!g || g.you === null) return EMPTY;
  const me = g.you;
  const hand = g.players[me].hand ?? [];

  if (g.phase === 'playing') {
    if (g.turn !== me) return { ...EMPTY, status: t('st.waitingFor', { name: g.players[g.turn].name }) };

    if (staged) {
      return {
        ...EMPTY,
        main: [
          { label: t('act.undo'), color: 'orange', enabled: true, onClick: undo, key: 'Backspace' },
          { label: t('act.endTurn'), color: 'green', enabled: true, onClick: confirmStaged, key: 'E' },
        ],
        status: t('st.staged', { what: t('st.stagedDiscard', { card: cardShort(staged.card) }) }),
      };
    }

    const tximtxom = (swap?: Card): BarButton => ({
      label: t('act.tximtxom'),
      color: 'orange',
      enabled: true,
      onClick: () => void send({ type: 'tximtxom', swap }),
      key: 'T',
      title: t('act.tximtxomTitle'),
    });

    if (g.step === 'choose') {
      const top = g.discardTop;
      return {
        main: [
          { label: t('act.draw'), color: 'blue', enabled: g.drawCount > 0, onClick: () => void send({ type: 'draw' }), key: 'D' },
          {
            label: top !== null ? t('act.take', { card: cardShort(top) }) : t('act.take', { card: '' }),
            color: 'red',
            enabled: top !== null,
            onClick: () => void send({ type: 'takeDiscard' }),
            key: 'P',
          },
        ],
        tximtxom: tximtxom(),
        txiJog: null,
        status: t('st.choose'),
      };
    }

    const sel = selected[0];
    if (g.step === 'drawn') {
      const drawn = g.drawn!;
      const usingHand = sel !== undefined && sel !== drawn && hand.includes(sel);
      const target = usingHand ? sel : drawn;
      const canEnd = g.mustEnd || canEndWith(target);
      return {
        main: g.mustEnd
          ? []
          : [
              usingHand
                ? { label: t('act.swap', { card: cardShort(sel) }), color: 'blue', enabled: true, onClick: () => stage({ type: 'swap', card: sel }), key: 'Enter' }
                : { label: t('act.discard', { card: cardShort(drawn) }), color: 'blue', enabled: true, onClick: () => stage({ type: 'discardDrawn', card: drawn }), key: 'Enter' },
            ],
        tximtxom: tximtxom(usingHand ? sel : drawn),
        txiJog: {
          label: t('act.txiJog', { card: cardShort(target) }),
          color: 'red',
          enabled: canEnd,
          onClick: () => void send({ type: 'endRound', card: target }),
          key: 'R',
          title: canEnd ? undefined : t('act.txiJogNeeds'),
        },
        status: g.mustEnd ? t('st.mustEnd') : usingHand ? null : t('st.drawn'),
      };
    }

    // tookDiscard
    const ok = sel !== undefined && sel !== g.taken && hand.includes(sel);
    return {
      main: [
        {
          label: ok ? t('act.discard', { card: cardShort(sel) }) : t('act.pickCard'),
          color: 'blue',
          enabled: ok,
          onClick: () => ok && stage({ type: 'swap', card: sel }),
          key: 'Enter',
        },
      ],
      tximtxom: tximtxom(ok ? sel : undefined),
      txiJog: {
        label: ok ? t('act.txiJog', { card: cardShort(sel) }) : t('act.txiJogPlain'),
        color: 'red',
        enabled: ok && canEndWith(sel),
        onClick: () => ok && void send({ type: 'endRound', card: sel }),
        key: 'R',
        title: t('act.txiJogNeeds'),
      },
      status: ok ? null : t('st.tookPick'),
    };
  }

  if (g.phase === 'reveal' && g.reveal) {
    const r = g.reveal;
    const w = r.ride;
    if (w) {
      const owner = r.formations.find((f) => f.id === w.formationId)?.owner ?? 0;
      const amRider = w.riders.includes(me) && hand.length > 0;
      const myGo = g.rules.rideOrder === 'roundRobin' ? w.riders[w.rrIndex] === me : !w.passed.includes(me);
      if (amRider && myGo) {
        const card = selected[0];
        return {
          ...EMPTY,
          main: [
            {
              label: card !== undefined ? t('act.ride', { card: cardShort(card) }) : t('act.pickCard'),
              color: 'green',
              enabled: card !== undefined,
              onClick: () => card !== undefined && void send({ type: 'ride', card }),
              key: 'Enter',
            },
            { label: t('act.pass'), color: 'red', enabled: true, onClick: () => void send({ type: 'pass' }), key: 'E' },
          ],
          status: t('st.ride', { name: name(g, owner) }),
        };
      }
      const waiting = g.rules.rideOrder === 'roundRobin' ? g.players[w.riders[w.rrIndex]].name : t('st.otherPlayers');
      return {
        ...EMPTY,
        status: amRider ? t('st.waitingFor', { name: waiting }) : owner === me ? t('st.rideOnMine') : t('st.rideOnTheirs', { name: g.players[owner].name }),
      };
    }
    if (r.order[r.current] === me) {
      // Nothing left to form: the only move is to finish.
      if (g.noMoreFormations) {
        return {
          ...EMPTY,
          main: [{ label: t('act.finish'), color: 'green', enabled: true, onClick: () => void send({ type: 'doneLaying' }), key: 'Enter' }],
          status: t('st.noMore'),
        };
      }
      return {
        ...EMPTY,
        main: [
          { label: t('act.lay'), color: 'blue', enabled: selected.length >= 2, onClick: () => void send({ type: 'lay', cards: selected }), key: 'Enter' },
          { label: t('act.done'), color: 'red', enabled: true, onClick: () => void send({ type: 'doneLaying' }), key: 'E', title: t('act.doneTitle') },
        ],
        status: g.noMoreFormations ? t('st.noMore') : t('st.select'),
      };
    }
    const cur = r.order[r.current];
    return { ...EMPTY, status: cur !== undefined ? t('st.showing', { name: g.players[cur].name }) : null };
  }

  return EMPTY;
}

export function readyForNextRound(): void {
  void send({ type: 'ready' });
}

export { tError };
