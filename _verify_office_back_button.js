/**
 * Verify Speedy/Econt office locators push history on open so browser Back
 * closes the overlay and returns to checkout (mirrors Box Now).
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

async function selectOfficeShip(page, courier) {
  await page.evaluate((c) => {
    const r = document.querySelector(
      'input[name="ship_to_id[2]"][value="office"]'
    );
    if (r) {
      r.checked = true;
      r.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const s = document.querySelector(
      'input[name="office_courier"][value="' + c + '"]'
    );
    if (s) {
      s.checked = true;
      s.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, courier);
  await page.waitForTimeout(300);
}

async function postSelect(page, kind) {
  if (kind === "speedy") {
    return page.evaluate(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            id: 17,
            name: "АСЕНОВГРАД",
            address: {
              fullAddressString:
                "гр. АСЕНОВГРАД [4230] ул. ГОЦЕ ДЕЛЧЕВ No 9А",
            },
          },
          origin: "https://services.speedy.bg",
          source: window,
        })
      );
      return {
        overlayGone: !document.getElementById("office-fullscreen-root"),
        name:
          (document.getElementById("office-selected-name") || {}).textContent ||
          "",
        change:
          (
            (document.getElementById("office-change-locator") || {})
              .textContent || ""
          ).trim(),
        isSelected: document
          .getElementById("office-widget-wrap")
          .classList.contains("is-selected"),
        hist: !!window.__plasicoOfficeHistPushed,
      };
    });
  }
  return page.evaluate(() => {
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          office: {
            id: 1029,
            code: "1127",
            name: "София",
            address: {
              fullAddress: "София жк Хаджи Димитър ул. Резбарска №11",
            },
          },
        },
        origin: "https://officelocator.econt.com",
        source: window,
      })
    );
    return {
      overlayGone: !document.getElementById("office-fullscreen-root"),
      name:
        (document.getElementById("office-selected-name") || {}).textContent ||
        "",
      change:
        (
          (document.getElementById("office-change-locator") || {}).textContent ||
          ""
        ).trim(),
      isSelected: document
        .getElementById("office-widget-wrap")
        .classList.contains("is-selected"),
      hist: !!window.__plasicoOfficeHistPushed,
    };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    locale: "bg-BG",
  });

  await page.goto(`${BASE}/index.html`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  // --- Speedy: open → pushState → Back closes ---
  await selectOfficeShip(page, "speedy");
  await page.click("#office-open-locator");
  await page.waitForSelector("#office-fullscreen-root iframe", {
    timeout: 15000,
  });
  const speedySrc =
    (await page.getAttribute("#office-fullscreen-root iframe", "src")) || "";
  if (!/speedy\.bg/i.test(speedySrc)) fail("speedy iframe src: " + speedySrc);

  const histOpen = await page.evaluate(
    () => !!window.__plasicoOfficeHistPushed
  );
  if (!histOpen) fail("expected history pushState on Speedy open");

  await page.screenshot({
    path: path.join(MEDIA, "office-speedy-map-open.png"),
    fullPage: false,
  });

  await page.goBack();
  await page.waitForFunction(
    () => !document.getElementById("office-fullscreen-root"),
    null,
    { timeout: 10000 }
  );
  const afterSpeedyBack = await page.evaluate(() => ({
    overlay: !!document.getElementById("office-fullscreen-root"),
    hist: !!window.__plasicoOfficeHistPushed,
    url: location.href,
    hasCheckout: !!document.getElementById("checkout"),
  }));
  console.log("after Speedy Back:", afterSpeedyBack);
  if (afterSpeedyBack.overlay) fail("Speedy Back did not close overlay");
  if (!afterSpeedyBack.hasCheckout) fail("left checkout after Speedy Back");
  if (afterSpeedyBack.hist) fail("hist flag should clear after Speedy Back");

  await page.screenshot({
    path: path.join(MEDIA, "office-speedy-back-to-cart.png"),
    fullPage: false,
  });

  // --- Speedy: select → summary + Смени; hist cleared ---
  await page.click("#office-open-locator");
  await page.waitForSelector("#office-fullscreen-root", { timeout: 15000 });
  const speedySel = await postSelect(page, "speedy");
  console.log("speedy select:", speedySel);
  if (!speedySel.overlayGone) fail("speedy select left overlay open");
  if (speedySel.name !== "АСЕНОВГРАД") fail("speedy name: " + speedySel.name);
  if (!/Смени/.test(speedySel.change)) fail("missing Смени after select");
  if (!speedySel.isSelected) fail("wrap not is-selected after speedy select");
  // hist may still be true briefly until history.back() completes; wait clear
  await page.waitForFunction(
    () => !window.__plasicoOfficeHistPushed,
    null,
    { timeout: 5000 }
  );

  await page.screenshot({
    path: path.join(MEDIA, "office-speedy-selected-smeni.png"),
    fullPage: false,
  });

  // --- Econt: open → Back ---
  await selectOfficeShip(page, "econt");
  await page.click("#office-open-locator");
  await page.waitForSelector("#office-fullscreen-root iframe", {
    timeout: 15000,
  });
  const econtSrc =
    (await page.getAttribute("#office-fullscreen-root iframe", "src")) || "";
  if (!/econt\.com/i.test(econtSrc)) fail("econt iframe src: " + econtSrc);
  const eHist = await page.evaluate(() => !!window.__plasicoOfficeHistPushed);
  if (!eHist) fail("expected history pushState on Econt open");

  await page.screenshot({
    path: path.join(MEDIA, "office-econt-map-open.png"),
    fullPage: false,
  });

  await page.goBack();
  await page.waitForFunction(
    () => !document.getElementById("office-fullscreen-root"),
    null,
    { timeout: 10000 }
  );
  const afterEcontBack = await page.evaluate(() => ({
    overlay: !!document.getElementById("office-fullscreen-root"),
    hist: !!window.__plasicoOfficeHistPushed,
    hasCheckout: !!document.getElementById("checkout"),
  }));
  console.log("after Econt Back:", afterEcontBack);
  if (afterEcontBack.overlay) fail("Econt Back did not close overlay");
  if (!afterEcontBack.hasCheckout) fail("left checkout after Econt Back");

  await page.screenshot({
    path: path.join(MEDIA, "office-econt-back-to-cart.png"),
    fullPage: false,
  });

  // --- Econt: select → summary + Смени ---
  await page.click("#office-open-locator");
  await page.waitForSelector("#office-fullscreen-root", { timeout: 15000 });
  const econtSel = await postSelect(page, "econt");
  console.log("econt select:", econtSel);
  if (!econtSel.overlayGone) fail("econt select left overlay open");
  if (econtSel.name !== "София") fail("econt name: " + econtSel.name);
  if (!/Смени/.test(econtSel.change)) fail("missing Смени after econt select");
  if (!econtSel.isSelected) fail("wrap not is-selected after econt select");
  await page.waitForFunction(
    () => !window.__plasicoOfficeHistPushed,
    null,
    { timeout: 5000 }
  );

  await page.screenshot({
    path: path.join(MEDIA, "office-econt-selected-smeni.png"),
    fullPage: false,
  });

  // Source markers present in served HTML
  const html = await page.content();
  if (!/plasicoOfficeLocator/.test(html) && !(await page.evaluate(() => typeof window.__plasicoOfficeHistBound !== "undefined" || !!window.__plasicoOfficeHistBound))) {
    // runtime flag is enough; also check function wiring via evaluate
  }
  const wired = await page.evaluate(
    () => !!window.__plasicoOfficeHistBound || typeof window.__plasicoOpenOfficeLocator === "function"
  );
  if (!wired) fail("office history / open not wired");

  await browser.close();
  console.log("OK: Speedy/Econt Back closes overlay; select → summary + Смени");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
