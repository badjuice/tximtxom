import { Application, Assets, CanvasSource, Container, type Spritesheet, type Texture } from 'pixi.js';
import type { Card, GameView } from '@tximtxom/shared';
import { upscaled, UPSCALE } from '../pixelArt';
import { CARD_ATLAS, type CardStyle, getSettings, historyInset, onSettings } from '../settings';
import type { Staged } from '../store';
import { type CardTarget, type CardTextures, CardView } from './cardView';
import { CARD_H, CARD_W, computeLayout, type Layout, type Point } from './layout';
import { Particles, Shake } from './particles';
import { type DesiredCard, describeScene, drawPileTop, GREEN, handDropTop, reorderedHand } from './scene';

export type DropTarget = { kind: 'discard' } | { kind: 'drawPile' } | { kind: 'txiJog' } | { kind: 'handCard'; card: Card } | { kind: 'formation'; id: number } | { kind: 'table' };

export interface TableHandlers {
  onTapHand(card: Card): void;
  onTapDrawn(card: Card): void;
  onTapDrawPile(): void;
  onTapDiscard(): void;
  onReorder(order: Card[]): void;
  /** Can `card` (hand card or drawn card) be dropped on `target` right now? */
  canDrop(card: Card, target: DropTarget): boolean;
  onDrop(card: Card, target: DropTarget): void;
  /** A card was dropped on a formation it doesn't fit. */
  onBadDrop(card: Card, target: DropTarget): void;
  /** True while something (modal, panel) blocks the table. */
  blocked(): boolean;
  /** A card drag started (the card) or ended (null). */
  onDragChange(card: Card | null): void;
  /** The dragged card moved onto (true) or off (false) the Txi jog button. */
  onOverTxiJog(over: boolean): void;
}

export interface TableInput {
  game: GameView | null;
  handOrder: Card[];
  autoSortBy: 'rank' | 'suit' | null;
  selected: Card[];
  staged: Staged | null;
}

/** Where new cards appear from, keyed by card view key. */
export type SpawnHints = Map<
  string,
  {
    from: Point;
    delay?: number;
    faceDown?: boolean;
    /** Also restart cards already on the table (new deal). */
    reset?: boolean;
    /** Seconds the card stays out of sight before it starts moving (not scaled by game speed). */
    hidden?: number;
    /** Seconds it then waits at `from` before moving to its spot. */
    hold?: number;
    /** Dealt into a hand: the hand makes room for it only once it leaves the deck. */
    deal?: boolean;
    /** Seconds to materialise in, once it shows (during `hold`). */
    spawn?: number;
  }
>;

const DRAG_THRESHOLD = 10;

export class Table {
  app = new Application();
  layout!: Layout;
  private world = new Container();
  private cards = new Container();
  particles = new Particles();
  shake = new Shake();
  private views = new Map<string, CardView>();
  /** Last table size, so a resize can be told apart from other relayouts. */
  private viewport = '';
  private dying: CardView[] = [];
  private tex!: CardTextures;
  private input: TableInput = { game: null, handOrder: [], autoSortBy: null, selected: [], staged: null };
  private discardMemory: Card[] = [];
  private drag: { card: Card; start: Point; x: number; y: number; active: boolean } | null = null;
  private time = 0;
  private roles = new Map<string, DesiredCard>();
  private pendingHints: SpawnHints = new Map();
  /** Cards still waiting in the deck during a deal (view keys). */
  private dealPending = new Set<string>();
  /** Called whenever the layout changes (resize, players). */
  onLayout: (l: Layout) => void = () => {};

  constructor(private handlers: TableHandlers) {}

