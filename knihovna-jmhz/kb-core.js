/**
 * =================================================================
 * SALARY KB - CORE JAVASCRIPT (kb-core.js)
 * Sdílená logika pro JMHZ Knihovnu (API, Notifikace, Validace)
 * =================================================================
 */

const KB_CONFIG = {
    LOCAL_BACKUP_KEY: 'jmhz_kb_offline_backup',
    // Publikovaná data jsou statický soubor na FTP – žádná databáze ani backend.
    DB_URL: 'databaze-knihovny.json',

    // Daty řízená pravidla (Rule Engine)
    rules: [

        { id: 'R1', field: 'title', type: 'required', msg: 'Článek musí mít vyplněný nadpis.' },
        { id: 'R2', field: 'content', type: 'required', msg: 'Obsah článku nesmí být prázdný.' },
        { id: 'R3', field: 'categoryId', type: 'required', msg: 'Pro veřejné publikování musí být vybrána kategorie.', cond: (d) => d.status === 'public' }
    ]
};

// --- SONNER-LITE TOAST SYSTÉM ---
const KB_Toaster = {
    container: null,
    init() {
        // CSS styly notifikací přesunuty do library-style.css
        this.container = document.createElement('div');
        this.container.className = 'kb-toaster';
        document.body.appendChild(this.container);
    },
    show(title, desc = '', type = 'info') {
                
                
        if (!this.container) this.init();
        const t = document.createElement('div');
        t.className = `kb-toast kb-toast-${type}`;
        const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
        t.innerHTML = `
            <div class="kb-toast-icon">${icons[type] || icons.info}</div>
            <div class="kb-toast-content">
                <span class="kb-toast-title">${title}</span>
                ${desc ? `<span class="kb-toast-desc">${desc}</span>` : ''}
            </div>`;
        this.container.appendChild(t);
        requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
        setTimeout(() => {
            t.classList.remove('show');
            setTimeout(() => t.remove(), 300);
        }, 4500);
    }
};

/**
 * =================================================================
 * CENTRÁLNÍ NOTIFIKAČNÍ SYSTÉM (Zvoneček, Dropdown, Modaly)
 * =================================================================
 */
