# Auth modal help → tel:0700 20 810

## Change
`a.auth-modal__help` in `#auth-modal` (index.html + poruchka.html):

- Line 1: `Имаш ли нужда от помощ?`
- Line 2: `Обади се на 0700 20 810.` (`<br>` between lines; no mid-line dash)
- `href`: `tel:070020810` (digits-only URI; whole link opens dialer)
- CSS: slight horizontal padding + line-height 1.45 for the two-line label

## Scope
Help link only — no other auth-modal edits (email-mode / register-login left alone).

## Landed
`main` @ `7f78122`
