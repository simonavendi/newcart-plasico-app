# Leasing apply autofill from cart/checkout

## Goal
When `#pl-leasing-overlay` / apply form opens, prefill:
- `#pl-leasing-name` ← checkout full name
- `#pl-leasing-phone` ← checkout phone
- `#pl-leasing-email` ← checkout / auth email
- `#pl-leasing-egn` ← only if cart/checkout already has EGN (`#person-egn`)

Do **not** overwrite fields the user already typed (or values restored from a prior leasing apply).

## Sources (priority)
1. Prior leasing apply in `sessionStorage` (`plasico-leasing-apply`) — full restore via `fillApplyFormFromSaved`
2. Then empty-only fill from page/auth via `fillApplyFormFromCustomer`:
   - Name: `#field-name` → `#person-names` → `#field-address-person` → `#register-name`
   - Phone: `#field-phone` → `#field-address-person-phone`
   - Email: `#field-email` → `localStorage.plasico_demo_auth.email` → `#auth-email` / login/register hidden emails
   - EGN: `#person-egn` (optional)

## Code
- Primary (runs): `local-leasing-modal.js` — `readCheckoutCustomerData`, `fillApplyFormFromCustomer`, called from `openModal` after `fillApplyFormFromSaved`
- Mirror: `_leasing_modal.js`
- Fallback inline copies (skipped when external already bootstrapped): `index.html`, `poruchka.html`

## Verify
- `node _verify_leasing_autofill.js` against `http://127.0.0.1:8780`
- Screenshot: `.cursor/stores/self/media/leasing-autofill-from-cart.png`
- Checks: prefill name/phone/email, leave EGN empty when absent, no overwrite of typed name, auth email fallback, EGN from `#person-egn`
