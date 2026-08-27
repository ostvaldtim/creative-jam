/**
 * THEME MODULE
 * Unified click-to-toggle theme switcher
 * Uses localStorage + prefers-color-scheme fallback
 */

const Theme = {
    current: 'dark',

    init() {
        // 1. Read from localStorage
        const saved = localStorage.getItem('theme');
        if (saved === 'dark' || saved === 'light') {
            this.current = saved;
        } else {
            // 2. Fallback to system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.current = prefersDark ? 'dark' : 'light';
        }

        // 3. Apply without saving (initial load)
        this.apply(this.current);
    },

    /**
     * Toggle theme: dark ↔ light (single click)
     */
    toggle() {
        this.current = (this.current === 'dark') ? 'light' : 'dark';
        this.apply(this.current);
        localStorage.setItem('theme', this.current);

        // Sync with Storage module if available
        if (window.Storage && Storage.setTheme) {
            Storage.setTheme(this.current);
        }
    },

    /**
     * Apply theme to DOM and sync all toggle buttons
     */
    apply(theme) {
        this.current = theme;
        document.body.setAttribute('data-theme', theme);

        const isLight = (theme === 'light');

        // Sync all toggle buttons everywhere (sidebar + overlay)
        document.querySelectorAll('.js-theme-toggle').forEach(btn => {
            btn.setAttribute('aria-checked', String(isLight));
            if (isLight) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Sync theme to report iframe (if active) — DIRECT DOM for zero delay
        const reportFrame = document.getElementById('reportFrame');
        if (reportFrame) {
            try {
                // Same-origin: direct synchronous access (no postMessage delay)
                const iframeDoc = reportFrame.contentDocument || reportFrame.contentWindow?.document;
                if (iframeDoc && iframeDoc.body) {
                    // Set data-theme on both html and body for CSS variable selectors
                    iframeDoc.documentElement.setAttribute('data-theme', theme);
                    iframeDoc.body.setAttribute('data-theme', theme);
                    if (theme === 'light') {
                        iframeDoc.body.classList.add('theme-light');
                    } else {
                        iframeDoc.body.classList.remove('theme-light');
                    }
                }
            } catch (_) {
                // Cross-origin fallback: use postMessage
                if (reportFrame.contentWindow) {
                    reportFrame.contentWindow.postMessage({
                        type: 'THEME_CHANGE',
                        theme: theme
                    }, '*');
                }
            }
        }
    },

    getCurrent() {
        return this.current;
    }
};

// Global function for onclick handlers
window.toggleTheme = function (e) {
    if (e) {
        e.stopPropagation();
        e.preventDefault();
    }
    Theme.toggle();
};

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Theme.init());
} else {
    Theme.init();
}
