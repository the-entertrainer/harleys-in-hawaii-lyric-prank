/**
 * Screenshots the real page in headless Chromium at a set of timestamps —
 * one mid-song moment per letter page (mid-word, so ink fill states are
 * visible), plus the sealed cover.
 *
 * Deterministic by construction: the audio stays PAUSED and every shot
 * seeks with window.__seek(t) (word/page state is a pure function of t),
 * with CSS transitions/animations disabled — wall-clock time can't skew a
 * shot. (An earlier version let the track play between shots and waited
 * on a CDP poll; in this sandbox that poll can take ~30s, so every shot
 * landed half a minute late.) Set SMOKE_DRIPS=1 to instead let each shot
 * play in real time for ~2.5s first so ink drips are visible.
 *
 * Usage: SMOKE_URL=http://localhost:5173 [SMOKE_MOBILE=1] [SMOKE_DRIPS=1] node tools/smoke-test-page.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = process.env.SMOKE_URL || 'http://localhost:5173';
const MOBILE = !!process.env.SMOKE_MOBILE;
const DRIPS = !!process.env.SMOKE_DRIPS;
const OUT = new globalThis.URL('./screens/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

// t=-1 means "before the seal is pressed"
const SHOTS = [
  ['cover', -1],
  ['salutation', 6.5],
  ['chorus-a-mid', 20.2],
  ['chorus-a-late', 29.5],
  ['love-light', 38.5],
  ['chorus-b', 48.0],
  ['dreaming', 72.0],
  ['moonlight', 86.0],
  ['land-of-love', 103.0],
  ['reprise', 118.6],
  ['love-light-2', 138.0],
  ['finale', 149.0],
  ['closing', 172.0],
  ['whisper-outro', 179.0],
];

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({
  viewport: MOBILE ? { width: 390, height: 844 } : { width: 1280, height: 800 },
  deviceScaleFactor: MOBILE ? 2 : 1,
});
page.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });
page.on('pageerror', e => console.error('[pageerror]', e.message));

await page.goto(URL);
await page.waitForFunction(() => window.__fontsLoaded === true, { timeout: 15000 });

let opened = false;
for (const [name, t] of SHOTS){
  const started = Date.now();
  if (t >= 0){
    if (!opened){
      // force: the seal has an infinite breathe animation, so Playwright's
      // "element is stable" actionability check would wait forever
      await page.click('#seal', { force: true });
      await page.evaluate(() => document.getElementById('track').pause());
      if (!DRIPS){
        await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
      }
      opened = true;
    }
    await page.evaluate((tt) => window.__seek(tt), t);
    if (DRIPS){
      await page.evaluate(() => document.getElementById('track').play());
      await page.waitForTimeout(2500);
      await page.evaluate(() => document.getElementById('track').pause());
    }
  }
  const ct = t >= 0 ? await page.evaluate(() => document.getElementById('track').currentTime) : -1;
  const file = `${OUT}${MOBILE ? 'm-' : ''}${DRIPS ? 'd-' : ''}${name}.png`;
  await page.screenshot({ path: file });
  console.log(`shot ${name} requested=${t} actual=${ct.toFixed ? ct.toFixed(1) : ct} took=${Date.now() - started}ms`);
}

await browser.close();
