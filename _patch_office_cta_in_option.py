# -*- coding: utf-8 -*-
"""Nest office map CTA inside Speedy/Econt co-option-row (index + poruchka)."""
from pathlib import Path

ROOT = Path(r"C:\vibe\plasico new cart")

OLD_CSS = (
    "/* Office locators (Speedy / Econt) — same launch + summary pattern as BOX NOW */\n"
    "#checkout .office-widget-panel{width:100%;margin:12px 0;box-sizing:border-box}\n"
    "#checkout .office-widget-panel.is-selected .office-widget-launch{display:none!important}"
)

NEW_CSS = (
    "/* Office locators (Speedy / Econt) — map CTA lives inside the checked courier option row */\n"
    "#checkout .office-widget-panel{width:100%;margin:12px 0;box-sizing:border-box}\n"
    "#checkout .co-option-row > .office-widget-panel{margin:10px 0 0}\n"
    "#checkout .co-option-row:has(> .office-widget-panel){display:flex;flex-direction:column;align-items:stretch;gap:0}\n"
    "#checkout .office-widget-panel.is-selected .office-widget-launch{display:none!important}\n"
    "#checkout .co-option-row > .office-widget-panel .boxnow-selected{margin-top:0}"
)

OLD_MARKS = """  function syncOfficeCarrierMarks(courier) {
    courier = courier || getCourier();
    var isEcont = courier === "econt";
    setMarkVisible(document.getElementById("office-launch-logo-speedy"), !isEcont);
    setMarkVisible(document.getElementById("office-launch-logo-econt"), isEcont);
    setMarkVisible(document.getElementById("office-selected-logo-speedy"), !isEcont);
    setMarkVisible(document.getElementById("office-selected-logo-econt"), isEcont);
  }"""

NEW_MARKS = """  function syncOfficeCarrierMarks(courier) {
    courier = courier || getCourier();
    var isEcont = courier === "econt";
    setMarkVisible(document.getElementById("office-launch-logo-speedy"), !isEcont);
    setMarkVisible(document.getElementById("office-launch-logo-econt"), isEcont);
    setMarkVisible(document.getElementById("office-selected-logo-speedy"), !isEcont);
    setMarkVisible(document.getElementById("office-selected-logo-econt"), isEcont);
  }
  function mountOfficeWidget(courier) {
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

OLD_CHANGE = """      if (t.name === "office_courier") {
        clearOfficeSelection();
        closeOfficeLocator();
        syncOfficeCarrierMarks(t.value === "econt" ? "econt" : "speedy");
      }"""

NEW_CHANGE = """      if (t.name === "office_courier") {
        var next = t.value === "econt" ? "econt" : "speedy";
        mountOfficeWidget(next);
        clearOfficeSelection();
        closeOfficeLocator();
        syncOfficeCarrierMarks(next);
      }"""

OLD_BOOT = """  function boot() {
    syncOfficeCarrierMarks();
    bindOfficeLaunch();
    bindOfficeCourierChange();
    bindOfficeSubmitGuard();
    bindOfficeMessage();
  }"""

NEW_BOOT = """  function boot() {
    mountOfficeWidget();
    syncOfficeCarrierMarks();
    bindOfficeLaunch();
    bindOfficeCourierChange();
    bindOfficeSubmitGuard();
    bindOfficeMessage();
  }"""


def nest_office_html(text: str) -> str:
    """Move #office-widget-wrap inside Speedy option row; tag both rows."""
    if "data-office-courier-row=speedy" in text and "mountOfficeWidget" in text:
        return text  # already patched

    # Tag Speedy row
    old_speedy = (
        '<label class="co-option-row clicked">\n'
        "<input type=radio name=office_courier value=speedy autocomplete=off checked>"
    )
    new_speedy = (
        '<label class="co-option-row clicked" data-office-courier-row=speedy>\n'
        "<input type=radio name=office_courier value=speedy autocomplete=off checked>"
    )
    if old_speedy not in text:
        raise SystemExit("Speedy office row marker not found")
    text = text.replace(old_speedy, new_speedy, 1)

    # Tag Econt row (first office econt after Speedy — value=econt under office panel)
    old_econt = (
        '<label class="co-option-row">\n'
        "<input type=radio name=office_courier value=econt autocomplete=off>"
    )
    new_econt = (
        '<label class="co-option-row" data-office-courier-row=econt>\n'
        "<input type=radio name=office_courier value=econt autocomplete=off>"
    )
    if old_econt not in text:
        raise SystemExit("Econt office row marker not found")
    text = text.replace(old_econt, new_econt, 1)

    # Extract office-widget-wrap block
    start = text.find('<div class="office-widget-panel" id=office-widget-wrap>')
    if start < 0:
        raise SystemExit("office-widget-wrap start not found")
    # Find matching close before office-locator-error
    err = text.find('<p class="boxnow-locker-error office-locator-error"', start)
    if err < 0:
        raise SystemExit("office-locator-error not found")
    # The wrap closes with </div>\n just before the error <p>
    close = text.rfind("</div>", start, err)
    if close < 0:
        raise SystemExit("office-widget-wrap close not found")
    # include the closing </div>
    end = close + len("</div>")
    wrap_block = text[start:end]
    # Remove wrap from old location (and following newline if present)
    after = text[end:]
    if after.startswith("\n"):
        end += 1
        after = text[end:]
    text_wo = text[:start] + after

    # Insert wrap before </label> of Speedy row (first data-office-courier-row=speedy label close)
    marker = 'data-office-courier-row=speedy>'
    mi = text_wo.find(marker)
    if mi < 0:
        raise SystemExit("speedy attr missing after tag")
    # Find end of Speedy label: after price span closes, before next label
    # Look for </label>\n<label class="co-option-row" data-office-courier-row=econt>
    econt_label = '<label class="co-option-row" data-office-courier-row=econt>'
    ei = text_wo.find(econt_label, mi)
    if ei < 0:
        raise SystemExit("econt labeled row not found for insert point")
    # preceding </label>
    close_label = text_wo.rfind("</label>", mi, ei)
    if close_label < 0:
        raise SystemExit("speedy </label> not found")
    insert_at = close_label
    text_wo = text_wo[:insert_at] + wrap_block + "\n" + text_wo[insert_at:]
    return text_wo


