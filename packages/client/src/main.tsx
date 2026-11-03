import { wokeInRoom } from './power';
import { assetUrl } from './version';
import { render } from 'preact';
import { initAudio, unlockAudio } from './audio';
import { startBackground } from './background';
import { badDrop, canDrop, drop, initController, send, setHandOrder, tapDrawn, tapEmpty, tapHand } from './controller';
import { greetConsole } from './easterEgg';
import { Table } from './game/table';
import { initNet, rejoinRoom, savedRoom } from './net';
import { applyCssSettings, onSettings, updateSettings } from './settings';
import { initGrab } from './grab';
import { initStats } from './stats';
import { store } from './store';
import './styles.css';
import { App } from './ui/App';
import { Button } from './ui/common';
import { initAchievements } from './achievements';
import { t } from './i18n';
import { initChat } from './ui/Chat';
import { initEmotes } from './ui/Emotes';
import { loadSpriteAtlases } from './ui/sprites';

async function boot() {
  greetConsole();
  applyCssSettings();
  startBackground(document.getElementById('bg') as HTMLCanvasElement);

  const font = new FontFace('m6x11', `url(${assetUrl('m6x11plus.woff2')})`);
  await Promise.all([font.load().then((f) => document.fonts.add(f)).catch(() => {}), loadSpriteAtlases()]);

  const table = new Table({
    onTapHand: tapHand,
    onTapDrawn: tapDrawn,
    onTapDrawPile: () => void send({ type: 'draw' }),
    onTapDiscard: () => void send({ type: 'takeDiscard' }),
    onTapEmpty: tapEmpty,
    onReorder: setHandOrder,
    canDrop,
    onDrop: drop,
    onBadDrop: badDrop,
    blocked: () => store.get().overlay !== null,
    onDragChange: (card) => store.set({ dragging: card !== null, dragCard: card }),
    onOverTxiJog: (overTxiJog) => store.set({ overTxiJog }),
  });
  table.onLayout = (layout) => store.set({ layout });
  await table.init(document.getElementById('stage')!);
  if (import.meta.env.DEV) Object.assign(window, { __table: table, __send: send, __lang: (lang: 'en' | 'pt') => updateSettings({ lang }) });
  initController(table);
  initChat();
  initEmotes();
  initStats();
  initAchievements();
  initGrab();
  // The page itself never scrolls; undo it if the browser does (see #app in styles.css).
  addEventListener('scroll', () => {
    if (scrollX || scrollY) scrollTo(0, 0);
  });

  let lastSettings = '';
  onSettings(() => {
    // Only rebuild textures/layout when a visual setting changed.
    const { highContrast, cardBack, clockwise, uiScale, textScale, historyOpen } = JSON.parse(localStorage.getItem('tximtxom.settings') ?? '{}');
    const key = JSON.stringify([highContrast, cardBack, clockwise, uiScale, textScale, historyOpen]);
    if (key !== lastSettings) {
      lastSettings = key;
      table.refreshAll();
    }
  });

  render(<App />, document.getElementById('app')!);
  initNet();

  // Once the music can play, a button opens the menu and starts it (browsers
  // only allow sound after a click or key press).
  const loading = document.getElementById('loading');
  const close = () => {
    store.set({ entered: true });
    loading?.classList.add('done');
    setTimeout(() => loading?.remove(), 300);
  };
  await initAudio();
  const slot = loading?.querySelector('p');
  if (!slot) return close();
  slot.removeAttribute('aria-label');
  slot.replaceChildren();
  // Only the button closes it (a stray key press, like Alt+Tab, used to).
  const start = () => {
    unlockAudio();
    close();
    // Back from sleep (power.ts) in a room: straight back to the seat.
    if (wokeInRoom() && savedRoom()) void rejoinRoom();
  };
  render(
    <Button color="blue" onClick={start}>
      {t(matchMedia('(pointer: coarse)').matches ? 'load.tap' : 'load.click')}
    </Button>,
    slot,
  );
}

void boot();
