// The card spawn from editions.ts (Balatro's DNA materialise) for live HTML,
// such as the hopping title letters: an SVG filter cuts the element out of a
// blocky noise image, a little more each frame, with a coloured edge in bands.
import { getSettings } from '../settings';

const NS = 'http://www.w3.org/2000/svg';
const BLOCK = 4; // px per noise block
const STEPS = 128; // resolution of the threshold tables
// Edge bands, as in the card shader: distance past the cut where each colour ends.
const BANDS = [0.03, 0.07, 0.11, 0.15];
// The filter reaches past the element, so letters hopping above it aren't clipped.
const REGION = { x: -0.1, y: -0.5, w: 1.2, h: 2 };

function hash(x: number, y: number, seed: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy, seed) + (hash(ix + 1, iy, seed) - hash(ix, iy, seed)) * ux;
  const b = hash(ix, iy + 1, seed) + (hash(ix + 1, iy + 1, seed) - hash(ix, iy + 1, seed)) * ux;
  return a + (b - a) * uy;
}

/** A threshold table: 1 where `lo <= n < hi`. */
function table(lo: number, hi: number): string {
  return Array.from({ length: STEPS }, (_, i) => {
    const n = (i + 0.5) / STEPS;
    return n >= lo && n < hi ? 1 : 0;
  }).join(' ');
}

let ids = 0;

/**
 * Materialises `el` over `ms`: it fills in from blocky holes behind an edge in
 * `colors` (palest first; the last is drawn at 55% over the element, like a char).
 */
export function spawnElement(el: HTMLElement, ms: number, colors: [string, string, string, string], done?: () => void): void {
  if (ms <= 0 || getSettings().reducedMotion) {
    done?.();
    return;
  }
  const r = el.getBoundingClientRect();
  const w = Math.max(1, Math.ceil(r.width * REGION.w));
  const h = Math.max(1, Math.ceil(r.height * REGION.h));
  const seed = Math.random() * 100;
  const img = document.createElement('canvas');
  img.width = w;
  img.height = h;
  const ctx = img.getContext('2d')!;
  for (let by = 0; by * BLOCK < h; by++) {
    for (let bx = 0; bx * BLOCK < w; bx++) {
      const n = 0.7 * noise(bx * 0.18, by * 0.18, seed) + 0.3 * hash(bx, by, seed);
      const v = Math.round(Math.min(1, Math.max(0, n)) * 255);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(bx * BLOCK, by * BLOCK, BLOCK, BLOCK);
    }
  }

  const id = `spawn-${++ids}`;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  const box = `x="${REGION.x}" y="${REGION.y}" width="${REGION.w}" height="${REGION.h}"`;
  const masks = ['m', 'b0', 'b1', 'b2', 'b3'];
  svg.innerHTML = `
    <filter id="${id}" ${box} filterUnits="objectBoundingBox" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB">
      <feImage href="${img.toDataURL()}" ${box} preserveAspectRatio="none" result="img" />
      <feColorMatrix in="img" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="n" />
      ${masks.map((m) => `<feComponentTransfer in="n" result="${m}"><feFuncA type="discrete" tableValues="0" /></feComponentTransfer>`).join('')}
      <feComposite in="SourceGraphic" in2="m" operator="in" result="vis" />
      ${colors
        .map(
          (c, i) => `<feFlood flood-color="${c}" flood-opacity="${i === 3 ? 0.55 : 1}" result="f${i}" />
      <feComposite in="f${i}" in2="b${i}" operator="in" result="e${i}" />
      <feComposite in="e${i}" in2="SourceAlpha" operator="in" result="c${i}" />`,
        )
        .join('')}
      <feMerge><feMergeNode in="vis" /><feMergeNode in="c0" /><feMergeNode in="c1" /><feMergeNode in="c2" /><feMergeNode in="c3" /></feMerge>
    </filter>`;
  document.body.append(svg);
  const funcs = [...svg.querySelectorAll('feFuncA')];

  const set = (amount: number) => {
    const cut = amount * 1.15;
    funcs[0].setAttribute('tableValues', table(cut, 2));
    BANDS.forEach((hi, i) => funcs[i + 1].setAttribute('tableValues', table(cut + (i ? BANDS[i - 1] : 0), cut + hi)));
  };
  set(1);
  el.style.filter = `url(#${id})`;
  const start = performance.now();
  const step = (now: number) => {
    const amount = 1 - (now - start) / ms;
    if (amount <= 0 || !el.isConnected) {
      el.style.filter = '';
      svg.remove();
      done?.();
      return;
    }
    set(amount);
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
