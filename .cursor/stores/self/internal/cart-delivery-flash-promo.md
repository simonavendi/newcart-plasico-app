# Cart delivery + FLASH promo (Ozone-style)

## Request
Simona: match Ozone.bg cart product-row meta for delivery + promo savings; demo cart starts with **FLASH** pre-applied at **10%**. Follow-ups: promo one line on mobile; delivery date from API; restore qty line totals.

## Ozone reference
- Per line: `Доставка от <strong>DD.MM.YYYY</strong>`
- When promo applies: `Приложен е код за -X% от оферта (−amount €)`
- Line total right-aligned (price × qty after promo)

## Changes (`index.html` + `poruchka.html`)
- `.line-delivery[data-product-id]` filled from **`/api/delivery-eta.json`** (`lead_days` → `DD.MM.YYYY`; weekends skipped). No hardcoded date in HTML.
- `.line-promo`: `white-space:nowrap` + inline `.price` override (base cart CSS had `.price{display:block}`).
- Unit `td.r` still hidden; **`td.r.nw` line totals restored** after FLASH: **368.99 €** / **251.99 €**.
- Promo field open with `FLASH`; discount −69.00; grand **620.98 €**.

## API
`api/delivery-eta.json` — items keyed by Plasico product id (`12775255`, `13151228`), `in_stock` + `lead_days`.

## Verify
- `node _verify_line_total_eta.js` @ http://127.0.0.1:8780/index.html
- Screenshots: `media/cart-delivery-flash-promo.png`, `media/cart-line-total-flash.png`