  async init(host: HTMLElement): Promise<void> {
    await this.app.init({
      backgroundAlpha: 0,
      // Smooths the edges of tilted cards. Fixed when the canvas is made, so a change applies on reload.
      antialias: getSettings().smooth !== 'off',
      // The card dissolve is a GLSL filter.
      preference: 'webgl',
      resizeTo: window,
      resolution: Math.min(2, window.devicePixelRatio || 1),
      autoDensity: true,
      roundPixels: false,
      powerPreference: 'high-performance',
    });
    host.appendChild(this.app.canvas);

    this.tex = await this.loadCards(getSettings().cardStyle);
    // A new card style: its atlas, then every card redrawn with it.
    let style = getSettings().cardStyle;
    onSettings(() => {
      if (getSettings().cardStyle === style) return;
      style = getSettings().cardStyle;
      void this.loadCards(style).then((tex) => {
        if (style !== getSettings().cardStyle) return;
        this.tex = tex;
        for (const v of this.views.values()) v.setTextures(tex);
        this.refreshAll();
      });
    });

    this.cards.sortableChildren = true;
    this.world.addChild(this.cards, this.particles);
    this.app.stage.addChild(this.world);
    // Plain DOM pointer events; Pixi's own event system stays off (see updateHover).
    this.app.stage.eventMode = 'none';
    const canvas = this.app.canvas;
    canvas.style.touchAction = 'none';
    addEventListener('pointermove', (e) => this.onPointerMove(e));
    canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    addEventListener('pointerup', (e) => this.onPointerUp(e));
    addEventListener('pointercancel', () => {
      if (this.drag?.active) this.handlers.onDragChange(null);
      this.setOverTxiJog(false);
      this.drag = null;
      this.sync();
    });
    canvas.addEventListener('pointerleave', () => {
      if (!this.drag) this.pointer = null;
    });
    addEventListener('blur', () => (this.pointer = null));

    this.relayout();
    addEventListener('resize', () => this.relayout());
    this.app.ticker.add((t) => this.tick(t.deltaMS / 1000));
  }

  relayout(): void {
    const g = this.input.game;
    const s = getSettings();
    const viewport = `${innerWidth - historyInset()}x${innerHeight}`;
    const resized = this.viewport !== '' && viewport !== this.viewport;
    this.viewport = viewport;
    this.layout = computeLayout(innerWidth - historyInset(), innerHeight, g?.players.length ?? 2, g?.you ?? 0, s.clockwise, s.uiScale, !!g?.rules.sixthSense, s.textScale);
    this.world.scale.set(this.layout.scale);
    this.world.position.set(this.layout.offsetX, this.layout.offsetY);
    this.onLayout(this.layout);
    this.sync();
    // Opening the history panel or resizing just moves the table; cards don't fly to their new spots.
    if (resized) for (const v of this.views.values()) v.snapToTarget();
  }

  /** Screen position (CSS px) of a virtual point. */
  toScreen(p: Point): Point {
    return { x: this.layout.offsetX + p.x * this.layout.scale, y: this.layout.offsetY + p.y * this.layout.scale };
  }

  set(input: TableInput, hints?: SpawnHints): void {
    const prevPlayers = this.input.game?.players.length;
    const prevYou = this.input.game?.you;
    const prevSixth = this.input.game?.rules.sixthSense;
    this.input = input;
    const g = input.game;
    if (g) {
      // Remember discard tops so the pile shows the card underneath too.
      if (g.discardCount <= 1) this.discardMemory = [];
      if (g.discardTop !== null && this.discardMemory.at(-1) !== g.discardTop) {
        this.discardMemory.push(g.discardTop);
        if (this.discardMemory.length > 4) this.discardMemory.shift();
      }
    }
    if (hints) {
      for (const [k, v] of hints) {
        this.pendingHints.set(k, v);
        if (v.deal) this.dealPending.add(k);
      }
    }
    if (g && (g.players.length !== prevPlayers || g.you !== prevYou || g.rules.sixthSense !== prevSixth)) this.relayout();
    else this.sync();
  }

  private cardSheets: Partial<Record<CardStyle, Promise<CardTextures>>> = {};
  /** A card style's textures, loaded once. */
  private loadCards(style: CardStyle): Promise<CardTextures> {
    return (this.cardSheets[style] ??= (async () => {
      const sheet = (await Assets.load(`${import.meta.env.BASE_URL}assets/${CARD_ATLAS[style]}.json`)) as Spritesheet;
      if (style === 'pixel') {
        // The art enlarged with hard pixel edges first: smoothing it then softens
        // only the edges between pixels, not each pixel into its neighbours.
        const big = new CanvasSource({
          resource: upscaled(sheet.textureSource.resource as HTMLImageElement | ImageBitmap),
          resolution: UPSCALE,
          autoGenerateMipmaps: true,
        });
        for (const tex of Object.values(sheet.textures)) tex.source = big;
        // Crisp pixel art, unless the player asked to smooth everything.
        const filter = () => (big.scaleMode = getSettings().smooth === 'all' ? 'linear' : 'nearest');
        filter();
        onSettings(filter);
      } else {
        // Smooth art, three times the pixel cards' size (the atlas's scale): always smoothed.
        sheet.textureSource.scaleMode = 'linear';
        sheet.textureSource.autoGenerateMipmaps = true;
        sheet.textureSource.updateMipmaps();
      }
      return { get: (name: string) => sheet.textures[name] as Texture };
    })());
  }

