# Restyle PostBank installment options

## Goal
Flatten `#installment-options` chrome and keep both method buttons on one row on mobile.

## Changes
- `#installment-options`: no outer padding/border/background (transparent, flat)
- `.installment-options__grid`: `flex-wrap: nowrap` so options stay side-by-side
- `.installment-option`: `flex: 1 1 0; min-width: 0` (share row; shrink images/captions)

## Files
- `poruchka.html` (canonical checkout styles)
- `index.html` (mirrored)

## Untouched
- Selection JS / leasing modal triggers
- Box Now work

## Branch
`cursor/restyle-installment-options-38de` → base `cursor/hide-shipping-radios-9569`
