// The shop: card backs, table colours and avatars bought with chips. What's
// bought is kept in the signed chips save (chips.ts `owned`); what's in use
// lives in the settings (card back, table) and the saved avatar (net.ts).
import { FRAMES, HUMAN_JOKERS, SHOP_AVATARS } from '@tximtxom/shared';
import { chipsNow } from './chips';
import type { CardStyle } from './settings';

export type ShopKind = 'back' | 'table' | 'avatar' | 'frame';

export interface ShopItem {
  id: string;
  kind: ShopKind;
  /** 0: free, always yours. */
  price: number;
  /** Card backs: the card style they belong to. */
  style?: CardStyle;
  /** A pack: the backs it holds, sold together (recolours of one art). */
  pack?: string[];
  /** Random: the last one of its group, sold once you own everything else in it. */
  random?: boolean;
  /** Never sold: given by this achievement (achievements.ts REWARDS). */
  reward?: string;
}

const PRICE: Record<ShopKind, number> = { avatar: 200, back: 300, table: 500, frame: 0 };
/** The showpieces. */
const PREMIUM = 1000;
/** The Holographic table: dearer than everything but a reward. */
const HOLO = 2500;
const PACK = { pixel: 1000, board: 750 };
const RANDOM = 2000;
/** Tables in more colours cost more: by how many colours they're painted in. */
const BY_COLOURS: Record<number, number> = { 2: 600, 3: 900, 5: 1500, 7: 2500 };
const PAINTED: [string, number][] = [["iceFire", 2], ["nightDay", 2], ["mintCoral", 2], ["tropical", 3], ["berry", 3], ["autumn", 3], ["aurora", 5], ["carnival", 5], ["spectrum", 7], ["kaleidoscope", 7]];
/** Simple frames' prices (rewards are free). */
const FRAME_PRICE: Partial<Record<(typeof FRAMES)[number], number>> = {"bronze": 300, "silver": 500, "gold": 800, "ruby": 600, "emerald": 600, "sapphire": 600, "amethyst": 600};

const free = (kind: ShopKind, ids: readonly string[], style?: CardStyle): ShopItem[] => ids.map((id) => ({ id, kind, price: 0, style }));
const sold = (kind: ShopKind, ids: readonly string[], style?: CardStyle, premium: string[] = []): ShopItem[] =>
  ids.map((id) => ({ id, kind, price: premium.includes(id) ? PREMIUM : PRICE[kind], style }));
const pack = (id: string, style: CardStyle, backs: string[]): ShopItem => ({ id, kind: 'back', price: PACK[style], style, pack: backs });
const board = (i: number) => ['blue', 'red', 'green'].map((c) => `back_${c}${i}`);

export const FREE_PIXEL_BACKS = ['back_red', 'back_blue'];
export const FREE_BOARD_BACKS = ['back_blue1', 'back_red1'];
export const FREE_TABLES = ['felt', 'purple'];
/** Random's id in a group: `random_pixel`, `random_board`, `random_table`. */
export const randomId = (kind: ShopKind, style?: CardStyle) => `random_${style ?? kind}`;

/** Which achievement gives each plate frame. */
const FRAME_REWARD: Partial<Record<(typeof FRAMES)[number], string>> = { boss: 'finalBoss' };

export const SHOP: ShopItem[] = [
  ...free('back', FREE_PIXEL_BACKS, 'pixel'),
  pack('pack_brights', 'pixel', ['back_yellow', 'back_orange', 'back_pink', 'back_purple']),
  pack('pack_deeps', 'pixel', ['back_green', 'back_teal', 'back_navy', 'back_black']),
  ...sold('back', ['back_crimson', 'back_rainbow', 'back_gold'], 'pixel', ['back_rainbow', 'back_gold']),
  { id: 'back_poly', kind: 'back', price: 0, style: 'pixel', reward: 'localLegend' },
  { id: 'back_foil', kind: 'back', price: 0, style: 'pixel', reward: 'ceo' },
  { id: randomId('back', 'pixel'), kind: 'back', price: RANDOM, style: 'pixel', random: true },
  ...free('back', FREE_BOARD_BACKS, 'board'),
  ...sold('back', ['back_green1'], 'board'),
  pack('pack_framed', 'board', board(3)),
  pack('pack_suits', 'board', board(2)),
  pack('pack_emblem', 'board', board(5)),
  { id: randomId('back', 'board'), kind: 'back', price: RANDOM, style: 'board', random: true },
  ...free('table', FREE_TABLES),
  ...sold('table', ['teal', 'magenta', 'goldSilver', 'ocean', 'crimson', 'sunset', 'rose', 'wood', 'lava', 'pride', 'trans', 'neon', 'royal'], undefined, ['neon', 'royal']),
  ...PAINTED.map(([id, n]): ShopItem => ({ id, kind: 'table', price: BY_COLOURS[n] })),
  { id: 'holo', kind: 'table', price: HOLO },
  { id: 'negative', kind: 'table', price: 0, reward: 'averageEnjoyer' },
  { id: randomId('table'), kind: 'table', price: RANDOM, random: true },
  ...free('avatar', HUMAN_JOKERS),
  ...sold('avatar', SHOP_AVATARS),
  { id: 'kingJohn', kind: 'avatar', price: 0, reward: 'johnTximtxom' },
  { id: 'bigBoss', kind: 'avatar', price: 0, reward: 'flawless' },
  { id: 'ceoHat', kind: 'avatar', price: 0, reward: 'royalFlush' },
  { id: 'ceoSuit', kind: 'avatar', price: 0, reward: 'allRules' },
  { id: 'none', kind: 'frame', price: 0 },
  ...FRAMES.map((id): ShopItem => ({ id, kind: 'frame', price: FRAME_PRICE[id] ?? 0, reward: FRAME_REWARD[id] })),
];

/** Everything that's sold: Completionist++ wants all of it. */
export const SOLD = SHOP.filter((i) => i.price > 0);
/** Whether every item for sale is yours. */
export const ownsEverything = (): boolean => SOLD.every((i) => owns(i.id));

/** Free, bought, or in a pack that's bought. */
export function owns(id: string): boolean {
  const mine = chipsNow().owned;
  return mine.includes(id) || SHOP.some((i) => (i.id === id && i.price === 0 && !i.reward) || (i.pack?.includes(id) && mine.includes(i.id)));
}

/** The items of one kind (and style) that can be used, packs opened into their backs, Random left out
 *  (and rewards, with `sold`). */
function usable(kind: ShopKind, style?: CardStyle, sold = false): string[] {
  return SHOP.filter((i) => i.kind === kind && (!style || i.style === style) && !i.random && !(sold && i.reward)).flatMap((i) => i.pack ?? [i.id]);
}

/** The ids of one kind (and style) that are yours, in shop order (Random not included). */
export const ownedOf = (kind: ShopKind, style?: CardStyle): string[] => usable(kind, style).filter(owns);

/** Random is for sale once everything else in its group is yours (rewards aside). */
export const randomOpen = (kind: ShopKind, style?: CardStyle): boolean => usable(kind, style, true).every(owns);

/** Whether you can pick Random for this group. */
export const ownsRandom = (kind: ShopKind, style?: CardStyle): boolean => chipsNow().owned.includes(randomId(kind, style));