  /** Re-render textures after settings changes (deck contrast, card back). */
  refreshAll(): void {
    for (const v of this.views.values()) v.refreshTextures();
    this.relayout();
  }

  /** Is anything on the table? */
  get hasCards(): boolean {
    return this.views.size > 0;
  }

  /**
   * Burns every card on the table away, sweeping left to right, with sparks.
   * The next sync builds fresh views for whatever comes after.
   * Returns the seconds until the table is clear.
   */
  dissolveAll(): number {
    const sweep = 0.35;
    const left = Math.min(...[...this.views.values()].map((v) => v.x));
    const right = Math.max(...[...this.views.values()].map((v) => v.x));
    for (const [k, v] of this.views) {
      this.views.delete(k);
      const delay = (sweep * (v.x - left)) / Math.max(1, right - left) + Math.random() * 0.06;
      v.dissolve(delay, () => this.particles.burst(v.x, v.y, { count: 6, colors: [0xffdb59, 0xfd8c0d, 0xe63d33], speed: 140, size: 5, life: 0.7 }));
      this.dying.push(v);
    }
    this.roles.clear();
    this.hoverKey = null;
    return sweep + 0.06 + 0.7;
  }

  /** Clears the table (e.g. when leaving a room). */
  clear(): void {
    for (const v of this.views.values()) v.destroy();
    this.views.clear();
    this.dealPending.clear();
    this.discardMemory = [];
  }

  private sync(): void {
    const g = this.input.game;
    if (!g) {
      this.clear();
      return;
    }
    const drag = this.drag?.active ? this.drag : null;
    const desired = describeScene({
      game: g,
      layout: this.layout,
      handOrder: this.input.handOrder,
      autoSortBy: this.input.autoSortBy,
      selected: this.input.selected,
      staged: this.input.staged,
      discardMemory: this.discardMemory,
      drag: drag ? { card: drag.card, x: drag.x, y: drag.y } : null,
      pending: this.dealPending,
      ritual: this.ritualEnd > 0,
    });
    const seen = new Set<string>();
    this.roles.clear();
    for (const d of desired) {
      seen.add(d.key);
      this.roles.set(d.key, d);
      let v = this.views.get(d.key);
      const reset = this.pendingHints.get(d.key);
      if (v && reset?.reset) {
        this.pendingHints.delete(d.key);
        v.spawnAt(reset.from.x, reset.from.y, d.target.scale * 0.9, 0);
        if (reset.faceDown) v.showFaceDown(true);
        v.delay = (reset.delay ?? 0) / Math.max(0.25, getSettings().gameSpeed) + (reset.hidden ?? 0);
        v.hold = reset.hold ?? 0;
        if (reset.hidden) v.visible = false;
        if (reset.spawn) v.materialize(reset.spawn);
      }
      if (!v) {
        const hint = this.pendingHints.get(d.key);
        this.pendingHints.delete(d.key);
        v = new CardView(d.key, d.card, { ...d.target, faceUp: hint?.faceDown ? false : d.target.faceUp }, this.tex);
        if (hint) {
          v.spawnAt(hint.from.x, hint.from.y, d.target.scale, 0);
          if (hint.faceDown) v.showFaceDown(true);
          v.delay = (hint.delay ?? 0) / Math.max(0.25, getSettings().gameSpeed) + (hint.hidden ?? 0);
          v.hold = hint.hold ?? 0;
          if (hint.hidden) v.visible = false;
          if (hint.spawn) v.materialize(hint.spawn);
        }
        v.eventMode = 'none';
        this.cards.addChild(v);
        this.views.set(d.key, v);
      }
      v.setCard(d.card);
      // While dragging, light up the places the card can go.
      const target = drag && this.dropGlow(d, drag.card) ? { ...d.target, glow: GREEN } : d.target;
      v.target = target;
    }
    for (const [k, v] of this.views) {
      if (!seen.has(k)) {
        this.views.delete(k);
        v.dying = true;
        v.hovered = false;
        v.target = { ...v.target, alpha: 0, scale: v.target.scale * 0.8, glow: null };
        this.dying.push(v);
      }
    }
    if (this.hoverKey && !this.roles.has(this.hoverKey)) this.hoverKey = null;
  }