const MOCK_NOTIFICATIONS = [
    {
        id: "notif_001",
        date: "2026-05-11T09:30:00Z",
        title: "Aktualizace metodiky REGZEC",
        content: "V následujícíh dnech zde do SALARY KNIHOVNA JMHZ přibydou jednotlivé číselníky vedoucí z jednotlivých informačních bublin Infohlášek které existují v prostředí SALARY Prohlížeče JMHZ Formulářů pro rychlý náhled konkrétního s danou Infohláškou souvisejícího číselníku JMHZ. <strong>Ukázka budoucích souborů ke stažení následovně (Test Pouze)</strong>. [PRILOHA: metodika_05_2026.pdf | Stáhnout novou metodiku (Test Pouze)]",
        tags: ["REGZEC", "Důležité"]
    },
    {
        id: "notif_002",
        date: "2026-05-12T17:15:00Z",
        title: "Nový kurz pro Mzdové Účetní přidán do sekce Školení",
        content: "Přidali jsme nový interaktivní kurz zaměřený na Používání Webové Aplikace SALARY Prohlížeče JMHZ Formulářů. <br><br>Kurz si můžete spustit v hlavní nabídce knihovny, a nebo na tomto odkaze <a href=\"lms.html?course=kurz_jmhz_prohlizec\">Přejít na Kurz</a>",
        tags: ["Kurzy", "Nové"]
    },{
        id: "notif_004",
        date: "2026-05-13T07:26:33Z",
        title: "Byl Přidán Nový JMHZ Číselník",
        content: "Nově byl do knihovny přidán nový JMHZ Číselník Okresů. <br><br>Je možné si jej přečíst na tomto odkaze <a href=\"clanek.html?id=jmhz_ciselnik_okresu\">Přejít na Nový Číselník</a>",
        tags: ["JMHZ","Číselníky", "Nové"]
    },
	    {
        id: "notif_005",
        date: "2026-05-23T14:54:00Z",
        title: "Aktualizace Číselníků Legislativy JMHZ",
        content: "V následujícíh dnech zde do SALARY KNIHOVNA JMHZ stále přibývají jednotlivé číselníky poslední květnové aktualizace Legislativy JMHZ.",
        tags: ["Číselníky JMHZ", "Důležité"]
    },	    
	{
    id: "notif_006",
    date: "2026-05-26T06:59:36Z",
    title: "Nový dokument v JMHZ KNIHOVNA: Předregistrace Zaměstnance (PREZEC)",
    content: `Vážené mzdové účetní,<br><br> do knihovny byl přidán článek k procesu PREZEC. Od 1. 7. 2026 nám nová legislativa nařizuje přihlásit zaměstnance do evidence ČSSZ nejpozději před okamžikem jeho nástupu do práce.<br><br>Článek detailně popisuje tzv. částečné přihlášení (PREZEC), při kterém hlásíme pouze 8 základních údajů. Berte prosím na vědomí, že tento postup je záložní variantou pro případy, kdy před nástupem občana ČR nestihnete shromáždit všechny potřebné podklady.<br><br> Naším cílem zůstává obdržet 100 % dat včas a podat rovnou plnou registraci (REGZEC – akce 1). Tím se administrativně náročnějšímu procesu PREZEC vyhnete. (Pro cizince je navíc PREZEC zákonem zakázán).<br><br> Když ale podklady chybí, manuál vás provede, jak podat PREZEC akci P1 (Předpokládaný Nástup), PREZEC akci P2 (Oznámení o Nenastoupení), a také jak správně pohlídat lhůty.<br><br>Prosím, prostudujte si celý dokument <a href="https://www.salary.cz/jmhz2026/knihovna-jmhz/clanek.html?id=DIR-HR-IT-PREZEC-2026-(R1.1)"> v naší knihovně na tomto odkaze zde.</a><br><br>`,
    tags: ["JMHZ Legislativa", "Důležité", "PREZEC"]
    },
	{
    id: "notif_009",
    date: "2026-05-27T22:02:19Z",
    title: "Proběhla Aktualizace dnes 27. KVĚTNA 2026 v Novém dokumentu v JMHZ KNIHOVNA: Předregistrace Zaměstnance (PREZEC) (Revize-002)",
    content: `AKTUALIZACE INFORMACÍ: Zásadní procesní úprava: Definování jak zákonný rámec JMHZ chápe u REGZEC a PREZEC procesů obsah 100% set (sady) dat od nově nastupujícího zaměstnance v procesech REGZEC a nově v zástupných procesech PREZEC.<br><br>Celý tento nově aktualizovaný článek naleznete <a href="https://www.salary.cz/jmhz2026/knihovna-jmhz/clanek.html?id=DIR-HR-IT-PREZEC-2026-(R1.1)"> v naší knihovně na tomto odkaze zde.</a><br><br>`,
    tags: ["JMHZ Legislativa", "Důležité", "PREZEC"]
	},
    {
    id: "notif_010",
    date: "2026-06-01T22:25:45Z",
    title: "Vydání Nového dokumentu: Nová Legislativa Pojišťovny PPPZ(PPZ) a HOZ 2026 (Revize-001)",
    content: `AKTUALIZACE INFORMACÍ: Vydání nového komplexního analytického a implementačního manuálu (SOP-HR-IT-001) k přechodu na výhradně elektronické formáty zdravotních pojišťoven platné od 1. ledna 2026. Dokument detailně pokrývá všech 42 klíčových procesních a technologických otázek rozdělených pro role Mzdové účetní a IT Developera, včetně nové logiky kódů státních pojištěnců, mzdových limitů a striktních validačních XSD pravidel pro HOZ a PPPZ.<br><br>Celý tento nově vydaný článek a manuál naleznete <a href="https://www.salary.cz/jmhz2026/knihovna-jmhz/clanek.html?id=Nov%C3%A1_Legislativa_Poji%C5%A1%C5%A5ovny_PPPZ(PPZ)_a_HOZ_2026"> v naší knihovně na tomto odkaze zde.</a><br><br>`,
    tags: ["Zdravotní Pojišťovny Legislativa", "Důležité", "HOZ a PPPZ"]
	},
	{
    id: "notif_011",
    date: "2026-06-02T06:36:36Z",
    title: "Vydání Revize 002 Nového dokumentu: Nová Legislativa Pojišťovny PPPZ(PPZ) a HOZ 2026 (Revize-002)",
    content: `AKTUALIZACE INFORMACÍ: Vydání nového komplexního analytického a implementačního manuálu (SOP-HR-IT-002) k přechodu na výhradně elektronické formáty zdravotních pojišťoven platné od 1. ledna 2026. Dokument detailně pokrývá všech 42 klíčových procesních a technologických otázek rozdělených pro role Mzdové účetní a Vývojovou Divizi SALARY s.r.o., včetně nové logiky kódů státních pojištěnců, mzdových limitů a striktních validačních XSD Schematických pravidel pro HOZ a PPPZ.<br><br>Celý tento nově vydaný článek a manuál naleznete <a href="https://www.salary.cz/jmhz2026/knihovna-jmhz/clanek.html?id=Nov%C3%A1_Legislativa_Poji%C5%A1%C5%A5ovny_PPPZ(PPZ)_a_HOZ_2026"> v naší knihovně na tomto odkaze zde.</a><br><br>`,
    tags: ["Zdravotní Pojišťovny Legislativa", "Důležité", "HOZ a PPPZ"]
	},
];

