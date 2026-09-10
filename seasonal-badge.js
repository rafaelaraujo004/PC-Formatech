// ==========================================
// BADGE DE DATA COMEMORATIVA
// ==========================================
//
// Extraído de index-app.js, que não era carregado por nenhum HTML — a badge
// ficava permanentemente hidden. Aqui vem só a parte da badge; o restante
// daquele arquivo duplicava código que já existe no index.html e no main.js.
(function () {
    var PRE_EXTRA = 3;  // dias de antecedência
    var POST_EXTRA = 0; // sem prorrogação após o fim do período
    var SEASONAL = [
        { name: 'Natal',               greeting: 'Feliz',  icon: '\u{1F384}', start: '12-25', end: '12-25' },
        { name: 'Ano Novo',            greeting: 'Feliz',  icon: '\u2728',     start: '01-01', end: '01-01' },
        { name: 'P\u00e1scoa',         greeting: 'Feliz',  icon: '\u{1F423}', start: '03-25', end: '04-22' },
        { name: 'Dia das M\u00e3es',   greeting: 'Feliz',  icon: '\u{1F490}', start: '05-08', end: '05-14' },
        { name: 'Festa Junina',        greeting: 'Feliz',  icon: '\u{1F33D}', start: '06-24', end: '06-24' },
        { name: 'Dia dos Pais',        greeting: 'Feliz',  icon: '\u{1F3C6}', start: '08-08', end: '08-14' },
        { name: 'Dia das Crian\u00e7as', greeting: 'Feliz', icon: '\u{1F388}', start: '10-12', end: '10-12' },
        { name: 'Halloween',           greeting: 'Happy',  icon: '\u{1F383}', start: '10-31', end: '10-31' }
    ];

    function isLeap(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    // Dia do ano. A tabela é fixa, então fevereiro precisa do ajuste bissexto:
    // sem ele, toda data a partir de março deslocava um dia em ano bissexto.
    function doy(m, d, year) {
        var acc = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var n = d;
        for (var i = 1; i < m; i++) n += acc[i];
        if (m > 2 && isLeap(year == null ? new Date().getFullYear() : year)) n += 1;
        return n;
    }

    function isActive(start, end) {
        var now  = new Date();
        var year = now.getFullYear();
        var tDOY = doy(now.getMonth() + 1, now.getDate(), year);
        var sp   = start.split('-').map(Number);
        var ep   = end.split('-').map(Number);
        var sN   = doy(sp[0], sp[1], year);
        var eN   = doy(ep[0], ep[1], year);
        var wraps = eN < sN;
        var yearLength = isLeap(year) ? 366 : 365;
        if (wraps) eN += yearLength;
        var wS = sN - PRE_EXTRA;
        var wE = eN + POST_EXTRA;
        return (tDOY >= wS && tDOY <= wE) ||
               (wraps && (tDOY + yearLength >= wS && tDOY + yearLength <= wE));
    }

    function iconByThemeId(themeId) {
        var map = {
            'natal': '\u{1F384}',
            'ano-novo': '\u2728',
            'pascoa': '\u{1F423}',
            'dia-das-maes': '\u{1F490}',
            'festa-junina': '\u{1F33D}',
            'dia-dos-pais': '\u{1F3C6}',
            'dia-das-criancas': '\u{1F388}',
            'halloween': '\u{1F383}'
        };
        return map[themeId] || '\u{1F389}';
    }

    function splitSeasonalTitle(title) {
        var raw = String(title || '').trim().replace(/[!]+$/, '');
        if (!raw) {
            return { greeting: 'Feliz', name: 'Data Comemorativa' };
        }
        var parts = raw.split(/\s+/);
        if (parts.length > 1 && /^(feliz|happy)$/i.test(parts[0])) {
            return { greeting: parts[0], name: parts.slice(1).join(' ') };
        }
        return { greeting: 'Feliz', name: raw };
    }

    function getThemeSeasonalBadge() {
        var root = document.documentElement;
        if (!root || root.getAttribute('data-theme-category') !== 'seasonal') {
            return null;
        }

        var themeId = root.getAttribute('data-theme-id') || '';
        var manager = window.PCFormatechThemeManager;
        var theme = manager && typeof manager.getCurrentTheme === 'function'
            ? manager.getCurrentTheme()
            : null;

        if (!theme || theme.category !== 'seasonal') {
            return null;
        }

        var title = '';
        if (theme.banner && Array.isArray(theme.banner.slides) && theme.banner.slides[0] && theme.banner.slides[0].title) {
            title = theme.banner.slides[0].title;
        } else if (theme.name) {
            title = theme.name;
        }

        var parsed = splitSeasonalTitle(title);
        return {
            greeting: parsed.greeting,
            name: parsed.name,
            icon: iconByThemeId(themeId || theme.id || '')
        };
    }

    function showBadge() {
        var badge = document.getElementById('pcft-seasonal-badge');
        if (!badge) return;
        var iconLeft  = badge.querySelector('.pcft-seasonal-icon-left');
        var iconRight = badge.querySelector('.pcft-seasonal-icon-right');
        var greetEl   = badge.querySelector('.pcft-seasonal-greeting');
        var nameEl    = badge.querySelector('.pcft-seasonal-name');

        var forcedByTheme = getThemeSeasonalBadge();
        if (forcedByTheme) {
            if (iconLeft)  iconLeft.textContent  = forcedByTheme.icon;
            if (iconRight) iconRight.textContent = forcedByTheme.icon;
            if (greetEl)   greetEl.textContent   = forcedByTheme.greeting;
            if (nameEl)    nameEl.textContent    = forcedByTheme.name + '!';
            badge.hidden = false;
            return;
        }

        var active = null;
        for (var i = 0; i < SEASONAL.length; i++) {
            if (isActive(SEASONAL[i].start, SEASONAL[i].end)) {
                active = SEASONAL[i];
                break;
            }
        }
        if (!active) {
            badge.hidden = true;
            if (greetEl) greetEl.textContent = '';
            if (nameEl) nameEl.textContent = '';
            return;
        }
        if (iconLeft)  iconLeft.textContent  = active.icon;
        if (iconRight) iconRight.textContent = active.icon;
        if (greetEl)   greetEl.textContent   = active.greeting;
        if (nameEl)    nameEl.textContent     = active.name + '!';
        badge.hidden = false;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showBadge);
    } else {
        showBadge();
    }

    window.addEventListener('pcformatech:themechange', showBadge);
})();
