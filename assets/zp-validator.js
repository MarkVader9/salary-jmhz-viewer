(function () {
  "use strict";

  var STYLE_ID = "zpv-styles";
  var OVERLAY_ID = "zpv-overlay";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = "" +
      "#" + OVERLAY_ID + "{position:fixed;inset:0;z-index:2000000;display:flex;align-items:flex-start;justify-content:center;background:rgba(0,0,0,.55);padding:24px;overflow-y:auto;}" +
      ".zpv-panel{background:var(--bg-elevated,#fff);color:var(--text-primary,#1a1a1a);width:100%;max-width:980px;border-radius:12px;border:1px solid var(--border,#e2e2e2);box-shadow:0 24px 64px rgba(0,0,0,.32);display:flex;flex-direction:column;max-height:calc(100dvh - 48px);}" +
      ".zpv-header{display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid var(--border,#e2e2e2);position:sticky;top:0;background:var(--bg-elevated,#fff);border-radius:12px 12px 0 0;}" +
      ".zpv-header h2{margin:0;font-size:1.05rem;font-weight:700;flex:1;}" +
      ".zpv-close{border:1px solid var(--border,#e2e2e2);background:transparent;color:var(--text-secondary,#555);width:36px;height:36px;border-radius:8px;cursor:pointer;font-size:1rem;line-height:1;}" +
      ".zpv-close:hover{background:var(--bg-hover,#f0f0f0);color:var(--text-primary,#000);}" +
      ".zpv-body{padding:20px;overflow-y:auto;}" +
      ".zpv-dropzone{border:2px dashed var(--border-strong,#bbb);border-radius:10px;padding:28px 20px;text-align:center;color:var(--text-secondary,#555);cursor:pointer;transition:all .15s ease;}" +
      ".zpv-dropzone:hover,.zpv-dropzone.zpv-drag{background:var(--bg-hover,#f5f7fa);border-color:#0057ca;color:var(--text-primary,#111);}" +
      ".zpv-dropzone strong{display:block;font-size:1rem;margin-bottom:6px;color:var(--text-primary,#111);}" +
      ".zpv-dropzone .zpv-hint{font-size:.8rem;color:var(--text-faint,#888);margin-top:8px;}" +
      ".zpv-btn{display:inline-flex;align-items:center;gap:8px;border:none;border-radius:8px;padding:10px 18px;font-weight:600;font-size:.875rem;cursor:pointer;background:#0057ca;color:#fff;margin-top:14px;}" +
      ".zpv-btn:hover{background:#0d136a;}" +
      ".zpv-results{margin-top:20px;display:flex;flex-direction:column;gap:16px;}" +
      ".zpv-card{border:1px solid var(--border,#e2e2e2);border-radius:10px;overflow:hidden;}" +
      ".zpv-card-h{padding:12px 16px;font-weight:700;font-size:.9rem;display:flex;align-items:center;gap:10px;background:var(--bg-hover,#f7f8fa);border-bottom:1px solid var(--border,#e2e2e2);}" +
      ".zpv-card-b{padding:14px 16px;font-size:.85rem;line-height:1.5;}" +
      ".zpv-badge{font-size:.72rem;font-weight:700;padding:2px 9px;border-radius:20px;white-space:nowrap;}" +
      ".zpv-ok{background:#dcfce7;color:#15803d;}" +
      ".zpv-err{background:#fee2e2;color:#b91c1c;}" +
      ".zpv-warn{background:#fef3c7;color:#92400e;}" +
      ".zpv-info{background:#dbeafe;color:#1e40af;}" +
      ".zpv-issue{padding:10px 12px;border-radius:8px;margin-bottom:8px;border-left:4px solid;}" +
      ".zpv-issue:last-child{margin-bottom:0;}" +
      ".zpv-issue.lvl-error{background:#fef2f2;border-color:#b91c1c;}" +
      ".zpv-issue.lvl-warning{background:#fffbeb;border-color:#d97706;}" +
      ".zpv-issue.lvl-info{background:#eff6ff;border-color:#2563eb;}" +
      ".zpv-issue .zpv-loc{display:block;font-size:.72rem;color:var(--text-faint,#888);margin-top:4px;}" +
      ".zpv-issue .zpv-code{font-family:ui-monospace,monospace;font-size:.7rem;opacity:.7;}" +
      ".zpv-kv{display:grid;grid-template-columns:auto 1fr;gap:6px 16px;}" +
      ".zpv-kv dt{color:var(--text-faint,#888);}" +
      ".zpv-kv dd{margin:0;font-weight:600;}" +
      ".zpv-table{width:100%;border-collapse:collapse;font-size:.8rem;}" +
      ".zpv-table th,.zpv-table td{text-align:left;padding:6px 10px;border-bottom:1px solid var(--border,#eee);}" +
      ".zpv-table th{color:var(--text-faint,#888);font-weight:600;}" +
      ".zpv-spin{display:inline-block;animation:zpv-spin .7s linear infinite;}" +
      "@keyframes zpv-spin{to{transform:rotate(360deg);}}" +
      ".zpv-muted{color:var(--text-faint,#888);}" +
      ".btn-zp-validator{background:#0e7490 !important;color:#fff !important;border-color:#0e7490 !important;font-weight:600 !important;}" +
      ".btn-zp-validator:hover{background:#155e75 !important;border-color:#155e75 !important;color:#fff !important;}" +
      ".zpv-home-btn{display:inline-flex;align-items:center;gap:8px;margin:14px auto 0;padding:10px 18px;border-radius:10px;border:1px solid #0e7490;background:#0e7490;color:#fff;font-weight:600;font-size:.875rem;cursor:pointer;}" +
      ".zpv-home-btn:hover{background:#155e75;border-color:#155e75;}";
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
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
      return { error: "Soubor se nepodařilo načíst jako XML." };
    }
    var perr = doc.getElementsByTagName("parsererror");
    if (perr && perr.length) {
      return { error: "Soubor není platné XML (chyba při parsování)." };
    }
    var root = doc.documentElement;
    if (!root) return { error: "Soubor neobsahuje kořenový element." };
    var schemas = window.ZP_SCHEMAS || {};
    var key = null;
    Object.keys(schemas).forEach(function (k) {
      if (schemas[k].root === root.localName) key = k;
    });
    if (!key) {
      return { error: "Toto není soubor HOZ ani PPPZ (kořenový element: " + root.localName + "). Pro soubory JMHZ / REGZEC použijte hlavní prohlížeč." };
    }
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

  function handleFile(file, resultsEl) {
    resultsEl.innerHTML = '<div class="zpv-muted"><span class="zpv-spin">⟳</span> Načítám a validuji soubor…</div>';
    var reader = new FileReader();
    reader.onload = function () {
      var xmlString = String(reader.result || "");
      var parsed = detectType(xmlString);
      if (parsed.error) {
        resultsEl.innerHTML = '<div class="zpv-issue lvl-error">' + esc(parsed.error) + "</div>";
        return;
      }
      var kontroly = parsed.key === "hoz" ? window.ZPKontroly.runHOZ(parsed.doc) : window.ZPKontroly.runPPPZ(parsed.doc);
      resultsEl.innerHTML = '<div class="zpv-muted"><span class="zpv-spin">⟳</span> Ověřuji proti XSD schématu (' + esc(parsed.entry.label) + ")…</div>";
      runSchemaValidation(xmlString, parsed.entry).then(function (res) {
        var schemaErrors = (res && res.valid) ? [] : normalizeSchemaErrors(res);
        renderResults(resultsEl, parsed, schemaErrors, kontroly);
      }).catch(function (err) {
        renderResults(resultsEl, parsed, ["Validaci proti XSD se nepodařilo provést: " + (err && err.message ? err.message : err)], kontroly);
      });
    };
    reader.onerror = function () {
      resultsEl.innerHTML = '<div class="zpv-issue lvl-error">Soubor se nepodařilo přečíst.</div>';
    };
    reader.readAsText(file, "UTF-8");
  }

  function openOverlay() {
    injectStyles();
    closeOverlay();
    var overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.innerHTML = '' +
      '<div class="zpv-panel" role="dialog" aria-modal="true" aria-label="ZP Validátor HOZ a PPPZ">' +
      '<div class="zpv-header"><h2>🏥 ZP Validátor — HOZ / PPPZ</h2><button class="zpv-close" type="button" aria-label="Zavřít">✕</button></div>' +
      '<div class="zpv-body">' +
      '<div class="zpv-dropzone" tabindex="0" role="button" aria-label="Načíst XML soubor HOZ nebo PPPZ">' +
      "<strong>Přetáhněte sem XML soubor, nebo klikněte</strong>" +
      "Hromadné oznámení zaměstnavatele (HOZ) nebo Přehled platby zaměstnavatele (PPPZ)" +
      '<div class="zpv-hint">Validace proti oficiálním XSD schématům VZP (platnost od 1.1.2026) + legislativní kontroly. Vše běží ve vašem prohlížeči.</div>' +
      '<input type="file" accept=".xml,text/xml,application/xml" style="display:none">' +
      "</div>" +
      '<div class="zpv-results"></div>' +
      "</div></div>";
    document.body.appendChild(overlay);

    var input = overlay.querySelector('input[type=file]');
    var dz = overlay.querySelector(".zpv-dropzone");
    var resultsEl = overlay.querySelector(".zpv-results");

    dz.addEventListener("click", function () { input.click(); });
    dz.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
    input.addEventListener("change", function () { if (input.files && input.files[0]) handleFile(input.files[0], resultsEl); });
    ["dragenter", "dragover"].forEach(function (ev) {
      dz.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); dz.classList.add("zpv-drag"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      dz.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); dz.classList.remove("zpv-drag"); });
    });
    dz.addEventListener("drop", function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) handleFile(f, resultsEl);
    });

    overlay.querySelector(".zpv-close").addEventListener("click", closeOverlay);
    overlay.addEventListener("mousedown", function (e) { if (e.target === overlay) closeOverlay(); });
    document.addEventListener("keydown", escHandler);

    waitForValidateXML().catch(function () {});
  }

  function escHandler(e) { if (e.key === "Escape") closeOverlay(); }

  function closeOverlay() {
    var el = document.getElementById(OVERLAY_ID);
    if (el) el.remove();
    document.removeEventListener("keydown", escHandler);
  }

  function injectEntryButtons() {
    function injectHome() {
      var dz = document.querySelector(".empty-state .drop-zone") || document.querySelector(".drop-zone");
      if (!dz) return;
      var host = dz.closest(".empty-state") || dz.parentElement;
      if (!host || host.querySelector(".zpv-home-btn")) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "zpv-home-btn";
      btn.innerHTML = '<span aria-hidden="true">🏥</span> Validovat ZP soubor (HOZ / PPPZ)';
      btn.addEventListener("click", openOverlay);
      host.appendChild(btn);
    }
    function injectDrawer() {
      document.querySelectorAll(".drawer-body").forEach(function (body) {
        if (body.querySelector(".btn-zp-validator")) return;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-zp-validator";
        btn.innerHTML = "🏥 ZP Validátor (HOZ / PPPZ)";
        btn.addEventListener("click", function () { openOverlay(); });
        body.appendChild(btn);
      });
    }
    function apply() { injectStyles(); injectHome(); injectDrawer(); }
    new MutationObserver(apply).observe(document.body, { childList: true, subtree: true });
    if (document.readyState !== "loading") apply();
    else document.addEventListener("DOMContentLoaded", apply);
  }

  window.ZPValidator = { open: openOverlay, close: closeOverlay, detectType: detectType };
  injectEntryButtons();
})();
