import { type Card, type GameView, rankOf, suitOf } from '@tximtxom/shared';
import type { Staged } from '../store';
import type { CardTarget } from './cardView';
import { CARD_H, CARD_W, fan, type Layout, type Point } from './layout';

export const GOLD = 0xfda200;
export const BLUE = 0x009dff;
export const RED = 0xfe5f55;
export const GREEN = 0x4bc292;

export interface DesiredCard {
  key: string;
  card: Card | null;
  target: CardTarget;
  /** Which kind of thing this is, for input handling. */
  role: 'hand' | 'drawn' | 'drawPile' | 'discardTop' | 'opponent' | 'formation' | 'endCard' | 'pileUnder' | 'leftover';
  seat?: number;
}

export interface FormationGroup {
  id: number;
  owner: number;
  kind: string;
  x: number;
  y: number;
  w: number;
  active: boolean;
  cards: { card: Card; x: number; y: number; rider: number | null }[];
}

export interface SceneInput {
  game: GameView;
  layout: Layout;
  handOrder: Card[];
  /** Auto sort is on: keep the hand in this order, also while a move is staged. */
  autoSortBy: 'rank' | 'suit' | null;
  selected: Card[];
  staged: Staged | null;
  /** Previously seen discard tops (for a visible pile under the top card). */
  discardMemory: Card[];
  /** Hand card being dragged and where. */
  drag: { card: Card; x: number; y: number } | null;
}

/** Lays out formations in rows inside the reveal area. */
/** Card overlap in a formation, as a share of card width. Formations whose
 *  ride is over close up to save room (tunable). */
export const FORMATION_STEP = 0.55;
export const FORMATION_STEP_DONE = 0.3;

export function revealGroups(game: GameView, layout: Layout): FormationGroup[] {
  const r = game.reveal;
  if (!r) return [];
  const area = layout.reveal;
  const sc = area.cardScale;
  const cw = CARD_W * sc;
  const ch = CARD_H * sc;
  const gap = 26;
  const rowH = ch + 34;
  const groups: FormationGroup[] = [];
  let x = area.x;
  let y = area.y + 22;
  const rows: FormationGroup[][] = [[]];
  for (const f of r.formations) {
    // The formation still open for riding keeps full spacing; finished ones tighten.
    const open = r.ride?.formationId === f.id;
    const step = cw * (open ? FORMATION_STEP : FORMATION_STEP_DONE);
    const w = (f.cards.length - 1) * step + cw;
    if (x + w > area.x + area.w && x > area.x) {
      x = area.x;
      y += rowH;
      rows.push([]);
    }
    const riderOf = new Map(f.rides.map((rd) => [rd.card, rd.seat]));
    const g: FormationGroup = {
      id: f.id,
      owner: f.owner,
      kind: f.kind,
      x,
      y,
      w,
      active: open,
      cards: f.cards.map((card, i) => ({ card, x: x + cw / 2 + i * step, y: y + ch / 2, rider: riderOf.get(card) ?? null })),
    };
    groups.push(g);
    rows[rows.length - 1].push(g);
    x += w + gap;
  }
  // Centre each row horizontally.
  for (const row of rows) {
    if (!row.length) continue;
    const last = row[row.length - 1];
    const used = last.x + last.w - row[0].x;
    const shift = (area.w - used) / 2;
    for (const g of row) {
      g.x += shift;
      for (const c of g.cards) c.x += shift;
    }
  }
  // Centre vertically when there's room; squeeze rows when there isn't.
  const totalH = rows.length * rowH;
  const spare = area.h + 40 - totalH;
  if (spare > 0) {
    for (const g of groups) {
      g.y += spare / 2;
      for (const c of g.cards) c.y += spare / 2;
    }
  }
  if (totalH > area.h + 40) {
    const k = (area.h + 40 - ch) / Math.max(1, totalH - rowH);
    for (const g of groups) {
      const off = g.y - (area.y + 22);
      const ny = area.y + 22 + off * Math.min(1, k);
      for (const c of g.cards) c.y += ny - g.y;
      g.y = ny;
    }
  }
  return groups;
}

export function sortedCards(hand: readonly Card[], by: 'rank' | 'suit'): Card[] {
  return [...hand].sort((a, b) =>
    by === 'rank' ? rankOf(a) - rankOf(b) || suitOf(a) - suitOf(b) : suitOf(a) - suitOf(b) || rankOf(a) - rankOf(b),
  );
}

/** Where the top card of the draw pile sits when the pile holds `count` cards. */
export function drawPileTop(layout: Layout, count: number): Point {
  const i = Math.max(0, Math.min(count, 6) - 1);
  return { x: layout.draw.x - i * 0.8, y: layout.draw.y - i * 2 };
}

/** Positions for the player's own hand, in order. */
export function handSlots(layout: Layout, count: number): { x: number; y: number; rot: number }[] {
  const spacing = Math.min(layout.hand.spacing, (layout.w - 120) / Math.max(1, count));
  return fan(layout.hand, count, spacing, 0.035);
}

