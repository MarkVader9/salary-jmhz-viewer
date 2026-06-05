// library-menu.js
window.LIBRARY_MENU_CONFIG = [
    { label: "🏠 Domů (Knihovna)", link: "index.html" },
		{ divider: true },
	{ label: "🔄 Oživit Knihovnu", action: () => window.hardRefreshKnihovna && window.hardRefreshKnihovna() },
	{ divider: true },
    { label: "🔍 Vyhledávání", action: () => document.getElementById('searchInput')?.focus() },
    { divider: true },
    { label: "🖥️ Otevřít Prohlížeč JMHZ Formulářů", link: "../index.html", external: true },
    { divider: true },
    // ZMĚNA: Tlačítko nyní volá funkci pro zobrazení Pop-Up okna místo přímého odkazu
    { label: "🐛 Nahlásit problém", action: () => window.showSupportModal() }, 
    
    { label: "🌐 Web SALARY.cz", link: "https://www.salary.cz", external: true },
    { divider: true },

];