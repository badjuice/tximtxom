import {
  type Action,
  type Card,
  canEndWith,
  canRide,
  cardLabel,
  cardName,
  type GameEvent,
  type GameView,
  rankOf,
  type RoomView,
  suitOf,
} from '@tximtxom/shared';
import { play, type Sfx, vibrate } from './audio';
import { setMood, swirl } from './background';
import { drawPileTop, revealGroups } from './game/scene';
import type { DropTarget, SpawnHints, Table } from './game/table';
import { act, fetchHistory } from './net';
import { getSettings } from './settings';
import { banner, type Staged, store, toast } from './store';

let table: Table;
let lastEventId = 0;
let lastRoomCode = '';
let handOrder: Card[] = [];
let wasMyTurn = false;
let announce: (text: string) => void = () => {};

export function setAnnouncer(fn: (text: string) => void): void {
  announce = fn;
}

export function initController(t: Table): void {
  table = t;
  store.subscribe(onStore);
}

export function getHandOrder(): Card[] {
  return handOrder;
}

export function setHandOrder(order: Card[]): void {
  handOrder = order;
  pushToTable();
}

export function sortHand(by: 'rank' | 'suit'): void {
  const g = store.get().room?.game;
  if (!g || g.you === null) return;
  const hand = [...(g.players[g.you].hand ?? [])];
  hand.sort((a, b) =>
    by === 'rank' ? rankOf(a) - rankOf(b) || suitOf(a) - suitOf(b) : suitOf(a) - suitOf(b) || rankOf(a) - rankOf(b),
  );
  play('cardFan2', { volume: 0.6 });
  setHandOrder(hand);
}

function name(g: GameView, seat: number | null): string {
  if (seat === null) return 'Nobody';
  return seat === g.you ? 'You' : g.players[seat].name;
}

let prevRoom: RoomView | null = null;

function onStore(): void {
  const s = store.get();
  const room = s.room;
  if (room !== prevRoom) {
    const prev = prevRoom;
    prevRoom = room;
    onRoom(room, prev);
  }
  pushToTable();
}

function pushToTable(hints?: SpawnHints): void {
  const s = store.get();
  table.set({ game: s.room?.game ?? null, handOrder, selected: s.selected, staged: s.staged }, hints);
}

