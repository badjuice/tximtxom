import { Application, Assets, Container, type FederatedPointerEvent, type Spritesheet, type Texture } from 'pixi.js';
import type { Card, GameView } from '@tximtxom/shared';
import { getSettings, historyInset } from '../settings';
import type { Staged } from '../store';
import { type CardTextures, CardView } from './cardView';
import { CARD_H, CARD_W, computeLayout, type Layout, type Point } from './layout';
import { Particles, Shake } from './particles';
import { type DesiredCard, describeScene, handSlots } from './scene';

export interface TableHandlers {
  onTapHand(card: Card): void;
  onTapDrawn(card: Card): void;
  onTapDrawPile(): void;
  onTapDiscard(): void;
  onReorder(order: Card[]): void;
}

export interface TableInput {
  game: GameView | null;
  handOrder: Card[];
  selected: Card[];
  staged: Staged | null;
}

/** Where new cards appear from, keyed by card view key. */
export type SpawnHints = Map<string, { from: Point; delay?: number; faceDown?: boolean; /** Also restart cards already on the table (new deal). */ reset?: boolean }>;

const DRAG_THRESHOLD = 10;

export class Table {
  app = new Application();
  layout!: Layout;
  private world = new Container();
  private cards = new Container();
  particles = new Particles();
  shake = new Shake();
  private views = new Map<string, CardView>();
  private dying: CardView[] = [];
  private tex!: CardTextures;
  private input: TableInput = { game: null, handOrder: [], selected: [], staged: null };
  private discardMemory: Card[] = [];
  private drag: { card: Card; start: Point; x: number; y: number; active: boolean } | null = null;
  private time = 0;
  private roles = new Map<string, DesiredCard>();
  private pendingHints: SpawnHints = new Map();
  /** Called whenever the layout changes (resize, players). */
  onLayout: (l: Layout) => void = () => {};

  constructor(private handlers: TableHandlers) {}

  async init(host: HTMLElement): Promise<void> {
    await this.app.init({
      backgroundAlpha: 0,
      antialias: false,
      resizeTo: window,
      resolution: Math.min(2, window.devicePixelRatio || 1),
      autoDensity: true,
      roundPixels: false,
      powerPreference: 'high-performance',
    });
    host.appendChild(this.app.canvas);

    const sheet = (await Assets.load(`${import.meta.env.BASE_URL}assets/cards.json`)) as Spritesheet;
    sheet.textureSource.scaleMode = 'nearest';
    this.tex = { get: (name: string) => sheet.textures[name] as Texture };

    this.cards.sortableChildren = true;
    this.world.addChild(this.cards, this.particles);
    this.app.stage.addChild(this.world);
    this.app.stage.eventMode = 'static';
    this.app.stage.on('globalpointermove', (e) => this.onPointerMove(e));
    this.app.stage.on('pointerup', () => this.onPointerUp());
    this.app.stage.on('pointerupoutside', () => this.onPointerUp());

    this.relayout();
    addEventListener('resize', () => this.relayout());
    this.app.ticker.add((t) => this.tick(t.deltaMS / 1000));
  }

  relayout(): void {
    const g = this.input.game;
    const s = getSettings();
    this.layout = computeLayout(innerWidth - historyInset(), innerHeight, g?.players.length ?? 2, g?.you ?? 0, s.clockwise, s.uiScale);
    this.world.scale.set(this.layout.scale);
    this.world.position.set(this.layout.offsetX, this.layout.offsetY);
    this.app.stage.hitArea = this.app.screen;
    this.onLayout(this.layout);
    this.sync();
  }

  /** Screen position (CSS px) of a virtual point. */
  toScreen(p: Point): Point {
    return { x: this.layout.offsetX + p.x * this.layout.scale, y: this.layout.offsetY + p.y * this.layout.scale };
  }

  set(input: TableInput, hints?: SpawnHints): void {
    const prevPlayers = this.input.game?.players.length;
    const prevYou = this.input.game?.you;
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
    if (hints) for (const [k, v] of hints) this.pendingHints.set(k, v);
    if (g && (g.players.length !== prevPlayers || g.you !== prevYou)) this.relayout();
    else this.sync();
  }

  /** Re-render textures after settings changes (deck contrast, card back). */
  refreshAll(): void {
    for (const v of this.views.values()) v.refreshTextures();
    this.relayout();
  }

  /** Clears the table (e.g. when leaving a room). */
  clear(): void {
    for (const v of this.views.values()) v.destroy();
    this.views.clear();
    this.discardMemory = [];
  }

