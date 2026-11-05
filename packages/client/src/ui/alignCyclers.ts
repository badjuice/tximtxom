// Every option cycler in one window (or the lobby's settings) is as wide as its widest one, so
// their arrows line up in a column, down the rows.

const GROUP = '.modal-body, .lobby';

function align(): void {
  const mids = document.querySelectorAll<HTMLElement>('.cyc-mid');
  if (!mids.length) return;
  const groups = new Map<Element, HTMLElement[]>();
  for (const m of mids) {
    const g = m.closest(GROUP) ?? m.parentElement!;
    groups.set(g, [...(groups.get(g) ?? []), m]);
  }
  for (const [g, list] of groups) {
    const el = g as HTMLElement;
    el.style.removeProperty('--cyc-w');
    const w = Math.max(...list.map((m) => m.offsetWidth));
    if (w > 0) el.style.setProperty('--cyc-w', `${Math.ceil(w)}px`);
  }
}

export function initCyclerAlign(): void {
  let queued = 0;
  const run = () => {
    queued ||= requestAnimationFrame(() => {
      queued = 0;
      align();
    });
  };
  new MutationObserver(run).observe(document.body, { childList: true, characterData: true, subtree: true });
  document.fonts?.addEventListener?.('loadingdone', run);
  run();
}
