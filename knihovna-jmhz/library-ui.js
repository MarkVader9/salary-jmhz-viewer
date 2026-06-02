// library-ui.js
document.addEventListener("DOMContentLoaded", () => {
    const logoSvg = `<?xml version="1.0" encoding="UTF-8"?> <svg xmlns="http://www.w3.org/2000/svg" width="98" height="28" viewBox="0 0 166 48" fill="none"><defs><linearGradient id="fractalOrange1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFB74D" /><stop offset="100%" stop-color="#F57C00" /></linearGradient><linearGradient id="fractalOrange2" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#FF9800" /><stop offset="100%" stop-color="#E65100" /></linearGradient><linearGradient id="fractalOrange3" x1="100%" y1="50%" x2="0%" y2="50%"><stop offset="0%" stop-color="#FFB74D" /><stop offset="100%" stop-color="#FF5722" /></linearGradient></defs><g transform="translate(6, 2)"><polygon points="16,4 32,4 8,16" fill="url(#fractalOrange1)" /><polygon points="32,4 24,16 8,16" fill="url(#fractalOrange2)" /><polygon points="8,16 24,16 32,28" fill="url(#fractalOrange3)" /><polygon points="8,16 32,28 16,28" fill="url(#fractalOrange1)" /><polygon points="16,28 32,28 8,40" fill="url(#fractalOrange2)" /><polygon points="32,28 24,40 8,40" fill="url(#fractalOrange3)" /><polygon points="16,4 24,16 16,16" fill="#ffffff" opacity="0.3"/><polygon points="8,16 16,28 24,16" fill="#000000" opacity="0.15"/><polygon points="16,28 24,40 16,40" fill="#ffffff" opacity="0.3"/></g><text x="52" y="34" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="22" fill="currentColor" letter-spacing="1.5">SALARY</text></svg>`;

    // Pojistka stylů: Zaručí funkčnost a přidává responsivní a celoobrazovkové vlastnosti menu
    const style = document.createElement('style');
    style.innerHTML = `
        .drawer-backdrop { opacity: 0 !important; pointer-events: none !important; transition: opacity 0.3s ease; z-index: 1100 !important; }
        .drawer-backdrop.show { opacity: 1 !important; pointer-events: auto !important; }
        
        /* Přidáno visibility hidden pro kompletní neviditelnost menu mimo obrazovku */
        .drawer { 
            transform: translateX(100%) !important; 
            visibility: hidden !important; 
            transition: transform 0.3s ease, visibility 0s 0.3s !important; 
            animation: none !important; 
            z-index: 1200 !important; 
        }
        .drawer.open { 
            transform: translateX(0) !important; 
            visibility: visible !important; 
            transition: transform 0.3s ease, visibility 0s 0s !important; 
        }
        
        /* Absolutní vynucení pozice pro Toolbar (Záhlaví) */
        .jmhz-toolbar { display: grid !important; grid-template-columns: auto minmax(0, 1fr) auto !important; align-items: center; width: 100%; box-sizing: border-box; }
        .toolbar-right { display: flex !important; justify-content: flex-end !important; align-items: center !important; }

        /* ==========================================================
           AUTORITATIVNÍ MOBILNÍ CELOOBRAZOVKOVÉ MENU (Pod 900px)
           ========================================================== */
        @media (max-width: 900px) {
            /* Skryje text "Možnosti" v hlavičce na mobilech a tabletech */
            .drawer-toggle-text { display: none !important; }

            .drawer-backdrop {
                position: fixed !important;
                inset: 0 !important;
                z-index: 999998 !important; 
            }

            .drawer { 
                position: fixed !important;
                top: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                left: auto !important;
                width: 100vw !important; 
                max-width: 100vw !important; 
                height: 100vh !important;
                border-left: none !important; 
                z-index: 999999 !important; 
            }
            
            .drawer-header { padding: 25px 30px !important; }
            .drawer-header span { font-size: 1.3rem !important; font-weight: 800 !important; }
            .drawer-close { font-size: 2.2rem !important; padding: 10px !important; margin: -10px !important; }
            
            .drawer-body { 
                padding: 30px 20px !important; 
                gap: 15px !important; 
            }
            .drawer-body button { 
                font-size: 1.3rem !important; 
                padding: 22px 20px !important; 
                text-align: center !important; 
                border-radius: var(--radius-lg, 12px) !important;
                background: var(--bg-hover) !important;
                font-weight: 600 !important;
                box-shadow: 0 2px 5px rgba(0,0,0,0.02) !important;
            }
            .drawer-body button:hover, .drawer-body button:active { 
                background: var(--accent-subtle) !important; 
                color: var(--accent) !important; 
                transform: scale(0.98);
            }
            .drawer-body hr { margin: 20px 0 !important; border-color: var(--border) !important;}
        }
    `;
    document.head.appendChild(style);

    // 1. Vytvoření záhlaví (TŘÍDY OPRAVENY ZPĚT)
    const header = document.createElement('div');
    header.className = 'jmhz-toolbar'; 
    header.innerHTML = `
        <div class="toolbar-left">
            <span class="brand-logo" aria-label="SALARY s.r.o.">${logoSvg}</span>
            <span style="font-weight:600;font-size:0.875rem;color:var(--text-primary)">Knihovna Znalostí</span>
        </div>
        <div class="toolbar-center"></div>
        <div class="toolbar-right">
            <button class="drawer-toggle-btn" id="menuToggle" aria-label="Možnosti" title="Možnosti" style="display:flex; align-items:center; gap:6px;">
                <span class="drawer-toggle-icon" aria-hidden="true">☰</span>
                <span class="drawer-toggle-text">Možnosti</span>
            </button>
        </div>
    `;
    document.body.prepend(header);

    // 2. Vytvoření Draweru (boční menu)
    const backdrop = document.createElement('div');
    backdrop.className = 'drawer-backdrop';
    backdrop.id = 'menuBackdrop';
    
    const drawer = document.createElement('div');
    drawer.className = 'drawer';
    drawer.id = 'menuDrawer';
    drawer.innerHTML = `
        <div class="drawer-header">
            <span style="font-weight:600;font-size:0.875rem">Možnosti</span>
            <button class="drawer-close" id="menuClose" aria-label="Zavřít">✕</button>
        </div>
        <div class="drawer-body" id="drawerMenuContent"></div>
    `;
    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    // 3. Naplnění menu položkami z konfigurace (z library-menu.js)
    const menuContent = drawer.querySelector('#drawerMenuContent');
    if (window.LIBRARY_MENU_CONFIG) {
        window.LIBRARY_MENU_CONFIG.forEach(item => {
            if (item.divider) {
                const hr = document.createElement('hr');
                hr.className = 'drawer-divider';
                menuContent.appendChild(hr);
                return;
            }
            const btn = document.createElement('button');
            btn.textContent = item.label;
            btn.onclick = () => {
                if (item.action) item.action();
                if (item.link) window.location.href = item.link;
                drawer.classList.remove('open');
                backdrop.classList.remove('show');
            };
            menuContent.appendChild(btn);
        });
    }

    // 4. Globální zachytávání kliknutí (Event Delegation)
    document.addEventListener("click", (e) => {
        if (e.target.closest('#menuToggle')) {
            drawer.classList.add('open');
            backdrop.classList.add('show');
        } 
        else if (e.target.closest('#menuClose') || e.target.id === 'menuBackdrop') {
            drawer.classList.remove('open');
            backdrop.classList.remove('show');
        }
    });
    // 5. Modal "Nahlásit problém" — stejná podoba jako v JMHZ VIEWER
    window.showSupportModal = function() {
        let modal = document.getElementById('jmhz-report-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'jmhz-report-modal';
            modal.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35)';
            modal.innerHTML = `
                <div style="background:var(--bg-elevated,#fff);border:1px solid var(--border,#ddd);border-radius:var(--radius-lg,8px);padding:var(--sp-6,24px);min-width:420px;max-width:560px;width:90%;display:flex;flex-direction:column;gap:var(--sp-4,16px);box-shadow:0 8px 32px rgba(0,0,0,.18)">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <div style="font-weight:600;font-size:.9375rem">Nahlásit problém</div>
                        <button id="jmhz-report-close" aria-label="Zavřít" style="background:none;border:none;cursor:pointer;font-size:1.25rem;color:var(--text-muted,#888);padding:0 4px">&times;</button>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:var(--sp-3,12px)">
                        <label style="display:flex;flex-direction:column;gap:4px">
                            <span style="font-size:0.8125rem;color:var(--text-muted,#888)">Popis problému</span>
                            <textarea id="jmhz-report-desc" rows="4" placeholder="Popište prosím co nejpodrobněji, jaký problém jste zaznamenali…" style="resize:vertical;padding:var(--sp-2,8px);border:1px solid var(--border,#ddd);border-radius:var(--radius-md,6px);font-family:inherit;font-size:0.8125rem;background:var(--bg-surface,#fff);color:var(--text-primary,#111)"></textarea>
                        </label>
                        <label style="display:flex;flex-direction:column;gap:4px">
                            <span style="font-size:0.8125rem;color:var(--text-muted,#888)">Zákaznické číslo SALARY s.r.o.</span>
                            <input id="jmhz-report-cust" type="text" placeholder="Nepovinné" style="padding:var(--sp-2,8px);border:1px solid var(--border,#ddd);border-radius:var(--radius-md,6px);font-family:inherit;font-size:0.8125rem;background:var(--bg-surface,#fff);color:var(--text-primary,#111)">
                        </label>
                        <label style="display:flex;flex-direction:column;gap:4px;margin-top:var(--sp-1,4px)">
                            <span style="font-size:0.75rem;color:var(--text-muted,#888);font-weight:500">Diagnostické informace (budou přiloženy):</span>
                            <textarea id="jmhz-report-diag" rows="5" readonly style="width:100%;box-sizing:border-box;padding:var(--sp-2,8px);background:var(--bg-base,#f5f5f5);border:1px solid var(--border-subtle,#eee);border-radius:var(--radius-md,6px);font-size:0.6875rem;color:var(--text-muted,#888);white-space:pre-wrap;max-height:140px;overflow:auto;line-height:1.45;font-family:monospace;resize:vertical"></textarea>
                        </label>
                    </div>
                    <div style="display:flex;align-items:center;gap:var(--sp-3,12px);justify-content:flex-end;flex-wrap:wrap">
                        <span style="font-size:0.6875rem;color:var(--text-muted,#888);margin-right:auto">Otevře se e-mailový klient s předvyplněnou zprávou na slsavek@salary.cz</span>
                        <button id="jmhz-report-send" style="padding:8px 18px;background:var(--accent,#1e5fa3);color:#fff;border:none;border-radius:var(--radius-md,6px);font-size:0.875rem;font-weight:600;cursor:pointer">Odeslat</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Diagnostická data
            const diag = [
                'Aplikace : JMHZ KNIHOVNA',
                'Stránka  : ' + document.title,
                'URL      : ' + location.href,
                'Datum    : ' + new Date().toLocaleString('cs-CZ'),
                'Prohlížeč: ' + navigator.userAgent,
                'Rozlišení: ' + screen.width + 'x' + screen.height + ' (viewport ' + window.innerWidth + 'x' + window.innerHeight + ')',
            ].join('\n');
            modal.querySelector('#jmhz-report-diag').value = diag;

            // Zavření
            modal.querySelector('#jmhz-report-close').addEventListener('click', () => { modal.style.display = 'none'; });
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.style.display !== 'none') modal.style.display = 'none'; });

            // Odeslání přes mailto
            modal.querySelector('#jmhz-report-send').addEventListener('click', () => {
                const desc = modal.querySelector('#jmhz-report-desc').value.trim();
                const cust = modal.querySelector('#jmhz-report-cust').value.trim();
                const diag = modal.querySelector('#jmhz-report-diag').value;
                const subject = encodeURIComponent('Nahlášení problému – JMHZ KNIHOVNA');
                const body = encodeURIComponent(
                    (desc || '(popis nevyplněn)') + '\n\n' +
                    (cust ? 'Zákaznické číslo: ' + cust + '\n\n' : '') +
                    '--- Diagnostické informace ---\n' + diag
                );
                window.location.href = 'mailto:slsavek@salary.cz?subject=' + subject + '&body=' + body;
            });
        }

        // Aktualizace diagnostiky při každém otevření (čas se mění)
        modal.querySelector('#jmhz-report-diag').value = [
            'Aplikace : JMHZ KNIHOVNA',
            'Stránka  : ' + document.title,
            'URL      : ' + location.href,
            'Datum    : ' + new Date().toLocaleString('cs-CZ'),
            'Prohlížeč: ' + navigator.userAgent,
            'Rozlišení: ' + screen.width + 'x' + screen.height + ' (viewport ' + window.innerWidth + 'x' + window.innerHeight + ')',
        ].join('\n');
        modal.querySelector('#jmhz-report-desc').value = '';
        modal.querySelector('#jmhz-report-cust').value = '';
        modal.style.display = 'flex';
    };

        // Globální správa témat - ujistěte se, že toto je na konci library-ui.js
window.setTheme = function(theme) {
    if (theme === 'auto') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('jmhz_theme_pref', theme);
    
    // Zobrazíme toast, pokud existuje
    if (window.KB_Toaster) {
        KB_Toaster.show('Vzhled změněn', `Režim: ${theme}`, 'success');
    }
};
});