  private sync(): void {
    const g = this.input.game;
    if (!g) {
      this.clear();
      return;
    }
    const desired = describeScene({
      game: g,
      layout: this.layout,
      handOrder: this.input.handOrder,
      selected: this.input.selected,
      staged: this.input.staged,
      discardMemory: this.discardMemory,
      drag: this.drag?.active ? { card: this.drag.card, x: this.drag.x, y: this.drag.y } : null,
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
        if (reset.faceDown) v.showFaceDown();
        v.delay = (reset.delay ?? 0) / Math.max(0.25, getSettings().gameSpeed);
      }
      if (!v) {
        const hint = this.pendingHints.get(d.key);
        this.pendingHints.delete(d.key);
        v = new CardView(d.key, d.card, { ...d.target, faceUp: hint?.faceDown ? false : d.target.faceUp }, this.tex);
        if (hint) {
          v.spawnAt(hint.from.x, hint.from.y, d.target.scale * 0.9, (Math.random() - 0.5) * 0.4);
          v.delay = (hint.delay ?? 0) / Math.max(0.25, getSettings().gameSpeed);
        }
        this.setupInput(v);
        this.cards.addChild(v);
        this.views.set(d.key, v);
      }
      v.setCard(d.card);
      v.target = d.target;
      const interactive = this.isInteractive(d);
      v.eventMode = interactive ? 'static' : 'none';
      v.cursor = interactive ? 'pointer' : 'default';
      if (!interactive) v.hovered = false;
    }
    for (const [k, v] of this.views) {
      if (!seen.has(k)) {
        this.views.delete(k);
        v.dying = true;
        v.eventMode = 'none';
        v.target = { ...v.target, alpha: 0, scale: v.target.scale * 0.8, glow: null };
        this.dying.push(v);
      }
    }
  }

  private isInteractive(d: DesiredCard): boolean {
    const g = this.input.game!;
    const me = g.you;
    if (me === null) return false;
    switch (d.role) {
      case 'hand':
        return true;
      case 'drawn':
        return d.target.glow != null;
      case 'drawPile':
        return d.target.glow != null;
      case 'discardTop':
        return d.target.glow != null;
      default:
        return false;
    }
  }

  private setupInput(v: CardView): void {
    v.on('pointerover', () => {
      v.hovered = true;
    });
    v.on('pointerout', () => {
      v.hovered = false;
      v.setHoverTilt(0, 0);
    });
    v.on('pointermove', (e: FederatedPointerEvent) => {
      if (!v.hovered) return;
      const p = v.toLocal(e.global);
      v.setHoverTilt(p.x / CARD_W, p.y / CARD_H);
    });
    v.on('pointerdown', (e: FederatedPointerEvent) => {
      const d = this.roles.get(v.key);
      if (!d) return;
      if (d.role === 'hand' && d.card !== null) {
        const p = this.world.toLocal(e.global);
        this.drag = { card: d.card, start: p, x: p.x, y: p.y, active: false };
      }
    });
    v.on('pointertap', () => {
      const d = this.roles.get(v.key);
      if (!d) return;
      if (d.role === 'hand') return; // handled on pointerup (tap vs drag)
      if (d.role === 'drawPile') this.handlers.onTapDrawPile();
      else if (d.role === 'discardTop') this.handlers.onTapDiscard();
      else if (d.role === 'drawn' && d.card !== null) this.handlers.onTapDrawn(d.card);
      v.pop(0.15);
    });
  }

  private onPointerMove(e: FederatedPointerEvent): void {
    if (!this.drag) return;
    const p = this.world.toLocal(e.global);
    this.drag.x = p.x;
    this.drag.y = p.y;
    if (!this.drag.active && Math.hypot(p.x - this.drag.start.x, p.y - this.drag.start.y) > DRAG_THRESHOLD) {
      this.drag.active = true;
    }
    if (this.drag.active) this.sync();
  }

  private onPointerUp(): void {
    const drag = this.drag;
    this.drag = null;
    if (!drag) return;
    if (!drag.active) {
      this.handlers.onTapHand(drag.card);
      this.views.get(`c${drag.card}`)?.pop(0.12);
      return;
    }
    // Dropped: work out the new position in the hand from x.
    const g = this.input.game;
    const me = g?.you;
    if (g && me !== null && me !== undefined) {
      const hand = g.players[me].hand ?? [];
      const order = this.input.handOrder.filter((c) => hand.includes(c));
      for (const c of hand) if (!order.includes(c)) order.push(c);
      const slots = handSlots(this.layout, order.length);
      const without = order.filter((c) => c !== drag.card);
      let idx = slots.findIndex((s) => drag.x < s.x);
      if (idx < 0) idx = order.length - 1;
      without.splice(Math.min(idx, without.length), 0, drag.card);
      this.handlers.onReorder(without);
    }
    this.sync();
  }

  /** Centre of a card view in virtual coordinates, if it exists. */
  cardPos(key: string): Point | null {
    const v = this.views.get(key);
    return v ? { x: v.x, y: v.y } : null;
  }

  popCard(key: string, amount = 0.25): void {
    this.views.get(key)?.pop(amount);
  }

  private tick(dt: number): void {
    dt = Math.min(dt, 0.05);
    this.time += dt;
    for (const v of this.views.values()) v.update(dt, this.time);
    for (let i = this.dying.length - 1; i >= 0; i--) {
      const v = this.dying[i];
      v.update(dt, this.time);
      if (v.alpha < 0.03) {
        v.destroy();
        this.dying.splice(i, 1);
      }
    }
    this.particles.update(dt);
    this.shake.update(dt);
    this.world.position.set(this.layout.offsetX + this.shake.x, this.layout.offsetY + this.shake.y);
  }
}
