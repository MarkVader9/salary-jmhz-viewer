/**
 * kb-video.js - Centralizovaný správce kvality videí (1080p vs 4K)
 * Analyzuje výkon HW/Sítě, ukládá preferenci do localStorage a plynule přepíná zdroje.
 */
const KB_VideoManager = {
    config: {
        storageKey: 'jmhz_video_quality',
        qualities: {
            '1080p': { label: '1080p (Rychlejší)', suffix: '_1080p.mp4' },
            '4k': { label: '4K (Nejvyšší)', suffix: '_4k.mp4' }
        }
    },

    init() {
        this.processAllVideos();
    },

    // 1. Chytrá detekce procesně výkonnostního zatížení a sítě
    detectIdealQuality() {
        // a) Pokud uživatel učinil manuální volbu, vždy ji respektujeme
        const saved = localStorage.getItem(this.config.storageKey);
        if (saved === '4k' || saved === '1080p') return saved;

        // b) Analýza výkonu prohlížeče a sítě
        let isSlow = false;
        
        // Hodnocení CPU: méně než 4 jádra je na 4K video v prohlížeči slabé
        const cores = navigator.hardwareConcurrency || 4;
        if (cores < 4) isSlow = true;

        // Hodnocení Sítě: Network Information API
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn) {
            if (conn.effectiveType === '3g' || conn.effectiveType === '2g') isSlow = true;
            if (conn.downlink && conn.downlink < 5.0) isSlow = true; // Méně než 5 Mbps
            if (conn.saveData) isSlow = true; // Uživatel má zapnutý "Spořič dat" v telefonu
        }

        return isSlow ? '1080p' : '4k';
    },

    // 2. Vynucená manuální změna (přepnutí)
    toggleGlobalQuality() {
        const current = localStorage.getItem(this.config.storageKey) || this.detectIdealQuality();
        const nextTarget = current === '4k' ? '1080p' : '4k';
        
        localStorage.setItem(this.config.storageKey, nextTarget);
        
        // Přepne všechna videa na stránce (pokud jich je více)
        const containers = document.querySelectorAll('.kb-video-container');
        containers.forEach(container => this.applyVideoQuality(container, nextTarget));
        
        if(window.KB_Toaster) {
            KB_Toaster.show('Kvalita upravena', `Všechna videa se nyní budou přehrávat ve formátu ${nextTarget.toUpperCase()}`, 'info');
        }
    },

    // 3. Modifikace DOMu (Vyhledání a injekce tlačítek)
    processAllVideos() {
        const targetQuality = this.detectIdealQuality();
        const containers = document.querySelectorAll('.kb-video-container:not(.processed)');
        
        containers.forEach(container => {
            container.classList.add('processed');
            container.style.position = 'relative'; // Nutné pro absolutní pozicování tlačítka

            const videoEl = container.querySelector('video');
            const baseSrc = container.getAttribute('data-base-src');
            
            if (!videoEl || !baseSrc) return;

            // Injekce přepínacího tlačítka do vrstvy nad video
            const btnWrap = document.createElement('div');
            btnWrap.className = 'kb-video-qty-wrap';
            
            const btn = document.createElement('button');
            btn.className = 'kb-video-qty-btn';
            btn.title = "Přepnout kvalitu videa";
            btn.onclick = () => this.toggleGlobalQuality();
            
            btnWrap.appendChild(btn);
            container.appendChild(btnWrap);

            // Nastavíme úvodní kvalitu
            this.applyVideoQuality(container, targetQuality);
        });
    },

    // 4. Plynulé přepnutí zdroje za chodu (Seamless Swap)
    applyVideoQuality(container, qualityId) {
        const videoEl = container.querySelector('video');
        const btn = container.querySelector('.kb-video-qty-btn');
        const baseSrc = container.getAttribute('data-base-src');
        const qObj = this.config.qualities[qualityId];
        
        if (!videoEl || !qObj) return;

        const newSrc = baseSrc + qObj.suffix;
        
        // Pokud už je to tento soubor, nic neděláme
        if (videoEl.src === newSrc) return;

        // Uchování aktuálního stavu přehrávání, aby video neskočilo na 0:00
        const currentTime = videoEl.currentTime || 0;
        const isPaused = videoEl.paused;

        // Výměna souboru
        videoEl.src = newSrc;
        videoEl.load();

        // Po navázání nového souboru posuneme čas na původní hodnotu
        videoEl.onloadedmetadata = () => {
            videoEl.currentTime = currentTime;
            if (!isPaused) {
                // Pokud video běželo, znovu ho rozběhneme
                const playPromise = videoEl.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => console.log('Autoplay po přepnutí blokován prohlížečem.', e));
                }
            }
            videoEl.onloadedmetadata = null;
        };

        // Aktualizace nápisu na tlačítku
        if (btn) btn.innerHTML = `⚙️ ${qualityId.toUpperCase()}`;
    }
};