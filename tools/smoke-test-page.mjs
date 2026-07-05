// Drives the real page (served by `npm run dev`, default http://127.0.0.1:5183)
// through headless Chromium, seeking through the song and screenshotting a
// few points to sanity-check the TV broadcast staging end to end.
// Not part of the shipped site.
import { chromium } from 'playwright';

const BASE_URL = process.env.SMOKE_URL || 'http://127.0.0.1:5183';
const VIEWPORT = process.env.SMOKE_MOBILE
  ? { width: 390, height: 660 }
  : { width: 1400, height: 900 };

// Timestamps chosen to hit each broadcast card mid-composition: intro
// banter, chorus (the reference scene), a mid-word moment, verse,
// moonlight, reprise, finale hold.
const SHOTS = [
  [5, 'intro'],
  [16.2, 'chorus-typing'],
  [21, 'chorus-full'],
  [38, 'love-light'],
  [47, 'chorus-b'],
  [65, 'dreaming'],
  [86, 'moonlight'],
  [99, 'land-of-love'],
  [117, 'reprise'],
  [150, 'finale-hold'],
];

// This sandbox's headless Chromium can silently screenshot a blank frame
// of real, correctly-rendering WebGL canvas content if the only wait
// beforehand is a bare timeout (see CLAUDE.md Update 3) — interleaving a
// throwaway CDP poll after the timeout reliably avoids it.
async function settle(page, ms){
  await page.waitForTimeout(ms);
  await page.waitForFunction(() => false, { timeout: 400, polling: 50 }).catch(() => {});
}

async function main(){
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: process.env.SMOKE_MOBILE ? 3 : 2 });
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => { errors.push(String(err)); console.error('[pageerror]', err); });

  await page.goto(BASE_URL, { waitUntil: 'load' });
  await settle(page, 1400);
  await page.screenshot({ path: 'tools/.shot-initial.png' });

  // Click play once to start the render loop (which redraws from
  // audio.currentTime every frame regardless of play state — see
  // src/main.js's frame()), then immediately pause: this sandbox can be
  // heavily loaded enough that real wall-clock time between steps varies a
  // lot, and with audio left playing that let currentTime drift tens of
  // seconds past each intended seek target by the time of the screenshot.
  // Paused, currentTime only moves when we explicitly set it.
  await page.evaluate(() => {
    const audio = document.getElementById('track');
    audio.muted = true;
    document.getElementById('play-btn').click();
    return audio.play().then(() => audio.pause());
  });

  for (const [t, name] of SHOTS){
    await page.evaluate((time) => { document.getElementById('track').currentTime = time; }, t);
    await settle(page, 200);
    const actual = await page.evaluate(() => document.getElementById('track').currentTime);
    console.log(`shot ${name}: target=${t} actual=${actual.toFixed(2)}`);
    await page.screenshot({ path: `tools/.shot-t${t}-${name}.png` });
  }

  await page.evaluate(() => {
    const audio = document.getElementById('track');
    audio.currentTime = audio.duration - 0.05;
  });
  await settle(page, 400);
  await page.evaluate(() => document.getElementById('track').dispatchEvent(new Event('ended')));
  await settle(page, 1600);
  await page.screenshot({ path: 'tools/.shot-finale-card.png' });

  console.log('ERRORS:', errors.length ? errors : 'none');
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
