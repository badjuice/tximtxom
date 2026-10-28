// Just for fun: any card or card art in the menus and windows (rule cards,
// characters, achievements, card backs...) can be picked up and swung around.
// A copy follows the pointer, leaning into the motion like a card in Balatro,
// and springs back to its place when let go. The Aces on the title screen have
// their own drag (they reorder), and the table's cards are the game's.
import { play } from './audio';
import { getSettings } from './settings';

const SELECTOR = '.sprite.tilt';
const THRESHOLD = 6; // px before a press becomes a drag
const MAX_LEAN = 18; // degrees
const SPRING_MS = 380;

/** A floating copy of `el` exactly over it, which the pointer moves. */
function lift(el: HTMLElement): HTMLElement {
  const r = el.getBoundingClientRect();
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const copy = el.cloneNode(true) as HTMLElement;
  copy.classList.remove('tilting');
  copy.classList.add('grabbed');
  copy.removeAttribute('id');
  copy.setAttribute('aria-hidden', 'true');
  // Centred on the original, scaled as it is on screen (a zoomed parent).
  Object.assign(copy.style, {
    left: `${r.left + r.width / 2 - w / 2}px`,
    top: `${r.top + r.height / 2 - h / 2}px`,
    width: `${w}px`,
    height: `${h}px`,
    transform: `scale(${r.width / w || 1})`,
  });
  document.body.append(copy);
  el.style.visibility = 'hidden';
  return copy;
}

/** Springs the copy back over the original, then shows the original again. */
function settle(el: HTMLElement, copy: HTMLElement): void {
  const done = () => {
    copy.remove();
    el.style.visibility = '';
  };
  if (getSettings().reducedMotion || !el.isConnected) return done();
  copy.classList.add('settling');
  copy.style.translate = '0px 0px';
  copy.style.rotate = '0deg';
  setTimeout(done, SPRING_MS);
}

/** The click that ends a drag isn't a click (on a rule card, a character button...). */
function swallowClick(): void {
  const swallow = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
  };
  addEventListener('click', swallow, { capture: true, once: true });
  setTimeout(() => removeEventListener('click', swallow, { capture: true }), 0);
}

export function initGrab(): void {
  addEventListener('pointerdown', (down) => {
    if (down.button !== 0) return;
    const el = (down.target as Element).closest?.<HTMLElement>(SELECTOR);
    if (!el || el.closest('.logo-fan, .grabbed')) return;
    let copy: HTMLElement | null = null;
    let lean = 0;
    let lastX = down.clientX;
    const move = (e: PointerEvent) => {
      if (e.pointerId !== down.pointerId) return;
      const dx = e.clientX - down.clientX;
      const dy = e.clientY - down.clientY;
      if (!copy) {
        if (Math.hypot(dx, dy) < THRESHOLD) return;
        copy = lift(el);
        play('cardSlide1', { volume: 0.4 });
      }
      lean = Math.max(-MAX_LEAN, Math.min(MAX_LEAN, lean * 0.75 + (e.clientX - lastX) * 0.8));
      lastX = e.clientX;
      copy.style.translate = `${dx}px ${dy}px`;
      copy.style.rotate = `${lean}deg`;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== down.pointerId) return;
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
      if (!copy) return;
      if (e.type === 'pointerup') swallowClick();
      play('cardSlide2', { volume: 0.35 });
      settle(el, copy);
    };
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  });
}
