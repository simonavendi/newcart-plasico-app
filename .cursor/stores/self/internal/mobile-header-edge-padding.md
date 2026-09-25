# Mobile header utility edge padding

## Request
Phone / search / cart sit flush against the right viewport edge on mobile — no breathing room.

## Cause
`#head-cart-cluster` used `right:2px` at ≤990 / ≤480 after the absolute cluster move. Cart yellow circle + badge read as glued to the screen edge.

## Fix (`index.html` + `poruchka.html`)
- Cluster `right:2` → **`12px`** (both mobile breakpoints)
- Shift `#search` / `#top-phone` by the same **+10px** so phone→search→cart gaps stay ~even:
  - Guest ≤990: search `58`, phone `93` (was 48 / 83)
  - Guest ≤480: search `52`, phone `87` (was 42 / 77)
  - Logged-in ≤990: search `110`, phone `145` (was 100 / 135)
  - Logged-in ≤480: search `96`, phone `131` (was 86 / 121)
- Left hamburger (`.navbtn` ~5px) unchanged; cart wheels / profile-beside-cart rules untouched

## Verify
- `_verify_mobile_header_edge_padding.py` → PASS (guest 390–768: `clusterRight=12px`, `edgePad=12`, phone/search/cart gaps=8; logged-in profile left of cart)
- `_verify_cart_icon_guest_gap.py` → PASS (wheels 34×24; guest gaps even)
- Media: `media/mobile-header-edge-padding-390.png`

## SHA
`main` @ `9f1c71a`
