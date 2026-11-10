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
  { id: 'inkPaper', kind: 'two', paper: '#dcd4c0', ink: '#1c1b19' },
  { id: 'night', kind: 'two', paper: '#11141c', ink: '#ece6d6' },
  { id: 'redBlue', kind: 'two', paper: '#141f52', ink: '#ff7a6e' },
  { id: 'terminal', kind: 'two', paper: '#06120a', ink: '#43f57f' },
  // Three colours.
  { id: 'goldSilver', kind: 'three', paper: '#22262b', ink: '#d5dbe1', accent: '#e8b84a' },
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

// --- Colour maths, on #rrggbb (as `color-mix(in srgb, …)` would mix them).

type Rgb = [number, number, number];
const rgb = (hex: string): Rgb => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const hex = ([r, g, b]: Rgb): string => `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;
/** `pct`% of `a`, the rest `b`. */
export const mix = (a: string, pct: number, b: string): string => {
  const [x, y] = [rgb(a), rgb(b)];
  return hex(x.map((v, i) => (v * pct + y[i] * (100 - pct)) / 100) as Rgb);
};
/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(c: string): number {
  const [r, g, b] = rgb(c).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** WCAG contrast ratio, 1 to 21. */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
/** `fg`, moved towards `to` just as far as it takes to read at `min` on every one of `bgs`. */
function readable(fg: string, bgs: string[], min: number, to: string): string {
  for (let p = 100; p >= 0; p -= 4) {
    const c = mix(fg, p, to);
    if (bgs.every((bg) => contrast(c, bg) >= min)) return c;
  }
  return to;
}
/** Black or white, whichever reads better on all of `bgs`. */
const blackOrWhite = (bgs: string[]) => (Math.min(...bgs.map((b) => contrast('#000000', b))) >= Math.min(...bgs.map((b) => contrast('#ffffff', b))) ? '#000000' : '#ffffff');

const BLACK = '#000000';
const WHITE = '#ffffff';

/** The value of every token for a theme; empty for the classic look (the stylesheet's own). */
export function themeTokens(th: Theme, style: UiStyle = 'classic'): Partial<Record<ThemeToken, string>> {
  if (th.kind === 'classic') return {};
  if (th.kind === 'full') {
    const base = { ...th.tokens } as Record<BaseToken, string>;
    const accents = ACCENTS.map((k) => base[k]);
    base['on-accent'] ??= blackOrWhite(accents);
    base.hi ??= base.text;
    base.shade ??= BLACK;
    const t = { ...withDerived(base, false), ...th.extra };
    // The neobrutalist style's text on colours: white on a hard black shadow, in every full theme.
    if (style === 'brutal') t['on-accent'] = WHITE;
    return readableTokens(t, style === 'brutal');
  }
  // A two- or three-colour theme keeps its own paper on its colours (it has no white).
  return readableTokens(withDerived(fewColours(th), true), false);
}

/** The coloured backgrounds with text (`--on-accent`) on them. */
const ACCENTS = ['red', 'blue', 'orange', 'green', 'grey', 'purple', 'gold', 'funny', 'epic', 'yellow'] as const;
/** The colours with white text on them in the neobrutalist style (gold and yellow keep dark
 *  text, `--on-yellow`: white can't read on them). */
export const SHADOWED = ['red', 'blue', 'orange', 'green', 'grey', 'purple', 'leave'] as const;
/** Colours that are text on the panels (rule names, rarities, values, highlights). */
const ON_PANEL = ['gold', 'red-l', 'green-l', 'blue-l', 'blue-n', 'orange-l', 'funny-l', 'epic-l', 'epic-n', 'yellow-l', 'hi'] as const;

/** Every theme stays readable: each text colour is nudged (towards the text's own extreme)
 *  until it meets WCAG AA on the backgrounds it sits on. */
function readableTokens(t: Partial<Record<ThemeToken, string>>, shadowed: boolean): Partial<Record<ThemeToken, string>> {
  const o = { ...t } as Record<ThemeToken, string>;
  const panels = [o.panel, o['panel-in'], o['panel-d'], o['panel-top'], o['panel-bot']];
  const far = (c: string) => (luminance(c) > luminance(o.panel) ? WHITE : BLACK);
  o.text = readable(o.text, panels, 7, far(o.text));
  o.muted = readable(o.muted, panels, 5, far(o.muted));
  o['muted-d'] = readable(o['muted-d'], [o.panel, o['panel-in']], 3, far(o['muted-d']));
  o.locked = readable(o.locked, [o.panel, o['panel-in']], 3, far(o.locked));
  for (const k of ON_PANEL) o[k] = readable(o[k], panels, 4.5, far(o[k]));
  // Text on the coloured buttons and tags: the accent moves away from the text on it. White text
  // on its hard black shadow counts as large text (WCAG 3:1): the shadow edges every letter.
  const away = contrast(o['on-accent'], BLACK) > contrast(o['on-accent'], WHITE) ? BLACK : WHITE;
  if (shadowed) for (const k of SHADOWED) o[k] = readable(o[k], [WHITE], 3, BLACK);
  else {
    for (const k of ACCENTS) o[k] = readable(o[k], [o['on-accent']], 4.5, away);
    o.leave = readable(o.leave, [o['on-accent']], 4.5, away);
  }
  o['on-yellow'] = readable(o['on-yellow'], [o.yellow, o['yellow-l']], 4.5, blackOrWhite([o.yellow]));
  o['dis-text'] = readable(o['dis-text'], [o.dis], 3, far(o['dis-text']));
  return o;
}

/** The rest of the tokens, from the base ones. `few`: a two- or three-colour theme, whose light
 *  shades stay its own colours (a lighter accent would be a new colour). */
function withDerived(b: Record<BaseToken, string>, few: boolean): Record<ThemeToken, string> {
  const light = (k: 'red' | 'green' | 'blue' | 'orange' | 'funny' | 'epic' | 'yellow') => (few ? b[k] : mix(b[k], 62, WHITE));
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
    'blue-n': few ? b.blue : mix(b.blue, 78, WHITE),
    'orange-l': light('orange'),
    'funny-l': light('funny'),
    'epic-l': light('epic'),
    'epic-n': few ? b.epic : mix(b.epic, 50, WHITE),
    'purple-d': mix(b.purple, 62, b.shade),
    'yellow-l': light('yellow'),
    'yellow-d': mix(b.yellow, 60, b.shade),
    'on-yellow': few ? b['on-accent'] : mix(b.yellow, 20, BLACK),
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
  const [dark, light] = luminance(paper) < luminance(ink) ? [paper, ink] : [ink, paper];
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
    hi: ink,
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
// Shown as Classic (brutal, the default) and Balala (classic, the original rounded look); the ids
// stay as they were so saved settings keep working.
export const UI_STYLES: UiStyle[] = ['brutal', 'classic'];

/** The neobrutalist look's own colours, used when no theme is picked: saturated flat colours on
 *  a dark ink panel (no glare), black text on the colours, and pure black for every edge and shadow. */
const BRUTAL: Theme = {
  id: 'brutal',
  kind: 'full',
  tokens: {
    red: '#ff5a5a', 'red-d': BLACK, blue: '#4d8dff', 'blue-d': BLACK, orange: '#ec7a0e', 'orange-d': BLACK,
    green: '#14a86c', 'green-d': BLACK, grey: '#7d788f', 'grey-d': BLACK, purple: '#9f66ff', gold: '#ffd23f',
    funny: '#ff6ad5', epic: '#b07cff', yellow: '#ffe14d', locked: '#8a8599',
    panel: '#25232f', 'panel-d': '#17161d', 'panel-in': '#302d3c', 'panel-hi': BLACK, outline: BLACK,
    text: '#fff3dc', muted: '#c9c1da',
  },
  extra: {
    'on-accent': WHITE, hi: '#ffffff', shade: BLACK, page: '#17161d',
    'panel-top': '#25232f', 'panel-bot': '#25232f', 'panel-edge': BLACK, line: BLACK, 'line-hi': BLACK,
    'red-l': '#ff8a8a', 'green-l': '#5ff0b6', 'blue-l': '#86b2ff', 'blue-n': '#6fa2ff', 'orange-l': '#ffbb5c',
    'funny-l': '#ff98e3', 'epic-l': '#caa6ff', 'epic-n': '#caa6ff', 'yellow-l': '#ffeb85', 'yellow-d': BLACK, 'on-yellow': BLACK,
    'purple-d': BLACK, knob: '#fff3dc', off: '#3d3a4c', 'off-knob': '#9c97ad', dis: '#3d3a4c', 'dis-text': '#a29db3', 'muted-d': '#9c97ad',
    'win-bg': '#1d4a37', 'bust-bg': '#52232a', 'lead-bg': '#1d4a37', 'gold-bg': '#4a3f18', leave: '#ff5a5a', 'leave-d': BLACK,
  },
};

/** A picked theme recolours either style; with none, the neobrutalist style brings its own colours. */
export const themeFor = (id: string, style: UiStyle): Theme => (id === 'classic' && style === 'brutal' ? BRUTAL : themeById(id));

export function applyTheme(id: string, style: UiStyle = 'brutal', root: HTMLElement = document.documentElement): void {
  root.classList.toggle('ui-brutal', style === 'brutal');
  const th = themeFor(id, style);
  const tokens = themeTokens(th, style);
  for (const k of THEME_TOKENS) {
    const v = tokens[k];
    if (v) root.style.setProperty(`--${k}`, v);
    else root.style.removeProperty(`--${k}`);
  }
  // The hard shadow under text on the colours (styles.css): only under light text.
  const ink = tokens['on-accent'];
  if (ink && luminance(ink) < 0.4) root.style.setProperty('--ink-shadow', 'transparent');
  else root.style.removeProperty('--ink-shadow');
  root.dataset.theme = th.id;
  root.toggleAttribute('data-few', th.kind === 'two' || th.kind === 'three');
}
