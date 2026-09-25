# Copy invoice from above (`copy-person-from-above`)

- Landed on: `main` @ `0db4fce`
- Files: `index.html`, `poruchka.html` (mirrored)
- Target: `#checkout-person-individual` / `#copy-person-from-above` under `#checkout-invoice-fields`

## Behavior
- Checkbox **Копирай от горните данни** fills invoice individual fields from guest/shipping data above
- Hint stays: „Попълва имената и адреса от данните по-горе.“
- **On check:**
  - `#person-names` ← `#field-name`, or `#field-address-person` when „Друг ще получи пратката ми“ is checked and filled
  - `#person-address` ← active ship panel:
    - address: `Град, Адрес` (`#field-city` + `#field-address`)
    - office: selected office name/address hiddens (fallback visible text)
    - boxnow: locker name/address hiddens (fallback visible text)
    - store: selected `#field-store` option label
- **While checked:** live re-copy on name/address/ship changes
- **On uncheck:** leave values as-is (do not clear); EGN untouched
- Label gets `is-checked` like other invoice-style checkboxes
- Company (`#checkout-firms`): no copy checkbox in markup — not added

## JS
- `syncCopyPersonFromAbove`, `applyCopyPersonFromAbove`, `getInvoiceSourceName`, `getInvoiceSourceAddress`
- Wired on `change` / `input`; also when switching invoice type to Физическо лице

## Verify (Playwright @ 8780)
- `node _verify_copy_invoice_from_above.js`
- Served `http://127.0.0.1:8780/index.html` (+ `poruchka.html` markup has the same handlers)
- Shot: `media/copy-invoice-from-above.png`
