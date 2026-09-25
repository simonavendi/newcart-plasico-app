/**
 * Simona: leasing auto-msg firm hint + hide individual fields + hide „Тип лице“.
 * - Extended #co-invoice-leasing-auto-msg text
 * - Hide #checkout-person-individual on leasing path
 * - Hide #invoice-person-type-label on leasing path
 * - Keep ЮЛ + firm panel + МОЛ; restore on clear / leave method
 */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = process.env.PLASICO_BASE || "http://127.0.0.1:8780/index.html";
const outDir = path.join(__dirname, ".cursor/stores/self/media");
const OUT = path.join(outDir, "leasing-auto-msg-firm-hint.png");
const OUT_FIRM = path.join(outDir, "leasing-auto-msg-firm-hint-yul.png");

const FIRM_HINT = "ако вместо това желаете фактура на фирма изберете опцията по-долу";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function panelHidden(el) {
  if (!el) return true;
  if (el.hidden) return true;
  if (el.classList.contains("hide") || el.classList.contains("sf-hidden")) return true;
  const cs = getComputedStyle(el);
  return cs.display === "none" || cs.visibility === "hidden";
}

async function readState(page) {
  return page.evaluate((hint) => {
    function panelHidden(el) {
      if (!el) return true;
      if (el.hidden) return true;
      if (el.classList.contains("hide") || el.classList.contains("sf-hidden")) return true;
      const cs = getComputedStyle(el);
      return cs.display === "none" || cs.visibility === "hidden";
    }
    const top = document.getElementById("co-invoice-leasing-auto-msg");
    const badge = document.getElementById("co-invoice-leasing-mol-badge");
    const typeLabel = document.getElementById("invoice-person-type-label");
    const indiv = document.getElementById("checkout-person-individual");
    const firms = document.getElementById("checkout-firms");
    const fiz = document.getElementById("invoice-person-1");
    const fizLabel = fiz && fiz.closest ? fiz.closest("label") : null;
    const firm = document.getElementById("invoice-person-2");
    const firmLabel = firm && firm.closest ? firm.closest("label") : null;
    const pay8 = document.querySelector('input[name="payment_id"][value="8"]');
    return {
      filled: !!(window.PlasicoLeasing && window.PlasicoLeasing.isApplyFilled()),
      pay8: !!(pay8 && pay8.checked),
      topHidden: !top || top.hidden,
      topText: top ? top.textContent.trim() : "",
      hasHint: !!(top && top.textContent.includes(hint)),
      badgeHidden: !badge || badge.hidden,
      typeLabelHidden: !!(typeLabel && typeLabel.hidden),
      indivHidden: panelHidden(indiv),
      firmsHidden: panelHidden(firms),
      fizHidden: !!(fizLabel && fizLabel.hidden),
      firmHidden: !!(firmLabel && firmLabel.hidden),
      fizChecked: !!(fiz && fiz.checked),
      firmChecked: !!(firm && firm.checked),
    };
  }, FIRM_HINT);
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
  await page.evaluate(() => {
    localStorage.setItem(
      "plasico-hss2026-cart",
      JSON.stringify([{ id: "lease-hint", title: "Lease hint", price: 499.99, qty: 1 }])
    );
    sessionStorage.removeItem("plasico-leasing-apply");
    if (window.PlasicoLeasing && window.PlasicoLeasing.clearApply) {
      window.PlasicoLeasing.clearApply();
    }
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);

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

  let st = await readState(page);
  assert(st.filled && st.pay8, "leasing path not active: " + JSON.stringify(st));
  assert(!st.topHidden, "auto-msg should show");
  assert(st.hasHint, "firm hint missing: " + st.topText);
  assert(
    st.topText.includes("Автоматично ще бъде издадена фактура на физическото лице при кредит."),
    "base auto-msg missing: " + st.topText
  );
  assert(st.indivHidden, "individual panel must be hidden on leasing path");
  assert(st.typeLabelHidden, "Тип лице label must be hidden on leasing path");
  assert(st.fizHidden, "Физическо лице option must be hidden");
  assert(!st.firmHidden, "ЮЛ must remain available");
  assert(st.fizChecked, "auto физ radio should stay selected");
  assert(st.firmsHidden, "firm panel should stay hidden on физ path");
  assert(st.badgeHidden, "МОЛ badge hidden on физ");

  await page.locator("#checkout-invoice-fields").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.locator("#checkout-invoice-fields").screenshot({ path: OUT });

  // ЮЛ still works
  await page.evaluate(() => {
    const r = document.getElementById("invoice-person-2");
    r.checked = true;
    const group = document.querySelectorAll('input[name="invoice_person_type"]');
    for (let i = 0; i < group.length; i++) {
      const lb = group[i].closest("label");
      if (lb) lb.classList.toggle("clicked", group[i].checked);
    }
    r.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(400);

  st = await readState(page);
  assert(st.firmChecked, "ЮЛ not selected");
  assert(st.indivHidden, "individual stays hidden on ЮЛ");
  assert(st.typeLabelHidden, "Тип лице stays hidden on ЮЛ leasing path");
  assert(!st.firmsHidden, "firm panel should show");
  assert(!st.badgeHidden, "МОЛ badge should show");
  assert(st.topHidden, "auto-msg hidden on ЮЛ");

  await page.locator("#checkout-invoice-fields").scrollIntoViewIfNeeded();
  await page.locator("#checkout-invoice-fields").screenshot({ path: OUT_FIRM });

  // Return to auto физ, then leave leasing method → restore
  await page.evaluate(() => {
    const r = document.getElementById("invoice-person-1");
    r.checked = true;
    const group = document.querySelectorAll('input[name="invoice_person_type"]');
    for (let i = 0; i < group.length; i++) {
      const lb = group[i].closest("label");
      if (lb) lb.classList.toggle("clicked", group[i].checked);
    }
    r.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(300);

  await selectPayment(page, "2");
  st = await readState(page);
  assert(st.topHidden, "auto-msg hides off leasing method");
  assert(!st.typeLabelHidden, "Тип лице restored off leasing method");
  assert(!st.fizHidden, "Физическо лице restored");

  // Back to leasing → hide again
  await selectPayment(page, "8");
  st = await readState(page);
  assert(!st.topHidden && st.hasHint, "auto-msg + hint return");
  assert(st.indivHidden, "individual hidden again");
  assert(st.typeLabelHidden, "Тип лице hidden again");

  await page.evaluate(() => window.PlasicoLeasing.clearApply());
  await page.waitForTimeout(300);
  st = await readState(page);
  assert(st.topHidden, "auto-msg hidden after clear");
  assert(!st.typeLabelHidden, "Тип лице restored after clear");
  assert(!st.fizHidden, "Физическо лице restored after clear");

  console.log("OK leasing-auto-msg-firm-hint");
  console.log("shot", OUT);
  await browser.close();
})().catch((err) => {
  console.error("FAIL", err);
  process.exit(1);
});
