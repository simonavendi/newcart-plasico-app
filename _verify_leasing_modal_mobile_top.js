const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

(async () => {
  const outDir = path.join(__dirname, ".cursor/stores/self/media");
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  await page.goto("http://127.0.0.1:8780/index.html", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.evaluate(() => {
    localStorage.setItem(
      "plasico-hss2026-cart",
      JSON.stringify([{ id: "t", title: "Test", price: 499.99, qty: 1 }])
    );
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.PlasicoLeasing.open({ column: "personal" }));
  await page.waitForTimeout(400);

  const metrics = await page.evaluate(() => {
    const overlay = document.getElementById("pl-leasing-overlay");
    const modal = overlay.querySelector(".pl-leasing-modal");
    const close = overlay.querySelector(".pl-leasing-close");
    const head = overlay.querySelector(".pl-leasing-head");
    const title = overlay.querySelector(".pl-leasing-title");
    const body = overlay.querySelector(".pl-leasing-body");
    const grid = document.getElementById("pl-leasing-grid");
    const o = overlay.getBoundingClientRect();
    const m = modal.getBoundingClientRect();
    const c = close.getBoundingClientRect();
    const h = head.getBoundingClientRect();
    const t = title.getBoundingClientRect();
    const csO = getComputedStyle(overlay);
    const csM = getComputedStyle(modal);
    const csC = getComputedStyle(close);
    const csB = getComputedStyle(body);
    const csG = getComputedStyle(grid);
    const cells = [...grid.querySelectorAll(".pl-leasing-cell:not(.pl-leasing-cell--empty)")];
    const personal = cells.filter((el) => el.dataset.column === "personal");
    const tops = new Set(personal.map((el) => Math.round(el.getBoundingClientRect().top)));
    const marginL = m.left;
    const marginR = window.innerWidth - m.right;
    const marginT = m.top;
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      overlayAlign: csO.alignItems,
      overlayPad: csO.padding,
      modal: {
        top: Math.round(m.top),
        left: Math.round(m.left),
        right: Math.round(m.right),
        w: Math.round(m.width),
        h: Math.round(m.height),
        maxH: csM.maxHeight,
        overflow: csM.overflow,
      },
      margins: {
        top: Math.round(marginT),
        left: Math.round(marginL),
        right: Math.round(marginR),
      },
      close: {
        top: Math.round(c.top),
        right: Math.round(window.innerWidth - c.right),
        bottom: Math.round(c.bottom),
        left: Math.round(c.left),
        topCss: csC.top,
        rightCss: csC.right,
        fullyVisible:
          c.top >= 0 &&
          c.left >= 0 &&
          c.right <= window.innerWidth &&
          c.bottom <= window.innerHeight,
        insideModal:
          c.top >= m.top - 0.5 &&
          c.right <= m.right + 0.5 &&
          c.left >= m.left - 0.5,
      },
      headTop: Math.round(h.top),
      titleTop: Math.round(t.top),
      titleVisible: t.top >= 0 && t.bottom > 0,
      bodyOverflowY: csB.overflowY,
      grid: {
        display: csG.display,
        cols: csG.gridTemplateColumns,
        personalRows: tops.size,
        cellW: personal[0] ? Math.round(personal[0].getBoundingClientRect().width) : 0,
      },
    };
  });

  const fails = [];
  if (metrics.margins.top < 8) fails.push("modal top margin < 8: " + metrics.margins.top);
  if (metrics.margins.left < 8) fails.push("modal left margin < 8: " + metrics.margins.left);
  if (metrics.margins.right < 8) fails.push("modal right margin < 8: " + metrics.margins.right);
  if (!metrics.close.fullyVisible) fails.push("close not fully visible: " + JSON.stringify(metrics.close));
  if (!metrics.close.insideModal) fails.push("close not inside modal: " + JSON.stringify(metrics.close));
  if (parseFloat(metrics.close.topCss) < 0) fails.push("close still negative top: " + metrics.close.topCss);
  if (!metrics.titleVisible) fails.push("title not visible");
  if (metrics.headTop < 0) fails.push("head clipped top: " + metrics.headTop);
  if (!["auto", "scroll", "overlay"].includes(metrics.bodyOverflowY)) {
    fails.push("body not scrollable: " + metrics.bodyOverflowY);
  }
  if (metrics.grid.display !== "grid") fails.push("grid not grid");
  if (!String(metrics.grid.cols).includes(" ")) fails.push("not 2-col: " + metrics.grid.cols);
  if (metrics.grid.personalRows < 2) fails.push("personal not wrapping to 2+ rows");
  if (metrics.grid.cellW < 120 || metrics.grid.cellW > 200) {
    fails.push("unexpected cell width " + metrics.grid.cellW);
  }

  await page.screenshot({
    path: path.join(outDir, "leasing-modal-mobile-top-after.png"),
    fullPage: false,
  });
  await page.locator(".pl-leasing-modal").screenshot({
    path: path.join(outDir, "leasing-modal-mobile-top-modal.png"),
  });

  console.log(JSON.stringify(metrics, null, 2));
  if (fails.length) {
    console.error("FAIL:\n" + fails.join("\n"));
    process.exit(1);
  }
  console.log("OK leasing modal mobile top fit @ 390x844");
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
