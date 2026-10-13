/**
 * When payment_id=8 (изплащане) is selected:
 * - want-invoice is checked
 * - label has is-invoice-locked
 * - click cannot uncheck
 * Leaving payment 8 unlocks the checkbox.
 */
const { chromium } = require("playwright");

const BASE = process.env.PLASICO_BASE || "http://127.0.0.1:8780/index.html";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function selectPayment(page, value) {
  await page.evaluate((v) => {
    const r = document.querySelector('input[name="payment_id"][value="' + v + '"]');
    if (!r) throw new Error("payment " + v + " missing");
    r.checked = true;
    const radios = document.querySelectorAll('input[name="payment_id"]');
    for (let i = 0; i < radios.length; i++) {
      const lb = radios[i].closest("label");
      if (lb) lb.classList.toggle("clicked", radios[i].checked);
    }
    r.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await page.waitForTimeout(300);
}

async function readInvoice(page) {
  return page.evaluate(() => {
    const want = document.getElementById("want-invoice");
    const label = document.querySelector("label.co-invoice-check[for=want-invoice]");
    const inv = document.getElementById("checkout-invoice-fields");
    const top = document.getElementById("co-invoice-leasing-auto-msg");
    const locked =
      !!(want && want.getAttribute("data-invoice-locked") === "1") &&
      !!(label && label.classList.contains("is-invoice-locked"));
    return {
      checked: !!(want && want.checked),
      locked,
      fieldsVisible: !!(
        inv &&
        !inv.hidden &&
        !inv.classList.contains("hide") &&
        !inv.classList.contains("sf-hidden")
      ),
      topVisible: !!(top && !top.hidden),
      topText: top ? top.textContent.trim() : "",
    };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    localStorage.setItem(
      "plasico-hss2026-cart",
      JSON.stringify([{ id: "inv-lock", title: "Lock test", price: 199, qty: 1 }])
    );
    sessionStorage.removeItem("plasico-leasing-apply");
    if (window.PlasicoLeasing && window.PlasicoLeasing.clearApply) {
      window.PlasicoLeasing.clearApply();
    }
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);

  assert(
    await page.evaluate(
      () => !!(window.PlasicoLeasing && window.PlasicoLeasing.syncWantInvoiceLockForInstallment)
    ),
    "syncWantInvoiceLockForInstallment missing"
  );

  let st = await readInvoice(page);
  assert(!st.locked, "should start unlocked: " + JSON.stringify(st));

  await selectPayment(page, "8");
  st = await readInvoice(page);
  assert(st.checked, "want-invoice must be checked on installment: " + JSON.stringify(st));
  assert(st.locked, "want-invoice must be locked on installment: " + JSON.stringify(st));
  assert(st.fieldsVisible, "invoice fields must show: " + JSON.stringify(st));
  assert(st.topVisible, "green auto-msg must show on installment: " + JSON.stringify(st));
  assert(
    st.topText.includes("Автоматично ще бъде издадена фактура"),
    "wrong green auto-msg: " + st.topText
  );

  await page.locator("label.co-invoice-check[for=want-invoice]").click({ force: true });
  await page.waitForTimeout(200);
  st = await readInvoice(page);
  assert(st.checked, "click must not uncheck: " + JSON.stringify(st));
  assert(st.locked, "must stay locked after click: " + JSON.stringify(st));

  await page.evaluate(() => {
    const want = document.getElementById("want-invoice");
    want.checked = false;
    want.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(200);
  st = await readInvoice(page);
  assert(st.checked, "programmatic uncheck must be reversed: " + JSON.stringify(st));

  await selectPayment(page, "2");
  st = await readInvoice(page);
  assert(!st.locked, "must unlock after leaving installment: " + JSON.stringify(st));
  assert(st.checked, "may stay checked after unlock: " + JSON.stringify(st));
  assert(!st.topVisible, "green auto-msg must hide after leaving installment: " + JSON.stringify(st));

  await page.locator("label.co-invoice-check[for=want-invoice]").click();
  await page.waitForTimeout(200);
  st = await readInvoice(page);
  assert(!st.checked, "after unlock, uncheck must work: " + JSON.stringify(st));

  console.log(JSON.stringify({ ok: true }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
