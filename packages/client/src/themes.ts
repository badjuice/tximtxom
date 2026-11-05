// UI colour themes: the panels, text and buttons (not the cards or the table behind).
// A theme sets the colour tokens in styles.css `:root`. Two- and three-colour themes give only
// their colours, and every token is worked out from them; full themes give each token.

/** Every colour token a theme sets (styles.css `:root`). */
export const THEME_TOKENS = [
  'red', 'red-d', 'blue', 'blue-d', 'orange', 'orange-d', 'green', 'green-d', 'grey', 'grey-d',
  'purple', 'gold', 'funny', 'epic', 'yellow', 'locked',
  'panel', 'panel-d', 'panel-in', 'panel-hi', 'outline',
  'text', 'muted', 'on-accent', 'hi', 'shade',
  // Worked out from the ones above for every theme but the classic one.
  'page', 'panel-top', 'panel-bot', 'panel-edge', 'line', 'line-hi', 'muted-d', 'knob', 'off', 'off-knob', 'dis', 'dis-text',
  'red-l', 'green-l', 'blue-l', 'blue-n', 'orange-l', 'funny-l', 'epic-l', 'epic-n', 'purple-d', 'yellow-l', 'yellow-d', 'on-yellow',
  'win-bg', 'bust-bg', 'lead-bg', 'gold-bg', 'leave', 'leave-d',
] as const;
/** The tokens a theme gives (or a two- or three-colour theme works out first); the rest follow from them. */
type BaseToken = Exclude<ThemeToken, (typeof DERIVED)[number]>;
const DERIVED = [
  'page', 'panel-top', 'panel-bot', 'panel-edge', 'line', 'line-hi', 'muted-d', 'knob', 'off', 'off-knob', 'dis', 'dis-text',
  'red-l', 'green-l', 'blue-l', 'blue-n', 'orange-l', 'funny-l', 'epic-l', 'epic-n', 'purple-d', 'yellow-l', 'yellow-d', 'on-yellow',
  'win-bg', 'bust-bg', 'lead-bg', 'gold-bg', 'leave', 'leave-d',
] as const;
export type ThemeToken = (typeof THEME_TOKENS)[number];

export type Theme =
  | { id: string; kind: 'classic' }
  /** `paper`: panels and what sits under text; `ink`: text, outlines and buttons; `accent` (three
   *  colours): the buttons and highlights instead of the ink. */
  | { id: string; kind: 'two' | 'three'; paper: string; ink: string; accent?: string }
  /** `extra`: tokens to set instead of working them out (text on buttons, flat panels…). */
  | { id: string; kind: 'full'; tokens: Record<Exclude<BaseToken, 'on-accent' | 'hi' | 'shade'>, string>; extra?: Partial<Record<ThemeToken, string>> };

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
  if (th.kind === 'full') return { ...withDerived({ 'on-accent': '#ffffff', hi: '#ffffff', shade: '#000000', ...th.tokens }, false), ...th.extra };
  return withDerived(fewColours(th), true);
}

/** The rest of the tokens, from the base ones. `few`: a two- or three-colour theme, whose light
 *  shades stay its own colours (a lighter accent would be a new colour). */
function withDerived(b: Record<BaseToken, string>, few: boolean): Partial<Record<ThemeToken, string>> {
  const light = (k: 'red' | 'green' | 'blue' | 'orange' | 'funny' | 'epic' | 'yellow') => (few ? b[k] : mix(b[k], 62, '#ffffff'));
  return {
    ...b,
    page: mix(b['panel-d'], 70, b.shade),
    'panel-top': mix(b.panel, 94, b['panel-hi']),
    'panel-bot': mix(b.panel, 86, b['panel-d']),
    'panel-edge': b['panel-hi'],
    line: b['panel-hi'],
    'line-hi': mix(b['panel-hi'], 70, b.text),
    'muted-d': mix(b.muted, 65, b.panel),
    knob: mix(b.text, 85, b.panel),
    off: mix(b['panel-in'], 80, b.grey),
    'off-knob': mix(b.muted, 60, b.panel),
    dis: mix(b.grey, 70, b.panel),
    'dis-text': b.muted,
    'red-l': light('red'),
    'green-l': light('green'),
    'blue-l': light('blue'),
    'blue-n': few ? b.blue : mix(b.blue, 78, '#ffffff'),
    'orange-l': light('orange'),
    'funny-l': light('funny'),
    'epic-l': light('epic'),
    'epic-n': few ? b.epic : mix(b.epic, 50, '#ffffff'),
    'purple-d': mix(b.purple, 62, b.shade),
    'yellow-l': light('yellow'),
    'yellow-d': mix(b.yellow, 60, b.shade),
    'on-yellow': few ? b['on-accent'] : mix(b.yellow, 20, '#000000'),
    'win-bg': mix(b.green, 24, b['panel-in']),
    'bust-bg': mix(b.red, 24, b['panel-in']),
    'lead-bg': mix(b.green, 18, b.panel),
    'gold-bg': mix(b.gold, 20, b['panel-in']),
    leave: mix(b.red, 45, b['panel-d']),
    'leave-d': mix(b.red, 22, b.shade),
  };
}

