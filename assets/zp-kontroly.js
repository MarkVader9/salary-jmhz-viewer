(function () {
  "use strict";

  function directChildren(parent) {
    if (!parent) return [];
    return Array.prototype.filter.call(parent.childNodes, function (n) { return n.nodeType === 1; });
  }
  function childByName(parent, name) {
    return directChildren(parent).find(function (e) { return e.localName === name; }) || null;
  }
  function childrenByName(parent, name) {
    return directChildren(parent).filter(function (e) { return e.localName === name; });
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

  function pushIssue(arr, level, code, message, location) {
    arr.push({ level: level, code: code, message: message, location: location || "" });
  }

  var STATE_PAIR_CODES = { D: "důchodce", I: "uchazeč o zaměstnání", G: "nezaopatřené dítě / student" };

  function runHOZ(doc) {
    var issues = [];
    var root = doc.documentElement;

    var idZam = childByName(root, "identifikaceZamestnavatele");
    if (idZam) {
      var icp = childText(idZam, "identifikacniCisloPlatce");
      if (icp && /^\d{10}$/.test(icp)) {
        var ico = icp.substr(0, 8);
        var orgUnit = icp.substr(8, 2);
        if (orgUnit !== "99" && !validIco(ico)) {
          pushIssue(issues, "warning", "HOZ-ICO",
            "IČ plátce „" + ico + "“ nemá platný kontrolní součet (modulo 11). Ověřte číslo plátce pojistného.",
            "identifikaceZamestnavatele / identifikacniCisloPlatce");
        }
      }
    }

    var seznam = childByName(root, "seznamZmenZamestnancu");
    var zmeny = seznam ? childrenByName(seznam, "zmenaZamestance") : [];
    var today = new Date();
    today.setHours(23, 59, 59, 999);

    var byPerson = {};
    zmeny.forEach(function (z, idx) {
      var kod = childText(z, "kodzmeny");
      var cislo = childText(z, "cisloPojistence");
      var datum = childText(z, "datumZmeny");
      var prijmeni = childText(z, "prijmeni") || "";
      var jmeno = childText(z, "jmeno") || "";
      var loc = "Řádek " + (idx + 1) + " (" + prijmeni + " " + jmeno + ")";

      if (cislo) {
        if (kod === "E" || kod === "C") {
          if (!/^[MZ]\d{8}$/.test(cislo)) {
            pushIssue(issues, "warning", "HOZ-CIZ-FORMAT",
              "U kódu „" + kod + "“ (první přihlášení cizince/občana EU bez trvalého pobytu) se očekává identifikátor ve tvaru pohlaví + datum narození (např. M05071980), nikoli rodné číslo.",
              loc);
          } else if (!plausibleForeignerId(cislo)) {
            pushIssue(issues, "warning", "HOZ-CIZ-DATUM",
              "Identifikátor cizince „" + cislo + "“ obsahuje nesmyslné datum narození.",
              loc);
          }
        } else {
          if (/^[MZ]\d{8}$/.test(cislo)) {
            pushIssue(issues, "warning", "HOZ-CIZ-JINY-KOD",
              "Identifikátor ve tvaru pohlaví + datum narození („" + cislo + "“) je určen jen pro první přihlášení cizince (kódy E/C). U kódu „" + kod + "“ se očekává přidělené číslo pojištěnce.",
              loc);
          } else if (/^\d{10}$/.test(cislo) && !rcDivisibleBy11(cislo)) {
            pushIssue(issues, "warning", "HOZ-RC-MOD11",
              "Číslo pojištěnce „" + cislo + "“ (10 číslic) není dělitelné 11 — pravděpodobně nejde o platné rodné číslo. Pokud jde o číslo přidělené pojišťovnou, upozornění ignorujte.",
              loc);
          }
        }
      }

      var dt = parseIsoDate(datum);
      if (dt && dt > today) {
        pushIssue(issues, "warning", "HOZ-DATUM-BUDOUCNOST",
          "Datum změny „" + datum + "“ je v budoucnosti.",
          loc);
      }

      if (kod === "X") {
        pushIssue(issues, "info", "HOZ-OPRAVA-X",
          "Kód „X“ (oprava čísla pojištěnce) — na dalším řádku musí být uveden kód „P“ se správným číslem pojištěnce.",
          loc);
      }
      if (kod === "Y") {
        pushIssue(issues, "info", "HOZ-OPRAVA-Y",
          "Kód „Y“ opravuje datum přihlášení — ověřte správnost data změny.",
          loc);
      }
      if (kod === "Z") {
        pushIssue(issues, "info", "HOZ-OPRAVA-Z",
          "Kód „Z“ opravuje datum odhlášení — ověřte správnost data změny.",
          loc);
      }

      if (cislo) {
        if (!byPerson[cislo]) byPerson[cislo] = [];
        byPerson[cislo].push({ kod: kod, datum: datum, loc: loc, idx: idx });
      }
    });

    zmeny.forEach(function (z, idx) {
      var kod = childText(z, "kodzmeny");
      var cislo = childText(z, "cisloPojistence");
      var prijmeni = childText(z, "prijmeni") || "";
      var jmeno = childText(z, "jmeno") || "";
      var loc = "Řádek " + (idx + 1) + " (" + prijmeni + " " + jmeno + ")";
      if (STATE_PAIR_CODES[kod] && cislo) {
        var hasP = (byPerson[cislo] || []).some(function (r) { return r.kod === "P"; });
        if (!hasP) {
          pushIssue(issues, "warning", "HOZ-PAR-P",
            "Kód „" + kod + "“ (" + STATE_PAIR_CODES[kod] + ") se obvykle oznamuje na dvou řádcích spolu s kódem „P“ (nástup) pro stejnou osobu — kód „P“ pro toto číslo pojištěnce ve formuláři chybí. Pokud již byl nástup oznámen dříve, upozornění ignorujte.",
            loc);
        }
      }
    });

    Object.keys(byPerson).forEach(function (cislo) {
      var seen = {};
      byPerson[cislo].forEach(function (r) {
        var key = r.kod + "|" + r.datum;
        if (seen[key]) {
          pushIssue(issues, "warning", "HOZ-DUPLICITA",
            "Stejné číslo pojištěnce má opakovaně kód „" + r.kod + "“ se stejným datem (" + (r.datum || "?") + ") — možná duplicita.",
            r.loc);
        }
        seen[key] = true;
      });
    });

    return finalize(issues, { pocetZmen: zmeny.length });
  }

  function runPPPZ(doc) {
    var issues = [];
    var root = doc.documentElement;

    var idZam = childByName(root, "identifikaceZamestnavatele");
    if (idZam) {
      var icp = childText(idZam, "identifikacniCisloPlatce");
      if (icp && /^\d{10}$/.test(icp)) {
        var ico = icp.substr(0, 8);
        var orgUnit = icp.substr(8, 2);
        if (orgUnit !== "99" && !validIco(ico)) {
          pushIssue(issues, "warning", "PPPZ-ICO",
            "IČ plátce „" + ico + "“ nemá platný kontrolní součet (modulo 11). Ověřte číslo plátce pojistného.",
            "identifikaceZamestnavatele / identifikacniCisloPlatce");
        }
      }
    }

    var udaje = childByName(root, "udajePlatby");
    var meta = {};
    if (udaje) {
      var mesic = parseInt(childText(udaje, "mesicHlaseni"), 10);
      var rok = parseInt(childText(udaje, "rokHlaseni"), 10);
      var pocet = parseInt(childText(udaje, "pocetZamestnancu"), 10);
      var zaklad = parseFloat(childText(udaje, "soucetZakladuPojistneho"));
      var pojistne = parseInt(childText(udaje, "soucetPojistneho"), 10);

      meta.mesic = mesic; meta.rok = rok; meta.pocet = pocet;
      meta.zaklad = zaklad; meta.pojistne = pojistne;

      if (!isNaN(rok) && !isNaN(mesic)) {
        var now = new Date();
        var periodEnd = new Date(rok, mesic, 0);
        if (periodEnd > now) {
          pushIssue(issues, "warning", "PPPZ-OBDOBI-BUDOUCNOST",
            "Vykazované období " + mesic + "/" + rok + " je v budoucnosti.",
            "udajePlatby");
        }
      }

      if (!isNaN(zaklad) && !isNaN(pojistne)) {
        var theoretical = Math.round(zaklad * 0.135);
        meta.theoretical = theoretical;
        var minBound = Math.floor(zaklad * 0.135);
        var maxBound = Math.ceil(zaklad * 0.135) + Math.max(1, isNaN(pocet) ? 1 : pocet);
        if (pojistne < minBound || pojistne > maxBound) {
          pushIssue(issues, "warning", "PPPZ-SOUCET",
            "Součet pojistného (" + pojistne + " Kč) neodpovídá 13,5 % ze součtu vyměřovacích základů. Teoreticky očekáváno přibližně " + theoretical + " Kč (z " + (isNaN(zaklad) ? "?" : zaklad.toFixed(2)) + " Kč). Rozdíl může vzniknout zaokrouhlováním po jednotlivých zaměstnancích — ověřte výpočet.",
            "udajePlatby / soucetPojistneho");
        }
      }

      if (!isNaN(pocet) && pocet > 0 && !isNaN(zaklad)) {
        meta.avgBase = zaklad / pocet;
      }
    }

    var typPrehledu = childText(root, "typPrehledu");
    meta.typPrehledu = typPrehledu;

    return finalize(issues, meta);
  }

  function finalize(issues, meta) {
    var errors = issues.filter(function (i) { return i.level === "error"; });
    var warnings = issues.filter(function (i) { return i.level === "warning"; });
    var info = issues.filter(function (i) { return i.level === "info"; });
    return { errors: errors, warnings: warnings, info: info, meta: meta || {} };
  }

  window.ZPKontroly = {
    runHOZ: runHOZ,
    runPPPZ: runPPPZ,
    helpers: {
      childByName: childByName,
      childrenByName: childrenByName,
      childText: childText,
      directChildren: directChildren
    }
  };
})();
