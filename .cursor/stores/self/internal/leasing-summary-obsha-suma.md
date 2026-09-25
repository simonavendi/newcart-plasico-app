# Leasing summary „Обща сума:“ prefix

## Change
`#pl-leasing-summary` text now starts with **Обща сума: ** before the cart total + monthly line.

- Before: `620,98 € · 66,76 € / месец - 12 вноски`
- After: `Обща сума: 620,98 € · 66,76 € / месец - 12 вноски`

Amount formatting (`formatEuro`) unchanged.

## Files
- `local-leasing-modal.js` — `summaryText()`
- `index.html` / `poruchka.html` — inline `#local-leasing-modal-inline` `summaryText()` synced

## Verify
`node _verify_leasing_summary_prefix.js` → PASS  
Media: `media/leasing-summary-obsha-suma.png`  
Local: http://127.0.0.1:8780/index.html
