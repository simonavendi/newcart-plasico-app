const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = 8794;

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      if (urlPath === "/") urlPath = "/poruchka.html";
      const filePath = path.join(ROOT, urlPath.replace(/^\//, ""));
      if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      fs.createReadStream(filePath).pipe(res);
    });
    server.once("error", reject);
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`http://127.0.0.1:${PORT}/poruchka.html`, {
    waitUntil: "domcontentloaded",
  });
  await page.evaluate(() => {
    const r = document.querySelector('input[name="ship_to_id[2]"][value="boxnow"]');
    if (r) {
      r.checked = true;
      r.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  await page.click("#boxnow-open-locator");
  await page.waitForSelector("#boxnow-fullscreen-root", { timeout: 10000 });

  // 1) afterSelect (widget callback) must autoclose host overlay — no Escape.
  await page.evaluate(() => {
    window._bn_map_widget_config.afterSelect({
      boxnowLockerId: "99999",
      boxnowLockerAddressLine1: "Test Addr 1",
      boxnowLockerPostalCode: "1000",
    });
  });
  await page.waitForTimeout(150);

  const afterCallback = await page.evaluate(() => ({
    id: document.getElementById("boxnow-locker-id").value,
    addr: document.getElementById("boxnow-locker-address").value,
    zip: document.getElementById("boxnow-locker-postal").value,
    rootGone: !document.getElementById("boxnow-fullscreen-root"),
    lockGone: !document.documentElement.classList.contains("boxnow-locator-open"),
    text: (document.getElementById("boxnow-selected-text") || {}).textContent || "",
    selectedVisible: !!(
      document.getElementById("boxnow-selected") &&
      !document.getElementById("boxnow-selected").hidden
    ),
    srcHasAutoclose: !!(
      window._bn_map_widget_config &&
      window._bn_map_widget_config.autoclose === true
    ),
  }));
  console.log("afterSelect path:", JSON.stringify(afterCallback, null, 2));

  if (
    afterCallback.id !== "99999" ||
    afterCallback.zip !== "1000" ||
    !afterCallback.rootGone ||
    !afterCallback.lockGone ||
    !afterCallback.selectedVisible
  ) {
    console.error("SELECTION FAIL (afterSelect autoclose)");
    await browser.close();
    server.close();
    process.exit(1);
  }

  // 2) Re-open via Смени and simulate real postMessage from map.boxnow.bg
  await page.click("#boxnow-change-locker");
  await page.waitForSelector("#boxnow-fullscreen-root", { timeout: 10000 });

  await page.evaluate(() => {
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "https://map.boxnow.bg",
        data: {
          boxnowLockerId: "88888",
          boxnowLockerAddressLine1: "PostMsg Addr",
          boxnowLockerPostalCode: "4000",
        },
      })
    );
  });
  await page.waitForTimeout(150);

  const afterPost = await page.evaluate(() => ({
    id: document.getElementById("boxnow-locker-id").value,
    addr: document.getElementById("boxnow-locker-address").value,
    zip: document.getElementById("boxnow-locker-postal").value,
    rootGone: !document.getElementById("boxnow-fullscreen-root"),
    lockGone: !document.documentElement.classList.contains("boxnow-locator-open"),
    text: (document.getElementById("boxnow-selected-text") || {}).textContent || "",
  }));
  console.log("postMessage path:", JSON.stringify(afterPost, null, 2));

  // 3) Confirm iframe URL carries popup.html + autoclose=yes when opened
  await page.click("#boxnow-change-locker");
  await page.waitForSelector("#boxnow-fullscreen-root iframe", { timeout: 10000 });
  const src = await page.getAttribute("#boxnow-fullscreen-root iframe", "src");
  console.log("iframe src:", src);
  const srcOk =
    src &&
    src.includes("popup.html") &&
    src.includes("partnerId=18248") &&
    src.includes("autoclose=yes");

  await browser.close();
  server.close();

  if (
    afterPost.id === "88888" &&
    afterPost.zip === "4000" &&
    afterPost.rootGone &&
    afterPost.lockGone &&
    srcOk
  ) {
    console.log("SELECTION OK (autoclose + return to cart)");
  } else {
    console.error("SELECTION FAIL (postMessage / src)");
    process.exit(1);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
