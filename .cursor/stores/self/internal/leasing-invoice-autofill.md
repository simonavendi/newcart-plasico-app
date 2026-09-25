# Leasing → invoice (фактура) autofill

- Landed on: `main` @ `8d96350`
- Live: https://newcart-plasico-app.vercel.app/
- Local: http://127.0.0.1:8780/index.html

## Behavior (after leasing apply saved)

1. Check **Искам фактура**, select **Физическо лице**
2. Autofill from leasing apply:
   - `#person-names` ← `fullName`
   - `#person-egn` ← `egn`
3. Green notice at top of `#checkout-invoice-fields`:
   **„Автоматично ще бъде издадена фактура на физическото лице при кредит.“**
4. Switch to **Юридическо лице**:
   - `#firm-mol` ← leasing `fullName`
   - Red badge in `#checkout-firms`:
     **„При фактура за фирма и кредит трябва задължително потребителят на кредита да е МОЛ на фирмата“**
5. `PlasicoLeasing.clearApply()` / empty apply → hide both notices + clear `data-leasing-invoice`

## Code

- Primary: `local-leasing-modal.js` — `syncInvoiceFromLeasing`, `bindInvoiceLeasingWatchers`
- Styles: `local-leasing-modal.css` (`.co-invoice-leasing-auto-msg`, `.co-invoice-leasing-mol-badge`)
- Synced inline fallbacks: `index.html`, `poruchka.html`, `boxnowno.html`
- Helper: `_sync_leasing_invoice.py`

## Verify

```bash
node _verify_leasing_invoice_autofill.js
```

- Shot (физ.): `.cursor/stores/self/media/leasing-invoice-autofill.png`
- Shot (ЮЛ): `.cursor/stores/self/media/leasing-invoice-autofill-firm.png`
