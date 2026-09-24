# ЕИК + Postbank logo + hide all radios

## Status on `origin/main` (confirmed)

| Item | Status | SHA |
| --- | --- | --- |
| Hide ЕИК row in `#bank-transfer-details` | Done | `3531e5a` |
| Hide ALL checkout radios (CSS clip) | Done | `b7445eb` |
| Postbank logo (`assets/postbank-logo.png`) on payment + leasing colhead | Done (same commit as radios) | `b7445eb` |

Box Now green launch („като кликнете тук“ + `#55a630`) present on `main` HTML; docs @ `8c955cc`.

## Postbank UI (landed)

- Payment `payment_id=8`: `[logo] На изплащане с PostBank` — `.co-option-row__logo--postbank`
- Leasing modal PostBank column head: `.pl-leasing-colhead-logo`
- Files: `index.html`, `poruchka.html`, `local-leasing-modal.css`, `local-leasing-modal.js`, `assets/postbank-logo.png`
- Notes: `internal/postbank-logo.md`, `internal/hide-all-checkout-radios.md`

## Verify

- `python _verify_hide_all_radios.py` / `node _verify_postbank_logo.js` @ `:8780`
- Shots: `media/postbank-logo-payment-row.png`, `media/postbank-logo-leasing-colhead.png`, `media/hide-all-radios-*.png`