  /** Should this card glow as a drop target for the dragged card? */
  private dropGlow(d: DesiredCard, dragged: Card): boolean {
    if (d.card === dragged) return false;
    if (d.role === 'discardTop') return this.handlers.canDrop(dragged, { kind: 'discard' });
    if (d.role === 'drawPile') return this.handlers.canDrop(dragged, { kind: 'drawPile' });
    if (d.role === 'hand' && d.card !== null) return this.handlers.canDrop(dragged, { kind: 'handCard', card: d.card });
    if (d.role === 'formation') {
      const f = this.formationAtCard(d.card!);
      return f !== null && this.handlers.canDrop(dragged, { kind: 'formation', id: f });
    }
    return false;
  }

  private formationAtCard(card: Card): number | null {
    const g = this.input.game;
    const f = g?.reveal?.formations.find((x) => x.cards.includes(card));
    return f ? f.id : null;
  }

  private isInteractive(d: DesiredCard): boolean {
    const g = this.input.game!;
    if (g.you === null) return false;
    switch (d.role) {
      case 'hand':
        return true;
      case 'drawn':
      case 'drawPile':
      case 'discardTop':
        return d.target.glow != null;
      default:
        return false;
    }
  }

  // ---------------------------------------------------------------- pointer input
  //
  // Hit-testing uses each card's resting position (its target), not the
  // animated sprite. A wobbling or hover-scaled card under a still pointer
  // used to flip between hovered and not hovered every few frames.

  private pointer: Point | null = null;
  private hoverKey: string | null = null;
  /** How many times hover moved between cards (dev check for flicker). */
  hoverChanges = 0;

  private toVirtual(e: PointerEvent): Point {
    return { x: (e.clientX - this.layout.offsetX) / this.layout.scale, y: (e.clientY - this.layout.offsetY) / this.layout.scale };
  }

  /** Is the canvas the top thing under the pointer (no panel or modal over it)? */
  private canvasOnTop(e: PointerEvent): boolean {
    return document.elementFromPoint(e.clientX, e.clientY) === this.app.canvas && !this.handlers.blocked();
  }

  /** Local (-0.5..0.5) position of p inside a card target, or null if outside (with margin). */
  private local(t: CardTarget, p: Point, margin = 0): Point | null {
    const y0 = t.y + (t.raised ? -22 : 0);
    const dx = p.x - t.x;
    const dy = p.y - y0;
    const c = Math.cos(-t.rot);
    const sn = Math.sin(-t.rot);
    const lx = (dx * c - dy * sn) / t.scale;
    const ly = (dx * sn + dy * c) / t.scale;
    const m = margin / t.scale;
    if (Math.abs(lx) > CARD_W / 2 + m || Math.abs(ly) > CARD_H / 2 + m) return null;
    return { x: lx / CARD_W, y: ly / CARD_H };
  }

  /** Topmost card under p, optionally limited to some roles. */
  private hit(p: Point, filter: (d: DesiredCard) => boolean): DesiredCard | null {
    let best: DesiredCard | null = null;
    for (const d of this.roles.values()) {
      if (!filter(d) || (best && d.target.z <= best.target.z)) continue;
      if (this.local(d.target, p)) best = d;
    }
    return best;
  }

