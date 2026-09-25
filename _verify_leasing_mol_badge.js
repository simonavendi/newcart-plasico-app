/**
 * Verify leasing ЮЛ → firm fields + red МОЛ badge (click path).
 * Also keeps green auto-msg + физ hidden + copy-from-above intact.
 */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = process.env.PLASICO_BASE || "http://127.0.0.1:8780/index.html";
const outDir = path.join(__dirname, ".cursor/stores/self/media");
const OUT = path.join(outDir, "leasing-mol-badge-visible.png");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function panelVisible(el) {
  if (!el) return false;
  if (el.hidden) return false;
  if (el.classList.contains("hide") || el.classList.contains("sf-hidden")) return false;
  const cs = getComputedStyle(el);
  return cs.display !== "none" && cs.visibility !== "hidden";
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });

  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.evaluate(() => {
    localStorage.setItem(
      "plasico-hss2026-cart",
      JSON.stringify([{ id: "mol-badge", title: "MOL badge", price: 499.99, qty: 1 }])
    );
    sessionStorage.removeItem("plasico-leasing-apply");
    if (window.PlasicoLeasing && window.PlasicoLeasing.clearApply) {
      window.PlasicoLeasing.clearApply();
    }
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);

  // Complete leasing apply
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

  const afterApply = await page.evaluate(() => {
    const top = document.getElementById("co-invoice-leasing-auto-msg");
    const badge = document.getElementById("co-invoice-leasing-mol-badge");
    const p1 = document.getElementById("invoice-person-1");
    const fizLabel = p1 && p1.closest("label");
    const pay8 = document.querySelector('input[name="payment_id"][value="8"]');
    const copy = document.getElementById("copy-person-from-above");
    const copyLabel = document.querySelector(
      "label.co-invoice-check[for=copy-person-from-above]"
    );
    return {
      filled: window.PlasicoLeasing.isApplyFilled(),
      pay8: !!(pay8 && pay8.checked),
      topHidden: !top || top.hidden,
      topText: top ? top.textContent.trim() : "",
      badgeHidden: !badge || badge.hidden,
      fizHidden: !!(fizLabel && fizLabel.hidden),
      copyLabelVisible: !!(
        copyLabel &&
        !copyLabel.hidden &&
        getComputedStyle(copyLabel).display !== "none"
      ),
      copyDisabled: !!(copy && copy.disabled),
      p1: !!(p1 && p1.checked),
    };
  });

  assert(afterApply.filled, "leasing apply not filled");
  assert(afterApply.pay8, "PostBank payment not selected");
  assert(!afterApply.topHidden, "green auto-msg should show after apply");
  assert(
    afterApply.topText.includes("Автоматично ще бъде издадена фактура"),
    "wrong green msg: " + afterApply.topText
  );
  assert(afterApply.badgeHidden, "badge must stay hidden on физ path");
  assert(afterApply.fizHidden, "Физическо лице toggle must be hidden");
  assert(afterApply.copyLabelVisible, "Копирай must stay visible on indiv panel");
  assert(!afterApply.copyDisabled, "Копирай must stay enabled");
  assert(afterApply.p1, "auto физ radio should be selected after apply");

  // Real user click on ЮЛ label (the bug path)
  await page.locator("#checkout-invoice-fields").scrollIntoViewIfNeeded();
  await page.getByText("Юридическо лице (фирма)").click();
  await page.waitForTimeout(500);

  const afterYul = await page.evaluate(() => {
    const vis = (el) => {
      if (!el) return false;
      if (el.hidden) return false;
      if (el.classList.contains("hide") || el.classList.contains("sf-hidden")) return false;
      const cs = getComputedStyle(el);
      return cs.display !== "none" && cs.visibility !== "hidden";
    };
    const p2 = document.getElementById("invoice-person-2");
    const firms = document.getElementById("checkout-firms");
    const indiv = document.getElementById("checkout-person-individual");
    const badge = document.getElementById("co-invoice-leasing-mol-badge");
    const top = document.getElementById("co-invoice-leasing-auto-msg");
    const mol = document.getElementById("firm-mol");
    const firmName = document.getElementById("firm-name");
    const firmIdn = document.getElementById("firm-idn");
    return {
      p2: !!(p2 && p2.checked),
      firmsVisible: vis(firms),
      indivVisible: vis(indiv),
      badgeVisible: vis(badge) && badge && !badge.hidden,
      badgeText: badge ? badge.textContent.trim() : "",
      topHidden: !top || top.hidden,
      mol: mol ? mol.value : "",
      hasFirmName: !!firmName,
      hasFirmIdn: !!firmIdn,
    };
  });

  assert(afterYul.p2, "ЮЛ radio not selected after click: " + JSON.stringify(afterYul));
  assert(afterYul.firmsVisible, "firm panel must be visible: " + JSON.stringify(afterYul));
  assert(!afterYul.indivVisible, "individual panel must hide on ЮЛ: " + JSON.stringify(afterYul));
  assert(afterYul.hasFirmName && afterYul.hasFirmIdn, "firm fields missing");
  assert(
    afterYul.badgeText.includes("потребителят на кредита да е МОЛ"),
    "badge text wrong: " + afterYul.badgeText
  );
  assert(afterYul.badgeVisible, "red МОЛ badge must be visible");
  assert(afterYul.topHidden, "green auto-msg must hide on ЮЛ");
  assert(afterYul.mol === "Симона Димитрова", "МОЛ not prefilled: " + afterYul.mol);

  await page.locator("#checkout-invoice-fields").screenshot({ path: OUT });

  // Re-click ЮЛ → back to auto физ (green msg, indiv panel)
  await page.getByText("Юридическо лице (фирма)").click();
  await page.waitForTimeout(400);
  const afterReclick = await page.evaluate(() => {
    const vis = (el) => {
      if (!el) return false;
      if (el.hidden) return false;
      if (el.classList.contains("hide") || el.classList.contains("sf-hidden")) return false;
      const cs = getComputedStyle(el);
      return cs.display !== "none" && cs.visibility !== "hidden";
    };
    const p1 = document.getElementById("invoice-person-1");
    const indiv = document.getElementById("checkout-person-individual");
    const firms = document.getElementById("checkout-firms");
    const top = document.getElementById("co-invoice-leasing-auto-msg");
    const badge = document.getElementById("co-invoice-leasing-mol-badge");
    return {
      p1: !!(p1 && p1.checked),
      indivVisible: vis(indiv),
      firmsVisible: vis(firms),
      topHidden: !top || top.hidden,
      badgeHidden: !badge || badge.hidden,
    };
  });
  assert(afterReclick.p1, "re-click ЮЛ should return to физ");
  assert(afterReclick.indivVisible, "indiv panel should return");
  assert(!afterReclick.firmsVisible, "firms should hide on физ");
  assert(!afterReclick.topHidden, "green msg should return");
  assert(afterReclick.badgeHidden, "badge should hide on физ");

  console.log(
    JSON.stringify(
      { ok: true, afterApply, afterYul, afterReclick, shot: OUT },
      null,
      2
    )
  );
  await browser.close();
})().catch((err) => {
  console.error("FAIL", err);
  process.exit(1);
});
