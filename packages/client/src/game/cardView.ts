import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { type Card, cardCode } from '@tximtxom/shared';
import { getSettings } from '../settings';
import { CARD_H, CARD_W } from './layout';

export interface CardTextures {
  get(name: string): Texture;
}

/** Where a card wants to be. The view springs towards it. */
export interface CardTarget {
  x: number;
  y: number;
  rot: number;
  scale: number;
  z: number;
  faceUp: boolean;
  alpha?: number;
  /** Lifted/highlighted (selected in hand). */
  raised?: boolean;
  /** Greyed out (e.g. staged to leave the hand). */
  dim?: boolean;
  /** Gentle idle bob/sway (Balatro's "alive" cards). */
  wobble?: boolean;
  /** Glowing outline. */
  glow?: number | null;
}

const STIFF = 170;
const DAMP = 20;

export class CardView extends Container {
  readonly key: string;
  card: Card | null;
  target: CardTarget;
  /** Seconds to wait before moving (staggered deals). */
  delay = 0;
  dying = false;

  private shadow: Sprite;
  private body: Container;
  private base: Sprite;
  private face: Sprite;
  private outline: Graphics;
  private vx = 0;
  private vy = 0;
  private vr = 0;
  private vs = 0;
  private flip = 1; // 1 = shown side is correct; animates through 0 when flipping
  private shownFaceUp: boolean;
  private phase = Math.random() * Math.PI * 2;
  private hoverAmt = 0;
  hovered = false;
  private tilt = { x: 0, y: 0 };
  private juice = 0;
  private flipWhenArrived = false;

  constructor(key: string, card: Card | null, target: CardTarget, private tex: CardTextures) {
    super();
    this.key = key;
    this.card = card;
    this.target = target;
    this.shownFaceUp = target.faceUp && card !== null;

    this.shadow = new Sprite(tex.get('base'));
    this.shadow.anchor.set(0.5);
    this.shadow.tint = 0x000000;
    this.shadow.alpha = 0.35;
    this.body = new Container();
    this.base = new Sprite(tex.get('base'));
    this.base.anchor.set(0.5);
    this.face = new Sprite(tex.get('base'));
    this.face.anchor.set(0.5);
    this.outline = new Graphics();
    this.body.addChild(this.base, this.face, this.outline);
    this.addChild(this.shadow, this.body);
    this.refreshTextures();

    this.x = target.x;
    this.y = target.y;
    this.rotation = target.rot;
    this.scale.set(target.scale);
    this.zIndex = target.z;
  }

  /** Snap to a start position (e.g. "came from the draw pile"). */
  spawnAt(x: number, y: number, scale?: number, rot = 0): void {
    this.x = x;
    this.y = y;
    this.rotation = rot;
    if (scale !== undefined) this.scale.set(scale);
  }

  /** Show the back right now. With `untilArrived`, it only flips once it reaches its spot. */
  showFaceDown(untilArrived = false): void {
    this.shownFaceUp = false;
    this.flip = 1;
    this.flipWhenArrived = untilArrived;
    this.refreshTextures();
  }

  setCard(card: Card | null): void {
    if (card === this.card) return;
    this.card = card;
    this.refreshTextures();
  }

  /** Little scale "pop" (Balatro juice). */
  pop(amount = 0.25): void {
    if (!getSettings().reducedMotion) this.juice = amount;
  }

  refreshTextures(): void {
    const s = getSettings();
    if (this.shownFaceUp && this.card !== null) {
      this.base.texture = this.tex.get('base');
      this.face.texture = this.tex.get(`${s.highContrast ? 'hc' : 'n'}_${cardCode(this.card)}`);
      this.face.visible = true;
    } else {
      this.base.texture = this.tex.get(s.cardBack);
      this.face.visible = false;
    }
  }

  setHoverTilt(localX: number, localY: number): void {
    // localX/Y in -0.5..0.5 of the card
    this.tilt.x = localX;
    this.tilt.y = localY;
  }

