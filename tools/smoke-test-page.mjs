// Drives the real page (served at http://127.0.0.1:8080 by `http-server`,
// e.g. `npm run serve`) through headless Chromium, seeking through the song
// and screenshotting a few points to sanity-check the Theatre.js-driven
// staging end to end. Not part of the shipped site.
import { chromium } from 'playwright';

async function main(){
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 500, height: 900 } });
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); console.log('[console]', msg.type(), msg.text()); });
  page.on('pageerror', err => { errors.push(String(err)); console.error('[pageerror]', err); });

  await page.route('https://esm.sh/**', async (route) => {
    const req = route.request();
    try {
      const resp = await fetch(req.url());
      const body = Buffer.from(await resp.arrayBuffer());
      const headers = {};
      resp.headers.forEach((v, k) => { if (!/^(content-encoding|content-length|transfer-encoding)$/i.test(k)) headers[k] = v; });
      await route.fulfill({ status: resp.status, headers, body });
    } catch (e) {
      console.error('[route fetch failed]', req.url(), e.message);
      await route.abort();
    }
  });
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  await page.route('https://fonts.gstatic.com/**', r => r.abort());

  await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'tools/.shot-initial.png' });

  // Force playback forward without needing real audio decoding time: seek and
  // dispatch a timeupdate-driven frame manually by setting currentTime.
  await page.evaluate(() => {
    const audio = document.getElementById('track');
    audio.muted = true;
    window.togglePlay();
    return audio.play().then(() => { audio.currentTime = 16; });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tools/.shot-t16.png' });

  await page.evaluate(() => { document.getElementById('track').currentTime = 85; });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tools/.shot-t85.png' });

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
}
main().catch(e => { console.error(e); process.exit(1); });
