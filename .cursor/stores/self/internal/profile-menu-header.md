# Header profile menu + top-line bleed

## Request (Simona)
1. Remove orange background on `#user` (header → `#top-line` → `#user`)
2. Profile control opens dropdown: Профил / Предишни поръчки / Документи / Изход
3. Fix `#top-line` inset black strip (selector bounds ~left 112 / width 990) so bar is full-bleed

## Cause
- `#user{background:#FF6100}` from Plasico CSS made the orange pill behind the logged-in icon
- `#btn-top-profile` was **34×34**, stretching `#top-line` to ~34px while `header::before` stayed **30px × 100%** — the extra ~4px used `#top-line`’s own black only inside `.pw` (990px), so sides looked like a gray gap

## Fix
- Local overrides: transparent `#user`, 26px profile button, `#top-line` locked to 30px + transparent bg; reinforce `header::before` full-bleed black
- Markup: `#user .user-logged` menu (`#user-profile-menu`) with BG labels
- Links → `https://plasico.bg/account` (site account hub; no separate orders/docs routes found)
- **Изход** clears `localStorage.plasico_demo_auth` + `applyLoggedInUI(null)`
- Click toggle + outside click / Escape close

## Files
- `index.html`, `poruchka.html`
- Screenshot: `media/profile-menu-no-orange.png`

## Verify (:8780)
- Logged in: no orange on `#user`; black bar pixels edge-to-edge at y≈10
- Click `#btn-top-profile` → menu; Изход → guest links restore
- Script: `_verify_profile_menu.js.py` → PASS

## Follow-up
Checkout `#btn-account-auth` (logged in) reuses the same menu options — see `internal/checkout-profile-dropdown.md`.
