# Restore Facebook OAuth circle in auth modal

## Change
- Re-added `a.auth-modal__social.auth-modal__social--facebook` as first icon in `#auth-modal` / `#auth-step-email` / `.auth-modal__oauth`
- Re-added CSS `.auth-modal__social--facebook{background:#3b5998}`
- Files: `index.html`, `poruchka.html`
- Order: Facebook → Google → Apple (circle icons)

## Note
- Supersedes intentional omit in `internal/remove-facebook-oauth.md` (Simona asked to add FB icon back)
