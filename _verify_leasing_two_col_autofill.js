const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

(async () => {
  const outDir = path.join(__dirname, ".cursor/stores/self/media");
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.goto("http://127.0.0.1:8780/index.html", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.evaluate(() => {
    localStorage.setItem(
      "plasico-hss2026-cart",
      JSON.stringify([{ id: "t", title: "Test", price: 499.99, qty: 1 }])
    );
    sessionStorage.removeItem("plasico-leasing-apply");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);

  // --- Autofill path A: fields filled before open ---
  await page.fill("#field-name", "Иван Петров");
  await page.fill("#field-phone", "0888123456");
  await page.fill("#field-email", "ivan.petrov@example.com");

  const opened = await page.evaluate(() => {
    window.PlasicoLeasing.open({ column: "personal" });
    return {
      ok: !document.getElementById("pl-leasing-overlay").hidden,
      name: document.getElementById("pl-leasing-name").value,
      phone: document.getElementById("pl-leasing-phone").value,
      email: document.getElementById("pl-leasing-email").value,
      egn: document.getElementById("pl-leasing-egn").value,
    };
  });
  if (!opened.ok) throw new Error("modal did not open");
  if (opened.name !== "Иван Петров") throw new Error("prefill name fail: " + opened.name);
  if (opened.phone !== "0888123456") throw new Error("prefill phone fail");
  if (opened.email !== "ivan.petrov@example.com") throw new Error("prefill email fail");
  if (opened.egn !== "") throw new Error("egn should stay empty");

  // Do not overwrite typed apply values
  await page.fill("#pl-leasing-name", "Ръчно Име");
  await page.evaluate(() => {
    document.getElementById("field-name").value = "Друго Име";
    document.getElementById("field-name").dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForTimeout(100);
  const kept = await page.evaluate(() => document.getElementById("pl-leasing-name").value);
  if (kept !== "Ръчно Име") throw new Error("overwrote typed name: " + kept);

  await page.evaluate(() => window.PlasicoLeasing.close());

  // --- Autofill path B: open empty, then fill checkout (Simona repro) ---
  await page.evaluate(() => {
    document.getElementById("field-name").value = "";
    document.getElementById("field-phone").value = "";
    document.getElementById("field-email").value = "";
    ["pl-leasing-name", "pl-leasing-phone", "pl-leasing-email", "pl-leasing-egn"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    window.PlasicoLeasing.open({ column: "personal" });
  });
  await page.waitForTimeout(200);
  await page.fill("#field-name", "Мария Георгиева");
  await page.fill("#field-phone", "0888999888");
  await page.fill("#field-email", "maria@example.com");
  await page.waitForTimeout(150);
  const late = await page.evaluate(() => ({
    name: document.getElementById("pl-leasing-name").value,
    phone: document.getElementById("pl-leasing-phone").value,
    email: document.getElementById("pl-leasing-email").value,
  }));
  if (late.name !== "Мария Георгиева") throw new Error("late autofill name: " + late.name);
  if (late.phone !== "0888999888") throw new Error("late autofill phone");
  if (late.email !== "maria@example.com") throw new Error("late autofill email");

  // Scroll apply into view (IntersectionObserver path) + screenshot
  await page.locator("#pl-leasing-apply").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.locator("#pl-leasing-apply").screenshot({
    path: path.join(outDir, "leasing-autofill-from-cart.png"),
  });

  // --- Two-column mobile grid ---
  await page.locator(".pl-leasing-grid-wrap").scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const grid = await page.evaluate(() => {
    const g = document.getElementById("pl-leasing-grid");
    const cs = getComputedStyle(g);
    const cells = [...g.querySelectorAll(".pl-leasing-cell:not(.pl-leasing-cell--empty)")];
    const personal = cells.filter((c) => c.dataset.column === "personal");
    const postbank = cells.filter((c) => c.dataset.column === "postbank");
    const tops = (arr) => new Set(arr.map((c) => Math.round(c.getBoundingClientRect().top))).size;
    return {
      display: cs.display,
      cols: cs.gridTemplateColumns,
      personalCount: personal.length,
      personalRows: tops(personal),
      postbankCount: postbank.length,
      postbankRows: tops(postbank),
      cellW: personal[0] ? Math.round(personal[0].getBoundingClientRect().width) : 0,
    };
  });
  if (grid.display !== "grid") throw new Error("grid not display:grid " + grid.display);
  if (!String(grid.cols).includes(" ")) throw new Error("not 2 cols: " + grid.cols);
  if (grid.personalRows < 2) throw new Error("personal should wrap to 2+ rows in 2-col: " + JSON.stringify(grid));
  if (grid.cellW < 120 || grid.cellW > 200) throw new Error("unexpected cell width " + grid.cellW);

  await page.locator(".pl-leasing-grid-wrap").screenshot({
    path: path.join(outDir, "leasing-two-col-mobile.png"),
  });
  await page.locator(".pl-leasing-modal").screenshot({
    path: path.join(outDir, "leasing-modal-mobile-390.png"),
  });

  console.log(JSON.stringify({ opened, late, grid, ok: true }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
