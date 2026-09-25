# Aside discount info badge + tooltip

## Why
Shoppers see an auto-applied FLASH discount (`−69.00 €`) in the aside cart with no explanation. Need a small info cue that this promocode was added because a cart product matches the offer.

## What
On `aside.checkout-layout__aside table#cart-table tfoot tr.totals.discount td.r.nw` (amount cell):

- Circular **i** badge (Plasico discount red `#c0392b`, orange focus ring)
- Tooltip bubble (BG copy): *Този промокод беше автоматично добавен, защото имате продукт в количката, който отговаря на тази оферта.*
- Open on hover (fine pointer) or click/tap; toggle on second click; dismiss on outside click / Escape
- `aria-label` / `title` on button; `role=tooltip` + `aria-expanded` / `aria-controls`

## Files
- `index.html`, `poruchka.html` — CSS + markup + small IIFE (scoped to discount row only)
- FLASH qty recalc uses `td + td > span:not(.aside-discount-tip)` so the tip span is never overwritten

## Verify
`node _verify_discount_info.js` @ http://127.0.0.1:8780/index.html  
Screenshot: `media/aside-discount-info-tooltip.png`  
Commit: `eb6f2a2` on `main`
