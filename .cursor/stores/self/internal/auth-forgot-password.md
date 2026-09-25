# Auth modal — Забравена парола (in-modal success)

## Behavior
On `#auth-step-login` (recognized email / title **Вход**), **Забравена парола** sits beside the **Парола** label (`.auth-modal__field-head`).

- Control is a `button[data-auth-forgot]` (not a link) — **does not navigate** away.
- Click → `#auth-step-forgot-sent` stays inside `#auth-modal`:
  - green tick circle
  - **Паролата ви е изпратена**
  - access-data copy with live email (chip / `#login-email` / demo `s.dimitrova@plasico.bg`)
  - change-password hint (Профил → Смяна на парола)
  - **Благодарим Ви че избрахте Plasico.bg!**
- Demo/local: UI confirmation only (no real email send).
- **← НАЗАД** returns to default email step; **×** close still works.
- Social / **Създай акаунт** / **Вход** CTA unchanged on login step.

## Files
- `index.html`, `poruchka.html`, `boxnowno.html`

## Verify
- Local: `node _verify_auth_forgot_password.js` against http://127.0.0.1:8780/
- Screen: `media/auth-forgot-password.png`
