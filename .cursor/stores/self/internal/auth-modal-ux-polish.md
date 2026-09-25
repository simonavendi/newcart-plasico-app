# Auth modal UX polish (equal pills, logo, НАЗАД)

## Why
Demo pills looked content-sized; login hid the Plasico logo; register had no top-left back control opposite ×.

## What
On `index.html` + `poruchka.html`:

1. **Equal demo pills** — `.auth-modal__demo-flow-btn` uses `flex:1 1 0%`, `width:0`, `min-width:0`, `white-space:normal` so default | неразпознат | разпознат share one container width.
2. **Shared logo** — single `.auth-modal__brand` in `.auth-modal__dialog` (outside steps). Visible on email / login / register; hidden on thanks via `setAuthStep`.
3. **← НАЗАД** — one dialog-level `[data-auth-back].auth-modal__back` (absolute top-left, opposite ×). Shown on login + register; click runs `setAuthEmailMode("default", true)` → `#auth-step-email` + default pill.

OAuth under login/register submits left intact (3× `.auth-modal__oauth`).

## Verify
`node _verify_auth_modal_polish.js` — pill widths equal (136/136/136), logo on login/register, back → default email + default pill.

## SHA
- HTML (`index.html` + `poruchka.html`): `main` @ `bc29a90` (`bc29a90d210577ae2b5fc9b1e29d0fbd5b91ecca`)
- Notes/media/internal: `main` @ `e8c29f0` (`e8c29f0ea93ceb3f1ee89ca101a91f7fb78eef7e`)
