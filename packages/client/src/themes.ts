// UI colour themes: the panels, text and buttons (not the cards or the table behind).
// A theme sets the colour tokens in styles.css `:root`. Two- and three-colour themes give only
// their colours, and every token is worked out from them; full themes give each token.

/** Every colour token a theme sets (styles.css `:root`). */
export const THEME_TOKENS = [
  'red', 'red-d', 'blue', 'blue-d', 'orange', 'orange-d', 'green', 'green-d', 'grey', 'grey-d',
  'purple', 'gold', 'funny', 'epic', 'yellow', 'locked',
  'panel', 'panel-d', 'panel-in', 'panel-hi', 'outline',
  'text', 'muted', 'on-accent', 'hi', 'shade',
] as const;
export type ThemeToken = (typeof THEME_TOKENS)[number];

export type Theme =
  | { id: string; kind: 'classic' }
  /** `paper`: panels and what sits under text; `ink`: text, outlines and buttons; `accent` (three
   *  colours): the buttons and highlights instead of the ink. */
  | { id: string; kind: 'two' | 'three'; paper: string; ink: string; accent?: string }
  | { id: string; kind: 'full'; tokens: Record<Exclude<ThemeToken, 'on-accent' | 'hi' | 'shade'>, string> };

export const THEMES: Theme[] = [
  { id: 'classic', kind: 'classic' },
  // Two colours.
  { id: 'inkPaper', kind: 'two', paper: '#f2eee3', ink: '#1c1b19' },
  { id: 'night', kind: 'two', paper: '#11141c', ink: '#ece6d6' },
  { id: 'redBlue', kind: 'two', paper: '#1d2c6e', ink: '#ff5d50' },
  { id: 'goldSilver', kind: 'two', paper: '#c5cace', ink: '#7a5a10' },
  { id: 'terminal', kind: 'two', paper: '#06120a', ink: '#43f57f' },
  // Three colours.
  { id: 'handheld', kind: 'three', paper: '#9bbc0f', ink: '#0f380f', accent: '#306230' },
  { id: 'sunset', kind: 'three', paper: '#2a1640', ink: '#ffe8c4', accent: '#ff7a3d' },
  { id: 'arctic', kind: 'three', paper: '#0d2137', ink: '#f0f7ff', accent: '#4fc4f0' },
  // Full palettes.
  {
    id: 'pastel',
    kind: 'full',
    tokens: {
      red: '#ff8f8f', 'red-d': '#b85a5a', blue: '#7cb8ff', 'blue-d': '#4a7bb8', orange: '#ffbf75', 'orange-d': '#b8844a',
      green: '#8edcae', 'green-d': '#579a74', grey: '#8a86a0', 'grey-d': '#5e5a72', purple: '#b79ce0', gold: '#f5d78a',
      funny: '#e3a2f2', epic: '#c39cff', yellow: '#ffe08a', locked: '#8a86a0',
      panel: '#4a4460', 'panel-d': '#2a263a', 'panel-in': '#3a354e', 'panel-hi': '#5e5878', outline: '#221e30',
      text: '#ffffff', muted: '#d2cbe3',
    },
  },
];

export const themeById = (id: string): Theme => THEMES.find((th) => th.id === id) ?? THEMES[0];

const mix = (a: string, pct: number, b: string) => `color-mix(in srgb, ${a} ${pct}%, ${b})`;

/** Relative brightness of a #rrggbb colour, 0 (black) to 1 (white). */
function luma(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

/** The value of every token for a theme; empty for the classic look (the stylesheet's own). */
export function themeTokens(th: Theme): Partial<Record<ThemeToken, string>> {
  if (th.kind === 'classic') return {};
  if (th.kind === 'full') return { 'on-accent': '#ffffff', hi: '#ffffff', shade: '#000000', ...th.tokens };
  const { paper, ink } = th;
  const accent = th.accent ?? ink;
  const [dark, light] = luma(paper) < luma(ink) ? [paper, ink] : [ink, paper];
  const edge = mix(accent, 60, dark === accent ? light : dark);
  const out: Partial<Record<ThemeToken, string>> = {
    panel: paper,
    'panel-in': mix(paper, 90, ink),
    'panel-d': mix(paper, 82, ink),
    'panel-hi': mix(paper, 72, ink),
    outline: dark,
    text: ink,
    muted: mix(ink, 70, paper),
    'on-accent': paper,
    hi: light,
    shade: dark,
    locked: mix(ink, 45, paper),
    grey: th.accent ? mix(ink, 55, paper) : ink,
    'grey-d': mix(th.accent ? mix(ink, 55, paper) : ink, 60, dark),
  };
  for (const k of ['red', 'blue', 'orange', 'green', 'purple', 'gold', 'funny', 'epic', 'yellow'] as const) out[k] = accent;
  for (const k of ['red-d', 'blue-d', 'orange-d', 'green-d'] as const) out[k] = edge;
  return out;
}

/** Puts a theme's colours on the page (or takes them off, for the classic look). */
export function applyTheme(id: string, root: HTMLElement = document.documentElement): void {
  const th = themeById(id);
  const tokens = themeTokens(th);
  for (const k of THEME_TOKENS) {
    const v = tokens[k];
    if (v) root.style.setProperty(`--${k}`, v);
    else root.style.removeProperty(`--${k}`);
  }
  root.dataset.theme = th.id;
}
