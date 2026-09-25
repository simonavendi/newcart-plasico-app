# Auth email-step submit button verification

- **User ask:** "Провери" on `button.auth-modal__submit` in `#auth-step-email` showing **Продължи с поръчката**
- **Verdict:** Already correct on `main` @ `9636f51` (docs note `a542a4a`). No code change.
- **Evidence (live `127.0.0.1:8780`, Playwright):**
  - Open with **неразпознат** → `#auth-step-register` visible, email step hidden, CTA **Регистрирай се**
  - Toggle **разпознат** → `#auth-step-login`, CTA **Вход** (status text still `намерена регистрация`)
  - × clear → `#auth-step-email` only then, CTA **Продължи с поръчката** (intentional base entry)
- **User screenshot** matches the post-clear / base email form, not an active pill mode.
- **Screens:** `media/auth-unknown-register-step.png`, `media/auth-known-login-step.png`
