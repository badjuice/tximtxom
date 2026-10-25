// Builds TximTxom's assets from Kenney packs (CC0, https://kenney.nl) into
// packages/client/public/assets, in the same atlas format the game loads.
//
// Usage: npm run assets [cards]   (expects the packs unzipped in .cache/kenney/<pack>/, see README)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import ffmpegPath from 'ffmpeg-static';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const KENNEY = path.join(ROOT, '.cache/kenney');
const OUT = path.join(ROOT, 'packages/client/public/assets');

const PACKS = ['playing-cards-pack', 'tiny-dungeon', 'board-game-icons', 'casino-audio', 'interface-sounds', 'impact-sounds', 'music-jingles', 'rpg-audio', 'ui-pack', 'game-icons', 'digital-audio'];
for (const p of PACKS) {
  if (!fs.existsSync(path.join(KENNEY, p))) {
    console.error(`Missing ${path.join(KENNEY, p)}. Download it from https://kenney.nl/assets/${p} and unzip it there.`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------- cards

const CARDS = path.join(KENNEY, 'playing-cards-pack/PNG/Cards (large)');
// The card sits inside a 64x64 tile.
const AW = 42;
const AH = 60;
const CROP = { left: 11, top: 2, width: AW, height: AH };

const SUITS = { H: 'hearts', C: 'clubs', D: 'diamonds', S: 'spades' };
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const fileRank = (r) => (r.length === 1 && r >= '2' && r <= '9' ? `0${r}` : r);

const INK = '4d5766'; // outline, and the black suits' ink
const RED = 'f52c4e';
const FIELD = 'c7d7ec'; // light blue: card back field, inner frame

// High contrast: one colour per suit (the game's suit colours).
const HC = { H: [RED, [240, 52, 100]], D: [RED, [240, 107, 63]], S: [INK, [60, 67, 104]], C: [INK, [35, 89, 85]] };

const BACKS = {
  back_red: [254, 95, 85],
  back_blue: [0, 157, 255],
  back_yellow: [253, 162, 0],
  back_green: [75, 194, 146],
  back_black: [58, 74, 77],
  back_purple: [136, 103, 165],
};

const hex = (d, i) => ((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]).toString(16).padStart(6, '0');

async function load(file) {
  return sharp(path.join(CARDS, `${file}.png`)).extract(CROP).raw().toBuffer({ resolveWithObject: true });
}

/** Swaps one colour for another, leaving the outer outline ring alone. */
function recolour({ data, info }, from, to) {
  const out = Buffer.from(data);
  const { width: w, height: h } = info;
  const opaque = (x, y) => x >= 0 && y >= 0 && x < w && y < h && data[(y * w + x) * 4 + 3] > 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!data[i + 3] || hex(data, i) !== from) continue;
      if (!(opaque(x - 1, y) && opaque(x + 1, y) && opaque(x, y - 1) && opaque(x, y + 1))) continue;
      [out[i], out[i + 1], out[i + 2]] = to;
    }
  }
  return { data: out, info };
}

const png = ({ data, info }) => sharp(data, { raw: info }).png().toBuffer();

async function cards() {
  const entries = [];
  for (const deck of ['n', 'hc']) {
    for (const s of ['H', 'C', 'D', 'S']) {
      for (const r of RANKS) {
        let img = await load(`card_${SUITS[s]}_${fileRank(r)}`);
        if (deck === 'hc') img = recolour(img, ...HC[s]);
        entries.push([`${deck}_${r}${s}`, await png(img)]);
      }
    }
  }
  entries.push(['base', await png(await load('card_empty'))]);
  for (const c of ['red', 'black']) entries.push([`joker_${c}`, await png(await load(`card_joker_${c}`))]);
  const back = await load('card_back');
  for (const [k, rgb] of Object.entries(BACKS)) entries.push([k, await png(recolour(back, FIELD, rgb))]);
  await buildAtlas('cards', entries, AW, AH);
}

// ---------------------------------------------------------------- art (avatars, rule art)

const TILES = path.join(KENNEY, 'tiny-dungeon/Tiles');
const ICONS64 = path.join(KENNEY, 'board-game-icons/PNG/Default (64px)');

const COLOURS = {
  red: [254, 95, 85],
  blue: [0, 157, 255],
  orange: [253, 162, 0],
  green: [75, 194, 146],
  purple: [136, 103, 165],
  grey: [58, 74, 77],
  gold: [234, 192, 88],
};

