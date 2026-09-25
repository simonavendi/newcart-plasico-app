# Consolidate unseen checkout fixes

**Date:** 2026-09-24  
**Repo:** simonavendi/newcart-plasico-app  
**Branch:** `main` @ `a44b43b` (pushed to `origin/main`)  
**Local URL:** http://127.0.0.1:8780/index.html  
**Live:** https://newcart.plasico.app (Vercel prod `dpl_5Qos7xjCP4U76dB9ak9xT2MvCnaD`)

## Why the user saw nothing

1. **Wrong / incomplete branch in the working folder.** The folder had been on `cursor/leasing-apply-continue-order-befc` (and later a partial `main`) that only carried *some* stacked commits. Many completed fixes lived only on separate feature branches (`remove-boxnow-city-field`, `remove-boxnow-lead`, `boxnow-button-logo`, `remove-continue-shopping`, `leasing-apply-continue-45bc`, etc.) and were **never merged into the branch being served**.
2. **`:8780` was serving this folder** (byte-identical to local `index.html`), so the problem was not a wrong document root — it was that **the checked-out tree itself lacked the completed UX**. Two python `http.server` processes were also bound to 8780; both were killed and one server was restarted from `C:\vibe\plasico new cart`.
3. **`main` and feature branches had diverged** (parallel Box Now fullscreen SHAs), so a clean fast-forward was impossible; missing work had to be cherry-picked / patched onto `main`.

## What was integrated onto `main`

| Fix | Source / notes |
|-----|----------------|
| Box Now fullscreen iframe + return-to-cart | Already on `main` (`c6905fb`…`f33e830`) |
| Bank transfer proforma note | Cherry-pick `6085e02` → `b0e08a1` |
| Hide ship radios | Cherry-pick `e337d4a` → `76df044` |
| Installment flat + one mobile row | Cherry-pick `4092688` → `ba40f49` |
| Terms native required, no decorative `*` | Already on `main` (`296fb53`) |
| Remove shipping info banner | Already on `main` (`2062e1f`) |
| Box Now logo on ship option | Cherry-pick `34ecda4` → `330f02e` (+ `assets/boxnow-logo.png`) |
| Remove continue-shopping + city + lead; leasing continue + save/close/show | Consolidated commit `a44b43b` (from city/lead/leasing-45bc work; button label **Продължи с поръчката**) |

**Kept:** `partnerId` **18248**.

## Hard verify (served `index.html`)

Served bytes **equal** local `main` file. Markers:

- Absent: city field, Box Now lead, continue-shopping, shipping banner, decorative asterisk  
- Present: `boxnow-fullscreen`, `boxnow-logo.png`, `18248`, `проформа фактура`, `Продължи с поръчката`, `flex-wrap:nowrap`, hidden radios (`clip:rect(0,0,0,0)`), leasing `sessionStorage` in `local-leasing-modal.js`  
- Logo asset: HTTP 200 / 7007 bytes

## Refresh

Hard-refresh: **http://127.0.0.1:8780/index.html** (Ctrl+F5).  
Production alias after deploy: **https://newcart.plasico.app**

## Preference (durable)

Always land Plasico cart work on **`main`** (commit + push `origin/main`); do not leave completed UX only on feature branches.