  private updateHover(): void {
    let key: string | null = null;
    const p = this.pointer;
    if (p && !this.drag?.active) {
      // Keep the current card hovered until the pointer is clearly outside it.
      const cur = this.hoverKey ? this.roles.get(this.hoverKey) : undefined;
      const top = this.hit(p, (d) => this.isInteractive(d));
      if (cur && this.isInteractive(cur) && this.local(cur.target, p, 8) && (!top || top.key === cur.key || top.target.z < cur.target.z)) {
        key = cur.key;
      } else {
        key = top?.key ?? null;
      }
    }
    if (key !== this.hoverKey) {
      if (this.hoverKey) {
        const old = this.views.get(this.hoverKey);
        if (old) {
          old.hovered = false;
          old.setHoverTilt(0, 0);
        }
      }
      this.hoverKey = key;
      this.hoverChanges++;
    }
    const v = key ? this.views.get(key) : undefined;
    const d = key ? this.roles.get(key) : undefined;
    if (v && d && p) {
      v.hovered = true;
      const l = this.local(d.target, p, 8);
      if (l) v.setHoverTilt(l.x, l.y);
    }
    this.app.canvas.style.cursor = this.drag?.active ? 'grabbing' : key ? 'pointer' : 'default';
  }

  private onPointerMove(e: PointerEvent): void {
    this.pointer = this.canvasOnTop(e) || this.drag ? this.toVirtual(e) : null;
    if (this.drag && this.pointer) {
      const p = this.pointer;
      this.drag.x = p.x;
      this.drag.y = p.y;
      if (!this.drag.active && Math.hypot(p.x - this.drag.start.x, p.y - this.drag.start.y) > DRAG_THRESHOLD) {
        this.drag.active = true;
        this.handlers.onDragChange(this.drag.card);
      }
      if (this.drag.active) {
        this.setOverTxiJog(this.overTxiJog(e));
        this.sync();
      }
    }
  }

  private wasOverTxiJog = false;
  private setOverTxiJog(over: boolean): void {
    if (over === this.wasOverTxiJog) return;
    this.wasOverTxiJog = over;
    this.handlers.onOverTxiJog(over);
  }

  /** Is the pointer over the Txi jog button? It lives in the page, over the canvas. */
  private overTxiJog(e: PointerEvent): boolean {
    const r = document.querySelector('[data-drop="txiJog"]')?.getBoundingClientRect();
    const pad = 8; // a little slack around it, as with the piles
    return !!r && e.clientX >= r.left - pad && e.clientX <= r.right + pad && e.clientY >= r.top - pad && e.clientY <= r.bottom + pad;
  }

  private onPointerDown(e: PointerEvent): void {
    // Only the main button picks cards up; right-click lets go of the selection (App.tsx).
    if (e.button !== 0 || !this.canvasOnTop(e)) return;
    const p = this.toVirtual(e);
    this.pointer = p;
    const d = this.hit(p, (x) => this.isInteractive(x));
    if (!d) return;
    if (((d.role === 'hand' || d.role === 'drawn') && d.card !== null) || (d.role === 'discardTop' && d.card !== null && this.canDragDiscard(d.card))) {
      this.drag = { card: d.card, start: p, x: p.x, y: p.y, active: false };
      e.preventDefault(); // a card dragged over the history panel must not select its text
      this.app.canvas.setPointerCapture?.(e.pointerId);
      return;
    }
    if (d.role === 'drawPile') this.handlers.onTapDrawPile();
    else if (d.role === 'discardTop') this.handlers.onTapDiscard();
    this.views.get(d.key)?.pop(0.15);
  }

  private onPointerUp(e: PointerEvent): void {
    const drag = this.drag;
    this.drag = null;
    if (!drag) return;
    const role = this.roles.get(`c${drag.card}`)?.role;
    if (!drag.active) {
      if (role === 'drawn') this.handlers.onTapDrawn(drag.card);
      else if (role === 'discardTop') this.handlers.onTapDiscard();
      else this.handlers.onTapHand(drag.card);
      this.views.get(`c${drag.card}`)?.pop(0.12);
      return;
    }
    this.handlers.onDragChange(null);
    const onTxiJog = this.overTxiJog(e);
    this.setOverTxiJog(false);
    const p = this.toVirtual(e);
    // Dropped on something that takes it?
    const under = this.hit(p, (d) => d.card !== drag.card && (d.role === 'discardTop' || d.role === 'hand' || d.role === 'formation'));
    let target: DropTarget | null = null;
    // The Txi jog button sits over the table, so it comes first.
    if (onTxiJog) target = { kind: 'txiJog' };
    else if (under?.role === 'discardTop' || (!under && this.overEmptyDiscard(p))) target = { kind: 'discard' };
    else if (under?.role === 'hand' && under.card !== null) target = { kind: 'handCard', card: under.card };
    else if (under?.role === 'formation' && under.card !== null) {
      const id = this.formationAtCard(under.card);
      if (id !== null) target = { kind: 'formation', id };
    }
    // On the draw pile: Txi jog (end the round with this card). It counts even
    // when the pile has run out, as the spot is where the cards go.
    if (!target && this.overDrawPile(p)) target = { kind: 'drawPile' };
    // Dropped on the open table (above the hand): lay a formation.
    const handTop = handDropTop(this.layout);
    if (!target && p.y < handTop) target = { kind: 'table' };
    if (target && this.handlers.canDrop(drag.card, target)) {
      this.handlers.onDrop(drag.card, target);
    } else if (target?.kind === 'formation') {
      this.handlers.onBadDrop(drag.card, target);
    } else if (role === 'hand' && p.y >= handTop) {
      // Only a drop back on the hand reorders it; anywhere else the card snaps back.
      this.reorder(drag.card, p.x);
    }
    this.sync();
  }

