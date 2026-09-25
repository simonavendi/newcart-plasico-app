# -*- coding: utf-8 -*-
"""Add bank-transfer payment details panel under Банков превод."""
from pathlib import Path

CSS = """#checkout #bank-transfer-details{margin:8px 0 4px;padding:12px 14px;border:1px solid #e0e0e0;border-radius:6px;background:#fafafa;box-sizing:border-box}
#checkout #bank-transfer-details[hidden],#checkout #bank-transfer-details.hide{display:none!important}
#checkout .bank-transfer-details__lead{margin:0 0 10px;font-size:13px;color:#666;line-height:1.4}
#checkout .bank-transfer-details__list{margin:0;padding:0;display:grid;gap:8px}
#checkout .bank-transfer-details__row{display:grid;grid-template-columns:minmax(96px,120px) 1fr;gap:8px 12px;align-items:baseline}
#checkout .bank-transfer-details__row dt{margin:0;font-size:12px;color:#666;font-weight:normal}
#checkout .bank-transfer-details__row dd{margin:0;font-size:14px;color:#000;font-weight:bold;word-break:break-word}
#checkout .bank-transfer-details__row dd code{font-family:Consolas,"Courier New",monospace;font-size:13px;font-weight:bold;letter-spacing:.02em}
#checkout .bank-transfer-details__note{margin:10px 0 0;font-size:13px;color:#666;line-height:1.4}
"""

BANK_PANEL = """<div id=bank-transfer-details class="bank-transfer-details" role=region aria-label="Данни за банков превод">
<p class="bank-transfer-details__lead">Преведи сумата по следната сметка (SEPA):</p>
<dl class="bank-transfer-details__list">
<div class="bank-transfer-details__row">
<dt>Получател</dt>
<dd>Пласико Компютърс ЕООД</dd>
</div>
<div class="bank-transfer-details__row">
<dt>ЕИК</dt>
<dd>148019777</dd>
</div>
<div class="bank-transfer-details__row">
<dt>IBAN</dt>
<dd><code id=bank-transfer-iban>BG18UBBS81551064228519</code></dd>
</div>
<div class="bank-transfer-details__row">
<dt>Банка</dt>
<dd>Обединена Българска Банка</dd>
</div>
<div class="bank-transfer-details__row">
<dt>BIC</dt>
<dd><code>UBBSBGSF</code></dd>
</div>
<div class="bank-transfer-details__row">
<dt>Основание</dt>
<dd>Номер на поръчката (ще се покаже след завършване)</dd>
</div>
</dl>
<p class="bank-transfer-details__note">След завършване на поръчката ще получите проформа фактура на имейл с данните за плащане.</p>
</div>
"""

OLD_BANK_HINTS = (
    '<span class="co-option-row__title">Банков превод</span>\n'
    '<span class="co-option-row__hint">SEPA · обработка 1–2 раб. дни</span>\n'
    '<span class="co-option-row__hint">След завършване на поръчката ще получите проформа фактура на имейл</span>\n'
    '</span>\n'
    '</span>\n'
    '</label>\n'
)

NEW_BANK_BLOCK = (
    '<span class="co-option-row__title">Банков превод</span>\n'
    '<span class="co-option-row__hint">SEPA · обработка 1–2 раб. дни</span>\n'
    '</span>\n'
    '</span>\n'
    '</label>\n'
    + BANK_PANEL
)

OLD_SYNC = """  function syncPayment() {
    setClickedForRadios("payment_id");
    var leasing = document.getElementById("leasing-schema");
    var install = document.getElementById("installment-options");
    var pay = document.querySelector("input[name=payment_id]:checked");
    if (pay && pay.value === "8") {
      showEl(leasing);
      showEl(install);
    } else {
      hideEl(leasing);
      hideEl(install);
    }
  }"""

NEW_SYNC = """  function syncPayment() {
    setClickedForRadios("payment_id");
    var leasing = document.getElementById("leasing-schema");
    var install = document.getElementById("installment-options");
    var bank = document.getElementById("bank-transfer-details");
    var pay = document.querySelector("input[name=payment_id]:checked");
    var val = pay ? pay.value : "";
    if (val === "8") {
      showEl(leasing);
      showEl(install);
    } else {
      hideEl(leasing);
      hideEl(install);
    }
    if (val === "7") showEl(bank);
    else hideEl(bank);
  }"""

CSS_ANCHOR = "#checkout #installment-options{margin:8px 0 4px;padding:0;border:0;border-radius:0;background:transparent}"


def patch(path: Path) -> None:
    t = path.read_text(encoding="utf-8")
    assert CSS_ANCHOR in t, f"CSS anchor missing in {path}"
    if "#checkout #bank-transfer-details{" not in t:
        t = t.replace(CSS_ANCHOR, CSS + CSS_ANCHOR, 1)
    assert OLD_BANK_HINTS in t or "id=bank-transfer-details" in t, f"bank block missing in {path}"
    if "id=bank-transfer-details" not in t:
        t = t.replace(OLD_BANK_HINTS, NEW_BANK_BLOCK, 1)
    assert OLD_SYNC in t or 'getElementById("bank-transfer-details")' in t, f"syncPayment missing in {path}"
    if 'getElementById("bank-transfer-details")' not in t:
        t = t.replace(OLD_SYNC, NEW_SYNC, 1)
    # Ensure panel visibility matches default checked bank (value=7)
    # Panel should NOT start hidden since bank is default selected
    path.write_text(t, encoding="utf-8")
    checks = {
        "css": "#checkout #bank-transfer-details{" in t,
        "panel": "id=bank-transfer-details" in t,
        "iban": "BG18UBBS81551064228519" in t,
        "beneficiary": "Пласико Компютърс ЕООД" in t,
        "sync": 'getElementById("bank-transfer-details")' in t,
        "eik": "148019777" in t,
    }
    print(path.name, checks)
    assert all(checks.values()), checks


def main():
    for name in ("index.html", "poruchka.html"):
        patch(Path(name))


if __name__ == "__main__":
    main()
