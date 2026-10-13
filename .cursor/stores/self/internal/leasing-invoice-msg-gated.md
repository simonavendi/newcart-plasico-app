# Leasing / installment invoice notice

- Local: http://127.0.0.1:8780/index.html

## Behavior

`#co-invoice-leasing-auto-msg` („Автоматично ще бъде издадена фактура…“) and locked checked „Искам фактура“ show whenever payment method „На изплащане“ (`payment_id=8`) is selected — even before leasing apply is filled.

Also on payment 8:

- hide **Физическо лице** + „Тип лице“ (auto физ; HTML default ЮЛ is cleared so firm fields stay collapsed)
- **Юридическо лице** stays available as opt-in (not expanded until clicked; re-click returns to auto физ)

Hides / unlocks when switching away from that method.

### After approved leasing + payment 8

Additionally:

- red МОЛ badge on firm path
- autofill from leasing apply

### Копирай от горните данни

Always visible and functional.

## Code

- `local-leasing-modal.js` — `syncInvoiceFromLeasing`, `syncWantInvoiceLockForInstallment`
- Synced: `index.html`, `poruchka.html`, `boxnowno.html` (+ `_leasing_modal.js`)

## Verify

```bash
node _verify_invoice_lock_installment.js
node _verify_leasing_invoice_msg_gated.js
```
