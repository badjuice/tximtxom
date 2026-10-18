// Swirling paint background: a slow spiral twist over warped value noise,
// cut into three colour bands. It renders into a tiny canvas that CSS scales
// up with `image-rendering: pixelated`, which gives the pixel look for free.
import { getSettings, onSettings } from './settings';

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uSpinTime;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
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
  gl_FragColor = vec4(col, 1.0);
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
  if (MOODS[name] === target) return;
  target = MOODS[name];
  // Like moving between screens in Balatro: the paint spins up while the colours change.
  swirl(1.2);
}

/** Briefly speeds up the swirl, for big plays and screen changes. */
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

  // About 520 "pixels" across the diagonal, scaled up by CSS.
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
    // Ease colours towards the current mood (mostly there in about half a second).
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) colours[i][j] += (target[i][j] - colours[i][j]) * Math.min(1, dt * 4);
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
    gl.uniform3f(uC1, ...colours[0]);
    gl.uniform3f(uC2, ...colours[1]);
    gl.uniform3f(uC3, ...colours[2]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  requestAnimationFrame(frame);
  onSettings(() => (frameSkip = 0));
}
