# Profile menu renamed (Simona 6 labels)

## Request
Replace the 4 profile-dropdown labels with Simona’s 6 account options on **both**:
- Header `#btn-top-profile` → `#user-profile-menu`
- Checkout `#btn-account-auth` → `#checkout-profile-menu`

Keep existing light menu styling (white bg, green hover). **Изход** stays the distinct red logout row. Do not restyle to orange.

Also update `p.co-profile-cta__text` under `aside.co-profile-cta`.

## Labels (both menus)
1. История на поръчките  
2. Смяна на парола  
3. Моите адреси  
4. Моите фирми  
5. Рекламации  
6. Изход  

## CTA copy
`p.co-profile-cta__text` →  
**Направете си профил за да следите поръчките си и да имате автоматично попълнени данни.** `(незадължително)`  
(replaces deliveries / purchase list / invoices / e-receipts copy)

## Links
All five nav items → `https://plasico.bg/account` (account hub; no separate public routes for orders/password/addresses/companies/claims found — same pattern as prior profile menu work).

**Изход** still clears `localStorage.plasico_demo_auth` via existing logout handlers (`#btn-top-logout` / `#btn-checkout-logout`).

## Files
- `index.html`, `poruchka.html`, `boxnowno.html` — both menus + CTA text
- Screenshot (header menu): `media/profile-menu-renamed.png`
- Screenshot (CTA): `media/profile-cta-text.png`
- Verify: `_verify_profile_menu_renamed.py`, `_verify_profile_cta_text.py`

## Verify (:8780)
- Logged in → header + checkout menus each show the 6 labels in order
- Menu bg white; logout color `#b00020`; no orange restyle
- Изход clears demo auth and restores guest CTA
- Guest CTA text matches Simona copy above
- Scripts → **PASS**
