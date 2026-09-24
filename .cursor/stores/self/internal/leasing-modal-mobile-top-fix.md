# Leasing modal mobile top clip fix

## Problem (Simona)
On phone (~390px), `#pl-leasing-overlay` / `.pl-leasing-modal` clipped the top: close **X** cut off, modal too edge-flush / content under status bar.

Root cause: `.pl-leasing-close` used `top/right: -10px` (outside the card) while overlay padding was only `10px` and modal stayed vertically centered with `overflow: visible`.

## Fix
Files: `local-leasing-modal.css` + mirrored inline `#pl-leasing-plasico-overrides` in `index.html` / `poruchka.html`.

- Overlay: safe-area padding (`max(16px, env(safe-area-inset-*))`), `overflow: auto`
- `@media (max-width: 700px)`: `align-items: flex-start`; modal `max-height` via `100dvh` − 32px − safe insets; `overflow: hidden`
- Close button **inside** modal (`top/right: 8–10px`); head `padding-right` so title clears the X
- Body still `overflow-y: auto`; 2-col plan cards unchanged

## Verify
`node _verify_leasing_modal_mobile_top.js` → `:8780` @ 390×844

| check | result |
|-------|--------|
| margins | 16px all sides |
| close fully visible + inside modal | yes (`top/right: 8px`) |
| title / head not clipped | yes |
| body scroll | `overflow-y: auto` |
| 2-col grid | `158px 158px`, personal 2 rows |

Screens: `media/leasing-modal-mobile-top-before.png`, `media/leasing-modal-mobile-top-after.png`, `media/leasing-modal-mobile-top-modal.png`
