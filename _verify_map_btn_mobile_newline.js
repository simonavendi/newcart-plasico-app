/**
 * On mobile, „Избери от карта“ must sit on its own row (full width under title).
 */
const { chromium } = require("playwright");

const BASE = process.env.PLASICO_BASE || "http://127.0.0.1:8780/index.html";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(400);

  await page.locator("#step-ship-method .co-option-row").filter({ hasText: "До автомат" }).first().click();
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const r = document.querySelector('input[name="locker_courier"][value="boxnow"]');
    if (r) {
      r.checked = true;
      r.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  await page.waitForTimeout(250);

  const geo = await page.evaluate(() => {
    const row = document.querySelector("[data-locker-courier-row=boxnow] .office-courier-row__body");
    const title = row && row.querySelector(".co-option-row__title");
    const btn = row && row.querySelector(".office-widget-launch");
    if (!row || !title || !btn) return { missing: true };
    const rb = row.getBoundingClientRect();
    const tb = title.getBoundingClientRect();
    const bb = btn.getBoundingClientRect();
    const cs = getComputedStyle(btn);
    return {
      btnTop: bb.top,
      titleBottom: tb.bottom,
      btnWidth: bb.width,
      rowWidth: rb.width,
      flexBasis: cs.flexBasis,
      newLine: bb.top >= tb.bottom - 2,
      fullish: bb.width >= rb.width * 0.9,
    };
  });

  assert(!geo.missing, "boxnow map row missing");
  assert(geo.newLine, "map button must be below title: " + JSON.stringify(geo));
  assert(geo.fullish, "map button must span row width: " + JSON.stringify(geo));

  console.log("PASS", JSON.stringify(geo));
  await browser.close();
})().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
