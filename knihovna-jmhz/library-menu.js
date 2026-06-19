// library-menu.js
window.LIBRARY_MENU_CONFIG = [
    { label: "🏠 Domů (Knihovna)", link: "index.html" },
    { divider: true },
    
    // OPRAVA: Bezpečné ošetření bez nutnosti předávat objekt události 'e'
    { 
        label: "🔄 Oživit Knihovnu", 
        action: () => {
            // Najdeme prvek, na který uživatel v menu právě kliknul
            const activeBtn = document.activeElement;
            if (activeBtn && (activeBtn.tagName === 'BUTTON' || activeBtn.tagName === 'A')) {
                activeBtn.style.pointerEvents = 'none'; // Zamezí vícenásobnému klikání
                activeBtn.innerHTML = '<span class="btn-spinner"></span> Oživuji…';
            }
            // Bezpečně spustíme samotné vyčištění cache z index.html
            if (window.hardRefreshKnihovna) {
                window.hardRefreshKnihovna();
            }
        } 
    },
    
    { divider: true },
    { label: "🔍 Vyhledávání", action: () => document.getElementById('searchInput')?.focus() },
    { divider: true },
    { label: "🖥️ JMHZ Prohlížeč", link: "../index.html", external: true },
    { divider: true },  
    
    // ZMĚNA: Přiřazena nová CSS třída btn-purple, která udělá solidní probarvené tlačítko
    { 
        label: "🖥️ SALARY Workspace", 
        link: "https://www.salary.cz/salary-workspace/salary-workspace.html", 
        external: true,
        className: "btn-purple" 
    },
    
    { divider: true },
    { label: "🐛 Nahlásit problém", action: () => window.showSupportModal() }, 
    { label: "🌐 Web SALARY.cz", link: "https://www.salary.cz", external: true },
    { divider: true },
];