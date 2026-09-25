# No payment method preselected

## Goal
Checkout must not preselect **Банков превод** (or any other payment). User picks a method explicitly.

## Why
Bank transfer was HTML-default (`checked` + `clicked`), so the SEPA details panel and orange selected card appeared on load and looked like a forced choice.

## Change (`index.html` + `poruchka.html`)
- Removed `checked` from `payment_id=7` and `clicked` from its row
- `#bank-transfer-details` starts `hide sf-hidden` + `hidden`; `syncPayment()` still shows it only when value `7` is selected
- BOX NOW COD block no longer auto-falls back to bank transfer — clears COD only
- Card / leasing / COD remain unchecked on load (COD still disabled under BOX NOW)

## Verify
On load: `document.querySelectorAll('input[name=payment_id]:checked').length === 0`  
Bank panel: `display:none` until user selects Банков превод.
