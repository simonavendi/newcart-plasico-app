# -*- coding: utf-8 -*-
"""Inline #office-open-locator with Speedy/Econt title; remove carrier logos from CTA."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FILES = [ROOT / "index.html", ROOT / "poruchka.html"]

OLD_CSS = """/* Office locators (Speedy / Econt) — map CTA inside courier row, outside <label> */
#checkout .office-widget-panel{width:100%;margin:12px 0;box-sizing:border-box}
#checkout .co-option-row > .office-widget-panel{display:block;margin:10px 0 0;clear:both}
#checkout .office-widget-panel.is-selected .office-widget-launch{display:none!important}
#checkout .co-option-row > .office-widget-panel .boxnow-selected{margin-top:0}
#checkout [data-ship-panel=office] .co-option-row__select{display:block;cursor:pointer}
#checkout [data-ship-panel=office] .co-option-row__select > input[type=radio]{margin-right:8px;vertical-align:top}"""

NEW_CSS = """/* Office locators (Speedy / Econt) — CTA inline with title, no logo in button */
#checkout .co-option-row[data-office-courier-row]{cursor:default}
#checkout .office-courier-row__body{
  display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;width:100%
}
#checkout .office-courier-row__body > .co-option-row__select{
  order:1;display:inline-flex;align-items:center;gap:8px;cursor:pointer;min-width:0;flex:0 1 auto
}
#checkout .office-courier-row__body > .co-option-row__price{
  order:3;margin-left:auto;flex:0 0 auto;align-self:center
}
#checkout .office-courier-row__body > .co-option-row__hint{
  order:4;flex:1 0 100%;margin-top:0
}
#checkout .office-widget-panel{display:contents}
#checkout .office-widget-panel.is-selected .office-widget-launch{display:none!important}
#checkout .office-widget-launch{
  order:2;display:inline-flex;align-items:center;justify-content:center;
  width:auto;max-width:100%;margin:0;padding:6px 12px;text-align:center;cursor:pointer;
  white-space:nowrap;background:#fff;border:1px solid #e0e0e0;border-radius:6px;color:#000;
  font:inherit;font-size:13px;font-weight:600;line-height:1.3;box-sizing:border-box;
  transition:border-color .15s,box-shadow .15s
}
#checkout .office-widget-launch:hover{border-color:#bbb;box-shadow:0 1px 4px rgba(0,0,0,.06)}
#checkout .office-widget-launch:focus-visible{outline:2px solid #000;outline-offset:2px}
#checkout .office-widget-launch.is-error{border-color:#dc2626}
#checkout .office-selected{order:5;flex:1 0 100%;margin-top:6px}
#checkout [data-ship-panel=office] .co-option-row__select > input[type=radio]{margin-right:8px;vertical-align:top}"""

OLD_LOGO_CSS = """#checkout .office-widget-launch__logo[hidden],
#checkout .boxnow-selected__heading-logo[hidden]{display:none!important}"""

NEW_LOGO_CSS = """#checkout .boxnow-selected__heading-logo[hidden]{display:none!important}"""

