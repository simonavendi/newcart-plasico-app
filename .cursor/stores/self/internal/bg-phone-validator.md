# Bulgarian phone validator

- Landed on: `main` @ `09f232a`
- Files: `local-bg-phone-validator.js`, `index.html`, `poruchka.html` (mirrored)
- Targets: `#field-phone`, `input.telephone`, `#field-address-person-phone`

## Rules
- Accept: `08xxxxxxxx` (exactly 10 digits), `+3598xxxxxxxx`, `003598xxxxxxxx` (spaces/dashes/parens stripped)
- Reject: wrong lengths (e.g. 11-digit `08912345678`), short/empty required, non-mobile shapes
- `#field-phone`: `required`; error on blur + submit; blocks `#checkout-new form` submit (`Купи`)
- Recipient phone: same format when filled; treated required while „Друг ще получи пратката ми“ is checked
- UI: `.is-invalid` red border + `.field-error.telephone-error` alert under field

## Verify (Playwright @ 8780)
- Unit: 0888… / +3598… / 003598… / spaced OK; 11-digit / short / empty / landline fail
- Blur invalid shows BG error; submit does not fire; valid clears
- Recipient `.telephone` invalid/valid when alternate recipient on
- Shots: `media/bg-phone-invalid-blur.png`, `media/bg-phone-valid.png`, `media/bg-phone-recipient-invalid.png`
