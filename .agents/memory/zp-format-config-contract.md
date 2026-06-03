---
name: ZP format config contract (stats object)
description: Compiled JMHZ viewer runtime requires every format config to expose a stats object or it crashes on file load.
---

# Format config must expose a `stats` object

Any format config consumed by the compiled viewer runtime (root `/`, `assets/viewer.runtime_*.js`) MUST include a `stats` object shaped like the built-in REGZEC/JMHZ configs:

```
stats: { employer: <fieldKey|null>, date: <fieldKey|null>, citizenship: <fieldKey|null>, action: <fieldKey|null>, partialAccept: <bool> }
```

**Why:** The runtime reads `e.stats.employer` / `e.stats.date` / `e.stats.citizenship` / `e.stats.partialAccept` in toolbar/summary computeds. The guards are written `!e.stats.employer` — they assume `e.stats` itself always exists. A config without `stats` throws `Cannot read properties of undefined (reading 'employer')` the moment a file is loaded, which surfaces to the user as "viewer nijak nereaguje" (the load handler catches it and shows a generic "Nepodařilo se načíst XML soubor"). Node-level repros of the data layer (detectFormat/findRows/field extraction) pass fine and will NOT catch this — only loading a file through the real runtime in a browser does.

**How to apply:** When adding a new native format (like HOZ/PPPZ in `assets/zp-formats.js`), set safe defaults (all `null` / `false`, like JMHZ) unless you intentionally wire a feature. Put it on the shared base so every config inherits it. After any such change, verify by loading a real file in a browser (service-worker-bypassing harness), not just Node.
