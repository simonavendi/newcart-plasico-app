# Checkout profile dropdown (`#btn-account-auth`)

## Request (Simona)
Logged-in click on checkout `button#btn-account-auth` („Профил“ in `#checkout-register` → `.co-profile-cta`) must open the **same** dropdown options as header `#user` / `#user-profile-menu`:
- Профил
- Предишни поръчки
- Документи
- Изход

When logged out, keep auth modal / login behavior.

## Cause
`applyLoggedInUI` already relabeled the button to „Профил“, but click still went through `openModal()` which no-ops when logged in — no menu.

## Fix
- Markup: `#checkout-profile-menu` under `#co-profile-actions` (same BG labels + `https://plasico.bg/account` links as header)
- Logged in: toggle dropdown; remove `data-open-auth-modal`; do **not** open auth modal
- Logged out: restore `data-open-auth-modal` + open auth modal
- **Изход** (`#btn-checkout-logout`) clears `localStorage.plasico_demo_auth` + `applyLoggedInUI(null)` (shared with header logout)
- CSS: `#checkout #checkout-register{overflow:visible}` so menu escapes parent `.oh` clip

## Files
- `index.html`, `poruchka.html`
- Screenshot: `media/checkout-profile-dropdown.png`
- Related: `internal/profile-menu-header.md` (header menu @ `da84bad`)

## Verify (:8780)
- Script: `_verify_checkout_profile_dropdown.py` → PASS
- Logged in → click `#btn-account-auth` → 4 items, modal stays closed
- Изход → guest UI + auth modal on next click
