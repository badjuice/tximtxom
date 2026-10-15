import { describe, expect, it } from 'vitest';
import {
  anyFormationPossible,
  bestPartition,
  canRide,
  classifyFormation,
  isFullyFormed,
  isTximTxom,
  parseCards as P,
} from '../src/index.js';

const base = { hardcore: false, superposition: false };
const hardcore = { hardcore: true, superposition: false };
const superpos = { hardcore: false, superposition: true };
const smeared = { hardcore: false, superposition: false, smeared: true };

describe('sets', () => {
  it('pairs, trios, quads', () => {
    expect(classifyFormation(P('7H 7S'), base)?.kind).toBe('pair');
    expect(classifyFormation(P('7H 7S 7D'), base)?.kind).toBe('trio');
    expect(classifyFormation(P('7H 7S 7D 7C'), base)?.kind).toBe('quad');
    expect(classifyFormation(P('7H 8H'), base)).toBeNull();
    expect(classifyFormation(P('7H'), base)).toBeNull();
  });
  it('hardcore disables pairs only', () => {
    expect(classifyFormation(P('7H 7S'), hardcore)).toBeNull();
    expect(classifyFormation(P('7H 7S 7D'), hardcore)?.kind).toBe('trio');
  });
});

describe('straights', () => {
  it('need 3+ consecutive cards of one suit', () => {
    expect(classifyFormation(P('4H 5H 6H'), base)?.kind).toBe('straight');
    expect(classifyFormation(P('6H 4H 5H 7H'), base)?.cards).toEqual(P('4H 5H 6H 7H'));
    expect(classifyFormation(P('4H 5H 6S'), base)).toBeNull();
    expect(classifyFormation(P('4H 5H'), base)).toBeNull();
    expect(classifyFormation(P('4H 5H 7H'), base)).toBeNull();
  });
  it('ace is low by default', () => {
    expect(classifyFormation(P('AH 2H 3H'), base)?.kind).toBe('straight');
    expect(classifyFormation(P('QH KH AH'), base)).toBeNull();
  });
  it('superposition allows ace high but never in the middle / wrapping', () => {
    expect(classifyFormation(P('QH KH AH'), superpos)?.cards).toEqual(P('QH KH AH'));
    expect(classifyFormation(P('AH 2H 3H'), superpos)?.kind).toBe('straight');
    expect(classifyFormation(P('KH AH 2H'), superpos)).toBeNull();
    expect(classifyFormation(P('QH KH AH 2H 3H'), superpos)).toBeNull();
  });
});

describe('Take a Ride', () => {
  it('extends sets by a single card', () => {
    expect(canRide(P('7H 7S'), P('7D')[0], base)?.kind).toBe('trio');
    expect(canRide(P('7H 7S 7D'), P('7C')[0], base)?.kind).toBe('quad');
    expect(canRide(P('7H 7S'), P('8H')[0], base)).toBeNull();
  });
  it('extends straights at either end, same suit only', () => {
    expect(canRide(P('4H 5H 6H'), P('7H')[0], base)?.cards).toEqual(P('4H 5H 6H 7H'));
    expect(canRide(P('4H 5H 6H'), P('3H')[0], base)).not.toBeNull();
    expect(canRide(P('4H 5H 6H'), P('7S')[0], base)).toBeNull();
    expect(canRide(P('4H 5H 6H'), P('8H')[0], base)).toBeNull();
  });
  it('respects superposition when riding', () => {
    expect(canRide(P('JH QH KH'), P('AH')[0], base)).toBeNull();
    expect(canRide(P('JH QH KH'), P('AH')[0], superpos)).not.toBeNull();
    expect(canRide(P('AH 2H 3H'), P('KH')[0], superpos)).toBeNull();
  });
});

describe('Smeared', () => {
  it('lets straights mix suits', () => {
    expect(classifyFormation(P('4H 5S 6D'), base)).toBeNull();
    expect(classifyFormation(P('4H 5S 6D'), smeared)?.kind).toBe('straight');
    expect(classifyFormation(P('4H 5S 7D'), smeared)).toBeNull();
    expect(classifyFormation(P('QH KS AD'), { ...smeared, superposition: true })?.kind).toBe('straight');
  });
  it('lets any suit ride a straight', () => {
    expect(canRide(P('4H 5H 6H'), P('7C')[0], base)).toBeNull();
    expect(canRide(P('4H 5H 6H'), P('7C')[0], smeared)).not.toBeNull();
    expect(canRide(P('4H 5H 6H'), P('6C')[0], smeared)).toBeNull();
  });
  it('still needs one suit for TximTxom', () => {
    expect(isTximTxom(P('AS 2H 3S 4S 5S 6S 7S'), smeared)).toBe(false);
    expect(isTximTxom(P('AS 2S 3S 4S 5S 6S 7S'), smeared)).toBe(true);
  });
});

describe('TximTxom', () => {
  it('is a 7-card straight of one suit', () => {
    expect(isTximTxom(P('AS 2S 3S 4S 5S 6S 7S'), base)).toBe(true);
    expect(isTximTxom(P('8S 9S 10S JS QS KS AS'), base)).toBe(false);
    expect(isTximTxom(P('8S 9S 10S JS QS KS AS'), superpos)).toBe(true);
    expect(isTximTxom(P('AS 2S 3S 4S 5S 6S 8S'), base)).toBe(false);
  });
});

describe('bestPartition', () => {
  it('finds the lowest leftover', () => {
    const hand = P('7H 7S 7D 8D 9D KC QH');
    const p = bestPartition(hand, base);
    // Either 7-7-7 (leaves 8,9,K,Q = 42) or 7D-8D-9D + 7H-7S pair (leaves K,Q = 25)
    expect(p.points).toBe(25);
    expect(p.leftover.sort()).toEqual(P('KC QH').sort());
  });
  it('detects a fully formed hand', () => {
    expect(isFullyFormed(P('7H 7S 2D 3D 4D KC KH'), base)).toBe(true);
    expect(isFullyFormed(P('7H 7S 2D 3D 4D KC KH'), hardcore)).toBe(false);
    expect(isFullyFormed(P('7H 7S 7D 3D 4D 5D 6D'), hardcore)).toBe(true);
  });
  it('anyFormationPossible', () => {
    expect(anyFormationPossible(P('2H 5S 9D'), base)).toBe(false);
    expect(anyFormationPossible(P('2H 2S 9D'), base)).toBe(true);
    expect(anyFormationPossible(P('2H 2S 9D'), hardcore)).toBe(false);
  });
});
