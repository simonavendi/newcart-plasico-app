# Auth modal help → tel:0700 20 810

## Change
`a.auth-modal__help` in `#auth-modal` (index.html + poruchka.html):

- Text: `Имаш ли нужда от помощ? - Обади се на 0700 20 810.`
- `href`: `tel:070020810` (digits-only URI; whole link opens dialer)
- CSS: slight horizontal padding + line-height 1.35 so the longer label wraps cleanly

## Scope
Help link only — no other auth-modal edits (email-mode switch left alone).

## Landed
`main` @ `7310b43`
