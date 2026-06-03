// === Nativni kontroly pro VZP formaty HOZ + PPPZ ===
// Stejny kontrakt jako window.MHKontroly / window.REGZECKontroly:
//   runKontroly(xmlDoc, employees, header, FIELDS, FIELDS_BY_SECTION, fieldRules)
//     -> pole { severity, controlId, empIndex, employeeName, sectionLabel,
//               fieldLabel, fieldKey, headerKey, canNavigate, message }
//   resetKontrolyIndex()
// Vystupy se renderuji v nativnim panelu Kontroly (Karty/Tabulka) JMHZ VIEWER.
(function () {
  "use strict";

  function KU() { return (typeof window !== "undefined" && window.KontrolyUtils) || null; }

  function directChildren(parent) {
    if (!parent) return [];
    return Array.prototype.filter.call(parent.childNodes, function (n) { return n.nodeType === 1; });
  }
  function childByName(parent, name) {
    var ku = KU();
    if (ku && ku.findChildEl) return ku.findChildEl(parent, name);
    return directChildren(parent).find(function (e) { return e.localName === name; }) || null;
  }
  function childText(parent, name) {
    var e = childByName(parent, name);
    return e ? (e.textContent || "").trim() : null;
  }

  function validIco(ico) {
    if (!/^\d{8}$/.test(ico)) return false;
    var s = 0;
    for (var i = 0; i < 7; i++) s += parseInt(ico[i], 10) * (8 - i);
    var m = s % 11;
    var check = m === 0 ? 1 : (m === 1 ? 0 : 11 - m);
    return check === parseInt(ico[7], 10);
  }

  function rcDivisibleBy11(rc) {
    var ku = KU();
    if (ku && ku.validateRCModulo11) {
      var r = ku.validateRCModulo11(rc);
      return !(r && r.error === "modulo");
    }
    if (!/^\d{10}$/.test(rc)) return true;
    var rem = 0;
    for (var i = 0; i < rc.length; i++) rem = (rem * 10 + parseInt(rc[i], 10)) % 11;
    return rem === 0;
  }

  function plausibleForeignerId(val) {
    if (!/^[MZ]\d{8}$/.test(val)) return false;
    var d = parseInt(val.substr(1, 2), 10);
    var m = parseInt(val.substr(3, 2), 10);
    var y = parseInt(val.substr(5, 4), 10);
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;
    if (y < 1900 || y > (new Date().getFullYear())) return false;
    return true;
  }

  function parseIsoDate(s) {
    if (!s) return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3];
    var dt = new Date(Date.UTC(y, mo - 1, d));
    if (isNaN(dt.getTime())) return null;
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return dt;
  }

  function isFutureDate(s) {
    var ku = KU();
    if (ku && ku.parseDate && ku.compareDates && ku.todayDate) {
      var d = ku.parseDate(s);
      if (!d) return false;
      return ku.compareDates(d, ku.todayDate()) > 0;
    }
    var dt = parseIsoDate(s);
    if (!dt) return false;
    var t = new Date();
    t.setHours(23, 59, 59, 999);
    return dt > t;
  }

  // --- sekvencni controlId (resetuje se pri nacteni noveho souboru) ---
  var _idCounter = 0;
  function resetKontrolyIndex() { _idCounter = 0; }
  function nextId(prefix) { return prefix + "-" + (++_idCounter); }

  function val(emp, key) {
    var f = emp && emp.fields && emp.fields[key];
    return f ? (f.value || "").trim() : "";
  }
  function empName(emp, idx) {
    if (emp && emp.surname) return (emp.surname + " " + (emp.firstName || "")).trim();
    return "Řádek " + (idx + 1);
  }
  function push(out, o) {
    o.controlId = nextId(o._p || "ZP");
    delete o._p;
    out.push(o);
  }

  var STATE_PAIR_CODES = { D: "důchodce", I: "uchazeč o zaměstnání", G: "nezaopatřené dítě / student" };
  var EMPLOYER_HEADER_KEY = "identifikaceZamestnavatele/identifikacniCisloPlatce";

  function checkEmployerIco(doc, out, prefix) {
    var root = doc && doc.documentElement;
    if (!root) return;
    var idZam = childByName(root, "identifikaceZamestnavatele");
    if (!idZam) return;
    var icp = childText(idZam, "identifikacniCisloPlatce");
    if (icp && /^\d{10}$/.test(icp)) {
      var ico = icp.substr(0, 8);
      var orgUnit = icp.substr(8, 2);
      if (orgUnit !== "99" && !validIco(ico)) {
        push(out, {
          _p: prefix, severity: "warning",
          empIndex: -1, employeeName: "",
          sectionLabel: "Identifikace zaměstnavatele", fieldLabel: "IČ plátce",
          fieldKey: "", headerKey: EMPLOYER_HEADER_KEY, canNavigate: true,
          message: "IČ plátce „" + ico + "“ nemá platný kontrolní součet (modulo 11). Ověřte číslo plátce pojistného."
        });
      }
    }
  }

  // =========================================================================
  // HOZ — Hromadné oznámení zaměstnavatele
  // =========================================================================
  function runHOZ(doc, employees) {
    var out = [];
    var emps = employees || [];

    checkEmployerIco(doc, out, "HOZ");

    var byPerson = {};
    emps.forEach(function (emp, idx) {
      var kod = val(emp, "zaznam/kodzmeny");
      var cislo = val(emp, "zaznam/cisloPojistence");
      var datum = val(emp, "zaznam/datumZmeny");
      var name = empName(emp, idx);
      var base = { empIndex: idx, employeeName: name, sectionLabel: "Změna zaměstnance" };

      if (cislo) {
        if (kod === "E" || kod === "C") {
          if (!/^[MZ]\d{8}$/.test(cislo)) {
            push(out, Object.assign({}, base, {
              _p: "HOZ", severity: "warning", fieldLabel: "Číslo pojištěnce",
              fieldKey: "zaznam/cisloPojistence", headerKey: "", canNavigate: !!(emp.fields && emp.fields["zaznam/cisloPojistence"]),
              message: "U kódu „" + kod + "“ (první přihlášení cizince/občana EU bez trvalého pobytu) se očekává identifikátor ve tvaru pohlaví + datum narození (např. M05071980), nikoli rodné číslo."
            }));
          } else if (!plausibleForeignerId(cislo)) {
            push(out, Object.assign({}, base, {
              _p: "HOZ", severity: "warning", fieldLabel: "Číslo pojištěnce",
              fieldKey: "zaznam/cisloPojistence", headerKey: "", canNavigate: !!(emp.fields && emp.fields["zaznam/cisloPojistence"]),
              message: "Identifikátor cizince „" + cislo + "“ obsahuje nesmyslné datum narození."
            }));
          }
        } else {
          if (/^[MZ]\d{8}$/.test(cislo)) {
            push(out, Object.assign({}, base, {
              _p: "HOZ", severity: "warning", fieldLabel: "Číslo pojištěnce",
              fieldKey: "zaznam/cisloPojistence", headerKey: "", canNavigate: !!(emp.fields && emp.fields["zaznam/cisloPojistence"]),
              message: "Identifikátor ve tvaru pohlaví + datum narození („" + cislo + "“) je určen jen pro první přihlášení cizince (kódy E/C). U kódu „" + kod + "“ se očekává přidělené číslo pojištěnce."
            }));
          } else if (/^\d{10}$/.test(cislo) && !rcDivisibleBy11(cislo)) {
            push(out, Object.assign({}, base, {
              _p: "HOZ", severity: "warning", fieldLabel: "Číslo pojištěnce",
              fieldKey: "zaznam/cisloPojistence", headerKey: "", canNavigate: !!(emp.fields && emp.fields["zaznam/cisloPojistence"]),
              message: "Číslo pojištěnce „" + cislo + "“ (10 číslic) není dělitelné 11 — pravděpodobně nejde o platné rodné číslo. Pokud jde o číslo přidělené pojišťovnou, upozornění ignorujte."
            }));
          }
        }
      }

      if (isFutureDate(datum)) {
        push(out, Object.assign({}, base, {
          _p: "HOZ", severity: "warning", fieldLabel: "Datum změny",
          fieldKey: "zaznam/datumZmeny", headerKey: "", canNavigate: !!(emp.fields && emp.fields["zaznam/datumZmeny"]),
          message: "Datum změny „" + datum + "“ je v budoucnosti."
        }));
      }

      var opravaMsg = null;
      if (kod === "X") opravaMsg = "Kód „X“ (oprava čísla pojištěnce) — na dalším řádku musí být uveden kód „P“ se správným číslem pojištěnce.";
      else if (kod === "Y") opravaMsg = "Kód „Y“ opravuje datum přihlášení — ověřte správnost data změny.";
      else if (kod === "Z") opravaMsg = "Kód „Z“ opravuje datum odhlášení — ověřte správnost data změny.";
      if (opravaMsg) {
        push(out, Object.assign({}, base, {
          _p: "HOZ", severity: "warning", fieldLabel: "Kód změny",
          fieldKey: "zaznam/kodzmeny", headerKey: "", canNavigate: !!(emp.fields && emp.fields["zaznam/kodzmeny"]),
          message: opravaMsg
        }));
      }

      if (cislo) {
        if (!byPerson[cislo]) byPerson[cislo] = [];
        byPerson[cislo].push({ kod: kod, datum: datum, idx: idx });
      }
    });

    // párový kód P (D/I/G se obvykle oznamují spolu s nástupem P)
    emps.forEach(function (emp, idx) {
      var kod = val(emp, "zaznam/kodzmeny");
      var cislo = val(emp, "zaznam/cisloPojistence");
      if (STATE_PAIR_CODES[kod] && cislo) {
        var hasP = (byPerson[cislo] || []).some(function (r) { return r.kod === "P"; });
        if (!hasP) {
          push(out, {
            _p: "HOZ", severity: "warning", empIndex: idx, employeeName: empName(emp, idx),
            sectionLabel: "Změna zaměstnance", fieldLabel: "Kód změny",
            fieldKey: "zaznam/kodzmeny", headerKey: "", canNavigate: !!(emp.fields && emp.fields["zaznam/kodzmeny"]),
            message: "Kód „" + kod + "“ (" + STATE_PAIR_CODES[kod] + ") se obvykle oznamuje na dvou řádcích spolu s kódem „P“ (nástup) pro stejnou osobu — kód „P“ pro toto číslo pojištěnce ve formuláři chybí. Pokud již byl nástup oznámen dříve, upozornění ignorujte."
          });
        }
      }
    });

    // duplicity (stejné číslo + kód + datum)
    emps.forEach(function (emp, idx) {
      var kod = val(emp, "zaznam/kodzmeny");
      var cislo = val(emp, "zaznam/cisloPojistence");
      var datum = val(emp, "zaznam/datumZmeny");
      if (!cislo) return;
      var arr = byPerson[cislo] || [];
      var dup = arr.some(function (r) { return r.idx < idx && r.kod === kod && r.datum === datum; });
      if (dup) {
        push(out, {
          _p: "HOZ", severity: "warning", empIndex: idx, employeeName: empName(emp, idx),
          sectionLabel: "Změna zaměstnance", fieldLabel: "Číslo pojištěnce",
          fieldKey: "zaznam/cisloPojistence", headerKey: "", canNavigate: !!(emp.fields && emp.fields["zaznam/cisloPojistence"]),
          message: "Stejné číslo pojištěnce má opakovaně kód „" + kod + "“ se stejným datem (" + (datum || "?") + ") — možná duplicita."
        });
      }
    });

    return out;
  }

  // =========================================================================
  // PPPZ — Přehled platby zaměstnavatele
  // =========================================================================
  function runPPPZ(doc, employees) {
    var out = [];
    var emps = employees || [];

    checkEmployerIco(doc, out, "PPPZ");

    var emp = emps[0];
    if (!emp) return out;

    var mesic = parseInt(val(emp, "udajePlatby/mesicHlaseni"), 10);
    var rok = parseInt(val(emp, "udajePlatby/rokHlaseni"), 10);
    var pocet = parseInt(val(emp, "udajePlatby/pocetZamestnancu"), 10);
    var zaklad = parseFloat((val(emp, "udajePlatby/soucetZakladuPojistneho") || "").replace(",", "."));
    var pojistne = parseInt(val(emp, "udajePlatby/soucetPojistneho"), 10);
    var base = { empIndex: 0, employeeName: empName(emp, 0), sectionLabel: "Údaje platby" };

    if (!isNaN(rok) && !isNaN(mesic)) {
      var now = new Date();
      var periodEnd = new Date(rok, mesic, 0);
      if (periodEnd > now) {
        push(out, Object.assign({}, base, {
          _p: "PPPZ", severity: "warning", fieldLabel: "Měsíc hlášení",
          fieldKey: "udajePlatby/mesicHlaseni", headerKey: "", canNavigate: !!(emp.fields && emp.fields["udajePlatby/mesicHlaseni"]),
          message: "Vykazované období " + mesic + "/" + rok + " je v budoucnosti."
        }));
      }
    }

    if (!isNaN(zaklad) && !isNaN(pojistne)) {
      var theoretical = Math.round(zaklad * 0.135);
      var minBound = Math.floor(zaklad * 0.135);
      var maxBound = Math.ceil(zaklad * 0.135) + Math.max(1, isNaN(pocet) ? 1 : pocet);
      if (pojistne < minBound || pojistne > maxBound) {
        push(out, Object.assign({}, base, {
          _p: "PPPZ", severity: "warning", fieldLabel: "Součet pojistného",
          fieldKey: "udajePlatby/soucetPojistneho", headerKey: "", canNavigate: !!(emp.fields && emp.fields["udajePlatby/soucetPojistneho"]),
          message: "Součet pojistného (" + pojistne + " Kč) neodpovídá 13,5 % ze součtu vyměřovacích základů. Teoreticky očekáváno přibližně " + theoretical + " Kč (z " + (isNaN(zaklad) ? "?" : zaklad.toFixed(2)) + " Kč). Rozdíl může vzniknout zaokrouhlováním po jednotlivých zaměstnancích — ověřte výpočet."
        }));
      }
    }

    return out;
  }

  window.HOZKontroly = {
    runKontroly: function (xmlDoc, employees) { return runHOZ(xmlDoc, employees); },
    resetKontrolyIndex: resetKontrolyIndex
  };
  window.PPPZKontroly = {
    runKontroly: function (xmlDoc, employees) { return runPPPZ(xmlDoc, employees); },
    resetKontrolyIndex: resetKontrolyIndex
  };
})();
