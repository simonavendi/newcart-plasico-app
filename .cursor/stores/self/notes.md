# plasico cart notes

- Auth modal: Facebook OAuth removed (Google + Apple kept) — `internal/remove-facebook-oauth.md` (main clear since `c949930`; WIP race cleaned)
- Aside cart Ozone rows: delivery from `api/delivery-eta.json`, FLASH 10% promo lines, restored qty line totals — `internal/cart-delivery-flash-promo.md`
- BOX NOW fullscreen + Izbor select: local `boxnow-fullscreen-map.html` (main.css + mapType=popup) — `internal/boxnow-fullscreen-keep-select.md` (supersedes popup.html modal regression from mega-gamma fix)
- BOX NOW locker name autofill + Смени summary: see `internal/boxnow-autofill-locker-name.md`
- Box Now row: “Автомат” text before logo — see `internal/boxnow-avtomat-before-logo.md`
- Terms required label: `(задължително)` on `#step-confirm label.conditions` — index `a3e1619`, poruchka `d7d8f36`; see `internal/terms-required-label.md`
- Terms consent: native `required` checkbox on `main` @ `296fb53` — no decorative `*`; see `internal/terms-consent-required.md`
- User preference: always commit to **main**
- Localhost: http://127.0.0.1:8780/index.html
- Partner ID: **18248**
- Auth modal: circle Google/Apple + thank-you + top-bar profile (`a71bfa8`) — see `internal/auth-thanks-profile.md`; Facebook stays omitted
- Speedy/Econt office map locators + „Избери офис от карта“ — `internal/speedy-econt-office-locators.md`
