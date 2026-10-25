import type { ComponentChildren } from 'preact';
import { type Card, cardCode } from '@tximtxom/shared';
import { cardSpoken } from '../i18n';
import { upscaled } from '../pixelArt';
import { useSettings } from '../settings';

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
}

const atlases: Record<string, Atlas> = {};

export async function loadSpriteAtlases(): Promise<void> {
  for (const name of ['cards', 'art', 'icons']) {
    const json = await (await fetch(`${import.meta.env.BASE_URL}assets/${name}.json`)).json();
    const frames: Record<string, Frame> = {};
    for (const [k, v] of Object.entries<{ frame: Frame }>(json.frames)) frames[k] = v.frame;
    const url = `${import.meta.env.BASE_URL}assets/${json.meta.image}`;
    const img = new Image();
    img.src = url;
    await img.decode();
    const blob = await new Promise<Blob | null>((resolve) => upscaled(img).toBlob(resolve));
    const bigUrl = blob ? URL.createObjectURL(blob) : url;
    atlases[name] = { url, bigUrl, w: json.meta.size.w, h: json.meta.size.h, frames };
  }
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
  if (!a || !f) return {};
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

/** Art on a card: a player's character or a rule's picture. Unknown names (old saves) show the default character. */
export function ArtIcon({ name, scale = 0.5, title }: { name: string; scale?: number; title?: string }) {
  const frame = atlases.art?.frames[name] ? name : 'villager';
  return (
    <span
      class="sprite joker tilt"
      style={spriteStyle('art', frame, fit('art', scale))}
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
export function Wins({ n, scale = 0.6 }: { n: number; scale?: number }) {
  if (!n) return null;
  return (
    <span class="wins" title={`${n}`}>
      <Icon name="win" scale={scale} />
      {n > 1 && <b>x{n}</b>}
    </span>
  );
}


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
  return <span class="sprite card tilt" style={spriteStyle('cards', back, fit('cards', scale))} aria-hidden="true" {...tilt} />;
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