/** A two- or three-colour theme's base tokens: the paper and its shades towards the ink, the ink,
 *  and the accent (or the ink) on everything coloured. */
function fewColours(th: Extract<Theme, { kind: 'two' | 'three' }>): Record<BaseToken, string> {
  const { paper, ink } = th;
  const accent = th.accent ?? ink;
  const [dark, light] = luma(paper) < luma(ink) ? [paper, ink] : [ink, paper];
  const edge = mix(accent, 60, dark === accent ? light : dark);
  const out = {
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
  } as Record<BaseToken, string>;
  for (const k of ['red', 'blue', 'orange', 'green', 'purple', 'gold', 'funny', 'epic', 'yellow'] as const) out[k] = accent;
  for (const k of ['red-d', 'blue-d', 'orange-d', 'green-d'] as const) out[k] = edge;
  return out;
}

/** Puts a theme's colours on the page (or takes them off, for the classic look). */
/** The UI's shapes: the classic rounded look, or neobrutalist (square corners, thick black
 *  outlines, hard black shadows; styles.css `.ui-brutal`). */
export type UiStyle = 'classic' | 'brutal';
export const UI_STYLES: UiStyle[] = ['classic', 'brutal'];

const BLACK = '#000000';
/** The neobrutalist look's own colours, used when no theme is picked: saturated flat colours on
 *  cream, black text, and pure black for every edge and shadow. */
const BRUTAL: Theme = {
  id: 'brutal',
  kind: 'full',
  tokens: {
    red: '#ff4f4f', 'red-d': BLACK, blue: '#3d7bff', 'blue-d': BLACK, orange: '#ff9a1f', 'orange-d': BLACK,
    green: '#22e08e', 'green-d': BLACK, grey: '#cfcfcf', 'grey-d': BLACK, purple: '#a46bff', gold: '#ffd23f',
    funny: '#ff5ccd', epic: '#a46bff', yellow: '#ffe14d', locked: '#8f8f8f',
    panel: '#fff6df', 'panel-d': '#eadfbf', 'panel-in': '#ffffff', 'panel-hi': BLACK, outline: BLACK,
    text: BLACK, muted: '#4a4a4a',
  },
  extra: {
    'on-accent': BLACK, hi: '#ffffff', shade: BLACK, page: '#fff6df',
    'panel-top': '#fff6df', 'panel-bot': '#fff6df', 'panel-edge': BLACK, line: BLACK, 'line-hi': BLACK,
    'red-l': '#ff4f4f', 'green-l': '#13b86f', 'blue-l': '#3d7bff', 'blue-n': '#3d7bff', 'orange-l': '#ff9a1f',
    'funny-l': '#ff5ccd', 'epic-l': '#8a4dff', 'epic-n': '#8a4dff', 'yellow-l': '#ffe14d', 'yellow-d': BLACK, 'on-yellow': BLACK,
    'purple-d': BLACK, knob: BLACK, off: '#e6e0cf', 'off-knob': '#8f8f8f', dis: '#d9d3c2', 'dis-text': '#6a6a6a', 'muted-d': '#6a6a6a',
    'win-bg': '#c9f7df', 'bust-bg': '#ffd2d2', 'lead-bg': '#c9f7df', 'gold-bg': '#fff0b8', leave: '#ff4f4f', 'leave-d': BLACK,
  },
};

export function applyTheme(id: string, style: UiStyle = 'classic', root: HTMLElement = document.documentElement): void {
  root.classList.toggle('ui-brutal', style === 'brutal');
  // A picked theme recolours either style; with none, the neobrutalist style brings its own colours.
  const th = id === 'classic' && style === 'brutal' ? BRUTAL : themeById(id);
  const tokens = themeTokens(th);
  for (const k of THEME_TOKENS) {
    const v = tokens[k];
    if (v) root.style.setProperty(`--${k}`, v);
    else root.style.removeProperty(`--${k}`);
  }
  root.dataset.theme = th.id;
}
