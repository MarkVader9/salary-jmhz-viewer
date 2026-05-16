# SALARY JMHZ Ekosystém
**Komplexní klientská infrastruktura pro validaci a vizualizaci mzdových dat**

> Od 1. března 2024 jsme v reakci na novou legislativu Jednotného měsíčního hlášení zaměstnavatele (JMHZ) zahájili vývoj dedikované webové aplikace. Naším cílem bylo poskytnout zaměstnavatelům a vývojářům spolehlivou XSD a XML infrastrukturu pro mzdové a účetní softwary v České republice.

Tato iniciativa rychle přerostla z úvodního technologického konceptu v plnohodnotný softwarový ekosystém. Projekt **SALARY JMHZ Viewer & Knihovna** překlenuje propast mezi vysoce komplexní datovou strukturou státní správy (ČSSZ) a reálnou provozní agendou. Vytvořili jsme nástroj, který abstrahuje složitost XML vrstvy a poskytuje čisté, uživatelsky orientované rozhraní pro každodenní práci.

Naší vizí je definovat technologický standard, který eliminuje frustraci z takzvaných "černých skříněk" při odesílání dat. Vracíme plnou kontrolu nad citlivými mzdovými a personálními daty zpět do rukou těch, kteří s nimi reálně pracují.

---

## Architektura a Ekosystém

Náš ekosystém je postaven na dvou vzájemně integrovaných pilířích:

### 1. JMHZ VIEWER (Analytický a vizualizační engine)
Při návrhu architektury bylo absolutním imperativem dodržení principu **Zero Data Leakage** (nulový únik dat). Vzhledem k extrémní citlivosti osobních a mzdových údajů běží celá aplikace striktně v izolovaném prostředí klientského prohlížeče (Client-Side). Neukládáme ani neodesíláme žádná data na backendové servery. Veškeré kritické operace – od parsování objemných XML souborů až po generování exportů – probíhají lokálně na koncovém zařízení uživatele.

**Klíčové technologické inovace:**
* **Striktní XSD a heuristická validace:** Implementovali jsme nativní XML parser běžící nad WebAssembly (WASM), doplněný o vrstvu expertních heuristických kontrol. Tento mechanismus zachycuje formální i logické anomálie dříve, než dojde k odeslání a případnému odmítnutí databází ČSSZ.
* **Autodetekce kódování (Legacy Support):** Systém je vybaven inteligentní detekcí kódování `Windows-1250 / UTF-8`. Plynule tak řeší dlouholetý problém s korupcí diakritiky u CSV metadat exportovaných z různých mzdových systémů (Vema, KS Mzdy, Helios aj.), a to zcela bez nutnosti manuálního zásahu.
* **Integrované vývojářské prostředí (IDE):** Pro řešení poškozených XML struktur jsme do Vieweru přímo integrovali **Monaco Editor** (jádro VS Code). Tento fallback mechanismus umožňuje bezpečně provádět hromadné datové korekce (Find & Replace) přímo v aplikaci.
* **Kontextová nápověda (Znalostní injekce):** Komplexní mapování XSD nomenklatury do srozumitelného jazyka. Datová pole jsou dynamicky napojena na náš centrální slovník, který v reálném čase vysvětluje legislativní kontext a pravidla pro validní vyplnění.

### 2. JMHZ KNIHOVNA (Znalostní báze)
Druhým pilířem je responzivní znalostní báze, navržená pro maximální přehlednost a rychlost vyhledávání. Poskytuje ucelený legislativní a technický rámec v čistém UI formátu.
* Z pohledu frontendové architektury uplatňujeme filozofii **Single Source of Truth** pro kaskádové styly (CSS), což zajišťuje konzistentní a profesionální korporátní identitu s plnou podporou pro mobilní zařízení.
* Funguje jako primární distribuční kanál pro metodiky, postupy řešení nejčastějších chyb (Troubleshooting) a sdílení best-practices.

---

## Cílové publikum

Ekosystém SALARY JMHZ je exkluzivně navržen pro dvě klíčové skupiny uživatelů:

1. **Mzdové účetní, HR specialisté a auditoři:** Nástroj okamžitě transformuje nečitelný strojový XML kód do přehledných, interaktivních zaměstnaneckých karet a tabulkových přehledů. Umožňuje bezpečně vizualizovat, kontrolovat a auditovat obsah měsíčního hlášení před jeho nevratným odesláním na úřad.
2. **Vývojáři a analytici mzdových softwarů:** Získávají vysoce specializovaný, robustní testovací nástroj pro ladění svých XML exportů (jak pro formát REGZEC, tak JMHZ). Okamžitá zpětná vazba z lokálního XSD validátoru dramaticky zkracuje vývojové a testovací cykly.

---

## Závěrečné slovo
> *"Pojali jsme vývoj infrastruktury JMHZ jako závazek dokázat, že i rozhraní pro komunikaci se státní byrokracií může být moderní, agilní a vysoce bezpečné. Naše architektura ukazuje, že striktní bezpečnost a výkon nemusí být v konfliktu s vynikajícím uživatelským zážitkem (UX). V SALARY s.r.o. jsme hrdí na to, že dodáváme nástroj, který účetním a vývojářům šetří čas, eliminuje provozní slepé uličky a přináší jistotu při zpracování dat."*

---

### Technologický Stack & Architektura
Projekt je postaven na webových technologiích s důrazem na maximální výkon, bezpečnost (Client-Side Only) a modularitu.

* **Jádro & UI vrstva:** `JavaScript (ES6+)`, `SolidJS` (Fine-grained reaktivita bez použití virtuálního DOMu pro extrémní výkon renderování)
* **Build & Kompilace:** `SWC (Speedy Web Compiler)` (Rust-based kompilátor zajišťující vysoce optimalizovaný build, minimalizaci kódu a pokročilý Tree-Shaking pro nejrychlejší *Time-to-Interactive*)
* **Validace & Data Processing:** `WASM (xmllint)` (Nativní C/C++ validátor kompilovaný do WebAssembly), `Web Workers API` (Asynchronní paralelizace výpočtů pro Non-Blocking UI při parsování gigabajtových XML)
* **Bezpečnost & Sanitizace (Zero-Trust):** Striktní `CSP (Content Security Policy)`, `DOMPurify` (Ochrana proti XSS útokům při vizualizaci externích dat), `Blob Proxy Workers` (Bezpečné obcházení CORS restrikcí)
* **Vývojářské nástroje & Exporty:** `Monaco Editor` (Engine Microsoft VS Code pro in-browser úpravy), `SheetJS (XLSX)` (Binární generování Excel reportů), `WeasyPrint` (Tiskové a PDF výstupy)
