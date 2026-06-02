---
name: JMHZ Viewer is a compiled SolidJS bundle
description: The root JMHZ VIEWER app ships only as built artifacts; how to safely customize its runtime-rendered DOM.
---

The root JMHZ VIEWER (`/index.html`) loads a pre-built SolidJS app from `assets/viewer.runtime_*.js` (+ other hashed chunks in `assets/`, Monaco in `vendor/`), wired up by `manifest.js`. The SolidJS **source code is not in the repository** — only minified build output.

**Why:** The site was imported as a pre-built static bundle. UI like the upload drop-zone (`.drop-zone`), toolbars, etc. are created at runtime by the bundle, so they do not exist in the static `index.html` body.

**How to apply:** Never try to add ARIA/markup/behavior by editing the minified bundle or by editing static HTML that doesn't contain the element. Instead use **progressive enhancement**: a `MutationObserver` on `document.body` that finds the element once SolidJS renders it and applies attributes/handlers (guard with a `data-*` flag to run once). This is exactly how the marquee and drop-zone a11y enhancements in `index.html` work. CSS (e.g. `:focus-visible`) can target bundle-rendered classes directly.
