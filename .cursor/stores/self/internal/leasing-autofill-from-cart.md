# Leasing apply autofill from cart/checkout

## Goal
When `#pl-leasing-overlay` / apply form opens **or becomes visible**, prefill:
- `#pl-leasing-name` ← checkout full name
- `#pl-leasing-phone` ← checkout phone
- `#pl-leasing-email` ← checkout / auth email
- `#pl-leasing-egn` ← only if cart/checkout already has EGN (`#person-egn`)

Do **not** overwrite fields the user already typed (or non-empty values restored from a prior leasing apply).

## Sources (priority)
1. Prior leasing apply in `sessionStorage` (`plasico-leasing-apply`) — restore **non-empty** fields only via `fillApplyFormFromSaved`
2. Then empty-only fill from page/auth via `fillApplyFormFromCustomer`:
   - Name: `#field-name` → `#person-names` → `#field-address-person` → `#register-name`
   - Phone: `#field-phone` → `#field-address-person-phone`
   - Email: `#field-email` → `localStorage.plasico_demo_auth.email` → `#auth-email` / login/register hidden emails
   - EGN: `#person-egn` (optional)

## Triggers
- `openModal` (after overlay shown + microtask second pass)
- Apply block scrolled into view (`IntersectionObserver` on `#pl-leasing-apply`)
- Checkout field `input`/`change` while overlay open
- `renderModal` while overlay open

## Code
- Primary (runs): `local-leasing-modal.js` — `autofillApplyForm`, `bindApplyAutofillWatchers`
- Mirror: `_leasing_modal.js`
- Fallback inline copies (skipped when external already bootstrapped): `index.html`, `poruchka.html`

## Verify
- `node _verify_leasing_two_col_autofill.js` (covers pre-open fill, late fill while open, no overwrite)
- Screenshot: `.cursor/stores/self/media/leasing-autofill-from-cart.png`