OLD_HTML = """<div class="co-option-row clicked" data-office-courier-row=speedy>
<label class="co-option-row__select">
<input type=radio name=office_courier value=speedy autocomplete=off checked>
<span class="co-option-row__body">
<span class="co-option-row__copy">
<span class="co-option-row__title"><img class="co-option-row__logo co-option-row__logo--speedy" src="assets/speedy-logo.png" width="31" height="36" alt="Speedy"> Спиди офис</span>
<span class="co-option-row__hint">Вземи пратката от удобен офис на Speedy</span>
</span>
<span class="co-option-row__price">3.57 €</span>
</span>
</label>
<div class="office-widget-panel" id=office-widget-wrap>
<button type=button class="boxnow-widget-launch office-widget-launch" id=office-open-locator>
<span class="boxnow-widget-launch__title"><img class="co-option-row__logo co-option-row__logo--speedy office-widget-launch__logo" id=office-launch-logo-speedy src="assets/speedy-logo.png" width="31" height="36" alt=""><img class="co-option-row__logo co-option-row__logo--econt office-widget-launch__logo" id=office-launch-logo-econt src="assets/econt-logo.png" width="36" height="36" alt="" hidden> <span>Избери офис от карта</span></span>
</button>
<div class="boxnow-selected office-selected" id=office-selected hidden>
<p class="boxnow-selected__heading" id=office-selected-heading><img class="co-option-row__logo co-option-row__logo--speedy boxnow-selected__heading-logo" id=office-selected-logo-speedy src="assets/speedy-logo.png" width="31" height="36" alt=""><img class="co-option-row__logo co-option-row__logo--econt boxnow-selected__heading-logo" id=office-selected-logo-econt src="assets/econt-logo.png" width="36" height="36" alt="" hidden> <span class="boxnow-selected__heading-text" id=office-selected-heading-text>ОФИС — АДРЕС ЗА ДОСТАВКА</span></p>
<div class="boxnow-selected__card" id=selectedCourierOfficeAddress>
<div class="boxnow-selected__body">
<strong class="boxnow-selected__name" id=office-selected-name></strong>
<span class="boxnow-selected__addr" id=office-selected-text></span>
</div>
<button type=button class="boxnow-selected__change" id=office-change-locator>
<svg class="boxnow-selected__change-icon" viewBox="0 0 24 24" aria-hidden=true focusable=false>
<path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04a1 1 0 0 0 0-1.41l-2.51-2.51a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 2  -1.66z"/>
</svg>
Смени
</button>
</div>
</div>
</div>
</div>
<div class="co-option-row" data-office-courier-row=econt>
<label class="co-option-row__select">
<input type=radio name=office_courier value=econt autocomplete=off>
<span class="co-option-row__body">
<span class="co-option-row__copy">
<span class="co-option-row__title"><img class="co-option-row__logo co-option-row__logo--econt" src="assets/econt-logo.png" width="36" height="36" alt="Еконт"> Еконт офис</span>
<span class="co-option-row__hint">Доставка до офис на Еконт</span>
</span>
<span class="co-option-row__price">4.60 €</span>
</span>
</label>
</div>"""

NEW_HTML = """<div class="co-option-row clicked" data-office-courier-row=speedy>
<div class="co-option-row__body office-courier-row__body">
<label class="co-option-row__select">
<input type=radio name=office_courier value=speedy autocomplete=off checked>
<span class="co-option-row__title"><img class="co-option-row__logo co-option-row__logo--speedy" src="assets/speedy-logo.png" width="31" height="36" alt="Speedy"> Спиди офис</span>
</label>
<div class="office-widget-panel" id=office-widget-wrap>
<button type=button class="office-widget-launch" id=office-open-locator>Избери офис от карта</button>
<div class="boxnow-selected office-selected" id=office-selected hidden>
<p class="boxnow-selected__heading" id=office-selected-heading><img class="co-option-row__logo co-option-row__logo--speedy boxnow-selected__heading-logo" id=office-selected-logo-speedy src="assets/speedy-logo.png" width="31" height="36" alt=""><img class="co-option-row__logo co-option-row__logo--econt boxnow-selected__heading-logo" id=office-selected-logo-econt src="assets/econt-logo.png" width="36" height="36" alt="" hidden> <span class="boxnow-selected__heading-text" id=office-selected-heading-text>ОФИС — АДРЕС ЗА ДОСТАВКА</span></p>
<div class="boxnow-selected__card" id=selectedCourierOfficeAddress>
<div class="boxnow-selected__body">
<strong class="boxnow-selected__name" id=office-selected-name></strong>
<span class="boxnow-selected__addr" id=office-selected-text></span>
</div>
<button type=button class="boxnow-selected__change" id=office-change-locator>
<svg class="boxnow-selected__change-icon" viewBox="0 0 24 24" aria-hidden=true focusable=false>
<path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04a1 1 0 0 0 0-1.41l-2.51-2.51a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 2  -1.66z"/>
</svg>
Смени
</button>
</div>
</div>
</div>
<span class="co-option-row__price">3.57 €</span>
<span class="co-option-row__hint">Вземи пратката от удобен офис на Speedy</span>
</div>
</div>
<div class="co-option-row" data-office-courier-row=econt>
<div class="co-option-row__body office-courier-row__body">
<label class="co-option-row__select">
<input type=radio name=office_courier value=econt autocomplete=off>
<span class="co-option-row__title"><img class="co-option-row__logo co-option-row__logo--econt" src="assets/econt-logo.png" width="36" height="36" alt="Еконт"> Еконт офис</span>
</label>
<span class="co-option-row__price">4.60 €</span>
<span class="co-option-row__hint">Доставка до офис на Еконт</span>
</div>
</div>"""

