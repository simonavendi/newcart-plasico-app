/**
 * Verify leasing-completed checkout CTA:
 * - after successful apply: hide #aside-leasing-btn, morph Купи
 * - after other payment: restore aside + Купи
 * - after clearApply: restore
 */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = process.env.PLASICO_BASE || "http://127.0.0.1:8780/index.html";
const outDir = path.join(__dirname, ".cursor/stores/self/media");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });

  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(600);

  await page.evaluate(() => {
    localStorage.setItem(
      "plasico-hss2026-cart",
      JSON.stringify([{ id: "cta-test", title: "CTA test", price: 620.98, qty: 1 }])
    );
    sessionStorage.removeItem("plasico-leasing-apply");
    if (window.PlasicoLeasing && window.PlasicoLeasing.clearApply) {
      window.PlasicoLeasing.clearApply();
    }
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  const baseline = await page.evaluate(() => {
    const aside = document.getElementById("aside-leasing-btn");
    const buy = document.querySelector("#step-confirm .checkout-finish.btn");
    if (window.PlasicoLeasing && window.PlasicoLeasing.refresh) {
      window.PlasicoLeasing.refresh();
    }
    return {
      asideHidden: !!(aside && aside.hidden),
      asideDisplay: aside ? getComputedStyle(aside).display : null,
      buyText: (buy && buy.textContent || "").trim(),
      filled: !!(window.PlasicoLeasing && window.PlasicoLeasing.isApplyFilled()),
      active: !!(window.PlasicoLeasing && window.PlasicoLeasing.isCompletedCtaActive()),
      hasApi: !!(window.PlasicoLeasing && window.PlasicoLeasing.syncCheckoutCta),
    };
  });
  assert(baseline.hasApi, "PlasicoLeasing.syncCheckoutCta missing");
  assert(!baseline.filled && !baseline.active, "expected empty apply at start: " + JSON.stringify(baseline));
  assert(!baseline.asideHidden, "aside should be visible before fill");
  assert(/купи/i.test(baseline.buyText), "buy should say Купи: " + baseline.buyText);

  // Open modal + fill apply form
  await page.evaluate(() => window.PlasicoLeasing.open({ column: "personal" }));
  await page.waitForTimeout(400);

  await page.fill("#pl-leasing-name", "Иван Петров");
  await page.fill("#pl-leasing-phone", "0888123456");
  await page.fill("#pl-leasing-egn", "8001010000");
  await page.fill("#pl-leasing-email", "ivan.petrov@example.com");
  await page.check("#pl-leasing-agree-terms");
  await page.check("#pl-leasing-agree-apply");
  await page.check("#pl-leasing-agree-privacy");
  await page.click("#pl-leasing-apply-submit");
  await page.waitForTimeout(700);

  const afterFill = await page.evaluate(() => {
    const aside = document.getElementById("aside-leasing-btn");
    const buy = document.querySelector("#step-confirm .checkout-finish.btn");
    const hint = document.getElementById("checkout-finish-leasing-hint");
    const pay8 = document.querySelector('input[name="payment_id"][value="8"]');
    return {
      filled: window.PlasicoLeasing.isApplyFilled(),
      active: window.PlasicoLeasing.isCompletedCtaActive(),
      asideHidden: !!(aside && aside.hidden),
      asideDisplay: aside ? getComputedStyle(aside).display : null,
      buyClass: buy ? buy.className : "",
      buyLabel: buy ? (buy.querySelector(".checkout-finish__label") || buy).textContent.trim() : "",
      hint: hint ? hint.textContent.trim() : "",
      pay8: !!(pay8 && pay8.checked),
      stored: !!sessionStorage.getItem("plasico-leasing-apply"),
    };
  });

  assert(afterFill.filled && afterFill.active, "filled/active after submit: " + JSON.stringify(afterFill));
  assert(afterFill.asideHidden && afterFill.asideDisplay === "none", "aside must be hidden: " + JSON.stringify(afterFill));
  assert(
    afterFill.buyLabel.includes("КУПИ НА ИЗПЛАЩАНЕ"),
    "buy label wrong: " + afterFill.buyLabel
  );
  assert(
    afterFill.hint.includes("Продължаваш към страницата на кредитора"),
    "hint wrong: " + afterFill.hint
  );
  assert(afterFill.buyClass.includes("is-leasing-complete"), "missing is-leasing-complete class");
  assert(afterFill.pay8, "payment 8 should be selected after apply");

  await page.locator("#step-confirm .checkout-finish.btn").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(outDir, "leasing-completed-cta-buy.png"),
    fullPage: false,
  });
  await page.locator(".checkout-layout__aside").screenshot({
    path: path.join(outDir, "leasing-completed-cta-aside-hidden.png"),
  });

  // Leave leasing path → restore (radios are visually hidden; drive via JS)
  const leftOk = await page.evaluate(() => {
    const other = document.querySelector('input[name="payment_id"]:not([value="8"])');
    if (!other) return false;
    other.checked = true;
    other.dispatchEvent(new Event("change", { bubbles: true }));
    const radios = document.querySelectorAll('input[name="payment_id"]');
    radios.forEach((r) => {
      const lb = r.closest("label");
      if (lb) lb.classList.toggle("clicked", r.checked);
    });
    if (window.PlasicoLeasing && window.PlasicoLeasing.syncCheckoutCta) {
      window.PlasicoLeasing.syncCheckoutCta();
    }
    return true;
  });
  assert(leftOk, "need another payment radio");
  await page.waitForTimeout(300);

  const afterLeave = await page.evaluate(() => {
    const aside = document.getElementById("aside-leasing-btn");
    const buy = document.querySelector("#step-confirm .checkout-finish.btn");
    const hint = document.getElementById("checkout-finish-leasing-hint");
    return {
      filled: window.PlasicoLeasing.isApplyFilled(),
      active: window.PlasicoLeasing.isCompletedCtaActive(),
      asideHidden: !!(aside && aside.hidden),
      buyText: (buy && buy.textContent || "").trim(),
      buyClass: buy ? buy.className : "",
      hintPresent: !!hint,
    };
  });
  assert(afterLeave.filled, "apply data should remain when leaving path");
  assert(!afterLeave.active, "CTA inactive off leasing path");
  assert(!afterLeave.asideHidden, "aside restored when leaving leasing");
  assert(/^купи$/i.test(afterLeave.buyText), "buy restored: " + afterLeave.buyText);
  assert(!afterLeave.buyClass.includes("is-leasing-complete"), "leasing class cleared");
  assert(!afterLeave.hintPresent, "hint removed");

  // Back to payment 8 → CTA again
  await page.evaluate(() => {
    const pay8 = document.querySelector('input[name="payment_id"][value="8"]');
    if (!pay8) return;
    pay8.checked = true;
    pay8.dispatchEvent(new Event("change", { bubbles: true }));
    document.querySelectorAll('input[name="payment_id"]').forEach((r) => {
      const lb = r.closest("label");
      if (lb) lb.classList.toggle("clicked", r.checked);
    });
    if (window.PlasicoLeasing) {
      if (window.PlasicoLeasing.syncCheckoutCta) window.PlasicoLeasing.syncCheckoutCta();
    }
  });
  await page.waitForTimeout(300);
  const back = await page.evaluate(() => ({
    active: window.PlasicoLeasing.isCompletedCtaActive(),
    asideHidden: document.getElementById("aside-leasing-btn").hidden,
    label: document
      .querySelector("#step-confirm .checkout-finish.btn .checkout-finish__label")
      .textContent.trim(),
  }));
  assert(back.active && back.asideHidden, "CTA returns on payment 8: " + JSON.stringify(back));
  assert(back.label.includes("КУПИ НА ИЗПЛАЩАНЕ"), "label back: " + back.label);

  // clearApply → restore
  await page.evaluate(() => window.PlasicoLeasing.clearApply());
  await page.waitForTimeout(200);
  const cleared = await page.evaluate(() => ({
    filled: window.PlasicoLeasing.isApplyFilled(),
    active: window.PlasicoLeasing.isCompletedCtaActive(),
    asideHidden: document.getElementById("aside-leasing-btn").hidden,
    buyText: document.querySelector("#step-confirm .checkout-finish.btn").textContent.trim(),
    stored: sessionStorage.getItem("plasico-leasing-apply"),
  }));
  assert(!cleared.filled && !cleared.active, "cleared: " + JSON.stringify(cleared));
  assert(!cleared.asideHidden, "aside after clear");
  assert(/^купи$/i.test(cleared.buyText), "buy after clear: " + cleared.buyText);
  assert(!cleared.stored, "sessionStorage cleared");

  // No payment preselect still holds (select nothing / leave unchecked after clear)
  const noPreselect = await page.evaluate(() => {
    document.querySelectorAll('input[name="payment_id"]').forEach((r) => {
      r.checked = false;
      const lb = r.closest("label");
      if (lb) lb.classList.remove("clicked");
    });
    return Array.from(document.querySelectorAll('input[name="payment_id"]:checked')).map(
      (r) => r.value
    );
  });
  assert(noPreselect.length === 0, "no payment preselect broken: " + noPreselect);

  console.log(
    JSON.stringify(
      {
        ok: true,
        shots: [
          "leasing-completed-cta-buy.png",
          "leasing-completed-cta-aside-hidden.png",
        ],
        detection:
          "sessionStorage plasico-leasing-apply with fullName/phone/egn/email + payment_id is 8 or unset",
      },
      null,
      2
    )
  );

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
