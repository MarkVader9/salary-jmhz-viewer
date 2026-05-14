// Codelists runtime client for the JMHZ Viewer.
//
// Eagerly loads `index.json` + every codelist on viewer startup. Exposes
// inCodelist / getCodelist / codelistDataAvailable on `window.JMHZCodelists`.
//
// Plain JS (loaded as a runtime asset, not a TS source compiled by Vite)
// to mirror the existing kontroly-utils.js / formats.js pattern.

(function () {
  'use strict';

  var DEFAULT_BASE = 'https://support.flexibee.eu/service/jmhz-viewer/api/v1';
  var FETCH_TIMEOUT_MS = 8000;

  // Auto-detect base URL: if running on GH Pages, resolve api/v1 relative to page root.
  // Otherwise use the production default. Can be overridden via loadAll(baseUrl).
  function detectBase() {
    if (typeof window !== 'undefined' && window.location) {
      var loc = window.location;
      // GH Pages: primaerp.github.io/jmhz-xml-editor/...
      if (loc.hostname === 'primaerp.github.io') {
        // Extract path prefix up to and including the repo name or preview folder
        var match = loc.pathname.match(/^(\/jmhz-xml-editor(?:\/preview\/[^/]+)?)\//);
        if (match) return loc.origin + match[1] + '/api/v1';
      }
      // localhost dev server
      if (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1') {
        return loc.origin + '/api/v1';
      }
    }
    return DEFAULT_BASE;
  }

  // state
  var _data = null;       // { [code]: { entries, version, generatedAt, byKod: Map, byNazev: Map } }
  var _index = null;
  var _readyPromise = null;
  var _failureReason = null;

  // Normalise a name for the byNazev index. We lowercase only — diacritics
  // are preserved because the source XML is authoritative; mismatched accents
  // SHOULD surface as 'unknown' so the user sees the discrepancy.
  function normName(s) {
    return String(s == null ? '' : s).trim().toLowerCase();
  }

  function dayBucket() {
    var d = new Date();
    return d.getUTCFullYear() + '-' +
      String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
      String(d.getUTCDate()).padStart(2, '0');
  }

  function fetchJson(url) {
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, FETCH_TIMEOUT_MS) : null;
    return fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
        return r.json();
      })
      .finally(function () { if (timer) clearTimeout(timer); });
  }

  function loadAll(baseUrl) {
    if (_readyPromise) return _readyPromise;
    var base = (baseUrl || detectBase()).replace(/\/+$/, '');
    _readyPromise = fetchJson(base + '/index.json?t=' + dayBucket())
      .then(function (idx) {
        _index = idx;
        var codes = Object.keys(idx.codelists || {});
        return Promise.all(codes.map(function (code) {
          var entry = idx.codelists[code];
          var entryUrl = entry && entry.url ? entry.url : ('codelists/' + code + '.json');
          // Resolve relative URLs against base
          var url = entryUrl.match(/^https?:\/\//) ? entryUrl : (base + '/' + entryUrl);
          return fetchJson(url).then(function (cl) {
            var byKod = new Map();
            var byNazev = new Map();
            var byZkr = new Map();
            (cl.entries || []).forEach(function (e) {
              if (!byKod.has(e.kod)) byKod.set(e.kod, []);
              byKod.get(e.kod).push(e);
              if (e.nazev) {
                var key = normName(e.nazev);
                if (!byNazev.has(key)) byNazev.set(key, []);
                byNazev.get(key).push(e);
              }
              if (e.zkraceny_nazev_polozky != null) {
                var zk = String(e.zkraceny_nazev_polozky);
                if (!byZkr.has(zk)) byZkr.set(zk, []);
                byZkr.get(zk).push(e);
              }
            });
            return [code, {
              entries: cl.entries || [],
              byKod: byKod,
              byNazev: byNazev,
              byZkr: byZkr,
              version: cl.version,
              generatedAt: cl.generatedAt,
              deprecated: !!cl.deprecated
            }];
          }).catch(function (err) {
            console.warn('[jmhz-codelists] fetch failed for ' + code + ': ' + err.message);
            return [code, null];
          });
        }));
      })
      .then(function (entries) {
        _data = {};
        entries.forEach(function (kv) { if (kv[1]) _data[kv[0]] = kv[1]; });
        return { ok: true, count: Object.keys(_data).length, generatedAt: _index.generatedAt };
      })
      .catch(function (err) {
        _failureReason = err.message || String(err);
        console.warn('[jmhz-codelists] load failed: ' + _failureReason);
        _data = {};
        return { ok: false, reason: _failureReason };
      });
    return _readyPromise;
  }

  function ready() { return _readyPromise || Promise.resolve({ ok: false, reason: 'not-loaded' }); }

  function codelistDataAvailable(code) {
    return _data != null && _data[code] != null;
  }

  function getCodelist(code) {
    return _data && _data[code] ? _data[code].entries.slice() : null;
  }

  function isValidAt(entry, atDate) {
    if (!atDate) return true;
    if (entry.platnostOd && atDate < entry.platnostOd) return false;
    if (entry.platnostDo && atDate > entry.platnostDo) return false;
    return true;
  }

  // Returns 'valid' | 'expired' | 'unknown' | 'data-unavailable'
  function inCodelist(code, value, atDate) {
    if (!codelistDataAvailable(code)) return 'data-unavailable';
    var bucket = _data[code].byKod.get(String(value));
    if (!bucket || bucket.length === 0) return 'unknown';
    for (var i = 0; i < bucket.length; i++) {
      if (isValidAt(bucket[i], atDate || null)) return 'valid';
    }
    return 'expired';
  }

  // Membership lookup by nazev (e.g. CISOB municipality names).
  // Same return contract as inCodelist; case-insensitive, diacritic-sensitive.
  function inCodelistByName(code, name, atDate) {
    if (!codelistDataAvailable(code)) return 'data-unavailable';
    var d = _data[code];
    if (!d.byNazev) return 'unknown';
    var bucket = d.byNazev.get(normName(name));
    if (!bucket || bucket.length === 0) return 'unknown';
    for (var i = 0; i < bucket.length; i++) {
      if (isValidAt(bucket[i], atDate || null)) return 'valid';
    }
    return 'expired';
  }

  // Membership lookup by zkraceny_nazev_polozky (abbreviation).
  // Used for codelists like C_POHL where XML values correspond to the
  // abbreviation column, not the kod column. Case-sensitive, exact match.
  function inCodelistByAbbrev(code, abbrev, atDate) {
    if (!codelistDataAvailable(code)) return 'data-unavailable';
    var d = _data[code];
    if (!d.byZkr) return 'unknown';
    var bucket = d.byZkr.get(String(abbrev));
    if (!bucket || bucket.length === 0) return 'unknown';
    for (var i = 0; i < bucket.length; i++) {
      if (isValidAt(bucket[i], atDate || null)) return 'valid';
    }
    return 'expired';
  }

  function version(code) {
    if (code) return _data && _data[code] ? _data[code].version : null;
    return _index ? { generatedAt: _index.generatedAt, count: Object.keys(_data || {}).length } : null;
  }

  // Test-only seam — seed `_data[code]` from a fixture payload of the same
  // shape as the published `codelists/{code}.json` API. Used by tests/setup.ts
  // to load committed fixture JSONs without making any network calls. Not
  // intended for production use.
  function __loadFixtureForTesting(code, payload) {
    if (!_data) _data = {};
    var byKod = new Map();
    var byNazev = new Map();
    var byZkr = new Map();
    (payload.entries || []).forEach(function (e) {
      if (!byKod.has(e.kod)) byKod.set(e.kod, []);
      byKod.get(e.kod).push(e);
      if (e.nazev) {
        var key = normName(e.nazev);
        if (!byNazev.has(key)) byNazev.set(key, []);
        byNazev.get(key).push(e);
      }
      if (e.zkraceny_nazev_polozky != null) {
        var zk = String(e.zkraceny_nazev_polozky);
        if (!byZkr.has(zk)) byZkr.set(zk, []);
        byZkr.get(zk).push(e);
      }
    });
    _data[code] = {
      entries: payload.entries || [],
      byKod: byKod,
      byNazev: byNazev,
      byZkr: byZkr,
      version: payload.version,
      generatedAt: payload.generatedAt,
      deprecated: !!payload.deprecated
    };
  }

  window.JMHZCodelists = {
    loadAll: loadAll,
    ready: ready,
    codelistDataAvailable: codelistDataAvailable,
    getCodelist: getCodelist,
    inCodelist: inCodelist,
    inCodelistByName: inCodelistByName,
    inCodelistByAbbrev: inCodelistByAbbrev,
    version: version,
    __loadFixtureForTesting: __loadFixtureForTesting
  };
})();
