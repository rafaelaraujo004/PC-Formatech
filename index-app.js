/* ── Badge de data comemorativa ─────────────────────────────────────────── */
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

    function doy(m, d) {
        var acc = [0,31,28,31,30,31,30,31,31,30,31,30,31];
        var n = d;
        for (var i = 1; i < m; i++) n += acc[i];
        return n;
    }

    function isActive(start, end) {
        var now  = new Date();
        var tDOY = doy(now.getMonth() + 1, now.getDate());
        var sp   = start.split('-').map(Number);
        var ep   = end.split('-').map(Number);
        var sN   = doy(sp[0], sp[1]);
        var eN   = doy(ep[0], ep[1]);
        var wraps = eN < sN;
        if (wraps) eN += 365;
        var wS = sN - PRE_EXTRA;
        var wE = eN + POST_EXTRA;
        return (tDOY >= wS && tDOY <= wE) ||
               (wraps && (tDOY + 365 >= wS && tDOY + 365 <= wE));
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
/* ─────────────────────────────────────────────────────────────────────────── */

function toggleWhatsApp() {
            const chat = document.getElementById('whatsappChat');
            chat.classList.toggle('active');
        }
        
        // Fechar ao clicar fora
        document.addEventListener('click', function(event) {
            const widget = document.querySelector('.whatsapp-widget');
            const chat = document.getElementById('whatsappChat');
            if (!widget.contains(event.target) && chat.classList.contains('active')) {
                chat.classList.remove('active');
            }
        });

        function rebuildHeroIndicators() {
            var slider = document.querySelector('.hero-slider');
            var indicators = document.querySelector('.hero-indicators');
            if (!slider || !indicators) return;
            var remaining = slider.querySelectorAll('.hero-slide');
            indicators.innerHTML = '';
            remaining.forEach(function(_, i) {
                var ind = document.createElement('span');
                ind.className = 'indicator' + (i === 0 ? ' active' : '');
                ind.setAttribute('data-slide', i);
                indicators.appendChild(ind);
            });
            if (remaining.length > 0) {
                remaining.forEach(function(s) { s.classList.remove('active'); });
                remaining[0].classList.add('active');
            }
        }

        function loadSlides(slides) {
            const heroSlider = document.querySelector('.hero-slider');
            const heroIndicators = document.querySelector('.hero-indicators');
            
            if (heroSlider && slides && slides.length > 0) {
                heroSlider.innerHTML = '';
                heroIndicators.innerHTML = '';
                
                slides.forEach((slide, index) => {
                    const slideDiv = document.createElement('div');
                    slideDiv.className = 'hero-slide' + (index === 0 ? ' active' : '');

                    const img = document.createElement('img');
                    img.alt = slide.alt;
                    img.setAttribute('decoding', 'async');
                    if (index === 0) {
                        img.setAttribute('fetchpriority', 'high');
                        img.setAttribute('loading', 'eager');
                    } else {
                        img.setAttribute('loading', 'lazy');
                    }
                    img.addEventListener('error', function onImgError() {
                        img.removeEventListener('error', onImgError);
                        slideDiv.remove();
                        rebuildHeroIndicators();
                        if (typeof window.initHeroCarousel === 'function') {
                            window.initHeroCarousel();
                        }
                    });
                    img.src = slide.url;

                    slideDiv.appendChild(img);
                    heroSlider.appendChild(slideDiv);

                    const indicator = document.createElement('span');
                    indicator.className = 'indicator' + (index === 0 ? ' active' : '');
                    indicator.setAttribute('data-slide', index);
                    heroIndicators.appendChild(indicator);
                });

                if (typeof window.initHeroCarousel === 'function') {
                    window.initHeroCarousel();
                }
                
                console.log('✅ Slides carregados!');
            }
        }

        // Presenca centralizada em theme-system.js
        (function() {
            if (window.PCFTPresenceTracker && typeof window.PCFTPresenceTracker.start === 'function') {
                window.PCFTPresenceTracker.start();
            }
        })();

        document.addEventListener('DOMContentLoaded', () => {
            // Tentar carregar do Firebase primeiro
            if (typeof db !== 'undefined' && db) {
                try {
                    db.collection('slider')
                        .doc('images')
                        .onSnapshot((doc) => {
                            if (doc.exists && doc.data().slides) {
                                const firebaseSlides = doc.data().slides;
                                const htmlSlides = document.querySelectorAll('.hero-slide');
                                // Só usa Firebase se tiver pelo menos tantos slides quanto o HTML
                                if (firebaseSlides.length >= htmlSlides.length) {
                                    loadSlides(firebaseSlides);
                                    console.log('✅ Slides carregados do Firebase (sincronizados)!');
                                } else {
                                    console.log('ℹ️ Firebase tem menos slides que o HTML, mantendo slides do HTML.');
                                }
                            } else {
                                // Se não houver dados no Firebase, carregar do localStorage
                                const savedSlides = localStorage.getItem('pcformatech_hero_slides');
                                if (savedSlides) {
                                    loadSlides(JSON.parse(savedSlides));
                                    console.log('✅ Slides carregados do localStorage');
                                }
                            }
                        });
                } catch (error) {
                    console.warn('Firebase não disponível, usando localStorage:', error);
                    const savedSlides = localStorage.getItem('pcformatech_hero_slides');
                    if (savedSlides) {
                        loadSlides(JSON.parse(savedSlides));
                    }
                }
            } else {
                // Fallback para localStorage
                const savedSlides = localStorage.getItem('pcformatech_hero_slides');
                if (savedSlides) {
                    loadSlides(JSON.parse(savedSlides));
                }
            }
        });
