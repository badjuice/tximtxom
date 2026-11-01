import { describe, expect, it } from 'vitest';
import { everythingBut, sanitizeRules } from '../src/rules';

describe('rules', () => {
  it('never keeps Magic Sort and Scramble on together', () => {
    expect(sanitizeRules({ magicSort: true, scramble: true })).toMatchObject({ magicSort: false, scramble: true });
    expect(sanitizeRules({ magicSort: true })).toMatchObject({ magicSort: true, scramble: false });
  });
  it('turns Mobius Strip off without Ace High', () => {
    expect(sanitizeRules({ mobius: true }).mobius).toBe(false);
  });
});

describe('everythingBut', () => {
  const ALL = ['softcore', 'superposition', 'mobius', 'timer', 'magicSort', 'scramble'];
  const allBut = (...off: string[]) => ALL.filter((r) => !off.includes(r));
  it('needs every other rule on', () => {
    expect(everythingBut('softcore', allBut('softcore', 'scramble'), ALL)).toBe(true);
    expect(everythingBut('softcore', allBut('softcore', 'scramble', 'timer'), ALL)).toBe(false);
    expect(everythingBut('softcore', ALL, ALL)).toBe(false);
  });
  it('counts a rule that needs the missing one as off with it', () => {
    expect(everythingBut('superposition', allBut('superposition', 'mobius', 'scramble'), ALL)).toBe(true);
  });
  it('takes either of two rules that cannot be on together', () => {
    expect(everythingBut('softcore', allBut('softcore', 'magicSort'), ALL)).toBe(true);
    expect(everythingBut('softcore', allBut('softcore', 'magicSort', 'scramble'), ALL)).toBe(false);
    expect(everythingBut('scramble', allBut('scramble'), ALL)).toBe(true);
    expect(everythingBut('scramble', allBut('scramble', 'magicSort'), ALL)).toBe(false);
  });
});
