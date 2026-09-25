# Auth modal demo email-mode switch

- **Feature SHA:** `9636f51` on `main` (switch base `fd1c3bb`)
- **Update:** third **default** pill (initial) — see `auth-demo-default-toggle.md`
- **Files:** `index.html`, `poruchka.html`
- **UI:** Segmented control `.auth-modal__demo-flow` above `.auth-modal__dialog`
  - **default** → `#auth-step-email` base entry (initial)
  - **неразпознат имейл** → `#auth-step-register` immediately with:
    - chip `s.dimitrova@plasico.bg` + × clear
    - status `няма открита регистрация`
    - password + confirm
    - CTA `Регистрирай се`
  - **разпознат имейл** → `#auth-step-login` with same demo email + status `разпознат имейл` + green tick (see `auth-known-login-recognized.md`)
- **× clear:** returns to `#auth-step-email` entry
- **Help link:** `tel:070020810` preserved
- **Screens:** `media/auth-email-mode-default.png`, `media/auth-unknown-register-step.png`, `media/auth-known-login-step.png`
