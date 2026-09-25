# Auth modal demo: default | unknown | known

- **SHA:** `442559f` on `main`
- **Files:** `index.html`, `poruchka.html`
- **Pill order (first = initial):** `default` | `неразпознат имейл` | `разпознат имейл`
- **Modes:**
  - `default` → `#auth-step-email` (Здравей!, empty email, **Продължи**, OAuth FB/Google/Apple, two-line help `tel:070020810`)
  - `unknown` → `#auth-step-register` (chip `s.dimitrova@plasico.bg`, няма открита регистрация, 2 passwords, **Регистрирай се**)
  - `known` → `#auth-step-login` (chip + **разпознат имейл** + green tick, 1 password, **Вход**)
- **CSS:** slightly smaller pill font/padding so three segments fit
- **Screen:** `media/auth-email-mode-default.png`
- Supersedes two-option behavior in `auth-email-mode-switch.md` (unknown was former initial)
