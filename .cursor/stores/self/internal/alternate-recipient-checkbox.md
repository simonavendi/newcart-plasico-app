# Alternate recipient checkbox

- Landed on: `main`
- Files: `index.html`, `poruchka.html` (mirrored)
- Target: `#step-ship-details` / `#checkout-addresses` / `.co-ship-panel[data-ship-panel=address]`

## Changes
- Replace always-visible „Получател“ + hidden „Тел номер на получателя е различен“ with checkbox **Друг ще получи пратката ми** (`#want-alternate-recipient`)
- Unchecked (default): hide `#alternate-recipient-fields` (name + phone)
- Checked: show `address_person` („Получател“ / „Име на получателя“) and `address_person_phone` („Телефон на получателя“)
- JS: `syncAlternateRecipient()` on change; keeps `is-checked` on the invoice-style label
- Removed permanent CSS hide of `#recipient-phone-field` / old phone-only toggle

## Verify (Playwright @ 8780)
- Label text exact: `Друг ще получи пратката ми`
- Unchecked: fields `display:none`
- Checked: name + phone visible with correct labels/placeholders
- Old `#want-recipient-phone` gone
- Shots: `media/alternate-recipient-unchecked.png`, `media/alternate-recipient-checked.png`
