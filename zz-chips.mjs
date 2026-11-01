import { chromium } from 'playwright';
const dir = process.argv[2];
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
await pg.addInitScript(() => { if (!localStorage.getItem('tximtxom.settings')) { localStorage.setItem('tximtxom.settings', JSON.stringify({ muted: true, lang: 'en' })); localStorage.setItem('tximtxom.achievements', JSON.stringify({ sayHi: 1, windowShopper: 1, champion: 1 })); } });
pg.setDefaultTimeout(30000);
await pg.goto('http://localhost:5180/tximtxom/'); await pg.click('#loading button'); await pg.waitForTimeout(800);
console.log('menu chips:', await pg.locator('.menu-chips').textContent());
await pg.screenshot({ path: `${dir}/chips-menu.png` });
// Tamper: edit the save, reload, expect the last valid one back.
const before = await pg.evaluate(() => localStorage.getItem('tximtxom.chips'));
await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('tximtxom.chips')); s.data = s.data.slice(0, -4) + 'AAAA'; localStorage.setItem('tximtxom.chips', JSON.stringify(s)); });
await pg.reload(); await pg.click('#loading button'); await pg.waitForTimeout(800);
console.log('after tamper:', await pg.locator('.menu-chips').textContent());
// Play: start a bot game and capture a reveal.
await pg.click('.menu-play'); await pg.fill('input[autocomplete=nickname]', 'Nox');
await pg.click('text=Create room'); await pg.waitForSelector('.bot-row');
await pg.locator('.lobby').screenshot({ path: `${dir}/chips-lobby.png` });
await pg.click('.bot-row .btn >> nth=1'); await pg.waitForTimeout(1500);
await pg.click('.lobby-actions .btn'); await pg.waitForSelector('.main-actions');
console.log('after deal:', await pg.evaluate(() => 1));
const bar = (l) => pg.locator(`.main-actions button:has-text("${l}"):not([disabled])`).first();
async function hold(where) {
  const h = pg.locator(`${where} .hold:not([disabled])`).first(); if (!(await h.count())) return false;
  const box = await h.boundingBox(); if (!box) return false;
  await pg.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await pg.mouse.down(); await pg.waitForTimeout(1300); await pg.mouse.up(); return true;
}
let shots = 0; const end = Date.now() + 300000;
while (Date.now() < end) {
  if (await pg.locator('.summary-modal').count()) break;
  if ((await pg.locator('.chip-pop').count()) && shots < 3) { await pg.screenshot({ path: `${dir}/chips-pop-${shots++}.png`, animations: 'allow' }); }
  if (await hold('.main-actions')) continue;
  for (const l of ['Pass', 'Draw', 'Discard', 'End Turn']) { const x = bar(l); if (await x.count()) { await x.click({ timeout: 2000 }).catch(() => {}); break; } }
  await pg.waitForTimeout(120);
}
await pg.waitForTimeout(1500);
await pg.locator('.summary-modal').screenshot({ path: `${dir}/chips-summary.png` });
await pg.keyboard.press('Escape');
await b.close();
