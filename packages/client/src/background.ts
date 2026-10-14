// Balatro's swirling paint background (resources/shaders/background.fs),
// ported to plain WebGL1. It renders into a tiny canvas that CSS scales up
// with `image-rendering: pixelated`, which gives the pixel look almost for free.
import { getSettings, onSettings } from './settings';

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uSpinTime;
uniform vec4 uC1;
uniform vec4 uC2;
uniform vec4 uC3;
uniform float uContrast;
uniform float uSpinAmount;
#define SPIN_EASE 0.5

void main() {
  vec2 screen = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 uv = (screen - 0.5 * uRes) / length(uRes) - vec2(0.12, 0.0);
  float uv_len = length(uv);

  float speed = (uSpinTime * SPIN_EASE * 0.2) + 302.2;
  float new_pixel_angle = atan(uv.y, uv.x) + speed - SPIN_EASE * 20.0 * (uSpinAmount * uv_len + (1.0 - uSpinAmount));
  vec2 mid = (uRes / length(uRes)) / 2.0;
  uv = (vec2(uv_len * cos(new_pixel_angle) + mid.x, uv_len * sin(new_pixel_angle) + mid.y) - mid);

  uv *= 30.0;
  speed = uTime * 2.0;
  vec2 uv2 = vec2(uv.x + uv.y);
  for (int i = 0; i < 5; i++) {
    uv2 += sin(max(uv.x, uv.y)) + uv;
    uv += 0.5 * vec2(cos(5.1123314 + 0.353 * uv2.y + speed * 0.131121), sin(uv2.x - 0.113 * speed));
    uv -= 1.0 * cos(uv.x + uv.y) - 1.0 * sin(uv.x * 0.711 - uv.y);
  }

  float contrast_mod = (0.25 * uContrast + 0.5 * uSpinAmount + 1.2);
  float paint_res = min(2.0, max(0.0, length(uv) * 0.035 * contrast_mod));
  float c1p = max(0.0, 1.0 - contrast_mod * abs(1.0 - paint_res));
  float c2p = max(0.0, 1.0 - contrast_mod * abs(paint_res));
  float c3p = 1.0 - min(1.0, c1p + c2p);
  gl_FragColor = (0.3 / uContrast) * uC1 + (1.0 - 0.3 / uContrast) * (uC1 * c1p + uC2 * c2p + vec4(c3p * uC3.rgb, c3p * uC1.a));
}
`;

type RGB = [number, number, number];

/** Colour moods: the table is green, it flashes other colours for big moments. */
export const MOODS: Record<string, [RGB, RGB, RGB]> = {
  table: [hex('#2f8a5f'), hex('#1b5e4a'), hex('#0e2f2a')],
  menu: [hex('#de443b'), hex('#006bb4'), hex('#162325')],
  reveal: [hex('#4f6dc4'), hex('#2d3f73'), hex('#141b2d')],
  win: [hex('#fda200'), hex('#c46a00'), hex('#2a1a07')],
  bust: [hex('#c8313a'), hex('#6e1b20'), hex('#1e0b0c')],
};

function hex(h: string): RGB {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

let target = MOODS.menu;
let colours = MOODS.menu.map((c) => [...c]) as [RGB, RGB, RGB];
let spinBoost = 0;

export function setMood(name: keyof typeof MOODS): void {
  target = MOODS[name];
}

/** Briefly speeds up the swirl (Balatro does this on big plays). */
export function swirl(amount = 1): void {
  if (!getSettings().reducedMotion) spinBoost = Math.min(3, spinBoost + amount);
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
  const uContrast = u('uContrast'), uSpinAmount = u('uSpinAmount');

  // Balatro uses ~700 "pixels" across the diagonal; we render at that size.
  const resize = () => {
    const diag = Math.hypot(innerWidth, innerHeight);
    const k = 520 / diag;
    canvas.width = Math.max(64, Math.round(innerWidth * k));
    canvas.height = Math.max(64, Math.round(innerHeight * k));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  addEventListener('resize', resize);

  let time = 0;
  let spinTime = 0;
  let last = performance.now();
  let frameSkip = 0;
  const frame = (now: number) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const s = getSettings();
    const animate = s.backgroundAnim && !s.reducedMotion;
    // Ease colours towards the current mood.
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) colours[i][j] += (target[i][j] - colours[i][j]) * Math.min(1, dt * 2);
    spinBoost = Math.max(0, spinBoost - dt * 1.5);
    if (animate) {
      time += dt * (1 + spinBoost * 2);
      spinTime += dt * (1 + spinBoost * 6);
    }
    // When static, only redraw occasionally (colour changes) to save battery.
    if (!animate && ++frameSkip % 10 !== 0) return;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, time);
    gl.uniform1f(uSpin, spinTime);
    gl.uniform4f(uC1, ...colours[0], 1);
    gl.uniform4f(uC2, ...colours[1], 1);
    gl.uniform4f(uC3, ...colours[2], 1);
    gl.uniform1f(uContrast, 1.6);
    gl.uniform1f(uSpinAmount, 0.25);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  requestAnimationFrame(frame);
  onSettings(() => (frameSkip = 0));
}
