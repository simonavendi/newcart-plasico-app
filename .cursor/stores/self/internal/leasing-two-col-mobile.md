# Leasing plan options: 2 columns on mobile

## Goal
`#pl-leasing-overlay` / `.pl-leasing-modal` plan cards under “Купи на изплащане” and PostBank stay **2 columns** on mobile (~390px), not a full-width stack.

## CSS (`local-leasing-modal.css` + mirrored in `index.html` / `poruchka.html`)
At `@media (max-width: 700px)`:
- `.pl-leasing-grid` → `display: grid; grid-template-columns: 1fr 1fr; gap/padding`
- `.pl-leasing-grid-colhead` → `grid-column: 1 / -1` (section headers span)
- Cells: compact padding/typography so two cards fit (~160px each at 390)
- `@media (max-width: 480px)`: further downsize monthly/meta fonts

## Autofill (same pass — Simona follow-up)
`#pl-leasing-apply` was empty when checkout fields were filled after open / when apply scrolled into view.

`local-leasing-modal.js` (+ `_leasing_modal.js`):
- `autofillApplyForm()` = saved (non-empty only) then checkout empty-only fill
- On open: fill after overlay shown + `setTimeout(0)` second pass
- `IntersectionObserver` on `#pl-leasing-apply` when visible in `.pl-leasing-body`
- `input`/`change` on `#field-name` / `#field-phone` / `#field-email` / `#person-egn` (etc.) while modal open
- Never overwrite typed apply values

## Verify
- `node _verify_leasing_two_col_autofill.js` → `:8780` @ 390×844
- Screens: `media/leasing-two-col-mobile.png`, `media/leasing-autofill-from-cart.png`, `media/leasing-modal-mobile-390.png`
- Grid: `display:grid`, `164px 164px`, personal 3 cards / 2 rows
