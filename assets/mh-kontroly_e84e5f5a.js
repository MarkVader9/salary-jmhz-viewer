// === MH Business Rule Controls (Kontroly) ===
// Based on ČSSZ katalogkontrolMH.csv — Měsíční hlášení controls
// Hybrid DSL: declarative rules for common patterns, custom functions for complex ones

(function () {
  'use strict';

  const {
    buildCsszIndex, fieldKeyFor, getVal, getNum, isFilled, getFieldDef, getFieldLabel,
    getSectionLabel, getRepeatCount, TRUE_BOOLEAN_VALUES, FALSE_BOOLEAN_VALUES,
    isTrueValue, isFalseValue, findChildEl, evalRule, evalCondition, resetKontrolyIndex,
    parseDate, compareDates, addDays, daysInMonth, formatDate, todayDate, ageAt, makeDate
  } = window.KontrolyUtils;

  // Header csszId → headerField key mapping (MH hlavička + PVPOJ incl. slevy)
  const HEADER_CSSZ_MAP = {
    '10001': 'hlavicka/idPodani',
    '10002': 'hlavicka/balikPoradi',
    '10003': 'hlavicka/balikyPocet',
    '10005': 'hlavicka/datumVyplneni',
    '10006': 'hlavicka/datumVyplneni',
    '10007': 'hlavicka/typPodani',
    '10010': 'hlavicka/mesic',
    '10011': 'hlavicka/rok',
    '10015': 'hlavicka/formularePocetVBaliku',
    '10016': 'hlavicka/typPodani',
    '10488': 'hlavicka/formularePocetCelkem',
    '10221': 'hlavicka/variabilniSymbol',
    '10023': 'PVPOJ/pojistne/zakladZamestnavateleA',
    '10024': 'PVPOJ/pojistne/pojistneZamestnavateleA',
    '10025': 'PVPOJ/pojistne/zakladZamestnavateleB',
    '10026': 'PVPOJ/pojistne/pojistneZamestnavateleB',
    '10027': 'PVPOJ/pojistne/pojistneZamestnavateleCelkem',
    '10028': 'PVPOJ/pojistne/pojistneZamestnance',
    '10029': 'PVPOJ/pojistne/pojistneCelkem',
    '10033': 'PVPOJ/pojistneUhrada',
    '10483': 'PVPOJ/pojistne/zakladZamestnavateleC',
    '10484': 'PVPOJ/pojistne/pojistneZamestnavateleC',
    '10030': 'PVPOJ/slevaZamestnavatele/pocetZamestnancu',
    '10031': 'PVPOJ/slevaZamestnavatele/uhrnVymerovacichZakladu',
    '10032': 'PVPOJ/slevaZamestnavatele/pojistneSleva',
    '10485': 'PVPOJ/slevyZamestnancu/pocetZamestnancu',
    '10486': 'PVPOJ/slevyZamestnancu/uhrnVymerovacichZakladu',
    '10487': 'PVPOJ/slevyZamestnancu/pojistneSleva',
    '10543': 'PVPOJ/slevyZamestnancuOvoZel/pocetZamestnancu',
    '10544': 'PVPOJ/slevyZamestnancuOvoZel/uhrnVymerovacichZakladu',
    '10545': 'PVPOJ/slevyZamestnancuOvoZel/pojistneSleva',
  };

  // Central registry for catalog-linked business constants used by implemented controls.
  // `katalogkontrolMHKonstanty.csv` links the official controls to constant names, but does
  // not provide the numeric values themselves, so these values preserve current behavior.
  const KONTROLY_CONSTANTS = {
    rates: {
      employerDiscount: 0.05,          // M3 — Sleva na pojistném (uváděno v procentech)
      employerInsuranceA: 0.248,       // M8, M315 — pojistné za zaměstnavatele (10024, 10478)
      employerInsuranceB: 0.298,       // M10, M315 — pojistné za zaměstnavatele (10026, 10479)
      employerInsuranceC: 0.278,       // M167, M315 — pojistné za zaměstnavatele (10484, 10480)
      employeeInsurance: 0.071,        // M118, M168, M270 — sazba pojistného placená zaměstnancem
      employeeDiscount: 0.065          // M170 — sazba slevy na pojistném podle § 7a
    },
    limits: {
      maxWorkedHours: 240,             // M15 — maximální možný počet odpracovaných hodin
      shorterWorkRangeMax: 30,         // M45 — rozsah kratší pracovní/služební doby
      minMonthlyTaxBonus: 50,          // M74 — výše vyplaceného měsíčního daňového bonusu
      ovozelVzMax: 48500               // M271 — § 23b odst. 4 ZPSZ threshold
    },
    tolerances: {
      relativeError: 0.01,
      absoluteAmount: 100,
      roundedHalf: 0.5,
      employeeInsuranceUpperRate: 0.07171,
      employeeDiscountUpperRate: 0.06565,
      combinedInsuranceDiff: 1
    }
  };

  // Read souhrn-level fields from XML (e.g., specifickaSkutecnost)
  function readSouhrnField(xmlDoc, path) {
    if (!xmlDoc) return null;
    const root = xmlDoc.documentElement;
    let el = root;
    for (const part of path) {
      el = findChildEl(el, part);
      if (!el) return null;
    }
    const txt = el.textContent.trim();
    return txt === '' ? null : txt;
  }

  // ── Codelist / inline-enum / regex rule helpers ──
  // mkMhCodelistRule: value of a per-employee field must be in named codelist.
  // Severity 'warning' (codelist data may be unavailable; matches REG-ZEC convention).
  // opts: { perInstance: bool, sectionId: string, souhrnPath: string[], lookupBy: 'kod'|'nazev' }
  //   perInstance=true → loops ctx.getRepeatCount(sectionId) and reads ctx.getVal(csszId, i).
  //   souhrnPath → reads from souhrn DOM via readSouhrnField.
  //   lookupBy='nazev' → ctx.inCodelistByName instead of inCodelist (e.g. CISOB Obec name match).
  function mkMhCodelistRule(id, csszId, codelistCode, label, opts) {
    opts = opts || {};
    var lookupBy = opts.lookupBy === 'nazev' ? 'nazev' : 'kod';
    return { id: id, scope: 'emp', sev: 'warning', type: 'custom',
      msg: label + ': hodnota není v číselníku ' + codelistCode + '.',
      check: function(ctx) {
        if (!ctx.codelistDataAvailable(codelistCode)) return [];
        var values = [];
        if (opts.souhrnPath) {
          var sv = readSouhrnField(_xmlDoc, opts.souhrnPath);
          if (sv) values.push({ value: sv, instanceIndex: undefined });
        } else if (opts.perInstance && opts.sectionId) {
          var n = ctx.getRepeatCount(opts.sectionId);
          for (var i = 0; i < n; i++) {
            var vi = ctx.getVal(csszId, i);
            if (vi) values.push({ value: vi, instanceIndex: i });
          }
        } else {
          var v = ctx.getVal(csszId);
          if (v) values.push({ value: v, instanceIndex: undefined });
        }
        var errors = [];
        values.forEach(function (item) {
          var r = (lookupBy === 'nazev')
            ? ctx.inCodelistByName(codelistCode, item.value)
            : ctx.inCodelist(codelistCode, item.value);
          var entry = { fieldCsszId: csszId };
          if (item.instanceIndex !== undefined) entry.instanceIndex = item.instanceIndex;
          if (r === 'unknown') {
            entry.message = label + ': hodnota „' + item.value + '" není v číselníku ' + codelistCode + '.';
            errors.push(entry);
          } else if (r === 'expired') {
            entry.message = label + ': hodnota „' + item.value + '" je v číselníku ' + codelistCode + ', ale již neplatná.';
            errors.push(entry);
          }
        });
        return errors;
      }};
  }

  // Inline enum membership for MH per-employee or souhrn fields.
  // opts: { perInstance, sectionId, souhrnPath }
  function mkMhInlineEnumRule(id, csszId, allowed, label, opts) {
    opts = opts || {};
    var allowedSet = {};
    allowed.forEach(function (a) { allowedSet[String(a)] = true; });
    return { id: id, scope: opts.scope || 'emp', sev: 'warning', type: 'custom',
      msg: label + ': hodnota není z povolené množiny.',
      check: function(ctx) {
        var values = [];
        if (opts.souhrnPath) {
          var sv = readSouhrnField(_xmlDoc, opts.souhrnPath);
          if (sv) values.push({ value: sv, instanceIndex: undefined });
        } else if (opts.perInstance && opts.sectionId) {
          var n = ctx.getRepeatCount(opts.sectionId);
          for (var i = 0; i < n; i++) {
            var vi = ctx.getVal(csszId, i);
            if (vi) values.push({ value: vi, instanceIndex: i });
          }
        } else {
          var v = ctx.getVal(csszId);
          if (v) values.push({ value: v, instanceIndex: undefined });
        }
        var errors = [];
        values.forEach(function (item) {
          if (allowedSet[String(item.value).trim()]) return;
          var entry = { fieldCsszId: csszId,
            message: label + ': hodnota „' + item.value + '" není povolená (povolené: ' + allowed.join(', ') + ').' };
          if (item.instanceIndex !== undefined) entry.instanceIndex = item.instanceIndex;
          errors.push(entry);
        });
        return errors;
      }};
  }

  // Regex format check for MH per-instance field (currently used by M157 ELDP).
  function mkMhRegexRule(id, csszId, regex, label, opts) {
    opts = opts || {};
    return { id: id, scope: 'emp', sev: 'warning', type: 'custom',
      msg: label + ': hodnota neodpovídá očekávanému formátu.',
      check: function(ctx) {
        var values = [];
        if (opts.perInstance && opts.sectionId) {
          var n = ctx.getRepeatCount(opts.sectionId);
          for (var i = 0; i < n; i++) {
            var vi = ctx.getVal(csszId, i);
            if (vi) values.push({ value: vi, instanceIndex: i });
          }
        } else {
          var v = ctx.getVal(csszId);
          if (v) values.push({ value: v, instanceIndex: undefined });
        }
        var errors = [];
        values.forEach(function (item) {
          if (regex.test(item.value)) return;
          var entry = { fieldCsszId: csszId,
            message: label + ': hodnota „' + item.value + '" neodpovídá formátu ' + regex + '.' };
          if (item.instanceIndex !== undefined) entry.instanceIndex = item.instanceIndex;
          errors.push(entry);
        });
        return errors;
      }};
  }

  let _fieldsBySection = null;  // from helpers.js FIELDS_BY_SECTION

  function getRowHeaderVal(emp, csszId) {
    if (!emp?._empEl) return '';
    if (csszId === '10495') {
      const hlavicka = findChildEl(emp._empEl, 'hlavicka');
      const prim = findChildEl(hlavicka, 'primarniPpv');
      return prim?.textContent?.trim() || '';
    }
    return '';
  }

  function getVariantMetaVal(emp, csszId) {
    if (!emp?._formRoot) return '';
    if (csszId === '10548' && emp._formRoot.localName === 'odlozenyPrijem') {
      const typ = findChildEl(emp._formRoot, 'typ');
      return typ?.textContent?.trim() || '';
    }
    return '';
  }

  // Read ELDPobdobí data from odložený příjem forms
  // Returns null for non-odložený příjem, or array of { mesic, rok, eldpEls: [Element] }
  function getOdlozenyEldpObdobi(emp) {
    if (!emp?._formRoot || emp._formRoot.localName !== 'odlozenyPrijem') return null;
    var pojisteni = findChildEl(emp._formRoot, 'pojisteni');
    if (!pojisteni) return null;
    var eldpObdobi = findChildEl(pojisteni, 'eldpObdobi');
    if (!eldpObdobi) return null;
    var result = [];
    for (var i = 0; i < eldpObdobi.children.length; i++) {
      var obd = eldpObdobi.children[i];
      if (obd.localName !== 'obdobi') continue;
      var mEl = findChildEl(obd, 'mesic');
      var rEl = findChildEl(obd, 'rok');
      var mesic = mEl ? parseInt(mEl.textContent, 10) : null;
      var rok = rEl ? parseInt(rEl.textContent, 10) : null;
      var eldpSez = findChildEl(obd, 'eldpSeznam');
      var eldpEls = [];
      if (eldpSez) {
        for (var j = 0; j < eldpSez.children.length; j++) {
          if (eldpSez.children[j].localName === 'eldp') eldpEls.push(eldpSez.children[j]);
        }
      }
      result.push({ mesic: mesic, rok: rok, eldpEls: eldpEls });
    }
    return result.length > 0 ? result : null;
  }

  // Read a numeric field from a raw ELDP XML element by csszId
  function readEldpElNum(eldpEl, csszId) {
    var def = getFieldDef(csszId);
    if (!def) return null;
    var el = findChildEl(eldpEl, def.attr);
    if (!el) return null;
    var txt = el.textContent.trim();
    if (txt === '') return null;
    var n = parseFloat(txt.replace(/\s/g, '').replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  // Read a string field from a raw ELDP XML element by csszId
  function readEldpElVal(eldpEl, csszId) {
    var def = getFieldDef(csszId);
    if (!def) return '';
    var el = findChildEl(eldpEl, def.attr);
    return el ? el.textContent.trim() : '';
  }

  // Checks if the employeeis in the cinnostKS or pestoun datový scénář (form variant).
  // Per mh-kontroly.csv (see M165), these map to form variants:
  //   cinnostKS = K,N,O,P,Q,R,S + activities 1-9 with 10502
  //   pestoun   = M
  // Used by M7 (VZ field selection), M216/M284 (VZ breakdown exclusion).
  function isCinnostKSOrPestoun(emp) {
    var variant = emp._formRoot?.localName;
    return variant === 'cinnostKS' || variant === 'pestoun';
  }

  // DPP druh činnosti — codelist range "T" .. "ZC" (per CSV spec for M245/M296/M325).
  // XSD druhCinnostiType = ([1-9][0-9]?)|[A-Z]{1,2} so codes are 1–2 letters; the current
  // codelist uses single letters T..Z (1st–7th DPP), with two-letter codes reserved for
  // future expansion (e.g. ZA, ZB, ZC). Lexicographic comparison covers both.
  function isDppCode(dc) {
    if (!dc) return false;
    return dc >= 'T' && dc <= 'ZC';
  }

  // Get header field value (PVPOJ, souhrn, hlavicka) by csszId
  let _xmlDoc = null; // set during runKontroly
  function getHeaderVal(headerFields, csszId) {
    const hdrKey = HEADER_CSSZ_MAP[csszId];
    if (hdrKey) {
      const hf = headerFields.find(h => h.key === hdrKey);
      if (hf) return hf.value || '';
    }
    return '';
  }

  function getHeaderNum(headerFields, csszId) {
    const v = getHeaderVal(headerFields, csszId);
    if (v === '') return null;
    const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  // ── Control Definitions ──────────────────────────────────────
  // Scope: 'emp' = per-employee, 'header' = document header, 'cross' = cross-employee aggregation
  // sev: 'error' = nepropustná, 'warning' = propustná

  const KONTROLY = [
    // ═══ Phase 1: Controls 1-61 ═══

    // M1: Počet zaměstnanců se slevou = count of employees with 10372="true"
    { id: 'M1', scope: 'cross', sev: 'warning', type: 'custom',
      msg: 'Nesouhlasí počet zaměstnanců, za které zaměstnavatel uplatňuje slevu na pojistném.',
      check: function(ctx) {
        const expected = ctx.getHeaderNum('10030');
        if (expected === null) return [];
        const count = ctx.allEmps.filter(e => {
          const v = getVal(e, '10372');
          return isTrueValue(v);
        }).length;
        if (count !== expected) return [{ fieldCsszId: '10030', message: ctx.rule.msg }];
        return [];
      }},

    // M3: Sleva na pojistném = ceil(0.05 * úhrn VZ zaměstnanců se slevou)
    { id: 'M3', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'Sleva na pojistném neodpovídá úhrnu vyměřovacích základů zaměstnanců, za které je uplatňována.',
      check: function(ctx) {
        const sleva = ctx.getHeaderNum('10032');
        const zaklad = ctx.getHeaderNum('10031');
        if (sleva === null || zaklad === null) return [];
        const expected = Math.ceil(KONTROLY_CONSTANTS.rates.employerDiscount * zaklad);
        if (Math.abs(sleva - expected) > KONTROLY_CONSTANTS.tolerances.roundedHalf) return [{ fieldCsszId: '10032', message: ctx.rule.msg }];
        return [];
      }},

    // M4: Pojistné k úhradě = pojistné celkem - sleva zaměstnavatele - úhrn slev zaměstnanců
    { id: 'M4', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'Pojistné k úhradě neodpovídá vykázanému pojistnému celkem a případně odečítané slevě.',
      check: function(ctx) {
        const uhrada = ctx.getHeaderNum('10033');
        const celkem = ctx.getHeaderNum('10029');
        if (uhrada === null || celkem === null) return [];
        const slevaZam = ctx.getHeaderNum('10032') || 0;
        const uhrnSlev = ctx.getHeaderNum('10487') || 0;
        const uhrnSlevOvo = ctx.getHeaderNum('10545') || 0;
        const expected = celkem - slevaZam - uhrnSlev - uhrnSlevOvo;
        if (Math.abs(uhrada - expected) > 0.5) return [{ fieldCsszId: '10033', message: ctx.rule.msg }];
        return [];
      }},

    // M7: Úhrn VZ zaměstnanců (A) = sum of employee VZ per datový scénář
    // Per CSV: cinnostKS/pestoun use 10477 (total VZ), others use 10478 (VZ part A)
    { id: 'M7', scope: 'cross', sev: 'warning', type: 'custom',
      msg: 'Úhrn nesouhlasí se součtem vyměřovacích základů dotčených zaměstnanců (nevykonávají činnost v rizikovém zaměstnání).',
      check: function(ctx) {
        const header = ctx.getHeaderNum('10023');
        if (header === null) return [];
        const sum = ctx.allEmps.reduce((s, e) => {
          var field = isCinnostKSOrPestoun(e) ? '10477' : '10478';
          return s + (getNum(e, field) || 0);
        }, 0);
        if (Math.abs(header - sum) > 0.5) return [{ fieldCsszId: '10023', message: ctx.rule.msg }];
        return [];
      }},

    // M8: Pojistné zaměstnavatele A = ceil(0.248 * základ A)
    { id: 'M8', scope: 'header', sev: 'error', type: 'pct_eq',
      target: '10024', base: '10023', rate: KONTROLY_CONSTANTS.rates.employerInsuranceA,
      msg: 'Vykázané pojistné neodpovídá vykázanému úhrnu vyměřovacích základů zaměstnanců (nevykonávají rizikové zaměstnání).' },

    // M9: Úhrn VZ zaměstnanců (B) = sum of employee 10479
    { id: 'M9', scope: 'cross', sev: 'warning', type: 'custom',
      msg: 'Úhrn nesouhlasí se součtem vyměřovacích základů zaměstnanců (zdravotničtí záchranáři nebo členové HZS).',
      check: function(ctx) {
        const header = ctx.getHeaderNum('10025');
        if (header === null) return [];
        const sum = ctx.allEmps.reduce((s, e) => s + (getNum(e, '10479') || 0), 0);
        if (Math.abs(header - sum) > 0.5) return [{ fieldCsszId: '10025', message: ctx.rule.msg }];
        return [];
      }},

    // M10: Pojistné zaměstnavatele B = ceil(0.298 * základ B)
    { id: 'M10', scope: 'header', sev: 'error', type: 'pct_eq',
      target: '10026', base: '10025', rate: KONTROLY_CONSTANTS.rates.employerInsuranceB,
      msg: 'Vykázané pojistné neodpovídá vykázanému úhrnu vyměřovacích základů zaměstnanců (zdravotničtí záchranáři nebo členové HZS).' },

    // M11: Pojistné zaměstnavatele celkem = A + B + C
    { id: 'M11', scope: 'header', sev: 'error', type: 'sum_eq',
      target: '10027', parts: ['10024', '10026', '10484'],
      msg: 'Vykázané pojistné za zaměstnavatele neodpovídá vykázaným dílčím hodnotám.' },

    // M12: Pojistné zaměstnance = sum of employee 10370
    { id: 'M12', scope: 'cross', sev: 'warning', type: 'custom',
      msg: 'Pojistné za zaměstnance nesouhlasí se součtem pojistného za všechny jednotlivé zaměstnance.',
      check: function(ctx) {
        const header = ctx.getHeaderNum('10028');
        if (header === null) return [];
        const sum = ctx.allEmps.reduce((s, e) => s + (getNum(e, '10370') || 0), 0);
        if (Math.abs(header - sum) > 0.5) return [{ fieldCsszId: '10028', message: ctx.rule.msg }];
        return [];
      }},

    // M13: Pojistné celkem = pojistné zaměstnavatele celkem + pojistné zaměstnance
    { id: 'M13', scope: 'header', sev: 'error', type: 'sum_eq',
      target: '10029', parts: ['10027', '10028'],
      msg: 'Vykázané pojistné celkem neodpovídá vykázanému pojistnému za zaměstnance a pojistnému za zaměstnavatele.' },

    // M15: Odpracované hodiny max 240 for pracovní/služební poměr
    { id: 'M15', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Překročen maximální možný počet odpracovaných hodin, zkontrolujte položku.',
      check: function(ctx) {
        const druh = ctx.getVal('10239');
        if (!druh) return [];
        const d = parseInt(druh);
        if (d < 1 || d > 9) return [];
        const hodiny = ctx.getNum('10268');
        if (hodiny === null) return [];
        if (hodiny > KONTROLY_CONSTANTS.limits.maxWorkedHours) return [{ fieldCsszId: '10268', message: ctx.rule.msg }];
        return [];
      }},

    // M20: Odpracované hodiny >= přesčasové hodiny
    { id: 'M20', scope: 'emp', sev: 'error', type: 'gte', a: '10268', b: '10269',
      msg: 'Přesčasové hodiny převyšují odpracované hodiny.' },

    // M23: Neodpracované hodiny s náhradou >= neodpracované hodiny dovolená
    { id: 'M23', scope: 'emp', sev: 'error', type: 'gte', a: '10276', b: '10279',
      msg: 'Chybný počet neodpracovaných hodin s náhradou či nekrácením mzdy.' },

    // M28: Mzda zúčtovaná >= součet složek mzdy
    { id: 'M28', scope: 'emp', sev: 'error', type: 'sum_gte',
      target: '10328', parts: ['10329', '10330', '10331', '10332', '10333'],
      msg: 'Mzda zúčtovaná je menší než součet jejích složek.' },

    // M29: Příplatky celkem >= noční + soboty/neděle + svátek
    { id: 'M29', scope: 'emp', sev: 'error', type: 'sum_gte',
      target: '10332', parts: ['10334', '10335', '10336'],
      msg: 'Příplatky jsou nižší než součet jednotlivých příplatků.' },

    // M31: Období >= 01/2026
    { id: 'M31', scope: 'header', sev: 'error', type: 'custom',
      msg: 'Měsíční hlášení nelze podat za období před 01/2026.',
      check: function(ctx) {
        const mesic = ctx.getHeaderNum('10010');
        const rok = ctx.getHeaderNum('10011');
        if (rok === null || mesic === null) return [];
        if (rok < 2026 || (rok === 2026 && mesic < 1))
          return [{ fieldCsszId: '10011', message: ctx.rule.msg }];
        return [];
      }},

    // M34: Pokud neodpracované hodiny DPN > 0, pak náhrady DPN > 0
    { id: 'M34', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Pokud je vyplněn počet neodpracovaných hodin z důvodu DPN, musí být zároveň vyplněna náhrada při DPN.',
      check: function(ctx) {
        const hodiny = ctx.getNum('10278');
        if (hodiny === null || hodiny <= 0) return [];
        const nahrada = ctx.getNum('10342');
        if (nahrada === null || nahrada <= 0)
          return [{ fieldCsszId: '10342', message: ctx.rule.msg }];
        return [];
      }},

    // M35: Pokud neodpracované hodiny dovolená > 0, pak náhrady za dovolenou > 0
    { id: 'M35', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Chybí údaj k náhradě za dovolenou.',
      check: function(ctx) {
        const hodiny = ctx.getNum('10279');
        if (hodiny === null || hodiny <= 0) return [];
        const nahrada = ctx.getNum('10338');
        if (nahrada === null || nahrada <= 0)
          return [{ fieldCsszId: '10338', message: ctx.rule.msg }];
        return [];
      }},

    // M36: Pokud přesčasové hodiny > 0, pak příplatky za přesčas >= 0
    { id: 'M36', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Chybí údaj k příplatkům za přesčas.',
      check: function(ctx) {
        const prescas = ctx.getNum('10269');
        if (prescas === null || prescas <= 0) return [];
        const priplatky = ctx.getNum('10333');
        if (priplatky === null)
          return [{ fieldCsszId: '10333', message: ctx.rule.msg }];
        return [];
      }},

    // M37: IK MPSV format check (10 digits, modulo 11)
    // Source: mh-kontroly.csv M37 — 10th digit = remainder of first 9 digits divided by 11
    { id: 'M37', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'IK MPSV neodpovídá formátu.',
      check: function(ctx) {
        const ik = ctx.getVal('10051');
        if (!ik) return [];
        if (!/^\d{10}$/.test(ik)) return [{ fieldCsszId: '10051', message: ctx.rule.msg }];
        var num = parseInt(ik.substring(0, 9), 10);
        if (isNaN(num)) return [{ fieldCsszId: '10051', message: ctx.rule.msg }];
        var remainder = num % 11;
        var check = remainder >= 10 ? 0 : remainder;
        if (parseInt(ik.charAt(9), 10) !== check) return [{ fieldCsszId: '10051', message: ctx.rule.msg }];
        return [];
      }},

    // M42: Sleva na pojistném zaměstnavatele jen pro druh činnosti 1-9
    //   a 10502 není "výkon trestu odnětí svobody" ani "pracovní vztah specifické skupiny"
    { id: 'M42', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Slevu na pojistném zaměstnavatele lze uplatnit pouze za zaměstnance s druhem činnosti 1 až 9.',
      check: function(ctx) {
        const sleva = ctx.getVal('10372');
        if (!isTrueValue(sleva)) return [];
        // 10502 exclusion: vezen = výkon trestu, cinnostKS = pracovní vztah specifické skupiny
        var variant = ctx.emp._formRoot?.localName;
        if (variant === 'vezen' || variant === 'cinnostKS')
          return [{ fieldCsszId: '10372', message: ctx.rule.msg }];
        const druh = ctx.getVal('10239');
        // When identified by ikMpsv/idPpv, druhCinnosti is not in the XML (XSD xs:choice)
        if (!druh) return [];
        const d = parseInt(druh);
        if (d < 1 || d > 9) return [{ fieldCsszId: '10372', message: ctx.rule.msg }];
        return [];
      }},

    // M43: Pojištění od <= pojištění do AND pojištění od <= datum vyplnění
    { id: 'M43', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Chybné datum od.',
      check: function(ctx) {
        const od = ctx.getVal('10354');
        if (!od) return [];
        const doVal = ctx.getVal('10355');
        if (doVal && od > doVal) return [{ fieldCsszId: '10354', message: ctx.rule.msg }];
        const datVypl = ctx.getHeaderVal('10005');
        if (datVypl && od > datVypl.substring(0, 10))
          return [{ fieldCsszId: '10354', message: ctx.rule.msg }];
        return [];
      }},

    // M44: Pojištění do >= pojištění od AND pojištění do <= datum vyplnění
    { id: 'M44', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Chybné datum do.',
      check: function(ctx) {
        const doVal = ctx.getVal('10355');
        if (!doVal) return [];
        const od = ctx.getVal('10354');
        if (od && doVal < od) return [{ fieldCsszId: '10355', message: ctx.rule.msg }];
        const datVypl = ctx.getHeaderVal('10005');
        if (datVypl && doVal > datVypl.substring(0, 10))
          return [{ fieldCsszId: '10355', message: ctx.rule.msg }];
        return [];
      }},

    // M45: Rozsah kratší pracovní doby <= 30
    { id: 'M45', scope: 'emp', sev: 'error', type: 'range', field: '10373', max: KONTROLY_CONSTANTS.limits.shorterWorkRangeMax,
      msg: 'Uvedený počet hodin překračuje limit stanovený právní úpravou (30 hodin).' },

    // M50: Vyměřovací základ >= 0 (iterates ELDP instances)
    { id: 'M50', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Vyměřovací základ nesmí být záporný.',
      check: function(ctx) {
        var n = ctx.getRepeatCount('pojisteni/eldpSeznam/eldp');
        var errors = [];
        for (var i = 0; i < n; i++) {
          var vz = ctx.getNum('10245', i);
          if (vz !== null && vz < 0)
            errors.push({ fieldCsszId: '10245', instanceIndex: i, message: ctx.rule.msg });
        }
        return errors;
      }},

    // M56: Datum dosažení expozice NPE <= datum vyplnění
    { id: 'M56', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Datum musí být nižší než datum vyplnění podání.',
      check: function(ctx) {
        const datum = ctx.getVal('10272');
        if (!datum) return [];
        const datVypl = ctx.getHeaderVal('10005');
        if (!datVypl) return [];
        if (datum > datVypl.substring(0, 10))
          return [{ fieldCsszId: '10272', message: ctx.rule.msg }];
        return [];
      }},

    // M57: Odpracované hodiny rizikové práce <= odpracované hodiny
    { id: 'M57', scope: 'emp', sev: 'error', type: 'lte', a: '10273', b: '10268',
      msg: 'Počet odpracovaných hodin rizikové práce je větší než počet odpracovaných hodin.' },

    // M58: Počet kalendářních dnů pojištění <= dnů v měsíci (ELDP repeating)
    { id: 'M58', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Neodpovídá možnému počtu dnů v kalendářním měsíci.',
      check: function(ctx) {
        var errors = [];
        // Check odložený příjem ELDP období (10537/10538 per období)
        var obdobi = getOdlozenyEldpObdobi(ctx.emp);
        if (obdobi) {
          for (var oi = 0; oi < obdobi.length; oi++) {
            var m = obdobi[oi].mesic, r = obdobi[oi].rok;
            if (m === null || r === null) continue;
            var dim = daysInMonth(r, m);
            for (var ei = 0; ei < obdobi[oi].eldpEls.length; ei++) {
              var dny = readEldpElNum(obdobi[oi].eldpEls[ei], '10356');
              if (dny !== null && dny > dim)
                errors.push({ fieldCsszId: '10356', instanceIndex: ei, message: ctx.rule.msg });
            }
          }
          return errors;
        }
        // Standard form: use header 10010/10011
        var mesic = ctx.getHeaderNum('10010');
        var rok = ctx.getHeaderNum('10011');
        if (mesic === null || rok === null) return [];
        var dim = daysInMonth(rok, mesic);
        var n = ctx.getRepeatCount('pojisteni/eldpSeznam/eldp');
        for (var i = 0; i < n; i++) {
          var dny2 = ctx.getNum('10356', i);
          if (dny2 !== null && dny2 > dim)
            errors.push({ fieldCsszId: '10356', instanceIndex: i, message: ctx.rule.msg });
        }
        return errors;
      }},

    // M59: Vyměřovací základ ELDP rules based on Kód ELDP
    { id: 'M59', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Chybně uvedený vyměřovací základ.',
      check: function(ctx) {
        var n = ctx.getRepeatCount('pojisteni/eldpSeznam/eldp');
        var errors = [];
        for (var i = 0; i < n; i++) {
          var kod = ctx.getVal('10240', i) || '';
          var vz = ctx.getNum('10245', i);
          var dny = ctx.getNum('10356', i);
          var vylDoby = ctx.getNum('10357', i);
          var odecDoby = ctx.getNum('10375', i);
          if (kod.length < 2) continue;
          var druhaPozice = kod.charAt(1);
          // Rule 1: if 2nd position = P → VZ must be filled
          if (druhaPozice === 'P' && (vz === null || vz === undefined))
            errors.push({ fieldCsszId: '10245', instanceIndex: i, message: 'Kód ELDP obsahuje P, vyměřovací základ musí být uveden.' });
          // Rule 2: if dny = vyloučené doby AND 2nd ≠ D → VZ = 0
          if (dny !== null && vylDoby !== null && dny === vylDoby && druhaPozice !== 'D') {
            if (vz !== null && vz !== 0)
              errors.push({ fieldCsszId: '10245', instanceIndex: i, message: ctx.rule.msg });
          }
          // Rule 3: Pension age transition — pre-pension record must have VZ=0
          // if consecutive ELDP pair with same 1st pos, one has D, dates connect
          if (druhaPozice !== 'D' && n >= 2) {
            for (var j = 0; j < n; j++) {
              if (i === j) continue;
              var kodJ = ctx.getVal('10240', j) || '';
              if (kodJ.length < 2 || kodJ.charAt(1) !== 'D') continue;
              var dnyJ = ctx.getNum('10356', j);
              if (dnyJ === null) continue;
              if (kod.charAt(0) !== kodJ.charAt(0)) continue; // same activity type
              var doI = ctx.getVal('10242', i);
              var odJ = ctx.getVal('10241', j);
              if (!doI || !odJ) continue;
              var dEnd = parseDate(doI);
              var dStart = parseDate(odJ);
              if (!dEnd || !dStart) continue;
              var dEndNext = addDays(dEnd, 1);
              if (compareDates(dEndNext, dStart) === 0) {
                if (vz !== null && vz !== 0)
                  errors.push({ fieldCsszId: '10245', instanceIndex: i, message: ctx.rule.msg });
                break;
              }
            }
          }
          // Rule 4: if 2nd = D and dny = 0 and odecDoby = vylDoby → VZ = 0
          if (druhaPozice === 'D' && dny !== null && dny === 0
              && odecDoby !== null && vylDoby !== null && odecDoby === vylDoby) {
            if (vz !== null && vz !== 0)
              errors.push({ fieldCsszId: '10245', instanceIndex: i, message: ctx.rule.msg });
          }
          // Rule 5: if 2nd ≠ D and ≠ P and dny = 0 → VZ = 0
          if (druhaPozice !== 'D' && druhaPozice !== 'P' && dny !== null && dny === 0) {
            if (vz !== null && vz !== 0)
              errors.push({ fieldCsszId: '10245', instanceIndex: i, message: ctx.rule.msg });
          }
        }
        return errors;
      }},

    // M60: Datum nastání specifické právní skutečnosti < datum vyplnění
    { id: 'M60', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'Datum nastání specifické právní skutečnosti musí být menší než datum podání.',
      check: function(ctx) {
        const datum = readSouhrnField(_xmlDoc, ['souhrn', 'specifickaSkutecnost', 'datum']);
        if (!datum) return [];
        const datVypl = ctx.getHeaderVal('10005');
        if (!datVypl) return [];
        if (datum >= datVypl.substring(0, 10))
          return [{ fieldCsszId: '10409', message: ctx.rule.msg }];
        return [];
      }},

    // M61: XSD validation — handled by existing XSD validator, skip

    // ═══ Phase 2: Controls 72-125 ═══

    // M72: Zúčtovaný příjem celkem >= 0
    { id: 'M72', scope: 'emp', sev: 'error', type: 'non_neg', field: '10286',
      msg: 'Musí být uvedena hodnota větší nebo rovna nule.' },

    // M74: Daňový bonus >= 0, a pokud > 0 pak >= 50
    { id: 'M74', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Hodnota musí být rovna nule nebo větší rovno než 50 Kč.',
      check: function(ctx) {
        const v = ctx.getNum('10306');
        if (v === null) return [];
        if (v < 0 || (v > 0 && v < KONTROLY_CONSTANTS.limits.minMonthlyTaxBonus))
          return [{ fieldCsszId: '10306', message: ctx.rule.msg }];
        return [];
      }},

    // M78: Přeplatek z ročního zúčtování = daňový přeplatek + doplatek bonusu
    { id: 'M78', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Hodnota neodpovídá součtu dílčích položek.',
      check: function(ctx) {
        const druh = ctx.getVal('10239');
        if (druh === '12') return []; // mezinárodní pronájem síly excluded
        const celkem = ctx.getNum('10321');
        if (celkem === null) return [];
        const dan = ctx.getNum('10322') || 0;
        const bonus = ctx.getNum('10323') || 0;
        if (Math.abs(celkem - (dan + bonus)) > 0.5)
          return [{ fieldCsszId: '10321', message: ctx.rule.msg }];
        return [];
      }},

    // M79: Pokud roční zúčtování provedeno, pak povinné položky
    { id: 'M79', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Není uvedena hodnota pro roční zúčtování záloh.',
      check: function(ctx) {
        const proved = ctx.getVal('10320');
        if (!isTrueValue(proved)) return [];
        const required = ['10321', '10322', '10323', '10420', '10454'];
        const missing = required.filter(id => !ctx.isFilled(id));
        if (missing.length > 0)
          return [{ fieldCsszId: missing[0], message: ctx.rule.msg }];
        return [];
      }},

    // M81: Rodné číslo uživatele — modulo check
    { id: 'M81', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Chybně uvedené rodné číslo.',
      check: function(ctx) {
        const rc = ctx.getVal('10457');
        if (!rc) return [];
        const digits = rc.replace(/\//g, '');
        if (!/^\d{9,10}$/.test(digits)) return [{ fieldCsszId: '10457', message: ctx.rule.msg }];
        if (digits.length === 10) {
          const num = parseInt(digits, 10);
          if (num % 11 !== 0) return [{ fieldCsszId: '10457', message: ctx.rule.msg }];
        }
        return [];
      }},

    // M82: Pokud specifická právní skutečnost, pak výplatní termín u všech zaměstnanců
    { id: 'M82', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'Výplatní termín musí být uveden.',
      check: function(ctx) {
        const typ = readSouhrnField(_xmlDoc, ['souhrn', 'specifickaSkutecnost', 'typ']);
        if (!typ) return [];
        const errors = [];
        ctx.allEmps.forEach(e => {
          if (!isFilled(e, '10410'))
            errors.push({ fieldCsszId: '10410', message: ctx.rule.msg });
        });
        return errors;
      }},

    // M84: Pořadí balíku <= počet balíků
    { id: 'M84', scope: 'header', sev: 'error', type: 'lte', a: '10002', b: '10003',
      msg: 'Pořadí balíku nesmí být vyšší než počet balíků.' },

    // M87: První pozice kódu ELDP odpovídá druhu činnosti
    { id: 'M87', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Kód ELDP neodpovídá číselníku Druh činnosti.',
      check: function(ctx) {
        const druh = ctx.getVal('10239');
        if (!druh) return [];
        const n = ctx.getRepeatCount('pojisteni/eldpSeznam/eldp');
        const errors = [];
        for (let i = 0; i < n; i++) {
          const kod = ctx.getVal('10240', i);
          if (kod && kod.charAt(0) !== druh.charAt(0))
            errors.push({ fieldCsszId: '10240', instanceIndex: i, message: ctx.rule.msg });
        }
        return errors;
      }},

    // M88: Datum vyplnění <= aktuální datum
    { id: 'M88', scope: 'header', sev: 'error', type: 'custom',
      msg: 'Datum vyplnění podání musí být nižší nebo rovno aktuálnímu datu.',
      check: function(ctx) {
        const dat = ctx.getHeaderVal('10005');
        if (!dat) return [];
        const today = formatDate(todayDate());
        if (dat.substring(0, 10) > today)
          return [{ fieldCsszId: '10005', message: ctx.rule.msg }];
        return [];
      }},

    // M90: Období < aktuální měsíc
    { id: 'M90', scope: 'header', sev: 'error', type: 'custom',
      msg: 'Měsíc musí být nižší aktuálnímu měsíci a roku.',
      check: function(ctx) {
        const mesic = ctx.getHeaderNum('10010');
        const rok = ctx.getHeaderNum('10011');
        if (mesic === null || rok === null) return [];
        var td = todayDate();
        const curY = td.y, curM = td.m;
        if (rok > curY || (rok === curY && mesic >= curM))
          return [{ fieldCsszId: '10010', message: ctx.rule.msg }];
        return [];
      }},

    // M93: Počet formulářů v balíku <= počet formulářů celkem
    { id: 'M93', scope: 'header', sev: 'error', type: 'lte', a: '10015', b: '10488',
      msg: 'Počet formulářů v balíku musí být maximálně jako Počet formulářů celkem.' },

    // M94: Stanovený fond pracovní doby >= 0
    { id: 'M94', scope: 'emp', sev: 'error', type: 'non_neg', field: '10259',
      msg: 'Stanovený fond pro danou profesi musí být kladná nebo nulová hodnota.' },

    // M95: Sjednaný fond pracovní doby >= 0
    { id: 'M95', scope: 'emp', sev: 'error', type: 'non_neg', field: '10260',
      msg: 'Sjednaný fond pracovní doby musí být kladná nebo nulová hodnota.' },

    // M96: Stanovená týdenní pracovní doba >= 0
    { id: 'M96', scope: 'emp', sev: 'error', type: 'non_neg', field: '10261',
      msg: 'Stanovená týdenní pracovní doba musí být kladná hodnota.' },

    // M97: Osvobozené příjmy <= zúčtovaný příjem celkem
    { id: 'M97', scope: 'emp', sev: 'error', type: 'lte', a: '10289', b: '10286',
      msg: 'Hodnota osvobozených příjmů nesmí být vyšší než zúčtovaný příjem - celkem.' },

    // M98: ELDP denní atributy <= dnů v měsíci
    { id: 'M98', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Hodnota nesmí být vyšší než počet dní v daném měsíci.',
      check: function(ctx) {
        var dayFields = ['10357','10358','10359','10360','10362','10536','10366',
                         '10473','10474','10475','10375','10462','10463','10464',
                         '10465','10466','10468','10469'];
        var errors = [];
        // Check odložený příjem ELDP období
        var obdobi = getOdlozenyEldpObdobi(ctx.emp);
        if (obdobi) {
          for (var oi = 0; oi < obdobi.length; oi++) {
            var m = obdobi[oi].mesic, r = obdobi[oi].rok;
            if (m === null || r === null) continue;
            var dim = daysInMonth(r, m);
            for (var ei = 0; ei < obdobi[oi].eldpEls.length; ei++) {
              for (var fi = 0; fi < dayFields.length; fi++) {
                var v = readEldpElNum(obdobi[oi].eldpEls[ei], dayFields[fi]);
                if (v !== null && v > dim)
                  errors.push({ fieldCsszId: dayFields[fi], instanceIndex: ei, message: ctx.rule.msg });
              }
            }
          }
          return errors;
        }
        // Standard form
        var mesic = ctx.getHeaderNum('10010');
        var rok = ctx.getHeaderNum('10011');
        if (mesic === null || rok === null) return [];
        var dim2 = daysInMonth(rok, mesic);
        var n = ctx.getRepeatCount('pojisteni/eldpSeznam/eldp');
        for (var i = 0; i < n; i++) {
          for (var fi2 = 0; fi2 < dayFields.length; fi2++) {
            var v2 = ctx.getNum(dayFields[fi2], i);
            if (v2 !== null && v2 > dim2)
              errors.push({ fieldCsszId: dayFields[fi2], instanceIndex: i, message: ctx.rule.msg });
          }
        }
        return errors;
      }},

    // M99: ELDP platnost kódu musí být v hlášeném měsíci
    { id: 'M99', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Datum je mimo měsíc, za který je podáváno.',
      check: function(ctx) {
        var errors = [];
        // Check odložený příjem ELDP období
        var obdobi = getOdlozenyEldpObdobi(ctx.emp);
        if (obdobi) {
          for (var oi = 0; oi < obdobi.length; oi++) {
            var m = obdobi[oi].mesic, r = obdobi[oi].rok;
            if (m === null || r === null) continue;
            var mStr = String(r) + '-' + String(m).padStart(2, '0');
            for (var ei = 0; ei < obdobi[oi].eldpEls.length; ei++) {
              var od = readEldpElVal(obdobi[oi].eldpEls[ei], '10241');
              var doo = readEldpElVal(obdobi[oi].eldpEls[ei], '10242');
              if (od && od.substring(0, 7) !== mStr)
                errors.push({ fieldCsszId: '10241', instanceIndex: ei, message: ctx.rule.msg });
              if (doo && doo.substring(0, 7) !== mStr)
                errors.push({ fieldCsszId: '10242', instanceIndex: ei, message: ctx.rule.msg });
            }
          }
          return errors;
        }
        // Standard form
        var mesic = ctx.getHeaderNum('10010');
        var rok = ctx.getHeaderNum('10011');
        if (mesic === null || rok === null) return [];
        var mStr2 = String(rok) + '-' + String(mesic).padStart(2, '0');
        var n = ctx.getRepeatCount('pojisteni/eldpSeznam/eldp');
        for (var i = 0; i < n; i++) {
          var od2 = ctx.getVal('10241', i);
          var doo2 = ctx.getVal('10242', i);
          if (od2 && od2.substring(0, 7) !== mStr2)
            errors.push({ fieldCsszId: '10241', instanceIndex: i, message: ctx.rule.msg });
          if (doo2 && doo2.substring(0, 7) !== mStr2)
            errors.push({ fieldCsszId: '10242', instanceIndex: i, message: ctx.rule.msg });
        }
        return errors;
      }},

    // M100: Platnost kódu od <= platnost kódu do (ELDP)
    { id: 'M100', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Datum kódu "od" musí být rovno nebo nižší než datum kódu "do".',
      check: function(ctx) {
        const n = ctx.getRepeatCount('pojisteni/eldpSeznam/eldp');
        const errors = [];
        for (let i = 0; i < n; i++) {
          const od = ctx.getVal('10241', i);
          const doo = ctx.getVal('10242', i);
          if (od && doo && od > doo)
            errors.push({ fieldCsszId: '10241', instanceIndex: i, message: ctx.rule.msg });
        }
        return errors;
      }},

    // M103: Dočasné přidělení — identifikace uživatele (XOR: exactly one of 3 options)
    { id: 'M103', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Není uvedena identifikace dočasného přidělení.',
      check: function(ctx) {
        const evid = ctx.getVal('10251');
        if (!isTrueValue(evid)) return [];
        const ico = ctx.isFilled('10252');
        const rc = ctx.isFilled('10457');
        const zahr = ctx.isFilled('10492') && ctx.isFilled('10493') && ctx.isFilled('10494');
        var count = (ico ? 1 : 0) + (rc ? 1 : 0) + (zahr ? 1 : 0);
        if (count !== 1)
          return [{ fieldCsszId: '10251', message: ctx.rule.msg }];
        return [];
      }},

    // M109: Odměny nerezidentů <= zúčtovaný příjem
    { id: 'M109', scope: 'emp', sev: 'error', type: 'lte', a: '10416', b: '10286',
      msg: 'Odměna člena orgánu právnických osob je vyšší než zúčtovaný příjem.' },

    // M110: Pořadí dětí — nelze vyšší bez nižšího
    { id: 'M110', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Nelze uplatnit dítě s vyšším pořadím, pokud v daném měsíci nejsou uvedeny děti s nižším pořadím nebo s "N".',
      check: function(ctx) {
        const sec = 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic/vyzivovaneDeti/vyzivovaneDite';
        const n = ctx.getRepeatCount(sec);
        if (n <= 1) return [];
        const poradis = [];
        for (let i = 0; i < n; i++) {
          const p = ctx.getVal('10440', i);
          if (p) poradis.push(p);
        }
        const nums = poradis.filter(p => p !== 'N').map(Number).filter(x => !isNaN(x));
        if (nums.length === 0) return [];
        const maxP = Math.max(...nums);
        for (let p = 1; p < maxP; p++) {
          if (!nums.includes(p) && !poradis.includes('N')) {
            // Point to the instance with the highest poradi (the one causing the gap)
            var targetIdx = 0;
            for (let i = 0; i < n; i++) {
              if (Number(ctx.getVal('10440', i)) === maxP) { targetIdx = i; break; }
            }
            return [{ fieldCsszId: '10440', instanceIndex: targetIdx, message: ctx.rule.msg }];
          }
        }
        return [];
      }},

    // M111: Pokud ZTP/P partnera = ANO, pak měsíce ZTP/P v [1,12]
    { id: 'M111', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Chybná hodnota v počtu měsíců uplatnění slevy ve dvojnásobné výši (ZTP/P).',
      check: function(ctx) {
        const ztpp = ctx.getVal('10425');
        if (!isTrueValue(ztpp)) return [];
        const mesice = ctx.getNum('10430');
        if (mesice === null || mesice < 1 || mesice > 12)
          return [{ fieldCsszId: '10430', message: ctx.rule.msg }];
        return [];
      }},

    // M112: Pokud daňové zvýhodnění na děti = ANO, pak povinné údaje za dítě (roční)
    { id: 'M112', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Nejsou vyplněny údaje za dítě.',
      check: function(ctx) {
        const zvyh = ctx.getVal('10454');
        if (!isTrueValue(zvyh)) return [];
        const sec = 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti/vyzivovaneDeti/vyzivovaneDite';
        const n = ctx.getRepeatCount(sec);
        if (n === 0) return [{ fieldCsszId: '10454', message: ctx.rule.msg }];
        for (let i = 0; i < n; i++) {
          const jmeno = ctx.isFilled('10446', i);
          const prijm = ctx.isFilled('10447', i);
          const datum = ctx.isFilled('10448', i);
          const rc = ctx.isFilled('10449', i);
          const poradi = ctx.isFilled('10451', i);
          if (!jmeno || !prijm || (!datum && !rc) || !poradi)
            return [{ fieldCsszId: '10446', instanceIndex: i, message: ctx.rule.msg }];
        }
        return [];
      }},

    // M113: Jiná vyživující osoba — RČ nebo datum narození
    { id: 'M113', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Chybí rodné číslo nebo datum narození jiné vyživující osoby ve společně hospodařící domácnosti.',
      check: function(ctx) {
        const sec = 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic/jineOsoby/jinaOsoba';
        const n = ctx.getRepeatCount(sec);
        for (let i = 0; i < n; i++) {
          if (!ctx.isFilled('10433', i) && !ctx.isFilled('10434', i))
            return [{ fieldCsszId: '10433', instanceIndex: i, message: ctx.rule.msg }];
        }
        return [];
      }},

    // M114: Vyživované dítě — RČ nebo datum narození (měsíční)
    { id: 'M114', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Chybí rodné číslo nebo datum narození vyživovaného dítěte.',
      check: function(ctx) {
        const sec = 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic/vyzivovaneDeti/vyzivovaneDite';
        const n = ctx.getRepeatCount(sec);
        for (let i = 0; i < n; i++) {
          if (!ctx.isFilled('10437', i) && !ctx.isFilled('10438', i))
            return [{ fieldCsszId: '10437', instanceIndex: i, message: ctx.rule.msg }];
        }
        return [];
      }},

    // M115: Manžel/ka — RČ nebo datum narození
    { id: 'M115', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Chybí rodné číslo nebo datum narození manžela/manželky.',
      check: function(ctx) {
        if (!ctx.isFilled('10423') && !ctx.isFilled('10424'))
          return [];  // no partner data at all is OK
        // If one of them is partially filled, both need RC or DN
        const sec = 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/slevaNaPartnera/partner';
        const n = ctx.getRepeatCount(sec);
        for (let i = 0; i < n; i++) {
          if (!ctx.isFilled('10423', i) && !ctx.isFilled('10424', i))
            return [{ fieldCsszId: '10423', instanceIndex: i, message: ctx.rule.msg }];
        }
        return [];
      }},

    // M118: Pojistné za zaměstnance = ceil(0.071 * VZ)
    { id: 'M118', scope: 'emp', sev: 'error', type: 'pct_eq',
      target: '10370', base: '10477', rate: KONTROLY_CONSTANTS.rates.employeeInsurance,
      msg: 'Pojistné za zaměstnance neodpovídá vyměřovacímu základu zaměstnance.' },

    // M121: Vyloučené doby celkem = suma dílčích (ELDP)
    { id: 'M121', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Vyloučené doby musí být rovny sumě dílčích položek.',
      check: function(ctx) {
        const n = ctx.getRepeatCount('pojisteni/eldpSeznam/eldp');
        const errors = [];
        for (let i = 0; i < n; i++) {
          const celkem = ctx.getNum('10357', i);
          if (celkem === null || celkem === 0) continue;
          const parts = ['10358','10359','10360','10362','10536'];
          const sum = parts.reduce((s, id) => s + (ctx.getNum(id, i) || 0), 0);
          if (Math.abs(celkem - sum) > 0.5)
            errors.push({ fieldCsszId: '10357', instanceIndex: i, message: ctx.rule.msg });
        }
        return errors;
      }},

    // M123: Pokud specifická právní skutečnost typ, pak datum vyplněno
    { id: 'M123', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'Není vyplněno datum nastání specifické právní skutečnosti.',
      check: function(ctx) {
        const typ = readSouhrnField(_xmlDoc, ['souhrn', 'specifickaSkutecnost', 'typ']);
        if (!typ) return [];
        const datum = readSouhrnField(_xmlDoc, ['souhrn', 'specifickaSkutecnost', 'datum']);
        if (!datum) return [{ fieldCsszId: '10409', message: ctx.rule.msg }];
        return [];
      }},

    // M124: Pokud sleva na partnera = ANO, pak povinné údaje
    { id: 'M124', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Nejsou uvedena všechna povinná pole pro uplatnění slevy za manžela / -ku.',
      check: function(ctx) {
        const sleva = ctx.getVal('10420');
        if (!isTrueValue(sleva)) return [];
        const required = ['10421', '10422', '10425', '10426'];
        const missing = required.filter(id => !ctx.isFilled(id));
        if (missing.length > 0) return [{ fieldCsszId: missing[0], message: ctx.rule.msg }];
        if (!ctx.isFilled('10423') && !ctx.isFilled('10424'))
          return [{ fieldCsszId: '10423', message: ctx.rule.msg }];
        return [];
      }},

    // M125: Pokud sleva na partnera + ZTP/P, pak měsíce ZTP/P v [1,12]
    { id: 'M125', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Počet měsíců musí být roven nebo nižší než počet měsíců uplatnění slevy na ZTP/P.',
      check: function(ctx) {
        const sleva = ctx.getVal('10420');
        if (!isTrueValue(sleva)) return [];
        const ztpp = ctx.getVal('10425');
        if (!isTrueValue(ztpp)) return [];
        const mesice = ctx.getNum('10430');
        if (mesice === null || mesice < 1 || mesice > 12)
          return [{ fieldCsszId: '10430', message: ctx.rule.msg }];
        return [];
      }},

    // ═══ Phase 3: Controls 126-194 ═══
    // Skipped: M140 (requires previous month data), M164 (requires splatnost calendar)

    // M130: Datum od ≤ Datum do (průběh studia / TPP)
    { id: 'M130', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Datum od musí být nižší nebo rovno Datu do.',
      check: function(ctx) {
        var n = ctx.getRepeatCount('teoretickaPraktickaPriprava/obdobi');
        if (n === 0) return [];
        var errors = [];
        for (var i = 0; i < n; i++) {
          var od = ctx.getVal('10263', i);
          var doo = ctx.getVal('10264', i);
          if (!od || !doo) continue;
          var dOd = parseDate(od);
          var dDo = parseDate(doo);
          if (dOd && dDo && compareDates(dOd, dDo) > 0)
            errors.push({ fieldCsszId: '10263', instanceIndex: i, message: ctx.rule.msg });
        }
        return errors;
      }},

    // M133: Kontrola správnosti Kódu ELDP při zaměstnání malého rozsahu
    { id: 'M133', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Kód ELDP není slučitelný s příznakem zaměstnání malého rozsahu.',
      check: function(ctx) {
        var malyRozsah = ctx.getVal('10243');
        if (!isTrueValue(malyRozsah)) return [];
        var n = ctx.getRepeatCount('pojisteni/eldpSeznam/eldp');
        var errors = [];
        for (var i = 0; i < n; i++) {
          var kod = ctx.getVal('10240', i);
          if (!kod) continue;
          var c1 = kod.charAt(0).toUpperCase();
          var c2 = kod.length >= 2 ? kod.charAt(1).toUpperCase() : '';
          var c3 = kod.length >= 3 ? kod.charAt(2).toUpperCase() : '';
          // 1st position T-Z or two-char ZA-ZC → 10243 must not be A
          var forbidFirst = 'TUVWXYZ'.indexOf(c1) >= 0;
          // 3rd position B,F,J,V,T → 10243 must not be A
          var forbidThird = 'BFJVT'.indexOf(c3) >= 0;
          // 2nd position P → 10243 must not be A
          var forbidSecond = c2 === 'P';
          if (forbidFirst || forbidThird || forbidSecond)
            errors.push({ fieldCsszId: '10240', instanceIndex: i, message: ctx.rule.msg });
        }
        return errors;
      }},

    // M126: Pokud vyživuje jiná osoba (roční) = ANO, údaje jiné osoby vyplněny
    { id: 'M126', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Nejsou vyplněny údaje za další vyživující osobu.',
      check: function(ctx) {
        const vyz = ctx.getVal('10455');
        if (!isTrueValue(vyz)) return [];
        const sec = 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti/jineOsoby/jinaOsoba';
        const n = ctx.getRepeatCount(sec);
        if (n === 0) return [{ fieldCsszId: '10455', message: ctx.rule.msg }];
        for (let i = 0; i < n; i++) {
          if (!ctx.isFilled('10441', i) || !ctx.isFilled('10442', i))
            return [{ fieldCsszId: '10441', instanceIndex: i, message: ctx.rule.msg }];
          if (!ctx.isFilled('10443', i) && !ctx.isFilled('10444', i))
            return [{ fieldCsszId: '10443', instanceIndex: i, message: ctx.rule.msg }];
          if (!ctx.isFilled('10445', i))
            return [{ fieldCsszId: '10445', instanceIndex: i, message: ctx.rule.msg }];
        }
        return [];
      }},

    // M127: Pokud vyživuje jiná osoba (měsíční) = ANO, údaje osoby vyplněny
    { id: 'M127', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Nejsou vyplněny údaje za další vyživující osobu.',
      check: function(ctx) {
        const vyz = ctx.getVal('10453');
        if (!isTrueValue(vyz)) return [];
        const sec = 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic/jineOsoby/jinaOsoba';
        const n = ctx.getRepeatCount(sec);
        if (n === 0) return [{ fieldCsszId: '10453', message: ctx.rule.msg }];
        for (let i = 0; i < n; i++) {
          if (!ctx.isFilled('10431', i) || !ctx.isFilled('10432', i))
            return [{ fieldCsszId: '10431', instanceIndex: i, message: ctx.rule.msg }];
          if (!ctx.isFilled('10433', i) && !ctx.isFilled('10434', i))
            return [{ fieldCsszId: '10433', instanceIndex: i, message: ctx.rule.msg }];
        }
        return [];
      }},

    // M128: Pokud daňové zvýhodnění na děti > 0, pak údaje za děti (měsíční)
    { id: 'M128', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Nejsou vyplněny údaje za děti.',
      check: function(ctx) {
        const zvyh = ctx.getNum('10303');
        if (zvyh === null || zvyh <= 0) return [];
        const sec = 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic/vyzivovaneDeti/vyzivovaneDite';
        const n = ctx.getRepeatCount(sec);
        if (n === 0) return [{ fieldCsszId: '10303', message: ctx.rule.msg }];
        for (let i = 0; i < n; i++) {
          if (!ctx.isFilled('10435', i) || !ctx.isFilled('10436', i))
            return [{ fieldCsszId: '10435', instanceIndex: i, message: ctx.rule.msg }];
          if (!ctx.isFilled('10437', i) && !ctx.isFilled('10438', i))
            return [{ fieldCsszId: '10437', instanceIndex: i, message: ctx.rule.msg }];
          if (!ctx.isFilled('10440', i))
            return [{ fieldCsszId: '10440', instanceIndex: i, message: ctx.rule.msg }];
          if (!ctx.isFilled('10439', i))
            return [{ fieldCsszId: '10439', instanceIndex: i, message: ctx.rule.msg }];
        }
        return [];
      }},

    // M129: Měsíc musí být 1-12
    { id: 'M129', scope: 'header', sev: 'error', type: 'range', field: '10010', min: 1, max: 12,
      msg: 'Číslo měsíce musí být v rozsahu 1-12 včetně.' },

    // M131: Období >= leden 2026 (same logic as M31 but different source)
    { id: 'M131', scope: 'header', sev: 'error', type: 'custom',
      msg: 'JMHZ neslouží pro hlášení za zvolené období.',
      check: function(ctx) {
        const rok = ctx.getHeaderNum('10011');
        const mesic = ctx.getHeaderNum('10010');
        if (rok === null || mesic === null) return [];
        if (rok < 2026 || (rok === 2026 && mesic < 1))
          return [{ fieldCsszId: '10011', message: ctx.rule.msg }];
        return [];
      }},

    // M132: Opravné hlášení max 10 let zpět
    { id: 'M132', scope: 'header', sev: 'error', type: 'custom',
      msg: 'Zvolený rok přesahuje období pro hlášení do JMHZ.',
      check: function(ctx) {
        const typ = ctx.getHeaderVal('10007');
        if (typ !== 'O' && typ !== 'R') return []; // only for opravné/replacement
        const rok = ctx.getHeaderNum('10011');
        if (rok === null) return [];
        const curYear = todayDate().y;
        if (curYear - rok > 10)
          return [{ fieldCsszId: '10011', message: ctx.rule.msg }];
        return [];
      }},

    // M134: ELDP počet dnů <= (pojištění do - pojištění od) + 1
    { id: 'M134', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Počet kalendářních dnů neodpovídá uvedeným datům trvání pojištění v daném měsíci.',
      check: function(ctx) {
        const od = ctx.getVal('10354');
        const doo = ctx.getVal('10355');
        if (!od || !doo) return [];
        const dp1 = parseDate(od), dp2 = parseDate(doo);
        if (!dp1 || !dp2) return [];
        const diffDays = Math.round((Date.UTC(dp2.y, dp2.m - 1, dp2.d) - Date.UTC(dp1.y, dp1.m - 1, dp1.d)) / 86400000) + 1;
        const n = ctx.getRepeatCount('pojisteni/eldpSeznam/eldp');
        const errors = [];
        for (let i = 0; i < n; i++) {
          const dny = ctx.getNum('10356', i);
          if (dny !== null && dny > diffDays)
            errors.push({ fieldCsszId: '10356', instanceIndex: i, message: ctx.rule.msg });
        }
        return errors;
      }},

    // M135: ELDP kód vs započtené dny rules
    { id: 'M135', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Uvedená doba trvání pojištění neodpovídá kódu ELDP.',
      check: function(ctx) {
        const od = ctx.getVal('10354');
        const doo = ctx.getVal('10355');
        const n = ctx.getRepeatCount('pojisteni/eldpSeznam/eldp');
        const errors = [];
        for (let i = 0; i < n; i++) {
          const kod = ctx.getVal('10240', i) || '';
          if (kod.length < 2) continue;
          const pos2 = kod.charAt(1);
          const dny = ctx.getNum('10356', i);
          // Rule 2: 2nd position = P → dny must be 0
          if (pos2 === 'P' && dny !== null && dny !== 0)
            errors.push({ fieldCsszId: '10356', instanceIndex: i, message: ctx.rule.msg });
          // Rule 1: 2nd position = V → dny <= days in interval
          if (pos2 === 'V' && od && doo && dny !== null) {
            const dp1 = parseDate(od), dp2 = parseDate(doo);
            if (dp1 && dp2) {
              const maxDays = Math.round((Date.UTC(dp2.y, dp2.m - 1, dp2.d) - Date.UTC(dp1.y, dp1.m - 1, dp1.d)) / 86400000) + 1;
              if (dny > maxDays)
                errors.push({ fieldCsszId: '10356', instanceIndex: i, message: ctx.rule.msg });
            }
          }
        }
        return errors;
      }},

    // M137: Pokud sleva = ANO, pak důvod uplatnění vyplněn
    { id: 'M137', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Důvod uplatnění slevy musí být vyplněn, pokud je za zaměstnance uplatněna sleva na pojistném zaměstnavatele.',
      check: function(ctx) {
        const sleva = ctx.getVal('10372');
        if (!isTrueValue(sleva)) return [];
        if (!ctx.isFilled('10374'))
          return [{ fieldCsszId: '10374', message: ctx.rule.msg }];
        return [];
      }},

    // M138: Pokud sleva + důvod A/F, pak kratší rozsah vyplněn
    { id: 'M138', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Kratší rozsah služební doby musí být vyplněn.',
      check: function(ctx) {
        const sleva = ctx.getVal('10372');
        if (!isTrueValue(sleva)) return [];
        const duvod = ctx.getVal('10374');
        if (duvod < 'A' || duvod > 'F') return [];
        if (!ctx.isFilled('10373'))
          return [{ fieldCsszId: '10373', message: ctx.rule.msg }];
        return [];
      }},

    // M142: Úhrn VZ zaměstnanců (C - rizikové) = sum of employee 10480
    { id: 'M142', scope: 'cross', sev: 'warning', type: 'custom',
      msg: 'Úhrn nesouhlasí se součtem vyměřovacích základů zaměstnanců vykonávajících rizikové zaměstnání.',
      check: function(ctx) {
        const header = ctx.getHeaderNum('10483');
        if (header === null) return [];
        const sum = ctx.allEmps.reduce((s, e) => s + (getNum(e, '10480') || 0), 0);
        if (Math.abs(header - sum) > 0.5) return [{ fieldCsszId: '10483', message: ctx.rule.msg }];
        return [];
      }},

    // M143: Variabilní symbol format check
    { id: 'M143', scope: 'header', sev: 'error', type: 'custom',
      msg: 'Variabilní symbol není platný.',
      check: function(ctx) {
        const vs = ctx.getHeaderVal('10221');
        if (!vs) return [];
        if (!/^\d{8,10}$/.test(vs))
          return [{ fieldCsszId: '10221', message: ctx.rule.msg }];
        return [];
      }},

    // M144: Překážky zaměstnance <= sjednaný fond
    { id: 'M144', scope: 'emp', sev: 'error', type: 'lte', a: '10471', b: '10260',
      msg: 'Hodnota Překážky na straně zaměstnance nesmí být vyšší než Pracovní doba sjednaná.' },

    // M145: Překážky zaměstnavatele <= sjednaný fond
    { id: 'M145', scope: 'emp', sev: 'error', type: 'lte', a: '10472', b: '10260',
      msg: 'Hodnota Překážky na straně zaměstnavatele nesmí být vyšší než Sjednaný fond pracovní doby.' },

    // M148: Specifická právní skutečnost — platná hodnota
    { id: 'M148', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'Hodnota Specifická právní skutečnost neodpovídá číselníku.',
      check: function(ctx) {
        const typ = readSouhrnField(_xmlDoc, ['souhrn', 'specifickaSkutecnost', 'typ']);
        if (!typ) return [];
        var valid = ['1','2','3','4','5','6','7','8','9','10','11','12'];
        if (!valid.includes(typ))
          return [{ fieldCsszId: '10408', message: ctx.rule.msg }];
        return [];
      }},

    // ── New codelist & inline-enum / regex rules ──
    // Codelist membership (registry already implemented for all four):
    mkMhCodelistRule('M152', '10230', 'CISOB',  'Kód obce'),
    mkMhCodelistRule('M153', '10231', 'C_STAT', 'Kód státu'),
    mkMhCodelistRule('M155', '10239', 'C_DRCI', 'Druh činnosti'),
    mkMhCodelistRule('M302', '10492', 'C_STAT', 'Kód státu zahraniční PO/FO'),
    // M335: Obec — name lookup against CISOB nazev index (case-insensitive).
    //   XML carries <form:obec>Bykoš</form:obec> (the municipality name); CISOB has
    //   `nazev` alongside `kod`. codelists-client.js builds the byNazev Map alongside byKod.
    mkMhCodelistRule('M335', '10229', 'CISOB',  'Obec', { lookupBy: 'nazev' }),

    // Inline enums (codes enumerated in pokyny):
    //   M150: 10214 typ kolektivní smlouvy — allowed 0-5 (pokyny ř. 991-1000).
    //         Field repeats (multi-tag) under souhrn/zamestnavatelUdajeRok/kolektivniSmlouvy/typ;
    //         M150 does not catch all instances (souhrn-rooted, repeating). Covered only
    //         when the value is reachable via ctx.getVal — XSD enforces only string type.
    mkMhInlineEnumRule('M150', '10214', ['0','1','2','3','4','5'], 'Typ kolektivní smlouvy'),
    //   M151: 10220 forma vlastnictví — Eurostat 1-4 (pokyny ř. 1024-1030).
    mkMhInlineEnumRule('M151', '10220', ['1','2','3','4'], 'Forma vlastnictví'),
    //   M158: 10374 důvod uplatnění slevy — A-G (pokyny § 7a, ř. 5510-5530).
    mkMhInlineEnumRule('M158', '10374', ['A','B','C','D','E','F','G'], 'Důvod uplatnění slevy'),
    //   M265: 10440 pořadí dítěte — 1, 2, 3 or N (pokyny ř. 1702-1703); per-instance.
    mkMhInlineEnumRule('M265', '10440', ['1','2','3','N'], 'Pořadí pro určení daňového zvýhodnění',
      { perInstance: true, sectionId: 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic/vyzivovaneDeti/vyzivovaneDite' }),

    // M157: Kód ELDP — structural regex derived from flexibee
    //       PracPomBLImpl.validujKodEldp (lines 1273-1331, helpers 1798-1865):
    //       3-4 chars; prefix = 1 char (typ PP) OR 2 chars `Z[ABC]`;
    //       char after prefix ∈ {D,P,N,R,M,V,+}; last char ∈ {S,+};
    //       if length is 4 the prefix must be 2 (Z[ABC]).
    //       The context dependency of the first char on typPracPom is intentionally
    //       skipped here (the semantic link is already handled by M87).
    mkMhRegexRule('M157', '10240',
      /^(Z[ABC]|[1-9A-Z])[DPNRMV+][S+]$/,
      'Kód ELDP',
      { perInstance: true, sectionId: 'pojisteni/eldpSeznam/eldp' }),

    // M159: Mzdový příspěvek APZ = ANO → musí být vyplněn Nástroj APZ
    { id: 'M159', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Chybí nástroj v rámci APZ.',
      check: function(ctx) {
        var apz = ctx.getVal('10232');
        if (!isTrueValue(apz)) return [];
        if (!ctx.isFilled('10233'))
          return [{ fieldCsszId: '10233', message: ctx.rule.msg }];
        return [];
      }},

    // M154: Nástroj APZ — value enum check.
    //   XSD enforces cislo3Type (1-3 digits). flexibee local codelist
    //   MzdyLokCiselniky.LC_MZD_NASTROJ_APZ has 4 entries (MZD_NASTROJ_APZ_1..4) and
    //   JmhzDataHelper.java:1311-1314 parses Integer from the part after the dot
    //   ("mzdNastrojAPZ.1" → 1). Allowed values: 1-4.
    //   Note: pokyny mention §§ 112/113/106 zákona o zaměstnanosti, but the transmitted
    //   codes are numeric identifiers, not paragraph numbers.
    mkMhInlineEnumRule('M154', '10233', ['1','2','3','4'], 'Nástroj APZ'),

    // M162: VZ základ zaměstnavatele — alespoň nuly
    { id: 'M162', scope: 'header', sev: 'error', type: 'custom',
      msg: 'Je potřeba vyplnit alespoň jednu částku vyměřovacího základu zaměstnavatele nebo nuly.',
      check: function(ctx) {
        const a = ctx.getHeaderVal('10023');
        const b = ctx.getHeaderVal('10025');
        const c = ctx.getHeaderVal('10483');
        if (!a && !b && !c)
          return [{ fieldCsszId: '10023', message: ctx.rule.msg }];
        return [];
      }},

    // M165: ELDP vyloučené dny § 18 = součet dílčích (10366 = 10473+10474+10475)
    { id: 'M165', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Vyloučené dny celkem musí být součtem jednotlivých typů vyloučených dnů.',
      check: function(ctx) {
        const n = ctx.getRepeatCount('pojisteni/eldpSeznam/eldp');
        const errors = [];
        for (let i = 0; i < n; i++) {
          const celkem = ctx.getNum('10366', i);
          if (celkem === null || celkem <= 0) continue;
          const sum = (ctx.getNum('10473', i) || 0) + (ctx.getNum('10474', i) || 0)
                    + (ctx.getNum('10475', i) || 0);
          if (Math.abs(celkem - sum) > 0.5)
            errors.push({ fieldCsszId: '10366', instanceIndex: i, message: ctx.rule.msg });
        }
        return errors;
      }},

    // M166: ELDP odečítané doby = součet dílčích (10375 = 10462+...+10469)
    { id: 'M166', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Odečítané doby musí být rovny sumě dílčích položek.',
      check: function(ctx) {
        const n = ctx.getRepeatCount('pojisteni/eldpSeznam/eldp');
        const errors = [];
        for (let i = 0; i < n; i++) {
          const celkem = ctx.getNum('10375', i);
          if (celkem === null || celkem <= 0) continue;
          const parts = ['10462','10463','10464','10465','10466','10468','10469'];
          const sum = parts.reduce((s, id) => s + (ctx.getNum(id, i) || 0), 0);
          if (Math.abs(celkem - sum) > 0.5)
            errors.push({ fieldCsszId: '10375', instanceIndex: i, message: ctx.rule.msg });
        }
        return errors;
      }},

    // M167: Pojistné zaměstnavatele C = ceil(0.278 * základ C)
    { id: 'M167', scope: 'header', sev: 'error', type: 'pct_eq',
      target: '10484', base: '10483', rate: KONTROLY_CONSTANTS.rates.employerInsuranceC,
      msg: 'Vykázané pojistné neodpovídá vykázanému úhrnu vyměřovacích základů zaměstnanců vykonávajících rizikové zaměstnání.' },

    // M168: Pojistné za zaměstnance tolerance check (≈ 7.1% of total VZ)
    { id: 'M168', scope: 'header', sev: 'error', type: 'custom',
      msg: 'Vykázané pojistné za zaměstnance neodpovídá celkové částce vykázaných úhrnů vyměřovacích základů zaměstnanců.',
      check: function(ctx) {
        const pojistne = ctx.getHeaderNum('10028');
        if (pojistne === null) return [];
        const a = ctx.getHeaderNum('10023') || 0;
        const b = ctx.getHeaderNum('10025') || 0;
        const c = ctx.getHeaderNum('10483') || 0;
        const total = a + b + c;
        if (total === 0 && pojistne === 0) return [];
        const expected = KONTROLY_CONSTANTS.rates.employeeInsurance * total;
        const relErr = expected > 0 ? Math.abs(1 - pojistne / expected) : 1;
        const absErr = Math.abs(expected - pojistne);
        if (relErr > KONTROLY_CONSTANTS.tolerances.relativeError && absErr > KONTROLY_CONSTANTS.tolerances.absoluteAmount)
          return [{ fieldCsszId: '10028', message: ctx.rule.msg }];
        if (pojistne > KONTROLY_CONSTANTS.tolerances.employeeInsuranceUpperRate * total + KONTROLY_CONSTANTS.tolerances.roundedHalf)
          return [{ fieldCsszId: '10028', message: ctx.rule.msg }];
        return [];
      }},

    // M170: Úhrn slev zaměstnanců tolerance check (≈ 6.5% of VZ)
    { id: 'M170', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'Úhrn slev na pojistném zaměstnanců neodpovídá vykázanému úhrnu vyměřovacích základů těchto zaměstnanců.',
      check: function(ctx) {
        const uhrnSlev = ctx.getHeaderNum('10487');
        const uhrnVZ = ctx.getHeaderNum('10486');
        if (uhrnSlev === null || uhrnVZ === null) return [];
        if (uhrnVZ === 0 && uhrnSlev === 0) return [];
        var expected = KONTROLY_CONSTANTS.rates.employeeDiscount * uhrnVZ;
        var relErr = expected > 0 ? Math.abs(1 - uhrnSlev / expected) : 1;
        var absErr = Math.abs(expected - uhrnSlev);
        if (relErr > KONTROLY_CONSTANTS.tolerances.relativeError && absErr > KONTROLY_CONSTANTS.tolerances.absoluteAmount)
          return [{ fieldCsszId: '10487', message: ctx.rule.msg }];
        if (uhrnSlev > KONTROLY_CONSTANTS.tolerances.employeeDiscountUpperRate * uhrnVZ + KONTROLY_CONSTANTS.tolerances.roundedHalf)
          return [{ fieldCsszId: '10487', message: ctx.rule.msg }];
        return [];
      }},

    // M188: Sleva na pojistném zaměstnavatele max 1× per zaměstnanec
    { id: 'M188', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'Slevu na pojistném zaměstnavatele může zaměstnavatel uplatnit za zaměstnance pouze z jednoho zaměstnání.',
      check: function(ctx) {
        const slevaByIk = {};
        ctx.allEmps.forEach(e => {
          const sleva = getVal(e, '10372');
          if (!isTrueValue(sleva)) return;
          const ik = getVal(e, '10051');
          if (!ik) return;
          slevaByIk[ik] = (slevaByIk[ik] || 0) + 1;
        });
        const errors = [];
        Object.entries(slevaByIk).forEach(function(entry) {
          if (entry[1] > 1)
            errors.push({ fieldCsszId: '10372', message: ctx.rule.msg });
        });
        return errors;
      }},

    // M190: Storno jen 1.-20. následujícího měsíce
    { id: 'M190', scope: 'header', sev: 'error', type: 'custom',
      msg: 'Zaměstnavatel nesmí stornovat řádné podání mimo stanovenou lhůtu.',
      check: function(ctx) {
        const typ = ctx.getHeaderVal('10007');
        if (typ !== 'S') return []; // only storno
        const mesic = ctx.getHeaderNum('10010');
        const rok = ctx.getHeaderNum('10011');
        if (mesic === null || rok === null) return [];
        var td = todayDate();
        var nextM = mesic + 1, nextY = rok;
        if (nextM > 12) { nextM = 1; nextY++; }
        if (td.y !== nextY || td.m !== nextM || td.d > 20)
          return [{ fieldCsszId: '10007', message: ctx.rule.msg }];
        return [];
      }},

    // M191: Roční atributy jen v lednu/únoru/březnu
    { id: 'M191', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Atribut může být uveden jen v lednovém, únorovém nebo březnovém podání.',
      check: function(ctx) {
        var mesic = ctx.getHeaderNum('10010');
        if (mesic !== null && mesic >= 1 && mesic <= 3) return [];
        var roFields = ['10036','10037','10320','10321','10322','10323','10420','10421','10422',
          '10423','10424','10425','10426','10430','10454','10455',
          '10441','10442','10443','10444','10445','10446','10447','10448','10449','10450','10451'];
        for (var j = 0; j < roFields.length; j++) {
          if (ctx.isFilled(roFields[j]))
            return [{ fieldCsszId: roFields[j], message: ctx.rule.msg }];
        }
        return [];
      }},

    // M192: Žádost o roční zúčtování jen v lednu/únoru
    { id: 'M192', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Atribut Zaměstnanec požádal o provedení ročního zúčtování může být uveden jen v lednovém nebo únorovém podání.',
      check: function(ctx) {
        var mesic = ctx.getHeaderNum('10010');
        if (mesic !== null && mesic >= 1 && mesic <= 2) return [];
        if (ctx.isFilled('10319'))
          return [{ fieldCsszId: '10319', message: ctx.rule.msg }];
        return [];
      }},

    // M193: Roční úhrny jen v lednu
    { id: 'M193', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Atribut může být uveden jen v lednovém podání.',
      check: function(ctx) {
        var mesic = ctx.getHeaderNum('10010');
        if (mesic === 1) return [];
        var janFields = ['10313','10317','10316','10318','10311','10312'];
        for (var j = 0; j < janFields.length; j++) {
          if (ctx.isFilled(janFields[j]))
            return [{ fieldCsszId: janFields[j], message: ctx.rule.msg }];
        }
        return [];
      }},

    // M194: Prosincové atributy jen v prosinci
    { id: 'M194', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'Atribut může být uveden jen v prosincovém podání.',
      check: function(ctx) {
        var mesic = ctx.getHeaderNum('10010');
        if (mesic === 12) return [];
        // Fields 10452, 10038, 10039, 10220, 10214 live under souhrn/zamestnavatelUdajeRok
        var souhrn = findChildEl(_xmlDoc ? _xmlDoc.documentElement : null, 'souhrn');
        if (!souhrn) return [];
        var zur = findChildEl(souhrn, 'zamestnavatelUdajeRok');
        if (!zur) return [];
        // Check individual attrs: 10220 (formaVlastnictvi), 10038/10039/10452 (zamestnavaniOzp), 10214 (typKolektSmlouvy)
        var found = [];
        if (findChildEl(zur, 'formaVlastnictvi')) found.push('10220');
        var ozp = findChildEl(zur, 'zamestnavaniOzp');
        if (ozp) {
          if (findChildEl(ozp, 'zecPocetPrepRok')) found.push('10038');
          if (findChildEl(ozp, 'zecPocetPrepOzpRok')) found.push('10039');
          if (findChildEl(ozp, 'podilZamZtp')) found.push('10452');
        }
        if (findChildEl(zur, 'kolektivniSmlouvy')) found.push('10214');
        if (found.length > 0)
          return [{ fieldCsszId: found[0], message: ctx.rule.msg }];
        return [];
      }},

    // ═══ Phase 4: Controls 201-277 ═══
    // Skipped: M211 (structural storno remnant check),
    //          M253 (duplicate of M251 for single submission)

    // M201: Datum úhrady mzdy <= datum vyplnění podání
    { id: 'M201', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Datum úhrady musí být menší rovno datu vyplnění.',
      check: function(ctx) {
        var uhrada = ctx.getVal('10347');
        var vyplneni = ctx.getHeaderVal('10005');
        if (!uhrada || !vyplneni) return [];
        var dp1 = parseDate(uhrada);
        var dp2 = parseDate(vyplneni);
        if (!dp1 || !dp2) return [];
        if (compareDates(dp1, dp2) > 0) return [{ fieldCsszId: '10347', message: ctx.rule.msg }];
        return [];
      }},

    // M204: Storno součásti individualizované části jen 1.-20. následujícího měsíce
    { id: 'M204', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Zaměstnavatel nesmí stornovat součásti individualizované části jindy než v intervalu od 1. do 20. dne v měsíci, který bezprostředně následuje po měsíci, za který bylo učiněno podání.',
      check: function(ctx) {
        var typ = ctx.getVal('10016');
        if (typ !== 'S') return [];
        var mesic = ctx.getHeaderNum('10010');
        var rok = ctx.getHeaderNum('10011');
        if (mesic === null || rok === null) return [];
        var td = todayDate();
        var nextM = mesic + 1, nextY = rok;
        if (nextM > 12) { nextM = 1; nextY++; }
        if (td.y !== nextY || td.m !== nextM || td.d > 20)
          return [{ fieldCsszId: '10016', message: ctx.rule.msg }];
        return [];
      }},

    // M207: Sum VZ (10477) where sleva zaměstnavatele (10372)=ANO = úhrn VZ slev (10031)
    { id: 'M207', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'Vykázaný úhrn vyměřovacích základů zaměstnanců, za které zaměstnavatel uplatňuje slevu na pojistném zaměstnavatele, neodpovídá součtu vyměřovacích základů těchto zaměstnanců.',
      check: function(ctx) {
        var uhrn = ctx.getHeaderNum('10031');
        if (uhrn === null) return [];
        var sum = 0;
        ctx.allEmps.forEach(function(e) {
          var sleva = getVal(e, '10372');
          if (isTrueValue(sleva)) sum += (getNum(e, '10477') || 0);
        });
        if (Math.abs(uhrn - sum) > 0.5)
          return [{ fieldCsszId: '10031', message: ctx.rule.msg }];
        return [];
      }},

    // M208: If sleva zaměstnance (10490)=ANO, výše (10491) filled; else empty
    { id: 'M208', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Výše slevy na pojistném zaměstnance musí být vyplněna jen v případě, že je v poli Sleva na pojistném zaměstnance uvedeno ANO.',
      check: function(ctx) {
        var sleva = ctx.getVal('10490');
        var vyse = ctx.isFilled('10491');
        if (isTrueValue(sleva) && !vyse)
          return [{ fieldCsszId: '10491', message: ctx.rule.msg }];
        if (!isTrueValue(sleva) && vyse)
          return [{ fieldCsszId: '10491', message: ctx.rule.msg }];
        return [];
      }},

    // M209: Sum slev zaměstnanců (10491) = úhrn slev (10487)
    { id: 'M209', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'Vykázaný úhrn slev na pojistném zaměstnanců neodpovídá součtu slev na pojistném těchto zaměstnanců.',
      check: function(ctx) {
        var uhrn = ctx.getHeaderNum('10487');
        if (uhrn === null) return [];
        var sum = 0;
        ctx.allEmps.forEach(function(e) { sum += (getNum(e, '10491') || 0); });
        if (Math.abs(uhrn - sum) > 0.5)
          return [{ fieldCsszId: '10487', message: ctx.rule.msg }];
        return [];
      }},

    // M213: 10486 = sum(10477) where sleva zaměstnance (10490)=ANO
    { id: 'M213', scope: 'cross', sev: 'warning', type: 'custom',
      msg: 'Vykázaný úhrn vyměřovacích základů zaměstnanců, kteří mají nárok na slevu na pojistném zaměstnance, neodpovídá součtu vyměřovacích základů těchto zaměstnanců.',
      check: function(ctx) {
        var uhrn = ctx.getHeaderNum('10486');
        if (uhrn === null) return [];
        var sum = 0;
        ctx.allEmps.forEach(function(e) {
          var sleva = getVal(e, '10490');
          if (isTrueValue(sleva)) sum += (getNum(e, '10477') || 0);
        });
        if (Math.abs(uhrn - sum) > 0.5)
          return [{ fieldCsszId: '10486', message: ctx.rule.msg }];
        return [];
      }},

    // M214: Child age 26 check — roční zvýhodnění
    { id: 'M214', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Věk dítěte již neumožňuje uplatnění daňového zvýhodnění.',
      check: function(ctx) {
        var sec = 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti/vyzivovaneDeti/vyzivovaneDite';
        var n = ctx.getRepeatCount(sec);
        var rok = ctx.getHeaderNum('10011');
        if (!rok || n === 0) return [];
        var errors = [];
        for (var i = 0; i < n; i++) {
          var poradi = ctx.getVal('10451', i);
          if (!poradi || /^[N0]+$/.test(poradi)) continue;
          var birthDate = _parseBirth(ctx.getVal('10448', i), ctx.getVal('10449', i));
          if (!birthDate) continue;
          var age26date = makeDate(birthDate.y + 26, birthDate.m, birthDate.d);
          if (compareDates(age26date, makeDate(rok, 1, 1)) <= 0)
            errors.push({ fieldCsszId: '10451', instanceIndex: i, message: ctx.rule.msg });
        }
        return errors;
      }},

    // M215: Child age 26 check — měsíční zvýhodnění
    { id: 'M215', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Věk dítěte již neumožňuje uplatnění daňového zvýhodnění.',
      check: function(ctx) {
        var sec = 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic/vyzivovaneDeti/vyzivovaneDite';
        var n = ctx.getRepeatCount(sec);
        var mesic = ctx.getHeaderNum('10010');
        var rok = ctx.getHeaderNum('10011');
        if (!mesic || !rok || n === 0) return [];
        var firstOfMonth = makeDate(rok, mesic, 1);
        var errors = [];
        for (var i = 0; i < n; i++) {
          var poradi = ctx.getVal('10440', i);
          if (!poradi || poradi === 'N') continue;
          var birthDate = _parseBirth(ctx.getVal('10437', i), ctx.getVal('10438', i));
          if (!birthDate) continue;
          var age26date = makeDate(birthDate.y + 26, birthDate.m, birthDate.d);
          if (compareDates(age26date, firstOfMonth) <= 0)
            errors.push({ fieldCsszId: '10440', instanceIndex: i, message: ctx.rule.msg });
        }
        return errors;
      }},

    // M216: VZ celkem (10477) = VZ A (10478) + VZ B (10479) + VZ C (10480)
    // Skip excluded datové scénáře (K-S, M, 1-9 with 10502) per CSV
    { id: 'M216', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Částka vyměřovacího základu zaměstnance, ze které je placeno pojistné, neodpovídá součtu dílčích částek vyměřovacího základu.',
      check: function(ctx) {
        if (isCinnostKSOrPestoun(ctx.emp)) return [];
        var celkem = ctx.getNum('10477');
        if (celkem === null) return [];
        var sum = (ctx.getNum('10478') || 0) + (ctx.getNum('10479') || 0) + (ctx.getNum('10480') || 0);
        if (Math.abs(celkem - sum) > 0.5)
          return [{ fieldCsszId: '10477', message: ctx.rule.msg }];
        return [];
      }},

    // M232: Řádné hlášení musí obsahovat souhrn, PVPOJ a alespoň 1 formulář
    { id: 'M232', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'Struktura řádného měsíčního hlášení neodpovídá specifikaci.',
      check: function(ctx) {
        var typ = ctx.getHeaderVal('10007');
        if (typ !== 'R') return [];
        var poradi = ctx.getHeaderNum('10002');
        if (poradi === 1) {
          var root = _xmlDoc ? _xmlDoc.documentElement : null;
          if (!root) return [];
          var hasSouhrn = !!findChildEl(root, 'souhrn');
          var hasPvpoj = !!findChildEl(root, 'PVPOJ');
          var hasIndiv = ctx.allEmps.length > 0;
          if (!hasSouhrn || !hasPvpoj || !hasIndiv)
            return [{ fieldCsszId: '10007', message: ctx.rule.msg }];
        } else if (poradi > 1) {
          var root2 = _xmlDoc ? _xmlDoc.documentElement : null;
          if (!root2) return [];
          if (findChildEl(root2, 'souhrn') || findChildEl(root2, 'PVPOJ'))
            return [{ fieldCsszId: '10002', message: 'Další dílčí podání musí obsahovat jen individualizované formuláře.' }];
        }
        return [];
      }},

    // M233: Opravné hlášení musí obsahovat alespoň jednu část
    { id: 'M233', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'Struktura opravného měsíčního hlášení neodpovídá specifikaci.',
      check: function(ctx) {
        var typ = ctx.getHeaderVal('10007');
        if (typ !== 'O') return [];
        var poradi = ctx.getHeaderNum('10002');
        if (poradi === 1) {
          var root = _xmlDoc ? _xmlDoc.documentElement : null;
          if (!root) return [];
          var hasSouhrn = !!findChildEl(root, 'souhrn');
          var hasPvpoj = !!findChildEl(root, 'PVPOJ');
          var hasIndiv = ctx.allEmps.length > 0;
          if (!hasSouhrn && !hasPvpoj && !hasIndiv)
            return [{ fieldCsszId: '10007', message: ctx.rule.msg }];
        } else if (poradi > 1) {
          var root2 = _xmlDoc ? _xmlDoc.documentElement : null;
          if (!root2) return [];
          if (findChildEl(root2, 'souhrn') || findChildEl(root2, 'PVPOJ'))
            return [{ fieldCsszId: '10002', message: 'Další dílčí podání musí obsahovat jen individualizované formuláře.' }];
        }
        return [];
      }},

    // M235: Skutečný počet formulářů musí odpovídat metaatributu 10015
    { id: 'M235', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'Neodpovídá uvedený počet formulářů v balíku skute\u010Dnému po\u010Dtu formulářů.',
      check: function(ctx) {
        var declared = ctx.getHeaderNum('10015');
        if (declared === null) return [];
        var typ = ctx.getHeaderVal('10007');
        var poradi = ctx.getHeaderNum('10002');
        var root = _xmlDoc ? _xmlDoc.documentElement : null;
        if (!root) return [];
        var indivCount = ctx.allEmps.length;
        var expected;
        if (poradi === 1) {
          var hasSouhrn = !!findChildEl(root, 'souhrn') ? 1 : 0;
          var hasPvpoj = !!findChildEl(root, 'PVPOJ') ? 1 : 0;
          if (typ === 'R') {
            expected = indivCount + hasSouhrn + hasPvpoj;
          } else {
            expected = indivCount + hasSouhrn + hasPvpoj;
          }
        } else {
          expected = indivCount;
        }
        if (declared !== expected)
          return [{ fieldCsszId: '10015', message: ctx.rule.msg }];
        return [];
      }},

    // M236: Řádné hlášení nesmí obsahovat opravné/storno formuláře
    { id: 'M236', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'Řádné měsíční hlášení může obsahovat jen formuláře typu řádný.',
      check: function(ctx) {
        var typ = ctx.getHeaderVal('10007');
        if (typ !== 'R') return [];
        var errors = [];
        ctx.allEmps.forEach(function(e) {
          var typForm = getVal(e, '10016');
          if (typForm && typForm !== 'R')
            errors.push({ fieldCsszId: '10016', message: ctx.rule.msg });
        });
        return errors;
      }},

    // M237: Storno formulář v opravném hlášení obsahuje pouze hlavičku
    { id: 'M237', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'Individualizované formuláře typu storno musí obsahovat pouze hlavičku.',
      check: function(ctx) {
        var typ = ctx.getHeaderVal('10007');
        if (typ !== 'O') return [];
        var errors = [];
        ctx.allEmps.forEach(function(e) {
          var typForm = getVal(e, '10016');
          if (typForm !== 'S') return;
          if (!e._formRoot) return;
          var formRoot = e._formRoot;
          var formVariants = ['bezPriznaku', 'pestoun', 'cinnostKS', 'vezen',
            'mezinarodniPronajemSily', 'jinyPrijem', 'ozpTpp', 'odlozenyPrijem'];
          for (var vi = 0; vi < formVariants.length; vi++) {
            if (findChildEl(formRoot.parentElement || formRoot, formVariants[vi]))
              errors.push({ fieldCsszId: '10016', message: ctx.rule.msg });
          }
        });
        return errors;
      }},

    // M240: Povinné metaatributy pro řádné/opravné podání
    { id: 'M240', scope: 'header', sev: 'error', type: 'custom',
      msg: 'Pro řádné/opravné podání je vyplnění metadat povinné.',
      check: function(ctx) {
        var typ = ctx.getHeaderVal('10007');
        if (typ !== 'R' && typ !== 'O') return [];
        var required = ['10002', '10003', '10015', '10488'];
        var errors = [];
        for (var i = 0; i < required.length; i++) {
          var v = ctx.getHeaderVal(required[i]);
          if (!v) errors.push({ fieldCsszId: required[i], message: ctx.rule.msg });
        }
        return errors;
      }},

    // M229: Collision in child pořadí (měsíční)
    { id: 'M229', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Uvedenému pořadí dítěte odpovídá stejné pořadí u jiného dítěte.',
      check: function(ctx) {
        var sec = 'souhrnDataZec/prohlaseniPoplatnikaDane/zvyhodneniDetiMesic/vyzivovaneDeti/vyzivovaneDite';
        var n = ctx.getRepeatCount(sec);
        if (n < 2) return [];
        var seen = {};
        for (var i = 0; i < n; i++) {
          var p = ctx.getVal('10440', i);
          if (!p || p === 'N') continue;
          // poradi '3' means "3rd or subsequent child" and can legitimately repeat
          if (p === '3') continue;
          if (seen[p]) return [{ fieldCsszId: '10440', instanceIndex: i, message: ctx.rule.msg }];
          seen[p] = true;
        }
        return [];
      }},

    // M230: Collision in child pořadí (roční) — same pořadí string
    { id: 'M230', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Pořadí dítěte v měsíci koliduje s totožným nastavením pro jiné dítě.',
      check: function(ctx) {
        var sec = 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti/vyzivovaneDeti/vyzivovaneDite';
        var n = ctx.getRepeatCount(sec);
        if (n < 2) return [];
        var arr = [];
        for (var i = 0; i < n; i++) arr.push(ctx.getVal('10451', i) || '');
        for (var a = 0; a < n; a++) {
          if (!arr[a] || /^[N0]+$/.test(arr[a])) continue;
          for (var b = a + 1; b < n; b++) {
            if (!arr[b] || /^[N0]+$/.test(arr[b])) continue;
            // poradi '3' means "3rd or subsequent child" — identical strings consisting
            // only of '3', 'N', and '0' are valid (multiple 3rd+ children)
            if (arr[a] === arr[b] && !/^[N03]+$/.test(arr[a]))
              return [{ fieldCsszId: '10451', instanceIndex: b, message: ctx.rule.msg }];
          }
        }
        return [];
      }},

    // M242: Prohlášení=ANO + rezident CZ → srážková daň fields empty
    { id: 'M242', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Pokud je učiněno prohlášení poplatníka k dani, pak nelze uplatnit srážkovou daň podle zvláštní sazby daně.',
      check: function(ctx) {
        var p = ctx.getVal('10419');
        if (!isTrueValue(p)) return [];
        var stat = ctx.getVal('10068');
        if (stat && stat !== 'CZ') return [];
        var fields = ['10307','10416','10309','10310'];
        for (var j = 0; j < fields.length; j++) {
          if (ctx.isFilled(fields[j]))
            return [{ fieldCsszId: fields[j], message: ctx.rule.msg }];
        }
        return [];
      }},

    // M243: Prohlášení=ANO + nerezident → restricted tax fields
    { id: 'M243', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'U daňového nerezidenta, který podepsal prohlášení poplatníka, lze uplatnit pouze základní slevu na poplatníka a nelze uplatnit zvláštní sazbu daně.',
      check: function(ctx) {
        var p = ctx.getVal('10419');
        if (!isTrueValue(p)) return [];
        var stat = ctx.getVal('10068');
        if (!stat || stat === 'CZ') return [];
        var fields = ['10300','10301','10302','10303','10453','10431','10432',
          '10433','10434','10435','10436','10437','10438','10439','10440',
          '10304','10306','10307','10309','10310'];
        for (var j = 0; j < fields.length; j++) {
          if (ctx.isFilled(fields[j]))
            return [{ fieldCsszId: fields[j], message: ctx.rule.msg }];
        }
        return [];
      }},

    // M244: Prohlášení=NE → no daňové slevy/zvýhodnění
    { id: 'M244', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Nebylo-li učiněno prohlášení poplatníka, nelze vyplnit atribut(y) související s daňovými slevami a daňovým zvýhodněním.',
      check: function(ctx) {
        var p = ctx.getVal('10419');
        if (!isFalseValue(p)) return [];
        var fields = ['10299','10300','10301','10302','10303','10453','10431',
          '10432','10433','10434','10435','10436','10437','10438','10439',
          '10440','10304','10306'];
        for (var j = 0; j < fields.length; j++) {
          if (ctx.isFilled(fields[j]))
            return [{ fieldCsszId: fields[j], message: ctx.rule.msg }];
        }
        return [];
      }},

    // M245: Prohlášení=NE + income below threshold (záloha territory does NOT apply) → no zálohová/slevy fields
    // Aggregates 10535 across all forms of the same employee at the employer:
    //   1a) sum of DPP forms (druhCinnosti = "T".."Z" — codes T,U,V,W,X,Y,Z) < 12000 AND
    //   1b) sum of non-DPP forms (druhCinnosti not a DPP code) < 4500
    // Then 10297..10306 (zálohová/slevy) must be empty.
    // Note: CSV spec writes the DPP codelist range as "T-ZC" (i.e. "T" až "ZC" → "T" through "Z");
    // the actual XML druhCinnosti is a single letter from T–Z (XSD pattern forbids the hyphen).
    { id: 'M245', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Nebylo-li učiněno prohlášení poplatníka a příjem podléhá srážkové dani, nelze vyplnit atribut(y) související se zálohovou daní.',
      check: function(ctx) {
        var p = ctx.getVal('10419');
        if (!isFalseValue(p)) return [];

										 
													   
										   
        var fields = ['10297','10298','10299','10300','10301','10302','10303','10453',
          '10431','10432','10433','10434','10435','10436','10437','10438','10439',
          '10440','10304','10305','10306'];
        var firstFilled = null;
        for (var k = 0; k < fields.length; k++) {
          if (ctx.isFilled(fields[k])) { firstFilled = fields[k]; break; }
																	   
        }
        if (firstFilled === null) return [];

        function personKey(e) {
          var ik = getVal(e, '10051');
          if (ik) return 'ik:' + ik;
          var pn = getVal(e, '10053');
          var jm = getVal(e, '10054');
          var dn = getVal(e, '10056');
          if (pn || jm || dn) return 'name:' + pn + '|' + jm + '|' + dn;
          return null;
        }

        var key = personKey(ctx.emp);
        if (!key) return [];

        var dppSum = 0;
        var nonDppSum = 0;
        for (var i = 0; i < ctx.allEmps.length; i++) {
          var other = ctx.allEmps[i];
          if (personKey(other) !== key) continue;
          var z = getNum(other, '10535');
          if (z === null) continue;
          var dc = getVal(other, '10239');
          if (isDppCode(dc)) dppSum += z;
          else nonDppSum += z;
        }

        if (dppSum >= 12000) return [];
        if (nonDppSum >= 4500) return [];

        return [{ fieldCsszId: firstFilled, message: ctx.rule.msg }];
      }},

    // M248: Primární PPV=NE → souhrnná data fields empty
    { id: 'M248', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Atributy souhrnné vrstvy za zaměstnance mohou být vyplněny pouze u primárního pracovněprávního vztahu.',
      check: function(ctx) {
        var prim = ctx.getVal('10495');
        if (!isFalseValue(prim)) return [];
        var fields = [
          '10286','10416','10289','10417','10292','10293','10294','10295','10296',
          '10418','10419','10297','10298','10299','10300','10301','10302','10303',
          '10304','10305','10306','10307','10308','10309','10310',
          '10453','10431','10432','10433','10434','10435','10436','10437','10438','10439','10440',
          '10344','10116','10347','10348','10349','10350','10351','10352','10353',
          '10482','10371',
          '10311','10312','10313','10316','10317','10318','10319','10320',
          '10321','10322','10323','10420','10454',
          '10421','10422','10423','10424','10425','10426','10430','10539','10540','10541','10542',
          '10455','10441','10442','10443','10444','10445',
          '10446','10447','10448','10449','10450','10451'
        ];
        for (var j = 0; j < fields.length; j++) {
          if (ctx.isFilled(fields[j]))
            return [{ fieldCsszId: fields[j], message: ctx.rule.msg }];
        }
        return [];
      }},

    // M251: IDPPV (10228) must be unique across all employees
    { id: 'M251', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'ID pracovněprávního vztahu musí být v podání unikátní.',
      check: function(ctx) {
        var seen = {};
        var errors = [];
        ctx.allEmps.forEach(function(e) {
          if (getVariantMetaVal(e, '10548')) return; // skip odložený příjem
          var id = getVal(e, '10228');
          if (!id) return;
          if (seen[id]) errors.push({ fieldCsszId: '10228', message: ctx.rule.msg });
          else seen[id] = true;
        });
        return errors;
      }},

    // M255: At least one primary PPV (10495=ANO) per OIČ
    { id: 'M255', scope: 'cross', sev: 'warning', type: 'custom',
      msg: 'Neexistuje žádné primární PPV za OIČ v rámci podání.',
      check: function(ctx) {
        var byOic = {};
        ctx.allEmps.forEach(function(e) {
          var oic = getVal(e, '10051');
          if (!oic) return;
          if (!byOic[oic]) byOic[oic] = false;
          var prim = getRowHeaderVal(e, '10495');
          if (isTrueValue(prim)) byOic[oic] = true;
        });
        var errors = [];
        Object.keys(byOic).forEach(function(oic) {
          if (!byOic[oic]) errors.push({ fieldCsszId: '10495', message: ctx.rule.msg });
        });
        return errors;
      }},

    // M258: If srážky provedeny (10349)=ANO, at least one type specified
    { id: 'M258', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Pokud jsou evidovány srážky ze mzdy nebo platu, pak musí být uvedena hodnota alespoň jednoho z atributů srážek.',
      check: function(ctx) {
        var s = ctx.getVal('10349');
        if (!isTrueValue(s)) return [];
        if (!ctx.isFilled('10350') && !ctx.isFilled('10351') && !ctx.isFilled('10352') && !ctx.isFilled('10353'))
          return [{ fieldCsszId: '10349', message: ctx.rule.msg }];
        return [];
      }},

    // M259: If datum expozice NPE (10272) filled, then 10270 or 10271 needed
    { id: 'M259', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Pokud je uveden Datum dosažení expozice NPE, pak musí být uveden alespoň jeden atribut počtu odpracovaných směn.',
      check: function(ctx) {
        if (!ctx.isFilled('10272')) return [];
        if (!ctx.isFilled('10270') && !ctx.isFilled('10271'))
          return [{ fieldCsszId: '10272', message: ctx.rule.msg }];
        return [];
      }},

    // M260: Max one primary PPV (10495=ANO) per OIČ
    { id: 'M260', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'Existuje více než jedno primární PPV za OIČ v rámci podání.',
      check: function(ctx) {
        var countByOic = {};
        ctx.allEmps.forEach(function(e) {
          var prim = getRowHeaderVal(e, '10495');
          if (!isTrueValue(prim)) return;
          var oic = getVal(e, '10051');
          if (!oic) return;
          countByOic[oic] = (countByOic[oic] || 0) + 1;
        });
        var errors = [];
        Object.keys(countByOic).forEach(function(oic) {
          if (countByOic[oic] > 1) errors.push({ fieldCsszId: '10495', message: ctx.rule.msg });
        });
        return errors;
      }},

    // M267: Při nulové Mzdě za práci zúčtovaná (10328) se nevyplňují podřazené atributy
    { id: 'M267', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Při nulové mzdě zúčtované nesmí být vyplněny složky mzdy.',
      check: function(ctx) {
        var mzda = ctx.getNum('10328');
        if (mzda !== 0) return [];
        var sub = ['10329', '10330', '10331', '10332', '10333', '10334', '10335', '10336'];
        var errors = [];
        for (var i = 0; i < sub.length; i++) {
          if (ctx.isFilled(sub[i]))
            errors.push({ fieldCsszId: sub[i], message: ctx.rule.msg });
        }
        return errors;
      }},

    // M269: 10544 = sum(10477) where sleva OvoZel (10546)=ANO
    { id: 'M269', scope: 'cross', sev: 'warning', type: 'custom',
      msg: 'Vykázaný úhrn vyměřovacích základů zaměstnanců se slevou v ovocnářství a při pěstování zeleniny neodpovídá součtu vyměřovacích základů těchto zaměstnanců.',
      check: function(ctx) {
        var uhrn = ctx.getHeaderNum('10544');
        if (uhrn === null) return [];
        var sum = 0;
        ctx.allEmps.forEach(function(e) {
          var sleva = getVal(e, '10546');
          if (isTrueValue(sleva)) sum += (getNum(e, '10477') || 0);
        });
        if (Math.abs(uhrn - sum) > 0.5)
          return [{ fieldCsszId: '10544', message: ctx.rule.msg }];
        return [];
      }},

    // M270: Tolerance check OvoZel: 10545 ≈ 7.1% of 10544
    { id: 'M270', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'Úhrn slev na pojistném zaměstnanců v ovocnářství neodpovídá vykázanému úhrnu vyměřovacích základů těchto zaměstnanců.',
      check: function(ctx) {
        var uhrnSlev = ctx.getHeaderNum('10545');
        var uhrnVZ = ctx.getHeaderNum('10544');
        if (uhrnSlev === null || uhrnVZ === null) return [];
        if (uhrnVZ === 0 && uhrnSlev === 0) return [];
        var expected = KONTROLY_CONSTANTS.rates.employeeInsurance * uhrnVZ;
        var relErr = expected > 0 ? Math.abs(1 - uhrnSlev / expected) : 1;
        var absErr = Math.abs(expected - uhrnSlev);
        if (relErr > KONTROLY_CONSTANTS.tolerances.relativeError && absErr > KONTROLY_CONSTANTS.tolerances.absoluteAmount)
          return [{ fieldCsszId: '10545', message: ctx.rule.msg }];
        if (uhrnSlev > KONTROLY_CONSTANTS.tolerances.employeeInsuranceUpperRate * uhrnVZ + KONTROLY_CONSTANTS.tolerances.roundedHalf)
          return [{ fieldCsszId: '10545', message: ctx.rule.msg }];
        return [];
      }},

    // M271: VZ > 48500 → OvoZel sleva forbidden
    { id: 'M271', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Slevu nelze uplatnit, protože částka vyměřovacího základu zaměstnance překračuje limit dle § 23b odst. 4 ZPSZ.',
      check: function(ctx) {
        var vz = ctx.getNum('10477');
        if (vz === null || vz <= KONTROLY_CONSTANTS.limits.ovozelVzMax) return [];
        var sleva = ctx.getVal('10546');
        if (isTrueValue(sleva))
          return [{ fieldCsszId: '10546', message: ctx.rule.msg }];
        return [];
      }},

    // M272: If OvoZel sleva (10546)=ANO, výše (10547) filled; else empty
    { id: 'M272', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Výše slevy na pojistném zaměstnance (ovocnářství) musí být vyplněna jen v případě, že je sleva uvedena jako ANO.',
      check: function(ctx) {
        var sleva = ctx.getVal('10546');
        var vyse = ctx.isFilled('10547');
        if (isTrueValue(sleva) && !vyse)
          return [{ fieldCsszId: '10547', message: ctx.rule.msg }];
        if (!isTrueValue(sleva) && vyse)
          return [{ fieldCsszId: '10547', message: ctx.rule.msg }];
        return [];
      }},

    // M273: If OvoZel sleva=ANO, výše (10547) = sociální pojištění (10370)
    { id: 'M273', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Atribut Výše slevy na pojistném zaměstnance (ovocnářství) neodpovídá atributu Sociální pojištění.',
      check: function(ctx) {
        var sleva = ctx.getVal('10546');
        if (!isTrueValue(sleva)) return [];
        var vyse = ctx.getNum('10547');
        var soc = ctx.getNum('10370');
        if (vyse === null || soc === null) return [];
        if (Math.abs(vyse - soc) > 0.5)
          return [{ fieldCsszId: '10547', message: ctx.rule.msg }];
        return [];
      }},

    // M275: Can't have both employee slevy (10490 + 10546) = ANO
    { id: 'M275', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Témuž zaměstnanci nelze poskytnout slevu zaměstnance pro pracující důchodce i slevu pro zaměstnance v ovocnářství a při pěstování zeleniny.',
      check: function(ctx) {
        var s1 = ctx.getVal('10490');
        var s2 = ctx.getVal('10546');
        if (isTrueValue(s1) && isTrueValue(s2))
          return [{ fieldCsszId: '10546', message: ctx.rule.msg }];
        return [];
      }},

    // M276: Počet měsíců uplatnění slevy in [1,12]
    { id: 'M276', scope: 'emp', sev: 'error', type: 'range', field: '10426', min: 1, max: 12,
      msg: 'Chybná hodnota v počtu měsíců uplatnění slevy.' },

    // M277: Must have either RČ (10542) or datum narození (10541) for child
    { id: 'M277', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Chybí rodné číslo nebo datum narození dítěte v rámci uplatnění slevy podle § 35bb ZDP.',
      check: function(ctx) {
        var sec = 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti/vyzivovaneDeti/vyzivovaneDite';
        var n = ctx.getRepeatCount(sec);
        var errors = [];
        for (var i = 0; i < n; i++) {
          if (!ctx.isFilled('10541', i) && !ctx.isFilled('10542', i))
            errors.push({ fieldCsszId: '10541', instanceIndex: i, message: ctx.rule.msg });
        }
        return errors;
      }},

    // ═══ Phase 5: Controls 278-342 ═══
    // Skipped: M156 (10274 Kategorizace rizika — pokyny do not enumerate codes; max 3 chars),
    //          M336/M337/M339/M340 (require PPV registry),
    //          M341/M342 (XSD handles required fields & data types)
    // Implemented (this PR): M154 (10233 enum 1-4), M331 (10548 enum 1-4), M335 (10229 CISOB by name).

    // M292: Kontrola věku dítěte pro uplatnění — měsíční kontrola po celý rok
    { id: 'M292', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Věk dítěte neodpovídá podmínkám pro uplatnění daňového zvýhodnění v daném měsíci.',
      check: function(ctx) {
        var rok = ctx.getHeaderNum('10011');
        if (!rok) return [];
        var sec = 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti/vyzivovaneDeti/vyzivovaneDite';
        var n = ctx.getRepeatCount(sec);
        if (n === 0) return [];
        var errors = [];
        for (var i = 0; i < n; i++) {
          var poradi = ctx.getVal('10451', i);
          if (!poradi || poradi.length !== 12) continue;
          var birth = _parseBirth(ctx.getVal('10448', i), ctx.getVal('10449', i));
          if (!birth) continue;
          for (var m = 0; m < 12; m++) {
            var ch = poradi.charAt(m);
            if (ch === 'N' || ch === '0') continue;
            // Child must be under 18 at end of month m+1
            var endOfMonth = makeDate(rok, m + 1, daysInMonth(rok, m + 1));
            var age = ageAt(birth, endOfMonth);
            if (age >= 18)
              errors.push({ fieldCsszId: '10451', instanceIndex: i,
                message: 'V měsíci ' + (m + 1) + ' dítě nesplňuje věkovou podmínku.' });
          }
        }
        return errors;
      }},

    // M293: Datum od/do (TPP 10263/10264) musí být v rámci referenčního měsíce
    { id: 'M293', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Datum od a datum do musí být v rámci vykazovaného měsíce.',
      check: function(ctx) {
        var mesic = ctx.getHeaderNum('10010');
        var rok = ctx.getHeaderNum('10011');
        if (!mesic || !rok) return [];
        var monthStart = makeDate(rok, mesic, 1);
        var monthEnd = makeDate(rok, mesic, daysInMonth(rok, mesic));
        var n = ctx.getRepeatCount('teoretickaPraktickaPriprava/obdobi');
        if (n === 0) return [];
        var errors = [];
        for (var i = 0; i < n; i++) {
          var od = parseDate(ctx.getVal('10263', i));
          var doo = parseDate(ctx.getVal('10264', i));
          if (od && compareDates(od, monthStart) < 0)
            errors.push({ fieldCsszId: '10263', instanceIndex: i, message: ctx.rule.msg });
          if (od && compareDates(od, monthEnd) > 0)
            errors.push({ fieldCsszId: '10263', instanceIndex: i, message: ctx.rule.msg });
          if (doo && compareDates(doo, monthStart) < 0)
            errors.push({ fieldCsszId: '10264', instanceIndex: i, message: ctx.rule.msg });
          if (doo && compareDates(doo, monthEnd) > 0)
            errors.push({ fieldCsszId: '10264', instanceIndex: i, message: ctx.rule.msg });
        }
        return errors;
      }},

    // M300: Max 1502 formulářů v 1. dílčím podání
    { id: 'M300', scope: 'header', sev: 'error', type: 'custom',
      msg: 'Zadaný počet formulářů neodpovídá maximálnímu počtu formulářů (1502 celkem).',
      check: function(ctx) {
        var poradi = ctx.getHeaderNum('10002');
        if (poradi !== 1) return [];
        var pocet = ctx.getHeaderNum('10015');
        if (pocet !== null && pocet > 1502)
          return [{ fieldCsszId: '10015', message: ctx.rule.msg }];
        return [];
      }},

    // M301: Max 1500 formulářů v dalších dílčích podáních
    { id: 'M301', scope: 'header', sev: 'error', type: 'custom',
      msg: 'Zadaný počet formulářů neodpovídá maximálnímu počtu formulářů (1500 celkem).',
      check: function(ctx) {
        var poradi = ctx.getHeaderNum('10002');
        if (poradi === null || poradi <= 1) return [];
        var pocet = ctx.getHeaderNum('10015');
        if (pocet !== null && pocet > 1500)
          return [{ fieldCsszId: '10015', message: ctx.rule.msg }];
        return [];
      }},

    // M303: Typ formuláře v individualizované části odpovídá XSD schématu
    { id: 'M303', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'V součásti individualizované části musí být uveden příslušný typ formuláře.',
      check: function(ctx) {
        var typ = ctx.getHeaderVal('10007');
        if (typ !== 'R' && typ !== 'O') return [];
        var validVariants = ['bezPriznaku', 'pestoun', 'cinnostKS', 'vezen',
          'mezinarodniPronajemSily', 'jinyPrijem', 'ozpTpp', 'odlozenyPrijem'];
        var errors = [];
        ctx.allEmps.forEach(function(e) {
          var typForm = getVal(e, '10016');
          if (typForm !== 'R' && typForm !== 'O') return;
          if (!e._formRoot) {
            errors.push({ fieldCsszId: '10016', message: ctx.rule.msg });
            return;
          }
          var variant = e._formRoot.localName;
          if (validVariants.indexOf(variant) < 0)
            errors.push({ fieldCsszId: '10016', message: ctx.rule.msg });
        });
        return errors;
      }},

    // M308: Storno podání neobsahuje pvpoj/souhrn/individualizovanou část
    { id: 'M308', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'V podání typu storno se nesmí nacházet pojistná, souhrnná ani individualizovaná část.',
      check: function(ctx) {
        var typ = ctx.getHeaderVal('10007');
        if (typ !== 'S') return [];
        var root = _xmlDoc ? _xmlDoc.documentElement : null;
        if (!root) return [];
        var errors = [];
        if (findChildEl(root, 'PVPOJ'))
          errors.push({ fieldCsszId: '10007', message: ctx.rule.msg });
        if (findChildEl(root, 'souhrn'))
          errors.push({ fieldCsszId: '10007', message: ctx.rule.msg });
        if (findChildEl(root, 'formulareOsob') || ctx.allEmps.length > 0)
          errors.push({ fieldCsszId: '10007', message: ctx.rule.msg });
        return errors;
      }},

    // M309: Trvání pojištění vs ELDP kód a Malý rozsah
    { id: 'M309', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Počet dní započtených neodpovídá pravidlům pro ELDP při zaměstnání malého rozsahu.',
      check: function(ctx) {
        var malyRozsah = ctx.getVal('10243');
        var n = ctx.getRepeatCount('pojisteni/eldpSeznam/eldp');
        if (n === 0) return [];
        var errors = [];
        for (var i = 0; i < n; i++) {
          var kod = ctx.getVal('10240', i);
          if (!kod || kod.length < 2) continue;
          var c1 = kod.charAt(0).toUpperCase();
          var c2 = kod.charAt(1).toUpperCase();
          var c3 = kod.length >= 3 ? kod.charAt(2).toUpperCase() : '';
          // Conditions: 2nd pos != P,V AND 3rd pos != T AND (malyRozsah=A OR 3rd=S OR 1st in T-Z)
          if (c2 === 'P' || c2 === 'V') continue;
          if (c3 === 'T') continue;
          var specialCondition = isTrueValue(malyRozsah) || c3 === 'S' || 'TUVWXYZ'.indexOf(c1) >= 0;
          if (!specialCondition) continue;
          var odecitane = ctx.getNum('10375', i);
          if (odecitane === null || odecitane === 0) continue;
          var pocetDnu = ctx.getNum('10356', i);
          var pojOd = parseDate(ctx.getVal('10354'));
          var pojDo = parseDate(ctx.getVal('10355'));
          if (pocetDnu === null || !pojOd || !pojDo) continue;
          // Days between pojOd and pojDo
          var pojOdDate = new Date(pojOd.y, pojOd.m - 1, pojOd.d);
          var pojDoDate = new Date(pojDo.y, pojDo.m - 1, pojDo.d);
          var trvaniDnu = Math.round((pojDoDate - pojOdDate) / 86400000) + 1;
          var zapoctene = trvaniDnu - odecitane;
          if (pocetDnu !== zapoctene)
            errors.push({ fieldCsszId: '10356', instanceIndex: i, message: ctx.rule.msg });
        }
        return errors;
      }},

    // M312: Pořadí daňového zvýhodnění napříč dětmi tvoří řadu
    { id: 'M312', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Nelze uplatnit dítě s vyšším pořadím, pokud v daném měsíci nejsou uvedeny děti s nižším pořadím nebo s "N".',
      check: function(ctx) {
        var sec = 'souhrnDataZec/rocniUhrny/vysledekRocnihoZuctovani/zvyhodneniNaDeti/vyzivovaneDeti/vyzivovaneDite';
        var n = ctx.getRepeatCount(sec);
        if (n < 2) return [];
        var errors = [];
        // Gather pořadí strings (12 chars each, '1'-'3' or 'N')
        var poradiArr = [];
        for (var i = 0; i < n; i++) {
          var p = ctx.getVal('10451', i);
          poradiArr.push(p || '');
        }
        // For each month, check that ordering is valid
        for (var m = 0; m < 12; m++) {
          var maxOrder = 0;
          var orders = [];
          for (var i = 0; i < n; i++) {
            if (poradiArr[i].length <= m) continue;
            var ch = poradiArr[i].charAt(m);
            if (ch === 'N' || ch === '0') continue;
            var ord = parseInt(ch, 10);
            if (!isNaN(ord)) orders.push({ idx: i, order: ord });
          }
          if (orders.length === 0) continue;
          orders.sort(function(a, b) { return a.order - b.order; });
          // Check sequence: orders must be 1, 2, 3, ... without gaps
          for (var j = 0; j < orders.length; j++) {
            if (orders[j].order !== j + 1) {
              errors.push({ fieldCsszId: '10451', instanceIndex: orders[j].idx,
                message: ctx.rule.msg });
              break;
            }
          }
        }
        return errors;
      }},

    // M278: Child born in (rok-5) or earlier → too old for § 35bb sleva
    { id: 'M278', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Nelze uvést dítě, které se narodilo roku (rok - 5) a nebo dříve.',
      check: function(ctx) {
        var rok = ctx.getHeaderNum('10011');
        if (!rok) return [];
        var birthDate = _parseBirth(ctx.getVal('10541'), ctx.getVal('10542'));
        if (!birthDate) return [];
        if (birthDate.y <= rok - 5)
          return [{ fieldCsszId: '10541', message: ctx.rule.msg }];
        return [];
      }},

    // M280: Sum OvoZel slev (10547) across employees = úhrn (10545)
    { id: 'M280', scope: 'cross', sev: 'error', type: 'custom',
      msg: 'Vykázaný úhrn slev na pojistném zaměstnanců neodpovídá součtu slev na pojistném těchto zaměstnanců.',
      check: function(ctx) {
        var uhrn = ctx.getHeaderNum('10545');
        if (uhrn === null) return [];
        var sum = 0;
        ctx.allEmps.forEach(function(e) { sum += (getNum(e, '10547') || 0); });
        if (Math.abs(uhrn - sum) > 0.5)
          return [{ fieldCsszId: '10545', message: ctx.rule.msg }];
        return [];
      }},

    // M282: If odpracované hodiny (10268)=0, related fields empty
    { id: 'M282', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Při nulovém počtu odpracovaných hodin se nevyplňují související atributy.',
      check: function(ctx) {
        var hod = ctx.getNum('10268');
        if (hod !== 0) return [];
        var fields = ['10269','10270','10271','10272','10273','10274'];
        for (var j = 0; j < fields.length; j++) {
          if (ctx.isFilled(fields[j]))
            return [{ fieldCsszId: fields[j], message: ctx.rule.msg }];
        }
        return [];
      }},

    // M283: If zúčtovaný příjem celkem (10286)=0, related fields empty
    { id: 'M283', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Při nulovém zúčtovaném příjmu se nevyplňují související atributy.',
      check: function(ctx) {
        var prijmy = ctx.getNum('10286');
        if (prijmy !== 0) return [];
        var fields = ['10416','10289','10417','10292','10293','10294','10295','10296','10418','10308','10309','10310'];
        for (var j = 0; j < fields.length; j++) {
          if (ctx.isFilled(fields[j]))
            return [{ fieldCsszId: fields[j], message: ctx.rule.msg }];
        }
        return [];
      }},

    // M284: If VZ (10477) nonzero, at least one A/B/C component filled
    // Skip excluded datové scénáře (K-S, M, 1-9 with 10502) per CSV
    { id: 'M284', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Pokud je vyměřovací základ zaměstnance nenulový, musí být vyplněna alespoň jedna z dílčích částek.',
      check: function(ctx) {
        if (isCinnostKSOrPestoun(ctx.emp)) return [];
        var vz = ctx.getNum('10477');
        if (!vz) return [];
        if (!ctx.isFilled('10478') && !ctx.isFilled('10479') && !ctx.isFilled('10480'))
          return [{ fieldCsszId: '10477', message: ctx.rule.msg }];
        return [];
      }},

    // M286: If neodpracované hodiny celkem (10275)=0, related fields empty
    { id: 'M286', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Při nulovém celkovém počtu neodpracovaných hodin se nevyplňují související atributy.',
      check: function(ctx) {
        var hod = ctx.getNum('10275');
        if (hod !== 0) return [];
        var fields = ['10276','10278','10277','10279','10280','10471','10472'];
        for (var j = 0; j < fields.length; j++) {
          if (ctx.isFilled(fields[j]))
            return [{ fieldCsszId: fields[j], message: ctx.rule.msg }];
        }
        return [];
      }},

    // M296: OvoZel sleva (10546=ANO) only for DPP (druh činnosti T-ZC)
    { id: 'M296', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Sleva na pojistném zaměstnanců v ovocnářství a při pěstování zeleniny náleží jen z DPP.',
      check: function(ctx) {
        var sleva = ctx.getVal('10546');
        if (!isTrueValue(sleva)) return [];
        var druh = ctx.getVal('10239');
        if (druh !== 'T') return [{ fieldCsszId: '10546', message: ctx.rule.msg }];
        return [];
      }},

    // M297: Počet zaměstnanců se slevou (10485) <= count with 10490=ANO
    { id: 'M297', scope: 'cross', sev: 'warning', type: 'custom',
      msg: 'Počet zaměstnanců, kteří mají nárok na slevu na pojistném pro pracující důchodce, nemůže být vyšší než počet pojistných vztahů, z nichž je tato sleva uplatňována.',
      check: function(ctx) {
        var pocet = ctx.getHeaderNum('10485');
        if (pocet === null) return [];
        var count = 0;
        ctx.allEmps.forEach(function(e) {
          var s = getVal(e, '10490');
          if (isTrueValue(s)) count++;
        });
        if (pocet > count)
          return [{ fieldCsszId: '10485', message: ctx.rule.msg }];
        return [];
      }},

    // M298: Počet zaměstnanců OvoZel (10543) <= count with 10546=ANO
    { id: 'M298', scope: 'cross', sev: 'warning', type: 'custom',
      msg: 'Počet zaměstnanců se slevou v ovocnářství nemůže být vyšší než počet pojistných vztahů (DPP), z nichž je tato sleva uplatňována.',
      check: function(ctx) {
        var pocet = ctx.getHeaderNum('10543');
        if (pocet === null) return [];
        var count = 0;
        ctx.allEmps.forEach(function(e) {
          var s = getVal(e, '10546');
          if (isTrueValue(s)) count++;
        });
        if (pocet > count)
          return [{ fieldCsszId: '10543', message: ctx.rule.msg }];
        return [];
      }},

    // M299: Pojištění od/do must be within reported month
    { id: 'M299', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Atributy pojištění od a pojištění do musí být v rámci vykazovaného rozhodného období.',
      check: function(ctx) {
        var mesic = ctx.getHeaderNum('10010');
        var rok = ctx.getHeaderNum('10011');
        if (!mesic || !rok) return [];
        var errors = [];
        var firstDay = makeDate(rok, mesic, 1);
        var lastDay = makeDate(rok, mesic, daysInMonth(rok, mesic));
        var od = ctx.getVal('10354');
        var doo = ctx.getVal('10355');
        if (od) {
          var dp = parseDate(od);
          if (dp && (compareDates(dp, firstDay) < 0 || compareDates(dp, lastDay) > 0))
            errors.push({ fieldCsszId: '10354', message: ctx.rule.msg });
        }
        if (doo) {
          var dp2 = parseDate(doo);
          if (dp2 && (compareDates(dp2, firstDay) < 0 || compareDates(dp2, lastDay) > 0))
            errors.push({ fieldCsszId: '10355', message: ctx.rule.msg });
        }
        return errors;
      }},

    // M304: Základ pro výpočet daně (10535) >= 0
    { id: 'M304', scope: 'emp', sev: 'error', type: 'non_neg', field: '10535',
      msg: 'Hodnota musí být vyplněna i v případě nulového základu pro výpočet daně, zároveň nesmí být záporná.' },

    // M307: If kód ELDP (10240) not filled, ELDP fields empty
    { id: 'M307', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Pokud není uveden kód ELDP, nelze vyplňovat údaje o době důchodového pojištění.',
      check: function(ctx) {
        var n = ctx.getRepeatCount('pojisteni/eldpSeznam/eldp');
        var errors = [];
        for (var i = 0; i < n; i++) {
          if (ctx.isFilled('10240', i)) continue;
          var fields = ['10241','10242','10245','10357','10358','10359','10360','10362',
            '10536','10375','10462','10463','10464','10465','10466','10468','10469'];
          for (var j = 0; j < fields.length; j++) {
            if (ctx.isFilled(fields[j], i)) {
              errors.push({ fieldCsszId: fields[j], instanceIndex: i, message: ctx.rule.msg });
              break;
            }
          }
        }
        return errors;
      }},

    // M310: If roční zúčtování (10320)=NE, roční fields empty
    { id: 'M310', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Nebylo-li provedeno roční zúčtování záloh, pak nesmí být vyplněny atribut(y) výsledku ročního zúčtování.',
      check: function(ctx) {
        var rz = ctx.getVal('10320');
        if (!isFalseValue(rz)) return [];
        var fields = ['10321','10322','10323','10420','10421','10422','10423','10424',
          '10425','10426','10430','10539','10540','10541','10542','10454','10455',
          '10441','10442','10443','10444','10445','10446','10447','10448','10449','10450','10451'];
        for (var j = 0; j < fields.length; j++) {
          if (ctx.isFilled(fields[j]))
            return [{ fieldCsszId: fields[j], message: ctx.rule.msg }];
        }
        return [];
      }},

    // M311: Roční zúčtování (10320)=ANO only in months 1-3
    { id: 'M311', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Roční zúčtování záloh je možné provádět právě jednou za kalendářní rok v měsíci: leden, únor nebo březen.',
      check: function(ctx) {
        var rz = ctx.getVal('10320');
        if (!isTrueValue(rz)) return [];
        var mesic = ctx.getHeaderNum('10010');
        if (mesic !== null && mesic >= 1 && mesic <= 3) return [];
        return [{ fieldCsszId: '10320', message: ctx.rule.msg }];
      }},

    // M315: Pojistné = ceil(rate_A * A) + ceil(rate_B * B) + ceil(rate_C * C)
    { id: 'M315', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Pojistné na sociální zabezpečení neodpovídá vyměřovacímu základu zaměstnance.',
      check: function(ctx) {
        var pojistne = ctx.getNum('10481');
        if (pojistne === null) return [];
        var a = ctx.getNum('10478');
        var b = ctx.getNum('10479');
        var c = ctx.getNum('10480');
        var expected;
        if (a !== null || b !== null || c !== null) {
          expected = Math.ceil(KONTROLY_CONSTANTS.rates.employerInsuranceA * (a || 0))
            + Math.ceil(KONTROLY_CONSTANTS.rates.employerInsuranceB * (b || 0))
            + Math.ceil(KONTROLY_CONSTANTS.rates.employerInsuranceC * (c || 0));
        } else {
          var celkem = ctx.getNum('10477');
          if (celkem === null) return [];
          expected = Math.ceil(KONTROLY_CONSTANTS.rates.employerInsuranceA * celkem);
        }
        if (Math.abs(pojistne - expected) > KONTROLY_CONSTANTS.tolerances.combinedInsuranceDiff)
          return [{ fieldCsszId: '10481', message: ctx.rule.msg }];
        return [];
      }},

    // M321: If primární PPV=ANO, souhrnná data must be filled
    { id: 'M321', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Pokud je vyplněn primární pracovněprávní vztah zaměstnance, je nutné doplnit hodnoty z oblasti: Souhrnná data zaměstnance.',
      check: function(ctx) {
        var prim = ctx.getVal('10495');
        if (!isTrueValue(prim)) return [];
        // Check key mandatory souhrnná data fields
        if (!ctx.isFilled('10286') && !ctx.isFilled('10297') && !ctx.isFilled('10419')
            && !ctx.isFilled('10344') && !ctx.isFilled('10482') && !ctx.isFilled('10371'))
          return [{ fieldCsszId: '10286', message: ctx.rule.msg }];
        return [];
      }},

    // M328: If ELDP odečítané doby (10375)=0, sub-fields empty
    { id: 'M328', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Pokud je počet kalendářních dnů doby odečítané po dosažení důchodového věku v měsíci nulový, pak se atributy o této době nevyplňují.',
      check: function(ctx) {
        var n = ctx.getRepeatCount('pojisteni/eldpSeznam/eldp');
        var errors = [];
        for (var i = 0; i < n; i++) {
          var doby = ctx.getNum('10375', i);
          if (doby !== 0) continue;
          var fields = ['10462','10463','10464','10465','10466','10468','10469'];
          for (var j = 0; j < fields.length; j++) {
            if (ctx.isFilled(fields[j], i)) {
              errors.push({ fieldCsszId: fields[j], instanceIndex: i, message: ctx.rule.msg });
              break;
            }
          }
        }
        return errors;
      }},

    // M329: If ELDP vyloučené doby celkem (10357) not filled or = 0, sub-fields must not be filled
    { id: 'M329', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Pokud nejsou vykázány žádné vyloučené doby, pak se údaje o omluvných důvodech nevyplňují.',
      check: function(ctx) {
        var n = ctx.getRepeatCount('pojisteni/eldpSeznam/eldp');
        var errors = [];
        for (var i = 0; i < n; i++) {
          var doby = ctx.getNum('10357', i);
          if (doby !== null && doby !== 0) continue;
          var fields = ['10358','10359','10360','10362','10536'];
          for (var j = 0; j < fields.length; j++) {
            if (ctx.isFilled(fields[j], i)) {
              errors.push({ fieldCsszId: fields[j], instanceIndex: i, message: ctx.rule.msg });
            }
          }
        }
        return errors;
      }},

    // M330: If započtené dny (10356) > 0, kód ELDP (10240) must be filled
    { id: 'M330', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Pokud jsou vyplněny započtené dny důchodového pojištění, musí být uveden i kód ELDP.',
      check: function(ctx) {
        var n = ctx.getRepeatCount('pojisteni/eldpSeznam/eldp');
        var errors = [];
        for (var i = 0; i < n; i++) {
          var dny = ctx.getNum('10356', i);
          if (dny !== null && dny > 0 && !ctx.isFilled('10240', i))
            errors.push({ fieldCsszId: '10240', instanceIndex: i, message: ctx.rule.msg });
        }
        return errors;
      }},

    // M332: Primární PPV (10495) required unless storno
    { id: 'M332', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Ve formuláři chybí povinný atribut primární pracovněprávní vztah zaměstnance.',
      check: function(ctx) {
        var typ = ctx.getVal('10016');
        if (typ === 'S') return [];
        if (ctx.emp._formRoot && ctx.emp._formRoot.localName === 'ozpTpp') return [];
        if (!ctx.isFilled('10495'))
          return [{ fieldCsszId: '10495', message: ctx.rule.msg }];
        return [];
      }},

    // M333: Sleva zaměstnavatele (10032) not allowed after 30.6.2026 for replacement
    { id: 'M333', scope: 'header', sev: 'error', type: 'custom',
      msg: 'Slevu na pojistném zaměstnavatele za měsíce leden, únor a březen 2026 nelze uplatnit po 30. 6. 2026.',
      check: function(ctx) {
        var typ = ctx.getHeaderVal('10016');
        if (typ !== 'R') return [];
        var mesic = ctx.getHeaderNum('10010');
        var rok = ctx.getHeaderNum('10011');
        if (rok !== 2026 || !mesic || mesic > 3) return [];
        var sleva = ctx.getHeaderNum('10032');
        if (!sleva || sleva <= 0) return [];
        var prijeti = ctx.getHeaderVal('10006');
        var deadline = makeDate(2026, 6, 30);
        if (!prijeti) {
          if (compareDates(todayDate(), deadline) > 0)
            return [{ fieldCsszId: '10032', message: ctx.rule.msg }];
        } else {
          var dp = parseDate(prijeti);
          if (dp && compareDates(dp, deadline) > 0)
            return [{ fieldCsszId: '10032', message: ctx.rule.msg }];
        }
        return [];
      }},

    // M325: záloha territory (DPP/non-DPP income aggregated per employee above threshold) → no srážková fields
    // Aggregates 10535 across all forms of the same employee at the employer:
    //   1a) sum of DPP forms (druhCinnosti = "T".."Z" — codes T,U,V,W,X,Y,Z) >= 12 000
    //   1b) AND sum of non-DPP forms (druhCinnosti not a DPP code) >= 4 500
    // Then 10307 / 10309 must be empty on the (souhrn-bearing) form.
    // Note: CSV spec writes the DPP codelist range as "T-ZC" (i.e. "T" až "ZC" → "T" through "Z");
    // the actual XML druhCinnosti is a single letter from T–Z (XSD pattern forbids the hyphen).
    { id: 'M325', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Pro scénář, kdy je vybírána daň zálohou, nelze vyplnit atribut(y) související se srážkovou daní.',
      check: function(ctx) {
        var odmeny = ctx.getVal('10416');
        if (odmeny && odmeny !== '0') return [];

        // Short-circuit: if neither srážková field is filled, the rule cannot fail.
        if (!ctx.isFilled('10307') && !ctx.isFilled('10309')) return [];

        // Build a stable person key for cross-form aggregation.
        // Prefer ikMpsv (10051); otherwise fall back to prijmeni|jmeno|datumNarozeni.
        function personKey(e) {
          var ik = getVal(e, '10051');
          if (ik) return 'ik:' + ik;
          var p = getVal(e, '10053');
          var j = getVal(e, '10054');
          var d = getVal(e, '10056');
          if (p || j || d) return 'name:' + p + '|' + j + '|' + d;
          return null;
        }

        var key = personKey(ctx.emp);
        if (!key) return [];

        var dppSum = 0;
        var nonDppSum = 0;
        for (var i = 0; i < ctx.allEmps.length; i++) {
          var other = ctx.allEmps[i];
          if (personKey(other) !== key) continue;
          var z = getNum(other, '10535');
          if (z === null) continue;
          var dc = getVal(other, '10239');
          if (isDppCode(dc)) dppSum += z;
          else nonDppSum += z;
        }

        if (dppSum < 12000) return [];
        if (nonDppSum < 4500) return [];

        var fields = ['10307','10309'];
        for (var k = 0; k < fields.length; k++) {
          if (ctx.isFilled(fields[k]))
            return [{ fieldCsszId: fields[k], message: ctx.rule.msg }];
        }
        return [];
      }},

    // M331: Typ Odloženého příjmu — value enum check.
    //   XSD enforces string length=1; flexibee JmhzDataHelper.getTypOdlozenehoPrijmu
    //   uses values "1" (regular odložený příjem) and "4" (roční zúčtování). Defensively
    //   allow 1-4 (pokyny ř. 3120-3133 do not enumerate codes, only "1 char").
    //   The field lives at <form:typ> on the odlozenyPrijem root; read via getVariantMetaVal.
    { id: 'M331', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Typ Odloženého příjmu: hodnota není z povolené množiny.',
      check: function(ctx) {
        var v = getVariantMetaVal(ctx.emp, '10548');
        if (!v) return [];
        var allowed = ['1','2','3','4'];
        if (allowed.indexOf(String(v).trim()) >= 0) return [];
        return [{ fieldCsszId: '10548',
          message: 'Typ Odloženého příjmu: hodnota „' + v + '" není povolená (povolené: ' +
                   allowed.join(', ') + ').' }];
      }},

    // M338: Odložený příjem "Příjem po skončení" → ELDP 2nd pos must be "P" or empty
    { id: 'M338', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Pro daný typ odloženého příjmu musí být na druhé pozici kódu ELDP znak "P".',
      check: function(ctx) {
        var typ = getVariantMetaVal(ctx.emp, '10548');
        if (!typ) return [];
        // Only applies to "Příjem po skončení" type (check short code or starts with pattern)
        var isPostEnd = /p[rř][ií]jem.*po.*skon[cč]/i.test(typ) ||
                        typ === '1' || typ === 'P'; // possible short codes
        if (!isPostEnd) return [];
        var n = ctx.getRepeatCount('pojisteni/eldpSeznam/eldp');
        var errors = [];
        for (var i = 0; i < n; i++) {
          var kod = ctx.getVal('10240', i);
          if (!kod) continue;
          if (kod.length >= 2 && kod.charAt(1) !== 'P')
            errors.push({ fieldCsszId: '10240', instanceIndex: i, message: ctx.rule.msg });
        }
        return errors;
      }},

    // M343: Typ formuláře odpovídá druhu činnosti (10239/10502)
    { id: 'M343', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Typ formuláře neodpovídá druhu činnosti zaměstnance.',
      check: function(ctx) {
        var druh = (ctx.getVal('10239') || '').trim().toUpperCase();
        var blizsi = (ctx.getVal('10502') || '').trim();
        if (!druh || !ctx.emp._formRoot) return [];
        var variant = ctx.emp._formRoot.localName;
        var expected = null;
        // Activity codes 1-9
        if (/^[1-9]$/.test(druh)) {
          if (/v[ýy]kon.*trestu|^3$/i.test(blizsi)) {
            expected = 'vezen';
          } else if (/specifick[áa].*skupina|^2$/i.test(blizsi)) {
            expected = 'cinnostKS';
          } else if (!blizsi || /[žz][áa]dn[éeý]|^1$/i.test(blizsi)) {
            expected = 'bezPriznaku';
          }
        } else if (druh === '10') {
          expected = 'ozpTpp';
        } else if (druh === 'M') {
          expected = 'pestoun';
        } else if ('KNOPQRS'.indexOf(druh) >= 0) {
          expected = 'cinnostKS';
        } else if (druh === '15' || druh === '16') {
          expected = 'bezPriznaku';
        } else if (/^[A-J]$/.test(druh)) {
          expected = 'bezPriznaku';
        } else if (/^(T|U|V|W|X|Y|Z|ZA|ZB|ZC)$/.test(druh)) {
          expected = 'bezPriznaku';
        }
        if (expected && variant !== expected)
          return [{ fieldCsszId: '10239', message: ctx.rule.msg + ' Očekáváno: ' + expected + ', nalezeno: ' + variant + '.' }];
        return [];
      }},

    // M352: Minimální délka identifikačních údajů
    { id: 'M352', scope: 'emp', sev: 'error', type: 'custom',
      msg: 'Identifikační údaje musí obsahovat alespoň 1 znak.',
      check: function(ctx) {
        var fields = ['10053', '10054', '10228', '10274'];
        var errors = [];
        for (var i = 0; i < fields.length; i++) {
          var v = ctx.getVal(fields[i]);
          if (v !== undefined && v !== '' && v.trim().length < 1)
            errors.push({ fieldCsszId: fields[i], message: getFieldLabel(fields[i]) + ' musí obsahovat alespoň 1 znak.' });
        }
        return errors;
      }},
  ];

  // Helper: parse birth date from datum narození or rodné číslo
  function _parseBirth(narozeni, rc) {
    if (narozeni) { return parseDate(narozeni); }
    if (!rc) return null;
    var yy = parseInt(rc.substring(0, 2), 10);
    var mm = parseInt(rc.substring(2, 4), 10);
    var dd = parseInt(rc.substring(4, 6), 10);
    if (mm > 50) mm -= 50;
    if (mm > 20) mm -= 20;
    var year = yy < 54 ? 2000 + yy : 1900 + yy;
    if (isNaN(year) || isNaN(mm) || isNaN(dd)) return null;
    return { y: year, m: mm, d: dd };
  }

  // ── Main Entry Point ─────────────────────────────────────────

  function runKontroly(xmlDoc, employees, headerFields, fields, fieldsBySec) {
    if (!getFieldDef('10001')) buildCsszIndex(fields);
    _fieldsBySection = fieldsBySec;
    _xmlDoc = xmlDoc;

    const results = [];

    // Build header pseudo-employee for header-scope controls
    const pseudoEmp = { fields: {} };
    headerFields.forEach(h => {
      Object.entries(HEADER_CSSZ_MAP).forEach(([csszId, hdrKey]) => {
        if (hdrKey === h.key) {
          pseudoEmp.fields['_header/' + csszId] = { value: h.value || '' };
        }
      });
    });
    // Temporarily inject header field definitions into csszId map
    const injected = [];
    Object.keys(HEADER_CSSZ_MAP).forEach(csszId => {
      if (!getFieldDef(csszId)) {
        const hdrKey = HEADER_CSSZ_MAP[csszId];
        const hf = headerFields.find(h => h.key === hdrKey);
        window.KontrolyUtils._injectFieldDef(csszId, { section: '_header', element: csszId, csszId, label: hf ? hf.label : csszId });
        injected.push(csszId);
      }
    });

    function pushHeaderError(e) {
      const hdrKey = HEADER_CSSZ_MAP[e.fieldCsszId] || '';
      const hf = headerFields.find(h => h.key === hdrKey);
      results.push({
        severity: e.severity, controlId: e.controlId,
        empIndex: -1, employeeName: '',
        sectionLabel: hf ? 'PVPOJ' : 'Záhlaví',
        fieldLabel: hf ? hf.label : getFieldLabel(e.fieldCsszId),
        fieldKey: '', headerKey: hf ? hf.key : '',
        canNavigate: !!hf, message: e.message
      });
    }

    var evalOpts = {
      getHeaderVal: function(id) { return getHeaderVal(headerFields, id); },
      getHeaderNum: function(id) { return getHeaderNum(headerFields, id); }
    };

    KONTROLY.forEach(rule => {
      if (rule.scope === 'header') {
        const errs = evalRule(rule, pseudoEmp, headerFields, employees, evalOpts);
        errs.forEach(pushHeaderError);

      } else if (rule.scope === 'cross') {
        // Cross-employee: runs once, custom function gets all employees
        if (rule.type === 'custom' && typeof rule.check === 'function') {
          const ctx = {
            getVal: (id, ii) => getVal(pseudoEmp, id, ii),
            getNum: (id, ii) => getNum(pseudoEmp, id, ii),
            isFilled: (id, ii) => isFilled(pseudoEmp, id, ii),
            getHeaderVal: (id) => getHeaderVal(headerFields, id),
            getHeaderNum: (id) => getHeaderNum(headerFields, id),
            allEmps: employees, headerFields, emp: pseudoEmp,
            getRepeatCount: () => 0, getFieldLabel, rule
          };
          const errs = rule.check(ctx);
          if (errs && errs.length > 0) {
            errs.forEach(ce => {
              pushHeaderError({
                severity: ce.severity || rule.sev || 'error',
                controlId: rule.id,
                fieldCsszId: ce.fieldCsszId || '',
                message: ce.message || rule.msg
              });
            });
          }
        }

      } else {
        // Employee-level control: evaluate for each employee
        employees.forEach((emp, empIdx) => {
          const errs = evalRule(rule, emp, headerFields, employees, evalOpts);
          errs.forEach(e => {
            const fd = getFieldDef(e.fieldCsszId);
            const fk = fd ? fieldKeyFor(fd, e.instanceIndex) : '';
            results.push({
              severity: e.severity, controlId: e.controlId,
              empIndex: empIdx,
              employeeName: emp.surname ? (emp.surname + ' ' + (emp.firstName || '')).trim() : ('Řádek ' + (empIdx + 1)),
              sectionLabel: getSectionLabel(e.fieldCsszId),
              fieldLabel: getFieldLabel(e.fieldCsszId),
              fieldKey: fk, headerKey: '',
              canNavigate: !!fd, message: e.message
            });
          });
        });
      }
    });

    injected.forEach(id => window.KontrolyUtils._removeFieldDef(id));
    _xmlDoc = null;
    return results;
  }

  // Reset index on format change
  function resetMHKontrolyIndex() {
    resetKontrolyIndex();
    _fieldsBySection = null;
  }

  // ── Export ────────────────────────────────────────────────────
  window.MHKontroly = {
    runKontroly,
    resetKontrolyIndex: resetMHKontrolyIndex,
    KONTROLY
  };
})();
