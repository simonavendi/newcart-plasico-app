# Leasing summary includes cart grand total

## SHA
`14d86d7` on `main`

## Change
`#pl-leasing-summary` now shows cart grand total (`state.price` from aside СУМА ЗА ПЛАЩАНЕ / `#cart-table .totals.grand`) plus the installment line.

## Example
`620,98 € · 66,76 € / месец - 12 вноски`

Was: `66,76 € / месец - 12 вноски`

## Recalculate
Преизчисли / Enter on down-payment or promo re-reads `parsePrice()` before `renderModal()`.

## Files
- `local-leasing-modal.js` (served)
- `index.html` / `poruchka.html` inline fallbacks
