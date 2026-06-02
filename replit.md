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

## Publishing
Deployment je nastaven jako autoscale (`node server.js`). Pro produkci se obsah nahrává na FTP jako statické soubory.

## User preferences
- Komunikace v češtině.
- Veškerá funkcionalita musí běžet 100 % v prohlížeči, servírovaná staticky z FTP — žádná databáze, žádné PHP/SQL.
