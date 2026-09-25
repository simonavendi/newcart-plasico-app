# Auth login + register OAuth circles

## Change
Facebook / Google / Apple OAuth circles under **both** auth submit buttons:

1. `#auth-step-register` — below **Регистрирай се**, above switch («Имаш акаунт? Вход»)
2. `#auth-step-login` — below **Вход**, above switch («Искаш да ползваш друг акаунт?…»)

## Markup
Matches `#auth-step-email`:
- `.auth-modal__divider` («или»)
- `.auth-modal__social-hint` («използвайте твоя социален акаунт»)
- `.auth-modal__oauth` with three `a.auth-modal__social` links using `data-auth-social=facebook|google|apple`

Existing delegated click handler on `[data-auth-social]` is reused (no new JS).

## Files
- `index.html`
- `poruchka.html`

## Verify
Each of email / login / register has exactly one `.auth-modal__oauth` and providers `[facebook, google, apple]`.