// Tiny Dungeon character tiles. Bots first (rules.ts BOT_PERSONAS), then the art players pick from.
const AVATARS = {
  magiku: [84, 'purple'],
  kabaleru: [96, 'blue'],
  bikingu: [87, 'red'],
  fantasma: [121, 'grey'],
  ziku: [109, 'orange'],
  frei: [111, 'green'],
  villager: [85, 'blue'],
  bearded: [86, 'orange'],
  barbarian: [88, 'red'],
  guard: [97, 'grey'],
  squire: [98, 'green'],
  princess: [99, 'purple'],
  elder: [100, 'green'],
  slime: [108, 'purple'],
  crab: [110, 'blue'],
  ranger: [112, 'orange'],
  bat: [120, 'green'],
  spider: [122, 'red'],
  snail: [123, 'blue'],
  boar: [124, 'orange'],
};

// Board Game Icons for rules and help, on a card in the rule's colour.
const RULE_ART = {
  bust: ['skull', 'red'],
  softcore: ['card_add', 'green'],
  double: ['cards_collection', 'red'],
  penalty: ['dollar', 'red'],
  ace: ['arrow_reserve', 'green'],
  mixed: ['flask_full', 'green'],
  autoride: ['hand_card', 'green'],
  ride: ['pawn_clockwise', 'orange'],
  tximtxom: ['crown_a', 'orange'],
  peek: ['cards_seek', 'blue'],
  notice: ['notepad_write', 'blue'],
  timer: ['hourglass', 'blue'],
  help: ['cards_fan', 'purple'],
  turn: ['cards_take', 'purple'],
  txijog: ['cards_under', 'red'],
};

