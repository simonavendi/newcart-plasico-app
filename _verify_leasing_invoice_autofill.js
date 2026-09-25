/**
 * Verify leasing-complete → invoice (фактура) autofill:
 * - want-invoice + физическо лице + name/EGN from leasing
 * - green top notice
 * - switch to ЮЛ → МОЛ filled + red badge
 * - clearApply hides notices
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });

  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(500);

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
  await page.waitForTimeout(800);

  assert(
    await page.evaluate(
      () => !!(window.PlasicoLeasing && window.PlasicoLeasing.syncInvoiceFromLeasing)
    ),
    "PlasicoLeasing.syncInvoiceFromLeasing missing"
  );

  await page.evaluate(() => window.PlasicoLeasing.open({ column: "personal" }));
  await page.waitForTimeout(400);

  await page.fill("#pl-leasing-name", "Симона Димитрова");
  await page.fill("#pl-leasing-phone", "0888123456");
  await page.fill("#pl-leasing-egn", "9001011234");
  await page.fill("#pl-leasing-email", "simona@example.com");
  await page.check("#pl-leasing-agree-terms");
  await page.check("#pl-leasing-agree-apply");
  await page.check("#pl-leasing-agree-privacy");
  await page.click("#pl-leasing-apply-submit");
  await page.waitForTimeout(900);

  const afterFill = await page.evaluate(() => {
    const want = document.getElementById("want-invoice");
    const p1 = document.getElementById("invoice-person-1");
    const p2 = document.getElementById("invoice-person-2");
    const names = document.getElementById("person-names");
    const egn = document.getElementById("person-egn");
    const top = document.getElementById("co-invoice-leasing-auto-msg");
    const badge = document.getElementById("co-invoice-leasing-mol-badge");
    const indiv = document.getElementById("checkout-person-individual");
    return {
      filled: window.PlasicoLeasing.isApplyFilled(),
      want: !!(want && want.checked),
      person1: !!(p1 && p1.checked),
      person2: !!(p2 && p2.checked),
      names: names ? names.value : "",
      egn: egn ? egn.value : "",
      topText: top ? top.textContent.trim() : "",
      topHidden: !!(top && top.hidden),
      badgeHidden: !badge || badge.hidden,
      indivHidden: !indiv || indiv.hidden || indiv.classList.contains("hide"),
      bodyFlag: document.body.getAttribute("data-leasing-invoice"),
    };
  });

  assert(afterFill.filled, "apply not filled");
  assert(afterFill.want, "want-invoice not checked: " + JSON.stringify(afterFill));
  assert(afterFill.person1 && !afterFill.person2, "expected физическо лице: " + JSON.stringify(afterFill));
  assert(
    afterFill.names === "Симона Димитрова",
    "person-names mismatch: " + afterFill.names
  );
  assert(afterFill.egn === "9001011234", "person-egn mismatch: " + afterFill.egn);
  assert(
    afterFill.topText.includes("Автоматично ще бъде издадена фактура"),
    "top message missing: " + afterFill.topText
  );
  assert(!afterFill.topHidden, "top message should be visible");
  assert(afterFill.badgeHidden, "red badge should be hidden on физ лице");
  assert(afterFill.indivHidden, "individual fields must be hidden on leasing path");

  await page.locator("#checkout-invoice-fields").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.locator("#checkout-invoice-fields").screenshot({
    path: path.join(outDir, "leasing-invoice-autofill.png"),
  });

  // Switch to Юридическо лице (radios are visually hidden — use label / programmatic)
  await page.evaluate(() => {
    const r = document.getElementById("invoice-person-2");
    if (!r) throw new Error("invoice-person-2 missing");
    r.checked = true;
    const group = document.querySelectorAll('input[name="invoice_person_type"]');
    for (let i = 0; i < group.length; i++) {
      const lb = group[i].closest("label");
      if (lb) lb.classList.toggle("clicked", group[i].checked);
    }
    r.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(400);

  const afterFirm = await page.evaluate(() => {
    const p2 = document.getElementById("invoice-person-2");
    const mol = document.getElementById("firm-mol");
    const top = document.getElementById("co-invoice-leasing-auto-msg");
    const badge = document.getElementById("co-invoice-leasing-mol-badge");
    const firms = document.getElementById("checkout-firms");
    return {
      person2: !!(p2 && p2.checked),
      mol: mol ? mol.value : "",
      topHidden: !top || top.hidden,
      badgeText: badge ? badge.textContent.trim() : "",
      badgeHidden: !badge || badge.hidden,
      firmsHidden: !firms || firms.hidden || firms.classList.contains("hide"),
    };
  });

  assert(afterFirm.person2, "ЮЛ not selected");
  assert(afterFirm.mol === "Симона Димитрова", "МОЛ not filled: " + afterFirm.mol);
  assert(
    afterFirm.badgeText.includes("потребителят на кредита да е МОЛ"),
    "red badge text wrong: " + afterFirm.badgeText
  );
  assert(!afterFirm.badgeHidden, "red badge should be visible");
  assert(!afterFirm.firmsHidden, "firms panel should be visible");

  await page.locator("#checkout-invoice-fields").screenshot({
    path: path.join(outDir, "leasing-invoice-autofill-firm.png"),
  });

  // clearApply hides notices
  const afterClear = await page.evaluate(() => {
    window.PlasicoLeasing.clearApply();
    const top = document.getElementById("co-invoice-leasing-auto-msg");
    const badge = document.getElementById("co-invoice-leasing-mol-badge");
    return {
      filled: window.PlasicoLeasing.isApplyFilled(),
      topHidden: !top || top.hidden,
      badgeHidden: !badge || badge.hidden,
      bodyFlag: document.body.getAttribute("data-leasing-invoice"),
    };
  });
  assert(!afterClear.filled, "clearApply should clear apply");
  assert(afterClear.topHidden && afterClear.badgeHidden, "notices should hide after clear");
  assert(!afterClear.bodyFlag, "data-leasing-invoice should clear");

  console.log(
    JSON.stringify(
      {
        ok: true,
        afterFill,
        afterFirm,
        afterClear,
        shot: "leasing-invoice-autofill.png",
        shotFirm: "leasing-invoice-autofill-firm.png",
      },
      null,
      2
    )
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

