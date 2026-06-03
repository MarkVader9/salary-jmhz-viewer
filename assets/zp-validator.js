(function () {
  "use strict";

  var STYLE_ID = "zpv-styles";
  var PANEL_ID = "zpv-inline";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = "" +
      "#" + PANEL_ID + "{position:fixed;left:0;right:0;bottom:0;z-index:900;background:var(--bg,#f1f5f9);display:flex;flex-direction:column;overflow:hidden;}" +
      ".zpv-topbar{display:flex;align-items:center;gap:12px;padding:10px 20px;background:var(--bg-elevated,#fff);border-bottom:1px solid var(--border,#e2e2e2);flex:0 0 auto;}" +
      ".zpv-topbar .zpv-tag{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:.95rem;color:var(--text-primary,#111);flex:1;min-width:0;}" +
      ".zpv-topbar .zpv-tag small{font-weight:500;color:var(--text-faint,#888);}" +
      ".zpv-tbtn{border:1px solid var(--border,#d8d8d8);background:transparent;color:var(--text-secondary,#444);border-radius:8px;padding:7px 14px;font-size:.82rem;font-weight:600;cursor:pointer;white-space:nowrap;}" +
      ".zpv-tbtn:hover{background:var(--bg-hover,#f0f0f0);color:var(--text-primary,#000);}" +
      ".zpv-tbtn.zpv-primary{background:var(--accent-bg,#0e7490);border-color:var(--accent-bg,#0e7490);color:var(--on-accent-bg,#fff);}" +
      ".zpv-seg{display:inline-flex;border:1px solid var(--border,#d8d8d8);border-radius:8px;overflow:hidden;}" +
      ".zpv-segbtn{border:0;background:transparent;color:var(--text-secondary,#555);padding:7px 14px;font-size:.82rem;font-weight:600;cursor:pointer;border-right:1px solid var(--border,#e2e2e2);white-space:nowrap;}" +
      ".zpv-segbtn:last-child{border-right:0;}" +
      ".zpv-segbtn:hover{background:var(--bg-hover,#f0f0f0);color:var(--text-primary,#000);}" +
      ".zpv-segbtn.active{background:var(--accent-bg,#0e7490);color:var(--on-accent-bg,#fff);}" +
      ".zpv-scroll{flex:1 1 auto;overflow-y:auto;}" +
      ".zpv-content{max-width:1100px;width:100%;margin:0 auto;padding:16px 20px;}" +
      "#" + PANEL_ID + " .validation-list{max-height:none;border:1px solid var(--border,#e2e2e2);border-radius:10px;overflow:hidden;background:var(--bg-elevated,#fff);}" +
      "#" + PANEL_ID + " .validation-item{align-items:flex-start;}" +
      "#" + PANEL_ID + " .validation-item .severity{margin-top:6px;}" +
      "#" + PANEL_ID + " .validation-item .message{white-space:normal;flex:1;}" +
      "#" + PANEL_ID + " .validation-item .path{white-space:nowrap;}" +
      ".zpv-pad{padding:14px 0;}" +
      "#" + PANEL_ID + " .zpv-section{border:1px solid var(--border,#e2e2e2);border-radius:10px;overflow:hidden;background:var(--bg-elevated,#fff);margin-bottom:12px;}" +
      "#" + PANEL_ID + " .zpv-section .zpv-section{margin:10px 10px 0;}" +
      "#" + PANEL_ID + " .zpv-section .section-header{display:flex;align-items:center;gap:8px;padding:9px 14px;background:var(--bg-hover,#f7f8fa);border-bottom:1px solid var(--border,#e2e2e2);}" +
      "#" + PANEL_ID + " .zpv-section .section-body{padding:0;max-height:none;}" +
      "#" + PANEL_ID + " .zpv-section .field-table{margin:0;}" +
      "#" + PANEL_ID + " .field-value{padding:5px var(--sp-3,12px);}" +
      "#" + PANEL_ID + " .field-value .empty{color:var(--text-faint,#888);font-style:italic;}" +
      "#" + PANEL_ID + " .table-content{max-height:none;}" +
      "#" + PANEL_ID + " .table-view td{cursor:default;}" +
      "#" + PANEL_ID + " .table-view td.name-cell{white-space:nowrap;}" +
      "#" + PANEL_ID + " .table-view .col-id{font-family:ui-monospace,monospace;font-size:.62rem;opacity:.6;display:block;font-weight:400;}" +
      ".zpv-spin{display:inline-block;animation:zpv-spin .7s linear infinite;}" +
      "@keyframes zpv-spin{to{transform:rotate(360deg);}}" +
      ".zpv-muted{color:var(--text-faint,#888);}" +
      ".zpv-hint-note{font-size:.8rem;color:var(--text-faint,#888);margin-top:10px;text-align:center;max-width:520px;}" +
      ".zpv-hint-note strong{color:var(--text-secondary,#555);}";
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  function manifestPath(logical) {
    try {
      var m = window.__JMHZ_MANIFEST__;
      if (m && m.files && m.files[logical]) return m.files[logical];
    } catch (e) {}
    return logical;
  }

  function loadScriptOnce(src) {
    return new Promise(function (resolve, reject) {
      var existing = Array.prototype.some.call(document.scripts, function (sc) { return sc.src.indexOf(src) !== -1; });
      if (existing) return resolve();
      var el = document.createElement("script");
      el.src = src;
      el.onload = function () { resolve(); };
      el.onerror = function () { reject(new Error("Nepodařilo se načíst " + src)); };
      document.head.appendChild(el);
    });
  }

  function waitForValidateXML(timeout) {
    timeout = timeout || 30000;
    return new Promise(function (resolve, reject) {
      var t0 = Date.now();
      var triedLoad = false;
      (function check() {
        if (typeof window.validateXML === "function") return resolve(window.validateXML);
        if (!triedLoad && Date.now() - t0 > 4000) {
          triedLoad = true;
          loadScriptOnce(manifestPath("vendor/xmllint-wasm-bundle.js")).catch(function () {});
        }
        if (Date.now() - t0 > timeout) return reject(new Error("Validační engine (xmllint) není k dispozici."));
        setTimeout(check, 150);
      })();
    });
  }

  function detectType(xmlString) {
    var doc;
    try {
      doc = new DOMParser().parseFromString(xmlString, "application/xml");
    } catch (e) {
      return { error: "parse" };
    }
    var perr = doc.getElementsByTagName("parsererror");
    if (perr && perr.length) return { error: "parse" };
    var root = doc.documentElement;
    if (!root) return { error: "empty" };
    var schemas = window.ZP_SCHEMAS || {};
    var key = null;
    Object.keys(schemas).forEach(function (k) {
      if (schemas[k].root === root.localName) key = k;
    });
    if (!key) return { error: "notzp", rootName: root.localName };
    return { key: key, doc: doc, entry: schemas[key] };
  }

  function runSchemaValidation(xmlString, entry) {
    return waitForValidateXML().then(function (validateXML) {
      return validateXML({
        xml: [{ fileName: "document.xml", contents: xmlString }],
        schema: [{ fileName: entry.fileName, contents: entry.xsd }]
      });
    });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function normalizeSchemaErrors(res) {
    var out = [];
    if (!res) return out;
    var list = res.errors || res.messages || [];
    if (typeof list === "string") list = [list];
    list.forEach(function (e) {
      if (!e) return;
      if (typeof e === "string") { out.push(e); return; }
      out.push(e.message || e.msg || JSON.stringify(e));
    });
    if (!out.length && res.valid === false && res.rawOutput) out.push(String(res.rawOutput));
    return out;
  }

  function plural(n, one, few, many) {
    n = Math.abs(n);
    if (n === 1) return one;
    if (n >= 2 && n <= 4) return few;
    return many;
  }

  // Build a single finding row using the app's shared validation elements
  // (.validation-item / .severity / .path / .message) — the exact markup the
  // compiled runtime renders for JMHZ and REGZEC findings.
  function vItem(level, message, path) {
    var cls = level === "error" ? "severity error" : level === "warning" ? "severity warning" : "severity";
    var style = level === "info" ? ' style="background:var(--accent,#2563eb)"'
      : level === "ok" ? ' style="background:#16a34a"' : "";
    return '<div class="validation-item">' +
      '<span class="' + cls + '"' + style + "></span>" +
      (path ? '<span class="path">' + esc(path) + "</span>" : "") +
      '<span class="message">' + esc(message) + "</span>" +
      "</div>";
  }

  function vGroup(headerHtml, innerHtml) {
    return '<div class="validation-group"><div class="validation-group-header">' + headerHtml + "</div>" + innerHtml + "</div>";
  }

  // Friendly Czech labels for known ZP element tags; unknown tags fall back to
  // their raw localName so the views stay generic for any ZP document shape.
  var LABELS = {
    identifikaceZamestnavatele: "Identifikace zaměstnavatele",
    identifikacniCisloPlatce: "Identifikační číslo plátce",
    nazevPlatce: "Název plátce",
    adresaPlatceUlice: "Ulice",
    adresaPlatceCisloPopisneOrientacni: "Č. popisné / orientační",
    adresaPlatcePsc: "PSČ",
    adresaPlatceObec: "Obec",
    kodZdravotniPojistovny: "Kód zdravotní pojišťovny",
    seznamZmenZamestnancu: "Seznam změn zaměstnanců",
    zmenaZamestance: "Změna zaměstnance",
    kodzmeny: "Kód změny",
    datumZmeny: "Datum změny",
    cisloPojistence: "Číslo pojištěnce",
    prijmeni: "Příjmení",
    jmeno: "Jméno",
    udajePlatby: "Údaje platby",
    mesicHlaseni: "Měsíc hlášení",
    rokHlaseni: "Rok hlášení",
    pocetZamestnancu: "Počet zaměstnanců",
    soucetZakladuPojistneho: "Součet vyměřovacích základů",
    soucetPojistneho: "Součet pojistného",
    typPrehledu: "Typ přehledu"
  };
  function label(name) { return LABELS[name] || name; }

  function elemChildren(el) { return window.ZPKontroly.helpers.directChildren(el); }
  function isLeaf(el) { return elemChildren(el).length === 0; }
  function personName(el) {
    var h = window.ZPKontroly.helpers;
    var n = ((h.childText(el, "prijmeni") || "") + " " + (h.childText(el, "jmeno") || "")).trim();
    return n || null;
  }

  // === KARTY (Formulářové zobrazení) — same .section/.field-table markup the
  //     compiled runtime uses for JMHZ/REGZEC card view. ===
  function fieldRow(el) {
    var name = el.localName;
    var val = (el.textContent || "").trim();
    var valHtml = val ? esc(val) : '<span class="empty">— prázdné —</span>';
    return '<tr class="field-row">' +
      '<td class="field-id">' + esc(name) + "</td>" +
      '<td class="field-label">' + esc(label(name)) + "</td>" +
      '<td class="field-value">' + valHtml + "</td>" +
      "</tr>";
  }

  function renderCardSection(title, el) {
    var children = elemChildren(el);
    var leaves = [], containers = [];
    children.forEach(function (c) { (isLeaf(c) ? leaves : containers).push(c); });
    var html = '<div class="zpv-section"><div class="section-header"><span class="section-title">' + esc(title) + "</span></div>" +
      '<div class="section-body">';
    if (leaves.length) html += '<table class="field-table">' + leaves.map(fieldRow).join("") + "</table>";
    var totals = {}, counts = {};
    containers.forEach(function (c) { totals[c.localName] = (totals[c.localName] || 0) + 1; });
    containers.forEach(function (c) {
      var ln = c.localName;
      counts[ln] = (counts[ln] || 0) + 1;
      var t = label(ln);
      if (totals[ln] > 1) t += " #" + counts[ln];
      var pn = personName(c);
      if (pn) t += " — " + pn;
      html += renderCardSection(t, c);
    });
    html += "</div></div>";
    return html;
  }

  function renderCard(container, doc) {
    var root = doc.documentElement;
    var children = elemChildren(root);
    var rootLeaves = [], rootContainers = [];
    children.forEach(function (c) { (isLeaf(c) ? rootLeaves : rootContainers).push(c); });
    var html = '<div class="zpv-pad">';
    if (rootLeaves.length) {
      html += '<div class="zpv-section"><div class="section-header"><span class="section-title">' + esc(label(root.localName)) + "</span></div>" +
        '<div class="section-body"><table class="field-table">' + rootLeaves.map(fieldRow).join("") + "</table></div></div>";
    }
    rootContainers.forEach(function (c) { html += renderCardSection(label(c.localName), c); });
    if (!rootLeaves.length && !rootContainers.length) html += '<div class="zpv-muted">Dokument neobsahuje žádné údaje.</div>';
    html += "</div>";
    container.innerHTML = html;
  }

  // === TABULKA — same .table-view/.table-content markup as JMHZ/REGZEC table
  //     view. HOZ has repeating records → matrix (rows = changes); PPPZ is a
  //     single record → key/value listing of all leaf values. ===
  function tableCell(val) {
    return "<td>" + (val ? '<span class="cell-value">' + esc(val) + "</span>" : '<span class="cell-empty">—</span>') + "</td>";
  }

  function renderTableHOZ(container, doc) {
    var h = window.ZPKontroly.helpers;
    var root = doc.documentElement;
    var seznam = h.childByName(root, "seznamZmenZamestnancu");
    var zmeny = seznam ? h.childrenByName(seznam, "zmenaZamestance") : [];
    if (!zmeny.length) { container.innerHTML = '<div class="zpv-pad zpv-muted">Soubor neobsahuje žádné změny zaměstnanců.</div>'; return; }
    var cols = [], seen = {};
    zmeny.forEach(function (z) {
      elemChildren(z).filter(isLeaf).forEach(function (f) {
        if (!seen[f.localName]) { seen[f.localName] = true; cols.push(f.localName); }
      });
    });
    var thead = '<tr><th class="name-col name-cell">Změna</th>' +
      cols.map(function (c) { return "<th>" + esc(label(c)) + '<span class="col-id">' + esc(c) + "</span></th>"; }).join("") + "</tr>";
    var tbody = zmeny.map(function (z, idx) {
      var nm = personName(z) || ("Změna #" + (idx + 1));
      var cells = cols.map(function (c) { return tableCell(h.childText(z, c)); }).join("");
      return '<tr><td class="name-cell">' + esc((idx + 1) + ". " + nm) + "</td>" + cells + "</tr>";
    }).join("");
    container.innerHTML = '<div class="zpv-pad"><div class="table-content"><div class="table-view"><table><thead>' +
      thead + "</thead><tbody>" + tbody + "</tbody></table></div></div></div>";
  }

  function renderTablePPPZ(container, doc) {
    var rows = [];
    (function walk(el, sec) {
      elemChildren(el).forEach(function (c) {
        if (isLeaf(c)) rows.push({ sec: sec, name: c.localName, val: (c.textContent || "").trim() });
        else walk(c, label(c.localName));
      });
    })(doc.documentElement, label(doc.documentElement.localName));
    if (!rows.length) { container.innerHTML = '<div class="zpv-pad zpv-muted">Dokument neobsahuje žádné údaje.</div>'; return; }
    var thead = '<tr><th class="name-col name-cell">Sekce</th><th>Pole</th><th>Hodnota</th></tr>';
    var tbody = rows.map(function (r) {
      return '<tr><td class="name-cell">' + esc(r.sec) + "</td>" +
        "<td>" + esc(label(r.name)) + '<span class="col-id">' + esc(r.name) + "</span></td>" +
        tableCell(r.val) + "</tr>";
    }).join("");
    container.innerHTML = '<div class="zpv-pad"><div class="table-content"><div class="table-view"><table><thead>' +
      thead + "</thead><tbody>" + tbody + "</tbody></table></div></div></div>";
  }

  // === KONTROLY — findings only, in the shared .validation-list markup. ===
  function renderKontroly(container, parsed, schemaErrors, kontroly) {
    var entry = parsed.entry;
    var schemaOk = schemaErrors.length === 0;

    var xsdInner = schemaOk
      ? vItem("ok", "Soubor odpovídá XSD schématu „" + entry.label + "“.", "")
      : schemaErrors.map(function (e) { return vItem("error", e, ""); }).join("");
    var xsdHeader = "XSD validace · " + (schemaOk ? "žádné chyby" : (schemaErrors.length + " " + plural(schemaErrors.length, "chyba", "chyby", "chyb")));

    var nErr = kontroly.errors.length, nWarn = kontroly.warnings.length, nInfo = kontroly.info.length;
    var kInner = "";
    kontroly.errors.forEach(function (i) { kInner += vItem("error", i.message, i.location); });
    kontroly.warnings.forEach(function (i) { kInner += vItem("warning", i.message, i.location); });
    kontroly.info.forEach(function (i) { kInner += vItem("info", i.message, i.location); });
    if (!kInner) kInner = vItem("ok", "Bez připomínek.", "");
    var kCount = nErr ? (nErr + " " + plural(nErr, "chyba", "chyby", "chyb"))
      : nWarn ? (nWarn + " upozornění")
      : nInfo ? (nInfo + " " + plural(nInfo, "informace", "informace", "informací"))
      : "žádné";
    var kHeader = "Kontroly · " + kCount;

    container.innerHTML = '<div class="validation-list">' +
      vGroup(esc(xsdHeader), xsdInner) +
      vGroup(esc(kHeader), kInner) +
      "</div>";
  }

  // Active view state for the open panel: {parsed, kontroly, schemaErrors, mode}.
  // schemaErrors === null means XSD validation is still running.
  var ST = null;

  function renderMode(content) {
    if (!ST || !content) return;
    if (ST.mode === "cards") { renderCard(content, ST.parsed.doc); return; }
    if (ST.mode === "table") { (ST.parsed.key === "hoz" ? renderTableHOZ : renderTablePPPZ)(content, ST.parsed.doc); return; }
    if (ST.schemaErrors === null) {
      content.innerHTML = '<div class="zpv-pad zpv-muted"><span class="zpv-spin">⟳</span> Ověřuji proti XSD schématu (' + esc(ST.parsed.entry.label) + ")…</div>";
      return;
    }
    renderKontroly(content, ST.parsed, ST.schemaErrors, ST.kontroly);
  }

  function setMode(mode) {
    if (!ST) return;
    ST.mode = mode;
    var panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    panel.querySelectorAll(".zpv-segbtn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-mode") === mode);
    });
    renderMode(panel.querySelector(".zpv-content"));
  }

  function headerOffset() {
    var best = 0;
    ["[class*=oolbar]", "header", "[class*=eader]"].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (el.closest && el.closest("#" + PANEL_ID)) return;
        var r = el.getBoundingClientRect();
        if (r.top <= 8 && r.height > 0 && r.bottom > best && r.bottom < 220) best = r.bottom;
      });
    });
    return best || 52;
  }

  function ensurePanel(entry) {
    injectStyles();
    var panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement("div");
      panel.id = PANEL_ID;
      panel.innerHTML = '' +
        '<div class="zpv-topbar">' +
        '<span class="zpv-tag">🏥 <span>ZP Validátor</span> <small class="zpv-tag-sub"></small></span>' +
        '<div class="zpv-seg" role="tablist">' +
        '<button type="button" class="zpv-segbtn" data-mode="kontroly">Kontroly</button>' +
        '<button type="button" class="zpv-segbtn" data-mode="cards">Karty</button>' +
        '<button type="button" class="zpv-segbtn" data-mode="table">Tabulka</button>' +
        '</div>' +
        '<button type="button" class="zpv-tbtn zpv-primary zpv-reload">Nahrát jiný soubor</button>' +
        '<button type="button" class="zpv-tbtn zpv-close">Zavřít</button>' +
        '<input type="file" accept=".xml,text/xml,application/xml" style="display:none">' +
        '</div>' +
        '<div class="zpv-scroll"><div class="zpv-content"></div></div>';
      document.body.appendChild(panel);
      panel.querySelector(".zpv-close").addEventListener("click", closePanel);
      panel.querySelector(".zpv-seg").addEventListener("click", function (e) {
        var b = e.target.closest && e.target.closest(".zpv-segbtn");
        if (b) setMode(b.getAttribute("data-mode"));
      });
      var fi = panel.querySelector('input[type=file]');
      panel.querySelector(".zpv-reload").addEventListener("click", function () { fi.value = ""; fi.click(); });
    }
    panel.style.top = headerOffset() + "px";
    panel.querySelector(".zpv-tag-sub").textContent = entry ? "— " + entry.label : "";
    return panel.querySelector(".zpv-content");
  }

  function closePanel() {
    var el = document.getElementById(PANEL_ID);
    if (el) el.remove();
    ST = null;
  }

  function processZP(parsed, xmlString) {
    ensurePanel(parsed.entry);
    var kontroly = parsed.key === "hoz" ? window.ZPKontroly.runHOZ(parsed.doc) : window.ZPKontroly.runPPPZ(parsed.doc);
    ST = { parsed: parsed, kontroly: kontroly, schemaErrors: null, mode: "kontroly" };
    setMode("kontroly");
    runSchemaValidation(xmlString, parsed.entry).then(function (res) {
      if (!ST || ST.parsed !== parsed) return;
      ST.schemaErrors = (res && res.valid) ? [] : normalizeSchemaErrors(res);
      if (ST.mode === "kontroly") renderMode(document.querySelector("#" + PANEL_ID + " .zpv-content"));
    }).catch(function (err) {
      if (!ST || ST.parsed !== parsed) return;
      ST.schemaErrors = ["Validaci proti XSD se nepodařilo provést: " + (err && err.message ? err.message : err)];
      if (ST.mode === "kontroly") renderMode(document.querySelector("#" + PANEL_ID + " .zpv-content"));
    });
  }

  // --- Routing: only a SINGLE ZP file is handled here. Everything else
  //     (JMHZ/REGZEC, CSV/ZIP, multi-file batches) is left to / forwarded to the
  //     compiled runtime so existing loading keeps working exactly as before.
  //     We never block the runtime unless we can safely hand the file back. ---

  var cachedRuntimeInput = null;

  function runtimeFileInput() {
    if (cachedRuntimeInput && document.contains(cachedRuntimeInput)) return cachedRuntimeInput;
    cachedRuntimeInput = null;
    var inputs = document.querySelectorAll('input[type="file"]');
    var withXml = null, generic = null;
    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      if (el.closest && el.closest("#" + PANEL_ID)) continue;
      var a = el.getAttribute("accept") || "";
      if (a.indexOf("xml") !== -1) {
        if (el.hasAttribute("multiple")) { cachedRuntimeInput = el; return el; }
        if (!withXml) withXml = el;
      } else if (!generic) {
        generic = el;
      }
    }
    cachedRuntimeInput = withXml || generic || null;
    return cachedRuntimeInput;
  }

  function canForward() {
    return typeof DataTransfer === "function" && !!runtimeFileInput();
  }

  function forwardViaInput(fileList) {
    var rin = runtimeFileInput();
    if (!rin) return false;
    try {
      var dt = new DataTransfer();
      for (var i = 0; i < fileList.length; i++) dt.items.add(fileList[i]);
      rin.files = dt.files;
    } catch (err) {
      return false;
    }
    if (fileList.length && (!rin.files || rin.files.length === 0)) return false;
    rin.__zpvBypass = true;
    rin.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function isZipCsv(file) {
    return /\.(zip|csv)$/i.test((file && file.name) || "");
  }

  function classify(file, onZP, onOther) {
    if (isZipCsv(file)) { onOther(); return; }
    var reader = new FileReader();
    reader.onload = function () {
      var xml = String(reader.result || "");
      var parsed = detectType(xml);
      if (parsed && parsed.key) onZP(parsed, xml);
      else onOther();
    };
    reader.onerror = function () { onOther(); };
    reader.readAsText(file, "UTF-8");
  }

  function showPanelForwardError() {
    var p = document.getElementById(PANEL_ID);
    if (!p) return;
    var c = p.querySelector(".zpv-content");
    if (c) c.innerHTML = '<div class="validation-list"><div class="validation-group"><div class="validation-group-header">Neznámý formát</div>' +
      vItem("warning", "Tento soubor není HOZ ani PPPZ. Zavřete prosím toto okno a načtěte soubor přímo přes hlavní plochu prohlížeče.", "") +
      "</div></div>";
  }

  function attachListeners() {
    document.addEventListener("change", function (e) {
      var inp = e.target;
      if (!(inp && inp.nodeType === 1 && inp.matches && inp.matches('input[type="file"]'))) return;
      if (inp.__zpvBypass) { inp.__zpvBypass = false; return; }
      if (!(inp.files && inp.files.length)) return;
      var isPanelInput = !!(inp.closest && inp.closest("#" + PANEL_ID));
      var files = inp.files;

      // Multi-file batch: never a single ZP document we render.
      if (files.length !== 1) {
        if (isPanelInput) {
          e.stopImmediatePropagation();
          if (forwardViaInput(files)) closePanel(); else showPanelForwardError();
        }
        return; // runtime input: let the runtime handle multi-file natively.
      }

      // Single file: block the runtime, then either render (ZP) or hand it back.
      e.stopImmediatePropagation();
      classify(files[0], function (parsed, xml) {
        processZP(parsed, xml);
      }, function () {
        if (isPanelInput) {
          if (forwardViaInput(files)) closePanel(); else showPanelForwardError();
        } else {
          // Files are already on the runtime's own input — re-dispatch safely.
          inp.__zpvBypass = true;
          inp.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    }, true);

    window.addEventListener("drop", function (e) {
      var dt = e.dataTransfer;
      if (!(dt && dt.files && dt.files.length)) return;
      if (!Array.from(dt.types || []).includes("Files")) return;
      // Only intercept when we can reliably forward a non-ZP file back to the
      // runtime; otherwise let the runtime handle the drop natively.
      if (!canForward()) return;
      if (dt.files.length !== 1) return;
      var files = dt.files;
      if (isZipCsv(files[0])) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      classify(files[0], function (parsed, xml) {
        processZP(parsed, xml);
      }, function () {
        forwardViaInput(files);
      });
    }, true);
  }

  function enhanceDropHint() {
    function apply() {
      var host = document.querySelector(".empty-state") || (document.querySelector(".drop-zone") && document.querySelector(".drop-zone").parentElement);
      if (!host || host.querySelector(".zpv-hint-note")) return;
      var note = document.createElement("p");
      note.className = "zpv-hint-note";
      note.innerHTML = "Podporovány jsou i soubory zdravotních pojišťoven: <strong>Hromadné oznámení zaměstnavatele (HOZ)</strong> a <strong>Přehled platby zaměstnavatele (PPPZ)</strong> — stačí je načíst stejným způsobem.";
      host.appendChild(note);
    }
    new MutationObserver(apply).observe(document.body, { childList: true, subtree: true });
    if (document.readyState !== "loading") apply();
    else document.addEventListener("DOMContentLoaded", apply);
  }

  injectStyles();
  attachListeners();
  enhanceDropHint();
  window.ZPValidator = { detectType: detectType, close: closePanel };
})();
