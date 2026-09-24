const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

(async () => {
  const outDir = path.join(__dirname, ".cursor/stores/self/media");
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto("http://127.0.0.1:8780/index.html", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(600);

  await page.evaluate(() => {
    const key = "plasico-hss2026-cart";
    localStorage.setItem(
      key,
      JSON.stringify([{ id: "cyr-test", title: "Test", price: 299.99, qty: 1 }])
    );
    sessionStorage.removeItem("plasico-leasing-apply");
    window.dispatchEvent(new Event("plasico:cart-updated"));
    if (window.PlasicoLeasing && window.PlasicoLeasing.refresh) {
      window.PlasicoLeasing.refresh();
    }
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);

  // Latin name must NOT autofill into #pl-leasing-name; phone/email still do
  await page.fill("#field-name", "John Smith");
  await page.fill("#field-phone", "0888123456");
  await page.fill("#field-email", "john@example.com");

  const openedLatin = await page.evaluate(() => {
    window.PlasicoLeasing.open({ column: "personal" });
    const overlay = document.getElementById("pl-leasing-overlay");
    return !!(overlay && !overlay.hidden);
  });
  if (!openedLatin) throw new Error("Modal did not open (latin)");
  await page.waitForTimeout(400);

  const latin = await page.evaluate(() => ({
    name: document.getElementById("pl-leasing-name")?.value || "",
    phone: document.getElementById("pl-leasing-phone")?.value || "",
    email: document.getElementById("pl-leasing-email")?.value || "",
    namePh: document.getElementById("pl-leasing-name")?.placeholder || "",
    phonePh: document.getElementById("pl-leasing-phone")?.placeholder || "",
    egnPh: document.getElementById("pl-leasing-egn")?.placeholder || "",
    emailPh: document.getElementById("pl-leasing-email")?.placeholder || "",
  }));

  const passLatinSkip =
    latin.name === "" &&
    latin.phone === "0888123456" &&
    latin.email === "john@example.com";

  const passPlaceholders =
    latin.namePh === "Име и фамилия ... (задължително на кирилица)" &&
    latin.phonePh === "Телефон за контакти ... (започващ с нула)" &&
    latin.egnPh === "ЕГН ..." &&
    latin.emailPh === "Ел. поща ...";

  await page.locator("#pl-leasing-apply").scrollIntoViewIfNeeded();
  await page.locator("#pl-leasing-apply").screenshot({
    path: path.join(outDir, "leasing-name-latin-no-autofill.png"),
  });

  // Cyrillic name SHOULD autofill
  await page.evaluate(() => {
    window.PlasicoLeasing.close();
    document.getElementById("pl-leasing-name").value = "";
    document.getElementById("pl-leasing-phone").value = "";
    document.getElementById("pl-leasing-email").value = "";
    sessionStorage.removeItem("plasico-leasing-apply");
  });
  await page.fill("#field-name", "Иван Петров");
  await page.evaluate(() => {
    window.PlasicoLeasing.open({ column: "personal" });
  });
  await page.waitForTimeout(400);

  const cyr = await page.evaluate(() => ({
    name: document.getElementById("pl-leasing-name")?.value || "",
    phone: document.getElementById("pl-leasing-phone")?.value || "",
    email: document.getElementById("pl-leasing-email")?.value || "",
  }));

  const passCyrillic =
    cyr.name === "Иван Петров" &&
    cyr.phone === "0888123456" &&
    cyr.email === "john@example.com";

  await page.locator("#pl-leasing-apply").scrollIntoViewIfNeeded();
  await page.locator("#pl-leasing-apply").screenshot({
    path: path.join(outDir, "leasing-name-cyrillic-autofill.png"),
  });

  const result = {
    passLatinSkip,
    latin,
    passCyrillic,
    cyr,
    passPlaceholders,
    allPass: passLatinSkip && passCyrillic && passPlaceholders,
  };
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
  if (!result.allPass) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
