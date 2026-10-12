from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.goto("http://127.0.0.1:8780/index.html", wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(400)
    page.evaluate(
        """() => {
      const payload = {
        fullName: "Иван Иванов",
        phone: "0888123456",
        egn: "8001010000",
        email: "ivan@example.com",
        column: "personal",
        provider: "bnp",
        columnTitle: "Купи на изплащане",
        months: 12,
        monthly: 45.5,
        total: 546,
        glp: 17.91,
        gpr: 19.4,
        fee: 0,
        promoCode: "",
        downPayment: 0,
        price: 500,
        financed: 500,
        prodId: "1",
      };
      sessionStorage.setItem("plasico-leasing-apply", JSON.stringify(payload));
      document.querySelectorAll('input[name="payment_id"]').forEach((r) => {
        r.checked = false;
      });
    }"""
    )
    page.reload(wait_until="load", timeout=30000)
    page.wait_for_timeout(600)
    result = page.evaluate(
        """() => {
      const pay8 = document.querySelector('input[name="payment_id"][value="8"]');
      const host = document.getElementById("leasing-schema");
      const panel = document.getElementById("pl-leasing-saved");
      const install = document.getElementById("installment-options");
      const hostHidden =
        !host ||
        host.hidden ||
        host.classList.contains("hide") ||
        host.classList.contains("sf-hidden");
      const panelHidden = !panel || panel.hidden || !panel.innerHTML.trim();
      const installHidden =
        !install ||
        install.hidden ||
        install.classList.contains("hide") ||
        install.classList.contains("sf-hidden");
      const schemeEl = panel && panel.querySelector(".pl-leasing-saved__scheme");
      return {
        pay8Checked: !!(pay8 && pay8.checked),
        hostHidden,
        panelHidden,
        installHidden,
        schemeText: schemeEl ? schemeEl.textContent.trim() : "",
        hasApply: !!sessionStorage.getItem("plasico-leasing-apply"),
      };
    }"""
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    ok = (
        result["pay8Checked"]
        and not result["hostHidden"]
        and not result["panelHidden"]
        and not result["installHidden"]
        and "12" in result["schemeText"]
        and result["hasApply"]
    )
    print("PASS:", ok)
    browser.close()
    raise SystemExit(0 if ok else 1)
