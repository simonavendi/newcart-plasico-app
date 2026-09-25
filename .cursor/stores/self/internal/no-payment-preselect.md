# No payment method preselected

## Goal
Checkout must not preselect **Банков превод** (or any other payment). User picks a method explicitly.

## Why
Bank transfer was HTML-default (`checked` + `clicked`), so the SEPA details panel and orange selected card appeared on load and looked like a forced choice.

## Landed
- `main` @ `3b70ea3` — `index.html`, `poruchka.html`

## Verify
On load: `document.querySelectorAll('input[name=payment_id]:checked').length === 0`  
Bank panel: `display:none` until user selects Банков превод.
