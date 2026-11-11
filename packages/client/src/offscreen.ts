// Stills whatever has scrolled far out of view in a scrolling list. Every vertical scroller
// (each one the stylesheet gives `scrollbar-gutter: stable`) has its items watched; an item more
// than half the list's height outside it gets `data-offscreen`, which turns all of its animations
// off (styles.css) and stops its letters hopping (WaveText). It moves again half a screen before
// it scrolls back in. Lists of cards ran thousands of animations at once, and fast scrolling
// outran the drawing: cards showed up late.

import { gutterSelectors } from './scrollbars';

/** The looping shines, kept on the page clock's beat so they glint together. */
const SHINES = new Set(['rule-card-shine', 'rule-shine', 'ach-card-shine', 'rainbow-slide']);

/** Every shine under `el` on the page clock's beat (one that starts late joins the others). */
export function syncShines(el: Element | null | undefined): void {
  for (const a of el?.getAnimations({ subtree: true }) ?? [])
    if (a instanceof CSSAnimation && SHINES.has(a.animationName) && a.startTime !== 0) a.startTime = 0;
}

const lists = new Map<HTMLElement, IntersectionObserver>();
const watched = new WeakSet<Element>();
let selector = '';

function onSeen(entries: IntersectionObserverEntry[]): void {
  for (const { target, isIntersecting } of entries) {
    const el = target as HTMLElement;
    if (isIntersecting === !('offscreen' in el.dataset)) continue;
    if (isIntersecting) {
      delete el.dataset.offscreen;
      syncShines(el);
    } else el.dataset.offscreen = '';
  }
}

/** The items of a list: its children, and the children of any child taller than the list
 *  (a section of cards), so a long section still stills the part of it out of view. */
function items(list: HTMLElement, el: Element, out: Element[], depth = 0): Element[] {
  for (const child of el.children) {
    if (depth < 3 && child.children.length > 1 && child.getBoundingClientRect().height > list.clientHeight) items(list, child, out, depth + 1);
    else out.push(child);
  }
  return out;
}

function scan(): void {
  for (const [list, io] of lists)
    if (!list.isConnected) {
      io.disconnect();
      lists.delete(list);
    }
  for (const list of document.querySelectorAll<HTMLElement>(selector)) {
    let io = lists.get(list);
    if (!io) lists.set(list, (io = new IntersectionObserver(onSeen, { root: list, rootMargin: '50% 0px' })));
    for (const item of items(list, list, []))
      if (!watched.has(item)) {
        watched.add(item);
        io.observe(item);
      }
  }
}

export function initOffscreen(): void {
  if (typeof IntersectionObserver === 'undefined') return;
  selector = gutterSelectors();
  if (!selector) return;
  let queued = 0;
  new MutationObserver(() => {
    queued ||= window.setTimeout(() => {
      queued = 0;
      scan();
    }, 100);
  }).observe(document.body, { childList: true, subtree: true });
  scan();
}
