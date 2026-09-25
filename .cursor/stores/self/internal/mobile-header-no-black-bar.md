# Mobile header: no black bar + pinned `#head`

## Request (Simona, urgent)
1. Remove thick solid black strip on mobile (`header.cl.rel`, ~605px / ~390px). Yellow profile was overlapping it.
2. Pin `#head` **always** (sticky/fixed) while scrolling — mobile and desktop. Profile/cart must stay usable under the pinned header.

## Cause
Prior desktop full-bleed fix set `header.cl.rel::before{display:block!important;height:30px;background:#000}`. That overrode Plasico’s mobile rule (`#top-line, header::before{display:none}` at ≤990px), so an empty 30px black band sat on top of `#head`.

Sticky on `#head` alone would only stick for the height of its parent (`header` / `.pw`); pinning `header.cl.rel` keeps `#head` at the viewport top for the whole scroll.

## Fix
In `index.html` + `poruchka.html`:
- `header.cl.rel{position:sticky;top:0;z-index:250}` — pins logo/phone/profile/cart (and desktop `#top-line`) always
- `@media (max-width:990px)`: `header::before`, `#top-line`, `#top-line::after` → `display:none!important; height:0` (black strip gone)
- `#head` stays `position:relative` (cart cluster absolute from `4387cd9`); opaque `#head:before` full-bleed white + bottom border so content doesn’t show through while sticky
- Desktop ≥991: black `#top-line` / `::before` unchanged (Магазини / Сервиз etc.)

## Verify (`_verify_mobile_header_no_black_bar.py` → PASS)
- 390 / 605: `beforeDisplay=none`, `#head.top=0`, height 60; profile/cart fully in light row; header sticky after scrollY=400
- Profile menu opens under sticky header
- Desktop: `beforeHeight=30px`, top-line links present; after scroll header still at top with black bar

## Media
- `media/mobile-header-no-black-bar.png` (mobile, no black strip)
- `media/mobile-header-sticky-scrolled.png`
- `media/mobile-header-no-black-bar-desktop.png`
