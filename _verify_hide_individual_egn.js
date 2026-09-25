/**
 * Verify invoice физ лице has no ЕГН field; firm ЕИК remains; leasing EGN remains.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const MEDIA = path.join(__dirname, '.cursor/stores/self/media');
fs.mkdirSync(MEDIA, { recursive: true });

const PAGES = ['index.html', 'poruchka.html', 'boxnowno.html'];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const pageName of PAGES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    await page.goto('http://127.0.0.1:8780/' + pageName, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(300);

    const r = await page.evaluate(() => {
      const want = document.getElementById('want-invoice');
      if (want && !want.checked) {
        want.checked = true;
        want.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const p1 = document.getElementById('invoice-person-1');
      if (p1) {
        p1.checked = true;
        p1.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const indiv = document.getElementById('checkout-person-individual');
      const egn = document.getElementById('person-egn');
      const labels = indiv
        ? Array.from(indiv.querySelectorAll('label')).map((l) =>
            (l.textContent || '').trim()
          )
        : [];
      const firmIdn = document.getElementById('firm-idn');
      const leasingEgn = document.getElementById('pl-leasing-egn');
      return {
        hasPersonEgn: !!egn,
        labelsHasEgn: labels.some((t) => t === 'ЕГН' || /^ЕГН/.test(t)),
        hasFirmIdn: !!firmIdn,
        hasNames: !!document.getElementById('person-names'),
        hasAddress: !!document.getElementById('person-address'),
        indivVisible: !!(
          indiv &&
          !indiv.hidden &&
          !indiv.classList.contains('hide')
        ),
        // leasing modal field may be injected later; presence of apply form id is optional here
        hasLeasingEgnInDom: !!leasingEgn,
      };
    });

    if (r.hasPersonEgn) throw new Error(pageName + ': #person-egn still in DOM');
    if (r.labelsHasEgn) throw new Error(pageName + ': ЕГН label still under individual');
    if (!r.hasFirmIdn) throw new Error(pageName + ': firm ЕИК missing');
    if (!r.hasNames || !r.hasAddress) {
      throw new Error(pageName + ': names/address missing: ' + JSON.stringify(r));
    }

    if (pageName === 'index.html') {
      await page.locator('#checkout-person-individual').screenshot({
        path: path.join(MEDIA, 'hide-individual-egn.png'),
      });
    }

    // Confirm leasing modal still has ЕГН when opened
    const leasingOk = await page.evaluate(() => {
      if (!window.PlasicoLeasing || !window.PlasicoLeasing.open) return { opened: false };
      window.PlasicoLeasing.open({ column: 'personal' });
      const el = document.getElementById('pl-leasing-egn');
      return { opened: true, hasLeasingEgn: !!el };
    });
    if (leasingOk.opened && !leasingOk.hasLeasingEgn) {
      throw new Error(pageName + ': leasing EGN field missing');
    }

    results.push({ page: pageName, ...r, leasingOk });
    await page.close();
  }

  console.log(JSON.stringify({ ok: true, results }, null, 2));
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
