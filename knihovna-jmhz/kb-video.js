/**
 * kb-video.js - Centralizovaný správce kvality videí (Zpětně kompatibilní verze)
 * Analyzuje výkon HW/Sítě, ukládá preferenci a plynule přepíná zdroje s ochranou proti chybě 404.
 */
const KB_VideoManager = {
    config: {
        storageKey: 'jmhz_video_quality'
    },

    init() {
        this.processAllVideos();
    },

    detectIdealQuality() {
        const saved = localStorage.getItem(this.config.storageKey);
        if (saved === '4k' || saved === '1080p') return saved;

        let isSlow = false;
        const cores = navigator.hardwareConcurrency || 4;
        if (cores < 4) isSlow = true;

        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn) {
            if (conn.effectiveType === '3g' || conn.effectiveType === '2g') isSlow = true;
            if (conn.downlink && conn.downlink < 5.0) isSlow = true;
            if (conn.saveData) isSlow = true;
        }

        return isSlow ? '1080p' : '4k';
    },

    toggleGlobalQuality() {
        const current = localStorage.getItem(this.config.storageKey) || this.detectIdealQuality();
        const nextTarget = current === '4k' ? '1080p' : '4k';
        
        localStorage.setItem(this.config.storageKey, nextTarget);
        
        const containers = document.querySelectorAll('.kb-video-container');
        containers.forEach(container => this.applyVideoQuality(container, nextTarget, true));
        
        if(window.KB_Toaster) {
            KB_Toaster.show('Kvalita upravena', `Videa se nyní budou přehrávat ve formátu ${nextTarget.toUpperCase()}`, 'info');
        }
    },

    processAllVideos() {
        const targetQuality = this.detectIdealQuality();
        const containers = document.querySelectorAll('.kb-video-container:not(.processed)');
        
        containers.forEach(container => {
            container.classList.add('processed');
            container.style.position = 'relative';

            const videoEl = container.querySelector('video');
            if (!videoEl) return;

            const btnWrap = document.createElement('div');
            btnWrap.className = 'kb-video-qty-wrap';
            
            const btn = document.createElement('button');
            btn.className = 'kb-video-qty-btn';
            btn.title = "Přepnout kvalitu videa";
            btn.onclick = () => this.toggleGlobalQuality();
            
            btnWrap.appendChild(btn);
            container.appendChild(btnWrap);

            this.applyVideoQuality(container, targetQuality, false);
        });
    },

    applyVideoQuality(container, qualityId, isManualToggle = false) {
        const videoEl = container.querySelector('video');
        const btn = container.querySelector('.kb-video-qty-btn');
        
        const originalSrc = container.getAttribute('data-original-src'); // Původní z Wordu (001_uvod.mp4)
        const baseSrc = container.getAttribute('data-base-src'); // Oříznuto (001_uvod)
        
        if (!videoEl || !originalSrc || !baseSrc) return;

        // ZPĚTNÁ KOMPATIBILITA: 1080p = Původní soubor | 4K = Soubor + _4k.mp4
        let newSrc = (qualityId === '1080p') ? originalSrc : baseSrc + '_4k.mp4';
        
        // Prevence duplicity, pokud by už i Word soubor obsahoval _4k
        if (qualityId === '4k' && originalSrc.toLowerCase().includes('_4k')) {
            newSrc = originalSrc;
        }

        if (videoEl.src === newSrc && !isManualToggle) {
             if (btn) btn.innerHTML = `⚙️ ${qualityId.toUpperCase()}`;
             return;
        }

        const currentTime = videoEl.currentTime || 0;
        const isPaused = videoEl.paused;

        videoEl.src = newSrc;
        videoEl.load();

        videoEl.onloadedmetadata = () => {
            if (currentTime > 0) videoEl.currentTime = currentTime;
            if (!isPaused && isManualToggle) {
                const playPromise = videoEl.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => console.log('Autoplay blokován prohlížečem.', e));
                }
            }
            videoEl.onloadedmetadata = null;
            videoEl.onerror = null; // Vyčistíme starý chyták chyb
        };



        // ZÁCHRANNÁ BRZDA: Pokud 4K video na FTP neexistuje (404), vrátí to bezpečně na výchozí 1080p
        videoEl.onerror = () => {
            if (qualityId === '4k') {
                console.warn(`Verze 4K nebyla nalezena, vracím se k původnímu souboru.`);
                videoEl.src = originalSrc;
                videoEl.load();
                videoEl.currentTime = currentTime;
                if (!isPaused) videoEl.play();
                
                if (btn) btn.innerHTML = `⚙️ 1080P`;
                localStorage.setItem(this.config.storageKey, '1080p');
            }
        };

        if (btn) btn.innerHTML = `⚙️ ${qualityId.toUpperCase()}`;
    }
	
	
	// ==========================================================================
// GLOBÁLNÍ DETEKCE KONCE VIDEA PRO LMS (Anti-Skip Funkce)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Nasloucháme události 'ended' (konec přehrávání) na jakémkoliv videu
    // Používáme 'true' (capture phase), abychom událost bezpečně chytili
    document.addEventListener('ended', (e) => {
        if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === 'video') {
            
            // Video bylo dokoukáno! Vystřelíme speciální signál do celé aplikace
            window.dispatchEvent(new CustomEvent('kb-video-completed'));
            
            // Volitelný vizuální efekt - ukážeme malou notifikaci
            if (window.KB_Toaster) {
                KB_Toaster.show('Video dokončeno', 'Nyní můžete pokračovat v lekci.', 'success');
            }
        }
    }, true);
});


};