(function () {
  "use strict";

  var STYLE_ID = "zpv-styles";
  var PANEL_ID = "zpv-inline";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = "" +
      "#" + PANEL_ID + "{position:fixed;left:0;right:0;bottom:0;z-index:900;background:var(--bg,#f1f5f9);display:flex;flex-direction:column;overflow:hidden;}" +
      ".zpv-topbar{display:flex;align-items:center;gap:12px;padding:12px 20px;background:var(--bg-elevated,#fff);border-bottom:1px solid var(--border,#e2e2e2);flex:0 0 auto;}" +
      ".zpv-topbar .zpv-tag{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:.95rem;color:var(--text-primary,#111);flex:1;min-width:0;}" +
      ".zpv-topbar .zpv-tag small{font-weight:500;color:var(--text-faint,#888);}" +
      ".zpv-tbtn{border:1px solid var(--border,#d8d8d8);background:transparent;color:var(--text-secondary,#444);border-radius:8px;padding:8px 14px;font-size:.82rem;font-weight:600;cursor:pointer;white-space:nowrap;}" +
      ".zpv-tbtn:hover{background:var(--bg-hover,#f0f0f0);color:var(--text-primary,#000);}" +
      ".zpv-tbtn.zpv-primary{background:#0e7490;border-color:#0e7490;color:#fff;}" +
      ".zpv-tbtn.zpv-primary:hover{background:#155e75;border-color:#155e75;}" +
      ".zpv-scroll{flex:1 1 auto;overflow-y:auto;}" +
      ".zpv-content{max-width:980px;width:100%;margin:0 auto;padding:20px;display:flex;flex-direction:column;gap:16px;}" +
      ".zpv-card{border:1px solid var(--border,#e2e2e2);border-radius:10px;overflow:hidden;background:var(--bg-elevated,#fff);}" +
      ".zpv-card-h{padding:12px 16px;font-weight:700;font-size:.9rem;display:flex;align-items:center;gap:10px;background:var(--bg-hover,#f7f8fa);border-bottom:1px solid var(--border,#e2e2e2);color:var(--text-primary,#111);}" +
      ".zpv-card-b{padding:14px 16px;font-size:.85rem;line-height:1.5;color:var(--text-primary,#1a1a1a);}" +
      ".zpv-badge{font-size:.72rem;font-weight:700;padding:2px 9px;border-radius:20px;white-space:nowrap;}" +
      ".zpv-ok{background:#dcfce7;color:#15803d;}" +
      ".zpv-err{background:#fee2e2;color:#b91c1c;}" +
      ".zpv-warn{background:#fef3c7;color:#92400e;}" +
      ".zpv-info{background:#dbeafe;color:#1e40af;}" +
      ".zpv-issue{padding:10px 12px;border-radius:8px;margin-bottom:8px;border-left:4px solid;}" +
      ".zpv-issue:last-child{margin-bottom:0;}" +
      ".zpv-issue.lvl-error{background:#fef2f2;border-color:#b91c1c;color:#7f1d1d;}" +
      ".zpv-issue.lvl-warning{background:#fffbeb;border-color:#d97706;color:#78350f;}" +
      ".zpv-issue.lvl-info{background:#eff6ff;border-color:#2563eb;color:#1e3a8a;}" +
      ".zpv-issue .zpv-loc{display:block;font-size:.72rem;opacity:.75;margin-top:4px;}" +
      ".zpv-issue .zpv-code{font-family:ui-monospace,monospace;font-size:.7rem;opacity:.7;}" +
      ".zpv-kv{display:grid;grid-template-columns:auto 1fr;gap:6px 16px;margin:0;}" +
      ".zpv-kv dt{color:var(--text-faint,#888);}" +
      ".zpv-kv dd{margin:0;font-weight:600;}" +
      ".zpv-table{width:100%;border-collapse:collapse;font-size:.8rem;}" +
      ".zpv-table th,.zpv-table td{text-align:left;padding:6px 10px;border-bottom:1px solid var(--border,#eee);}" +
      ".zpv-table th{color:var(--text-faint,#888);font-weight:600;}" +
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

  function renderIssues(title, issues) {
    if (!issues.length) return "";
    var rows = issues.map(function (i) {
      return '<div class="zpv-issue lvl-' + i.level + '">' +
        esc(i.message) +
        (i.location ? '<span class="zpv-loc">' + esc(i.location) + ' · <span class="zpv-code">' + esc(i.code) + "</span></span>" : ' <span class="zpv-code">' + esc(i.code) + "</span>") +
        "</div>";
    }).join("");
    return "<div style='margin-bottom:6px;font-weight:700'>" + esc(title) + " (" + issues.length + ")</div>" + rows;
  }

  function renderEmployer(doc) {
    var h = window.ZPKontroly.helpers;
    var root = doc.documentElement;
    var idZam = h.childByName(root, "identifikaceZamestnavatele");
    if (!idZam) return "";
    function t(n) { return esc(h.childText(idZam, n) || "—"); }
    var zp = esc(h.childText(root, "kodZdravotniPojistovny") || "—");
    return '<div class="zpv-card"><div class="zpv-card-h">🏢 Zaměstnavatel</div><div class="zpv-card-b">' +
      '<dl class="zpv-kv">' +
      "<dt>Kód ZP</dt><dd>" + zp + "</dd>" +
      "<dt>Číslo plátce</dt><dd>" + t("identifikacniCisloPlatce") + "</dd>" +
      "<dt>Název plátce</dt><dd>" + t("nazevPlatce") + "</dd>" +
      "<dt>Adresa</dt><dd>" + t("adresaPlatceUlice") + " " + t("adresaPlatceCisloPopisneOrientacni") + ", " + t("adresaPlatcePsc") + " " + t("adresaPlatceObec") + "</dd>" +
      "</dl></div></div>";
  }

  function renderHOZSummary(doc) {
    var h = window.ZPKontroly.helpers;
    var root = doc.documentElement;
    var seznam = h.childByName(root, "seznamZmenZamestnancu");
    var zmeny = seznam ? h.childrenByName(seznam, "zmenaZamestance") : [];
    var rows = zmeny.map(function (z, idx) {
      return "<tr><td>" + (idx + 1) + "</td><td><strong>" + esc(h.childText(z, "kodzmeny") || "") + "</strong></td><td>" +
        esc(h.childText(z, "datumZmeny") || "") + "</td><td>" + esc(h.childText(z, "cisloPojistence") || "") + "</td><td>" +
        esc((h.childText(z, "prijmeni") || "") + " " + (h.childText(z, "jmeno") || "")) + "</td></tr>";
    }).join("");
    return '<div class="zpv-card"><div class="zpv-card-h">📋 Změny zaměstnanců <span class="zpv-muted">(' + zmeny.length + ")</span></div><div class='zpv-card-b' style='overflow-x:auto'>" +
      '<table class="zpv-table"><thead><tr><th>#</th><th>Kód</th><th>Datum změny</th><th>Číslo pojištěnce</th><th>Jméno</th></tr></thead><tbody>' +
      rows + "</tbody></table></div></div>";
  }

  function renderPPPZSummary(doc, meta) {
    var h = window.ZPKontroly.helpers;
    var root = doc.documentElement;
    var udaje = h.childByName(root, "udajePlatby");
    function t(n) { return udaje ? esc(h.childText(udaje, n) || "—") : "—"; }
    var typ = esc(h.childText(root, "typPrehledu") || "—");
    var theoretical = meta && typeof meta.theoretical === "number" ? meta.theoretical.toLocaleString("cs-CZ") + " Kč" : "—";
    var avg = meta && typeof meta.avgBase === "number" ? meta.avgBase.toLocaleString("cs-CZ", { maximumFractionDigits: 2 }) + " Kč" : "—";
    return '<div class="zpv-card"><div class="zpv-card-h">💰 Údaje platby</div><div class="zpv-card-b"><dl class="zpv-kv">' +
      "<dt>Typ přehledu</dt><dd>" + typ + "</dd>" +
      "<dt>Období</dt><dd>" + t("mesicHlaseni") + " / " + t("rokHlaseni") + "</dd>" +
      "<dt>Počet zaměstnanců</dt><dd>" + t("pocetZamestnancu") + "</dd>" +
      "<dt>Součet vyměř. základů</dt><dd>" + t("soucetZakladuPojistneho") + " Kč</dd>" +
      "<dt>Součet pojistného</dt><dd>" + t("soucetPojistneho") + " Kč</dd>" +
      "<dt>Teoretické pojistné (13,5 %)</dt><dd>" + theoretical + "</dd>" +
      "<dt>Průměrný základ / zaměstnanec</dt><dd>" + avg + "</dd>" +
      "</dl></div></div>";
  }

  function renderResults(container, parsed, schemaErrors, kontroly) {
    var entry = parsed.entry;
    var doc = parsed.doc;
    var html = "";

    var schemaOk = schemaErrors.length === 0;
    html += '<div class="zpv-card"><div class="zpv-card-h">' +
      "🧬 Validace XSD schématu " +
      '<span class="zpv-badge ' + (schemaOk ? "zpv-ok" : "zpv-err") + '">' + (schemaOk ? "V pořádku" : (schemaErrors.length + " chyb")) + "</span>" +
      '</div><div class="zpv-card-b">';
    if (schemaOk) {
      html += '<span class="zpv-muted">Soubor je v souladu s XSD schématem „' + esc(entry.label) + "“.</span>";
    } else {
      html += schemaErrors.map(function (e) { return '<div class="zpv-issue lvl-error">' + esc(e) + "</div>"; }).join("");
    }
    html += "</div></div>";

    var nErr = kontroly.errors.length, nWarn = kontroly.warnings.length, nInfo = kontroly.info.length;
    var logicBadge = nErr ? '<span class="zpv-badge zpv-err">' + nErr + " chyb</span>" :
      (nWarn ? '<span class="zpv-badge zpv-warn">' + nWarn + " upozornění</span>" : '<span class="zpv-badge zpv-ok">Bez připomínek</span>');
    html += '<div class="zpv-card"><div class="zpv-card-h">⚖️ Legislativní kontroly ' + logicBadge + '</div><div class="zpv-card-b">';
    if (!nErr && !nWarn && !nInfo) {
      html += '<span class="zpv-muted">Nebyly nalezeny žádné logické připomínky.</span>';
    } else {
      html += renderIssues("Chyby", kontroly.errors);
      html += renderIssues("Upozornění", kontroly.warnings);
      html += renderIssues("Informace", kontroly.info);
    }
    html += "</div></div>";

    html += renderEmployer(doc);
    if (parsed.key === "hoz") html += renderHOZSummary(doc);
    else html += renderPPPZSummary(doc, kontroly.meta);

    container.innerHTML = html;
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
        '<button type="button" class="zpv-tbtn zpv-primary zpv-reload">Nahrát jiný soubor</button>' +
        '<button type="button" class="zpv-tbtn zpv-close">Zavřít</button>' +
        '<input type="file" accept=".xml,text/xml,application/xml" style="display:none">' +
        '</div>' +
        '<div class="zpv-scroll"><div class="zpv-content"></div></div>';
      document.body.appendChild(panel);
      panel.querySelector(".zpv-close").addEventListener("click", closePanel);
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
  }

  function processZP(parsed, xmlString) {
    var content = ensurePanel(parsed.entry);
    var kontroly = parsed.key === "hoz" ? window.ZPKontroly.runHOZ(parsed.doc) : window.ZPKontroly.runPPPZ(parsed.doc);
    content.innerHTML = '<div class="zpv-muted"><span class="zpv-spin">⟳</span> Ověřuji proti XSD schématu (' + esc(parsed.entry.label) + ")…</div>";
    runSchemaValidation(xmlString, parsed.entry).then(function (res) {
      var schemaErrors = (res && res.valid) ? [] : normalizeSchemaErrors(res);
      renderResults(content, parsed, schemaErrors, kontroly);
    }).catch(function (err) {
      renderResults(content, parsed, ["Validaci proti XSD se nepodařilo provést: " + (err && err.message ? err.message : err)], kontroly);
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
    if (c) c.innerHTML = '<div class="zpv-issue lvl-warning">Tento soubor není HOZ ani PPPZ. Zavřete prosím toto okno a načtěte soubor přímo přes hlavní plochu prohlížeče.</div>';
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
