import { useEffect, useRef } from 'preact/hooks';
import type { Card } from '@tximtxom/shared';
import { useSettings } from '../settings';
import { attachEdition, type Edition } from './editions';
import { CardIcon, cardSize, faceFrame } from './sprites';

/** A card with a Balatro edition shader over it. With no edition it is a plain CardIcon. */
export function EditionCard({ card, scale = 1, edition }: { card: Card; scale?: number; edition: Edition | null }) {
  const { highContrast } = useSettings();
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

  return (
    <CardIcon card={card} scale={scale}>
      <canvas
        ref={canvas}
        class="edition-layer"
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
