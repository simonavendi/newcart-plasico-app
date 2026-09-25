# Hide shipping method radios

- Branch: `cursor/hide-shipping-radios-9569`
- PR: https://github.com/simonavendi/newcart-plasico-app/pull/17
- Base: `cursor/boxnow-return-to-cart-a244`
- Change: CSS-only in `index.html` + `poruchka.html`
  - `.co-option-row` gets `position:relative`
  - `#checkout #step-ship-method .co-option-stack .co-option-row > input[type=radio]` visually clipped (opacity/clip/sr-only style)
- Radios stay in DOM; selection via row border / `.clicked` / `:has(input:checked)`
- Broader than earlier PR #8 name-specific selector (`ship_to_id[2]`) so all ship-method stack choices are covered
