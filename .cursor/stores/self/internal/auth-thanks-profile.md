# Auth modal: circle socials + thank-you + profile

## Changes
- `.auth-modal__social` → 44px circles, labels visually hidden; oauth row side-by-side (**Google + Apple only** — Facebook intentionally omitted)
- New `#auth-step-thanks`: smiley + “Благодарим, че станахте част от Plasico”
- Demo auth via `localStorage` key `plasico_demo_auth`; after login/register/social → thanks → auto-close (~2.2s)
- Top bar `#user`: guest links swap to circular `#btn-top-profile` when logged in

## Files
- `index.html`, `poruchka.html`

## Verify (:8780)
- Screenshots: `media/auth-social-circles.png`, `media/auth-thanks-step.png`, `media/auth-topbar-profile.png`
