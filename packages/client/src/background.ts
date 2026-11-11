// Swirling paint background: a slow spiral twist over warped value noise,
// cut into three colour bands. It renders into a tiny canvas that CSS scales
// up with `image-rendering: pixelated`, which gives the pixel look for free.
import { frameRate } from './power';
import { getSettings, onSettings } from './settings';
import { FREE_TABLES, ownedOf, owns, ownsRandom } from './shop';

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// High precision where the GPU has it: phones run mediump by default, and the
// noise below turns flat at that precision.
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform float uSpinTime;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
// A flag table's stripes (up to six, uStripeN of them) and how far it's faded in.
uniform vec3 uS[6];
uniform float uStripeN;
uniform float uStripes;
// The Negative table's sheen: a band of light sweeping across, and how strong.
uniform float uSheen;
// The Holographic table's rainbow film, and how far it's faded in.
uniform float uHolo;
// A table painted in more colours: up to 7, blended in order through the paint's folds.
uniform vec3 uP[7];
uniform float uPN;
uniform float uPaint;

// No sin() of big numbers (it falls apart at mediump): Inigo Quilez's multiply hash.
float hash(vec2 p) {
  p = 50.0 * fract(p * 0.3183099 + vec2(0.71, 0.113));
  return fract(p.x * p.y * (p.x + p.y));
}

