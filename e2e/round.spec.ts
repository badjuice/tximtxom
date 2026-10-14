import { type Page, expect, test } from '@playwright/test';

// Keep the headless browsers light: no animations.
const LIGHT = JSON.stringify({ reducedMotion: true, backgroundAnim: false, crt: false, muted: true });

async function open(page: Page) {
  await page.addInitScript((s) => localStorage.setItem('tximtxom.settings', s), LIGHT);
  page.setDefaultTimeout(60_000);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Create room');
}

const bar = (page: Page, label: string) => page.locator(`.action-bar button:has-text("${label}"):not([disabled])`);

/** One step of a simple strategy: draw; end the round when allowed, else throw the drawn card away; pass on rides; reveal nothing. */
async function step(page: Page): Promise<'done' | 'acted' | 'idle'> {
  if ((await bar(page, 'Next round').count()) || (await page.locator('text=Back to lobby').count()) || (await page.locator('.gameover').count())) return 'done';
  for (const label of ['Pass', 'Done', 'Draw', 'End with', 'Confirm End', 'Discard', 'End Turn']) {
    const b = bar(page, label).first();
    if (await b.count()) {
      await b.click({ timeout: 3000 }).catch(() => {});
      return 'acted';
    }
  }
  return 'idle';
}

test('two players create, join and finish a round', async ({ browser }) => {
  const host = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const guest = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  await open(host);
  await open(guest);

  await host.fill('input[autocomplete=nickname]', 'Host');
  await host.click('text=Create room');
  const code = (await host.locator('.room-code').textContent())!.trim();
  expect(code).toMatch(/^[A-Z]{4}$/);

  await guest.fill('input[autocomplete=nickname]', 'Guest');
  await guest.fill('.code-field input', code);
  await guest.click('button:has-text("Join")');
  await expect(host.locator('.player-list li')).toHaveCount(2);
  await expect(guest.locator('text=Waiting for the host')).toBeVisible();

  await host.click('text=Start game');
  await expect(host.locator('.plate')).toHaveCount(2);
  await expect(guest.locator('.plate')).toHaveCount(2);

  // Both sides play until the round is scored (someone ends it, or the deck runs out).
  const deadline = Date.now() + 240_000;
  const finished = new Set<Page>();
  while (finished.size < 2 && Date.now() < deadline) {
    for (const p of [host, guest]) {
      if (finished.has(p)) continue;
      if ((await step(p)) === 'done') finished.add(p);
    }
    await host.waitForTimeout(200);
  }
  expect(finished.size).toBe(2);
  // Scores are visible on both screens.
  await expect(host.locator('.summary')).toBeVisible();
  await expect(guest.locator('.summary')).toBeVisible();
});
