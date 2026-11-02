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
}

const PRICE: Record<ShopKind, number> = { avatar: 200, back: 300, table: 500 };
/** The showpieces. */
const PREMIUM = 1000;

const free = (kind: ShopKind, ids: readonly string[], style?: CardStyle): ShopItem[] => ids.map((id) => ({ id, kind, price: 0, style }));
const sold = (kind: ShopKind, ids: readonly string[], style?: CardStyle, premium: string[] = []): ShopItem[] =>
  ids.map((id) => ({ id, kind, price: premium.includes(id) ? PREMIUM : PRICE[kind], style }));

export const FREE_PIXEL_BACKS = ['back_red', 'back_blue', 'back_yellow', 'back_green', 'back_black', 'back_purple'];
// Variants 1 and 3 of each colour, colours taking turns: Random never shows one colour twice running.
export const FREE_BOARD_BACKS = [1, 3].flatMap((i) => ['blue', 'red', 'green'].map((c) => `back_${c}${i}`));
export const FREE_TABLES = ['felt', 'goldSilver', 'purple', 'teal', 'magenta'];

export const SHOP: ShopItem[] = [
  ...free('back', FREE_PIXEL_BACKS, 'pixel'),
  ...sold('back', ['back_teal', 'back_pink', 'back_orange', 'back_navy', 'back_crimson', 'back_gold'], 'pixel', ['back_gold']),
  ...free('back', FREE_BOARD_BACKS, 'board'),
  ...sold('back', [2, 5].flatMap((i) => ['blue', 'red', 'green'].map((c) => `back_${c}${i}`)), 'board'),
  ...free('table', FREE_TABLES),
  ...sold('table', ['ocean', 'crimson', 'sunset', 'rose', 'wood', 'lava', 'neon', 'royal'], undefined, ['neon', 'royal']),
  ...free('avatar', HUMAN_JOKERS),
  ...sold('avatar', SHOP_AVATARS),
];

/** Free, or bought. */
export const owns = (id: string): boolean => SHOP.some((i) => i.id === id && i.price === 0) || chipsNow().owned.includes(id);

/** The ids of one kind (and style) that are yours, in shop order. */
export const ownedOf = (kind: ShopKind, style?: CardStyle): string[] => SHOP.filter((i) => i.kind === kind && (!style || i.style === style) && owns(i.id)).map((i) => i.id);
