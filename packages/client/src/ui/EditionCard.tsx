import { useEffect, useRef, useState } from 'preact/hooks';
import type { Card } from '@tximtxom/shared';
import { getSettings, useSettings } from '../settings';
import { attachEdition, type Edition } from './editions';
import { CardIcon, cardSize, faceFrame } from './sprites';

const SPAWN_MS = 700;

/**
 * A card with a Balatro edition shader over it. With no edition it is a plain CardIcon.
 * `spawn`: 'wait' keeps it unseen (its space kept); a number of ms then materialises it.
 */
export function EditionCard({ card, scale = 1, edition, spawn }: { card: Card; scale?: number; edition: Edition | null; spawn?: 'wait' | number }) {
  const { highContrast } = useSettings();
  const [born, setBorn] = useState(spawn === undefined);
  const canvas = useRef<HTMLCanvasElement>(null);
  const ctl = useRef<ReturnType<typeof attachEdition> | null>(null);
  const { w, h } = cardSize(scale);
  const dpr = Math.min(2, devicePixelRatio || 1);

  useEffect(() => {
    const c = attachEdition(canvas.current!, faceFrame(card, highContrast));
    ctl.current = c;
    c.setEdition(edition, false); // already there: no landing flash
    return () => c.detach();
  }, [card, highContrast]);
  useEffect(() => ctl.current?.setEdition(edition), [edition]);
  useEffect(() => {
    if (typeof spawn !== 'number') return;
    const id = setTimeout(() => ctl.current?.spawn(getSettings().reducedMotion ? 0 : SPAWN_MS, () => setBorn(true)), spawn);
    return () => clearTimeout(id);
  }, [spawn]);

  return (
    <CardIcon card={card} scale={scale} class={born ? undefined : 'unborn'}>
      <canvas
        ref={canvas}
        class="edition-layer"
        data-edition={edition ?? undefined}
        width={Math.round(w * dpr)}
        height={Math.round(h * dpr)}
        aria-hidden="true"
        // The sheen follows the pointer, like the card's tilt.
        onPointerMove={(e) => {
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          ctl.current?.setTilt((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
        }}
        onPointerLeave={() => ctl.current?.setTilt(0, 0)}
      />
    </CardIcon>
  );
}