// Smooth value noise in 0..1.
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / length(uRes);
  // Spiral: points nearer the centre turn further, and the whole thing turns with uSpinTime.
  float r = length(uv);
  float a = atan(uv.y, uv.x) + uSpinTime * 0.1 + 4.0 * (0.7 - r);
  vec2 p = r * vec2(cos(a), sin(a)) * 5.0;

  // Warp the noise with more noise so the paint folds into itself.
  float t = uTime * 0.12;
  vec2 q = vec2(noise(p + vec2(t, 0.0)), noise(p + vec2(5.2, 1.3 - t)));
  float n = 0.65 * noise(p + 2.6 * q + vec2(0.4 * t, -0.3 * t)) + 0.35 * noise(2.1 * p + 1.4 * q);

  vec3 col = mix(uC1, uC2, smoothstep(0.43, 0.47, n));
  col = mix(col, uC3, smoothstep(0.56, 0.6, n));
  if (uPaint > 0.0) {
    float x = clamp((n - 0.28) / 0.44, 0.0, 1.0) * (uPN - 1.0);
    vec3 paint = uP[0];
    for (int i = 1; i < 7; i++) paint = mix(paint, uP[i], smoothstep(float(i) - 0.62, float(i) - 0.38, x));
    col = mix(col, paint, uPaint);
  }
  // A flag: the paint's folds cut into its stripes, in order, with hard edges.
  if (uStripes > 0.0) {
    float k = floor(clamp((n - 0.3) / 0.4, 0.0, 0.999) * uStripeN);
    vec3 band = uS[0];
    for (int i = 1; i < 6; i++) band = mix(band, uS[i], step(float(i), k));
    col = mix(col, band, uStripes);
  }
  // A diagonal shine that crosses the screen every few seconds.
  float d = fract((gl_FragCoord.x + gl_FragCoord.y) / (uRes.x + uRes.y) - uTime * 0.08);
  col += uSheen * 0.5 * smoothstep(0.08, 0.0, abs(d - 0.5));
  // A rainbow that follows the paint's folds and drifts across, like a hologram tilted in the light.
  if (uHolo > 0.0) {
    float h = n * 2.5 + (gl_FragCoord.x - gl_FragCoord.y) / (uRes.x + uRes.y) * 1.5 + uTime * 0.04;
    vec3 film = 0.5 + 0.5 * cos(6.2832 * (h + vec3(0.0, 0.33, 0.67)));
    col = mix(col, col * 0.4 + film * 0.75, uHolo * 0.55);
  }
  // Keep the paint behind the UI: pull it towards the dark colour and grey it a little.
  col = mix(uC3, col, 0.55);
  col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, 0.8);
  gl_FragColor = vec4(col, 1.0);
}
`;

type RGB = [number, number, number];

/** Colour moods. The menu's red and blue belong to the title screen only;
 *  rooms and tables get a random palette instead, and big moments flash their own colours. */
export const MOODS = {
  menu: [hex('#de443b'), hex('#006bb4'), hex('#162325')],
  reveal: [hex('#4f6dc4'), hex('#2d3f73'), hex('#141b2d')],
  win: [hex('#fda200'), hex('#c46a00'), hex('#2a1a07')],
  bust: [hex('#c8313a'), hex('#6e1b20'), hex('#1e0b0c')],
} satisfies Record<string, [RGB, RGB, RGB]>;

export type Mood = keyof typeof MOODS | 'table';

/** Table palettes by shop.ts id: the free ones, then the ones sold in the shop. */
export const TABLES: Record<string, [RGB, RGB, RGB]> = {
  felt: [hex('#2f8a5f'), hex('#1b5e4a'), hex('#0e2f2a')],
  goldSilver: [hex('#d9a92c'), hex('#9aa3ad'), hex('#202328')],
  purple: [hex('#8a5cc4'), hex('#4e2f7a'), hex('#1d1230')],
  teal: [hex('#2a9d9b'), hex('#1a5f66'), hex('#0b2a2e')],
  magenta: [hex('#c4497f'), hex('#6e2350'), hex('#220c1b')],
  ocean: [hex('#2d6fd1'), hex('#1a3f80'), hex('#0a1630')],
  crimson: [hex('#c8313a'), hex('#7a1b2a'), hex('#20080c')],
  sunset: [hex('#ff8a3d'), hex('#c4416a'), hex('#2a1030')],
  rose: [hex('#e8a0b4'), hex('#a35a72'), hex('#2e1520')],
  wood: [hex('#b7834a'), hex('#6e4526'), hex('#241409')],
  lava: [hex('#ffb000'), hex('#d8361c'), hex('#1e0805')],
  neon: [hex('#ff3fb4'), hex('#2ad4ff'), hex('#120a24')],
  royal: [hex('#3f5bd8'), hex('#b8902c'), hex('#141836')],
  pride: [hex('#e40303'), hex('#004dff'), hex('#1a0f24')],
  trans: [hex('#5bcefa'), hex('#f5a9b8'), hex('#14202a')],
  // Completionist's reward: the felt turned inside out, with a sheen (like the Negative edition).
  negative: [hex('#d075a0'), hex('#4a1e6b'), hex('#0b0a14')],
  // Silver paint under a rainbow film (uHolo).
  holo: [hex('#c4cedc'), hex('#6c7a96'), hex('#141822')],
  // Tables in 2, 3, 5 and 7 colours (PAINTS): the first and last paint colour, and the backdrop.
  iceFire: [hex('#4fc3f7'), hex('#ff5a36'), hex('#140c14')],
  nightDay: [hex('#f2d16b'), hex('#3a4fb8'), hex('#0d1126')],
  mintCoral: [hex('#6fe3b4'), hex('#ff7f6b'), hex('#10201c')],
  tropical: [hex('#ffd23f'), hex('#ee4266'), hex('#0f1d1f')],
  berry: [hex('#ff5d8f'), hex('#00bbf9'), hex('#140f26')],
  autumn: [hex('#e9c46a'), hex('#7f4f24'), hex('#1c120a')],
  aurora: [hex('#00f5d4'), hex('#fee440'), hex('#0b1020')],
  carnival: [hex('#ff595e'), hex('#6a4c93'), hex('#120f1e')],
  spectrum: [hex('#ff4d4d'), hex('#b14dff'), hex('#0f0d1a')],
  kaleidoscope: [hex('#f72585'), hex('#ffd166'), hex('#100a1e')],
};
/** Tables painted in their own list of colours, blended in order through the folds. */
export const PAINTS: Record<string, RGB[]> = {
  iceFire: ['#4fc3f7', '#ff5a36'].map(hex),
  nightDay: ['#f2d16b', '#3a4fb8'].map(hex),
  mintCoral: ['#6fe3b4', '#ff7f6b'].map(hex),
  tropical: ['#ffd23f', '#3bceac', '#ee4266'].map(hex),
  berry: ['#ff5d8f', '#9b5de5', '#00bbf9'].map(hex),
  autumn: ['#e9c46a', '#e76f51', '#7f4f24'].map(hex),
  aurora: ['#00f5d4', '#00bbf9', '#9b5de5', '#f15bb5', '#fee440'].map(hex),
  carnival: ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'].map(hex),
  spectrum: ['#ff4d4d', '#ff9f1c', '#ffe14d', '#4cd97b', '#2ec4f1', '#4d6bff', '#b14dff'].map(hex),
  kaleidoscope: ['#f72585', '#b5179e', '#7209b7', '#4361ee', '#4cc9f0', '#80ffdb', '#ffd166'].map(hex),
};
/** Flag tables: their stripes, top to bottom, shown in the paint's folds. */
export const STRIPES: Record<string, RGB[]> = {
  pride: ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'].map(hex),
  trans: ['#5bcefa', '#f5a9b8', '#ffffff', '#f5a9b8', '#5bcefa'].map(hex),
};
/** Tables with a shine sweeping across. */
const SHEEN = new Set(['negative', 'holo']);
/** Tables under a rainbow film. */
const HOLO = new Set(['holo']);
/** The random pick, for when the Table setting is Random. */
let randomTable = FREE_TABLES[Math.floor(Math.random() * FREE_TABLES.length)];

/** The table's palette: the one chosen in Settings (if it's yours), or the random pick. */
function tablePalette(): [RGB, RGB, RGB] {
  return TABLES[tableId()];
}

/** The table that shows: the one chosen in Settings if it's yours, else felt. */
function tableId(): string {
  const chosen = getSettings().table;
  if (chosen === 'random') return ownsRandom('table') ? randomTable : 'felt';
  return owns(chosen) && TABLES[chosen] ? chosen : 'felt';
}

function hex(h: string): RGB {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

let target: [RGB, RGB, RGB] = MOODS.menu;
let colours = MOODS.menu.map((c) => [...c]) as [RGB, RGB, RGB];
/** The table on show, for its stripes and sheen (null for a mood). */
let shownTable: string | null = null;
let stripes = 0;
let sheen = 0;
let holo = 0;
let paint = 0;
let spinBoost = 0;

let mood: Mood = 'menu';
/** Starts drawing again after the background stood still (set by startBackground). */
let wake = () => {};

export function setMood(name: Mood): void {
  mood = name;
  const next = name === 'table' ? tablePalette() : MOODS[name];
  shownTable = name === 'table' ? tableId() : null;
  wake();
  if (next === target) return;
  target = next;
  // Like moving between screens in Balatro: the paint spins up while the colours change.
  swirl(1.2);
}

/** Shows table `id` behind whatever is open (the shop's tables), or, with null, goes back to the mood. */
export function previewTable(id: string | null): void {
  const shown = id && TABLES[id] ? id : mood === 'table' ? tableId() : null;
  shownTable = shown;
  // Only the colours change: no spin-up, so hovering along the list stays calm.
  target = shown ? TABLES[shown] : MOODS[mood as keyof typeof MOODS];
  wake();
}

/** Picks a different random palette for the table (used by the next setMood('table')). */
export function shuffleTablePalette(): void {
  const mine = ownedOf('table');
  const others = mine.filter((id) => id !== randomTable);
  randomTable = others.length ? others[Math.floor(Math.random() * others.length)] : (mine[0] ?? 'felt');
}

/** Briefly speeds up the swirl, for big plays and screen changes. */
export function swirl(amount = 1): void {
  if (!getSettings().reducedMotion) spinBoost = Math.min(3, spinBoost + amount);
  wake();
}

export function startBackground(canvas: HTMLCanvasElement): void {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) {
    canvas.style.background = '#1f4d3d';
    return;
  }
  const prog = gl.createProgram()!;
  for (const [type, src] of [
    [gl.VERTEX_SHADER, VERT],
    [gl.FRAGMENT_SHADER, FRAG],
  ] as const) {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh));
    gl.attachShader(prog, sh);
  }
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = u('uRes'), uTime = u('uTime'), uSpin = u('uSpinTime'), uC1 = u('uC1'), uC2 = u('uC2'), uC3 = u('uC3');
  const uS = u('uS'), uStripeN = u('uStripeN'), uStripes = u('uStripes'), uSheen = u('uSheen'), uHolo = u('uHolo');
  const uP = u('uP'), uPN = u('uPN'), uPaint = u('uPaint');

  // About 520 "pixels" across the diagonal, scaled up by CSS.
  const resize = () => {
    const diag = Math.hypot(innerWidth, innerHeight);
    const k = 520 / diag;
    canvas.width = Math.max(64, Math.round(innerWidth * k));
    canvas.height = Math.max(64, Math.round(innerHeight * k));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  addEventListener('resize', () => {
    resize();
    wake();
  });

  let time = 0;
  let spinTime = 0;
  let last = performance.now();
  let frameSkip = 0;
  // Standing still (the animation off and the colours settled), it stops drawing at all until
  // something changes (wake).
  let running = true;
  let next = 0;
  let finalDrawn = false;
  wake = () => {
    finalDrawn = false;
    if (running) return;
    running = true;
    frameSkip = 0;
    last = performance.now();
    next = requestAnimationFrame(frame);
  };
  const settled = (a: number, b: number) => Math.abs(a - b) < 0.002;
  const frame = (now: number) => {
    next = requestAnimationFrame(frame);
    // Capped by the FPS setting (a little early is fine: frames don't land exactly).
    if (now - last < 1000 / frameRate() - 4) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const s = getSettings();
    const animate = s.backgroundAnim && !s.reducedMotion;
    // Ease colours towards the current mood (mostly there in about half a second).
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) colours[i][j] += (target[i][j] - colours[i][j]) * Math.min(1, dt * 4);
    spinBoost = Math.max(0, spinBoost - dt * 1.5);
    // Stripes and sheen fade with the colours.
    const flag = shownTable ? STRIPES[shownTable] : undefined;
    stripes += ((flag ? 1 : 0) - stripes) * Math.min(1, dt * 4);
    sheen += ((shownTable && SHEEN.has(shownTable) ? 1 : 0) - sheen) * Math.min(1, dt * 4);
    holo += ((shownTable && HOLO.has(shownTable) ? 1 : 0) - holo) * Math.min(1, dt * 4);
    const paints = shownTable ? PAINTS[shownTable] : undefined;
    paint += ((paints ? 1 : 0) - paint) * Math.min(1, dt * 4);
    if (paints) {
      gl.uniform3fv(uP, [...paints, ...Array(7 - paints.length).fill(paints.at(-1))].flat());
      gl.uniform1f(uPN, paints.length);
    }
    if (flag) {
      gl.uniform3fv(uS, [...flag, ...Array(6 - flag.length).fill(flag.at(-1))].flat());
      gl.uniform1f(uStripeN, flag.length);
    }
    if (animate) {
      // Wrapped, so the shader's numbers stay small (and precise) however long the tab is open.
      time = (time + dt * (1 + spinBoost * 2)) % 2000;
      spinTime = (spinTime + dt * (1 + spinBoost * 6)) % (20 * Math.PI * 100);
    }
    if (!animate) {
      const fade = (flag ? 1 : 0) + (shownTable && SHEEN.has(shownTable) ? 1 : 0) * 2 + (shownTable && HOLO.has(shownTable) ? 1 : 0) * 4 + (paints ? 1 : 0) * 8;
      const still = colours.every((c, i) => c.every((v, j) => settled(v, target[i][j]))) && [stripes, sheen, holo, paint].every((v, k) => settled(v, (fade >> k) & 1));
      // Settled: one last frame, then stop. Until then, only redraw occasionally (colour changes) to save battery.
      if (still && finalDrawn) {
        cancelAnimationFrame(next);
        running = false;
        return;
      }
      if (still) finalDrawn = true;
      else if (++frameSkip % 10 !== 0) return;
    }
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, time);
    gl.uniform1f(uSpin, spinTime);
    gl.uniform3f(uC1, ...colours[0]);
    gl.uniform3f(uC2, ...colours[1]);
    gl.uniform3f(uC3, ...colours[2]);
    gl.uniform1f(uStripes, stripes);
    gl.uniform1f(uSheen, sheen);
    gl.uniform1f(uHolo, holo);
    gl.uniform1f(uPaint, paint);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  next = requestAnimationFrame(frame);
  onSettings(() => {
    frameSkip = 0;
    wake();
  });
  // A new Table setting shows at once if the table is up.
  onSettings(() => mood === 'table' && setMood('table'));
}
