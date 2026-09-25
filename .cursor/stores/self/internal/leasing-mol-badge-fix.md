# Leasing ЮЛ МОЛ badge + firm panel fix

- Live: https://newcart-plasico-app.vercel.app/
- Local: http://127.0.0.1:8780/index.html
- Shot: `.cursor/stores/self/media/leasing-mol-badge-visible.png`

## Bug

After `00a6b7e` (gate + hide Физическо лице), clicking **Юридическо лице (фирма)** did nothing useful:

1. Capture-phase click handler treated the *first* ЮЛ select as “already selected”.
2. By click time the browser had already checked the radio, so the handler `preventDefault`’d and forced физ again.
3. UI stayed on `#checkout-person-individual` (Копирай / Три имена / ЕГН) while only the ЮЛ pill was visible — red `#co-invoice-leasing-mol-badge` never appeared.

## Fix

- Read ЮЛ `checked` on `pointerdown` (pre-click); only re-click → auto физ.
- First ЮЛ click selects firm normally → firm fields + МОЛ prefilled + red badge.
- `syncInvoicePersonPanels(isFirm)` keeps firm vs individual panels in sync.

## Visibility (unchanged gates)

| State | Green `#co-invoice-leasing-auto-msg` | Red МОЛ badge | Panel |
|-------|--------------------------------------|---------------|-------|
| Approved credit + PostBank + физ (auto) | show | hide | individual |
| Same + ЮЛ click | hide | show | firm (name/ЕИК/МОЛ/addr) |
| Not approved / other payment / clearApply | hide | hide | normal |

Физическо лице toggle still hidden on approved leasing path. „Копирай от горните данни“ stays on the individual panel only.

## Code

- `local-leasing-modal.js` (+ `_leasing_modal.js` mirror)
- Synced inline: `index.html`, `poruchka.html`, `boxnowno.html`

## Verify

```bash
node _verify_leasing_mol_badge.js
node _verify_leasing_invoice_msg_gated.js
node _verify_leasing_invoice_autofill.js
```
