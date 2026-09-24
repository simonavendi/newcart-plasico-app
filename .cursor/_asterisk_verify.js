const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://127.0.0.1:8780/index.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const el = page.locator('#checkout #step-confirm label.conditions > .fbox').first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const box = await el.boundingBox();
  const before = await page.evaluate(() => {
    const fbox = document.querySelector('#checkout #step-confirm label.conditions > .fbox');
    const input = fbox && fbox.querySelector('input[type=checkbox]');
    const cs = getComputedStyle(fbox, '::before');
    const ir = input.getBoundingClientRect();
    const fr = fbox.getBoundingClientRect();
    return {
      content: cs.content,
      left: cs.left,
      top: cs.top,
      width: cs.width,
      textAlign: cs.textAlign,
      inputWidth: ir.width,
      inputLeft: ir.left,
      fboxLeft: fr.left
    };
  });
  console.log(JSON.stringify(before, null, 2));
  const out = 'C:/vibe/plasico new cart/.cursor/asterisk-verify.png';
  await page.screenshot({ path: out, clip: { x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 20), width: Math.min(420, box.width + 40), height: 60 } });
  console.log('SHOT', out);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
