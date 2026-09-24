from pathlib import Path

for n in ["index.html", "poruchka.html"]:
    t = Path(n).read_text(encoding="utf-8")
    print(
        n,
        "csp=",
        t.lower().count("content-security-policy"),
        "effectiveZip=",
        "effectiveZip" in t,
        "cfg.zip=",
        'zip: "1000"' in t,
    )
