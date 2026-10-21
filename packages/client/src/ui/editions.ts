// Balatro-style card editions (Foil, Holographic, Polychrome, Negative) as
// WebGL shaders, for DOM cards. One hidden WebGL canvas draws every card in
// turn and each card copies the result into its own 2D canvas, so any number
// of cards share a single GL context.
import { getSettings } from '../settings';
import { atlasFrame } from './sprites';

export type Edition = 'foil' | 'holo' | 'poly' | 'negative';
export const EDITIONS: Edition[] = ['foil', 'holo', 'poly', 'negative'];
const EDITION_ID: Record<Edition, number> = { foil: 0, holo: 1, poly: 2, negative: 3 };

const VERT = `
attribute vec2 pos;
varying vec2 uv;
void main() {
  uv = vec2(pos.x * 0.5 + 0.5, 0.5 - pos.y * 0.5);
  gl_Position = vec4(pos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 uv;
uniform sampler2D tex;
uniform vec2 texSize;
uniform float time;
uniform vec2 tilt;
uniform int edition;
uniform float flash;

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + 1e-10)), d / (q.x + 1e-10), q.x);
}
vec3 hsv2rgb(vec3 c) {
  vec3 p = abs(fract(c.xxx + vec3(1.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

void main() {
  vec4 c = texture2D(tex, uv);
  if (c.a < 0.01) { gl_FragColor = vec4(0.0); return; }
  vec3 col = c.rgb;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  // Effects follow the art's pixel grid, so they read as pixel art too.
  vec2 px = (floor(uv * texSize) + 0.5) / texSize - 0.5;

  if (edition == 0) {
    // Foil: cold silver-blue metal with bright bands sweeping across as the card moves.
    float a = sin((px.x * 1.3 + px.y * 2.1) * 7.0 + time * 1.3 + tilt.x * 5.0) * 0.5 + 0.5;
    float b = sin((px.x * -2.2 + px.y * 1.2) * 9.0 - time * 0.8 + tilt.y * 6.0) * 0.5 + 0.5;
    vec3 metal = mix(vec3(0.3, 0.45, 0.85), vec3(0.75, 0.88, 1.0), a * b);
    col = mix(col, col * 0.35 + metal * (0.2 + 0.45 * lum), 0.85);
    col += vec3(0.7, 0.85, 1.0) * pow(a * b, 8.0) * 0.5;
  } else if (edition == 1) {
    // Holographic: a red-leaning rainbow sheen over a fine grid that shifts with the angle.
    float h = fract(px.x * 0.9 + px.y * 0.7 + time * 0.12 + tilt.x * 0.6 + tilt.y * 0.4);
    vec3 irid = hsv2rgb(vec3(h, 0.6, 1.0));
    vec2 cell = fract(uv * texSize / 3.0);
    float grid = step(0.66, max(cell.x, cell.y));
    col = mix(col, col * irid * 1.2, 0.5) * vec3(1.12, 0.86, 0.9);
    col += irid * (0.1 + 0.12 * grid) * (0.4 + 0.6 * lum);
  } else if (edition == 2) {
    // Polychrome: every colour, whites included, turns through the rainbow in a slow swirl.
    vec3 hsv = rgb2hsv(col);
    float swirl = sin(length(px) * 9.0 - time * 1.1) * 0.12 + atan(px.y, px.x) / 6.2832;
    hsv.x = fract(hsv.x + swirl + time * 0.06 + tilt.x * 0.25 - tilt.y * 0.15);
    hsv.y = max(hsv.y, 0.5);
    col = mix(col, hsv2rgb(hsv), 0.7);
  } else if (edition == 3) {
    // Negative: the colours inverted, so rank and suit stay readable (white marks on a dark card),
    // with a violet sheen sweeping across like the other editions.
    col = 1.0 - col;
    float s = sin((px.x - px.y) * 8.0 + time * 1.4 + tilt.x * 5.0) * 0.5 + 0.5;
    float s2 = sin((px.x * 1.7 + px.y) * 11.0 - time * 0.9 + tilt.y * 6.0) * 0.5 + 0.5;
    col += vec3(0.45, 0.3, 0.75) * pow(s * s2, 3.0) * 0.55;
    col += vec3(0.9, 0.8, 1.0) * pow(s * s2, 10.0) * 0.5;
  }
  // The landing flash: white that fades as the edition settles.
  col = mix(col, vec3(1.0), flash * 0.85);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a);
}`;

interface Entry {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tex: WebGLTexture | null;
  texSize: [number, number];
  edition: Edition | null;
  tilt: [number, number];
  landedAt: number;
}