/** A white Board Game icon at `size` px, hard-edged so it reads as pixel art. */
async function whiteIcon(name, size) {
  const { data, info } = await sharp(path.join(ICONS64, `${name}.png`)).resize(size, size, { kernel: 'lanczos3' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    data[i + 3] = data[i + 3] > 110 ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = 255;
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

/** The card back in one colour, with `fg` centred on it. */
async function onCard(colour, fg, size) {
  const card = await png(recolour(await load('card_back'), FIELD, COLOURS[colour]));
  return sharp(card).composite([{ input: fg, left: Math.round((AW - size) / 2), top: Math.round((AH - size) / 2) }]).png().toBuffer();
}

async function art() {
  const entries = [];
  for (const [k, [tile, colour]] of Object.entries(AVATARS)) {
    const fg = await sharp(path.join(TILES, `tile_${String(tile).padStart(4, '0')}.png`)).resize(32, 32, { kernel: 'nearest' }).png().toBuffer();
    entries.push([k, await onCard(colour, fg, 32)]);
  }
  for (const [k, [icon, colour]] of Object.entries(RULE_ART)) entries.push([k, await onCard(colour, await whiteIcon(icon, 28), 28)]);
  await buildAtlas('art', entries, AW, AH);
}

// ---------------------------------------------------------------- icons (badges)

const BADGES = {
  turn: ['hand_card', 'orange', 34],
  host: ['crown_b', 'gold', 34],
  bot: ['character', 'blue', 34],
  win: ['award', 'gold', 29],
};

async function icons() {
  let x = 0;
  const frames = {};
  const composites = [];
  for (const [key, [icon, colour, size]] of Object.entries(BADGES)) {
    const [r, g, b] = COLOURS[colour];
    const dark = [r, g, b].map((v) => Math.round(v * 0.6));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" shape-rendering="crispEdges">
      <rect x="1" y="2" width="${size - 2}" height="${size - 2}" rx="4" fill="rgb(${dark})"/>
      <rect x="1" y="1" width="${size - 2}" height="${size - 3}" rx="4" fill="rgb(${r},${g},${b})" stroke="#fff" stroke-width="2"/>
    </svg>`;
    const inner = Math.round(size * 0.62);
    const buf = await sharp(Buffer.from(svg))
      .composite([{ input: await whiteIcon(icon, inner), left: Math.round((size - inner) / 2), top: Math.round((size - inner) / 2) - 1 }])
      .png()
      .toBuffer();
    frames[key] = { frame: { x, y: 0, w: size, h: size }, sourceSize: { w: size, h: size }, spriteSourceSize: { x: 0, y: 0, w: size, h: size } };
    composites.push({ input: buf, left: x, top: 0 });
    x += size;
  }
  const height = Math.max(...Object.values(BADGES).map((b) => b[2]));
  await sharp({ create: { width: x, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(composites)
    .png({ compressionLevel: 9, palette: true, effort: 10 })
    .toFile(path.join(OUT, 'icons.png'));
  fs.writeFileSync(path.join(OUT, 'icons.json'), JSON.stringify({ frames, meta: { image: 'icons.png', size: { w: x, h: height }, scale: 1 } }));
  console.log(`atlas icons: ${Object.keys(BADGES).length} frames`);
}

// ---------------------------------------------------------------- menu button icons

// Plain white shapes, used as CSS masks so the buttons can colour them.
const UI_ICONS = { help: 'question', settings: 'gear', leave: 'exitLeft' };

async function uiIcons() {
  fs.mkdirSync(path.join(OUT, 'ui'), { recursive: true });
  for (const [key, file] of Object.entries(UI_ICONS)) {
    await sharp(path.join(KENNEY, 'game-icons/PNG/White/2x', `${file}.png`))
      .resize(64, 64)
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT, 'ui', `${key}.png`));
  }
  console.log(`ui icons: ${Object.keys(UI_ICONS).length}`);
  // The loading screen's card (shown before the atlases load), as one strip:
  // the two Jokers, then the backs in BACKS order (index.html picks one at random).
  const { frames } = JSON.parse(fs.readFileSync(path.join(OUT, 'cards.json'), 'utf8'));
  const strip = ['joker_red', 'joker_black', ...Object.keys(BACKS)];
  const parts = await Promise.all(
    strip.map(async (k, i) => {
      const f = frames[k].frame;
      const input = await sharp(path.join(OUT, 'cards.png')).extract({ left: f.x, top: f.y, width: f.w, height: f.h }).png().toBuffer();
      return { input, left: i * AW, top: 0 };
    }),
  );
  await sharp({ create: { width: AW * strip.length, height: AH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(parts)
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, 'ui', 'loading.png'));
}

// ---------------------------------------------------------------- audio

// Game sound name (audio.ts Sfx) -> Kenney file, by what the sound does in the game.
// pitch < 1 lowers the pitch (and lengthens), tempo > 1 shortens without changing pitch,
// trim cuts to that many seconds with a fade, gain matches the old sound's loudness, and
// echo adds a decaying tail to short hits that stand in for long sounds.
// The values come from measuring the old sounds' audible length and brightness.
const SFX = {
  button: { file: 'ui-pack/Sounds/tap-a', gain: 0.56 }, // any button
  cancel: { file: 'interface-sounds/Audio/minimize_009', pitch: 0.88, tempo: 1.29, gain: 0.39 }, // back, close, not allowed
  highlight1: { file: 'interface-sounds/Audio/confirmation_001', tempo: 1.27, gain: 1.03 }, // link copied, small confirmations
  highlight2: { file: 'interface-sounds/Audio/question_001', tempo: 0.98, gain: 0.52 }, // "your turn" and turn callouts
  card1: { file: 'casino-audio/Audio/card-place-1', tempo: 1.13, gain: 0.31 }, // card drawn
  card3: { file: 'casino-audio/Audio/card-place-3', tempo: 1.33, gain: 0.39 }, // card played or shown
  cardSlide1: { file: 'casino-audio/Audio/card-slide-1', gain: 0.34 }, // card moves in hand
  cardSlide2: { file: 'casino-audio/Audio/card-slide-2', gain: 0.26 }, // card moves between piles
  cardFan2: { file: 'casino-audio/Audio/cards-pack-open-2', tempo: 1.08, gain: 0.25 }, // hand dealt
  chips1: { file: 'casino-audio/Audio/chip-lay-2', tempo: 0.91, gain: 0.41 }, // points counted
  coin1: { file: 'rpg-audio/Audio/handleCoins2', gain: 1.25 }, // round scores, alternating
  coin2: { file: 'rpg-audio/Audio/handleCoins', trim: 0.25, gain: 0.66 },
  multhit1: { file: 'music-jingles/Audio/Pizzicato jingles/jingles_PIZZI16', gain: 0.27 }, // formation shown
  multhit2: { file: 'music-jingles/Audio/Pizzicato jingles/jingles_PIZZI02', gain: 0.31 }, // full hand bonus
  whoosh1: { file: 'rpg-audio/Audio/cloth3', gain: 2.33 }, // round ends
  win: { file: 'music-jingles/Audio/Steel jingles/jingles_STEEL12', gain: 0.32, echo: true }, // round or game won
  tarot1: { file: 'impact-sounds/Audio/impactGeneric_light_001', gain: 0.25 }, // new deal, cards burn away
  foil1: { file: 'impact-sounds/Audio/impactGlass_heavy_000', pitch: 0.76, tempo: 0.75, gain: 0.9 }, // full hand
  negative: { file: 'music-jingles/Audio/Steel jingles/jingles_STEEL14', gain: 0.47 }, // bust, lost
  explosion1: { file: 'music-jingles/Audio/Hit jingles/jingles_HIT15', gain: 1.28, echo: true }, // TximTxom called
  // An edition lands on a title-screen Ace, as in Balatro: glassy foil, warbling holo, rising polychrome, falling negative.
  editionFoil: { file: 'impact-sounds/Audio/impactGlass_light_002', gain: 0.3 },
  editionHolo: { file: 'digital-audio/Audio/phaseJump2', pitch: 0.85, gain: 0.14 },
  editionPoly: { file: 'digital-audio/Audio/powerUp7', pitch: 0.85, gain: 0.16 },
  editionNegative: { file: 'digital-audio/Audio/phaserDown2', pitch: 0.85, gain: 0.24 },
};
const RATE = 44100;
const GAP = 0.15; // seconds of silence between sprites

function filters({ pitch = 1, tempo = 1, trim, gain = 1, echo }) {
  // Start at the sound itself, not the file's leading silence.
  const f = ['silenceremove=start_periods=1:start_threshold=-50dB'];
  if (pitch !== 1) f.push(`asetrate=${Math.round(RATE * pitch)}`, `aresample=${RATE}`);
  if (tempo !== 1) f.push(`atempo=${tempo}`);
  if (echo) f.push('apad=pad_dur=2.5', 'aecho=0.9:0.9:180|390|640|930|1250:0.55|0.4|0.28|0.18|0.1', 'areverse', 'silenceremove=start_periods=1:start_threshold=-50dB', 'areverse', 'volume=1.3');
  if (trim) f.push(`atrim=0:${trim}`, `afade=t=out:st=${(trim * 0.6).toFixed(3)}:d=${(trim * 0.4).toFixed(3)}`);
  if (gain !== 1) f.push(`volume=${gain}`);
  return f.join(',');
}

function decode(file, filter = '') {
  const af = filter ? ['-af', filter] : [];
  return execFileSync(ffmpegPath, ['-v', 'error', '-i', file, ...af, '-f', 's16le', '-ac', '2', '-ar', String(RATE), '-'], { maxBuffer: 1 << 28 });
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
  for (const [name, fx] of Object.entries(SFX)) {
    const pcm = decode(path.join(KENNEY, `${fx.file}.ogg`), filters(fx));
    const ms = (pcm.length / bytesPerSec) * 1000;
    sprite[name] = [Math.round(offset), Math.round(ms)];
    parts.push(pcm, gap);
    offset += ms + GAP * 1000;
  }
  const pcmFile = path.join(tmpDir, 'sfx.pcm');
  fs.writeFileSync(pcmFile, Buffer.concat(parts));
  encode(pcmFile, path.join(OUT, 'sfx'), '96k');
  fs.writeFileSync(path.join(OUT, 'sfx.json'), JSON.stringify(sprite));
  console.log(`sfx sprite: ${Object.keys(SFX).length} sounds, ${(offset / 1000).toFixed(1)}s`);
}

// Simple grid atlas packer: every frame is w x h.
async function buildAtlas(name, entries, w, h) {
  const cols = 16;
  const rows = Math.ceil(entries.length / cols);
  const frames = {};
  const composites = [];
  entries.forEach(([key, buf], i) => {
    const x = (i % cols) * w;
    const y = Math.floor(i / cols) * h;
    frames[key] = { frame: { x, y, w, h }, sourceSize: { w, h }, spriteSourceSize: { x: 0, y: 0, w, h } };
    composites.push({ input: buf, left: x, top: y });
  });
  const width = cols * w;
  const height = rows * h;
  await sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(composites)
    .png({ compressionLevel: 9, palette: true, effort: 10 })
    .toFile(path.join(OUT, `${name}.png`));
  const json = { frames, meta: { image: `${name}.png`, size: { w: width, h: height }, scale: 1 } };
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(json));
  console.log(`atlas ${name}: ${entries.length} frames, ${width}x${height}`);
}

const only = process.argv[2]; // e.g. `node tools/build-assets.mjs cards`
if (!only || only === 'cards') await cards();
if (!only || only === 'art') await art();
if (!only || only === 'icons') await icons();
if (!only || only === 'ui') await uiIcons();
if (!only || only === 'audio') await audio();
