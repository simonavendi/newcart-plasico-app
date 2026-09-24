const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = 8791;
const OUT_DIR = "C:\\cursor\\stores\\self\\media";
const REPO_MEDIA = path.join(ROOT, ".cursor", "stores", "self", "media");
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(REPO_MEDIA, { recursive: true });

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      if (urlPath === "/") urlPath = "/index.html";
      const filePath = path.join(ROOT, urlPath.replace(/^\//, ""));
      if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const types = {
        ".html": "text/html; charset=utf-8",
        ".js": "application/javascript",
        ".css": "text/css",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".woff2": "font/woff2",
      };
      res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
      fs.createReadStream(filePath).pipe(res);
    });
    server.once("error", reject);
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

(async () => {
  let server = null;
  try {
    server = await startServer();
  } catch (err) {
    if (err && err.code === "EADDRINUSE") {
      console.log("Using existing server on 8780");
    } else {
      throw err;
    }
  }
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
    await page.goto(`http://127.0.0.1:${PORT}/poruchka.html`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.evaluate(() => {
      const r = document.querySelector('input[name="ship_to_id[2]"][value="boxnow"]');
      if (r) {
        r.checked = true;
        r.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await page.waitForTimeout(400);
    await page.click("#boxnow-open-locator");
    await page.waitForSelector("#boxnow-fullscreen-root", { timeout: 15000 });
    await page.waitForTimeout(3000);

    const root = page.locator("#boxnow-fullscreen-root");
    const iframe = page.locator("#boxnow-fullscreen-root iframe");
    const box = await root.boundingBox();
    const iframeBox = await iframe.boundingBox();
    const src = (await iframe.getAttribute("src")) || "";
    const style = await page.evaluate(() => {
      const el = document.getElementById("boxnow-fullscreen-root");
      const cs = getComputedStyle(el);
      return {
        position: cs.position,
        top: cs.top,
        left: cs.left,
        width: cs.width,
        height: cs.height,
        zIndex: cs.zIndex,
      };
    });

    const okSrc = src.includes("popup.html") && !src.includes("iframe.html");
    const okPartner = src.includes("partnerId=18248");
    const okFull =
      box &&
      Math.abs(box.x) < 2 &&
      Math.abs(box.y) < 2 &&
      Math.abs(box.width - width) < 4 &&
      Math.abs(box.height - height) < 4;
    const okIframe =
      iframeBox &&
      Math.abs(iframeBox.width - width) < 4 &&
      Math.abs(iframeBox.height - height) < 4;

    const shot = path.join(OUT_DIR, `boxnow-fullscreen-${label}.png`);
    await page.screenshot({ path: shot, fullPage: false });
    if (label === "mobile") {
      await page.screenshot({ path: path.join(OUT_DIR, "boxnow-fullscreen.png"), fullPage: false });
      await page.screenshot({
        path: path.join(REPO_MEDIA, "boxnow-fullscreen.png"),
        fullPage: false,
      });
    }

    const row = {
      label,
      viewport: `${width}x${height}`,
      src_ok: okSrc,
      partner_ok: okPartner,
      root_full: !!okFull,
      iframe_full: !!okIframe,
      src: src.slice(0, 180),
      root_box: box,
      iframe_box: iframeBox,
      style,
      shot,
    };
    results.push(row);
    console.log(JSON.stringify(row, null, 2));
    await context.close();
  }

  await browser.close();
  if (server) server.close();

  const failed = results.filter(
    (r) => !(r.src_ok && r.partner_ok && r.root_full && r.iframe_full)
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
