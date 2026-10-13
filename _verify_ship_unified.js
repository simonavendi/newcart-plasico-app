/**
 * Smoke: unified Доставка accordion — panels under selected row; 4-step stepper; map CTAs.
 * Usage: node _verify_ship_unified.js [baseUrl]
 */
const { chromium } = require("playwright");

const BASE = process.argv[2] || "http://127.0.0.1:8780/index.html";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MODES = [
  { value: "boxnow", panel: "boxnow", title: "До автомат", mapBtn: "#boxnow-open-locator" },
  { value: "office", panel: "office", title: "До офис", mapBtn: "#office-open-locator" },
  { value: "1", panel: "address", title: "До адрес", mapBtn: null },
  { value: "store", panel: "store", title: "До магазин", mapBtn: null },
];

async function assertPanelUnderRow(page, panelKey) {
  return page.evaluate((key) => {
    const panel = document.querySelector(`[data-ship-panel="${key}"]`);
    const host = document.querySelector(`[data-ship-expand="${key}"]`);
    const row = document.querySelector(`[data-ship-mode="${key}"]`);
    if (!panel || !host || !row) {
      return { ok: false, reason: "missing nodes", panel: !!panel, host: !!host, row: !!row };
    }
    const visible =
      !panel.hasAttribute("hidden") &&
      !panel.classList.contains("hide") &&
      !host.hasAttribute("hidden");
    const under = host.contains(panel) && row.contains(host);
    const cs = getComputedStyle(host);
    const hostShown = cs.display !== "none" && cs.visibility !== "hidden";
    return { ok: visible && under && hostShown, visible, under, hostShown };
  }, panelKey);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];

  async function runViewport(width, height, label) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(400);

    const stepper = await page.evaluate(() => {
      const steps = document.getElementById("checkout-steps");
      if (!steps) return { ok: false, reason: "no #checkout-steps" };
      const links = [...steps.querySelectorAll("a")].map((a) => ({
        href: a.getAttribute("href"),
        n: (a.querySelector(".circle") || {}).textContent,
        label: (a.querySelector("p") || {}).textContent,
      }));
      const hasDetails = links.some((l) => (l.href || "").includes("ship-details"));
      const hasDostavka = links.some((l) => (l.label || "").includes("Доставка"));
      return {
        ok: links.length === 4 && !hasDetails && hasDostavka,
        links,
        hasDetails,
        hasDostavka,
      };
    });
    if (!stepper.ok) errors.push(`[${label}] stepper ${JSON.stringify(stepper)}`);

    const noDetailsSection = await page.evaluate(
      () => !document.getElementById("step-ship-details")
    );
    if (!noDetailsSection) errors.push(`[${label}] #step-ship-details still present`);

    for (const mode of MODES) {
      const radio = page.locator(`input[name="ship_to_id[2]"][value="${mode.value}"]`);
      const count = await radio.count();
      if (!count) {
        errors.push(`[${label}] missing radio ${mode.value}`);
        continue;
      }
      const disabled = await radio.first().isDisabled();
      if (disabled) {
        console.log(`[${label}] skip disabled mode ${mode.value}`);
        continue;
      }
      await radio.first().check({ force: true });
      await sleep(250);

      const placed = await assertPanelUnderRow(page, mode.panel);
      if (!placed.ok) {
        errors.push(`[${label}] panel ${mode.panel} not under row: ${JSON.stringify(placed)}`);
      }

      if (mode.mapBtn) {
        const btn = page.locator(mode.mapBtn);
        const vis = await btn.isVisible().catch(() => false);
        if (!vis) {
          errors.push(`[${label}] map CTA ${mode.mapBtn} not visible for ${mode.panel}`);
        } else {
          // Click should not throw; widget may open overlay — just ensure clickable
          const box = await btn.boundingBox();
          if (!box || box.height < 8) {
            errors.push(`[${label}] map CTA ${mode.mapBtn} has no size`);
          }
        }
      }

      // Inactive ship expands must not show BOX NOW locker UI
      if (mode.panel !== "boxnow") {
        const leak = await page.evaluate(() => {
          const wrap = document.getElementById("boxnow-widget-wrap");
          if (!wrap) return { ok: true };
          const cs = getComputedStyle(wrap);
          const r = wrap.getBoundingClientRect();
          const shown = cs.display !== "none" && r.height > 1 && r.width > 1;
          return { ok: !shown, display: cs.display, h: Math.round(r.height) };
        });
        if (!leak.ok) {
          errors.push(`[${label}] boxnow widget visible under ${mode.panel}: ${JSON.stringify(leak)}`);
        }
      }
    }

    // Nested locker: BOX NOW widget must collapse when Speedy locker selected
    const boxRadio = page.locator('input[name="ship_to_id[2]"][value="boxnow"]');
    if ((await boxRadio.count()) && !(await boxRadio.isDisabled())) {
      await page.evaluate(() => {
        const r = document.querySelector('input[name="ship_to_id[2]"][value="boxnow"]');
        if (!r || r.checked) return;
        r.checked = true;
        r.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await sleep(200);
      const speedyLc = page.locator('input[name="locker_courier"][value="speedy"]');
      if (await speedyLc.count()) {
        await page.evaluate(() => {
          const r = document.querySelector('input[name="locker_courier"][value="speedy"]');
          if (!r) return;
          r.checked = true;
          r.dispatchEvent(new Event("change", { bubbles: true }));
        });
        await sleep(250);
        const nested = await page.evaluate(() => {
          const wrap = document.getElementById("boxnow-widget-wrap");
          const row = document.querySelector('[data-locker-courier-row="boxnow"]');
          const cs = wrap ? getComputedStyle(wrap) : null;
          const search = document.querySelector(
            '[data-locker-courier-row="boxnow"] #boxnow-search-wrap, [data-locker-courier-row="boxnow"] .office-search'
          );
          const searchShown = search
            ? getComputedStyle(search).display !== "none" &&
              search.getBoundingClientRect().height > 1
            : false;
          return {
            wrapDisplay: cs && cs.display,
            boxRowH: row ? Math.round(row.getBoundingClientRect().height) : null,
            searchShown,
          };
        });
        if (nested.wrapDisplay !== "none" || nested.searchShown) {
          errors.push(
            `[${label}] BOX NOW widget still expanded under Speedy locker: ${JSON.stringify(nested)}`
          );
        }
      }
    }

    await page.close();
  }

  try {
    await runViewport(1280, 900, "desktop");
    await runViewport(390, 844, "mobile390");
  } finally {
    await browser.close();
  }

  if (errors.length) {
    console.error("FAIL");
    errors.forEach((e) => console.error(e));
    process.exit(1);
  }
  console.log("PASS ship unified accordion @", BASE);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
