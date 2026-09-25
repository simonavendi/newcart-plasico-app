/**
 * Verify Box Now fullscreen close/Back are clickable (not covered by iframe).
 * Uses local :8780.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const MEDIA = path.join(__dirname, ".cursor", "stores", "self", "media");
fs.mkdirSync(MEDIA, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto("http://127.0.0.1:8780/index.html", {
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
  await page.waitForSelector("#boxnow-fullscreen-root", { timeout: 15000 });
  await page.waitForTimeout(2500);

  const layout = await page.evaluate(() => {
    const root = document.getElementById("boxnow-fullscreen-root");
    const chrome = root && root.querySelector(".boxnow-fullscreen__chrome");
    const back = root && root.querySelector(".boxnow-fullscreen__back");
    const close = root && root.querySelector(".boxnow-fullscreen__close");
    const iframe = root && root.querySelector("iframe");
    function hit(el) {
      if (!el) return null;
      const br = el.getBoundingClientRect();
      const x = br.left + br.width / 2;
      const y = br.top + br.height / 2;
      const top = document.elementFromPoint(x, y);
      return {
        x,
        y,
        rect: { x: br.x, y: br.y, w: br.width, h: br.height },
        hitTag: top && top.tagName,
        hitClass: top && String(top.className),
        isSelf: top === el,
        isIframe: top === iframe,
      };
    }
    return {
      hasChrome: !!chrome,
      hasBack: !!back,
      hasClose: !!close,
      iframeSrc: (iframe && iframe.src) || "",
      chromeH: chrome && chrome.getBoundingClientRect().height,
      iframeTop: iframe && iframe.getBoundingClientRect().top,
      closeHit: hit(close),
      backHit: hit(back),
      headerPE:
        (document.querySelector("header.cl.rel") &&
          getComputedStyle(document.querySelector("header.cl.rel"))
            .pointerEvents) ||
        null,
    };
  });

  console.log(JSON.stringify(layout, null, 2));

  const okChrome = layout.hasChrome && layout.hasBack && layout.hasClose;
  const okStack =
    layout.closeHit &&
    layout.closeHit.isSelf &&
    !layout.closeHit.isIframe &&
    layout.backHit &&
    layout.backHit.isSelf;
  const okIframeBelow =
    layout.iframeTop != null &&
    layout.chromeH != null &&
    layout.iframeTop >= layout.chromeH - 1;
  const okSrc =
    /boxnow-fullscreen-map\.html/.test(layout.iframeSrc) &&
    /partnerId=18248/.test(layout.iframeSrc);
  const okHeader = layout.headerPE === "none";

  await page.screenshot({
    path: path.join(MEDIA, "boxnow-close-unblocked.png"),
    fullPage: false,
  });

  // Click × and confirm overlay closes
  await page.click(".boxnow-fullscreen__close", { timeout: 3000 });
  await page.waitForTimeout(400);
  const closedByX = await page.evaluate(
    () => !document.getElementById("boxnow-fullscreen-root")
  );

  // Re-open and click Back
  await page.click("#boxnow-open-locator");
  await page.waitForSelector("#boxnow-fullscreen-root", { timeout: 10000 });
  await page.waitForTimeout(800);
  await page.click(".boxnow-fullscreen__back", { timeout: 3000 });
  await page.waitForTimeout(400);
  const closedByBack = await page.evaluate(
    () => !document.getElementById("boxnow-fullscreen-root")
  );

  const result = {
    okChrome,
    okStack,
    okIframeBelow,
    okSrc,
    okHeader,
    closedByX,
    closedByBack,
    pass:
      okChrome &&
      okStack &&
      okIframeBelow &&
      okSrc &&
      okHeader &&
      closedByX &&
      closedByBack,
  };
  console.log("RESULT", JSON.stringify(result, null, 2));
  await browser.close();
  if (!result.pass) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
