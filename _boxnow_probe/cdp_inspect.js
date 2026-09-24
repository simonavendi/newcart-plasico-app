const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9222;
const userData = path.join(process.cwd(), "_boxnow_probe", "cdp-profile");
fs.mkdirSync(userData, { recursive: true });

const child = spawn(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--remote-debugging-port=" + port,
    "--user-data-dir=" + userData,
    "--window-size=1280,1600",
    "about:blank",
  ],
  { stdio: ["ignore", "pipe", "pipe"] }
);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitReady() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch("http://127.0.0.1:" + port + "/json/version");
      if (r.ok) return await r.json();
    } catch {}
    await sleep(200);
  }
  throw new Error("cdp not ready");
}

function attachWs(url) {
  let WS;
  try {
    WS = require("ws");
  } catch {
    require("child_process").execSync("npm install ws --no-save", {
      stdio: "inherit",
    });
    WS = require("ws");
  }
  const ws = new WS(url);
  let id = 0;
  const pending = new Map();
  const handlers = [];
  ws.on("message", (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    } else {
      for (const h of handlers) h(msg);
    }
  });
  function onEvent(fn) {
    handlers.push(fn);
  }
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
  }
  const ready = new Promise((res, rej) => {
    ws.on("open", res);
    ws.on("error", rej);
  });
  return { ws, send, onEvent, ready };
}

(async () => {
  try {
    const ver = await waitReady();
    console.log("Browser", ver.Browser);
    const tab = await (
      await fetch(
        "http://127.0.0.1:" +
          port +
          "/json/new?" +
          encodeURIComponent("http://127.0.0.1:8780/index.html"),
        { method: "PUT" }
      )
    ).json();
    console.log("tab", tab.id);

    const { ws, send, onEvent, ready } = attachWs(tab.webSocketDebuggerUrl);
    await ready;
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Network.enable");
    await send("Console.enable");

    const consoleLogs = [];
    const interestingNet = [];
    const netFails = [];
    onEvent((msg) => {
      if (msg.method === "Runtime.consoleAPICalled") {
        consoleLogs.push(
          msg.params.type +
            ": " +
            msg.params.args.map((a) => a.value ?? a.description).join(" ")
        );
      }
      if (msg.method === "Network.responseReceived") {
        const r = msg.params.response;
        if (/boxnow|openstreetmap|globallockers|leaflet/i.test(r.url)) {
          interestingNet.push(r.status + " " + r.url.slice(0, 160));
        }
      }
      if (msg.method === "Network.loadingFailed") {
        netFails.push(msg.params.errorText + " " + (msg.params.type || ""));
      }
    });

    await send("Page.navigate", {
      url: "http://127.0.0.1:8780/index.html",
    });
    await sleep(10000);

    const evalRes = await send("Runtime.evaluate", {
      expression: `(() => {
  const wrap = document.getElementById("boxnow-widget-wrap");
  const map = document.getElementById("boxnowmap");
  const iframe = map && map.querySelector("iframe");
  if (wrap) wrap.scrollIntoView({ block: "center" });
  const panel = document.querySelector('[data-ship-panel="boxnow"]');
  const cs = panel ? getComputedStyle(panel) : null;
  return JSON.stringify({
    wrap: wrap
      ? {
          w: wrap.clientWidth,
          h: wrap.clientHeight,
          display: getComputedStyle(wrap).display,
          overflow: getComputedStyle(wrap).overflow,
        }
      : null,
    map: map
      ? {
          w: map.clientWidth,
          h: map.clientHeight,
          childCount: map.children.length,
          html: map.innerHTML.slice(0, 800),
        }
      : null,
    iframe: iframe
      ? {
          src: iframe.src,
          w: iframe.clientWidth,
          h: iframe.clientHeight,
          offsetW: iframe.offsetWidth,
          offsetH: iframe.offsetHeight,
          style: iframe.getAttribute("style"),
          complete: iframe.complete,
        }
      : null,
    panel: panel
      ? {
          hidden: panel.hidden,
          hasHidden: panel.hasAttribute("hidden"),
          display: cs.display,
          visibility: cs.visibility,
          w: panel.clientWidth,
          h: panel.clientHeight,
        }
      : null,
    ship: (document.querySelector('input[name="ship_to_id[2]"]:checked') || {})
      .value,
    cfg: window._bn_map_widget_config && {
      partnerId: window._bn_map_widget_config.partnerId,
      autoshow: window._bn_map_widget_config.autoshow,
      zip: window._bn_map_widget_config.zip,
      type: window._bn_map_widget_config.type,
    },
    ensure: typeof window.__plasicoEnsureBoxNow,
    onShip: typeof window.__plasicoBoxNowOnShipChange,
  }, null, 2);
})()`,
      returnByValue: true,
    });
    console.log("DOM", evalRes.result.value);

    await sleep(1500);
    const shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(
      "_boxnow_probe/shots/cart-cdp.png",
      Buffer.from(shot.data, "base64")
    );

    console.log("consoleLogs", JSON.stringify(consoleLogs.slice(-50), null, 2));
    console.log("interestingNet", JSON.stringify(interestingNet.slice(-40), null, 2));
    console.log("netFails", JSON.stringify(netFails.slice(-20), null, 2));

    const targets = await (
      await fetch("http://127.0.0.1:" + port + "/json/list")
    ).json();
    console.log(
      "targets",
      targets.map((t) => ({
        type: t.type,
        url: (t.url || "").slice(0, 140),
        title: t.title,
      }))
    );

    const iframeTarget = targets.find((t) =>
      /map\.boxnow|widget.*boxnow/i.test(t.url || "")
    );
    if (iframeTarget) {
      const i = attachWs(iframeTarget.webSocketDebuggerUrl);
      await i.ready;
      await i.send("Runtime.enable");
      await i.send("Page.enable");
      const inner = await i.send("Runtime.evaluate", {
        expression: `(() => {
  const map = document.getElementById("map");
  const widget = document.getElementById("boxnow_widget");
  const tiles = document.querySelectorAll(".leaflet-tile-pane img").length;
  const markers = document.querySelectorAll(".leaflet-marker-icon").length;
  const list = document.getElementById("boxnow_list_cover");
  return JSON.stringify({
    readyState: document.readyState,
    title: document.title,
    bodyLen: document.body ? document.body.innerHTML.length : 0,
    widget: widget
      ? { w: widget.clientWidth, h: widget.clientHeight, class: widget.className }
      : null,
    map: map ? { w: map.clientWidth, h: map.clientHeight } : null,
    tiles,
    markers,
    listChildren: list ? list.children.length : 0,
    leaflet: typeof L,
    href: location.href,
    vw: window.innerWidth,
    vh: window.innerHeight,
  }, null, 2);
})()`,
        returnByValue: true,
      });
      console.log("INNER", inner.result.value);
      try {
        const ishot = await i.send("Page.captureScreenshot", { format: "png" });
        fs.writeFileSync(
          "_boxnow_probe/shots/iframe-inner-cdp.png",
          Buffer.from(ishot.data, "base64")
        );
      } catch (e) {
        console.log("iframe shot fail", e.message || e);
      }
      i.ws.close();
    } else {
      console.log("No iframe target found");
    }
    ws.close();
  } catch (e) {
    console.error("FAIL", e);
  } finally {
    try {
      child.kill();
    } catch {}
    process.exit(0);
  }
})();
