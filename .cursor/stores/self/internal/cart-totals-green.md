# Cart totals green (discount + grand)

## Why
Aside cart tfoot showed discount and grand total in red (`#c0392b` / `color:red`). Simona asked for Plasico green on those amounts only.

## What
On `#checkout .checkout-layout__aside #cart-table` tfoot:

- `tr.totals.discount > td.r.nw:last-child` (amount e.g. `−69.00 €`) → `#55a630`
- `tr.totals.grand > td.r.nw:last-child` (+ inner `span`, e.g. `620.98 €`) → `#55a630`
- Discount info badge (`.aside-discount-info`) matched to the same green
- Labels stay as before (`#555` discount / black grand); other totals rows untouched

Both amount cells share class `r nw` with the labels, so selectors use `:last-child` (and existing `td+td` override).

## Files
- `index.html`, `poruchka.html`, `boxnowno.html` — CSS only

## Verify
`python _verify_cart_totals_green.py` @ http://127.0.0.1:8780/index.html  
Computed: discount amount + grand amount/span = `rgb(85, 166, 48)`  
Screenshot: `media/cart-totals-green.png`
