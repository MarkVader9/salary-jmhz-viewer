// library-ui.js

// =======================================================================
// 1. GLOBÁLNÍ SPRÁVA VZHLEDU (THEME ENGINE)
// Zajišťuje zapamatování a okamžité přepnutí bez "probliknutí" stránky
// =======================================================================
(function() {
    window.setTheme = function(mode) {
        localStorage.setItem('jmhz_theme', mode);
        applyTheme(mode);
    };

    function applyTheme(mode) {
        if (mode === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else if (mode === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            // Režim "Auto" zkontroluje nastavení operačního systému uživatele
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
            }
        }
    }

    // Aplikace vzhledu ihned při spuštění scriptu
    const savedTheme = localStorage.getItem('jmhz_theme') || 'auto';
    applyTheme(savedTheme);

    // Pokud je režim na "Auto", sledujeme, jestli si uživatel nepřepnul OS do tmavého (např. po západu slunce)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (!localStorage.getItem('jmhz_theme') || localStorage.getItem('jmhz_theme') === 'auto') {
            applyTheme('auto');
        }
    });
})();

// =======================================================================
// 2. UI PRVKY (ZÁHLAVÍ, DRAWER, MODÁL)
// =======================================================================
document.addEventListener("DOMContentLoaded", () => {
    const logoSvg = `<?xml version="1.0" encoding="UTF-8"?> <svg xmlns="http://www.w3.org/2000/svg" width="98" height="28" viewBox="0 0 166 48" fill="none"><defs><linearGradient id="fractalOrange1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFB74D" /><stop offset="100%" stop-color="#F57C00" /></linearGradient><linearGradient id="fractalOrange2" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#FF9800" /><stop offset="100%" stop-color="#E65100" /></linearGradient><linearGradient id="fractalOrange3" x1="100%" y1="50%" x2="0%" y2="50%"><stop offset="0%" stop-color="#FFB74D" /><stop offset="100%" stop-color="#FF5722" /></linearGradient></defs><g transform="translate(6, 2)"><polygon points="16,4 32,4 8,16" fill="url(#fractalOrange1)" /><polygon points="32,4 24,16 8,16" fill="url(#fractalOrange2)" /><polygon points="8,16 24,16 32,28" fill="url(#fractalOrange3)" /><polygon points="8,16 32,28 16,28" fill="url(#fractalOrange1)" /><polygon points="16,28 32,28 8,40" fill="url(#fractalOrange2)" /><polygon points="32,28 24,40 8,40" fill="url(#fractalOrange3)" /><polygon points="16,4 24,16 16,16" fill="#ffffff" opacity="0.3"/><polygon points="8,16 16,28 24,16" fill="#000000" opacity="0.15"/><polygon points="16,28 24,40 16,40" fill="#ffffff" opacity="0.3"/></g><text x="52" y="34" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="22" fill="currentColor" letter-spacing="1.5">SALARY</text></svg>`;



    const header = document.createElement('div');
    header.className = 'jmhz-toolbar';
    header.innerHTML = `
        <div class="toolbar-left">
            <span class="brand-logo">${logoSvg}</span>
            <span class="toolbar-title">Knihovna Znalostí</span>
        </div>
        <div class="toolbar-right">
            <button class="drawer-toggle-btn" id="menuToggle">☰   Možnosti</button>
        </div>
    `;
    document.body.prepend(header);

    const backdrop = document.createElement('div');
    backdrop.className = 'drawer-backdrop';
    backdrop.id = 'menuBackdrop';
    
    const drawer = document.createElement('div');
    drawer.className = 'drawer';
    drawer.id = 'menuDrawer';
    drawer.innerHTML = `
        <div class="drawer-header">
            <span>Možnosti</span>
            <button class="drawer-close" id="menuClose">✕</button>
        </div>
        <div class="drawer-body" id="drawerMenuContent"></div>
    `;
    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    const menuContent = drawer.querySelector('#drawerMenuContent');
    if (window.LIBRARY_MENU_CONFIG) {
        window.LIBRARY_MENU_CONFIG.forEach(item => {
            if (item.divider) {
                menuContent.appendChild(document.createElement('hr'));
                return;
            }
            const btn = document.createElement('button');
            btn.textContent = item.label;
            btn.onclick = () => {
                toggleMenu(false);
                if (item.action) item.action();
                if (item.link) window.location.href = item.link;
            };
            menuContent.appendChild(btn);
        });
    }

    function toggleMenu(show) {
        drawer.classList.toggle('open', show);
        backdrop.classList.toggle('show', show);
    }

    document.addEventListener("click", (e) => {
        if (e.target.closest('#menuToggle')) {
            toggleMenu(true);
        } else if (e.target.closest('#menuClose') || e.target.id === 'menuBackdrop') {
            toggleMenu(false);
        }
    });

    window.showSupportModal = function() {
        const existingModal = document.getElementById('supportModalWrapper');
        if (existingModal) existingModal.remove();

        const diagInfo = 
`Verze: JMHZ Knihovna Znalostí
Čas: ${new Date().toLocaleString('cs-CZ')}
Adresa URL: ${window.location.href}
Prohlížeč: ${navigator.userAgent}
Rozlišení: ${window.innerWidth}x${window.innerHeight}`;

        const modal = document.createElement('div');
        modal.id = 'supportModalWrapper';
        modal.innerHTML = `
        <div style="position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35)">
            <div style="background:var(--bg-elevated, #fff);border:1px solid var(--border, #e5e7eb);border-radius:var(--radius-lg, 8px);padding:24px;min-width:420px;max-width:560px;width:90%;display:flex;flex-direction:column;gap:16px;box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div style="font-weight:600;font-size:1.1rem;color:var(--text-primary, #111827);">Nahlásit problém</div>
                    <button id="suppBtnClose" aria-label="Zavřít" style="background:none;border:none;cursor:pointer;font-size:1.5rem;color:var(--text-muted, #6b7280);padding:0 4px;line-height:1;">×</button>
                </div>
                
                <div style="display:flex;flex-direction:column;gap:12px">
                    <label style="display:flex;flex-direction:column;gap:4px">
                        <span style="font-size:0.85rem;color:var(--text-muted, #6b7280);">Popis problému</span>
                        <textarea id="suppInputDesc" rows="4" placeholder="Popište prosím co nejpodrobněji, jaký problém jste zaznamenali…" style="resize:vertical;padding:8px;border:1px solid var(--border, #e5e7eb);border-radius:var(--radius-md, 6px);font-family:inherit;font-size:0.85rem;background:var(--bg-base, #f9fafb);color:var(--text-primary, #111827);outline:none;"></textarea>
                    </label>
                    <label style="display:flex;flex-direction:column;gap:4px">
                        <span style="font-size:0.85rem;color:var(--text-muted, #6b7280);">Zákaznické číslo SALARY s.r.o.</span>
                        <input id="suppInputCust" type="text" placeholder="Nepovinné" style="padding:8px;border:1px solid var(--border, #e5e7eb);border-radius:var(--radius-md, 6px);font-family:inherit;font-size:0.85rem;background:var(--bg-base, #f9fafb);color:var(--text-primary, #111827);outline:none;">
                    </label>
                    <label style="display:flex;flex-direction:column;gap:4px;margin-top:4px">
                        <span style="font-size:0.75rem;color:var(--text-muted, #6b7280);font-weight:500">Diagnostické informace (budou přiloženy):</span>
                        <textarea id="suppInputDiag" readonly rows="6" style="width:100%;box-sizing:border-box;padding:8px;background:var(--bg-surface, #f3f4f6);border:1px solid var(--border-subtle, #e5e7eb);border-radius:var(--radius-md, 6px);font-size:0.7rem;color:var(--text-muted, #6b7280);white-space:pre-wrap;max-height:180px;overflow:auto;line-height:1.45;font-family:monospace;resize:vertical;outline:none;">${diagInfo}</textarea>
                    </label>
                </div>
                
                <div style="display:flex;align-items:center;gap:12px;justify-content:flex-end;flex-wrap:wrap;border-top:1px solid var(--border-subtle, #e5e7eb);padding-top:16px;">
                    <span style="font-size:0.7rem;color:var(--text-muted, #6b7280);margin-right:auto">Otevře se e-mailový klient.</span>
                    <button id="suppBtnSubmit" class="btn primary" style="background:var(--accent, #4f46e5); color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer;">Odeslat</button>
                </div>
            </div>
        </div>`;

        document.body.appendChild(modal);
        setTimeout(() => document.getElementById('suppInputDesc').focus(), 100);

        const removeModal = () => modal.remove();
        document.getElementById('suppBtnClose').onclick = removeModal;
        modal.firstElementChild.onclick = (e) => {
            if (e.target === modal.firstElementChild) removeModal();
        };

        document.getElementById('suppBtnSubmit').onclick = () => {
            const desc = document.getElementById('suppInputDesc').value.trim();
            const cust = document.getElementById('suppInputCust').value.trim();
            const diag = document.getElementById('suppInputDiag').value.trim();

            if (!desc) {
                alert("Prosím, vyplňte popis problému.");
                return;
            }

            let mailBody = `Popis problému:\n${desc}\n\n`;
            if (cust) mailBody += `Zákaznické číslo: ${cust}\n\n`;
            mailBody += `-----------------------------------\nDiagnostické informace:\n${diag}`;

            const mailtoLink = `mailto:slsavek@salary.cz?subject=${encodeURIComponent("Nahlášení problému - JMHZ Knihovna")}&body=${encodeURIComponent(mailBody)}`;
            window.location.href = mailtoLink;
            removeModal();
        };
    };
});
