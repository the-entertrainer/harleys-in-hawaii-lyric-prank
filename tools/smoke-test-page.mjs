// Drives the real page (served by `npm run dev`, default http://localhost:5173)
// through headless Chromium, seeking through the song and screenshotting a
// few points to sanity-check the Theatre.js + Three.js staging end to end.
// Not part of the shipped site.
import { chromium } from 'playwright';

const BASE_URL = process.env.SMOKE_URL || 'http://127.0.0.1:5183';
const VIEWPORT = process.env.SMOKE_MOBILE
  ? { width: 390, height: 844 }
  : { width: 1400, height: 900 };

async function main(){
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); console.log('[console]', msg.type(), msg.text()); });
  page.on('pageerror', err => { errors.push(String(err)); console.error('[pageerror]', err); });

  await page.goto(BASE_URL, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'tools/.shot-initial.png' });

  await page.evaluate(() => {
    const audio = document.getElementById('track');
    audio.muted = true;
    document.getElementById('play-btn').click();
    return audio.play().then(() => { audio.currentTime = 18; });
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'tools/.shot-t18-chorus.png' });

  await page.evaluate(() => { document.getElementById('track').currentTime = 65; });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'tools/.shot-t65-verse.png' });

  await page.evaluate(() => { document.getElementById('track').currentTime = 85; });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'tools/.shot-t85-verse2.png' });

  await page.evaluate(() => { document.getElementById('track').currentTime = 150; });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'tools/.shot-t150-finale-window.png' });

  await page.evaluate(() => {
    const audio = document.getElementById('track');
    audio.currentTime = audio.duration - 0.05;
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => document.getElementById('track').dispatchEvent(new Event('ended')));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'tools/.shot-finale.png' });

  console.log('ERRORS:', errors.length ? errors : 'none');
  await browser.close();
  if (errors.length) process.exit(1);
}
main().catch(e => { console.error(e); process.exit(1); });
