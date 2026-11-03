// The shop: card backs, table colours and avatars bought with chips. What's
// bought is kept in the signed chips save (chips.ts `owned`); what's in use
// lives in the settings (card back, table) and the saved avatar (net.ts).
import { HUMAN_JOKERS, SHOP_AVATARS } from '@tximtxom/shared';
import { chipsNow } from './chips';
import type { CardStyle } from './settings';

export type ShopKind = 'back' | 'table' | 'avatar';

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
}

const PRICE: Record<ShopKind, number> = { avatar: 200, back: 300, table: 500 };
/** The showpieces. */
const PREMIUM = 1000;
const PACK = { pixel: 1000, board: 750 };
const RANDOM = 2000;

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

export const SHOP: ShopItem[] = [
  ...free('back', FREE_PIXEL_BACKS, 'pixel'),
  pack('pack_brights', 'pixel', ['back_yellow', 'back_orange', 'back_pink', 'back_purple']),
  pack('pack_deeps', 'pixel', ['back_green', 'back_teal', 'back_navy', 'back_black']),
  ...sold('back', ['back_crimson', 'back_gold'], 'pixel', ['back_gold']),
  { id: randomId('back', 'pixel'), kind: 'back', price: RANDOM, style: 'pixel', random: true },
  ...free('back', FREE_BOARD_BACKS, 'board'),
  ...sold('back', ['back_green1'], 'board'),
  pack('pack_framed', 'board', board(3)),
  pack('pack_suits', 'board', board(2)),
  pack('pack_emblem', 'board', board(5)),
  { id: randomId('back', 'board'), kind: 'back', price: RANDOM, style: 'board', random: true },
  ...free('table', FREE_TABLES),
  ...sold('table', ['teal', 'magenta', 'goldSilver', 'ocean', 'crimson', 'sunset', 'rose', 'wood', 'lava', 'neon', 'royal'], undefined, ['neon', 'royal']),
  { id: randomId('table'), kind: 'table', price: RANDOM, random: true },
  ...free('avatar', HUMAN_JOKERS),
  ...sold('avatar', SHOP_AVATARS),
];

/** Free, bought, or in a pack that's bought. */
export function owns(id: string): boolean {
  const mine = chipsNow().owned;
  return mine.includes(id) || SHOP.some((i) => (i.id === id && i.price === 0) || (i.pack?.includes(id) && mine.includes(i.id)));
}

/** The items of one kind (and style) that can be used, packs opened into their backs, Random left out. */
function usable(kind: ShopKind, style?: CardStyle): string[] {
  return SHOP.filter((i) => i.kind === kind && (!style || i.style === style) && !i.random).flatMap((i) => i.pack ?? [i.id]);
}

/** The ids of one kind (and style) that are yours, in shop order (Random not included). */
export const ownedOf = (kind: ShopKind, style?: CardStyle): string[] => usable(kind, style).filter(owns);

/** Random is for sale once everything else in its group is yours. */
export const randomOpen = (kind: ShopKind, style?: CardStyle): boolean => usable(kind, style).every(owns);

/** Whether you can pick Random for this group. */
export const ownsRandom = (kind: ShopKind, style?: CardStyle): boolean => chipsNow().owned.includes(randomId(kind, style));
