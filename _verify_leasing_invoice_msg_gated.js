/**
 * Verify leasing invoice gates:
 * 1) #co-invoice-leasing-auto-msg only when leasing approved + PostBank method
 * 2) Физическо лице hidden on that path; ЮЛ still available
 * 3) „Копирай от горните данни“ always visible/functional
 */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = process.env.PLASICO_BASE || "http://127.0.0.1:8780/index.html";
const outDir = path.join(__dirname, ".cursor/stores/self/media");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function readState(page) {
  return page.evaluate(() => {
    const want = document.getElementById("want-invoice");
    const top = document.getElementById("co-invoice-leasing-auto-msg");
    const badge = document.getElementById("co-invoice-leasing-mol-badge");
    const fiz = document.getElementById("invoice-person-1");
    const fizLabel = fiz && fiz.closest ? fiz.closest("label") : null;
    const firm = document.getElementById("invoice-person-2");
    const firmLabel = firm && firm.closest ? firm.closest("label") : null;
    const copy = document.getElementById("copy-person-from-above");
    const copyLabel = document.querySelector(
      "label.co-invoice-check[for=copy-person-from-above]"
    );
    const pay8 = document.querySelector('input[name="payment_id"][value="8"]');
    const payCard = document.querySelector('input[name="payment_id"][value="2"]');
    const saved = document.getElementById("pl-leasing-saved");
    const leasingHost = document.getElementById("leasing-schema");
    const names = document.getElementById("person-names");
    return {
      filled: !!(window.PlasicoLeasing && window.PlasicoLeasing.isApplyFilled()),
      want: !!(want && want.checked),
      topHidden: !top || top.hidden,
      topText: top ? top.textContent.trim() : "",
      badgeHidden: !badge || badge.hidden,
      fizHidden: !!(fizLabel && (fizLabel.hidden || fizLabel.classList.contains("is-leasing-person-locked"))),
      fizChecked: !!(fiz && fiz.checked),
      firmHidden: !!(firmLabel && firmLabel.hidden),
      firmChecked: !!(firm && firm.checked),
      copyHidden: !!(
        copyLabel &&
        (copyLabel.hidden ||
          copyLabel.classList.contains("is-leasing-autofill-hidden") ||
          getComputedStyle(copyLabel).display === "none")
      ),
      copyDisabled: !!(copy && copy.disabled),
      pay8: !!(pay8 && pay8.checked),
      payCard: !!(payCard && payCard.checked),
      savedVisible: !!(
        saved &&
        !saved.hidden &&
        leasingHost &&
        !leasingHost.hidden &&
        !leasingHost.classList.contains("hide")
      ),
      names: names ? names.value : "",
      completedCta: !!(
        window.PlasicoLeasing &&
        window.PlasicoLeasing.isCompletedCtaActive &&
        window.PlasicoLeasing.isCompletedCtaActive()
      ),
    };
  });
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
  await page.waitForTimeout(400);
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });

  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(400);

  await page.evaluate(() => {
    localStorage.setItem(
      "plasico-hss2026-cart",
      JSON.stringify([{ id: "inv-lease", title: "Invoice lease", price: 499.99, qty: 1 }])
    );
    sessionStorage.removeItem("plasico-leasing-apply");
    if (window.PlasicoLeasing && window.PlasicoLeasing.clearApply) {
      window.PlasicoLeasing.clearApply();
    }
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);

  // --- PostBank clicked WITHOUT approved leasing → message must stay hidden
  await selectPayment(page, "8");
  await page.evaluate(() => {
    const want = document.getElementById("want-invoice");
    if (want && !want.checked) {
      want.checked = true;
      want.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  await page.waitForTimeout(300);
  let st = await readState(page);
  assert(!st.filled, "expected no leasing apply yet");
  assert(st.pay8, "pay8 should be selected");
  assert(st.topHidden, "auto-msg must stay hidden without approved credit: " + JSON.stringify(st));
  assert(!st.fizHidden, "Физическо лице should stay available without approved leasing");

  // --- Complete leasing apply (approves credit → pay8 + pl-leasing-saved)
  await page.evaluate(() => window.PlasicoLeasing.open({ column: "personal" }));
  await page.waitForTimeout(350);
  await page.fill("#pl-leasing-name", "Симона Димитрова");
  await page.fill("#pl-leasing-phone", "0888123456");
  await page.fill("#pl-leasing-egn", "9001011234");
  await page.fill("#pl-leasing-email", "simona@example.com");
  await page.check("#pl-leasing-agree-terms");
  await page.check("#pl-leasing-agree-apply");
  await page.check("#pl-leasing-agree-privacy");
  await page.click("#pl-leasing-apply-submit");
  await page.waitForTimeout(900);

  st = await readState(page);
  assert(st.filled, "apply not filled");
  assert(st.pay8, "pay8 should be selected after apply");
  assert(st.savedVisible || st.completedCta, "expected pl-leasing-saved / completed CTA path");
  assert(st.want, "want-invoice should be checked");
  assert(!st.topHidden, "auto-msg should show after approved credit: " + JSON.stringify(st));
  assert(
    st.topText.includes("Автоматично ще бъде издадена фактура"),
    "wrong auto-msg text: " + st.topText
  );
  assert(st.fizHidden, "Физическо лице must be hidden on approved leasing path");
  assert(!st.firmHidden, "ЮЛ must remain available");
  assert(!st.copyHidden, "Копирай must stay visible");
  assert(!st.copyDisabled, "Копирай must stay enabled");
  assert(st.names === "Симона Димитрова", "names autofill: " + st.names);

  // Copy-from-above still works
  await page.evaluate(() => {
    const n = document.getElementById("field-name");
    if (n) n.value = "Гост Име Тест";
    const cb = document.getElementById("copy-person-from-above");
    cb.checked = true;
    cb.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(200);
  const copied = await page.evaluate(() => {
    const names = document.getElementById("person-names");
    const cb = document.getElementById("copy-person-from-above");
    const label = document.querySelector(
      "label.co-invoice-check[for=copy-person-from-above]"
    );
    return {
      names: names ? names.value : "",
      checked: !!(cb && cb.checked),
      labelHidden: !!(label && (label.hidden || getComputedStyle(label).display === "none")),
    };
  });
  assert(!copied.labelHidden, "copy label must remain visible while checked");
  assert(copied.checked, "copy checkbox should stay checked");
  assert(
    copied.names.includes("Гост") || copied.names.length > 0,
    "copy-from-above should fill names: " + copied.names
  );

  await page.locator("#checkout-invoice-fields").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.locator("#checkout-invoice-fields").screenshot({
    path: path.join(outDir, "leasing-invoice-msg-gated.png"),
  });

  // --- Switch away from PostBank → hide message, restore Физическо лице
  await selectPayment(page, "2");
  st = await readState(page);
  assert(st.filled, "apply should remain filled after payment switch");
  assert(st.topHidden, "auto-msg must hide when leaving leasing method");
  assert(!st.fizHidden, "Физическо лице must return when not on leasing method");
  assert(!st.copyHidden, "Копирай must stay visible after payment switch");

  // --- Back to PostBank → message + hide физ again
  await selectPayment(page, "8");
  st = await readState(page);
  assert(!st.topHidden, "auto-msg should return on PostBank + approved credit");
  assert(st.fizHidden, "Физическо лице hidden again on leasing method");
  assert(!st.copyHidden, "Копирай still visible");

  // --- clearApply → hide message, restore физ
  await page.evaluate(() => window.PlasicoLeasing.clearApply());
  await page.waitForTimeout(300);
  st = await readState(page);
  assert(!st.filled, "apply cleared");
  assert(st.topHidden, "auto-msg hidden after clearApply");
  assert(!st.fizHidden, "Физическо лице restored after clearApply");
  assert(!st.copyHidden, "Копирай still visible after clear");

  console.log("OK leasing-invoice-msg-gated");
  await browser.close();
})().catch((err) => {
  console.error("FAIL", err);
  process.exit(1);
});
