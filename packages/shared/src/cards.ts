// A card is a number 0..51: suit * 13 + (rank - 1).
// Ranks: 1 = Ace, 2..10, 11 = J, 12 = Q, 13 = K.
export type Card = number;
export type Suit = 0 | 1 | 2 | 3;

export const SUIT_CODES = ['H', 'C', 'D', 'S'] as const;
export const SUIT_NAMES = ['Hearts', 'Clubs', 'Diamonds', 'Spades'] as const;
export const SUIT_SYMBOLS = ['♥', '♣', '♦', '♠'] as const;
export const RANK_CODES = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
export const RANK_NAMES = ['', 'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'] as const;

/** Highest rank that can be used to end a round. */
export const END_MAX_RANK = 5;

export function makeCard(rank: number, suit: Suit): Card {
  return suit * 13 + (rank - 1);
}

export function rankOf(c: Card): number {
  return (c % 13) + 1;
}

export function suitOf(c: Card): Suit {
  return Math.floor(c / 13) as Suit;
}

/** Points a card is worth when left unformed. Aces are always 1. */
export function cardPoints(c: Card): number {
  return rankOf(c);
}

export function handPoints(cards: readonly Card[]): number {
  return cards.reduce((s, c) => s + cardPoints(c), 0);
}

export function canEndWith(c: Card): boolean {
  return rankOf(c) <= END_MAX_RANK;
}

/** Short code such as "10H" or "AS". */
export function cardCode(c: Card): string {
  return RANK_CODES[rankOf(c)] + SUIT_CODES[suitOf(c)];
}

/** Short label with a suit symbol, such as "10♥" (easier to read than "10H"). */
export function cardLabel(c: Card): string {
  return RANK_CODES[rankOf(c)] + SUIT_SYMBOLS[suitOf(c)];
}

/** Human readable label such as "Queen of Spades". */
export function cardName(c: Card): string {
  return `${RANK_NAMES[rankOf(c)]} of ${SUIT_NAMES[suitOf(c)]}`;
}

/** Parses codes like "10H", "AS", "qd" (handy for tests). */
export function parseCard(code: string): Card {
  const m = /^(A|K|Q|J|10|[2-9])([HCDS])$/i.exec(code.trim());
  if (!m) throw new Error(`Bad card code: ${code}`);
  const rank = RANK_CODES.indexOf(m[1].toUpperCase() as (typeof RANK_CODES)[number]);
  const suit = SUIT_CODES.indexOf(m[2].toUpperCase() as (typeof SUIT_CODES)[number]) as Suit;
  return makeCard(rank, suit);
}

export function parseCards(codes: string): Card[] {
  return codes.split(/[\s,]+/).filter(Boolean).map(parseCard);
}

export function fullDeck(): Card[] {
  return Array.from({ length: 52 }, (_, i) => i);
}