const KB_Notifications = {
    data: [],
    readIds: new Set(),
    dropdownOpen: false,
    currentListMode: 'new',
    
    init() {
        const saved = localStorage.getItem('jmhz_notifs_read');
        if (saved) {
            try { this.readIds = new Set(JSON.parse(saved)); } catch(e) {}
        }
        
        this.data = MOCK_NOTIFICATIONS.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.injectUI();
    },

    saveReadState() {
        localStorage.setItem('jmhz_notifs_read', JSON.stringify([...this.readIds]));
    },

    getUnread() { return this.data.filter(n => !this.readIds.has(n.id)); },
    getArchive() { return this.data.filter(n => this.readIds.has(n.id)); },

    injectUI() {
        // Hledáme POUZE pravou část horní lišty
        const targetContainer = document.querySelector('.toolbar-right');
        
        if (!targetContainer) {
            // Jelikož lištu generuje library-ui.js dynamicky, počkáme, až se vytvoří
            setTimeout(() => this.injectUI(), 100);
            return;
        }

        if (document.getElementById('kbNotifWrapper')) return;

        const wrapper = document.createElement('div');
        wrapper.id = 'kbNotifWrapper';
        wrapper.className = 'notif-wrapper';
        wrapper.innerHTML = `
            <button class="notif-btn" id="kbNotifBtn" title="Oznámení">🔔<span class="notif-badge" id="kbNotifBadge" style="display:none;">0</span></button>
            <div class="notif-dropdown" id="kbNotifDropdown">
                <div class="notif-dropdown-header">Oznámení</div>
                <div class="notif-dropdown-body" id="kbNotifDropBody"></div>
                <div class="notif-dropdown-footer">
                    <button class="btn primary" id="kbBtnAllNew">Všechna Nová Oznámení</button>
                    <button class="btn" id="kbBtnArchive">Archiv Oznámení</button>
                </div>
            </div>
        `;

        // Vložíme zvoneček PŘED tlačítko hamburger menu
        targetContainer.insertBefore(wrapper, targetContainer.firstChild);

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = `
            <div class="notif-modal-overlay" id="kbNotifDetailModal">
                <div class="notif-modal-content">
                    <div class="notif-modal-header">
                        <h2>Detail oznámení</h2>
                        <button class="notif-modal-close" id="kbNotifDetailClose">&times;</button>
                    </div>
                    <div class="notif-modal-body notif-reader" id="kbNotifDetailBody"></div>
                </div>
            </div>

            <div class="notif-modal-overlay" id="kbNotifListModal">
                <div class="notif-modal-content">
                    <div class="notif-modal-header">
                        <h2 id="kbNotifListTitle">Nová oznámení</h2>
                        <button class="notif-modal-close" id="kbNotifListClose">&times;</button>
                    </div>
                    <div class="notif-search-bar">
                        <input type="text" id="kbNotifSearch" placeholder="Hledat v oznámeních...">
                    </div>
                    <div class="notif-modal-body" style="padding:0;" id="kbNotifListBody"></div>
                    <div class="notif-dropdown-footer" style="border-radius: 0 0 8px 8px;">
                        <button class="btn primary" id="kbBtnToggleListMode">Přejít do Archivu Oznámení</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalContainer);

        // Event Listenery
        document.getElementById('kbNotifBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('kbNotifDropdown');
            if (this.dropdownOpen && !e.target.closest('#kbNotifWrapper')) {
                dropdown.classList.remove('show');
                this.dropdownOpen = false;
            }
        });

        document.getElementById('kbBtnAllNew').addEventListener('click', () => this.openListModal('new'));
        document.getElementById('kbBtnArchive').addEventListener('click', () => this.openListModal('archive'));

        document.getElementById('kbNotifDetailClose').addEventListener('click', () => {
            document.getElementById('kbNotifDetailModal').classList.remove('show');
            this.updateBadge();
        });
        document.getElementById('kbNotifListClose').addEventListener('click', () => {
            document.getElementById('kbNotifListModal').classList.remove('show');
            this.updateBadge();
        });

        document.getElementById('kbNotifSearch').addEventListener('input', (e) => {
            this.renderListBody(this.currentListMode, e.target.value);
        });

        document.getElementById('kbBtnToggleListMode').addEventListener('click', () => {
            const newMode = this.currentListMode === 'new' ? 'archive' : 'new';
            this.openListModal(newMode);
        });

        this.updateBadge();
    },

    updateBadge() {
        const unreadCount = this.getUnread().length;
        const badge = document.getElementById('kbNotifBadge');
        if (badge) {
            if (unreadCount > 0) {
                badge.style.display = 'flex';
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            } else {
                badge.style.display = 'none';
            }
        }
    },

    toggleDropdown() {
        const dropdown = document.getElementById('kbNotifDropdown');
        this.dropdownOpen = !this.dropdownOpen;
        
        if (this.dropdownOpen) {
            this.renderDropdownBody();
            dropdown.classList.add('show');
        } else {
            dropdown.classList.remove('show');
        }
    },

    formatDate(isoString) {
        const d = new Date(isoString);
        return d.toLocaleDateString('cs-CZ') + ' ' + d.toLocaleTimeString('cs-CZ', {hour: '2-digit', minute:'2-digit'});
    },

    parseContentHtml(text) {
        let html = text;
        // Relativní cesty – funguje z FTP i z jakéhokoli jiného hostingu bez úprav.
        const mediaBase = "media/";
        const docxBase = "dokumenty/";

        html = html.replace(/\[VIDEO:\s*(.+?)\]/gi, (m, src) => {
            src = src.trim(); if(!src.startsWith('http')) src = mediaBase + src;
            return `<div class="media-wrapper" style="margin:15px 0;"><video controls style="max-width:100%; border-radius:6px;"><source src="${src}"></video></div>`;
        });
        html = html.replace(/\[OBRAZEK:\s*(.+?)\]/gi, (m, src) => {
            src = src.trim(); if(!src.startsWith('http')) src = mediaBase + src;
            return `<div class="media-wrapper" style="margin:15px 0;"><img src="${src}" style="max-width:100%; border-radius:6px;"></div>`;
        });
        html = html.replace(/\[PRILOHA:\s*([^|\]]+)(?:\|([^\]]+))?\]/gi, (m, url, label) => {
            url = url.trim(); if(!url.startsWith('http')) url = docxBase + url;
            let text = label ? label.trim() : "Stáhnout přílohu";
            return `<div style="margin:15px 0;"><a href="${url}" target="_blank" class="btn primary" style="text-decoration:none; display:inline-block;">📎 ${text}</a></div>`;
        });

        html = html.replace(/<a href="([^"]+)">/g, `<a href="$1" target="_blank" rel="noopener noreferrer">`);
        
        return html;
    },

    renderDropdownBody() {
        const body = document.getElementById('kbNotifDropBody');
        const unread = this.getUnread();
        const toShow = unread.slice(0, 9);
        
        if (toShow.length === 0) {
            body.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Nemáte žádná nová oznámení.</div>`;
            return;
        }

        body.innerHTML = toShow.map(n => `
            <div class="notif-item unread" onclick="KB_Notifications.openDetail('${n.id}')">
                <span class="notif-meta">${this.formatDate(n.date)}</span>
                <span class="notif-title">${n.title}</span>
                <span class="notif-snippet">${n.content.replace(/<[^>]+>|\[.*?\]/g, '')}</span>
            </div>
        `).join('');
    },

    renderListBody(mode, searchQuery = "") {
        this.currentListMode = mode;
        const body = document.getElementById('kbNotifListBody');
        const titleEl = document.getElementById('kbNotifListTitle');
        const toggleBtn = document.getElementById('kbBtnToggleListMode');

        titleEl.textContent = mode === 'new' ? 'Nová oznámení' : 'Archiv oznámení';
        toggleBtn.textContent = mode === 'new' ? 'Přejít do Archivu Oznámení' : 'Zobrazit Nepřečtená Oznámení';
        document.getElementById('kbNotifSearch').value = searchQuery;

        let items = mode === 'new' ? this.getUnread() : this.getArchive();

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
        }

        if (items.length === 0) {
            body.innerHTML = `<div style="padding: 40px 20px; text-align: center; color: var(--text-muted);">Žádná oznámení k zobrazení.</div>`;
            return;
        }

        body.innerHTML = items.map(n => `
            <div class="notif-item ${mode === 'new' ? 'unread' : ''}" onclick="KB_Notifications.openDetail('${n.id}', true)">
                <span class="notif-meta">${this.formatDate(n.date)}</span>
                <span class="notif-title">${n.title}</span>
                <span class="notif-snippet">${n.content.replace(/<[^>]+>|\[.*?\]/g, '')}</span>
            </div>
        `).join('');
    },

    openListModal(mode) {
        document.getElementById('kbNotifDropdown').classList.remove('show');
        this.dropdownOpen = false;

        document.getElementById('kbNotifSearch').value = "";
        this.renderListBody(mode, "");
        document.getElementById('kbNotifListModal').classList.add('show');
    },

    openDetail(id, fromList = false) {
        const notif = this.data.find(n => n.id === id);
        if (!notif) return;

        // VŽDY zavřeme ostatní okna, bez ohledu na to, odkud jsme klikli
        document.getElementById('kbNotifDropdown').classList.remove('show');
        document.getElementById('kbNotifListModal').classList.remove('show');
        this.dropdownOpen = false;

        this.readIds.add(id);
        this.saveReadState();

        const body = document.getElementById('kbNotifDetailBody');
        const tagsHtml = (notif.tags || []).map(t => `<span class="tag-pill">${t}</span>`).join('');
        
        body.innerHTML = `
            <h3>${notif.title}</h3>
            <div class="meta-info">
                <span>📅 ${this.formatDate(notif.date)}</span>
                <div style="margin-top: 8px;">${tagsHtml}</div>
            </div>
            <div class="notif-content">
                ${this.parseContentHtml(notif.content)}
            </div>
        `;

        document.getElementById('kbNotifDetailModal').classList.add('show');
        
        // Zaktualizovat seznam na pozadí, abychom po zavření detailu měli správné počty / obsah
        if (fromList) {
            this.renderListBody(this.currentListMode, document.getElementById('kbNotifSearch').value);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    KB_Notifications.init();
});

// --- ENGINE VALIDACE ---
const KB_Validator = {
    validateArticle(dataObj) {
        let errors = [];
        KB_CONFIG.rules.forEach(rule => {
            if (rule.cond && !rule.cond(dataObj)) return; 
            const val = dataObj[rule.field];
            if (rule.type === 'required') {
                const isEmptyContent = val === '<p><br data-cke-filler="true"></p>' || val === '<p></p>';
                if (!val || typeof val === 'string' && val.trim() === '' || isEmptyContent) {
                    errors.push(rule.msg);
                }
            }
        });
        return errors;
    }
};

// --- CENTRÁLNÍ DATOVÝ KLIENT (pouze čtení statického JSON z FTP) ---
const KB_API = {
    async fetchDB() {
        const res = await fetch(KB_CONFIG.DB_URL);
        if (!res.ok) throw new Error("HTTP " + res.status);
        return await res.json();
    }
};

// --- UTILITY ---
const KB_Utils = {
    extractText(html) {
        if (!html) return "";
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    },
    formatDate(isoString) {
        return new Date(isoString).toLocaleDateString('cs-CZ');
    }
};