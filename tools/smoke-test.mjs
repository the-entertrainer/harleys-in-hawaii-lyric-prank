import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function main(){
  const stateJson = fs.readFileSync(path.join(ROOT, 'assets', 'theatre-state.json'), 'utf8');
  const template = fs.readFileSync(path.join(__dirname, 'smoke-test.html'), 'utf8');
  const generated = template.replace('/* __STATE_INLINE__ */', stateJson);
  const generatedPath = path.join(__dirname, '.smoke-test.generated.html');
  fs.writeFileSync(generatedPath, generated);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('[page]', msg.text()));
  page.on('pageerror', err => console.error('[pageerror]', err));

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

  await page.goto(`file://${generatedPath}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__DONE__ === true || window.__ERROR__, { timeout: 30000 });
  const error = await page.evaluate(() => window.__ERROR__);
  if (error) throw new Error(error);
  const result = await page.evaluate(() => window.__RESULT__);
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
  fs.unlinkSync(generatedPath);
}
main().catch(err => { console.error(err); process.exit(1); });
