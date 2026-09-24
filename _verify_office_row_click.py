# -*- coding: utf-8 -*-
"""Verify Econt/Speedy office courier rows are clickable; placeholder text."""
from pathlib import Path
import urllib.request

BASE = "http://127.0.0.1:8780"


def main():
    html = Path("index.html").read_text(encoding="utf-8")
    assert 'placeholder="Град, име или адрес на офис"' in html
    assert "bindOfficeCourierRowClick" in html
    assert "cursor:pointer" in html
    served = urllib.request.urlopen(BASE + "/index.html", timeout=10).read().decode(
        "utf-8", "replace"
    )
    assert "bindOfficeCourierRowClick" in served, "server stale — restart :8780"
    assert 'placeholder="Град, име или адрес на офис"' in served

    from playwright.sync_api import sync_playwright

    out = Path(".cursor/stores/self/media")
    out.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.goto(BASE + "/index.html", wait_until="domcontentloaded", timeout=60000)
        page.evaluate(
            """() => {
          const r = document.querySelector('input[name="ship_to_id[2]"][value="office"]');
          if (r) { r.checked = true; r.dispatchEvent(new Event('change', {bubbles:true})); }
        }"""
        )
        page.wait_for_timeout(400)

        econt = page.locator('.co-option-row[data-office-courier-row="econt"]')
        speedy = page.locator('.co-option-row[data-office-courier-row="speedy"]')
        econt_radio = econt.locator('input[name="office_courier"]')
        speedy_radio = speedy.locator('input[name="office_courier"]')
        assert speedy_radio.is_checked()

        # Click Econt row (title/label area) — radios are visually hidden
        econt.locator("label.co-option-row__select").click()
        page.wait_for_timeout(350)
        assert econt_radio.is_checked(), "Econt radio not checked after label click"
        assert econt.evaluate("el => el.classList.contains('clicked')")
        assert not speedy.evaluate("el => el.classList.contains('clicked')")
        # Widget remounted into Econt
        assert econt.locator("#office-search-input").is_visible()
        assert econt.locator("#office-open-locator").is_visible()
        ph = econt.locator("#office-search-input").get_attribute("placeholder")
        assert ph == "Град, име или адрес на офис", ph
        print("OK Econt label click → selected + widget")

        # Click Speedy price area (outside label) — row click handler
        speedy.locator(".co-option-row__price").click()
        page.wait_for_timeout(350)
        assert speedy_radio.is_checked()
        assert speedy.evaluate("el => el.classList.contains('clicked')")
        assert not econt.evaluate("el => el.classList.contains('clicked')")
        assert speedy.locator("#office-search-input").is_visible()
        print("OK Speedy price click → selected + widget")

        # Click Econt hint (outside label)
        econt.locator(".co-option-row__hint").click()
        page.wait_for_timeout(350)
        assert econt_radio.is_checked()
        print("OK Econt hint click")

        # Also click Econt logo via force (pointer-events none on title children)
        speedy.locator(".co-option-row__price").click()
        page.wait_for_timeout(200)
        econt.locator(".co-option-row__logo").click(force=True)
        page.wait_for_timeout(350)
        assert econt_radio.is_checked(), "Econt not selected after logo force-click"
        print("OK Econt logo force click")

        # Interactive controls still work (search / map CTA not swallowed)
        econt.locator("#office-search-input").click()
        econt.locator("#office-search-input").fill("София")
        page.wait_for_timeout(1000)
        page.wait_for_selector("#office-search-list:not([hidden])", timeout=20000)
        print("OK typeahead still works on Econt")

        page.locator('[data-ship-panel="office"]').screenshot(
            path=str(out / "office-econt-row-selected.png")
        )
        # Click map CTA
        econt.locator("#office-open-locator").click()
        page.wait_for_selector("#office-fullscreen-root", timeout=10000)
        print("OK map CTA click")
        page.locator(".office-fullscreen__close").click()

        browser.close()
    print("PASS")


if __name__ == "__main__":
    main()
