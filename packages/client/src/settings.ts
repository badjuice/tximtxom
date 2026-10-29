import { useEffect, useState } from 'preact/hooks';

/** The card art: Kenney's pixel cards, or the smooth cards of his Boardgame Pack. */
export type CardStyle = 'pixel' | 'board';
export const CARD_STYLES: CardStyle[] = ['pixel', 'board'];
/** The atlas each style's cards are in. */
export const CARD_ATLAS: Record<CardStyle, string> = { pixel: 'cards', board: 'cards-board' };

/** A card back frame in the style's atlas (`back_red`, `back_blue3`...). */
export type CardBack = string;
const BACKS: Record<CardStyle, CardBack[]> = {
  pixel: ['back_red', 'back_blue', 'back_yellow', 'back_green', 'back_black', 'back_purple'],
  board: ['blue', 'red', 'green'].flatMap((c) => [1, 2, 3, 4, 5].map((i) => `back_${c}${i}`)),
};
/** The backs of the card style in use. */
export const cardBacks = (style = getSettings().cardStyle): CardBack[] => BACKS[style];

let randomBack: CardBack = BACKS.pixel[0];
/** Backs not yet dealt on in this round of picks; every back comes up once before any repeats. */
let backBag: CardBack[] = [];
/** Picks the next random back for a new deal: never the one just used. */
export function rollRandomBack(): void {
  const all = cardBacks();
  backBag = backBag.filter((b) => all.includes(b));
  if (!backBag.length) backBag = [...all];
  const pick = backBag.filter((b) => b !== randomBack);
  // Only the current back is left in the bag: it goes back in with the next set.
  if (!pick.length) {
    backBag = all.filter((b) => b !== randomBack);
    return rollRandomBack();
  }
  randomBack = pick[Math.floor(Math.random() * pick.length)];
  backBag.splice(backBag.indexOf(randomBack), 1);
}
/** The back to draw right now. */
export function currentBack(): CardBack {
  const b = getSettings().cardBack;
  const all = cardBacks();
  if (b === 'random') {
    if (!all.includes(randomBack)) rollRandomBack();
    return randomBack;
  }
  return all.includes(b) ? b : all[0];
}

/** The game's font, or one of the alternatives (assets/fonts). */
export type FontId = 'm6x11' | 'grapeSoda' | 'cutePixel' | 'superstar' | 'digitalDisco';
/** `author` is credited under the choice (see assets/fonts/README.md). */
export const FONTS: { id: FontId; name: string; author: string; file: string }[] = [
  { id: 'm6x11', name: 'm6x11', author: 'Daniel Linssen', file: 'm6x11plus.woff2' },
  { id: 'grapeSoda', name: 'Grape Soda', author: 'jeti (CC BY 4.0)', file: 'fonts/grape-soda/GrapeSoda.ttf' },
  { id: 'cutePixel', name: 'CutePixel', author: 'zK4rim', file: 'fonts/cutepixel/CutePixel.ttf' },
  { id: 'superstar', name: 'Superstar', author: 'memesbruh03', file: 'fonts/superstar/superstar_memesbruh03.ttf' },
  { id: 'digitalDisco', name: 'Digital Disco', author: 'jeti (CC BY 4.0)', file: 'fonts/digital-disco/DigitalDisco.ttf' },
];

/** Fonts asked for, and fonts ready to use; the page switches once its font is in. */
const fontsAsked = new Set<FontId>(['m6x11']);
const fontsReady = new Set<FontId>(['m6x11']);
function loadFont(id: FontId): void {
  const f = FONTS.find((x) => x.id === id);
  if (!f || fontsAsked.has(id)) return;
  fontsAsked.add(id);
  new FontFace(`tt-${id}`, `url(${import.meta.env.BASE_URL}assets/${f.file})`)
    .load()
    .then((face) => {
      document.fonts.add(face);
      fontsReady.add(id);
      applyCssSettings();
    })
    .catch(() => fontsAsked.delete(id));
}

