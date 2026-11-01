import { describe, expect, it } from 'vitest';
import { sanitizeRules } from '../src/rules';

describe('rules', () => {
  it('never keeps Magic Sort and Scramble on together', () => {
    expect(sanitizeRules({ magicSort: true, scramble: true })).toMatchObject({ magicSort: false, scramble: true });
    expect(sanitizeRules({ magicSort: true })).toMatchObject({ magicSort: true, scramble: false });
  });
  it('turns Mobius Strip off without Ace High', () => {
    expect(sanitizeRules({ mobius: true }).mobius).toBe(false);
  });
});

