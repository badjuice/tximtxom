// Extracts only the assets TximTxom needs from a local copy of the Telatro repo
// (Balatro resources) and writes small, mobile-friendly versions into
// packages/client/public/assets.
//
// Usage: npm run assets   (expects .cache/telatro to be a sparse clone, see README)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import ffmpegPath from 'ffmpeg-static';
import { compress } from 'wawoff2';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, '.cache/telatro/resources');
const TEX = path.join(SRC, 'textures_preresize/1x');
const OUT = path.join(ROOT, 'packages/client/public/assets');

const CW = 71; // card cell width at 1x
const CH = 95; // card cell height at 1x

if (!fs.existsSync(SRC)) {
  console.error(`Missing ${SRC}. Clone it first:\n` +
    '  git clone --depth 1 --filter=blob:none --sparse https://github.com/Infiniti20/Telatro.git .cache/telatro\n' +
    '  git -C .cache/telatro sparse-checkout set resources/textures_preresize/1x resources/sounds resources/fonts resources/shaders');
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------- textures

// Sheet row order is Hearts, Clubs, Diamonds, Spades; columns are 2..10, J, Q, K, A.
const SUITS = ['H', 'C', 'D', 'S'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const ENHANCERS = {
  base: [1, 0],
  back_red: [0, 0],
  back_blue: [0, 2],
  back_yellow: [1, 2],
  back_green: [2, 2],
  back_black: [3, 2],
  back_purple: [5, 2],
  chip: [2, 0],
};

const JOKERS = {
  joker: [0, 0],
  chaos: [1, 0],
  credit_card: [5, 1],
  mr_bones: [3, 4],
  duo: [5, 4],
  trio: [6, 4],
  family: [7, 4],
  order: [8, 4],
  ride_the_bus: [1, 6],
  superposition: [3, 11],
  hourglass: [4, 3],
  blueprint: [0, 3],
  sixth_sense: [8, 10],
  smeared: [4, 6],
  // Art human players pick from.
  greedy: [6, 1],
  lusty: [7, 1],
  wrathful: [8, 1],
  gluttonous: [9, 1],
  even_steven: [8, 3],
  odd_todd: [9, 3],
  green_joker: [2, 11],
  blue_joker: [7, 10],
  golden: [9, 2],
  // Legendary Jokers (bot personas): card base, and the "soul" drawn floating on top.
  canio: [3, 8],
  canio_soul: [3, 9],
  triboulet: [4, 8],
  triboulet_soul: [4, 9],
  yorick: [5, 8],
  yorick_soul: [5, 9],
  chicot: [6, 8],
  chicot_soul: [6, 9],
  perkeo: [7, 8],
  perkeo_soul: [7, 9],
};

async function cell(file, [x, y]) {
  return sharp(path.join(TEX, file))
    .extract({ left: x * CW, top: y * CH, width: CW, height: CH })
    .png()
    .toBuffer();
}

// Simple grid atlas packer: every frame is CW x CH.
async function buildAtlas(name, entries) {
  const cols = 16;
  const rows = Math.ceil(entries.length / cols);
  const frames = {};
  const composites = [];
  entries.forEach(([key, buf], i) => {
    const x = (i % cols) * CW;
    const y = Math.floor(i / cols) * CH;
    frames[key] = { frame: { x, y, w: CW, h: CH }, sourceSize: { w: CW, h: CH }, spriteSourceSize: { x: 0, y: 0, w: CW, h: CH } };
    composites.push({ input: buf, left: x, top: y });
  });
  const width = cols * CW;
  const height = rows * CH;
  await sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(composites)
    .png({ compressionLevel: 9, palette: true, effort: 10 })
    .toFile(path.join(OUT, `${name}.png`));
  const json = { frames, meta: { image: `${name}.png`, size: { w: width, h: height }, scale: 1 } };
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(json));
  console.log(`atlas ${name}: ${entries.length} frames, ${width}x${height}`);
}

async function textures() {
  const entries = [];
  for (const [deck, file] of [['n', '8BitDeck.png'], ['hc', '8BitDeck_opt2.png']]) {
    for (let s = 0; s < 4; s++) {
      for (let r = 0; r < 13; r++) {
        entries.push([`${deck}_${RANKS[r]}${SUITS[s]}`, await cell(file, [r, s])]);
      }
    }
  }
  for (const [k, pos] of Object.entries(ENHANCERS)) entries.push([k, await cell('Enhancers.png', pos)]);
  await buildAtlas('cards', entries);

  const jokers = [];
  for (const [k, pos] of Object.entries(JOKERS)) jokers.push([k, await cell('Jokers.png', pos)]);
  await buildAtlas('jokers', jokers);
  await icons();
}

// Small icons from other sheets: [file, cell size, col, row].
const ICONS = {
  tag_handy: ['tags.png', 34, 1, 3], // marks whose turn it is
  stake_gold: ['chips.png', 29, 2, 1], // games won
};

async function icons() {
  let x = 0;
  const frames = {};
  const composites = [];
  for (const [key, [file, size, col, row]] of Object.entries(ICONS)) {
    const buf = await sharp(path.join(TEX, file)).extract({ left: col * size, top: row * size, width: size, height: size }).png().toBuffer();
    frames[key] = { frame: { x, y: 0, w: size, h: size }, sourceSize: { w: size, h: size }, spriteSourceSize: { x: 0, y: 0, w: size, h: size } };
    composites.push({ input: buf, left: x, top: 0 });
    x += size;
  }
  const height = Math.max(...Object.values(ICONS).map((i) => i[1]));
  await sharp({ create: { width: x, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(composites)
    .png({ compressionLevel: 9, palette: true, effort: 10 })
    .toFile(path.join(OUT, 'icons.png'));
  fs.writeFileSync(path.join(OUT, 'icons.json'), JSON.stringify({ frames, meta: { image: 'icons.png', size: { w: x, h: height }, scale: 1 } }));
  console.log(`atlas icons: ${Object.keys(ICONS).length} frames`);
}

// ---------------------------------------------------------------- font

async function font() {
  const ttf = fs.readFileSync(path.join(SRC, 'fonts/m6x11plus.ttf'));
  const woff2 = await compress(ttf);
  fs.writeFileSync(path.join(OUT, 'm6x11plus.woff2'), woff2);
  console.log(`font: ${ttf.length} -> ${woff2.length} bytes`);
}

// ---------------------------------------------------------------- audio

const SFX = [
  'button', 'cancel', 'highlight1', 'highlight2', 'card1', 'card3', 'cardSlide1', 'cardSlide2',
  'cardFan2', 'paper1', 'chips1', 'chips2', 'coin1', 'coin2', 'coin3', 'multhit1', 'multhit2',
  'whoosh1', 'whoosh2', 'gong', 'win', 'glass1', 'crumple1', 'tarot1', 'timpani', 'foil1',
  'negative', 'generic1', 'explosion1',
];
const RATE = 44100;
const GAP = 0.15; // seconds of silence between sprites

function decode(file) {
  return execFileSync(ffmpegPath, ['-v', 'error', '-i', file, '-f', 's16le', '-ac', '2', '-ar', String(RATE), '-'], { maxBuffer: 1 << 28 });
}

function encode(pcmFile, outBase, bitrate) {
  const raw = ['-v', 'error', '-y', '-f', 's16le', '-ac', '2', '-ar', String(RATE), '-i', pcmFile];
  execFileSync(ffmpegPath, [...raw, '-c:a', 'libopus', '-b:a', bitrate, `${outBase}.webm`]);
  execFileSync(ffmpegPath, [...raw, '-c:a', 'libmp3lame', '-b:a', bitrate, `${outBase}.mp3`]);
}

async function audio() {
  const tmpDir = path.join(ROOT, '.cache/audio');
  fs.mkdirSync(tmpDir, { recursive: true });
  const bytesPerSec = RATE * 4;
  const gap = Buffer.alloc(Math.round(GAP * RATE) * 4);
  const parts = [];
  const sprite = {};
  let offset = 0;
  for (const name of SFX) {
    const pcm = decode(path.join(SRC, 'sounds', `${name}.ogg`));
    const ms = (pcm.length / bytesPerSec) * 1000;
    sprite[name] = [Math.round(offset), Math.round(ms)];
    parts.push(pcm, gap);
    offset += ms + GAP * 1000;
  }
  const pcmFile = path.join(tmpDir, 'sfx.pcm');
  fs.writeFileSync(pcmFile, Buffer.concat(parts));
  encode(pcmFile, path.join(OUT, 'sfx'), '96k');
  fs.writeFileSync(path.join(OUT, 'sfx.json'), JSON.stringify(sprite));
  console.log(`sfx sprite: ${SFX.length} sounds, ${(offset / 1000).toFixed(1)}s`);

  const music = path.join(tmpDir, 'music.pcm');
  fs.writeFileSync(music, decode(path.join(SRC, 'sounds', 'music1.ogg')));
  encode(music, path.join(OUT, 'music1'), '64k');
  console.log('music1 encoded');
}

const only = process.argv[2]; // e.g. `node tools/extract-assets.mjs textures`
if (!only || only === 'textures') await textures();
if (!only || only === 'font') await font();
if (!only || only === 'audio') await audio();
for (const f of fs.readdirSync(OUT)) console.log(`  ${f}  ${(fs.statSync(path.join(OUT, f)).size / 1024).toFixed(1)} KB`);
