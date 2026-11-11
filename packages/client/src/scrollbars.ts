// Always-visible scrollbars where the browser won't draw them (Firefox and Zen on GNOME use
// overlay scrollbars that hide when idle, and CSS can't stop that). Every element the
// stylesheet gives `scrollbar-gutter: stable` (the RULE list in styles.css) gets its native bar
// hidden and one drawn here instead, in a lane of its own at its right edge, like the
// `::-webkit-scrollbar` one Chromium draws: a track with a thumb that can be dragged, a track
// that pages on a click, and the wheel passed on.

const LANE = 8; // the bar's width, as ::-webkit-scrollbar
const GAP = 1; // between the bar and the element's edge
const MIN_THUMB = 24;

interface Bar {
  el: HTMLElement;
  track: HTMLDivElement;
  thumb: HTMLDivElement;
  shown: boolean;
}

const bars = new Map<HTMLElement, Bar>();
let selector = '';
let frame = 0;
// Bars are placed only while something may move them: for a while after a scroll, a resize, a
// change to the page or an animation starting or ending, not on every frame forever (each
// placing measures every list's layout).
let busyUntil = 0;
const BUSY_MS = 500;
const sized = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => wake());

/** Places the bars over the next half second. */
function wake(): void {
  busyUntil = Math.max(busyUntil, performance.now() + BUSY_MS);
  if (bars.size && !frame) frame = requestAnimationFrame(tick);
}

/** The selectors the stylesheet gives `scrollbar-gutter: stable`. */
export function gutterSelectors(): string {
  const out: string[] = [];
  const walk = (rules: CSSRuleList) => {
    for (const r of Array.from(rules)) {
      if (r instanceof CSSStyleRule) {
        if (r.style.getPropertyValue('scrollbar-gutter').includes('stable')) out.push(r.selectorText);
      } else if ('cssRules' in r && (r as CSSGroupingRule).cssRules) walk((r as CSSGroupingRule).cssRules);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules);
    } catch {
      // Another origin's sheet (fonts): nothing of ours in it.
    }
  }
  return out.join(',');
}

function attach(el: HTMLElement): void {
  // The lane: the element's own right padding plus room for the bar.
  el.style.setProperty('--sb-pad', getComputedStyle(el).paddingRight);
  el.classList.add('fx-sb');
  const track = document.createElement('div');
  track.className = 'fx-scrollbar';
  track.setAttribute('aria-hidden', 'true');
  track.style.display = 'none';
  const thumb = document.createElement('div');
  thumb.className = 'fx-thumb';
  track.append(thumb);
  document.body.append(track);
  const bar: Bar = { el, track, thumb, shown: false };
  bars.set(el, bar);
  sized?.observe(el);

  thumb.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    thumb.setPointerCapture(e.pointerId);
    thumb.classList.add('held');
    const y0 = e.clientY;
    const top0 = el.scrollTop;
    const per = (el.scrollHeight - el.clientHeight) / Math.max(1, track.clientHeight - thumb.offsetHeight);
    const move = (m: PointerEvent) => {
      el.scrollTop = top0 + (m.clientY - y0) * per;
    };
    const up = () => {
      thumb.classList.remove('held');
      thumb.removeEventListener('pointermove', move);
      thumb.removeEventListener('pointerup', up);
      thumb.removeEventListener('pointercancel', up);
    };
    thumb.addEventListener('pointermove', move);
    thumb.addEventListener('pointerup', up);
    thumb.addEventListener('pointercancel', up);
  });
  // A click on the track pages towards it.
  track.addEventListener('pointerdown', (e) => {
    if (e.target !== track) return;
    e.preventDefault();
    const above = e.clientY < thumb.getBoundingClientRect().top;
    el.scrollBy({ top: (above ? -1 : 1) * el.clientHeight * 0.9, behavior: 'smooth' });
  });
  track.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      el.scrollBy({ top: e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1) });
    },
    { passive: false },
  );
}

function detach(bar: Bar): void {
  sized?.unobserve(bar.el);
  bar.track.remove();
  bar.el.classList.remove('fx-sb');
  bar.el.style.removeProperty('--sb-pad');
  bars.delete(bar.el);
}

