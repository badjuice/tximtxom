import { useEffect, useState } from 'preact/hooks';
import { getHandOrder, setAnnouncer, tapDrawn, tapHand } from '../controller';
import { getSettings, updateSettings, useSettings } from '../settings';
import { t } from '../i18n';
import { store, useStore } from '../store';
import { WaveText } from './common';
import { HistoryPanel } from './History';
import { Hud } from './Hud';
import { Lobby } from './Lobby';
import { Overlays } from './Menus';
import { ArtIcon } from './sprites';
import { Title } from './Title';

export function App() {
  const room = useStore((s) => s.room);
  const connected = useStore((s) => s.connected);
  const inGame = !!room?.game;
  // Changing language redraws everything.
  const { lang } = useSettings();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = store.get();
      if (s.overlay || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      const g = s.room?.game;
      if (!g || g.you === null) return;
      const k = e.key.toUpperCase();
      if (k === 'S') store.set({ overlay: 'scoreboard' });
      else if (k === 'F') store.set({ overlay: 'formations' });
      else if (k === 'H') updateSettings({ historyOpen: !getSettings().historyOpen });
      else if (/^[1-8]$/.test(k)) {
        const hand = g.players[g.you].hand ?? [];
        const order = getHandOrder().filter((c) => hand.includes(c));
        for (const c of hand) if (!order.includes(c)) order.push(c);
        const i = Number(k) - 1;
        if (i < order.length) tapHand(order[i]);
        else if (i === order.length && g.drawn !== null) tapDrawn(g.drawn);
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  return (
    <div key={lang} class="app-root">
      {!room && <Title />}
      {room && !inGame && <Lobby />}
      {inGame && <Hud />}
      {inGame && <HistoryPanel />}
      <Overlays />
      <Banner />
      <Callout />
      <Toast />
      <Hint />
      <Announcer />
      {!connected && room && (
        <div class="reconnecting" role="status">
          {t('plate.reconnecting')}
        </div>
      )}
    </div>
  );
}

/**
 * Balatro's attention_text: letters pop in within ~0.17s, a pulse runs across
 * them, they hold, then shrink out over 0.33s. Behind them one square
 * "particle" in the callout colour grows and slowly turns, then fades.
 */
function Callout() {
  const c = useStore((s) => s.callout);
  if (!c) return null;
  const n = c.text.length;
  const spin = ((c.id * 47) % 90) - 45; // a different starting angle each time
  return (
    <div class={`callout${c.small ? ' small' : ''}`} key={c.id} style={{ '--c': c.color, '--life': `${c.ms}ms`, '--spin': `${spin}deg` }} aria-hidden="true">
      <div class="callout-square" />
      <div class="callout-text">
        {[...c.text].map((ch, i) => (
          <span style={{ '--i': i, '--pop': `${(0.17 * i) / Math.max(1, n)}s` }}>{ch === ' ' ? '\u00a0' : ch}</span>
        ))}
      </div>
    </div>
  );
}

function Banner() {
  const b = useStore((s) => s.banner);
  if (!b) return null;
  return (
    <div class={`banner tone-${b.tone ?? 'info'}`} key={b.id} aria-hidden="true">
      {b.joker && <ArtIcon name={b.joker} scale={0.8} />}
      <div>
        <div class="banner-text">
          <WaveText text={b.text} max={28} />
        </div>
        {b.sub && <div class="banner-sub">{b.sub}</div>}
      </div>
    </div>
  );
}

function Toast() {
  const t = useStore((s) => s.toast);
  if (!t) return null;
  return (
    <div class={`toast ${t.kind}`} key={t.id} role={t.kind === 'error' ? 'alert' : 'status'}>
      {t.text}
    </div>
  );
}

/**
 * Our own hover hint in place of the browser's tooltip, for any element with
 * a `title`. While the hint shows, the title moves to `data-tip` (so the
 * browser doesn't show its own) and comes back when the pointer leaves.
 */
function Hint() {
  const [tip, setTip] = useState<{ text: string; x: number; y: number; below: boolean } | null>(null);
  useEffect(() => {
    let current: HTMLElement | null = null;
    let touchTimer = 0;
    const release = () => {
      if (current?.dataset.tip !== undefined) {
        current.setAttribute('title', current.dataset.tip);
        delete current.dataset.tip;
      }
      current = null;
      setTip(null);
    };
    const over = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.('[title]') as HTMLElement | null;
      if (el === current) return;
      release();
      const text = el?.getAttribute('title');
      if (!el || !text) return;
      current = el;
      el.dataset.tip = text;
      el.removeAttribute('title');
      const r = el.getBoundingClientRect();
      const below = r.top < 70;
      const x = Math.min(innerWidth - 90, Math.max(90, r.left + r.width / 2));
      setTip({ text, x, y: below ? r.bottom + 8 : r.top - 8, below });
      // Touch has no "leave": show it for a moment.
      clearTimeout(touchTimer);
      if (e.pointerType !== 'mouse') touchTimer = window.setTimeout(release, 1800);
    };
    const down = (e: PointerEvent) => e.pointerType === 'mouse' && release();
    addEventListener('pointerover', over);
    addEventListener('pointerdown', down);
    addEventListener('scroll', release, true);
    addEventListener('blur', release);
    document.documentElement.addEventListener('pointerleave', release);
    return () => {
      release();
      removeEventListener('pointerover', over);
      removeEventListener('pointerdown', down);
      removeEventListener('scroll', release, true);
      removeEventListener('blur', release);
      document.documentElement.removeEventListener('pointerleave', release);
    };
  }, []);
  if (!tip) return null;
  return (
    <div class={`hint${tip.below ? ' below' : ''}`} style={{ left: `${tip.x}px`, top: `${tip.y}px` }} aria-hidden="true">
      {tip.text}
    </div>
  );
}

/** Polite live region for screen readers. */
function Announcer() {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    setAnnouncer((text) => {
      if (!getSettings().announce) return;
      setMsg('');
      requestAnimationFrame(() => setMsg(text));
    });
  }, []);
  return (
    <div class="sr-only" aria-live="polite" aria-atomic="true">
      {msg}
    </div>
  );
}
