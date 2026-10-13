/**
 * Leasing CTA:
 * - desktop (>1100): skip summary overlay, proceed immediately
 * - mobile (≤1100): open summary overlay; Потвърди proceeds
 */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = process.env.PLASICO_BASE || "http://127.0.0.1:8780/index.html";
const outDir = path.join(__dirname, ".cursor/stores/self/media");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function seedLeasing(page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
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
  await page.waitForTimeout(700);

  await page.evaluate(() => window.PlasicoLeasing.open({ column: "personal" }));
  await page.waitForTimeout(300);
  await page.fill("#pl-leasing-name", "Иван Петров");
  await page.fill("#pl-leasing-phone", "0888123456");
  await page.fill("#pl-leasing-egn", "8001010000");
  await page.fill("#pl-leasing-email", "ivan.petrov@example.com");
  await page.check("#pl-leasing-agree-terms");
  await page.check("#pl-leasing-agree-apply");
  await page.check("#pl-leasing-agree-privacy");
  await page.click("#pl-leasing-apply-submit");
  await page.waitForTimeout(700);

  assert(
    await page.evaluate(() => window.PlasicoLeasing.isCompletedCtaActive()),
    "leasing CTA not active"
  );

  await page.evaluate(() => {
    window.__leasingConfirmHit = false;
    document.addEventListener(
      "plasico:leasing-confirm",
      function () {
        window.__leasingConfirmHit = true;
      },
      true
    );
    const form = document.querySelector("#checkout-new form, #checkout form, form.cl");
    if (!form) return;
    form.addEventListener(
      "submit",
      function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        window.__leasingConfirmHit = true;
      },
      true
    );
  });
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  // --- Desktop: skip overlay ---
  const desk = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await seedLeasing(desk);
  await desk.locator(".checkout-finish.btn.is-leasing-complete").click();
  await desk.waitForTimeout(400);
  const deskAfter = await desk.evaluate(() => {
    const overlay = document.getElementById("pl-leasing-confirm-overlay");
    return {
      overlayVisible: !!(overlay && !overlay.hidden),
      hit: !!window.__leasingConfirmHit,
    };
  });
  assert(!deskAfter.overlayVisible, "desktop: summary overlay should not open: " + JSON.stringify(deskAfter));
  assert(deskAfter.hit, "desktop: should proceed on CTA click: " + JSON.stringify(deskAfter));
  await desk.close();

  // --- Mobile: open overlay, then confirm ---
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await seedLeasing(mob);
  await mob.locator(".checkout-finish.btn.is-leasing-complete").scrollIntoViewIfNeeded();
  await mob.locator(".checkout-finish.btn.is-leasing-complete").click();
  await mob.waitForTimeout(400);
  const mobOpen = await mob.evaluate(() => {
    const overlay = document.getElementById("pl-leasing-confirm-overlay");
    const body = document.getElementById("pl-leasing-confirm-body");
    return {
      overlayVisible: !!(overlay && !overlay.hidden),
      hit: !!window.__leasingConfirmHit,
      hasCart: !!(body && /Количка|Сума за плащане/i.test(body.textContent || "")),
      hasScheme: !!(body && /Схема на изплащане|вноск/i.test(body.textContent || "")),
    };
  });
  assert(mobOpen.overlayVisible, "mobile: summary overlay must open: " + JSON.stringify(mobOpen));
  assert(!mobOpen.hit, "mobile: must not proceed before Потвърди: " + JSON.stringify(mobOpen));
  assert(mobOpen.hasCart && mobOpen.hasScheme, "mobile: overlay body incomplete: " + JSON.stringify(mobOpen));

  await mob.locator("#pl-leasing-confirm-overlay").screenshot({
    path: path.join(outDir, "leasing-confirm-modal-mobile.png"),
  });

  await mob.locator("#pl-leasing-confirm-submit").click();
  await mob.waitForTimeout(400);
  const mobAfter = await mob.evaluate(() => {
    const overlay = document.getElementById("pl-leasing-confirm-overlay");
    return {
      overlayVisible: !!(overlay && !overlay.hidden),
      hit: !!window.__leasingConfirmHit,
    };
  });
  assert(!mobAfter.overlayVisible, "mobile: overlay closes after confirm: " + JSON.stringify(mobAfter));
  assert(mobAfter.hit, "mobile: should proceed after Потвърди: " + JSON.stringify(mobAfter));
  await mob.close();

  console.log(JSON.stringify({ ok: true, deskAfter, mobOpen, mobAfter }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
