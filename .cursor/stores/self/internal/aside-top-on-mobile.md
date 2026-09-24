# Aside order summary on top (mobile)

## Goal
On mobile, `aside.checkout-layout__aside` / `.checkout-layout__aside-sticky` (ПОРЪЧКА) must sit **above** `.checkout-layout__main`, not below. Desktop side-by-side layout unchanged.

## Change
CSS in `index.html` + `poruchka.html` inside `@media (max-width:1100px)` (stacked breakpoint):

- `.checkout-layout` → `flex-direction: column`
- `.checkout-layout__aside` → `order: -1`
- `.checkout-layout__main` → `order: 1`
- sticky aside → `position: static` when stacked

Desktop `@media (min-width:1101px)` keeps row layout + sticky aside; default `order: 0`.

## Verify (`http://127.0.0.1:8780`, Playwright)

| Viewport | asideBeforeMain | notes |
|----------|-----------------|-------|
| 390×844  | true            | aside top 70, main top 730 |
| 900×800  | true            | same stack order |
| 1280×900 | false           | aside to the right of main |
| poruchka.html @390 | true     | mirrored |

Screenshots: `.cursor/stores/self/media/aside-top-mobile390.png`, `aside-top-tablet900.png`, `aside-top-desktop1280.png`, `aside-top-poruchka390.png`
