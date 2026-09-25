# Hide guest checkout when logged in

## Request
When logged in, hide the entire guest checkout block under `#checkout-register`: title „Поръчка без регистрация“, name/phone/email fields and helper text. Keep auth CTA / profile.

## Approach
- Reuse existing demo auth: `localStorage` `plasico_demo_auth` → `body.is-demo-logged-in` via `applyLoggedInUI`
- CSS: hide `.checkout-guest-title` + `.checkout-guest-fields` when `body.is-demo-logged-in`
- Keep `.co-profile-cta` / `#btn-account-auth` (becomes „Профил“ when logged in; top-bar `#btn-top-profile` unchanged)
- JS: strip `required` from guest inputs while logged in; clear phone validation errors
- `local-bg-phone-validator.js`: `#field-phone` is not required when logged in (validator was re-adding `required` after auth UI)

## Files
- `index.html`, `poruchka.html`
- `local-bg-phone-validator.js`

## Verify (:8780)
- Logged out: guest title + fields visible — `media/guest-block-logged-out.png`
- Logged in: guest block gone; profile CTA remains — `media/guest-block-logged-in.png`
- Script: `_verify_hide_guest_logged_in.js` → PASS

## Commits (main)
- `1023026` — phone validator + notes/screenshots
- `4ecccb3` — `index.html` / `poruchka.html` guest-hide sync
