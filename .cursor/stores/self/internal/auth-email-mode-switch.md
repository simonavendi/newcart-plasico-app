# Auth modal demo email-mode switch

- **SHA:** `fd1c3bb` on `main`
- **Files:** `index.html`, `poruchka.html`
- **UI:** Segmented control `.auth-modal__demo-flow` sits on top of the modal shell (above `.auth-modal__dialog` / logo) with:
  - `неразпознат имейл` → `data-auth-email-mode=unknown` → email continue opens `#auth-step-register`
  - `разпознат имейл` → `data-auth-email-mode=known` → email continue opens `#auth-step-login`
- **Persistence:** `sessionStorage` key `plasico-auth-email-mode`
- **Live toggle:** Changing the switch while already on login/register jumps to the matching step
- **OAuth:** FB / Google / Apple row unchanged
- **Screens:** `.cursor/stores/self/media/auth-email-mode-switch.png`, `auth-email-mode-unknown-register.png`, `auth-email-mode-known-login.png`