  /** The top discard can be dragged when dropping it on a hand card would take it. */
  private canDragDiscard(card: Card): boolean {
    const g = this.input.game;
    const first = g && g.you !== null ? g.players[g.you].hand?.[0] : undefined;
    return first !== undefined && this.handlers.canDrop(card, { kind: 'handCard', card: first });
  }

  /** Over the draw pile's spot (a little generous: it's a big move to aim for). */
  private overDrawPile(p: Point): boolean {
    const L = this.layout;
    const top = drawPileTop(L, Math.min(this.input.game?.drawCount ?? 0, 6));
    return Math.abs(p.x - top.x) <= (CARD_W * L.pileScale) / 2 + 8 && Math.abs(p.y - top.y) <= (CARD_H * L.pileScale) / 2 + 8;
  }

  /** An empty discard pile has no card to hit, but still takes drops on its spot. */
  private overEmptyDiscard(p: Point): boolean {
    const g = this.input.game;
    if (!g || g.discardTop !== null) return false;
    const L = this.layout;
    return Math.abs(p.x - L.discard.x) <= (CARD_W * L.pileScale) / 2 && Math.abs(p.y - L.discard.y) <= (CARD_H * L.pileScale) / 2;
  }

  /** Moves a hand card to the slot nearest to x. */
  private reorder(card: Card, x: number): void {
    const g = this.input.game;
    const me = g?.you;
    if (!g || me === null || me === undefined) return;
    const hand = g.players[me].hand ?? [];
    const order = this.input.handOrder.filter((c) => hand.includes(c));
    for (const c of hand) if (!order.includes(c)) order.push(c);
    this.handlers.onReorder(reorderedHand(this.layout, order, card, x));
  }

  /** Centre of a card view in virtual coordinates, if it exists. */
  cardPos(key: string): Point | null {
    const v = this.views.get(key);
    return v ? { x: v.x, y: v.y } : null;
  }

  popCard(key: string, amount = 0.25): void {
    this.views.get(key)?.pop(amount);
  }

  /** Table time when the Txi jog ritual is over and the piles merge (0: none). */
  private ritualEnd = 0;

  /** Holds the piles apart for `s` seconds while the ending card slides under the discard pile. */
  ritual(s: number): void {
    this.ritualEnd = this.time + s;
  }

  private tick(dt: number): void {
    dt = Math.min(dt, 0.05);
    this.time += dt;
    if (this.ritualEnd && this.time >= this.ritualEnd) {
      this.ritualEnd = 0;
      this.sync();
    }
    this.updateHover();
    for (const v of this.views.values()) v.update(dt, this.time);
    // A dealt card that leaves the deck joins the end of its hand, which widens to fit it.
    let dealt = false;
    for (const k of this.dealPending) {
      const v = this.views.get(k);
      if (v && v.delay > 0) continue;
      this.dealPending.delete(k);
      dealt = true;
    }
    if (dealt) this.sync();
    for (let i = this.dying.length - 1; i >= 0; i--) {
      const v = this.dying[i];
      v.update(dt, this.time);
      if (v.alpha < 0.03 || v.dissolved) {
        v.destroy();
        this.dying.splice(i, 1);
      }
    }
    this.particles.update(dt);
    this.shake.update(dt);
    this.world.position.set(this.layout.offsetX + this.shake.x, this.layout.offsetY + this.shake.y);
  }
}