OLD_SYNC = """  function syncOfficeCarrierMarks(courier) {
    courier = courier || getCourier();
    var isEcont = courier === "econt";
    setMarkVisible(document.getElementById("office-launch-logo-speedy"), !isEcont);
    setMarkVisible(document.getElementById("office-launch-logo-econt"), isEcont);
    setMarkVisible(document.getElementById("office-selected-logo-speedy"), !isEcont);
    setMarkVisible(document.getElementById("office-selected-logo-econt"), isEcont);
  }"""

NEW_SYNC = """  function syncOfficeCarrierMarks(courier) {
    courier = courier || getCourier();
    var isEcont = courier === "econt";
    setMarkVisible(document.getElementById("office-selected-logo-speedy"), !isEcont);
    setMarkVisible(document.getElementById("office-selected-logo-econt"), isEcont);
  }"""

OLD_MOUNT = """  function mountOfficeWidget(courier) {
    courier = courier || getCourier();
    var wrap = document.getElementById("office-widget-wrap");
    if (!wrap) return;
    var radio =
      document.querySelector(
        'input[name="office_courier"][value="' + courier + '"]'
      ) || document.querySelector('input[name="office_courier"]:checked');
    var row = radio && radio.closest ? radio.closest(".co-option-row") : null;
    if (!row) {
      row = document.querySelector(
        '.co-option-row[data-office-courier-row="' + courier + '"]'
      );
    }
    if (row && wrap.parentNode !== row) {
      row.appendChild(wrap);
    }
  }"""

NEW_MOUNT = """  function mountOfficeWidget(courier) {
    courier = courier || getCourier();
    var wrap = document.getElementById("office-widget-wrap");
    if (!wrap) return;
    var radio =
      document.querySelector(
        'input[name="office_courier"][value="' + courier + '"]'
      ) || document.querySelector('input[name="office_courier"]:checked');
    var row = radio && radio.closest ? radio.closest(".co-option-row") : null;
    if (!row) {
      row = document.querySelector(
        '.co-option-row[data-office-courier-row="' + courier + '"]'
      );
    }
    var host = row && row.querySelector
      ? row.querySelector(".office-courier-row__body")
      : null;
    if (!host) host = row;
    if (host && wrap.parentNode !== host) {
      var price = host.querySelector(":scope > .co-option-row__price");
      if (price) host.insertBefore(wrap, price);
      else host.appendChild(wrap);
    }
  }"""


def patch(text: str, path: Path) -> str:
    for name, old, new in [
        ("office CSS", OLD_CSS, NEW_CSS),
        ("logo hidden CSS", OLD_LOGO_CSS, NEW_LOGO_CSS),
        ("office HTML", OLD_HTML, NEW_HTML),
        ("syncOfficeCarrierMarks", OLD_SYNC, NEW_SYNC),
        ("mountOfficeWidget", OLD_MOUNT, NEW_MOUNT),
    ]:
        if old not in text:
            raise SystemExit(f"{path.name}: missing block: {name}")
        text = text.replace(old, new, 1)
    if "office-launch-logo-speedy" in text or "office-launch-logo-econt" in text:
        raise SystemExit(f"{path.name}: launch logos still present")
    if "id=office-open-locator>Избери офис от карта</button>" not in text:
        raise SystemExit(f"{path.name}: CTA text markup missing")
    return text


def main() -> None:
    for path in FILES:
        raw = path.read_text(encoding="utf-8")
        path.write_text(patch(raw, path), encoding="utf-8")
        print("patched", path.name)


if __name__ == "__main__":
    main()
