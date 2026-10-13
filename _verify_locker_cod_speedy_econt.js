/**
 * COD (наложен платеж) must be disabled only for BOX NOW locker.
 * Speedy / Еконт автомат must allow COD.
 */
const { chromium } = require("playwright");

const BASE = process.env.PLASICO_BASE || "http://127.0.0.1:8780/index.html";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function readCod(page) {
  return page.evaluate(() => {
    const ship = document.querySelector('input[name="ship_to_id[2]"]:checked');
    const lc = document.querySelector('input[name="locker_courier"]:checked');
    const cod = document.querySelector('input[name="payment_id"][value="1"]');
    const row = cod && cod.closest("label");
    return {
      ship: ship ? ship.value : null,
      locker: lc ? lc.value : null,
      disabled: !!(cod && cod.disabled),
      checked: !!(cod && cod.checked),
      isDisabledClass: !!(row && row.classList.contains("is-disabled")),
    };
  });
}

async function selectShip(page, text) {
  await page.locator("#step-ship-method .co-option-row").filter({ hasText: text }).first().click();
  await page.waitForTimeout(200);
}

async function selectLocker(page, value) {
  await page.evaluate((v) => {
    const r = document.querySelector('input[name="locker_courier"][value="' + v + '"]');
    if (!r) throw new Error("locker " + v + " missing");
    r.checked = true;
    r.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await page.waitForTimeout(250);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(400);

  await selectShip(page, "До автомат");
  await selectLocker(page, "boxnow");
  let st = await readCod(page);
  assert(st.ship === "boxnow", "ship boxnow: " + JSON.stringify(st));
  assert(st.locker === "boxnow", "locker boxnow: " + JSON.stringify(st));
  assert(st.disabled && st.isDisabledClass, "COD must be blocked on BOX NOW: " + JSON.stringify(st));

  await selectLocker(page, "speedy");
  st = await readCod(page);
  assert(st.locker === "speedy", "locker speedy: " + JSON.stringify(st));
  assert(!st.disabled && !st.isDisabledClass, "COD must be allowed on Speedy locker: " + JSON.stringify(st));

  await page.locator("label[data-payment=cod]").click();
  await page.waitForTimeout(150);
  st = await readCod(page);
  assert(st.checked && !st.disabled, "must select COD on Speedy locker: " + JSON.stringify(st));

  await selectLocker(page, "econt");
  st = await readCod(page);
  assert(st.locker === "econt", "locker econt: " + JSON.stringify(st));
  assert(!st.disabled && !st.isDisabledClass, "COD must be allowed on Econt locker: " + JSON.stringify(st));
  assert(st.checked, "COD selection should remain on Econt locker: " + JSON.stringify(st));

  await selectLocker(page, "boxnow");
  st = await readCod(page);
  assert(st.disabled && st.isDisabledClass, "COD blocked again on BOX NOW: " + JSON.stringify(st));
  assert(!st.checked, "COD must be cleared when switching to BOX NOW: " + JSON.stringify(st));

  console.log("PASS locker-cod-speedy-econt");
  await browser.close();
})().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
