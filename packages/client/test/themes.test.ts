import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrast, SHADOWED, THEMES, themeFor, themeTokens, UI_STYLES, type ThemeToken } from '../src/themes';

// Every theme (and the neobrutalist style's own colours) keeps its text readable: WCAG AA
// (4.5:1) for text, AAA (7:1) for the main text on the panels. In the neobrutalist style a full
// theme's text on colours is white on a hard black shadow, held to WCAG's large-text 3:1.
const PANELS: ThemeToken[] = ['panel', 'panel-in', 'panel-d', 'panel-top', 'panel-bot'];
const ACCENTS: ThemeToken[] = ['red', 'blue', 'orange', 'green', 'grey', 'purple', 'gold', 'funny', 'epic', 'yellow', 'leave'];
const ON_PANEL: ThemeToken[] = ['muted', 'gold', 'red-l', 'green-l', 'blue-l', 'blue-n', 'orange-l', 'funny-l', 'epic-l', 'epic-n', 'yellow-l', 'hi'];

describe('themes', () => {
  for (const style of UI_STYLES)
    for (const { id } of THEMES) {
      const th = themeFor(id, style);
      if (th.kind === 'classic') continue;
      const t = themeTokens(th, style) as Record<ThemeToken, string>;
      it(`${id} (${style}) reads well`, () => {
        for (const bg of PANELS) expect(contrast(t.text, t[bg]), `text on ${bg}`).toBeGreaterThanOrEqual(7);
        for (const fg of ON_PANEL) for (const bg of PANELS) expect(contrast(t[fg], t[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
        if (style === 'brutal' && th.kind === 'full') {
          expect(t['on-accent']).toBe('#ffffff');
          for (const bg of SHADOWED) expect(contrast('#ffffff', t[bg]), `white on ${bg}`).toBeGreaterThanOrEqual(3);
        } else for (const bg of ACCENTS) expect(contrast(t['on-accent'], t[bg]), `on-accent on ${bg}`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(t['on-yellow'], t.yellow), 'on-yellow').toBeGreaterThanOrEqual(4.5);
      });
    }

  it('gives every text on the colours its shadow in the neobrutalist style', () => {
    const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const block = css.match(/\.ui-brutal :is\(([^)]*(?:\([^)]*\)[^)]*)*)\) \{\s*text-shadow: 2px 2px 0 var\(--ink-shadow\)/);
    expect(block, 'the shadow rule').toBeTruthy();
    const listed = new Set(block![1].split(',').map((x) => x.trim().replace(/\s+/g, ' ')));
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!/(^|[\s;])color:\s*var\(--on-accent\)/.test(m[2])) continue;
      for (const sel of m[1].split(',').map((x) => x.trim().replace(/\s+/g, ' ')))
        if (!sel.startsWith('.ui-brutal')) expect(listed.has(sel), sel).toBe(true);
    }
  });
});
