# Leasing buy CTA left-aligned

## Issue
`.checkout-finish-wrap.is-leasing-complete` (КУПИ НА ИЗПЛАЩАНЕ + creditor hint) was centered in `#step-confirm` — wrap + hint used `text-align: center`, so the green button sat centered above the wider hint.

## Fix
`text-align: left` on:
- `.checkout-finish-wrap` / `.checkout-finish-wrap.is-leasing-complete`
- `.checkout-finish__hint`

Button label stays centered inside the green CTA (`align-items` / `text-align: center` on `.checkout-finish.btn.is-leasing-complete` unchanged). Leasing CTA morph/hide-aside behavior unchanged.

## Files
- `index.html` + `poruchka.html` (pretty CSS block + `#checkout-finish-eyebrow`)
- `local-leasing-modal.css`

## Verify
- Local `:8780` + live `https://newcart-plasico-app.vercel.app/`
- `node _verify_leasing_buy_cta_left.js` — wrap/hint `text-align:left`, button+hint share left edge, not centered in step
- Shot: `media/leasing-buy-cta-left.png`

Landed: `main` @ `be700a8`
