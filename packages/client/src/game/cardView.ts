import { Container, type Filter, Graphics, Sprite, type Texture } from 'pixi.js';
import { type Card, cardCode } from '@tximtxom/shared';
import { currentBack, getSettings } from '../settings';
import { dissolveFilter, setDissolve, TAROT } from './dissolve';
import { ART_SCALE, CARD_H, CARD_W } from './layout';

export interface CardTextures {
  get(name: string): Texture;
}

const DISSOLVE_S = 0.7;

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
  /** Held by the pointer: stays upright, no lean or tilt. */
  dragged?: boolean;
}

// Card spring, Balatro-quick: settles in about a fifth of a second with a small overshoot.
const STIFF = 600;
const DAMP = 39;
// A held card follows the pointer tightly and critically damped: no bounce.
const DRAG_STIFF = 700;
const DRAG_DAMP = 2 * Math.sqrt(DRAG_STIFF);
/** Longest spring integration step (s); stable for these constants. */
const MAX_STEP = 1 / 120;

export class CardView extends Container {
  readonly key: string;
  card: Card | null;
  target: CardTarget;
  /** Seconds to wait before moving (staggered deals). */
  delay = 0;
  /** Seconds to stay at the spawn spot after appearing (a new deck "placed" before the deal). */
  hold = 0;
  dying = false;
  /** Set while the card burns away; `done` once it has gone. */
  private dissolving: { t: number; filter: Filter; started: boolean; onStart?: () => void } | null = null;
  private materializing: { t: number; s: number; filter: Filter } | null = null;

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
    // The atlas art is smaller than the card; scale it up to CARD_W x CARD_H.
    for (const s of [this.shadow, this.base, this.face]) s.scale.set(ART_SCALE);
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

  /** Jump straight to the target, e.g. when the table is resized. */
  snapToTarget(): void {
    const t = this.target;
    this.x = t.x;
    this.y = t.y + (t.raised ? -22 : 0);
    this.rotation = t.rot;
    this.scale.set(t.scale);
    this.vx = this.vy = this.vr = this.vs = 0;
  }

  /** Burn the card away where it stands (Balatro's Hanged Man), after `delay` seconds. */
  dissolve(delay: number, onStart?: () => void): void {
    this.dying = true;
    this.hovered = false;
    this.dissolving = { t: -delay, filter: dissolveFilter(), started: false, onStart };
  }

  /** Fill the card in over `s` seconds once it shows (the dissolve backwards, in Tarot purple). */
  materialize(s: number): void {
    const filter = dissolveFilter(TAROT);
    setDissolve(filter, 1);
    this.body.filters = [filter];
    this.shadow.visible = false;
    this.materializing = { t: 0, s, filter };
  }

  /** The dissolve has finished; the table can remove the card. */
  get dissolved(): boolean {
    return !!this.dissolving && this.dissolving.t >= DISSOLVE_S;
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
      this.base.texture = this.tex.get(currentBack());
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
    const d = this.dissolving;
    if (d) {
      d.t += dt;
      if (d.t < 0) return;
      if (!d.started) {
        d.started = true;
        this.body.filters = [d.filter];
        this.shadow.visible = false;
        d.onStart?.();
      }
      const k = Math.min(1, d.t / DISSOLVE_S);
      setDissolve(d.filter, k);
      // A quick shiver as it starts to burn.
      if (!s.reducedMotion) this.body.rotation = Math.sin(d.t * 60) * 0.04 * (1 - k);
      return;
    }
    if (this.delay > 0) {
      this.delay -= dt;
      return;
    }
    this.visible = true;
    const m = this.materializing;
    if (m) {
      m.t += dt;
      if (m.t >= m.s) {
        this.body.filters = null;
        this.shadow.visible = true;
        this.materializing = null;
      } else setDissolve(m.filter, 1 - m.t / m.s);
    }
    if (this.hold > 0) {
      this.hold -= dt;
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
    this.hoverAmt += (hoverTarget - this.hoverAmt) * Math.min(1, h * 24);
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
      // Integrate in small fixed steps. One big step (a slow frame, or game
      // speed above 1x) makes this spring unstable: cards overshoot further
      // every frame, fly off and only come back once frames are fast again.
      const n = Math.max(1, Math.ceil(h / MAX_STEP));
      const sh = h / n;
      const [k, c] = t.dragged ? [DRAG_STIFF, DRAG_DAMP] : [STIFF, DAMP];
      const step = (pos: number, vel: number, goal: number) => {
        for (let i = 0; i < n; i++) {
          vel += (k * (goal - pos) - c * vel) * sh;
          pos += vel * sh;
        }
        return [pos, vel];
      };
      [this.x, this.vx] = step(this.x, this.vx, tx);
      [this.y, this.vy] = step(this.y, this.vy, ty);
      [this.rotation, this.vr] = step(this.rotation, this.vr, tr);
      let sc: number;
      [sc, this.vs] = step(this.scale.y, this.vs, ts + this.juice);
      this.juice = Math.max(0, this.juice - h * 1.6);
      this.scale.set(sc);
      // Lean into the direction of travel, like Balatro's cards (not while held).
      if (!t.dragged) this.rotation += Math.max(-0.25, Math.min(0.25, this.vx * 0.0006));
    }

    // Fake 3D tilt under the pointer.
    const tilt = reduced || t.dragged ? 0 : this.hoverAmt;
    this.body.skew.set(this.tilt.y * 0.12 * tilt, -this.tilt.x * 0.12 * tilt);
    this.body.scale.x = this.flip * this.flip;

    // Shadow drops further when lifted/hovered.
    const lift = (t.raised ? 1 : 0) + this.hoverAmt * 0.6;
    this.shadow.position.set(3 + lift * 3, 5 + lift * 5);
    this.shadow.scale.x = this.body.scale.x * ART_SCALE;
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
