const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto("http://127.0.0.1:8780/poruchka.html", {
    waitUntil: "domcontentloaded",
  });
  await p.evaluate(() => {
    const r = document.querySelector(
      'input[name="ship_to_id[2]"][value="boxnow"]'
    );
    if (r) {
      r.checked = true;
      r.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  await p.click("#boxnow-open-locator");
  await p.waitForSelector("#boxnow-fullscreen-root iframe");
  await p.waitForTimeout(7000);
  const frame = p.frames().find((f) => /boxnow-fullscreen-map/.test(f.url()));
  await frame
    .locator("button.boxnow_btn_select_locker.select_this")
    .first()
    .click({ force: true });
  await p.waitForTimeout(1500);
  await p.click("#boxnow-change-locker");
  await p.waitForSelector("#boxnow-fullscreen-root", { timeout: 10000 });
  const src = await p.getAttribute("#boxnow-fullscreen-root iframe", "src");
  const box = await p.locator("#boxnow-fullscreen-root").boundingBox();
  const ok =
    src.includes("boxnow-fullscreen-map.html") &&
    box &&
    Math.abs(box.width - 1280) < 4 &&
    Math.abs(box.height - 720) < 4;
  console.log(JSON.stringify({ src, box, ok }));
  await b.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
