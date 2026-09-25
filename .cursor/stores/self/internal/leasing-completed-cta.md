# Leasing-completed checkout CTA

## Behaviour
When leasing modal apply is **filled**:
1. Hide `#aside-leasing-btn`
2. Morph `#step-confirm .checkout-finish.btn` → **КУПИ НА ИЗПЛАЩАНЕ** + gray hint `(Продължаваш към страницата на кредитора)` (Plasico green `#55a630`)
3. Mark ready state: `body.is-leasing-ready` + `data-leasing-ready="1"` (also `html.pl-leasing-cta-complete`)

Restore aside + normal **Купи** when:
- apply not filled / `PlasicoLeasing.clearApply()`
- user selects any payment other than `payment_id=8`

## Filled detection
`isLeasingApplyFilled()` → `sessionStorage['plasico-leasing-apply']` (also `state.apply`) has non-empty `fullName`, `phone`, `egn`, `email` after successful `#pl-leasing-apply` submit (`handleApplySubmit` → `writeSavedApply`).

CTA active when filled **and** (`payment_id=8` checked **or** no payment selected) — keeps no-payment-preselect intact.

## Files
- `local-leasing-modal.js` (+ `_leasing_modal.js` mirror)
- `local-leasing-modal.css`
- `index.html` / `poruchka.html` — inline `#local-leasing-modal-inline` **synced** with JS + `#checkout-finish-eyebrow` CTA styles

## API
`PlasicoLeasing.isApplyFilled`, `isCompletedCtaActive`, `syncCheckoutCta`, `clearApply`; event `plasico:leasing-apply`.

## Verify
`node _verify_leasing_completed_cta.js` (also `PLASICO_BASE=…/poruchka.html`) → media `leasing-completed-cta-*.png`

## Gap closed
Prior landing (`0fbe764`) put CTA logic only in the external JS file; HTML inline fallbacks were stale. Inline scripts on both pages now include `syncCheckoutCta` + `body.is-leasing-ready`.

Landed: `main` @ `5c7e918` (inline sync + body.is-leasing-ready; prior partial `0fbe764`).
