// Writes CHANGELOG.md from packages/client/src/changelog.ts (Node 24 runs the .ts directly).
// Usage: npm run changelog
import fs from 'node:fs';
import { CHANGELOG, KIND_ICON } from '../packages/client/src/changelog.ts';

const lines = [
  '# Changelog',
  '',
  'Generated from `packages/client/src/changelog.ts` (`npm run changelog`); the game shows the same list.',
  'Versions follow semantic versioning; up to 0.11.0 they were assigned afterwards from the commit history and are tagged in git.',
  '',
  `${KIND_ICON.new} new · ${KIND_ICON.change} changed · ${KIND_ICON.fix} fixed · ${KIND_ICON.removed} removed`,
  '',
];
for (const r of CHANGELOG) {
  lines.push(`## ${r.version} (${r.date})`);
  for (const i of r.items) lines.push(`- ${KIND_ICON[i.kind]} ${i.en}`);
  lines.push('');
}
fs.writeFileSync(new URL('../CHANGELOG.md', import.meta.url), lines.join('\n'));
console.log(`CHANGELOG.md: ${CHANGELOG.length} versions`);
