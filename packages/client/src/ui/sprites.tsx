import { type Card, cardCode } from '@tximtxom/shared';
import { cardSpoken, cardShort } from '../i18n';
import { useSettings } from '../settings';

interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Atlas {
  url: string;
  w: number;
  h: number;
  frames: Record<string, Frame>;
}

const atlases: Record<string, Atlas> = {};

export async function loadSpriteAtlases(): Promise<void> {
  for (const name of ['cards', 'jokers']) {
    const json = await (await fetch(`${import.meta.env.BASE_URL}assets/${name}.json`)).json();
    const frames: Record<string, Frame> = {};
    for (const [k, v] of Object.entries<{ frame: Frame }>(json.frames)) frames[k] = v.frame;
    atlases[name] = { url: `${import.meta.env.BASE_URL}assets/${json.meta.image}`, w: json.meta.size.w, h: json.meta.size.h, frames };
  }
}

function hasFrame(atlas: string, frame: string): boolean {
  return !!atlases[atlas]?.frames[frame];
}

function spriteStyle(atlas: string, frame: string, scale: number): Record<string, string> {
  const a = atlases[atlas];
  const f = a?.frames[frame];
  if (!a || !f) return {};
  return {
    width: `${f.w * scale}px`,
    height: `${f.h * scale}px`,
    backgroundImage: `url(${a.url})`,
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

/** A Joker card. Legendary Jokers get their "soul" floating on top, like in Balatro. */
export function JokerIcon({ name, scale = 0.5, title }: { name: string; scale?: number; title?: string }) {
  const soul = `${name}_soul`;
  return (
    <span
      class="sprite joker tilt"
      style={spriteStyle('jokers', name, scale)}
      title={title}
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
      aria-label={title}
      {...tilt}
    >
      {hasFrame('jokers', soul) && <span class="sprite soul" style={spriteStyle('jokers', soul, scale)} />}
    </span>
  );
}

export function CardIcon({ card, scale = 0.5, dim }: { card: Card; scale?: number; dim?: boolean }) {
  const s = useSettings();
  return (
    <span class={`sprite card tilt${dim ? ' dim' : ''}`} style={spriteStyle('cards', 'base', scale)} role="img" aria-label={cardSpoken(card)} title={cardShort(card)} {...tilt}>
      <span class="sprite" style={spriteStyle('cards', `${s.highContrast ? 'hc' : 'n'}_${cardCode(card)}`, scale)} />
    </span>
  );
}

export function CardBackIcon({ back, scale = 0.5 }: { back: string; scale?: number }) {
  return <span class="sprite card tilt" style={spriteStyle('cards', back, scale)} aria-hidden="true" {...tilt} />;
}
