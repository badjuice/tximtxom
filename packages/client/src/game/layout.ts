// One layout for both the Pixi table and the HTML HUD, in "virtual" units.
// The short side of the screen is always 720 units; the long side stretches
// to fill the screen (within limits), so phones don't get black bars.

export const CARD_W = 71;
export const CARD_H = 95;

export interface Point {
  x: number;
  y: number;
}

export type SeatSide = 'top' | 'left' | 'right' | 'topLeft' | 'topRight';

export interface SeatAnchor extends Point {
  side: SeatSide;
  /** Where the name plate goes. */
  plate: Point;
}

export interface Layout {
  w: number;
  h: number;
  portrait: boolean;
  /** Screen pixels per virtual unit, and where the virtual area starts on screen. */
  scale: number;
  offsetX: number;
  offsetY: number;
  hand: Point & { spacing: number; cardScale: number };
  /** Indexed by seat. Your own seat points at your hand. */
  seats: SeatAnchor[];
  opponentScale: number;
  draw: Point;
  discard: Point;
  pileScale: number;
  drawn: Point;
  endCard: Point;
  reveal: { x: number; y: number; w: number; h: number; cardScale: number };
  actionBar: Point;
}

export function computeLayout(
  screenW: number,
  screenH: number,
  players: number,
  mySeat: number,
  clockwise: boolean,
  uiScale = 1,
): Layout {
  const portrait = screenH > screenW * 1.05;
  let w: number, h: number;
  if (portrait) {
    w = 720;
    h = Math.min(1560, Math.max(1100, (720 * screenH) / screenW));
  } else {
    h = 720;
    w = Math.min(1700, Math.max(1080, (720 * screenW) / screenH));
  }
  const scale = Math.min(screenW / w, screenH / h);
  const offsetX = (screenW - w * scale) / 2;
  const offsetY = (screenH - h * scale) / 2;
  const k = uiScale;

  const hand = portrait
    ? { x: w / 2, y: h - 290, spacing: 90, cardScale: 1.6 * Math.min(k, 1.05) }
    : { x: w / 2, y: h - 190, spacing: 100 * k, cardScale: 1.5 * k };

  // Opponent anchors in visual order. Counter-clockwise (default): the next
  // player sits to your right, then across, then to your left.
  const n = players;
  const sides: SeatSide[] = portrait
    ? n === 2 ? ['top'] : n === 3 ? ['topRight', 'topLeft'] : ['topRight', 'top', 'topLeft']
    : n === 2 ? ['top'] : n === 3 ? ['right', 'left'] : ['right', 'top', 'left'];
  const ordered = clockwise ? sides.map(mirror) : sides;

  const anchor = (side: SeatSide): SeatAnchor => {
    if (portrait) {
      const y = 300;
      const x = side === 'topLeft' ? 135 : side === 'topRight' ? w - 135 : w / 2;
      return { x, y, side, plate: { x, y: y - 120 } };
    }
    const sideY = n === 3 ? 215 : 300;
    switch (side) {
      case 'right':
        return { x: w - 130, y: sideY, side, plate: { x: w - 130, y: sideY - 110 } };
      case 'left':
        return { x: 130, y: sideY, side, plate: { x: 130, y: sideY - 110 } };
      default:
        return { x: w / 2, y: 110, side, plate: { x: w / 2 + 210, y: 85 } };
    }
  };

  const seats: SeatAnchor[] = [];
  for (let s = 0; s < n; s++) {
    const rel = (s - mySeat + n) % n;
    seats[s] = rel === 0
      ? { x: hand.x, y: hand.y, side: 'top', plate: portrait ? { x: w / 2, y: hand.y - 140 } : { x: hand.x - 4 * hand.spacing - 40, y: hand.y + 40 } }
      : anchor(ordered[rel - 1]);
  }

  const pileY = portrait ? Math.max(560, h * 0.42) : 315;
  const draw = { x: w / 2 - (portrait ? 95 : 80), y: pileY };
  const discard = { x: w / 2 + (portrait ? 95 : 80), y: pileY };

  return {
    w,
    h,
    portrait,
    scale,
    offsetX,
    offsetY,
    hand,
    seats,
    opponentScale: portrait ? 0.8 : 0.7,
    draw,
    discard,
    pileScale: portrait ? 1.6 : 1.35,
    drawn: portrait ? { x: w / 2, y: pileY + 215 } : { x: w / 2 + 260, y: pileY },
    endCard: portrait ? { x: w / 2, y: pileY + 215 } : { x: w / 2 + 260, y: pileY },
    reveal: portrait
      ? { x: 20, y: 400, w: w - 40, h: h - 400 - 480, cardScale: 0.95 }
      : { x: 270, y: 175, w: w - 540, h: 260, cardScale: 0.85 },
    actionBar: portrait ? { x: w / 2, y: h - 95 } : { x: w / 2, y: h - 30 },
  };
}

function mirror(side: SeatSide): SeatSide {
  return side === 'left' ? 'right' : side === 'right' ? 'left' : side === 'topLeft' ? 'topRight' : side === 'topRight' ? 'topLeft' : side;
}

/** Spread for a fan of `count` cards centred on `center`. */
export function fan(center: Point, count: number, spacing: number, curve = 0.04): { x: number; y: number; rot: number }[] {
  const out = [];
  for (let i = 0; i < count; i++) {
    const o = i - (count - 1) / 2;
    out.push({ x: center.x + o * spacing, y: center.y + o * o * 2.2, rot: o * curve });
  }
  return out;
}