  update(dt: number, time: number): void {
    const s = getSettings();
    const t = this.target;
    if (this.delay > 0) {
      this.delay -= dt;
      return;
    }
    const reduced = s.reducedMotion;
    const speed = Math.max(0.25, s.gameSpeed);
    const h = dt * speed;

    // Flip when the visible side should change: squash to 0, swap, expand.
    const wantFaceUp = t.faceUp && this.card !== null;
    const travelling = this.flipWhenArrived && Math.hypot(t.x - this.x, t.y - this.y) > 14;
    if (!travelling) this.flipWhenArrived = false;
    if (wantFaceUp !== this.shownFaceUp && !travelling) {
      this.flip -= h * 9;
      if (this.flip <= 0 || reduced) {
        this.flip = Math.max(0, this.flip);
        this.shownFaceUp = wantFaceUp;
        this.refreshTextures();
      }
    } else if (this.flip < 1) {
      this.flip = Math.min(1, this.flip + h * 9);
    }

    let tx = t.x;
    let ty = t.y + (t.raised ? -22 : 0);
    let tr = t.rot;
    const hoverTarget = this.hovered ? 1 : 0;
    this.hoverAmt += (hoverTarget - this.hoverAmt) * Math.min(1, h * 14);
    let ts = t.scale * (1 + 0.07 * this.hoverAmt);

    if (t.wobble && !reduced) {
      ty += Math.sin(time * 1.6 + this.phase) * 1.6;
      tr += Math.sin(time * 1.1 + this.phase * 1.7) * 0.015;
    }

    if (reduced) {
      // Fast ease instead of springy motion.
      const k = Math.min(1, h * 16);
      this.x += (tx - this.x) * k;
      this.y += (ty - this.y) * k;
      this.rotation += (tr - this.rotation) * k;
      const sc = this.scale.x + (ts - this.scale.x) * k;
      this.scale.set(sc);
    } else {
      const step = (pos: number, vel: number, goal: number) => {
        const acc = STIFF * (goal - pos) - DAMP * vel;
        vel += acc * h;
        return [pos + vel * h, vel];
      };
      [this.x, this.vx] = step(this.x, this.vx, tx);
      [this.y, this.vy] = step(this.y, this.vy, ty);
      [this.rotation, this.vr] = step(this.rotation, this.vr, tr);
      let sc: number;
      [sc, this.vs] = step(this.scale.y, this.vs, ts + this.juice);
      this.juice = Math.max(0, this.juice - h * 1.6);
      this.scale.set(sc);
      // Lean into the direction of travel, like Balatro's cards.
      this.rotation += Math.max(-0.25, Math.min(0.25, this.vx * 0.0006));
    }

    // Fake 3D tilt under the pointer.
    const tilt = reduced ? 0 : this.hoverAmt;
    this.body.skew.set(this.tilt.y * 0.12 * tilt, -this.tilt.x * 0.12 * tilt);
    this.body.scale.x = this.flip * this.flip;

    // Shadow drops further when lifted/hovered.
    const lift = (t.raised ? 1 : 0) + this.hoverAmt * 0.6;
    this.shadow.position.set(3 + lift * 3, 5 + lift * 5);
    this.shadow.scale.x = this.body.scale.x;
    this.shadow.alpha = t.alpha === 0 ? 0 : 0.28;

    const alpha = t.alpha ?? 1;
    this.alpha += ((t.dim ? 0.45 : alpha) - this.alpha) * Math.min(1, h * 10);
    this.zIndex = t.z + (this.hovered ? 100 : 0);

    this.outline.clear();
    if (t.glow != null) {
      const pulse = reduced ? 1 : 0.7 + 0.3 * Math.sin(time * 5);
      this.outline
        .roundRect(-CARD_W / 2 - 2, -CARD_H / 2 - 2, CARD_W + 4, CARD_H + 4, 6)
        .stroke({ width: 2, color: t.glow, alpha: pulse });
    }
  }
}
