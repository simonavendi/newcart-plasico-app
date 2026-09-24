/**
 * Verify Box Now fullscreen shell + Izbor → summary.
 * Expects http://127.0.0.1:8780 already serving the repo.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://127.0.0.1:8780";
const MEDIA = path.join(__dirname, ".cursor", "stores", "self", "media");
fs.mkdirSync(MEDIA, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const [width, height, label] of [
    [390, 844, "mobile"],
    [1280, 720, "desktop"],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      locale: "bg-BG",
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__allMsgs = [];
      window.addEventListener(
        "message",
        (e) => {
          window.__allMsgs.push({ origin: e.origin, data: e.data });
        },
        true
      );
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
    await page.waitForTimeout(400);
    await page.click("#boxnow-open-locator");
    await page.waitForSelector("#boxnow-fullscreen-root iframe", {
      timeout: 20000,
    });

    const src = (await page.getAttribute("#boxnow-fullscreen-root iframe", "src")) || "";
    const rootBox = await page.locator("#boxnow-fullscreen-root").boundingBox();
    const iframeBox = await page
      .locator("#boxnow-fullscreen-root iframe")
      .boundingBox();

    // Wait for map shell + lockers
    await page.waitForTimeout(8000);
    const frame = page.frames().find((f) => /boxnow-fullscreen-map/.test(f.url()));
    if (!frame) throw new Error(`[${label}] no fullscreen-map frame; src=${src}`);

    const inner = await frame.evaluate(() => {
      const w = document.getElementById("boxnow_widget");
      const cs = w ? getComputedStyle(w) : null;
      const rect = w ? w.getBoundingClientRect() : null;
      return {
        mapType: window.mapType,
        hasPopupCss: !!document.querySelector('link[href*="popup.css"]'),
        widget: rect && {
          x: rect.x,
          y: rect.y,
          w: rect.width,
          h: rect.height,
          radius: cs.borderRadius,
          transform: cs.transform,
        },
        vw: window.innerWidth,
        vh: window.innerHeight,
      };
    });

    const openShot = path.join(MEDIA, `boxnow-fullscreen-keep-${label}.png`);
    await page.screenshot({ path: openShot, fullPage: false });
    if (label === "mobile") {
      await page.screenshot({
        path: path.join(MEDIA, "boxnow-fullscreen.png"),
        fullPage: false,
      });
    }

    // Click first Izbor
    const btn = frame
      .locator("button.boxnow_btn_select_locker.select_this")
      .first();
    await btn.waitFor({ timeout: 20000 });
    await btn.click({ force: true });
    await page.waitForTimeout(2500);

    const msgs = await page.evaluate(() => window.__allMsgs);
    const state = await page.evaluate(() => ({
      root: !!document.getElementById("boxnow-fullscreen-root"),
      id: document.getElementById("boxnow-locker-id")?.value || "",
      name: document.getElementById("boxnow-locker-name")?.value || "",
      addr: document.getElementById("boxnow-locker-address")?.value || "",
      title: document.getElementById("boxnow-selected-name")?.textContent || "",
      sub: document.getElementById("boxnow-selected-text")?.textContent || "",
      selHidden: !!document.getElementById("boxnow-selected")?.hidden,
      wrapSel: !!document
        .getElementById("boxnow-widget-wrap")
        ?.classList.contains("is-selected"),
      launchDisplay: getComputedStyle(
        document.getElementById("boxnow-open-locator")
      ).display,
    }));

    await page.evaluate(() => {
      document.getElementById("boxnow-selected")?.scrollIntoView({
        block: "center",
      });
    });
    await page.waitForTimeout(200);
    const summaryShot = path.join(
      MEDIA,
      `boxnow-fullscreen-keep-summary-${label}.png`
    );
    if (!state.selHidden) {
      const el = await page.$("#boxnow-selected");
      if (el) await el.screenshot({ path: summaryShot });
    }

    const okSrc = src.includes("boxnow-fullscreen-map.html") && src.includes("partnerId=18248");
    const okRoot =
      rootBox &&
      Math.abs(rootBox.x) < 2 &&
      Math.abs(rootBox.y) < 2 &&
      Math.abs(rootBox.width - width) < 4 &&
      Math.abs(rootBox.height - height) < 4;
    const okIframe =
      iframeBox &&
      Math.abs(iframeBox.width - width) < 4 &&
      Math.abs(iframeBox.height - height) < 4;
    const okInner =
      inner.mapType === "popup" &&
      !inner.hasPopupCss &&
      inner.widget &&
      Math.abs(inner.widget.x) < 3 &&
      Math.abs(inner.widget.y) < 3 &&
      Math.abs(inner.widget.w - inner.vw) < 8 &&
      Math.abs(inner.widget.h - inner.vh) < 8 &&
      (inner.widget.radius === "0px" || inner.widget.radius === "");
    const okSelect =
      !!state.id &&
      !state.root &&
      !state.selHidden &&
      state.wrapSel &&
      state.launchDisplay === "none" &&
      !!state.title &&
      msgs.some((m) => m.data && m.data.boxnowLockerId != null);

    const row = {
      label,
      okSrc,
      okRoot,
      okIframe,
      okInner,
      okSelect,
      src: src.slice(0, 200),
      inner,
      state,
      msgs: msgs.filter((m) => m.data && (m.data.boxnowLockerId != null || m.data === "closeIframe")),
      openShot,
      summaryShot,
    };
    results.push(row);
    console.log(JSON.stringify(row, null, 2));
    await context.close();
  }

  await browser.close();
  const failed = results.filter(
    (r) => !(r.okSrc && r.okRoot && r.okIframe && r.okInner && r.okSelect)
  );
  if (failed.length) {
    console.error("VERIFY FAILED");
    process.exit(1);
  }
  console.log("VERIFY OK");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
