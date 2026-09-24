# -*- coding: utf-8 -*-
"""Fix Speedy/Econt office courier row click selection + placeholder."""
from pathlib import Path

PLACEHOLDER_OLD = 'placeholder="Град, име или код на офис"'
PLACEHOLDER_NEW = 'placeholder="Град, име или адрес на офис"'

CSS_OLD = """#checkout .co-option-row[data-office-courier-row]{cursor:default}
#checkout .office-courier-row__body{
  display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;width:100%
}
#checkout .office-courier-row__body > .co-option-row__select{
  order:1;display:inline-flex;align-items:center;gap:8px;cursor:pointer;min-width:0;flex:0 1 auto
}"""

CSS_NEW = """#checkout .co-option-row[data-office-courier-row]{cursor:pointer}
#checkout .office-courier-row__body{
  display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;width:100%
}
#checkout .office-courier-row__body > .co-option-row__select{
  order:1;display:inline-flex;align-items:center;gap:8px;cursor:pointer;min-width:0;flex:1 1 auto
}
#checkout .office-courier-row__body > .co-option-row__select .co-option-row__title{
  pointer-events:none
}
#checkout .office-search,
#checkout .office-widget-launch,
#checkout .office-selected,
#checkout .office-search__list{cursor:auto}
#checkout .office-search__list[hidden]{display:none!important;pointer-events:none!important}"""

# Insert row-click binder before bindOfficeCourierChange
ANCHOR = """  function bindOfficeCourierChange() {
    if (window.__plasicoOfficeCourierBound) return;
    window.__plasicoOfficeCourierBound = true;
    document.addEventListener("change", function (ev) {
      var t = ev.target;
      if (!t) return;
      if (t.name === "office_courier") {
        var next = t.value === "econt" ? "econt" : "speedy";
        mountOfficeWidget(next);
        clearOfficeSelection();
        closeOfficeLocator();
        syncOfficeCarrierMarks(next);
      }"""

BINDER = r"""  function selectOfficeCourierRow(row, opts) {
    opts = opts || {};
    if (!row) return false;
    var radio = row.querySelector('input[name="office_courier"]');
    if (!radio || radio.disabled) return false;
    syncOfficeCourierClicked();
    if (radio.checked && !opts.force) return true;
    radio.checked = true;
    try {
      radio.dispatchEvent(new Event("input", { bubbles: true }));
    } catch (err1) {}
    try {
      radio.dispatchEvent(new Event("change", { bubbles: true }));
    } catch (err2) {}
    syncOfficeCourierClicked();
    return true;
  }

  function syncOfficeCourierClicked() {
    var radios = document.querySelectorAll('input[type=radio][name="office_courier"]');
    for (var i = 0; i < radios.length; i++) {
      var r = radios[i];
      var row = r.closest(".co-option-row[data-office-courier-row]") || r.closest(".co-option-row");
      if (!row) continue;
      if (r.checked) row.classList.add("clicked");
      else row.classList.remove("clicked");
    }
  }

  function isOfficeRowInteractiveTarget(t) {
    if (!t || !t.closest) return false;
    // Keep map CTA, typeahead, Смени, and real form controls fully clickable.
    return !!(
      t.closest(
        "button, textarea, select, a, .office-search, .office-search__list, .office-widget-launch, .office-selected, .boxnow-selected__change, input:not([name='office_courier'])"
      ) ||
      (t.matches && t.matches("input:not([type='radio'])"))
    );
  }

  function bindOfficeCourierRowClick() {
    if (window.__plasicoOfficeRowClickBound) return;
    window.__plasicoOfficeRowClickBound = true;
    document.addEventListener(
      "click",
      function (e) {
        var t = e.target;
        if (!t || !t.closest) return;
        var row = t.closest(".co-option-row[data-office-courier-row]");
        if (!row) return;
        if (isOfficeRowInteractiveTarget(t)) return;
        // Native <label class="co-option-row__select"> already toggles the radio.
        if (t.closest("label.co-option-row__select")) {
          setTimeout(syncOfficeCourierClicked, 0);
          return;
        }
        selectOfficeCourierRow(row);
        if (typeof hideOfficeSearchList === "function") hideOfficeSearchList();
      },
      false
    );
  }

  function bindOfficeCourierChange() {
    if (window.__plasicoOfficeCourierBound) return;
    window.__plasicoOfficeCourierBound = true;
    document.addEventListener("change", function (ev) {
      var t = ev.target;
      if (!t) return;
      if (t.name === "office_courier") {
        var next = t.value === "econt" ? "econt" : "speedy";
        mountOfficeWidget(next);
        clearOfficeSelection();
        closeOfficeLocator();
        syncOfficeCarrierMarks(next);
        syncOfficeCourierClicked();
      }"""

BOOT_OLD = """    bindOfficeTypeahead();
    bindOfficeLaunch();
    bindOfficeCourierChange();"""

BOOT_NEW = """    bindOfficeTypeahead();
    bindOfficeLaunch();
    bindOfficeCourierRowClick();
    bindOfficeCourierChange();"""


def patch(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if PLACEHOLDER_OLD in text:
        text = text.replace(PLACEHOLDER_OLD, PLACEHOLDER_NEW)
    assert PLACEHOLDER_NEW in text, f"{path}: placeholder missing"

    if "bindOfficeCourierRowClick" not in text:
        assert CSS_OLD in text, f"{path}: CSS_OLD missing"
        assert ANCHOR in text, f"{path}: ANCHOR missing"
        assert BOOT_OLD in text, f"{path}: BOOT_OLD missing"
        text = text.replace(CSS_OLD, CSS_NEW, 1)
        text = text.replace(ANCHOR, BINDER, 1)
        text = text.replace(BOOT_OLD, BOOT_NEW, 1)

    assert "bindOfficeCourierRowClick" in text
    assert "cursor:pointer" in text
    assert PLACEHOLDER_NEW in text
    path.write_text(text, encoding="utf-8")
    print("patched", path.name)


def main():
    root = Path(__file__).resolve().parent
    for name in ("index.html", "poruchka.html"):
        patch(root / name)
    # Keep generator in sync
    gen = root / "_patch_office_typeahead.py"
    if gen.exists():
        g = gen.read_text(encoding="utf-8")
        if PLACEHOLDER_OLD in g:
            gen.write_text(g.replace(PLACEHOLDER_OLD, PLACEHOLDER_NEW), encoding="utf-8")
            print("synced generator placeholder")


if __name__ == "__main__":
    main()
