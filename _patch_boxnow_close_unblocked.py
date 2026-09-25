# -*- coding: utf-8 -*-
"""Unblock Box Now fullscreen close: host chrome bar above iframe + stacking."""
from pathlib import Path

FILES = ("index.html", "poruchka.html", "boxnowno.html")

OLD_CSS = """/* Host overlay: local boxnow-fullscreen-map.html (mapType=popup + main.css edge-to-edge). */
.boxnow-fullscreen{
  position:fixed;inset:0;width:100%;height:100%;margin:0;padding:0;
  z-index:2147483000;background:#fff;box-sizing:border-box
}
.boxnow-fullscreen iframe{
  display:block;border:0;width:100%;height:100%;margin:0;padding:0;
  background:#fff
}
.boxnow-fullscreen__close{
  position:absolute;top:10px;right:10px;z-index:2;
  width:36px;height:36px;border:0;border-radius:50%;
  background:#111;color:#fff;font-size:22px;line-height:1;
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  box-shadow:0 1px 4px rgba(0,0,0,.25)
}
.boxnow-fullscreen__close:hover{background:#333}
.boxnow-fullscreen__close:focus-visible{outline:2px solid #44d62d;outline-offset:2px}
@media (max-width:800px){
  .boxnow-fullscreen__close{top:8px;right:8px;width:40px;height:40px}
}
html.boxnow-locator-open,html.boxnow-locator-open body{
  overflow:hidden!important;touch-action:none
}"""

NEW_CSS = """/* Host overlay: local boxnow-fullscreen-map.html (mapType=popup + main.css edge-to-edge).
   Host chrome bar sits ABOVE the iframe so × / Назад stay clickable (iframe + sticky
   header / preview chrome must not steal top-right hits). */
.boxnow-fullscreen{
  position:fixed;inset:0;width:100%;height:100%;margin:0;padding:0;
  z-index:2147483000;background:#fff;box-sizing:border-box;
  display:-webkit-box;display:-ms-flexbox;display:flex;
  -webkit-box-orient:vertical;-webkit-box-direction:normal;
  -ms-flex-direction:column;flex-direction:column
}
.boxnow-fullscreen__chrome{
  -webkit-box-flex:0;-ms-flex:0 0 auto;flex:0 0 auto;
  position:relative;z-index:5;
  display:-webkit-box;display:-ms-flexbox;display:flex;
  -webkit-box-align:center;-ms-flex-align:center;align-items:center;
  -webkit-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;
  gap:8px;min-height:48px;padding:6px 10px;
  box-sizing:border-box;background:#111;color:#fff;
  pointer-events:auto;-webkit-user-select:none;user-select:none
}
.boxnow-fullscreen__back{
  position:relative;z-index:6;margin:0;padding:8px 12px;border:0;border-radius:4px;
  background:transparent;color:#fff;font:inherit;font-family:"exo2b",sans-serif;
  font-size:13px;line-height:1;letter-spacing:.04em;text-transform:uppercase;
  cursor:pointer;white-space:nowrap
}
.boxnow-fullscreen__back:hover{background:rgba(255,255,255,.12)}
.boxnow-fullscreen__back:focus-visible{outline:2px solid #44d62d;outline-offset:2px}
.boxnow-fullscreen__close{
  position:relative;z-index:6;margin:0 0 0 auto;
  width:40px;height:40px;border:0;border-radius:50%;
  background:#fff;color:#111;font-size:24px;line-height:1;
  cursor:pointer;display:-webkit-box;display:-ms-flexbox;display:flex;
  -webkit-box-align:center;-ms-flex-align:center;align-items:center;
  -webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;
  pointer-events:auto;box-shadow:0 1px 4px rgba(0,0,0,.25)
}
.boxnow-fullscreen__close:hover{background:#eee}
.boxnow-fullscreen__close:focus-visible{outline:2px solid #44d62d;outline-offset:2px}
.boxnow-fullscreen iframe{
  position:relative;z-index:1;
  -webkit-box-flex:1;-ms-flex:1 1 auto;flex:1 1 auto;
  display:block;border:0;width:100%;height:auto;min-height:0;margin:0;padding:0;
  background:#fff;pointer-events:auto
}
html.boxnow-locator-open,html.boxnow-locator-open body{
  overflow:hidden!important;touch-action:none
}
/* Sticky header / cart cluster must not intercept overlay clicks */
html.boxnow-locator-open header.cl.rel,
html.boxnow-locator-open #head,
html.boxnow-locator-open #head-cart-cluster,
html.boxnow-locator-open #cookiescript_badge{
  pointer-events:none!important;z-index:0!important
}"""

# JS: wrap close in chrome bar + add Back button
OLD_JS = """    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "boxnow-fullscreen__close";
    closeBtn.setAttribute("aria-label", "Затвори");
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      closeBoxnowLocator();
    });

    var i = document.createElement("iframe");
    i.src = buildBoxnowSrc(cfg.zip);
    i.id = "boxnow_map_widget" + Math.floor((1 + Math.random()) * 0x10000);
    i.title = "BOX NOW карта с автомати";
    i.setAttribute("allow", "geolocation");
    i.setAttribute("loading", "eager");
    i.onerror = function () {
      if (i.getAttribute("data-fallback") === "1") return;
      i.setAttribute("data-fallback", "1");
      var q = i.src.split("?")[1] || "";
      i.src = BOXNOW_MAP_FALLBACK + (q ? "?" + q : "");
    };

    root.appendChild(closeBtn);
    root.appendChild(i);"""

NEW_JS = """    var chromeBar = document.createElement("div");
    chromeBar.className = "boxnow-fullscreen__chrome";

    var backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "boxnow-fullscreen__back";
    backBtn.setAttribute("aria-label", "Назад към количката");
    backBtn.textContent = "← НАЗАД";
    backBtn.addEventListener("click", function (e) {
      e.preventDefault();
      closeBoxnowLocator();
    });

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "boxnow-fullscreen__close";
    closeBtn.setAttribute("aria-label", "Затвори");
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      closeBoxnowLocator();
    });

    chromeBar.appendChild(backBtn);
    chromeBar.appendChild(closeBtn);

    var i = document.createElement("iframe");
    i.src = buildBoxnowSrc(cfg.zip);
    i.id = "boxnow_map_widget" + Math.floor((1 + Math.random()) * 0x10000);
    i.title = "BOX NOW карта с автомати";
    i.setAttribute("allow", "geolocation");
    i.setAttribute("loading", "eager");
    i.onerror = function () {
      if (i.getAttribute("data-fallback") === "1") return;
      i.setAttribute("data-fallback", "1");
      var q = i.src.split("?")[1] || "";
      i.src = BOXNOW_MAP_FALLBACK + (q ? "?" + q : "");
    };

    root.appendChild(chromeBar);
    root.appendChild(i);"""


def main():
    for name in FILES:
        p = Path(name)
        t = p.read_text(encoding="utf-8")
        if OLD_CSS not in t:
            raise SystemExit(f"{name}: OLD_CSS not found")
        if OLD_JS not in t:
            raise SystemExit(f"{name}: OLD_JS not found")
        t = t.replace(OLD_CSS, NEW_CSS, 1).replace(OLD_JS, NEW_JS, 1)
        p.write_text(t, encoding="utf-8")
        print(name, "patched OK")


if __name__ == "__main__":
    main()
