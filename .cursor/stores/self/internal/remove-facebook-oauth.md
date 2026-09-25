# Remove Facebook social login from auth modal

## Change
- Removed `a.auth-modal__social.auth-modal__social--facebook` from `#auth-modal` / `#auth-step-email` / `.auth-modal__oauth`
- Removed unused CSS `.auth-modal__social--facebook{background:#3b5998}`
- Files: `index.html`, `poruchka.html`
- Kept Google and Apple OAuth buttons (now circle icons — see `internal/auth-thanks-profile.md`)

## Verify (http://127.0.0.1:8780)
- `fbCount: 0`, `googleCount: 1`, `appleCount: 1`, `fbCssRule: false`
- Screenshot: `media/auth-modal-no-facebook.png`
