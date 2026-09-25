# Leasing auto-msg firm hint + hide individual / Тип лице

- Landed on: `main` (this commit)
- Live: https://newcart-plasico-app.vercel.app/
- Local: http://127.0.0.1:8780/index.html

## Request (Simona)

1. Extend `#co-invoice-leasing-auto-msg`:
   **„Автоматично ще бъде издадена фактура на физическото лице при кредит. - ако вместо това желаете фактура на фирма изберете опцията по-долу.“**
2. On approved leasing + PostBank path, hide `#checkout-person-individual` (Копирай / Три имена / Адрес / ЕГН) — физ invoice is automatic.
3. Hide `#invoice-person-type-label` („Тип лице“) on that same path.
4. Keep **Юридическо лице** button + firm fields + МОЛ badge.
5. Restore label + individual panel when leaving leasing method / `clearApply()`.

## Code

- `local-leasing-modal.js` — `INVOICE_LEASING_AUTO_MSG`, `syncFizicheskoPersonTypeAvailability` (type label), `syncInvoicePersonPanels(..., hideIndividualForLeasing)`, `restoreInvoicePersonPanelsAfterLeasing`
- Synced: `index.html`, `poruchka.html`, `boxnowno.html`, `_leasing_modal.js` via `_sync_leasing_invoice.py`
- Show/hide gates unchanged: still requires filled apply + `payment_id=8`

## Verify

```bash
node _verify_leasing_auto_msg_firm_hint.js
node _verify_leasing_invoice_msg_gated.js
node _verify_leasing_mol_badge.js
node _verify_leasing_invoice_autofill.js
```

- Shot: `.cursor/stores/self/media/leasing-auto-msg-firm-hint.png`
- ЮЛ shot: `.cursor/stores/self/media/leasing-auto-msg-firm-hint-yul.png`
