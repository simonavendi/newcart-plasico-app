const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const MEDIA = path.join(__dirname, '.cursor', 'stores', 'self', 'media');
fs.mkdirSync(MEDIA, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://127.0.0.1:8780/index.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(400);

  async function shot(name, locator) {
    const el = typeof locator === 'string' ? page.locator(locator).first() : locator;
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const box = await el.boundingBox();
    const out = path.join(MEDIA, name);
    if (box) {
      await page.screenshot({
        path: out,
        clip: {
          x: Math.max(0, box.x - 8),
          y: Math.max(0, box.y - 8),
          width: Math.min(640, box.width + 24),
          height: Math.min(280, box.height + 24)
        }
      });
      console.log('SHOT', out);
    }
    return out;
  }

  const onBoxnow = await page.evaluate(() => {
    const ship = document.querySelector('input[name="ship_to_id[2]"]:checked');
    const cod = document.querySelector('input[name="payment_id"][value="1"]');
    const row = cod && cod.closest('label');
    const cs = row ? getComputedStyle(row) : null;
    return {
      ship: ship && ship.value,
      codDisabled: !!(cod && cod.disabled),
      codChecked: !!(cod && cod.checked),
      rowHidden: !!(row && (row.hidden || row.classList.contains('hide') || getComputedStyle(row).display === 'none')),
      isDisabledClass: !!(row && row.classList.contains('is-disabled')),
      opacity: cs && cs.opacity,
      cursor: cs && cs.cursor,
      pointerEvents: cs && cs.pointerEvents,
      payChecked: (document.querySelector('input[name="payment_id"]:checked') || {}).value || null
    };
  });
  console.log('ON_BOXNOW', JSON.stringify(onBoxnow, null, 2));
  await shot('boxnow-cod-disabled.png', '#checkout-payments .co-option-stack');

  // Switch to address delivery — COD should re-enable
  await page.locator('#step-ship-method .co-option-row').filter({ hasText: 'До адрес' }).click();
  await page.waitForTimeout(200);

  const onAddress = await page.evaluate(() => {
    const ship = document.querySelector('input[name="ship_to_id[2]"]:checked');
    const cod = document.querySelector('input[name="payment_id"][value="1"]');
    const row = cod && cod.closest('label');
    const cs = row ? getComputedStyle(row) : null;
    return {
      ship: ship && ship.value,
      codDisabled: !!(cod && cod.disabled),
      isDisabledClass: !!(row && row.classList.contains('is-disabled')),
      opacity: cs && cs.opacity,
      cursor: cs && cs.cursor,
      pointerEvents: cs && cs.pointerEvents
    };
  });
  console.log('ON_ADDRESS', JSON.stringify(onAddress, null, 2));
  await shot('boxnow-cod-enabled-address.png', '#checkout-payments .co-option-stack');

  // Select COD, then switch back to Box Now — must deselect + grey out
  await page.locator('label[data-payment=cod]').click();
  await page.waitForTimeout(100);
  const codSelected = await page.evaluate(() => {
    const cod = document.querySelector('input[name="payment_id"][value="1"]');
    return { checked: !!(cod && cod.checked), disabled: !!(cod && cod.disabled) };
  });
  console.log('COD_SELECTED', JSON.stringify(codSelected));

  await page.locator('#step-ship-method .co-option-row').filter({ hasText: 'Автомат' }).click();
  await page.waitForTimeout(200);

  const afterSwitch = await page.evaluate(() => {
    const ship = document.querySelector('input[name="ship_to_id[2]"]:checked');
    const cod = document.querySelector('input[name="payment_id"][value="1"]');
    const row = cod && cod.closest('label');
    const pay = document.querySelector('input[name="payment_id"]:checked');
    const cs = row ? getComputedStyle(row) : null;
    return {
      ship: ship && ship.value,
      codDisabled: !!(cod && cod.disabled),
      codChecked: !!(cod && cod.checked),
      rowHidden: !!(row && (row.hidden || row.classList.contains('hide') || getComputedStyle(row).display === 'none')),
      isDisabledClass: !!(row && row.classList.contains('is-disabled')),
      opacity: cs && Number(cs.opacity),
      payChecked: pay ? pay.value : null,
      payDisabled: pay ? !!pay.disabled : null
    };
  });
  console.log('AFTER_SWITCH_TO_BOXNOW', JSON.stringify(afterSwitch, null, 2));
  await shot('boxnow-cod-deselected.png', '#checkout-payments .co-option-stack');

  // Try clicking COD while Box Now — should stay unselected
  await page.evaluate(() => {
    const row = document.querySelector('label[data-payment=cod]');
    if (row) row.click();
  });
  await page.waitForTimeout(100);
  const clickBlocked = await page.evaluate(() => {
    const cod = document.querySelector('input[name="payment_id"][value="1"]');
    return { checked: !!(cod && cod.checked), disabled: !!(cod && cod.disabled) };
  });
  console.log('CLICK_WHILE_DISABLED', JSON.stringify(clickBlocked));

  const ok =
    onBoxnow.ship === 'boxnow' &&
    onBoxnow.codDisabled === true &&
    onBoxnow.rowHidden === false &&
    onBoxnow.isDisabledClass === true &&
    Number(onBoxnow.opacity) < 0.7 &&
    onAddress.ship === '1' &&
    onAddress.codDisabled === false &&
    onAddress.isDisabledClass === false &&
    codSelected.checked === true &&
    afterSwitch.codDisabled === true &&
    afterSwitch.codChecked === false &&
    afterSwitch.rowHidden === false &&
    /* COD cleared only — no auto-select of another payment */
    afterSwitch.payChecked !== '1' &&
    clickBlocked.checked === false;

  console.log(ok ? 'PASS' : 'FAIL');
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
