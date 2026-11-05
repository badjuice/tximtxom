import { describe, expect, it } from 'vitest';
import { contrast, THEMES, themeFor, themeTokens, UI_STYLES, type ThemeToken } from '../src/themes';

// Every theme (and the neobrutalist style's own colours) keeps its text readable: WCAG AA
// (4.5:1) for text, AAA (7:1) for the main text on the panels.
const PANELS: ThemeToken[] = ['panel', 'panel-in', 'panel-d', 'panel-top', 'panel-bot'];
const ACCENTS: ThemeToken[] = ['red', 'blue', 'orange', 'green', 'grey', 'purple', 'gold', 'funny', 'epic', 'yellow', 'leave'];
const ON_PANEL: ThemeToken[] = ['muted', 'gold', 'red-l', 'green-l', 'blue-l', 'blue-n', 'orange-l', 'funny-l', 'epic-l', 'epic-n', 'yellow-l', 'hi'];

describe('themes', () => {
  for (const style of UI_STYLES)
    for (const { id } of THEMES) {
      const th = themeFor(id, style);
      if (th.kind === 'classic') continue;
      const t = themeTokens(th) as Record<ThemeToken, string>;
      it(`${id} (${style}) reads well`, () => {
        for (const bg of PANELS) expect(contrast(t.text, t[bg]), `text on ${bg}`).toBeGreaterThanOrEqual(7);
        for (const fg of ON_PANEL) for (const bg of PANELS) expect(contrast(t[fg], t[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
        for (const bg of ACCENTS) expect(contrast(t['on-accent'], t[bg]), `on-accent on ${bg}`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(t['on-yellow'], t.yellow), 'on-yellow').toBeGreaterThanOrEqual(4.5);
      });
    }
});
