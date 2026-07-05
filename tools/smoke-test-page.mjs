// Drives the real page (served by `npm run dev`, default http://127.0.0.1:5183)
// through headless Chromium, seeking through the song and screenshotting a
// few points to sanity-check the Theatre.js poster staging end to end.
// Not part of the shipped site.
import { chromium } from 'playwright';

const BASE_URL = process.env.SMOKE_URL || 'http://127.0.0.1:5183';
const VIEWPORT = process.env.SMOKE_MOBILE
  ? { width: 390, height: 660 }
  : { width: 1400, height: 900 };

// Timestamps chosen to hit each poster mid-composition: intro banter,
// chorus (the reference scene), a mid-word moment, verse, moonlight,
// reprise, finale hold.
const SHOTS = [
  [5, 'intro'],
  [16.2, 'chorus-typing'],
  [21, 'chorus-full'],
  [38, 'love-light'],
  [65, 'dreaming'],
  [86, 'moonlight'],
  [99, 'land-of-love'],
  [117, 'reprise'],
  [150, 'finale-hold'],
];

async function main(){
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => { errors.push(String(err)); console.error('[pageerror]', err); });

  await page.goto(BASE_URL, { waitUntil: 'load' });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: 'tools/.shot-initial.png' });

  await page.evaluate(() => {
    const audio = document.getElementById('track');
    audio.muted = true;
    document.getElementById('play-btn').click();
    return audio.play();
  });

  for (const [t, name] of SHOTS){
    await page.evaluate((time) => { document.getElementById('track').currentTime = time; }, t);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `tools/.shot-t${t}-${name}.png` });
  }

  await page.evaluate(() => {
    const audio = document.getElementById('track');
    audio.currentTime = audio.duration - 0.05;
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => document.getElementById('track').dispatchEvent(new Event('ended')));
  await page.waitForTimeout(1600);
  await page.screenshot({ path: 'tools/.shot-finale-card.png' });

  console.log('ERRORS:', errors.length ? errors : 'none');
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