/** Top edge of the zone where a dragged hand card, let go, reorders the hand. */
export function handDropTop(layout: Layout): number {
  return layout.hand.y - (CARD_H * layout.hand.cardScale) / 2 - 20;
}

/** `order` with `card` moved to the slot nearest to x: where dropping it would put it. */
export function reorderedHand(layout: Layout, order: Card[], card: Card, x: number): Card[] {
  const slots = handSlots(layout, order.length);
  const without = order.filter((c) => c !== card);
  let idx = slots.findIndex((s) => x < s.x);
  if (idx < 0) idx = order.length - 1;
  without.splice(Math.min(idx, without.length), 0, card);
  return without;
}

export function describeScene(input: SceneInput): DesiredCard[] {
  const { game: g, layout: L, selected, staged, drag } = input;
  const out: DesiredCard[] = [];
  const me = g.you;
  const myTurn = me !== null && g.phase === 'playing' && g.turn === me;
  const revealing = g.phase === 'reveal';
  const roundDone = g.phase === 'roundOver' || g.phase === 'gameOver';
  // Once the round ends, the draw and discard piles slide together into one
  // stack beside the ending card, out of the way of the formations.
  const merged = revealing || roundDone;
  const stack = { x: L.endCard.x - 60, y: L.endCard.y };
  const ps = L.pileScale;

  // --- Draw pile (only the top few backs are drawn)
  const shown = Math.min(g.drawCount, 6);
  for (let i = 0; i < shown; i++) {
    const top = i === shown - 1;
    out.push({
      key: `d${i}`,
      card: null,
      role: 'drawPile',
      target: {
        ...(merged ? { x: stack.x - i * 0.8, y: stack.y - i * 2 } : drawPileTop(L, i + 1)),
        rot: 0,
        scale: ps,
        z: 10 + i,
        faceUp: false,
        wobble: top,
        glow: top && myTurn && g.step === 'choose' ? GOLD : null,
      },
    });
  }

  // --- Discard pile: the top card, plus the previous one peeking out underneath.
  const endCard = g.reveal?.endCard ?? null;
  const top = g.discardTop;
  if (merged && top !== null && top !== endCard) {
    // Face down on top of the draw pile, as one stack.
    out.push({
      key: `c${top}`,
      card: top,
      role: 'discardTop',
      target: { x: stack.x - shown * 0.8, y: stack.y - shown * 2, rot: 0, scale: ps, z: 10 + shown, faceUp: false },
    });
  } else if (top !== null && top !== endCard) {
    const under = input.discardMemory.at(-2);
    if (under !== undefined && under !== top && g.discardCount >= 2) {
      out.push({
        key: `c${under}`,
        card: under,
        role: 'pileUnder',
        target: { x: L.discard.x + 4, y: L.discard.y + 2, rot: 0.12, scale: ps, z: 19, faceUp: true },
      });
    }
    let x = L.discard.x;
    let y = L.discard.y;
    // A staged move covers the top discard visually; nudge it so both read.
    if (staged && staged.type !== 'endRound') {
      x -= 6;
      y += 3;
    }
    out.push({
      key: `c${top}`,
      card: top,
      role: 'discardTop',
      target: {
        x,
        y,
        rot: -0.03,
        scale: ps,
        z: 20,
        faceUp: true,
        wobble: true,
        glow: myTurn && g.step === 'choose' ? GOLD : null,
      },
    });
  }

  // --- My hand
  if (me !== null) {
    const hand = g.players[me].hand ?? [];
    const order = input.handOrder.filter((c) => hand.includes(c));
    for (const c of hand) if (!order.includes(c)) order.push(c);
    const drawn = g.drawn;

    // Apply a staged move to the picture (not to the real state).
    let shownHand = order;
    let drawnSpot: { card: Card; at: 'drawn' | 'discard' | 'end' } | null = drawn !== null ? { card: drawn, at: 'drawn' } : null;
    let leaving: { card: Card; at: 'discard' | 'end' } | null = null;
    if (staged) {
      if (staged.type === 'discardDrawn' && drawnSpot) drawnSpot.at = 'discard';
      else if (staged.card === drawn && staged.type === 'endRound' && drawnSpot) drawnSpot.at = 'end';
      else if (order.includes(staged.card)) {
        leaving = { card: staged.card, at: staged.type === 'endRound' ? 'end' : 'discard' };
        shownHand = order.map((c) => (c === staged.card && drawn !== null ? drawn : c)).filter((c) => c !== staged.card);
        // The drawn card takes the leaving card's slot; with auto sort it goes where it belongs.
        if (input.autoSortBy) shownHand = sortedCards(shownHand, input.autoSortBy);
        if (drawn !== null) drawnSpot = null;
      }
    }

    // A card held over the hand opens a gap where it would land, like Balatro.
    if (drag && !staged && shownHand.includes(drag.card) && drag.y >= handDropTop(L)) shownHand = reorderedHand(L, shownHand, drag.card, drag.x);

    const slots = handSlots(L, shownHand.length);
    shownHand.forEach((c, i) => {
      const s = slots[i];
      const dragging = drag?.card === c;
      out.push({
        key: `c${c}`,
        card: c,
        role: 'hand',
        target: {
          x: dragging ? drag!.x : s.x,
          y: dragging ? drag!.y : s.y,
          rot: dragging ? 0 : s.rot,
          scale: L.hand.cardScale,
          z: dragging ? 200 : 100 + i,
          faceUp: true,
          raised: selected.includes(c),
          wobble: !dragging,
          dragged: dragging,
          glow: c === g.taken && myTurn && g.step === 'tookDiscard' ? BLUE : null,
        },
      });
    });

    const spot = (at: 'drawn' | 'discard' | 'end'): Point => (at === 'drawn' ? L.drawn : at === 'discard' ? L.discard : L.endCard);
    if (drawnSpot) {
      const p = spot(drawnSpot.at);
      out.push({
        key: `c${drawnSpot.card}`,
        card: drawnSpot.card,
        role: 'drawn',
        target: {
          x: p.x + (drawnSpot.at === 'drawn' ? 0 : 10),
          y: p.y - (drawnSpot.at === 'drawn' ? 0 : 14),
          rot: drawnSpot.at === 'drawn' ? 0.04 : 0.08,
          scale: ps * (drawnSpot.at === 'drawn' ? 1.12 : 1),
          z: 150,
          faceUp: true,
          raised: drawnSpot.at === 'drawn' && selected.includes(drawnSpot.card),
          alpha: 1,
          wobble: true,
          glow: drawnSpot.at === 'drawn' ? GOLD : null,
        },
      });
    }
    if (leaving) {
      const p = spot(leaving.at);
      out.push({
        key: `c${leaving.card}`,
        card: leaving.card,
        role: 'drawn',
        target: { x: p.x + 10, y: p.y - 14, rot: 0.08, scale: ps, z: 150, faceUp: true, glow: leaving.at === 'end' ? RED : GOLD, wobble: true },
      });
    }
  }

  // --- Opponents
  g.players.forEach((p, s) => {
    if (s === me) return;
    const a = L.seats[s];
    const os = L.opponentScale;
    if (roundDone && p.hand) {
      const slots = fan(a, p.hand.length, 26, 0.06);
      p.hand.forEach((c, i) => {
        out.push({
          key: `c${c}`,
          card: c,
          role: 'leftover',
          seat: s,
          target: { x: slots[i].x, y: slots[i].y, rot: slots[i].rot, scale: os, z: 30 + i, faceUp: true, wobble: true },
        });
      });
      return;
    }
    const slots = fan(a, p.handCount, 16, 0.07);
    for (let i = 0; i < p.handCount; i++) {
      out.push({
        key: `o${s}_${i}`,
        card: null,
        role: 'opponent',
        seat: s,
        target: { x: slots[i].x, y: slots[i].y, rot: slots[i].rot, scale: os, z: 30 + i, faceUp: false, wobble: true },
      });
    }
    // Their drawn card, held up for them to peek at.
    if (g.phase === 'playing' && g.turn === s && g.step === 'drawn') {
      const dx = (L.draw.x - a.x) * 0.25;
      const dy = (L.draw.y - a.y) * 0.25;
      out.push({
        key: `o${s}_x`,
        card: null,
        role: 'opponent',
        seat: s,
        target: { x: a.x + dx, y: a.y + dy, rot: 0.1, scale: os * 1.1, z: 45, faceUp: false, wobble: true, glow: GOLD },
      });
    }
  });

  // --- Reveal: formations on the table, and the card used to end the round.
  if (g.reveal && (revealing || roundDone)) {
    for (const grp of revealGroups(g, L)) {
      grp.cards.forEach((c, i) => {
        out.push({
          key: `c${c.card}`,
          card: c.card,
          role: 'formation',
          seat: grp.owner,
          target: {
            x: c.x,
            y: c.y,
            rot: 0,
            scale: L.reveal.cardScale,
            z: 60 + i,
            faceUp: true,
            wobble: true,
            glow: c.rider !== null ? GREEN : grp.active ? GOLD : null,
          },
        });
      });
    }
    if (endCard !== null) {
      out.push({
        key: `c${endCard}`,
        card: endCard,
        role: 'endCard',
        target: { x: L.endCard.x, y: L.endCard.y + 6, rot: 0.08, scale: ps, z: 25, faceUp: true, glow: RED, wobble: true },
      });
    }
  }

  return out;
}

export function cardHit(scale: number): { w: number; h: number } {
  return { w: CARD_W * scale, h: CARD_H * scale };
}
