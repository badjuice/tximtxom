import { render } from 'preact';
import { initAudio, unlockAudio } from './audio';
import { startBackground } from './background';
import { canDrop, drop, initController, send, setHandOrder, tapDrawn, tapHand } from './controller';
import { Table } from './game/table';
import { initNet } from './net';
import { applyCssSettings, onSettings } from './settings';
import { store } from './store';
import './styles.css';
import { App } from './ui/App';
import { loadSpriteAtlases } from './ui/sprites';

async function boot() {
  applyCssSettings();
  startBackground(document.getElementById('bg') as HTMLCanvasElement);

  const font = new FontFace('m6x11', `url(${import.meta.env.BASE_URL}assets/m6x11plus.woff2)`);
  await Promise.all([font.load().then((f) => document.fonts.add(f)).catch(() => {}), loadSpriteAtlases()]);

  const table = new Table({
    onTapHand: tapHand,
    onTapDrawn: tapDrawn,
    onTapDrawPile: () => void send({ type: 'draw' }),
    onTapDiscard: () => void send({ type: 'takeDiscard' }),
    onReorder: setHandOrder,
    canDrop,
    onDrop: drop,
    blocked: () => store.get().overlay !== null,
  });
  table.onLayout = (layout) => store.set({ layout });
  await table.init(document.getElementById('stage')!);
  if (import.meta.env.DEV) (window as unknown as { __table: Table }).__table = table;
  initController(table);

  let lastSettings = '';
  onSettings(() => {
    // Only rebuild textures/layout when a visual setting changed.
    const { highContrast, cardBack, clockwise, uiScale, historyOpen } = JSON.parse(localStorage.getItem('tximtxom.settings') ?? '{}');
    const key = JSON.stringify([highContrast, cardBack, clockwise, uiScale, historyOpen]);
    if (key !== lastSettings) {
      lastSettings = key;
      table.refreshAll();
    }
  });

  render(<App />, document.getElementById('app')!);
  initNet();

  // Audio needs a user gesture on mobile.
  void initAudio();
  const unlock = () => {
    unlockAudio();
    removeEventListener('pointerdown', unlock);
    removeEventListener('keydown', unlock);
  };
  addEventListener('pointerdown', unlock);
  addEventListener('keydown', unlock);
}

void boot();
