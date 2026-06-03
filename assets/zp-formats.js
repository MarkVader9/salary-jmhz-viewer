// === Nativni konfigurace formatu VZP: HOZ + PPPZ ===
// Tyto konfigurace zapadaji do existujiciho JMHZ VIEWER runtime uplne stejne
// jako REGZEC_CONFIG / JMHZ_CONFIG (formats.js). Soubor je klasicky (ne-modulovy)
// skript nactenyt, hned po formats.js, takze top-level `const` sdili lexikalni
// script-scope a je viditelny pro viewer.runtime (detectFormat, schema lookup).
//
// Sdilene helpery getChildByLocalName / getChildByLocalNameNS / getAllChildrenByLocalNameNS
// pochazeji z formats.js (nacteno drive ve stejne fazi).

(function () {
  // --- lokalni helpery pro tvorbu/poradi elementu (elementFormDefault="qualified") ---
  function zpCreateChild(parentEl, localName) {
    var doc = parentEl.ownerDocument;
    var ns = parentEl.namespaceURI || doc.documentElement.namespaceURI || null;
    var prefix = parentEl.prefix || doc.documentElement.prefix || '';
    if (ns) return doc.createElementNS(ns, prefix ? prefix + ':' + localName : localName);
    return doc.createElement(localName);
  }

  function zpInsertChild(parentEl, child, order) {
    var doc = parentEl.ownerDocument;
    var indent = '';
    var trailing = null;
    if (parentEl.lastChild && parentEl.lastChild.nodeType === 3) {
      var m = parentEl.lastChild.textContent.match(/\n([ \t]*)$/);
      if (m) { indent = m[1]; trailing = parentEl.lastChild; }
    }
    var ref = null;
    if (order && order.length) {
      var idx = order.indexOf(child.localName);
      if (idx !== -1) {
        for (var i = 0; i < parentEl.children.length; i++) {
          var sib = parentEl.children[i];
          if (order.indexOf(sib.localName) > idx) { ref = sib; break; }
        }
      }
    }
    if (ref) {
      parentEl.insertBefore(child, ref);
      if (indent) parentEl.insertBefore(doc.createTextNode('\n' + indent), ref);
    } else if (trailing) {
      parentEl.insertBefore(doc.createTextNode(indent ? '\n' + indent : '\n'), trailing);
      parentEl.insertBefore(child, trailing);
    } else {
      parentEl.appendChild(child);
    }
  }

  // Sdilene metody pro oba VZP formaty (elements mode, plochá struktura).
  var SHARED = {
    fieldMode: 'elements',
    rowParentElement: null,
    formVariants: null,
    headerFields: [],
    foreignKeywords: [],
    actionLabels: {},
    actionSections: null,
    fieldRules: {},
    sanitizerMeta: null,

    getRowInfo: [],

    parseDocumentHeader: function (doc) {
      if (!doc) return [];
      var root = doc.documentElement;
      var fields = [];
      this._headerSpec.forEach(function (spec) {
        var parts = spec.path.split('/');
        var el = root;
        for (var i = 0; i < parts.length && el; i++) el = getChildByLocalName(el, parts[i]);
        if (!el) return;
        fields.push({
          label: spec.label,
          value: (el.textContent || '').trim(),
          key: spec.path,
          el: el,
          attr: null,
          _writeBack: 'textContent',
          modified: false
        });
      });
      return fields;
    },

    resolveSection: function (formRoot, sec) {
      if (!formRoot) return null;
      if (sec._self) return formRoot;
      return getChildByLocalName(formRoot, sec.id);
    },

    resolveSectionInstances: function () { return null; },

    readField: function (targetEl, field) {
      if (!targetEl) return '';
      var name = field.element || field.attr;
      var parts = name.split('/');
      var el = targetEl;
      for (var i = 0; i < parts.length; i++) {
        el = getChildByLocalName(el, parts[i]);
        if (!el) return '';
      }
      return el.textContent || '';
    },

    writeField: function (fieldRef, value) {
      var sectionEl = fieldRef.el;
      if (!sectionEl) return;
      var field = fieldRef._field || {};
      var leaf = field.element || field.attr || fieldRef.attr;
      if (!leaf) return;
      var child = getChildByLocalName(sectionEl, leaf);
      if (!child) {
        child = zpCreateChild(sectionEl, leaf);
        zpInsertChild(sectionEl, child, (this._childOrder && this._childOrder[field.section]) || null);
      }
      child.textContent = value == null ? '' : value;
    },

    writeHeaderField: function (headerRef, value) {
      if (headerRef._writeBack === 'attribute') {
        if (value) headerRef.el.setAttribute(headerRef.attr, value);
        else headerRef.el.removeAttribute(headerRef.attr);
      } else {
        headerRef.el.textContent = value == null ? '' : value;
      }
    },

    fieldAttrKey: function (field) { return field.element || field.attr; },
    fieldXpath: function (field) { return field.section + '/' + (field.element || field.attr); },
    determineRowType: function () { return null; },
    normalizeBooleanForUi: function (v) { return v == null ? '' : v; },
    normalizeBooleanForXml: function (v) { return v == null ? '' : v; }
  };

  function makeConfig(extra) {
    var cfg = Object.create(null);
    for (var k in SHARED) cfg[k] = SHARED[k];
    for (var j in extra) cfg[j] = extra[j];
    return cfg;
  }

  // ---- adresa pojistence (sdileno) ----
  var ADRESA_FIELDS = [
    { section: 'adresa', element: 'ulice', label: 'Ulice' },
    { section: 'adresa', element: 'obec', label: 'Obec' },
    { section: 'adresa', element: 'psc', label: 'PSČ' }
  ];

  // hlavicka platce (identifikaceZamestnavatele) — stejna struktura pro HOZ i PPPZ
  function employerHeaderSpec(extraTop) {
    return extraTop.concat([
      { label: 'IČ plátce (číslo plátce)', path: 'identifikaceZamestnavatele/identifikacniCisloPlatce' },
      { label: 'Název plátce', path: 'identifikaceZamestnavatele/nazevPlatce' },
      { label: 'Ulice', path: 'identifikaceZamestnavatele/adresaPlatceUlice' },
      { label: 'Č.p./č.o.', path: 'identifikaceZamestnavatele/adresaPlatceCisloPopisneOrientacni' },
      { label: 'PSČ', path: 'identifikaceZamestnavatele/adresaPlatcePsc' },
      { label: 'Obec', path: 'identifikaceZamestnavatele/adresaPlatceObec' },
      { label: 'Telefon', path: 'identifikaceZamestnavatele/adresaPlatceTelefon' }
    ]);
  }

  // =========================================================================
  // HOZ — Hromadné oznámení zaměstnavatele
  // =========================================================================
  var _HOZ = makeConfig({
    name: 'HOZ',
    rootElement: 'hromadneOznameniZamestnavatele',
    ns: 'http://xmlns.vzp.cz/hromadneOznameniZamestnavatele/v1',
    rowsContainer: 'seznamZmenZamestnancu',
    rowElement: 'zmenaZamestance',
    rowElementPattern: /<[a-zA-Z0-9]*:?zmenaZamestance[\s>]/,
    schemasKey: 'HOZ_SCHEMAS',
    mainSchema: 'hromadneOznameniZamestnavatele.xsd',
    kontrolyGlobal: 'HOZKontroly',
    rowColumnLabel: 'Pojištěnec',

    sections: [
      { id: 'zaznam', label: 'Změna zaměstnance', _self: true },
      { id: 'adresa', label: 'Adresa pojištěnce' }
    ],
    fields: [
      { section: 'zaznam', element: 'kodzmeny', label: 'Kód změny' },
      { section: 'zaznam', element: 'datumZmeny', label: 'Datum změny' },
      { section: 'zaznam', element: 'cisloPojistence', label: 'Číslo pojištěnce' },
      { section: 'zaznam', element: 'jmeno', label: 'Jméno' },
      { section: 'zaznam', element: 'prijmeni', label: 'Příjmení' }
    ].concat(ADRESA_FIELDS),

    _childOrder: {
      zaznam: ['kodzmeny', 'datumZmeny', 'cisloPojistence', 'jmeno', 'prijmeni', 'adresa'],
      adresa: ['ulice', 'obec', 'psc']
    },
    _headerSpec: employerHeaderSpec([
      { label: 'Typ podání', path: 'identifikacePredmetuPodaniText' },
      { label: 'Kód podání', path: 'identifikacePredmetuPodaniKod' },
      { label: 'Interní identifikace podání', path: 'interniIdentifikacePodaniPodavatele' },
      { label: 'Zdravotní pojišťovna (kód)', path: 'kodZdravotniPojistovny' }
    ]),

    getRowLabel: function (fields) {
      var p = (fields['zaznam/prijmeni'] && fields['zaznam/prijmeni'].value) || '';
      var j = (fields['zaznam/jmeno'] && fields['zaznam/jmeno'].value) || '';
      return (p + ' ' + j).trim();
    },
    getRowInfo: [
      { key: 'zaznam/cisloPojistence', label: 'Č. pojištěnce' },
      { key: 'zaznam/kodzmeny', label: 'Kód' },
      { key: 'zaznam/datumZmeny', label: 'Datum' }
    ]
  });

  // =========================================================================
  // PPPZ — Přehled platby zaměstnavatele
  // =========================================================================
  var _PPPZ = makeConfig({
    name: 'PPPZ',
    rootElement: 'prehledPlatbyZamestnavatele',
    ns: 'http://xmlns.vzp.cz/PrehledPlatbyZamestnavatele/v1',
    rowsContainer: null,
    rowElement: 'udajePlatby',
    rowElementPattern: /<[a-zA-Z0-9]*:?udajePlatby[\s>]/,
    schemasKey: 'PPPZ_SCHEMAS',
    mainSchema: 'prehledPlatbyZamestnavatele.xsd',
    kontrolyGlobal: 'PPPZKontroly',
    rowColumnLabel: 'Období',

    sections: [
      { id: 'udajePlatby', label: 'Údaje platby', _self: true }
    ],
    fields: [
      { section: 'udajePlatby', element: 'mesicHlaseni', label: 'Měsíc hlášení' },
      { section: 'udajePlatby', element: 'rokHlaseni', label: 'Rok hlášení' },
      { section: 'udajePlatby', element: 'pocetZamestnancu', label: 'Počet zaměstnanců' },
      { section: 'udajePlatby', element: 'soucetZakladuPojistneho', label: 'Součet vyměřovacích základů' },
      { section: 'udajePlatby', element: 'soucetPojistneho', label: 'Součet pojistného' }
    ],

    _childOrder: {
      udajePlatby: ['mesicHlaseni', 'rokHlaseni', 'pocetZamestnancu', 'soucetZakladuPojistneho', 'soucetPojistneho']
    },
    _headerSpec: employerHeaderSpec([
      { label: 'Typ podání', path: 'identifikacePredmetuPodaniText' },
      { label: 'Kód podání', path: 'identifikacePredmetuPodaniKod' },
      { label: 'Interní identifikace podání', path: 'interniIdentifikacePodaniPodavatele' },
      { label: 'Zdravotní pojišťovna (kód)', path: 'kodZdravotniPojistovny' },
      { label: 'Typ přehledu', path: 'typPrehledu' }
    ]),

    getRowLabel: function (fields) {
      var m = (fields['udajePlatby/mesicHlaseni'] && fields['udajePlatby/mesicHlaseni'].value) || '';
      var r = (fields['udajePlatby/rokHlaseni'] && fields['udajePlatby/rokHlaseni'].value) || '';
      return ('Přehled ' + (m || '?') + '/' + (r || '?')).trim();
    },
    getRowInfo: [
      { key: 'udajePlatby/pocetZamestnancu', label: 'Počet zam.' },
      { key: 'udajePlatby/soucetPojistneho', label: 'Pojistné' }
    ]
  });

  // Expose do sdileneho script-scope i na window (kvuli detekci/ladeni).
  window.HOZ_CONFIG = _HOZ;
  window.PPPZ_CONFIG = _PPPZ;
})();

// Top-level const => viditelne pro viewer.runtime (detectFormat, schema lookup),
// stejne jako REGZEC_CONFIG / JMHZ_CONFIG.
const HOZ_CONFIG = window.HOZ_CONFIG;
const PPPZ_CONFIG = window.PPPZ_CONFIG;
