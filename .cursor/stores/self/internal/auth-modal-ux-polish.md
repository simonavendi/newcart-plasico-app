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

## Media
- `.cursor/stores/self/media/auth-polish-register-back.png`
- `.cursor/stores/self/media/auth-polish-login-logo.png`