let gl: WebGLRenderingContext | null = null;
let glCanvas: HTMLCanvasElement | null = null;
const uniforms: Record<string, WebGLUniformLocation | null> = {};
const entries = new Set<Entry>();
const images = new Map<string, Promise<HTMLImageElement>>();
let frame = 0;
const start = performance.now();

function setup(): boolean {
  if (gl) return true;
  glCanvas = document.createElement('canvas');
  const g = glCanvas.getContext('webgl', { premultipliedAlpha: false, alpha: true, antialias: false });
  if (!g) return false;
  const shader = (type: number, src: string) => {
    const s = g.createShader(type)!;
    g.shaderSource(s, src);
    g.compileShader(s);
    return s;
  };
  const prog = g.createProgram()!;
  g.attachShader(prog, shader(g.VERTEX_SHADER, VERT));
  g.attachShader(prog, shader(g.FRAGMENT_SHADER, FRAG));
  g.linkProgram(prog);
  if (!g.getProgramParameter(prog, g.LINK_STATUS)) return false;
  g.useProgram(prog);
  g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
  const loc = g.getAttribLocation(prog, 'pos');
  g.enableVertexAttribArray(loc);
  g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
  for (const u of ['tex', 'texSize', 'time', 'tilt', 'edition', 'flash']) uniforms[u] = g.getUniformLocation(prog, u);
  gl = g;
  return true;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  let p = images.get(url);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
    images.set(url, p);
  }
  return p;
}

/** The card's art (base plus face) as one texture. */
async function cardTexture(e: Entry, face: string): Promise<void> {
  const base = atlasFrame('cards', 'base');
  const top = atlasFrame('cards', face);
  if (!base || !top || !setup()) return;
  const img = await loadImage(base.url);
  const art = document.createElement('canvas');
  art.width = base.frame.w;
  art.height = base.frame.h;
  const c = art.getContext('2d')!;
  c.imageSmoothingEnabled = false;
  for (const f of [base.frame, top.frame]) c.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
  const g = gl!;
  e.tex = g.createTexture();
  g.bindTexture(g.TEXTURE_2D, e.tex);
  g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, art);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
  e.texSize = [art.width, art.height];
}

function draw(now: number): void {
  const g = gl;
  if (!g || !glCanvas) return;
  const reduced = getSettings().reducedMotion;
  const time = reduced ? 1.5 : (now - start) / 1000;
  for (const e of entries) {
    if (!e.tex || !e.edition) continue;
    const { width: w, height: h } = e.canvas;
    if (glCanvas.width !== w || glCanvas.height !== h) {
      glCanvas.width = w;
      glCanvas.height = h;
    }
    g.viewport(0, 0, w, h);
    g.clearColor(0, 0, 0, 0);
    g.clear(g.COLOR_BUFFER_BIT);
    g.bindTexture(g.TEXTURE_2D, e.tex);
    g.uniform1i(uniforms.tex, 0);
    g.uniform2f(uniforms.texSize, e.texSize[0], e.texSize[1]);
    g.uniform1f(uniforms.time, time);
    g.uniform2f(uniforms.tilt, e.tilt[0], e.tilt[1]);
    g.uniform1i(uniforms.edition, EDITION_ID[e.edition]);
    const since = (now - e.landedAt) / 1000;
    g.uniform1f(uniforms.flash, reduced ? 0 : Math.max(0, 1 - since / 0.45));
    g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
    e.ctx.clearRect(0, 0, w, h);
    e.ctx.drawImage(glCanvas, 0, 0);
  }
}

function loop(now: number): void {
  draw(now);
  frame = entries.size ? requestAnimationFrame(loop) : 0;
}

/**
 * Draws a card with an edition into `canvas` until `detach` is called.
 * `setEdition(null)` clears the canvas, showing the plain card underneath;
 * `setTilt` takes the pointer position over the card, -0.5..0.5 on each axis.
 */
export function attachEdition(canvas: HTMLCanvasElement, face: string) {
  const ctx = canvas.getContext('2d')!;
  const e: Entry = { canvas, ctx, tex: null, texSize: [1, 1], edition: null, tilt: [0, 0], landedAt: 0 };
  entries.add(e);
  void cardTexture(e, face);
  if (!frame) frame = requestAnimationFrame(loop);
  return {
    /** `land` plays the white landing flash. */
    setEdition(ed: Edition | null, land = true) {
      if (ed === e.edition) return;
      e.edition = ed;
      e.landedAt = land ? performance.now() : 0;
      if (!ed) ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    setTilt(x: number, y: number) {
      e.tilt = [x, y];
    },
    detach() {
      entries.delete(e);
      if (e.tex) gl?.deleteTexture(e.tex);
    },
  };
}
