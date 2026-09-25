# Leasing invoice message gated on approved credit

- Landed on: `main` @ `00a6b7e`
- Live: https://newcart-plasico-app.vercel.app/
- Local: http://127.0.0.1:8780/index.html

## Behavior

`#co-invoice-leasing-auto-msg` („Автоматично ще бъде издадена фактура на физическото лице при кредит.“) shows **only** when credit is approved/completed:

- leasing apply filled (`#pl-leasing-saved` / `is-leasing-complete` path), **and**
- payment method „На изплащане с PostBank“ (`payment_id=8`) selected

Does **not** show when PostBank row is clicked without approved leasing data. Hides when switching away from that method or after `clearApply()`.

Same gate for the red ЮЛ МОЛ badge.

### Физическо лице

On the approved leasing + PostBank path, the **Физическо лице** person-type option is hidden (auto invoice per green notice). **Юридическо лице** stays available. Clicking already-selected ЮЛ returns to the automatic физ path. Outside that path, both options are available again.

### Копирай от горните данни

Always visible and functional — never hidden on the leasing path.

## Code

- `local-leasing-modal.js` — `isLeasingInvoicePathActive`, `syncFizicheskoPersonTypeAvailability`, `syncInvoiceFromLeasing`
- `local-leasing-modal.css` — `.is-leasing-person-locked`
- Synced: `index.html`, `poruchka.html`, `boxnowno.html` (+ `_leasing_modal.js`)

## Verify

```bash
node _verify_leasing_invoice_msg_gated.js
```

- Shot: `.cursor/stores/self/media/leasing-invoice-msg-gated.png`
