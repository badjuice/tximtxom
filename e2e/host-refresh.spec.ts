import { type Page, expect, test } from '@playwright/test';

const LIGHT = JSON.stringify({ reducedMotion: true, backgroundAnim: false, crt: false, muted: true });

async function open(page: Page) {
  await page.addInitScript((s) => localStorage.setItem('tximtxom.settings', s), LIGHT);
  page.setDefaultTimeout(60_000);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Create room');
}

/** Round number and bust limit, as shown in the top bar. */
const roundText = (page: Page) => page.locator('.round-chip').textContent();

test('the game survives the host refreshing the page', async ({ browser }) => {
  const host = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const guest = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  await open(host);
  await open(guest);

  await host.fill('input[autocomplete=nickname]', 'Host');
  await host.click('text=Create room');
  const code = (await host.locator('.room-code').textContent())!.trim();
  await guest.fill('input[autocomplete=nickname]', 'Guest');
  await guest.fill('.code-field input', code);
  await guest.click('button:has-text("Join")');
  await expect(host.locator('.player-list li')).toHaveCount(2);
  await host.click('text=+ Add bot');
  await host.click('text=Start game');
  await expect(guest.locator('.plate')).toHaveCount(3);
  const before = await roundText(host);

  // Host reloads mid-game.
  host.on('dialog', (d) => d.accept());
  host.on('console', (m) => m.type() === 'error' && console.log('[host]', m.text()));
  await host.reload({ waitUntil: 'commit', timeout: 120_000 });

  // The room comes back under the same code, with the same game.
  await expect(host.locator('.plate')).toHaveCount(3, { timeout: 150_000 });
  expect(await roundText(host)).toBe(before);
  expect(new URL(host.url()).searchParams.get('room')).toBe(code);

  // The guest reconnects on its own and can still act when it's their turn.
  await expect(guest.locator('.reconnecting')).toHaveCount(0, { timeout: 90_000 });
  await expect(guest.locator('.plate')).toHaveCount(3);
  await expect(guest.locator('.plate', { hasText: 'reconnecting' })).toHaveCount(0, { timeout: 90_000 });
});
