import { useEffect, useState } from 'preact/hooks';

/** Per-player settings, saved on this device. */
export interface Settings {
  // Cards & colour
  highContrast: boolean;
  bigLabels: boolean;
  cardBack: 'back_red' | 'back_blue' | 'back_yellow' | 'back_green' | 'back_black' | 'back_purple';
  /** Anti-aliasing: none, the edges of tilted table cards, or all the pixel art too. */
  smooth: 'off' | 'edges' | 'all';
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
  cardBack: 'back_red',
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
  root.lang = current.lang === 'pt' ? 'pt-PT' : 'en';
}
