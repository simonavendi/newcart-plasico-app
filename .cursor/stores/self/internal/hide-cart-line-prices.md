# Hide checkout aside per-line prices

## Request
Simona: remove per-line prices in checkout cart aside (`table#cart-table > tbody > tr > td.r`).
Keep product image/title/category, promo-code section, and aside grand total.

## Change
CSS hide (survives JS table rebuild):

```css
#checkout .checkout-layout__aside #cart-table tbody td.r{display:none!important}
```

Applied in `index.html` and `poruchka.html` (identical files).

Hides both unit-price (`td.r` with `.price`/`.oldprice`) and line subtotal (`td.r.nw` with `.subtotal`). Footer `.totals` rows are in `tfoot`, so grand total + promo stay visible.

## Verify
- `python _verify_hide_line_prices.py` against http://127.0.0.1:8780/index.html