/** Per-player settings, saved on this device. */
export interface Settings {
  // Cards & colour
  highContrast: boolean;
  bigLabels: boolean;
  cardStyle: CardStyle;
  /** `random` deals each round on a new back. */
  cardBack: CardBack | 'random';
  font: FontId;
  /** Anti-aliasing: off, or on (the edges of tilted table cards and all the pixel art). */
  smooth: 'off' | 'all';
  // Layout
  clockwise: boolean;
  uiScale: number;
  textScale: number;
  // Motion & effects
  reducedMotion: boolean;
  crt: boolean;
  crtIntensity: number;
  backgroundAnim: boolean;
  safeFlash: boolean;
  screenShake: boolean;
  gameSpeed: number;
  // Audio
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;
  haptics: boolean;
  // Input
  confirmMoves: boolean;
  announce: boolean;
  /** Mirrors the bottom button bar for left-handed players. */
  leftHanded: boolean;
  // Panels
  historyOpen: boolean;
  // Language and hand sorting
  lang: 'pt' | 'en';
  sortBy: 'rank' | 'suit';
  autoSort: boolean;
}

const prefersReducedMotion =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const prefersContrast = typeof matchMedia !== 'undefined' && matchMedia('(prefers-contrast: more)').matches;

export const DEFAULT_SETTINGS: Settings = {
  highContrast: prefersContrast,
  bigLabels: false,
  cardStyle: 'pixel',
  cardBack: 'back_red',
  font: 'm6x11',
  smooth: 'all',
  clockwise: false,
  uiScale: 1,
  textScale: 1,
  reducedMotion: prefersReducedMotion,
  crt: true,
  crtIntensity: 0.5,
  backgroundAnim: !prefersReducedMotion,
  safeFlash: prefersReducedMotion,
  screenShake: !prefersReducedMotion,
  gameSpeed: 1,
  masterVolume: 0.8,
  sfxVolume: 0.8,
  musicVolume: 0.4,
  muted: false,
  haptics: true,
  confirmMoves: true,
  announce: true,
  leftHanded: false,
  historyOpen: false,
  lang: 'pt',
  sortBy: 'rank',
  autoSort: false,
};

const KEY = 'tximtxom.settings';
const listeners = new Set<() => void>();

function load(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    // Before 0.23 this was `smoothing`, saved as 'edges' by default. Only a
    // deliberate 'off' carries over; everyone else gets the new default.
    if ('smoothing' in saved) {
      if (saved.smoothing === 'off') saved.smooth = 'off';
      delete saved.smoothing;
    }
    // Before 0.28 there was a third choice, card edges only: it's on now.
    if (saved.smooth === 'edges') saved.smooth = 'all';
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

let current = load();

export function getSettings(): Settings {
  return current;
}

export function updateSettings(patch: Partial<Settings>): void {
  current = { ...current, ...patch };
  localStorage.setItem(KEY, JSON.stringify(current));
  applyCssSettings();
  listeners.forEach((l) => l());
}

export function resetSettings(): void {
  updateSettings(DEFAULT_SETTINGS);
}

export function onSettings(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useSettings(): Settings {
  const [s, set] = useState(current);
  useEffect(() => {
    const off = onSettings(() => set(current));
    return () => {
      off();
    };
  }, []);
  return s;
}

/** Animation time multiplier (0 = instant-ish when reduced motion). */
export function speed(): number {
  return current.gameSpeed;
}

/** Width (CSS px) the history panel takes from the table on wide screens. */
export const HISTORY_WIDTH = 300;
export function historyInset(): number {
  return current.historyOpen && innerWidth >= 900 ? HISTORY_WIDTH : 0;
}

export function applyCssSettings(): void {
  const root = document.documentElement;
  root.style.setProperty('--text-scale', String(current.textScale));
  root.style.setProperty('--ui-scale', String(current.uiScale));
  root.style.setProperty('--crt', current.crt ? String(current.crtIntensity) : '0');
  root.classList.toggle('reduced-motion', current.reducedMotion);
  root.classList.toggle('high-contrast', current.highContrast);
  root.classList.toggle('crt-on', current.crt);
  root.classList.toggle('history-open', current.historyOpen);
  root.classList.toggle('lefty', current.leftHanded);
  root.classList.toggle('smooth-all', current.smooth === 'all');
  root.classList.toggle('cards-board', current.cardStyle === 'board');
  // Missing letters (suits, dashes) fall back to the game's own font.
  loadFont(current.font);
  root.style.setProperty('--font', current.font !== 'm6x11' && fontsReady.has(current.font) ? `tt-${current.font}, m6x11` : 'm6x11');
  root.lang = current.lang === 'pt' ? 'pt-PT' : 'en';
}
