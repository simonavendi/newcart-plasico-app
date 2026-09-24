const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
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

  await page.goto("http://127.0.0.1:8780/index.html", {
    waitUntil: "domcontentloaded",
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

  await page.click("#boxnow-open-locator");
  await page.waitForSelector("#boxnow-fullscreen-root iframe", {
    timeout: 15000,
  });
  const src = await page.getAttribute("#boxnow-fullscreen-root iframe", "src");
  console.log("SRC", src);
  if (!src.includes("popup.html")) throw new Error("expected popup.html");

  await page.waitForTimeout(7000);
  const frame = page.frames().find((f) => /boxnow/.test(f.url()));
  if (!frame) throw new Error("no frame");

  const mapType = await frame.evaluate(() => window.mapType);
  console.log("mapType", mapType);

  // Click first Izbor
  const btn = frame.locator("button.boxnow_btn_select_locker.select_this").first();
  await btn.waitFor({ timeout: 15000 });
  await btn.click({ force: true });
  await page.waitForTimeout(2500);

  const msgs = await page.evaluate(() => window.__allMsgs);
  console.log("MSGS", JSON.stringify(msgs, null, 2));

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
  console.log("STATE", JSON.stringify(state, null, 2));

  const mediaDir = path.join(__dirname, ".cursor", "stores", "self", "media");
  fs.mkdirSync(mediaDir, { recursive: true });
  await page.evaluate(() => {
    document.getElementById("boxnow-selected")?.scrollIntoView({
      block: "center",
    });
  });
  await page.waitForTimeout(200);
  const shot = path.join(mediaDir, "boxnow-mega-gamma-summary.png");
  const el = await page.$("#boxnow-selected");
  if (el && !state.selHidden) await el.screenshot({ path: shot });
  // also locator open shot
  console.log("SHOT", shot);

  const ok =
    !!state.id &&
    !state.root &&
    !state.selHidden &&
    state.wrapSel &&
    state.launchDisplay === "none" &&
    !!state.title &&
    msgs.some(
      (m) => m.data && m.data.boxnowLockerId != null
    );
  console.log(ok ? "LIVE SELECT OK" : "LIVE SELECT FAIL");
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
