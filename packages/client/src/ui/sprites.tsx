import { assetUrl } from '../version';
import type { ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { attachEdition } from './editions';
import { type Card, cardCode, type LobbyPlayer } from '@tximtxom/shared';
import { cardSpoken, type Key, t } from '../i18n';
import { upscaled } from '../pixelArt';
import { CARD_ATLAS, type CardStyle, getSettings, onSettings, updateSettings, useSettings } from '../settings';

interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Atlas {
  url: string;
  /** The atlas enlarged UPSCALE times with hard pixel edges, for drawing on screen (see pixelArt.ts). */
  bigUrl: string;
  w: number;
  h: number;
  frames: Record<string, Frame>;
  /** The decoded big image, kept so the browser keeps it ready to paint. */
  img: HTMLImageElement;
}

const atlases: Record<string, Atlas> = {};

async function loadAtlas(file: string, pixelArt = true): Promise<Atlas> {
  const json = await (await fetch(assetUrl(`${file}.json`))).json();
  const frames: Record<string, Frame> = {};
  for (const [k, v] of Object.entries<{ frame: Frame }>(json.frames)) frames[k] = v.frame;
  const url = assetUrl(json.meta.image);
  const img = new Image();
  img.src = url;
  await img.decode();
  // Smooth art is big enough already: only pixel art gets enlarged.
  const blob = pixelArt ? await new Promise<Blob | null>((resolve) => upscaled(img).toBlob(resolve)) : null;
  const bigUrl = blob ? URL.createObjectURL(blob) : url;
  // Decoded (and held) before anything shows it, so sprites never paint empty while it loads.
  const big = new Image();
  big.src = bigUrl;
  await big.decode().catch(() => {});
  return { url, bigUrl, w: json.meta.size.w, h: json.meta.size.h, frames, img: big };
}

/** Each card style's atlas, once loaded; `atlases.cards` is the one in use. */
const cardAtlases: Partial<Record<CardStyle, Promise<Atlas>>> = {};
let cardStyleShown: CardStyle | null = null;
let cardsVersion = 0;
/** Goes up each time the card art changes, for whatever drew the old art. */
export const cardArtVersion = () => cardsVersion;

async function showCardStyle(style: CardStyle): Promise<void> {
  cardAtlases[style] ??= loadAtlas(CARD_ATLAS[style], style === 'pixel');
  const atlas = await cardAtlases[style]!;
  if (getSettings().cardStyle !== style) return;
  atlases.cards = atlas;
  cardStyleShown = style;
  cardsVersion++;
}

export async function loadSpriteAtlases(): Promise<void> {
  await Promise.all([
    ...['art', 'icons', 'emotes'].map(async (name) => (atlases[name] = await loadAtlas(name))),
    showCardStyle(getSettings().cardStyle),
  ]);
  // A new card style: everything redraws once its atlas is in.
  onSettings(() => {
    const style = getSettings().cardStyle;
    if (style === cardStyleShown) return;
    void showCardStyle(style).then(() => cardStyleShown === style && updateSettings({}));
  });
}

/** Where a frame sits in an atlas image (for drawing it outside CSS, e.g. into a canvas). */
export function atlasFrame(atlas: string, frame: string): { url: string; frame: Frame } | null {
  const a = atlases[atlas];
  const f = a?.frames[frame];
  return a && f ? { url: a.url, frame: f } : null;
}

function spriteStyle(atlas: string, frame: string, scale: number): Record<string, string> {
  const a = atlases[atlas];
  const f = a?.frames[frame];
  if (!a || !f) {
    // A frame this atlas doesn't have yet (say, a back from a card style still loading):
    // keep the space a card takes, so nothing jumps when it arrives.
    const base = a?.frames.base;
    return base ? { width: `${base.w * scale}px`, height: `${base.h * scale}px` } : {};
  }
  return {
    width: `${f.w * scale}px`,
    height: `${f.h * scale}px`,
    backgroundImage: `url(${a.bigUrl})`,
    backgroundSize: `${a.w * scale}px ${a.h * scale}px`,
    backgroundPosition: `-${f.x * scale}px -${f.y * scale}px`,
  };
}

/** Balatro-style hover: the sprite tilts toward the pointer and a shine follows it. */
const tilt = {
  onPointerMove(e: PointerEvent) {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--rx', `${(-y * 24).toFixed(1)}deg`);
    el.style.setProperty('--ry', `${(x * 24).toFixed(1)}deg`);
    el.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(0)}%`);
    el.style.setProperty('--my', `${((y + 0.5) * 100).toFixed(0)}%`);
    el.classList.add('tilting');
  },
  onPointerLeave(e: PointerEvent) {
    const el = e.currentTarget as HTMLElement;
    el.style.removeProperty('--rx');
    el.style.removeProperty('--ry');
    el.classList.remove('tilting');
  },
};

/** Card and art scales are relative to a 95 px tall card, whatever size the art is. */
const fit = (atlas: string, scale: number) => (scale * 95) / (atlases[atlas]?.frames.base?.h ?? atlases[atlas]?.frames.help?.h ?? 95);

/** Each rule card's tone (as its name's colour in the rules). */
const RULE_TONES: Record<string, string> = {
  softcore: 'support',
  ace: 'support',
  mixed: 'support',
  autoride: 'support',
  peek: 'info',
  notice: 'info',
  penalty: 'punish',
  double: 'punish',
  magicsort: 'support',
  scramble: 'funny',
  polydactyly: 'funny',
  twodecks: 'support',
};

/** Art on a card: a player's character or a rule's picture. Unknown names (old saves) show the default character.
 *  `rule`: a rule's card, with a shine crossing it diagonally in the rule's colour, in step with its name's. */
export function ArtIcon({ name, scale = 0.5, title, rule, shine }: { name: string; scale?: number; title?: string; rule?: boolean; shine?: string }) {
  const frame = atlases.art?.frames[name] ? name : 'villager';
  return (
    <span
      class={`sprite joker tilt${rule ? ` rule-card tone-${RULE_TONES[name] ?? 'neutral'}` : shine ? ' rule-card' : ''}`}
      style={shine ? { ...spriteStyle('art', frame, fit('art', scale)), '--rc': shine } : spriteStyle('art', frame, fit('art', scale))}
      title={title}
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
      aria-label={title}
      {...tilt}
    />
  );
}

/** A small badge from the icons atlas (turn, host, bot, wins). */
export function Icon({ name, scale = 1, title, class: cls }: { name: string; scale?: number; title?: string; class?: string }) {
  return <span class={`sprite icon ${cls ?? ''}`} style={spriteStyle('icons', name, scale)} title={title} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : 'true'} />;
}

/** Games won, as a laurel badge with a count ("x2"). Nothing before the first win. */
/** The end-of-game badges: gold for a win, silver for a loss without busting, the skull for a bust. */
export type BadgeKind = 'win' | 'silver' | 'bust';
export const BADGE_KINDS: BadgeKind[] = ['win', 'silver', 'bust'];

/** One badge with its count ("x2") beside it; its hint names the badge. Nothing when `n` is 0, unless `zero`. */
export function Badge({ kind, n, scale = 0.6, zero }: { kind: BadgeKind; n: number; scale?: number; zero?: boolean }) {
  if (!n && !zero) return null;
  return (
    <span class={`wins badge-${kind}${n ? '' : ' none'}`} title={t(`badge.${kind}` as Key)}>
      <Icon name={kind} scale={scale} />
      <b>x{n}</b>
    </span>
  );
}

/** How many of a badge a player has (0 for someone no longer in the room). */
export function badgeCount(p: LobbyPlayer | undefined, kind: BadgeKind): number {
  if (!p) return 0;
  return kind === 'win' ? p.wins : kind === 'silver' ? p.silvers : p.busts;
}

/** One of Kenney's pixel emotes (16x16 art). */
export function EmoteIcon({ id, scale = 2 }: { id: string; scale?: number }) {
  return <span class="sprite emote" style={spriteStyle('emotes', id, scale)} aria-hidden="true" />;
}

/** Games won: the gold badge. */
export const Wins = ({ n, scale }: { n: number; scale?: number }) => <Badge kind="win" n={n} scale={scale} />;


/** Card size in CSS pixels at a given scale (the same scale CardIcon takes). */
export function cardSize(sc: number): { w: number; h: number } {
  const f = atlases.cards?.frames.base;
  const k = fit('cards', sc);
  return { w: (f?.w ?? 42) * k, h: (f?.h ?? 60) * k };
}

/** The atlas frame name of a card's face, in the current colour mode. */
export function faceFrame(card: Card, highContrast: boolean): string {
  return `${highContrast ? 'hc' : 'n'}_${cardCode(card)}`;
}

export function CardIcon({ card, scale: sc = 0.5, dim, class: cls, children }: { card: Card; scale?: number; dim?: boolean; class?: string; children?: ComponentChildren }) {
  const s = useSettings();
  const scale = fit('cards', sc);
  return (
    <span class={`sprite card tilt${dim ? ' dim' : ''}${cls ? ` ${cls}` : ''}`} style={spriteStyle('cards', 'base', scale)} role="img" aria-label={cardSpoken(card)} {...tilt}>
      <span class="sprite" style={spriteStyle('cards', faceFrame(card, s.highContrast), scale)} />
      {children}
    </span>
  );
}

export function CardBackIcon({ back, scale = 0.5 }: { back: string; scale?: number }) {
  if (back === POLY_BACK) return <PolyBack scale={scale} />;
  return <span class="sprite card tilt" style={spriteStyle('cards', back, fit('cards', scale))} aria-hidden="true" {...tilt} />;
}

/** Completionist+'s back: a pixel back under the Polychrome edition (ui/editions.ts). */
export const POLY_BACK = 'back_poly';
/** The art the Polychrome back is drawn from. */
export const POLY_BASE = 'back_blue';
function PolyBack({ scale }: { scale: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { w, h } = cardSize(scale);
  const dpr = Math.min(2, devicePixelRatio || 1);
  useLayoutEffect(() => {
    const c = attachEdition(canvas.current!, POLY_BASE);
    c.setEdition('poly', false);
    c.drawNow();
    return () => c.detach();
  }, []);
  return (
    <span class="sprite card tilt" style={spriteStyle('cards', POLY_BASE, fit('cards', scale))} aria-hidden="true" {...tilt}>
      <canvas ref={canvas} class="edition-layer" width={Math.round(w * dpr)} height={Math.round(h * dpr)} />
    </span>
  );
}

/** A back from either card style, loading that style's atlas if it isn't in use (the shop shows both). */
export function StyleBackIcon(props: { style: CardStyle; back: string; scale?: number }) {
  return props.back === POLY_BACK ? <PolyBack scale={props.scale ?? 0.5} /> : <StyleBack {...props} />;
}
/** The plain back for StyleBackIcon (its own component: its hooks only run for plain backs). */
function StyleBack({ style, back, scale = 0.5 }: { style: CardStyle; back: string; scale?: number }) {
  const key = `cards:${style}`;
  const [, redraw] = useState(0);
  useEffect(() => {
    if (atlases[key]) return;
    cardAtlases[style] ??= loadAtlas(CARD_ATLAS[style], style === 'pixel');
    void cardAtlases[style]!.then((a) => {
      atlases[key] = a;
      redraw((n) => n + 1);
    });
  }, [key]);
  return <span class="sprite card tilt" style={spriteStyle(key, back, fit(key, scale))} aria-hidden="true" {...tilt} />;
}

/** The "random" back: it fades through every back in turn, with a question mark on top. */
export function RandomBackIcon({ backs, scale = 0.5 }: { backs: string[]; scale?: number }) {
  const sc = fit('cards', scale);
  return (
    <span class="sprite card tilt random-back" style={spriteStyle('cards', backs[0], sc)} aria-hidden="true" {...tilt}>
      {backs.slice(1).map((b, i) => (
        <span class="sprite" style={{ ...spriteStyle('cards', b, sc), '--i': i + 1 }} />
      ))}
      <span class="q">?</span>
    </span>
  );
}