function onRoom(room: RoomView | null, prev: RoomView | null): void {
  const g = room?.game ?? null;
  syncHistory(g);
  if (!room || !g) {
    setMood(room ? 'menu' : 'menu');
    lastEventId = 0;
    wasMyTurn = false;
    return;
  }
  // First view of this game (joined or rejoined): no replays of old events.
  if (room.code !== lastRoomCode || !prev?.game) {
    lastRoomCode = room.code;
    lastEventId = g.events.at(-1)?.id ?? 0;
    setMood(g.phase === 'reveal' ? 'reveal' : 'table');
    const me = g.you;
    if (me !== null) handOrder = [...(g.players[me].hand ?? [])];
    return;
  }

  const fresh = g.events.filter((e) => e.id > lastEventId);
  lastEventId = g.events.at(-1)?.id ?? lastEventId;
  const hints: SpawnHints = new Map();
  for (const { e } of fresh) handleEvent(e, g, hints);

  // Clear selections/staging when the situation changed under us.
  const s = store.get();
  const me = g.you;
  const myTurn = me !== null && g.phase === 'playing' && g.turn === me;
  const prevG = prev.game;
  const stepChanged = !prevG || prevG.step !== g.step || prevG.turn !== g.turn || prevG.phase !== g.phase;
  const rideChanged = prevG?.reveal?.ride?.formationId !== g.reveal?.ride?.formationId || prevG?.reveal?.current !== g.reveal?.current;
  if (stepChanged || rideChanged) {
    const hand = me !== null ? g.players[me].hand ?? [] : [];
    store.set({ staged: null, selected: s.selected.filter((c) => hand.includes(c) && !stepChanged) });
  }

  if (myTurn && !wasMyTurn) {
    play('highlight2');
    vibrate(40);
    banner('Your turn', { tone: 'info', ms: 1100 });
    announce('Your turn. Draw from the pile or take the discard.');
  }
  wasMyTurn = myTurn;
  pushToTable(hints);
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
      banner(`${name(g, e.dealer)} deal${e.dealer === me ? '' : 's'}`, { sub: 'Lowest card deals first', tone: 'info' });
      announce(`${name(g, e.dealer)} won the cut and deals first.`);
      break;
    case 'deal': {
      handOrder = me !== null ? [...(g.players[me].hand ?? [])] : [];
      const n = g.players.length;
      const speedK = getSettings().reducedMotion ? 0.3 : 1;
      for (let j = 0; j < n; j++) {
        const seat = (e.dealer + 1 + j) % n;
        const p = g.players[seat];
        const count = seat === me ? (p.hand?.length ?? 0) : p.handCount;
        for (let k = 0; k < count; k++) {
          const key = seat === me ? `c${p.hand![k]}` : `o${seat}_${k}`;
          hints.set(key, { from: L.draw, delay: (k * n + j) * 0.07 * speedK, faceDown: true, reset: true });
        }
      }
      if (g.discardTop !== null) hints.set(`c${g.discardTop}`, { from: L.draw, delay: 7 * n * 0.07 * speedK, faceDown: true, reset: true });
      for (let i = 0; i < 7 * n; i += 2) sfx('cardSlide1', { delay: i * 70 * speedK, volume: 0.5 });
      setMood('table');
      swirl(1);
      banner(`Round ${e.round}`, { sub: `${name(g, e.dealer)} deal${e.dealer === me ? '' : 's'} and play${e.dealer === me ? '' : 's'} first`, tone: 'info' });
      announce(`Round ${e.round}. ${name(g, e.dealer)} dealt. The dealer plays first.`);
      store.set({ selected: [], staged: null });
      break;
    }
    case 'draw':
      sfx('card1');
      if (e.seat === me) {
        if (g.drawn !== null) {
          // Off the top of the pile, face down; it turns over when it lands.
          hints.set(`c${g.drawn}`, { from: drawPileTop(L, g.drawCount + 1), faceDown: true });
          announce(`You drew the ${cardName(g.drawn)}.`);
        }
      } else {
        hints.set(`o${e.seat}_x`, { from: drawPileTop(L, g.drawCount + 1) });
        announce(`${name(g, e.seat)} drew from the pile.`);
      }
      break;
    case 'take':
      sfx('card3');
      if (e.seat !== me) {
        hints.set(`o${e.seat}_${g.players[e.seat].handCount - 1}`, { from: L.discard });
      }
      announce(`${name(g, e.seat)} took the ${cardName(e.card)} from the discard pile.`);
      break;
    case 'discard':
      sfx('cardSlide2');
      if (e.seat !== me) hints.set(`c${e.card}`, { from: seatPos(g, e.seat) });
      announce(`${name(g, e.seat)} discarded the ${cardName(e.card)}.`);
      break;
    case 'reshuffle':
      sfx('cardFan2');
      swirl(1.5);
      banner('Reshuffled!', { sub: 'Last pile: when it runs out, the round ends', tone: 'info' });
      announce(`The discard pile was reshuffled into a new draw pile of ${e.count} cards. This only happens once.`);
      break;
    case 'end': {
      const who = name(g, e.seat);
      if (e.card !== null && e.seat !== null && e.seat !== me) hints.set(`c${e.card}`, { from: seatPos(g, e.seat) });
      sfx('tarot1');
      sfx('whoosh1', { delay: 120 });
      table.shake.add(8);
      swirl(2);
      setMood('reveal');
      const how = e.kind === 'pileOut' ? 'The draw pile ran out!' : e.kind === 'exhausted' ? 'No cards left!' : `${who} ended the round`;
      const cardTxt = e.card !== null ? ` with the ${cardName(e.card)}` : '';
      if (e.bonus) {
        setTimeout(() => {
          sfx('foil1');
          sfx('multhit2', { delay: 200 });
          table.particles.sparkle(L.hand.x, L.h / 2, L.w * 0.6, 200, 50);
          banner('-10! Full hand', { sub: `${who} formed all 7 cards. No rides this round!`, joker: 'ride_the_bus', tone: 'good', ms: 2600 });
        }, 900);
      } else if (e.kind !== 'manual') {
        setTimeout(() => banner('No rides this round', { sub: 'The draw pile ran out', joker: 'ride_the_bus', tone: 'bad', ms: 2200 }), 1300);
      }
      banner(how, { sub: e.card !== null ? `Ending card: ${cardLabel(e.card)}` : undefined, tone: 'bad' });
      announce(`${how}${cardTxt}. ${e.bonus ? `${who} gets minus 10 for a full hand; no rides.` : e.kind === 'manual' ? 'Formations will be shown one by one; you can take a ride.' : 'No rides this round.'}`);
      break;
    }
    case 'lay': {
      const f = g.reveal?.formations.find((x) => x.id === e.formationId);
      if (!f) break;
      if (e.seat !== me) for (const c of f.cards) hints.set(`c${c}`, { from: seatPos(g, e.seat) });
      sfx('card3');
      sfx('chips1', { delay: 150 });
      const grp = revealGroups(g, L).find((x) => x.id === f.id);
      if (grp) setTimeout(() => table.particles.burst(grp.x + grp.w / 2, grp.y + 40, { count: 14, colors: [0x009dff, 0xffffff] }), 250);
      announce(`${name(g, e.seat)} laid a ${f.kind}: ${f.cards.map(cardName).join(', ')}.`);
      break;
    }
    case 'ride': {
      hints.set(`c${e.card}`, { from: seatPos(g, e.seat) });
      sfx('multhit1');
      const grp = revealGroups(g, L).find((x) => x.id === e.formationId);
      if (grp) setTimeout(() => table.particles.burst(grp.x + grp.w / 2, grp.y + 40, { count: 16, colors: [0x4bc292, 0xffffff] }), 250);
      if (e.seat !== me) toast(`${name(g, e.seat)} took a ride with ${cardLabel(e.card)}!`);
      announce(`${name(g, e.seat)} took a ride with the ${cardName(e.card)}.`);
      break;
    }
    case 'pass':
      if (e.seat !== me) sfx('button', { volume: 0.3, rate: 0.8 });
      break;
    case 'doneLaying':
      announce(`${name(g, e.seat)} has no more formations.`);
      break;
    case 'score': {
      const r = g.results.at(-1);
      if (!r) break;
      for (let i = 0; i < g.players.length; i++) sfx(i % 2 ? 'coin2' : 'coin1', { delay: 300 + i * 220 });
      setMood('table');
      const parts = r.points.map((p, i) => `${name(g, i)} ${p}`).join(', ');
      announce(`Round over. Points this round: ${parts}.`);
      break;
    }
    case 'tximtxom':
      sfx('explosion1');
      sfx('win', { delay: 300 });
      table.shake.add(16);
      swirl(3);
      setMood('win');
      table.particles.burst(L.w / 2, L.h / 2, { count: 80, speed: 520, size: 8, colors: [0xfda200, 0xfe5f55, 0x009dff, 0xffffff] });
      banner('TximTxom!', { sub: `${name(g, e.seat)} made a 7-card straight flush!`, joker: 'superposition', tone: 'good', ms: 3500 });
      announce(`TximTxom! ${name(g, e.seat)} wins the game with a seven card straight flush.`);
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
      const names = e.winners.map((w) => g.players[w].name).join(' & ');
      banner(tie ? "It's a tie!" : iWon ? 'You win!' : `${names} wins!`, { tone: iWon ? 'good' : 'bad', ms: 3000, joker: iWon ? 'joker' : 'mr_bones' });
      announce(`Game over. ${tie ? `Tie between ${names}` : `${names} wins`}.`);
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

/** Drag-and-drop rules (the server re-checks everything). */
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
  if (target.kind === 'discard') void send(card === g.drawn ? { type: 'discardDrawn' } : { type: 'swap', card });
  else if (target.kind === 'handCard') void send({ type: 'swap', card: target.card });
  else void send({ type: 'ride', card });
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
  play(st.type === 'endRound' ? 'tarot1' : 'cardSlide2', { volume: 0.7 });
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

export interface BarButton {
  label: string;
  color: 'red' | 'blue' | 'orange' | 'green' | 'grey';
  enabled: boolean;
  onClick: () => void;
  key?: string;
  title?: string;
}

export interface Bar {
  left: BarButton | null;
  middle: BarButton | null;
  right: BarButton | null;
  status: string | null;
}

const EMPTY: Bar = { left: null, middle: null, right: null, status: null };

export function computeBar(room: RoomView | null, selected: Card[], staged: Staged | null): Bar {
  const g = room?.game;
  if (!g || g.you === null) return EMPTY;
  const me = g.you;
  const hand = g.players[me].hand ?? [];

  if (g.phase === 'playing') {
    if (g.turn !== me) return { ...EMPTY, status: `Waiting for ${g.players[g.turn].name}…` };

    if (staged) {
      const what =
        staged.type === 'discardDrawn' ? `Discard ${cardLabel(staged.card)}` : staged.type === 'swap' ? `Discard ${cardLabel(staged.card)}` : `End the round with ${cardLabel(staged.card)}`;
      return {
        left: { label: 'Undo', color: 'grey', enabled: true, onClick: undo, key: 'Backspace' },
        middle: null,
        right: {
          label: staged.type === 'endRound' ? 'Confirm End' : 'End Turn',
          color: staged.type === 'endRound' ? 'red' : 'green',
          enabled: true,
          onClick: confirmStaged,
          key: 'E',
        },
        status: what,
      };
    }

    const tximtxom = (swap?: Card): BarButton => ({
      label: 'TximTxom!',
      color: 'orange',
      enabled: true,
      onClick: () => void send({ type: 'tximtxom', swap }),
      key: 'T',
      title: 'Call TximTxom with a 7-card straight flush. Wins the game.',
    });

    if (g.step === 'choose') {
      const top = g.discardTop;
      return {
        left: tximtxom(),
        middle: { label: 'Draw', color: 'blue', enabled: g.drawCount > 0, onClick: () => void send({ type: 'draw' }), key: 'D' },
        right: {
          label: top !== null ? `Take ${cardLabel(top)}` : 'Take',
          color: 'red',
          enabled: top !== null,
          onClick: () => void send({ type: 'takeDiscard' }),
          key: 'P',
        },
        status: null,
      };
    }

    const sel = selected[0];
    if (g.step === 'drawn') {
      const drawn = g.drawn!;
      const usingHand = sel !== undefined && sel !== drawn && hand.includes(sel);
      const target = usingHand ? sel : drawn;
      const canEnd = g.mustEnd || canEndWith(target);
      return {
        left: tximtxom(usingHand ? sel : drawn),
        middle: g.mustEnd
          ? { label: 'Must end', color: 'grey', enabled: false, onClick: () => {} }
          : usingHand
            ? { label: `Swap ${cardLabel(sel)}`, color: 'blue', enabled: true, onClick: () => stage({ type: 'swap', card: sel }), key: 'Enter' }
            : { label: `Discard ${cardLabel(drawn)}`, color: 'blue', enabled: true, onClick: () => stage({ type: 'discardDrawn', card: drawn }), key: 'Enter' },
        right: {
          label: `End with ${cardLabel(target)}`,
          color: 'red',
          enabled: canEnd,
          onClick: () => stage({ type: 'endRound', card: target }),
          key: 'R',
          title: canEnd ? undefined : 'You need a 5 or lower to end the round',
        },
        status: g.mustEnd
          ? 'Last card of the pile: end the round with any card'
          : usingHand
            ? null
            : 'Keep it: tap a hand card to swap. Or discard it.',
      };
    }

    // tookDiscard
    const ok = sel !== undefined && sel !== g.taken && hand.includes(sel);
    return {
      left: tximtxom(ok ? sel : undefined),
      middle: {
        label: ok ? `Discard ${cardLabel(sel)}` : 'Pick a card',
        color: 'blue',
        enabled: ok,
        onClick: () => ok && stage({ type: 'swap', card: sel }),
        key: 'Enter',
      },
      right: {
        label: ok ? `End with ${cardLabel(sel)}` : 'End round',
        color: 'red',
        enabled: ok && canEndWith(sel),
        onClick: () => ok && stage({ type: 'endRound', card: sel }),
        key: 'R',
        title: 'You need a 5 or lower to end the round',
      },
      status: ok ? null : 'Pick a card to let go (not the one you took)',
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
          left: null,
          middle: {
            label: card !== undefined ? `Ride ${cardLabel(card)}` : 'Pick a card',
            color: 'green',
            enabled: card !== undefined,
            onClick: () => card !== undefined && void send({ type: 'ride', card }),
            key: 'Enter',
          },
          right: { label: 'Pass', color: 'grey', enabled: true, onClick: () => void send({ type: 'pass' }), key: 'E' },
          status: `Take a Ride on ${name(g, owner)}'s formation?`,
        };
      }
      const waiting = g.rules.rideOrder === 'roundRobin' ? g.players[w.riders[w.rrIndex]].name : 'other players';
      return { ...EMPTY, status: amRider ? `Waiting for ${waiting}…` : `Others may ride on ${owner === me ? 'your' : `${g.players[owner].name}'s`} formation…` };
    }
    if (r.order[r.current] === me) {
      return {
        left: { label: 'Done', color: 'grey', enabled: true, onClick: () => void send({ type: 'doneLaying' }), key: 'E', title: 'No more formations to show' },
        middle: {
          label: 'Lay formation',
          color: 'blue',
          enabled: selected.length >= 2,
          onClick: () => void send({ type: 'lay', cards: selected }),
          key: 'Enter',
        },
        right: null,
        status: g.noMoreFormations ? 'No more formations possible' : 'Select cards to show a formation',
      };
    }
    const cur = r.order[r.current];
    return { ...EMPTY, status: cur !== undefined ? `${g.players[cur].name} is showing formations…` : null };
  }

  if (g.phase === 'roundOver') {
    const ready = g.players[me].ready;
    return {
      ...EMPTY,
      middle: ready ? null : { label: 'Next round', color: 'blue', enabled: true, onClick: () => void send({ type: 'ready' }), key: 'Enter' },
      status: ready ? 'Waiting for the others…' : null,
    };
  }
  return EMPTY;
}
