# Auth register OAuth below submit

## Why
Register step only had password fields + „Регистрирай се“ + switch to login — users on the unknown-email path could not use the same Facebook / Google / Apple circles already offered on the email entry step.

## What
Mirrored the email-step pattern into `#auth-step-register` after `form#auth-register-form` / `button.auth-modal__submit`, before „Имаш акаунт? Вход“:
- divider „или“
- hint „използвайте твоя социален акаунт“
- `.auth-modal__oauth` with three `.auth-modal__social` links (`data-auth-social` facebook/google/apple)

Files: `index.html`, `poruchka.html`. Existing CSS + `data-auth-social` click handler reused — no new JS.

**Superseded / extended:** login step OAuth added too — see `internal/auth-login-register-oauth.md`.

## Verify
- Register chunk order: `</form>` → oauth → switch
- Demo pills `default` / `unknown` / `known` unchanged
- Help `tel:070020810` unchanged
- Screenshot: `media/auth-register-oauth-below-submit.png`
