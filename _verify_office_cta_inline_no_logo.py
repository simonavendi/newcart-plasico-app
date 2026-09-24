# -*- coding: utf-8 -*-
"""Verify #office-open-locator is logo-free and inline with Speedy/Econt titles."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
MEDIA = ROOT / ".cursor" / "stores" / "self" / "media"
MEDIA.mkdir(parents=True, exist_ok=True)
BASE = "http://127.0.0.1:8780/index.html"

for name in ("index.html", "poruchka.html"):
    html = (ROOT / name).read_text(encoding="utf-8")
    assert "id=office-open-locator>Избери офис от карта</button>" in html, name
    assert "office-launch-logo" not in html, name
    assert "office-courier-row__body" in html, name
    assert "display:contents" in html, name


def open_office_panel(page):
    page.goto(BASE, wait_until="domcontentloaded")
    page.evaluate(
        """() => {
      const office = document.querySelector('input[name="ship_to_id[2]"][value="office"]');
      if (office) { office.checked = true; office.dispatchEvent(new Event('change', {bubbles:true})); office.click(); }
      const panel = document.querySelector('[data-ship-panel=office]');
      if (panel) { panel.hidden = false; panel.classList.remove('hide','sf-hidden'); }
      const step = document.getElementById('step-ship-details');
      if (step) { step.hidden = false; step.classList.remove('hide','sf-hidden'); }
    }"""
    )
    page.wait_for_timeout(300)


def assert_inline(page, courier):
    metrics = page.evaluate(
        """(courier) => {
      const radio = document.querySelector('input[name="office_courier"][value="'+courier+'"]');
      if (radio && !radio.checked) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', {bubbles:true}));
        radio.click();
      }
      const btn = document.getElementById('office-open-locator');
      const title = document.querySelector(
        '.co-option-row[data-office-courier-row="'+courier+'"] .co-option-row__title'
      );
      const row = document.querySelector('.co-option-row[data-office-courier-row="'+courier+'"]');
      if (!btn || !title || !row) return {ok:false, reason:'missing nodes'};
      const br = btn.getBoundingClientRect();
      const tr = title.getBoundingClientRect();
      const sameLine = Math.abs((tr.top + tr.height/2) - (br.top + br.height/2)) < 18;
      const hasImg = !!btn.querySelector('img');
      const parentRow = btn.closest('[data-office-courier-row]');
      return {
        ok: true,
        sameLine,
        hasImg,
        btnText: (btn.textContent || '').trim(),
        parentCourier: parentRow && parentRow.getAttribute('data-office-courier-row'),
        titleY: tr.top + tr.height/2,
        btnY: br.top + br.height/2,
        btnW: br.width,
        titleW: tr.width,
        rowW: row.getBoundingClientRect().width
      };
    }""",
        courier,
    )
    assert metrics.get("ok"), metrics
    assert metrics["btnText"] == "Избери офис от карта", metrics
    assert not metrics["hasImg"], metrics
    assert metrics["parentCourier"] == courier, metrics
    assert metrics["sameLine"], metrics
    # Compact CTA — not a full-width row under the option
    assert metrics["btnW"] < metrics["rowW"] * 0.75, metrics
    return metrics


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1100, "height": 900})
    open_office_panel(page)

    speedy = assert_inline(page, "speedy")
    page.locator('[data-office-courier-row=speedy]').screenshot(
        path=str(MEDIA / "office-cta-inline-speedy.png")
    )
    print("speedy", speedy)

    page.locator("#office-open-locator").click()
    page.wait_for_timeout(800)
    root = page.locator("#office-fullscreen-root")
    assert root.count() and root.is_visible(), "Speedy map did not open"
    page.screenshot(path=str(MEDIA / "office-cta-inline-speedy-map.png"), full_page=False)
    page.evaluate(
        """() => {
      const close = document.querySelector('#office-fullscreen-root .office-fullscreen__close, #office-fullscreen-root button');
      if (close) close.click();
      const root = document.getElementById('office-fullscreen-root');
      if (root) root.remove();
      document.documentElement.classList.remove('office-locator-open');
    }"""
    )
    page.wait_for_timeout(200)

    econt = assert_inline(page, "econt")
    page.locator('[data-office-courier-row=econt]').screenshot(
        path=str(MEDIA / "office-cta-inline-econt.png")
    )
    print("econt", econt)

    page.locator("#office-open-locator").click()
    page.wait_for_timeout(800)
    root = page.locator("#office-fullscreen-root")
    assert root.count() and root.is_visible(), "Econt map did not open"
    page.screenshot(path=str(MEDIA / "office-cta-inline-econt-map.png"), full_page=False)

    browser.close()

print("PASS")
