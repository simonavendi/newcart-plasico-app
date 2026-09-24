# -*- coding: utf-8 -*-
"""Verify office map CTA sits inside the matching Speedy/Econt co-option-row."""
from pathlib import Path
import json
import urllib.request

BASE = "http://127.0.0.1:8780"
MEDIA = Path(r"C:\vibe\plasico new cart\.cursor\stores\self\media")
MEDIA.mkdir(parents=True, exist_ok=True)


def fetch(path):
    with urllib.request.urlopen(BASE + path, timeout=10) as r:
        return r.read().decode("utf-8", "replace")


html = fetch("/index.html")
assert "id=office-open-locator" in html
assert "data-office-courier-row=speedy" in html
assert "data-office-courier-row=econt" in html
assert "mountOfficeWidget" in html
# CTA markup must be nested under Speedy option row in source (default checked)
speedy_idx = html.find('data-office-courier-row=speedy')
wrap_idx = html.find('id=office-widget-wrap')
econt_idx = html.find('data-office-courier-row=econt')
assert 0 <= speedy_idx < wrap_idx < econt_idx, (speedy_idx, wrap_idx, econt_idx)
print("markup: office-widget-wrap nested in Speedy co-option-row OK")

from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.goto(BASE + "/index.html", wait_until="domcontentloaded", timeout=60000)

    page.evaluate(
        """() => {
      const r = document.querySelector('input[name="ship_to_id[2]"][value="office"]');
      if (r) { r.checked = true; r.dispatchEvent(new Event('change', {bubbles:true})); }
      const s = document.querySelector('input[name="office_courier"][value="speedy"]');
      if (s) { s.checked = true; s.dispatchEvent(new Event('change', {bubbles:true})); }
    }"""
    )
    page.wait_for_timeout(400)

    place = page.evaluate(
        """() => {
      const btn = document.getElementById('office-open-locator');
      const wrap = document.getElementById('office-widget-wrap');
      const row = wrap && wrap.closest('.co-option-row');
      const radio = row && row.querySelector('input[name="office_courier"]');
      const stack = wrap && wrap.closest('.co-option-stack');
      const belowStack = !!(wrap && stack && !stack.contains(wrap));
      return {
        btnVisible: !!(btn && btn.offsetParent !== null),
        btnText: (btn && btn.innerText || '').replace(/\\s+/g,' ').trim(),
        inOptionRow: !!(row && row.contains(wrap) && row.contains(btn)),
        courier: radio ? radio.value : null,
        rowAttr: row ? row.getAttribute('data-office-courier-row') : null,
        belowStack: belowStack,
        parentIsRow: !!(wrap && wrap.parentElement && wrap.parentElement.classList.contains('co-option-row'))
      };
    }"""
    )
    print("speedy placement:", json.dumps(place, ensure_ascii=False))
    assert place["btnVisible"]
    assert "Избери офис от карта" in place["btnText"]
    assert place["inOptionRow"] and place["parentIsRow"]
    assert place["courier"] == "speedy"
    assert place["rowAttr"] == "speedy"
    assert not place["belowStack"]

    page.locator('[data-ship-panel=office] .co-option-stack').screenshot(
        path=str(MEDIA / "office-cta-in-speedy-option.png")
    )

    page.click("#office-open-locator")
    page.wait_for_selector("#office-fullscreen-root iframe", timeout=8000)
    src = page.get_attribute("#office-fullscreen-root iframe", "src") or ""
    assert "speedy.bg" in src, src
    print("map open OK (speedy)")

    selected = page.evaluate(
        """() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: {
          id: 17,
          name: "АСЕНОВГРАД",
          address: { fullAddressString: "гр. АСЕНОВГРАД [4230] ул. ГОЦЕ ДЕЛЧЕВ No 9А" }
        },
        origin: "https://services.speedy.bg",
        source: window
      }));
      const wrap = document.getElementById('office-widget-wrap');
      const row = wrap && wrap.closest('.co-option-row');
      return {
        overlayGone: !document.getElementById('office-fullscreen-root'),
        name: (document.getElementById('office-selected-name') || {}).textContent || '',
        change: (document.getElementById('office-change-locator') || {}).textContent || '',
        isSelected: wrap && wrap.classList.contains('is-selected'),
        summaryInRow: !!(row && row.querySelector('#office-selected') && !document.getElementById('office-selected').hidden),
        launchHidden: !!(wrap && wrap.classList.contains('is-selected'))
      };
    }"""
    )
    print("after select:", json.dumps(selected, ensure_ascii=False))
    assert selected["overlayGone"]
    assert selected["name"] == "АСЕНОВГРАД"
    assert "Смени" in selected["change"]
    assert selected["isSelected"] and selected["summaryInRow"]

    page.locator('[data-ship-panel=office] .co-option-stack').screenshot(
        path=str(MEDIA / "office-summary-in-speedy-option.png")
    )

    # Смени reopens map
    page.click("#office-change-locator")
    page.wait_for_selector("#office-fullscreen-root iframe", timeout=8000)
    print("Смени reopens map OK")
    page.evaluate("() => { const c=document.querySelector('.office-fullscreen__close'); if(c) c.click(); }")
    page.wait_for_timeout(200)

    # Switch to Econt — CTA moves into Econt row
    page.evaluate(
        """() => {
      const r = document.querySelector('input[name="office_courier"][value="econt"]');
      if (r) { r.checked = true; r.dispatchEvent(new Event('change', {bubbles:true})); }
    }"""
    )
    page.wait_for_timeout(300)

    eplace = page.evaluate(
        """() => {
      const wrap = document.getElementById('office-widget-wrap');
      const btn = document.getElementById('office-open-locator');
      const row = wrap && wrap.closest('.co-option-row');
      const radio = row && row.querySelector('input[name="office_courier"]');
      const speedyRow = document.querySelector('[data-office-courier-row=speedy]');
      return {
        courier: radio ? radio.value : null,
        rowAttr: row ? row.getAttribute('data-office-courier-row') : null,
        parentIsRow: !!(wrap && wrap.parentElement && wrap.parentElement.classList.contains('co-option-row')),
        btnVisible: !!(btn && btn.offsetParent !== null),
        btnText: (btn && btn.innerText || '').replace(/\\s+/g,' ').trim(),
        speedyHasWrap: !!(speedyRow && speedyRow.contains(wrap)),
        isSelected: wrap && wrap.classList.contains('is-selected'),
        selectedHidden: !!(document.getElementById('office-selected') && document.getElementById('office-selected').hidden)
      };
    }"""
    )
    print("econt placement:", json.dumps(eplace, ensure_ascii=False))
    assert eplace["courier"] == "econt"
    assert eplace["rowAttr"] == "econt"
    assert eplace["parentIsRow"]
    assert eplace["btnVisible"]
    assert "Избери офис от карта" in eplace["btnText"]
    assert not eplace["speedyHasWrap"]
    assert not eplace["isSelected"]
    assert eplace["selectedHidden"]

    page.locator('[data-ship-panel=office] .co-option-stack').screenshot(
        path=str(MEDIA / "office-cta-in-econt-option.png")
    )

    page.click("#office-open-locator")
    page.wait_for_selector("#office-fullscreen-root iframe", timeout=8000)
    esrc = page.get_attribute("#office-fullscreen-root iframe", "src") or ""
    assert "econt.com" in esrc, esrc
    print("map open OK (econt)")

    browser.close()

print("PASS office map CTA in option row")
