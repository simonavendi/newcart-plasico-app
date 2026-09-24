# Cart aside quantity selectors

## Request
Simona: cart aside quantity selectors must work (`+` / `−` / count).

Element: `td.c.nw` under `#cart-table tbody tr` inside `.checkout-layout__aside-sticky` — circular − / + around `.quan`.

## Behavior
Local demo handlers (no navigation to plasico.bg):

- `a.inc` / `a.dec` / `a.del` intercept clicks on `#cart-table`
- Updates `.quan`, post-FLASH line total (`.line-total`), per-line promo savings, footer FLASH discount, grand total
- Dispatches `plasico:cart-updated` so leasing installment teaser refreshes
- Decrement from 1 (or delete) removes the row (existing `quantity=0` pattern)
- FLASH rate: **10%** when promo code is `FLASH` / discount row present

## Files
- `index.html`, `poruchka.html` — `wireCartQtySelectors()` inside checkout `ready()`
- Patch helper: `_patch_cart_qty.py`
- Verify: `_verify_cart_qty.js` @ http://127.0.0.1:8780/index.html

## Verify
- Inc first line → qty 2, line **737.98 €**, discount **−110.00**, grand **989.97**
- Dec → restore **620.98**
- Dec at 1 → row removed, grand **251.99**
- Screenshot: `media/cart-qty-selectors.png`
