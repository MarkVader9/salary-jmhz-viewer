# SALARY JMHZ Ecosystem

## Overview
Statický web (běží 100 % v prohlížeči, servírovaný z FTP) pro práci s mzdovými formuláři JMHZ a REGZEC. Žádný backend, žádná databáze, žádné PHP/SQL — veškerá logika je na straně klienta.

Dvě aplikace:
- **JMHZ VIEWER** (kořen `/`) — předkompilovaná SolidJS aplikace pro validaci a vizualizaci XML souborů JMHZ / REGZEC. Validace běží přes WASM (xmllint), editor přes Monaco. Zdrojový kód SolidJS NENÍ v repu — jen sestavené balíčky v `assets/` a `vendor/`, mapované přes `manifest.js`.
- **JMHZ KNIHOVNA** (`/knihovna-jmhz/`) — znalostní báze a školení (LMS). Čte data z `databaze-knihovny.json`. `admin.html` je plně klientský editor: ukládá rozdělanou práci do `localStorage` a exportuje `databaze-knihovny.json` ke stažení a ručnímu nahrání na FTP.

## Architecture
- `server.js` — jednoduchý Node HTTP server (port 5000, 0.0.0.0) pouze pro Replit preview. Servíruje statické soubory, podporuje HTTP Range (video/audio), blokuje citlivé přípony a adresáře. V produkci roli serveru přebírá FTP/Apache.
- Obě aplikace mají PWA: `app.webmanifest` + `sw.js` (offline režim, stale-while-revalidate) a sdílenou ikonu `icon.svg`.
- CSP je nastaveno přes `<meta http-equiv>` v každé HTML stránce.

## Údržba VZP formátů (HOZ / PPPZ) — postup při změně legislativy nebo XSD
Když pojišťovny změní legislativu nebo XSD schémata, uprav podle typu změny:

1. **Změna XSD schématu** (nová/odebraná položka, jiný limit délky, nový číselník, nová verze kódu podání)
   → `data/zp-xsd-data.js`. Obsahuje `HOZ_SCHEMAS` a `PPPZ_SCHEMAS`. Každé schéma je uložené jako jeden zaescapovaný textový řetězec (uvozovky `\"`, konce řádků `\n` u HOZ / `\r\n` u PPPZ) — nelze vložit surový `.xsd`, musí se převést. Tady se mění i fixní kódy verze `identifikacePredmetuPodaniKod`.
2. **Co se zobrazuje v kartách / tabulce / hlavičce** (nové pole na obrazovku, popisek, pořadí)
   → `assets/zp-formats.js` (`fields`, `_headerSpec`, `getRowLabel`/`getRowInfo`, `_childOrder`). Pozn.: každý config musí mít objekt `stats`, jinak runtime spadne při načtení (viz `.agents/memory/zp-format-config-contract.md`).
3. **Kontrolní / legislativní logika** (validace IČO, rodného čísla, dat, sazby, povinné kombinace)
   → `assets/zp-kontroly.js` (kontrakt `runKontroly`/`resetKontrolyIndex`).
4. **Po KAŽDÉ změně** zvedni číslo `CACHE` v `sw.js` (např. `jmhz-viewer-v4` → `v5`) a nahraj na FTP, jinak zůstane stará verze v cache.

Vyžaduje úpravu i ve zkompilovaném jádře (`assets/viewer.runtime_*.js`, rozpoznání formátu), takže to řeš s agentem: **změna namespace / verze v adrese** (`…/v1` → `…/v2`) nebo **úplně nový typ formuláře**. Nový `.xsd` soubor je nejbezpečnější předat agentovi k převodu do zaescapovaného tvaru.

## Publishing
Deployment je nastaven jako autoscale (`node server.js`). Pro produkci se obsah nahrává na FTP jako statické soubory.

## User preferences
- Komunikace v češtině.
- Veškerá funkcionalita musí běžet 100 % v prohlížeči, servírovaná staticky z FTP — žádná databáze, žádné PHP/SQL.