/** Whether it scrolls vertically and keeps a lane for its bar (a rule can turn either off). */
function scrolls(el: HTMLElement): boolean {
  const cs = getComputedStyle(el);
  return (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && cs.scrollbarGutter.includes('stable');
}

/** Finds the scrollers there are now (new ones get a bar, gone ones lose theirs). Whether any did. */
function scan(): boolean {
  const before = bars.size;
  let changed = false;
  for (const bar of [...bars.values()]) if (!bar.el.isConnected || !scrolls(bar.el)) detach(bar);
  for (const el of document.querySelectorAll<HTMLElement>(selector))
    if (!bars.has(el) && scrolls(el)) {
      attach(el);
      changed = true;
    }
  return changed || bars.size !== before;
}

function hide(bar: Bar): void {
  if (bar.shown) bar.track.style.display = 'none';
  bar.shown = false;
}

/** Puts each bar over its element's lane, sized to what it shows, or hides it. */
function tick(): void {
  frame = 0;
  if (!bars.size || performance.now() > busyUntil) return;
  if (!document.hidden) {
    for (const bar of bars.values()) {
      const { el, track, thumb } = bar;
      const sh = el.scrollHeight;
      const ch = el.clientHeight;
      const r = el.getBoundingClientRect();
      if (sh <= ch + 1 || !r.height || !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) {
        hide(bar);
        continue;
      }
      // Scaled with the element (a window popping in).
      const sy = el.offsetHeight ? r.height / el.offsetHeight : 1;
      const left = r.left + (el.clientLeft + el.clientWidth - LANE - GAP) * (el.offsetWidth ? r.width / el.offsetWidth : 1);
      const top = r.top + (el.clientTop + 2) * sy;
      const h = (ch - 4) * sy;
      // Under something else (a window over it): no bar showing through.
      const probe = document.elementsFromPoint(left + LANE / 2, top + h / 2).find((x) => !x.classList.contains('fx-scrollbar') && !x.classList.contains('fx-thumb'));
      if (h < MIN_THUMB || !probe || !el.contains(probe)) {
        hide(bar);
        continue;
      }
      if (!bar.shown) track.style.display = '';
      bar.shown = true;
      track.style.transform = `translate(${left}px, ${top}px)`;
      track.style.height = `${h}px`;
      const th = Math.max(MIN_THUMB, (h * ch) / sh);
      thumb.style.height = `${th}px`;
      thumb.style.transform = `translateY(${((h - th) * el.scrollTop) / (sh - ch)}px)`;
    }
  }
  frame = requestAnimationFrame(tick);
}

/** Starts drawing the scrollbars, where the browser has no `::-webkit-scrollbar` of its own. */
export function initScrollbars(): void {
  if (CSS.supports('selector(::-webkit-scrollbar)') || typeof Element.prototype.checkVisibility !== 'function') return;
  selector = gutterSelectors();
  if (!selector) return;
  document.documentElement.classList.add('fx-bars');
  let queued = 0;
  // A change in a list or round one (its content, a window opening) may move its bar; one
  // elsewhere (the menu's cards) doesn't.
  let near = false;
  new MutationObserver((list) => {
    near ||= list.some(({ target }) => [...bars.keys()].some((el) => el.contains(target) || target.contains(el)));
    queued ||= window.setTimeout(() => {
      queued = 0;
      if (scan() || near) wake();
      near = false;
    }, 60);
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  addEventListener('scroll', () => wake(), { capture: true, passive: true });
  addEventListener('resize', () => wake());
  document.addEventListener('visibilitychange', () => wake());
  // A window popping in or out carries its list's bar with it.
  // (One inside a list, a card's, doesn't.)
  const around = (e: Event) => e.target instanceof Node && [...bars.keys()].some((el) => (e.target as Node).contains(el)) && wake();
  for (const ev of ['animationstart', 'animationend', 'transitionrun', 'transitionend']) document.addEventListener(ev, around);
  scan();
  wake();
}
