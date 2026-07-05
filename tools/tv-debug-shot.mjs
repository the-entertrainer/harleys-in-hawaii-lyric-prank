import { chromium } from 'playwright';

const BASE_URL = process.env.SMOKE_URL || 'http://127.0.0.1:5183';
const url = `${BASE_URL}/tools/tv-debug.html?debuguv=1`;

async function main(){
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('console', msg => console.log('[console]', msg.type(), msg.text()));
  page.on('pageerror', err => { errors.push(String(err)); console.error('[pageerror]', err); });
  page.on('requestfailed', req => console.log('[reqfail]', req.url(), req.failure()?.errorText));
  page.on('response', res => { if (res.url().includes('model') || res.url().includes('scene') || !res.ok()) console.log('[resp]', res.status(), res.url()); });
  await page.goto(url, { waitUntil: 'load' });
  // A bare waitForTimeout() (no CDP activity during the wait) can make this
  // sandbox's headless Chromium return a blank screenshot of WebGL canvas
  // content — polling via waitForFunction during the wait avoids it.
  await page.waitForFunction(() => window.__tvScene !== undefined, { timeout: 10000 });
  await page.waitForFunction(() => false, { timeout: 800, polling: 50 }).catch(() => {});
  await page.screenshot({ path: 'tools/.shot-tv-debug.png' });
  console.log('ERRORS:', errors.length ? errors : 'none');
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
