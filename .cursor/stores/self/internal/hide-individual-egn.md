# Hide ЕГН on individual (физ. лице) invoice

- Landed on: `main` @ `da2e5c4`
- Live: https://newcart-plasico-app.vercel.app/
- Local: http://127.0.0.1:8780/

## Change

Removed `#person-egn` (label ЕГН) from `#checkout-person-individual` on:

- `index.html`
- `poruchka.html`
- `boxnowno.html`

Individual invoice now keeps: Копирай / Три имена / Адрес.

## Intact

- Firm invoice: `#firm-idn` (ЕИК / Булстат) unchanged
- Leasing apply: `#pl-leasing-egn` still required / autofill sources other fields
- `applyLeasingToInvoiceIndividual` no longer writes invoice EGN (field gone)

## Verify

```bash
node _verify_hide_individual_egn.js
node _verify_leasing_invoice_autofill.js
```

- Shot: `.cursor/stores/self/media/hide-individual-egn.png`
