/**
 * PC Formatech — Dark Mode
 * Sistema simples, sem dependências, funciona offline.
 * Persiste em localStorage com a chave 'pcft-theme'.
 */
(function () {
    var STORAGE_KEY = 'pcft-theme';
    var html = document.documentElement;

    /* ── 1. Lê e aplica o tema salvo ── */
    function getSaved() {
        try { return localStorage.getItem(STORAGE_KEY) || 'light'; } catch (e) { return 'light'; }
    }
    function save(mode) {
        try { localStorage.setItem(STORAGE_KEY, mode); } catch (e) {}
    }
    function apply(mode) {
        html.setAttribute('data-theme', mode);
        save(mode);
        updateAllButtons(mode === 'dark');
    }

    /* ── 2. Toggle ── */
    function toggle() {
        var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        apply(next);
    }

    /* ── 3. Atualiza todos os botões registrados ── */
    function updateAllButtons(isDark) {
        var ids = ['themeToggleBtn', 'navDarkToggle', 'adminDarkToggle'];
        ids.forEach(function (id) {
            var btn = document.getElementById(id);
            if (!btn) return;
            btn.innerHTML = isDark ? '&#9728;&#65039;' : '&#127771;';
            btn.setAttribute('title', isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro');
            btn.setAttribute('aria-label', isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro');
        });
    }

    /* ── 4. Cria o botão flutuante se não existir ── */
    function ensureFloatButton() {
        if (document.getElementById('themeToggleBtn')) return;
        var btn = document.createElement('button');
        btn.id = 'themeToggleBtn';
        btn.type = 'button';
        btn.onclick = toggle;
        document.body.appendChild(btn);
    }

    /* ── 5. Expõe globalmente ── */
    window.pcftToggleDark = toggle;
    window.pcftApplyTheme = apply;

    /* ── 6. Init ── */
    var saved = getSaved();
    apply(saved);

    document.addEventListener('DOMContentLoaded', function () {
        ensureFloatButton();
        updateAllButtons(html.getAttribute('data-theme') === 'dark');
    });
})();
