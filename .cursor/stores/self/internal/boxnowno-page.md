# /boxnowno — BOX NOW unavailable checkout copy

## Why
Demo/variant checkout where BOX NOW cannot be used because cart item dimensions do not fit lockers. Normal checkout (`index.html` / `poruchka.html`) stays unchanged.

## What
New static page `boxnowno.html` (copy of live checkout `index.html`) served as:

- Local: http://127.0.0.1:8780/boxnowno.html  
- Live (Vercel `cleanUrls`): https://newcart-plasico-app.vercel.app/boxnowno

Differences vs normal checkout:

1. **BOX NOW row greyed out** — `disabled` radio + `is-disabled boxnowno-unavailable`; not selectable
2. **Info button** on that row — same hover/click/outside/Escape UX as aside discount info (`eb6f2a2`); tip: *Този метод не е наличен заради размерите на артикулите.*
3. **Default shipping** — `ship_to_id[2]=office` + Speedy office (`office_courier=speedy`) preselected; office panel visible on load

## Files
- `boxnowno.html` — only page changed for this variant
- `index.html` / `poruchka.html` — untouched (BOX NOW still default + selectable)

## Verify
`node _verify_boxnowno.js` @ http://127.0.0.1:8780/boxnowno.html  
Screenshot: `media/boxnowno-grey-boxnow.png`  
Commit: `7b84fc0` on `main`
