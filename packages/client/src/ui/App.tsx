import { useEffect, useState } from 'preact/hooks';
import { getHandOrder, setAnnouncer, tapDrawn, tapHand } from '../controller';
import { getSettings, updateSettings, useSettings } from '../settings';
import { t } from '../i18n';
import { store, useStore } from '../store';
import { HistoryPanel } from './History';
import { Hud } from './Hud';
import { Lobby } from './Lobby';
import { Overlays } from './Menus';
import { JokerIcon } from './sprites';
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
      <Toast />
      <Announcer />
      {!connected && room && (
        <div class="reconnecting" role="status">
          {t('plate.reconnecting')}
        </div>
      )}
    </div>
  );
}

function Banner() {
  const b = useStore((s) => s.banner);
  if (!b) return null;
  return (
    <div class={`banner tone-${b.tone ?? 'info'}`} key={b.id} aria-hidden="true">
      {b.joker && <JokerIcon name={b.joker} scale={0.8} />}
      <div>
        <div class="banner-text">{b.text}</div>
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
