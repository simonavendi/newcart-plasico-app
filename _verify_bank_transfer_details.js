const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const MEDIA = path.join(
  'C:/vibe/plasico new cart/.cursor/stores/self/media'
);
fs.mkdirSync(MEDIA, { recursive: true });

async function shot(page, name, sel) {
  const el = await page.$(sel);
  if (!el) throw new Error('missing ' + sel);
  await el.screenshot({ path: path.join(MEDIA, name) });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await page.goto('http://127.0.0.1:8780/index.html', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  // Scroll payments into view
  await page.evaluate(() => {
    const el = document.getElementById('checkout-payments');
    if (el) el.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(200);

  const initial = await page.evaluate(() => {
    const bank = document.getElementById('bank-transfer-details');
    const pay = document.querySelector('input[name=payment_id]:checked');
    const style = bank ? getComputedStyle(bank) : null;
    return {
      pay: pay ? pay.value : null,
      bankExists: !!bank,
      bankDisplay: style ? style.display : null,
      bankHiddenClass: bank ? bank.classList.contains('hide') : null,
      iban: (document.getElementById('bank-transfer-iban') || {}).textContent || '',
      beneficiary: bank
        ? (bank.querySelector('.bank-transfer-details__row dd') || {}).textContent || ''
        : '',
      text: bank ? bank.innerText.replace(/\s+/g, ' ').trim() : ''
    };
  });

  if (initial.pay !== '7') throw new Error('expected bank default, got ' + initial.pay);
  if (!initial.bankExists) throw new Error('bank panel missing');
  if (initial.bankDisplay === 'none') throw new Error('bank panel hidden on default');
  if (!initial.iban.includes('BG18UBBS')) throw new Error('iban missing: ' + initial.iban);
  if (!initial.beneficiary.includes('Пласико')) throw new Error('beneficiary: ' + initial.beneficiary);

  await shot(page, 'bank-transfer-details.png', '#checkout-payments .co-option-stack');

  // Switch to card — panel should hide
  await page.evaluate(() => {
    const r = document.querySelector('input[name=payment_id][value="2"]');
    r.checked = true;
    r.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(100);

  const afterCard = await page.evaluate(() => {
    const bank = document.getElementById('bank-transfer-details');
    return {
      display: getComputedStyle(bank).display,
      hide: bank.classList.contains('hide')
    };
  });
  if (afterCard.display !== 'none' && !afterCard.hide) {
    throw new Error('bank panel still visible after card: ' + JSON.stringify(afterCard));
  }

  // Switch back to bank
  await page.evaluate(() => {
    const r = document.querySelector('input[name=payment_id][value="7"]');
    r.checked = true;
    r.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(100);

  const afterBank = await page.evaluate(() => {
    const bank = document.getElementById('bank-transfer-details');
    return {
      display: getComputedStyle(bank).display,
      hide: bank.classList.contains('hide'),
      hasIban: !!document.getElementById('bank-transfer-iban'),
      hasBic: (bank.innerText || '').includes('UBBSBGSF'),
      hasBank: (bank.innerText || '').includes('Обединена Българска Банка'),
      hasRef: (bank.innerText || '').includes('Основание'),
      hasProforma: (bank.innerText || '').includes('проформа')
    };
  });
  if (afterBank.display === 'none' || afterBank.hide) {
    throw new Error('bank panel not shown after reselect: ' + JSON.stringify(afterBank));
  }
  if (!afterBank.hasIban || !afterBank.hasBic || !afterBank.hasBank || !afterBank.hasRef || !afterBank.hasProforma) {
    throw new Error('incomplete details: ' + JSON.stringify(afterBank));
  }

  await shot(page, 'bank-transfer-details-selected.png', '#checkout-payments');

  // Mirror check poruchka markup via fetch
  const poruchka = await page.evaluate(async () => {
    const res = await fetch('poruchka.html', { credentials: 'same-origin' });
    const html = await res.text();
    return {
      panel: html.includes('id=bank-transfer-details'),
      sync: html.includes('bank-transfer-details'),
      iban: html.includes('BG18UBBS81551064228519')
    };
  });
  if (!poruchka.panel || !poruchka.sync || !poruchka.iban) {
    throw new Error('poruchka missing bank panel: ' + JSON.stringify(poruchka));
  }

  console.log(JSON.stringify({ ok: true, initial, afterCard, afterBank, poruchka }, null, 2));
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
