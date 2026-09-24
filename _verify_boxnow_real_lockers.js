/**
 * Verify Box Now fullscreen shell loads PROD lockers (not DEV test pair)
 * and browser Back closes the overlay back to checkout.
 * Expects http://127.0.0.1:8780 serving the repo.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://127.0.0.1:8780";
const MEDIA = path.join(__dirname, ".cursor", "stores", "self", "media");
fs.mkdirSync(MEDIA, { recursive: true });

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    locale: "bg-BG",
  });

  const lockerReqs = [];
  page.on("request", (req) => {
    const u = req.url();
    if (/globallockers|\/lockers\/all\.json|\/partners\/partners\.json/i.test(u)) {
      lockerReqs.push(u);
    }
  });

  await page.goto(`${BASE}/index.html`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.evaluate(() => {
    const r = document.querySelector(
      'input[name="ship_to_id[2]"][value="boxnow"]'
    );
    if (r) {
      r.checked = true;
      r.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  await page.waitForTimeout(300);
  await page.click("#boxnow-open-locator");
  await page.waitForSelector("#boxnow-fullscreen-root iframe", { timeout: 20000 });

  const src =
    (await page.getAttribute("#boxnow-fullscreen-root iframe", "src")) || "";
  if (!/boxnow-fullscreen-map\.html/.test(src) || !/partnerId=18248/.test(src)) {
    fail("iframe src expected local shell + partnerId=18248; got " + src);
  }

  const histPushed = await page.evaluate(() => !!window.__plasicoBoxNowHistPushed);
  if (!histPushed) fail("expected history pushState on open");

  // Wait for locker list to populate
  const frame = page.frames().find((f) => /boxnow-fullscreen-map/.test(f.url()));
  if (!frame) fail("no fullscreen-map frame");

  await frame.waitForFunction(
    () => document.querySelectorAll("#boxnow_list_cover [id^='locker-']").length > 10,
    null,
    { timeout: 45000 }
  );

  const counts = await frame.evaluate(() => {
    const lockers = Array.from(
      document.querySelectorAll("#boxnow_list_cover [id^='locker-']")
    );
    const titles = lockers.map((el) => {
      const t = el.querySelector(".boxnow_locker_title");
      return t ? t.textContent.trim() : "";
    });
    const testish = titles.filter(
      (t) => /Test Locker|Тестов Автомат/i.test(t)
    );
    return {
      lockerCount: lockers.length,
      sample: titles.slice(0, 5),
      testish,
      mapType: window.mapType,
    };
  });

  console.log("lockers:", counts.lockerCount, "sample:", counts.sample);
  console.log("locker API reqs:", lockerReqs.slice(0, 8));

  if (counts.lockerCount < 50) {
    fail("expected many real BG lockers, got " + counts.lockerCount);
  }
  if (counts.testish.length && counts.lockerCount <= 5) {
    fail("still looks like DEV test set: " + counts.testish.join(", "));
  }
  const hitDev = lockerReqs.some((u) => /globallockersdev|\/DEV\//i.test(u));
  const hitProd = lockerReqs.some((u) => /globallockersprod|\/PROD\//i.test(u));
  // Requests may appear rewritten in the network log as PROD only.
  if (hitDev && !hitProd) {
    fail("locker fetches still hitting DEV only: " + lockerReqs.join(" | "));
  }
  if (!hitProd && lockerReqs.length) {
    // Playwright sees the rewritten URL after our fetch hook — expect PROD.
    console.warn("warn: no explicit PROD URL seen; reqs=", lockerReqs);
  }

  await page.screenshot({
    path: path.join(MEDIA, "boxnow-real-lockers.png"),
    fullPage: false,
  });

  // Select → summary still works
  await frame.evaluate(() => {
    const btn =
      document.querySelector(
        "#boxnow_list_cover .boxnow_btn_select_locker.select_this"
      ) ||
      document.querySelector("#boxnow_list_cover .boxnow_btn_select_locker");
    if (!btn) throw new Error("no select button");
    btn.click();
  });
  await page.waitForFunction(
    () => !document.getElementById("boxnow-fullscreen-root"),
    null,
    { timeout: 15000 }
  );
  const summary = await page.evaluate(() => {
    const sel = document.getElementById("boxnow-selected");
    const name = document.getElementById("boxnow-selected-name");
    const id = document.getElementById("boxnow-locker-id");
    return {
      visible: !!(sel && !sel.hidden),
      name: name ? name.textContent.trim() : "",
      id: id ? String(id.value || "") : "",
      hist: !!window.__plasicoBoxNowHistPushed,
    };
  });
  console.log("after select:", summary);
  if (!summary.visible || !summary.id) fail("select did not fill summary");
  if (summary.hist) fail("history flag should clear after select close");

  // Re-open and test Back
  await page.click("#boxnow-change-locker");
  await page.waitForSelector("#boxnow-fullscreen-root", { timeout: 15000 });
  const openAgain = await page.evaluate(() => !!window.__plasicoBoxNowHistPushed);
  if (!openAgain) fail("history not pushed on re-open");

  await page.goBack();
  await page.waitForFunction(
    () => !document.getElementById("boxnow-fullscreen-root"),
    null,
    { timeout: 10000 }
  );
  const afterBack = await page.evaluate(() => ({
    overlay: !!document.getElementById("boxnow-fullscreen-root"),
    hist: !!window.__plasicoBoxNowHistPushed,
    url: location.href,
    hasCheckout: !!document.getElementById("checkout"),
  }));
  console.log("after Back:", afterBack);
  if (afterBack.overlay) fail("Back did not close overlay");
  if (!afterBack.hasCheckout) fail("left checkout after Back");

  await page.screenshot({
    path: path.join(MEDIA, "boxnow-back-to-cart.png"),
    fullPage: false,
  });

  await browser.close();
  console.log("OK: real lockers + Back closes overlay");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