def patch_file(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if OLD_CSS not in text:
        if "map CTA lives inside the checked courier option row" in text:
            print(f"{path.name}: CSS already patched")
        else:
            raise SystemExit(f"{path.name}: OLD_CSS not found")
    else:
        text = text.replace(OLD_CSS, NEW_CSS, 1)

    text = nest_office_html(text)

    if "function mountOfficeWidget" not in text:
        if OLD_MARKS not in text:
            raise SystemExit(f"{path.name}: syncOfficeCarrierMarks block not found")
        text = text.replace(OLD_MARKS, NEW_MARKS, 1)

    if OLD_CHANGE in text:
        text = text.replace(OLD_CHANGE, NEW_CHANGE, 1)
    elif "mountOfficeWidget(next)" not in text:
        raise SystemExit(f"{path.name}: office_courier change handler not found")

    if OLD_BOOT in text:
        text = text.replace(OLD_BOOT, NEW_BOOT, 1)
    elif "mountOfficeWidget();\n    syncOfficeCarrierMarks" not in text:
        raise SystemExit(f"{path.name}: boot() not found")

    # Sanity
    speedy_idx = text.find("data-office-courier-row=speedy")
    wrap_idx = text.find("id=office-widget-wrap")
    econt_idx = text.find("data-office-courier-row=econt")
    if not (0 <= speedy_idx < wrap_idx < econt_idx):
        raise SystemExit(f"{path.name}: nest order bad {speedy_idx},{wrap_idx},{econt_idx}")
    if "mountOfficeWidget" not in text:
        raise SystemExit(f"{path.name}: mountOfficeWidget missing")

    path.write_text(text, encoding="utf-8")
    print(f"{path.name}: patched OK")


def main():
    for name in ("index.html", "poruchka.html"):
        patch_file(ROOT / name)


if __name__ == "__main__":
    main()
