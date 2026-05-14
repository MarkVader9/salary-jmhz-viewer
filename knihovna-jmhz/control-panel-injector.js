// Soubor: control-panel-injector.js
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('dynamicButtonsContainer');
    if(!container) return;

    // Smažeme nápis "Načítám moduly..."
    container.innerHTML = '';

    // Můžete generovat tlačítka naprosto dynamicky!
    const buttons = [
        { label: "🖨️ Vytisknout článek", action: () => window.print() },
        { label: "🔗 Sdílet odkaz", action: () => copyLink() },
        { label: "⭐ Přidat do oblíbených", action: () => alert("Tlačítko kliknuto - napojte na DB!") }
    ];

    buttons.forEach(btnInfo => {
        const btn = document.createElement("button");
        // Příklad stylování přímo z JS
        btn.style.cssText = "width: 100%; padding: 10px; margin-bottom: 10px; background: white; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; font-weight: 600; text-align: left;";
        btn.textContent = btnInfo.label;
        btn.onclick = btnInfo.action;
        container.appendChild(btn);
    });

    function copyLink() {
        navigator.clipboard.writeText(window.location.href);
        KB_Toaster.show('Zkopírováno', 'Odkaz uložen do schránky', 'info');
    }
});