(function () {
    const STORAGE_KEY = 'pcformatech-theme';
    const THEMES = { LIGHT: 'light', DARK: 'dark' };

    function getSavedTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === THEMES.LIGHT || saved === THEMES.DARK) {
            return saved;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches
            ? THEMES.DARK
            : THEMES.LIGHT;
    }

    function getThemeMeta() {
        return document.querySelector("meta[name='theme-color']");
    }

    function updateMetaThemeColor(theme) {
        const meta = getThemeMeta();
        if (!meta) return;
        meta.setAttribute('content', theme === THEMES.DARK ? '#0b1220' : '#0B3D3D');
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);
        updateMetaThemeColor(theme);

        window.dispatchEvent(new CustomEvent('pcformatech:themechange', {
            detail: { theme }
        }));

        const btn = document.getElementById('themeToggleBtn');
        if (btn) {
            const isDark = theme === THEMES.DARK;
            btn.textContent = isDark ? '☀' : '🌙';
            btn.setAttribute('title', isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro');
            btn.setAttribute('aria-label', isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro');
        }
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || THEMES.LIGHT;
        applyTheme(current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
    }

    function injectToggleButton() {
        if (document.getElementById('themeToggleBtn')) return;

        const button = document.createElement('button');
        button.id = 'themeToggleBtn';
        button.type = 'button';
        button.addEventListener('click', toggleTheme);
        document.body.appendChild(button);

        applyTheme(document.documentElement.getAttribute('data-theme') || getSavedTheme());
    }

    applyTheme(getSavedTheme());

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectToggleButton);
    } else {
        injectToggleButton();
    }
})();
