# Leasing-completed checkout CTA

## Behaviour
When leasing modal apply is **filled**:
1. Hide `#aside-leasing-btn`
2. Morph `#step-confirm .checkout-finish.btn` → **КУПИ НА ИЗПЛАЩАНЕ** + gray hint `(Продължаваш към страницата на кредитора)` (Plasico green `#55a630`)

Restore aside + normal **Купи** when:
- apply not filled / `PlasicoLeasing.clearApply()`
- user selects any payment other than `payment_id=8`

## Filled detection
`isLeasingApplyFilled()` → `sessionStorage['plasico-leasing-apply']` (also `state.apply`) has non-empty `fullName`, `phone`, `egn`, `email` after successful `#pl-leasing-apply` submit (`handleApplySubmit` → `writeSavedApply`).

CTA active when filled **and** (`payment_id=8` checked **or** no payment selected) — keeps no-payment-preselect intact.

## Files
- `local-leasing-modal.js` (+ `_leasing_modal.js` mirror)
- `local-leasing-modal.css` (synced into `index.html` / `poruchka.html` via `_sync_leasing_css_inline.py`)
- `index.html` / `poruchka.html` — `#checkout-finish-eyebrow` CTA styles

## API
`PlasicoLeasing.isApplyFilled`, `isCompletedCtaActive`, `syncCheckoutCta`, `clearApply`; event `plasico:leasing-apply`.

## Verify
`node _verify_leasing_completed_cta.js` → media `leasing-completed-cta-*.png`

Landed: `main` @ `0fbe764` (impl) / `3c62114` (verify + shots)
