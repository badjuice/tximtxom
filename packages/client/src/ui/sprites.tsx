import { type Card, cardCode, cardName } from '@tximtxom/shared';
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
    const json = await (await fetch(`/assets/${name}.json`)).json();
    const frames: Record<string, Frame> = {};
    for (const [k, v] of Object.entries<{ frame: Frame }>(json.frames)) frames[k] = v.frame;
    atlases[name] = { url: `/assets/${json.meta.image}`, w: json.meta.size.w, h: json.meta.size.h, frames };
  }
}

function spriteStyle(atlas: string, frame: string, scale: number) {
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

export function JokerIcon({ name, scale = 0.5, title }: { name: string; scale?: number; title?: string }) {
  return <span class="sprite joker" style={spriteStyle('jokers', name, scale)} title={title} aria-hidden={title ? undefined : 'true'} role={title ? 'img' : undefined} aria-label={title} />;
}

export function CardIcon({ card, scale = 0.5, dim }: { card: Card; scale?: number; dim?: boolean }) {
  const s = useSettings();
  return (
    <span class={`sprite card${dim ? ' dim' : ''}`} style={spriteStyle('cards', 'base', scale)} role="img" aria-label={cardName(card)} title={cardCode(card)}>
      <span class="sprite" style={spriteStyle('cards', `${s.highContrast ? 'hc' : 'n'}_${cardCode(card)}`, scale)} />
    </span>
  );
}

export function CardBackIcon({ back, scale = 0.5 }: { back: string; scale?: number }) {
  return <span class="sprite card" style={spriteStyle('cards', back, scale)} aria-hidden="true" />;
}
