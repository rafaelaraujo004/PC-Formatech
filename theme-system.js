(function () {
    const LEGACY_THEME_STORAGE_KEY = 'pcformatech-theme';
    const LEGACY_DARKMODE_STORAGE_KEY = 'pcft-theme';
    const DEFAULT_SETTINGS_STORAGE_KEY = 'pcformatech_theme_settings';
    const THEME_MANIFEST_PATH = 'themes/manifest.json';
    const THEME_REMOTE_COLLECTION = 'siteSettings';
    const THEME_REMOTE_DOC = 'themeManager';
    const THEME_EFFECT_PREFIX = 'pcft-effect-';
    const THEME_FONT_PREFIX = 'pcft-theme-font-';
    const THEME_READY_EVENT = 'pcformatech:themeready';
    const THEME_CHANGE_EVENT = 'pcformatech:themechange';
    const BANNER_CHANGE_EVENT = 'pcformatech:bannerchange';

    const PRESENCE_SESSION_KEY = 'pcft_sess';
    const PRESENCE_SESSION_START_KEY = 'pcft_sess_started_at';
    const PRESENCE_VISITOR_KEY = 'pcft_vid';
    const PRESENCE_HEARTBEAT_MS = 15000;
    const PRESENCE_FIREBASE_WAIT_MS = 500;
    const PRESENCE_FIREBASE_MAX_RETRIES = 40;
    const PRESENCE_HISTORY_MIN_WRITE_MS = 60000;

    const EMBEDDED_MANIFEST = {
        defaultThemeId: 'classico-neutro',
        fallbackThemeId: 'classico-neutro',
        storageKey: DEFAULT_SETTINGS_STORAGE_KEY,
        themes: [
            // Temas padrão — claro
            { id: 'classico-neutro',          path: 'themes/classico-neutro.json' },
            { id: 'light-clean',              path: 'themes/light-clean.json' },
            { id: 'profissional-corporativo', path: 'themes/profissional-corporativo.json' },
            { id: 'sunset-quente',            path: 'themes/sunset-quente.json' },
            { id: 'cobre-premium',            path: 'themes/cobre-premium.json' },
            { id: 'rosa-moderno',             path: 'themes/rosa-moderno.json' },
            // Temas padrão — escuro
            { id: 'dark-tech',                path: 'themes/dark-tech.json' },
            { id: 'gamer-rgb',                path: 'themes/gamer-rgb.json' },
            { id: 'oceano-azul',              path: 'themes/oceano-azul.json' },
            { id: 'floresta-verde',           path: 'themes/floresta-verde.json' },
            { id: 'roxo-tech',                path: 'themes/roxo-tech.json' },
            // Temas sazonais
            { id: 'natal',                    path: 'themes/natal.json' },
            { id: 'ano-novo',                 path: 'themes/ano-novo.json' },
            { id: 'pascoa',                   path: 'themes/pascoa.json' },
            { id: 'dia-das-maes',             path: 'themes/dia-das-maes.json' },
            { id: 'dia-dos-pais',             path: 'themes/dia-dos-pais.json' },
            { id: 'festa-junina',             path: 'themes/festa-junina.json' },
            { id: 'dia-das-criancas',         path: 'themes/dia-das-criancas.json' },
            { id: 'halloween',                path: 'themes/halloween.json' }
        ]
    };

    const EMBEDDED_FALLBACK_THEME = normalizeTheme({
        id: 'classico-neutro',
        name: 'Clássico Neutro',
        category: 'standard',
        mode: 'light',
        description: 'Tema padrão local do PC Formatech.',
        fonts: {
            heading: { family: "'Inter', sans-serif" },
            body: { family: "'Inter', sans-serif" }
        },
        preview: {
            cover: 'linear-gradient(135deg, #f8fafc 0%, #dbe4ef 55%, #93a6c0 100%)',
            accent: '#46637f',
            surface: '#ffffff'
        },
        effects: ['soft-bloom'],
        tokens: {
            metaColor: '#46637f',
            themeBg: '#f7fafc',
            themeText: '#243548',
            themeSurface: '#ffffff',
            themeSurface2: '#eff4f8',
            themeSurface3: '#e3ebf3',
            themeBorder: '#d4deea',
            themeBorderStrong: '#bfcedf',
            themeMuted: '#61768c',
            themeFaint: '#8ea0b2',
            accent: '#46637f',
            accentStrong: '#324a62',
            accentSoft: 'rgba(70, 99, 127, 0.12)',
            pageBackground: 'radial-gradient(circle at top left, rgba(219, 228, 239, 0.62) 0%, rgba(247, 250, 252, 0.98) 44%, #eef4f8 100%)',
            headerBackground: 'linear-gradient(135deg, rgba(241, 245, 249, 0.96) 0%, rgba(219, 228, 239, 0.94) 100%)',
            footerBackground: 'linear-gradient(135deg, rgba(232, 239, 246, 0.98) 0%, rgba(219, 228, 239, 0.98) 100%)',
            sectionBackground: 'linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(247, 250, 252, 0.98) 100%)',
            sectionAltBackground: 'linear-gradient(180deg, rgba(239, 244, 248, 0.96) 0%, rgba(227, 235, 243, 0.98) 100%)',
            cardBackground: 'rgba(255, 255, 255, 0.94)',
            cardBorder: 'rgba(70, 99, 127, 0.1)',
            heroOverlay: 'linear-gradient(135deg, rgba(255, 255, 255, 0.34) 0%, rgba(239, 244, 248, 0.42) 55%, rgba(147, 166, 192, 0.22) 100%)',
            heroFrame: 'rgba(70, 99, 127, 0.14)',
            buttonBackground: 'linear-gradient(135deg, #46637f 0%, #6b89a6 100%)',
            buttonText: '#f7fafc',
            buttonShadow: '0 16px 32px rgba(70, 99, 127, 0.18)',
            decorationTop: 'radial-gradient(circle at 14% 12%, rgba(255,255,255,0.82) 0 28px, transparent 29px), radial-gradient(circle at 82% 10%, rgba(147,166,192,0.22) 0 22px, transparent 23px)',
            decorationBottom: 'radial-gradient(circle at bottom left, rgba(70, 99, 127, 0.06) 0%, transparent 34%), radial-gradient(circle at bottom right, rgba(148, 163, 184, 0.08) 0%, transparent 40%)',
            badgeBackground: 'rgba(70, 99, 127, 0.1)',
            badgeText: '#324a62',
            indicator: 'rgba(70, 99, 127, 0.16)',
            indicatorActive: '#46637f',
            chipBackground: 'rgba(255, 255, 255, 0.74)',
            chipText: '#324a62'
        },
        banner: {
            slides: [
                {
                    title: 'PC Formatech',
                    subtitle: 'Tema padrão local carregado automaticamente.',
                    tag: 'Fallback',
                    scene: 'Banner padrão do sistema de temas',
                    alt: 'Banner padrão do sistema de temas do PC Formatech',
                    illustration: 'steady-workflow',
                    palette: ['#f8fafc', '#dbe4ef', '#93a6c0', '#46637f'],
                    accent: '#46637f'
                }
            ]
        }
    });

    const EMBEDDED_DARK_THEME = normalizeTheme({
        id: 'dark-tech',
        name: 'Dark Tech',
        category: 'standard',
        mode: 'dark',
        description: 'Tema escuro embutido para fallback local.',
        fonts: {
            heading: { family: "'Inter', sans-serif" },
            body: { family: "'Inter', sans-serif" }
        },
        preview: {
            cover: 'linear-gradient(135deg, #090f1b 0%, #13243a 55%, #203a56 100%)',
            accent: '#5fc9be',
            surface: '#111c2e'
        },
        effects: [],
        tokens: {
            metaColor: '#13243a',
            themeBg: '#090f1b',
            themeText: '#dce8f5',
            themeSurface: '#111c2e',
            themeSurface2: '#172437',
            themeSurface3: '#1f2f47',
            themeBorder: '#263d58',
            themeBorderStrong: '#344f6e',
            themeMuted: '#8fadc8',
            themeFaint: '#5d7896',
            accent: '#5fc9be',
            accentStrong: '#41a89d',
            accentSoft: 'rgba(95, 201, 190, 0.2)',
            pageBackground: 'radial-gradient(ellipse at 20% 0%, #13243a 0%, #090f1b 55%, #060c14 100%)',
            headerBackground: 'linear-gradient(135deg, #0d1e30 0%, #091629 100%)',
            footerBackground: 'linear-gradient(135deg, #0d1e30 0%, #07111e 100%)',
            sectionBackground: 'linear-gradient(180deg, #0e1929 0%, #0b1520 100%)',
            sectionAltBackground: 'linear-gradient(180deg, #0b1520 0%, #091421 100%)',
            cardBackground: '#111c2e',
            cardBorder: 'rgba(38, 61, 88, 0.8)',
            heroOverlay: 'linear-gradient(135deg, rgba(0, 0, 0, .68) 0%, rgba(5, 15, 30, .58) 50%, rgba(0, 0, 0, .68) 100%)',
            heroFrame: 'rgba(95, 201, 190, 0.2)',
            buttonBackground: 'linear-gradient(135deg, #41a89d 0%, #5fc9be 100%)',
            buttonText: '#091629',
            buttonShadow: '0 16px 32px rgba(0, 0, 0, 0.35)',
            decorationTop: 'none',
            decorationBottom: 'none',
            badgeBackground: 'rgba(95, 201, 190, .12)',
            badgeText: '#5fc9be',
            indicator: 'rgba(95, 201, 190, .16)',
            indicatorActive: '#5fc9be',
            chipBackground: 'rgba(23, 36, 55, .9)',
            chipText: '#dce8f5'
        },
        banner: {
            slides: [
                {
                    title: 'PC Formatech',
                    subtitle: 'Tema escuro fallback carregado automaticamente.',
                    tag: 'Dark',
                    scene: 'Operacao noturna',
                    alt: 'Banner escuro fallback do sistema de temas',
                    illustration: 'cyber',
                    palette: ['#090f1b', '#13243a', '#203a56', '#5fc9be'],
                    accent: '#5fc9be'
                }
            ]
        }
    });

    const DEFAULT_SETTINGS = {
        activeThemeId: 'classico-neutro',
        fallbackThemeId: 'classico-neutro',
        autoSeasonal: true,
        updatedAt: 0
    };

    function safeGet(storage, key) {
        try {
            return storage.getItem(key);
        } catch (error) {
            return null;
        }
    }

    function safeSet(storage, key, value) {
        try {
            storage.setItem(key, value);
        } catch (error) {
            // Ignora erro de storage em ambientes restritos
        }
    }

    function safeJsonParse(value) {
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch (error) {
            return null;
        }
    }

    function getThemeMeta() {
        return document.querySelector("meta[name='theme-color']");
    }

    function updateMetaThemeColor(color) {
        const meta = getThemeMeta();
        if (!meta || !color) return;
        meta.setAttribute('content', color);
    }

    function getFirebaseContext() {
        if (
            typeof window.db === 'undefined' ||
            !window.db ||
            typeof window.firebase === 'undefined' ||
            !window.firebase ||
            !window.firebase.firestore
        ) {
            return null;
        }
        return { db: window.db, firebase: window.firebase };
    }

    function normalizeTheme(theme) {
        const source = theme || {};
        return {
            id: source.id || 'classico-neutro',
            name: source.name || 'Tema sem nome',
            category: source.category || 'standard',
            mode: source.mode === 'dark' ? 'dark' : 'light',
            description: source.description || '',
            sortOrder: Number.isFinite(Number(source.sortOrder)) ? Number(source.sortOrder) : 999,
            schedule: source.schedule || null,
            fonts: {
                heading: source.fonts && source.fonts.heading ? source.fonts.heading : { family: "'Inter', sans-serif" },
                body: source.fonts && source.fonts.body ? source.fonts.body : { family: "'Inter', sans-serif" }
            },
            preview: source.preview || {},
            effects: Array.isArray(source.effects) ? source.effects.slice() : [],
            decorations: Array.isArray(source.decorations) ? source.decorations.slice() : [],
            tokens: source.tokens || {},
            banner: {
                title: source.banner && source.banner.title ? source.banner.title : source.name || 'Tema',
                subtitle: source.banner && source.banner.subtitle ? source.banner.subtitle : '',
                slides: source.banner && Array.isArray(source.banner.slides) ? source.banner.slides.slice() : []
            }
        };
    }

    function fetchJson(path) {
        return fetch(path, { cache: 'no-store' }).then((response) => {
            if (!response.ok) {
                throw new Error('Falha ao carregar ' + path + ': ' + response.status);
            }
            return response.json();
        });
    }

    function toTimestamp(value) {
        if (!value) return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const parsed = Date.parse(value);
            return Number.isFinite(parsed) ? parsed : 0;
        }
        if (typeof value.toDate === 'function') {
            return value.toDate().getTime();
        }
        return 0;
    }

    function getMonthDayToken(date) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return Number(month + day);
    }

    function isWithinSchedule(schedule, date) {
        if (!schedule || !schedule.start || !schedule.end) return false;
        const current = getMonthDayToken(date);
        const start = Number(String(schedule.start).replace('-', ''));
        const end = Number(String(schedule.end).replace('-', ''));
        if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
        if (start <= end) {
            return current >= start && current <= end;
        }
        return current >= start || current <= end;
    }

    function escapeXml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function wrapText(value, maxChars, maxLines) {
        const words = String(value || '').split(/\s+/).filter(Boolean);
        if (!words.length) return [];

        const lines = [];
        let current = '';

        words.forEach((word) => {
            const nextLine = current ? current + ' ' + word : word;
            if (nextLine.length <= maxChars || !current) {
                current = nextLine;
                return;
            }
            lines.push(current);
            current = word;
        });

        if (current) {
            lines.push(current);
        }

        return lines.slice(0, maxLines || lines.length);
    }

    function createSvgTextLines(lines, x, startY, size, color, weight, lineHeight) {
        return lines.map((line, index) => {
            const y = startY + (index * lineHeight);
            return '<text x="' + x + '" y="' + y + '" fill="' + color + '" font-size="' + size + '" font-weight="' + weight + '" font-family="Inter, Segoe UI, Arial, sans-serif">' + escapeXml(line) + '</text>';
        }).join('');
    }

    function renderIllustrationAccent(illustration, palette, accent) {
        const fillA = palette[1] || accent;
        const fillB = palette[2] || accent;
        const fillC = palette[3] || '#ffffff';
        const name = String(illustration || '').toLowerCase();

        if (/(holiday|gift|family-tech|mother|premium-gift)/.test(name)) {
            return [
                '<circle cx="1190" cy="120" r="28" fill="' + fillB + '" fill-opacity="0.22"/>',
                '<circle cx="1265" cy="160" r="16" fill="' + fillC + '" fill-opacity="0.35"/>',
                '<path d="M1110 116 Q1180 68 1260 110" stroke="' + fillA + '" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.48"/>',
                '<path d="M1120 146 Q1190 98 1270 140" stroke="' + fillB + '" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.42"/>'
            ].join('');
        }

        if (/(fireworks|celebration|countdown|city)/.test(name)) {
            return [
                '<path d="M1170 94 l0 46 M1147 117 l46 0 M1153 101 l34 32 M1187 101 l-34 32" stroke="' + fillB + '" stroke-width="6" stroke-linecap="round" opacity="0.48"/>',
                '<path d="M1270 132 l0 38 M1251 151 l38 0 M1258 139 l24 24 M1282 139 l-24 24" stroke="' + fillC + '" stroke-width="5" stroke-linecap="round" opacity="0.42"/>'
            ].join('');
        }

        if (/(easter|spring|family-spring)/.test(name)) {
            return [
                '<ellipse cx="1160" cy="142" rx="28" ry="38" fill="' + fillB + '" fill-opacity="0.28"/>',
                '<ellipse cx="1234" cy="126" rx="22" ry="31" fill="' + fillC + '" fill-opacity="0.32"/>',
                '<ellipse cx="1290" cy="160" rx="18" ry="24" fill="' + fillA + '" fill-opacity="0.26"/>'
            ].join('');
        }

        if (/(father|family|daily|office|executive|meeting|corporate)/.test(name)) {
            return [
                '<rect x="1128" y="94" width="176" height="112" rx="20" fill="' + fillA + '" fill-opacity="0.14" stroke="' + fillB + '" stroke-opacity="0.24"/>',
                '<rect x="1152" y="120" width="52" height="52" rx="14" fill="' + fillB + '" fill-opacity="0.24"/>',
                '<rect x="1218" y="120" width="66" height="14" rx="7" fill="' + fillC + '" fill-opacity="0.4"/>',
                '<rect x="1218" y="148" width="44" height="12" rx="6" fill="' + fillB + '" fill-opacity="0.3"/>'
            ].join('');
        }

        if (/(rgb|cyber|circuit|streamer|neon|gamer)/.test(name)) {
            return [
                '<path d="M1124 112 H1292" stroke="' + fillA + '" stroke-width="5" opacity="0.44"/>',
                '<path d="M1150 142 H1266" stroke="' + fillB + '" stroke-width="5" opacity="0.44"/>',
                '<path d="M1180 172 H1236" stroke="' + fillC + '" stroke-width="5" opacity="0.44"/>',
                '<circle cx="1278" cy="108" r="16" fill="' + fillA + '" fill-opacity="0.24"/>'
            ].join('');
        }

        return [
            '<circle cx="1180" cy="126" r="24" fill="' + fillB + '" fill-opacity="0.22"/>',
            '<circle cx="1262" cy="156" r="16" fill="' + fillC + '" fill-opacity="0.3"/>'
        ].join('');
    }

    function createBannerSlide(theme, slide, index) {
        const palette = Array.isArray(slide.palette) && slide.palette.length
            ? slide.palette.slice(0, 4)
            : [
                theme.tokens.metaColor || theme.tokens.accent || '#0B3D3D',
                theme.tokens.accent || '#40998F',
                theme.tokens.accentStrong || '#2D7A7A',
                '#ffffff'
            ];
        const accent = slide.accent || theme.tokens.accentStrong || theme.tokens.accent || '#40998F';
        const titleLines = wrapText(slide.title || theme.name, 26, 2);
        const subtitleLines = wrapText(slide.subtitle || theme.description, 50, 3);
        const sceneLines = wrapText(slide.scene || '', 42, 2);
        const tag = slide.tag || theme.name;
        const illustration = renderIllustrationAccent(slide.illustration, palette, accent);

        const svg = [
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 560" role="img" aria-label="' + escapeXml(slide.alt || slide.title || theme.name) + '">',
            '<defs>',
            '<linearGradient id="bg' + index + '" x1="0" y1="0" x2="1" y2="1">',
            '<stop offset="0%" stop-color="' + palette[0] + '"/>',
            '<stop offset="52%" stop-color="' + palette[1] + '"/>',
            '<stop offset="100%" stop-color="' + palette[2] + '"/>',
            '</linearGradient>',
            '<radialGradient id="glow' + index + '" cx="72%" cy="24%" r="58%">',
            '<stop offset="0%" stop-color="' + accent + '" stop-opacity="0.48"/>',
            '<stop offset="100%" stop-color="' + accent + '" stop-opacity="0"/>',
            '</radialGradient>',
            '<filter id="blur' + index + '"><feGaussianBlur stdDeviation="24"/></filter>',
            '</defs>',
            '<rect width="1600" height="560" fill="url(#bg' + index + ')"/>',
            '<rect width="1600" height="560" fill="rgba(3, 7, 18, ' + (theme.mode === 'dark' ? '0.16' : '0.06') + ')"/>',
            '<circle cx="1170" cy="138" r="190" fill="url(#glow' + index + ')" filter="url(#blur' + index + ')"/>',
            '<circle cx="290" cy="470" r="220" fill="' + palette[3] + '" fill-opacity="0.12" filter="url(#blur' + index + ')"/>',
            '<rect x="74" y="74" width="740" height="412" rx="36" fill="rgba(255,255,255,' + (theme.mode === 'dark' ? '0.05' : '0.32') + ')" stroke="rgba(255,255,255,' + (theme.mode === 'dark' ? '0.12' : '0.44') + ')"/>',
            '<rect x="116" y="108" width="182" height="44" rx="22" fill="rgba(255,255,255,' + (theme.mode === 'dark' ? '0.12' : '0.72') + ')"/>',
            '<text x="146" y="136" fill="' + (theme.mode === 'dark' ? '#ffffff' : '#213045') + '" font-size="22" font-weight="700" font-family="Inter, Segoe UI, Arial, sans-serif">' + escapeXml(tag.toUpperCase()) + '</text>',
            createSvgTextLines(titleLines, 116, 218, 58, theme.mode === 'dark' ? '#ffffff' : '#203146', '800', 68),
            createSvgTextLines(subtitleLines, 116, 316, 27, theme.mode === 'dark' ? '#e2e8f0' : '#41546d', '500', 36),
            createSvgTextLines(sceneLines, 116, 434, 22, theme.mode === 'dark' ? '#cbd5e1' : '#5d7088', '500', 30),
            '<g transform="translate(940 110)">',
            '<rect x="40" y="42" width="430" height="248" rx="24" fill="rgba(2, 6, 23, 0.28)"/>',
            '<rect x="64" y="66" width="382" height="208" rx="20" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.22)"/>',
            '<rect x="90" y="92" width="330" height="154" rx="16" fill="rgba(255,255,255,0.88)"/>',
            '<rect x="116" y="118" width="278" height="96" rx="16" fill="' + palette[1] + '" fill-opacity="0.86"/>',
            '<rect x="184" y="272" width="142" height="18" rx="9" fill="rgba(255,255,255,0.22)"/>',
            '<rect x="154" y="300" width="202" height="14" rx="7" fill="rgba(255,255,255,0.16)"/>',
            '<rect x="0" y="260" width="270" height="150" rx="28" fill="rgba(2,6,23,0.28)" stroke="rgba(255,255,255,0.2)"/>',
            '<rect x="28" y="286" width="214" height="92" rx="16" fill="rgba(255,255,255,0.88)"/>',
            '<rect x="52" y="308" width="166" height="48" rx="12" fill="' + palette[2] + '" fill-opacity="0.78"/>',
            illustration,
            '</g>',
            '<rect x="0" y="504" width="1600" height="56" fill="rgba(2, 6, 23, ' + (theme.mode === 'dark' ? '0.24' : '0.08') + ')"/>',
            '<text x="86" y="540" fill="' + (theme.mode === 'dark' ? '#f8fafc' : '#30465d') + '" font-size="20" font-weight="600" font-family="Inter, Segoe UI, Arial, sans-serif">' + escapeXml(theme.name + ' • ' + (slide.scene || 'Tecnologia com identidade visual própria')) + '</text>',
            '</svg>'
        ].join('');

        return {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
            alt: slide.alt || slide.title || theme.name,
            themeId: theme.id,
            title: slide.title || theme.name
        };
    }

    // Detecta luminosidade a partir do primeiro rgba/rgb/hex de um gradiente CSS
    function bgLuminance(css) {
        var s = css || '';
        // rgba() ou rgb()
        var m = s.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
        if (m) return (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]) / 255;
        // hex 6 dígitos
        var h = s.match(/#([0-9a-fA-F]{6})/);
        if (h) {
            var r = parseInt(h[1].slice(0,2), 16), g = parseInt(h[1].slice(2,4), 16), b = parseInt(h[1].slice(4,6), 16);
            return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        }
        // hex 3 dígitos
        var h3 = s.match(/#([0-9a-fA-F]{3})\b/);
        if (h3) {
            var r = parseInt(h3[1][0]+h3[1][0], 16), g = parseInt(h3[1][1]+h3[1][1], 16), b = parseInt(h3[1][2]+h3[1][2], 16);
            return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        }
        return 0.2; // assume escuro
    }

    function buildThemeVariables(theme) {
        const tokens = theme.tokens || {};
        const isDark = theme.mode === 'dark';

        // Cores adaptativas para header e footer calculadas por luminosidade
        const THRESHOLD = 0.55;
        const headerLum  = bgLuminance(tokens.headerBackground);
        const footerLum  = bgLuminance(tokens.footerBackground);
        const headerText = isDark
            ? 'rgba(255,255,255,0.95)'
            : (headerLum > THRESHOLD
                ? (tokens.accentStrong || tokens.themeText || '#1a1a1a')
                : 'rgba(255,255,255,0.95)');
        const footerText = footerLum > THRESHOLD
            ? (tokens.themeText || '#1a1a1a')
            : 'rgba(255,255,255,0.95)';
        const footerIcon = footerLum > THRESHOLD
            ? (tokens.accent || '#2D7A7A')
            : 'rgba(255,255,255,0.88)';

        return {
            '--theme-bg': tokens.themeBg,
            '--theme-text': tokens.themeText,
            '--theme-surface': tokens.themeSurface,
            '--theme-surface-2': tokens.themeSurface2,
            '--theme-surface-3': tokens.themeSurface3,
            '--theme-border': tokens.themeBorder,
            '--theme-border-2': tokens.themeBorderStrong,
            '--theme-shadow': isDark ? '0 12px 34px rgba(0, 0, 0, 0.48)' : '0 10px 28px rgba(15, 23, 42, 0.12)',
            '--theme-shadow-lg': isDark ? '0 18px 48px rgba(0, 0, 0, 0.62)' : '0 18px 44px rgba(15, 23, 42, 0.16)',
            '--theme-muted': tokens.themeMuted,
            '--theme-faint': tokens.themeFaint,
            '--theme-accent': tokens.accent,
            '--theme-accent-2': tokens.accentStrong,
            '--theme-accent-glow': tokens.accentSoft,
            '--primary-color': tokens.accentStrong || tokens.accent,
            '--secondary-color': tokens.accent,
            '--accent-color': tokens.accent,
            '--success-color': tokens.accent,
            '--warning-color': tokens.accentStrong || tokens.accent,
            '--text-color': tokens.themeText,
            '--text-light': tokens.themeMuted,
            '--light-bg': tokens.themeSurface2,
            '--gradient': tokens.headerBackground,
            '--gradient-accent': tokens.buttonBackground,
            '--gradient-subtle': tokens.sectionAltBackground,
            '--shadow-sm': isDark ? '0 2px 8px rgba(0, 0, 0, 0.34)' : '0 2px 8px rgba(15, 23, 42, 0.08)',
            '--shadow-md': isDark ? '0 8px 18px rgba(0, 0, 0, 0.38)' : '0 8px 18px rgba(15, 23, 42, 0.12)',
            '--shadow-lg': isDark ? '0 12px 32px rgba(0, 0, 0, 0.48)' : '0 14px 30px rgba(15, 23, 42, 0.14)',
            '--shadow-xl': isDark ? '0 18px 48px rgba(0, 0, 0, 0.58)' : '0 20px 54px rgba(15, 23, 42, 0.18)',
            '--pcft-meta-color': tokens.metaColor || tokens.accent,
            '--pcft-page-background': tokens.pageBackground,
            '--pcft-header-background': tokens.headerBackground,
            '--pcft-footer-background': tokens.footerBackground,
            '--pcft-section-background': tokens.sectionBackground,
            '--pcft-section-alt-background': tokens.sectionAltBackground,
            '--pcft-card-background': tokens.cardBackground,
            '--pcft-card-border': tokens.cardBorder,
            '--pcft-hero-overlay': tokens.heroOverlay,
            '--pcft-hero-frame': tokens.heroFrame,
            '--pcft-button-background': tokens.buttonBackground,
            '--pcft-button-text': tokens.buttonText,
            '--pcft-button-shadow': tokens.buttonShadow,
            '--pcft-decoration-top': theme.category === 'seasonal' ? 'none' : tokens.decorationTop,
            '--pcft-decoration-bottom': theme.category === 'seasonal' ? 'none' : tokens.decorationBottom,
            '--pcft-badge-background': tokens.badgeBackground,
            '--pcft-badge-text': tokens.badgeText,
            '--pcft-indicator': tokens.indicator,
            '--pcft-indicator-active': tokens.indicatorActive,
            '--pcft-chip-background': tokens.chipBackground,
            '--pcft-chip-text': tokens.chipText,
            '--pcft-font-heading': (theme.fonts.heading && theme.fonts.heading.family) || "'Inter', sans-serif",
            '--pcft-font-body': (theme.fonts.body && theme.fonts.body.family) || "'Inter', sans-serif",
            '--pcft-text-color': tokens.themeText,
            '--pcft-muted-color': tokens.themeMuted,
            '--pcft-heading-color': tokens.themeText,
            '--pcft-preview-cover': (theme.preview && theme.preview.cover) || tokens.pageBackground || tokens.headerBackground,
            '--pcft-header-text': headerText,
            '--pcft-footer-text': footerText,
            '--pcft-footer-icon': footerIcon
        };
    }

    function applyThemeVariables(theme) {
        const root = document.documentElement;
        const variables = buildThemeVariables(theme);
        Object.keys(variables).forEach((key) => {
            if (variables[key]) {
                root.style.setProperty(key, variables[key]);
            }
        });
        root.setAttribute('data-theme', theme.mode);
        root.setAttribute('data-theme-id', theme.id);
        root.setAttribute('data-theme-category', theme.category);
        updateMetaThemeColor(theme.tokens.metaColor || theme.tokens.accent || '#0B3D3D');
    }

    function syncThemeEffects(theme) {
        if (!document.body) return;
        const body = document.body;
        Array.from(body.classList).forEach((className) => {
            if (className.indexOf(THEME_EFFECT_PREFIX) === 0) {
                body.classList.remove(className);
            }
        });
        (theme.effects || []).forEach((effect) => {
            body.classList.add(THEME_EFFECT_PREFIX + effect);
        });
    }

    function maybeInjectFont(url, id) {
        if (!url || document.getElementById(id)) return;
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
    }

    function injectThemeFonts(theme) {
        if (!theme || !theme.fonts) return;
        maybeInjectFont(theme.fonts.heading && theme.fonts.heading.url, THEME_FONT_PREFIX + theme.id + '-heading');
        maybeInjectFont(theme.fonts.body && theme.fonts.body.url, THEME_FONT_PREFIX + theme.id + '-body');
    }

    const DECO_CONTAINER_ID = 'pcft-decorations';

    function applyDecorations(theme) {
        function render() {
            var existing = document.getElementById(DECO_CONTAINER_ID);
            if (existing && existing.parentNode) {
                existing.parentNode.removeChild(existing);
            }
            var items = theme && Array.isArray(theme.decorations) ? theme.decorations : [];
            if (!items.length || !document.body) return;

            var container = document.createElement('div');
            container.id = DECO_CONTAINER_ID;
            container.setAttribute('aria-hidden', 'true');

            items.forEach(function (item) {
                var icon    = String(item.icon || '');
                var count   = Math.min(Math.max(Number(item.count) || 5, 1), 15);
                var anim    = item.animation || 'pcft-fall';
                var size    = item.size || '1.4rem';
                var opacity = Number.isFinite(Number(item.opacity)) ? Number(item.opacity) : 0.75;
                var baseDur = Number(item.duration) || 9;
                var timing  = (anim === 'pcft-fall' || anim === 'pcft-float-up') ? 'linear' : 'ease-in-out';

                for (var i = 0; i < count; i++) {
                    var span = document.createElement('span');
                    span.className   = 'pcft-deco-icon';
                    span.textContent = icon;
                    span.setAttribute('aria-hidden', 'true');
                    span.style.fontSize = size;
                    span.style.opacity  = String(opacity);

                    var dur   = (baseDur * 0.7 + Math.random() * baseDur * 0.6).toFixed(2) + 's';
                    var delay = '-' + (Math.random() * baseDur).toFixed(2) + 's';

                    span.style.animationName           = anim;
                    span.style.animationDuration       = dur;
                    span.style.animationDelay          = delay;
                    span.style.animationIterationCount = 'infinite';
                    span.style.animationTimingFunction = timing;
                    span.style.animationFillMode       = 'both';

                    if (anim === 'pcft-fall') {
                        span.style.left = (Math.random() * 94).toFixed(1) + '%';
                        span.style.top  = '-60px';
                    } else if (anim === 'pcft-float-up') {
                        span.style.left   = (Math.random() * 94).toFixed(1) + '%';
                        span.style.bottom = '-60px';
                    } else {
                        span.style.left = (Math.random() * 90).toFixed(1) + '%';
                        span.style.top  = (10 + Math.random() * 75).toFixed(1) + '%';
                    }

                    container.appendChild(span);
                }
            });

            document.body.appendChild(container);

            // Fade-out após 10s — some apenas as decorações, não o badge de texto
            setTimeout(function () {
                container.style.transition = 'opacity 1s ease-out';
                container.style.opacity = '0';
                setTimeout(function () {
                    if (container.parentNode) container.parentNode.removeChild(container);
                }, 1000);
            }, 10000);
        }

        if (document.body) {
            render();
        } else {
            document.addEventListener('DOMContentLoaded', render, { once: true });
        }
    }

    function createThemeManager() {
        let manifest = null;
        let settingsStorageKey = DEFAULT_SETTINGS_STORAGE_KEY;
        let themeList = [EMBEDDED_FALLBACK_THEME, EMBEDDED_DARK_THEME];
        let themeMap = new Map([
            [EMBEDDED_FALLBACK_THEME.id, EMBEDDED_FALLBACK_THEME],
            [EMBEDDED_DARK_THEME.id, EMBEDDED_DARK_THEME]
        ]);
        let currentSettings = null;
        let currentTheme = EMBEDDED_FALLBACK_THEME;
        let currentBannerSlides = currentTheme.banner.slides.map((slide, index) => createBannerSlide(currentTheme, slide, index));
        let previewThemeId = null;
        let ready = false;
        let initPromise = null;
        let remoteUnsubscribe = null;
        const subscribers = new Set();

        function getThemeById(themeId) {
            return themeMap.get(themeId) || themeMap.get(manifest && manifest.defaultThemeId) || themeMap.get(EMBEDDED_FALLBACK_THEME.id) || EMBEDDED_FALLBACK_THEME;
        }

        function getLegacyThemeId() {
            const darkmodeLegacy = safeGet(localStorage, LEGACY_DARKMODE_STORAGE_KEY);
            if (darkmodeLegacy === 'dark') return 'dark-tech';
            if (darkmodeLegacy === 'light') return 'light-clean';

            const legacy = safeGet(localStorage, LEGACY_THEME_STORAGE_KEY);
            if (legacy === 'dark') return 'dark-tech';
            if (legacy === 'light') return 'light-clean';
            return null;
        }

        function sanitizeSettings(raw) {
            const base = {
                activeThemeId: (manifest && manifest.defaultThemeId) || DEFAULT_SETTINGS.activeThemeId,
                fallbackThemeId: (manifest && manifest.fallbackThemeId) || (manifest && manifest.defaultThemeId) || DEFAULT_SETTINGS.fallbackThemeId,
                autoSeasonal: true,
                updatedAt: 0
            };
            const source = raw || {};
            return {
                activeThemeId: typeof source.activeThemeId === 'string' && source.activeThemeId ? source.activeThemeId : base.activeThemeId,
                fallbackThemeId: typeof source.fallbackThemeId === 'string' && source.fallbackThemeId ? source.fallbackThemeId : base.fallbackThemeId,
                autoSeasonal: source.autoSeasonal !== false,
                updatedAt: toTimestamp(source.updatedAt) || base.updatedAt
            };
        }

        function getCachedSettings() {
            const cached = safeJsonParse(safeGet(localStorage, settingsStorageKey));
            if (cached) {
                return sanitizeSettings(cached);
            }
            const legacyThemeId = getLegacyThemeId();
            if (legacyThemeId) {
                return sanitizeSettings({
                    activeThemeId: legacyThemeId,
                    fallbackThemeId: (manifest && manifest.fallbackThemeId) || DEFAULT_SETTINGS.fallbackThemeId,
                    autoSeasonal: false,
                    updatedAt: Date.now()
                });
            }
            return sanitizeSettings(DEFAULT_SETTINGS);
        }

        function cacheSettings(settings) {
            safeSet(localStorage, settingsStorageKey, JSON.stringify(settings));
            const mode = settings.activeThemeId === 'dark-tech' ? 'dark' : currentTheme.mode;
            safeSet(localStorage, LEGACY_THEME_STORAGE_KEY, mode);
            safeSet(localStorage, LEGACY_DARKMODE_STORAGE_KEY, mode);
        }

        function findSeasonalTheme(date) {
            return themeList
                .filter((theme) => theme.category === 'seasonal' && isWithinSchedule(theme.schedule, date))
                .sort((themeA, themeB) => {
                    const priorityA = themeA.schedule && Number(themeA.schedule.priority) ? Number(themeA.schedule.priority) : 0;
                    const priorityB = themeB.schedule && Number(themeB.schedule.priority) ? Number(themeB.schedule.priority) : 0;
                    if (priorityA !== priorityB) {
                        return priorityB - priorityA;
                    }
                    return themeA.sortOrder - themeB.sortOrder;
                })[0] || null;
        }

        function resolveTheme(settings, previewId) {
            if (previewId) {
                return getThemeById(previewId);
            }
            if (settings && settings.autoSeasonal) {
                const seasonal = findSeasonalTheme(new Date());
                if (seasonal) {
                    return seasonal;
                }
            }
            if (settings && settings.activeThemeId) {
                return getThemeById(settings.activeThemeId);
            }
            if (settings && settings.fallbackThemeId) {
                return getThemeById(settings.fallbackThemeId);
            }
            return getThemeById((manifest && manifest.defaultThemeId) || EMBEDDED_FALLBACK_THEME.id);
        }

        function buildBannerSlidesForTheme(theme) {
            const slides = theme && theme.banner && Array.isArray(theme.banner.slides) ? theme.banner.slides : [];
            if (!slides.length) {
                return currentBannerSlides.slice();
            }
            return slides.map((slide, index) => createBannerSlide(theme, slide, index));
        }

        function emitChange(reason) {
            const payload = {
                theme: currentTheme,
                settings: { ...currentSettings },
                bannerSlides: currentBannerSlides.slice(),
                reason: reason || 'theme-update'
            };
            subscribers.forEach((listener) => {
                try {
                    listener(payload);
                } catch (error) {
                    console.error('Erro em listener de tema:', error);
                }
            });
            window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: payload }));
            window.dispatchEvent(new CustomEvent(BANNER_CHANGE_EVENT, { detail: payload }));
        }

        function applyResolvedTheme(reason) {
            currentTheme = resolveTheme(currentSettings, previewThemeId);
            injectThemeFonts(currentTheme);
            applyThemeVariables(currentTheme);
            syncThemeEffects(currentTheme);
            applyDecorations(currentTheme);
            currentBannerSlides = buildBannerSlidesForTheme(currentTheme);
            emitChange(reason || 'apply');
            return currentTheme;
        }

        function shouldUseRemote(remoteSettings, localSettings) {
            if (!remoteSettings) return false;
            if (!localSettings) return true;
            return (remoteSettings.updatedAt || 0) >= (localSettings.updatedAt || 0);
        }

        function fetchRemoteSettings() {
            const ctx = getFirebaseContext();
            if (!ctx) return Promise.resolve(null);
            return ctx.db.collection(THEME_REMOTE_COLLECTION).doc(THEME_REMOTE_DOC).get()
                .then((doc) => (doc.exists ? sanitizeSettings(doc.data()) : null))
                .catch(() => null);
        }

        function bindRemoteSettings() {
            const ctx = getFirebaseContext();
            if (!ctx || remoteUnsubscribe) return;
            remoteUnsubscribe = ctx.db.collection(THEME_REMOTE_COLLECTION).doc(THEME_REMOTE_DOC).onSnapshot((doc) => {
                if (!doc.exists) return;
                const remoteSettings = sanitizeSettings(doc.data());
                if (!shouldUseRemote(remoteSettings, currentSettings)) return;
                currentSettings = remoteSettings;
                cacheSettings(currentSettings);
                previewThemeId = null;
                applyResolvedTheme('remote-sync');
            }, () => {
                // Mantem cache local quando a sincronizacao em tempo real falha.
            });
        }

        function persistSettings(settings) {
            cacheSettings(settings);
            const ctx = getFirebaseContext();
            if (!ctx) return Promise.resolve({ synced: false, localOnly: true });

            const payload = {
                ...settings,
                updatedAt: settings.updatedAt || Date.now(),
                updatedAtServer: ctx.firebase.firestore.FieldValue.serverTimestamp()
            };

            return ctx.db.collection(THEME_REMOTE_COLLECTION).doc(THEME_REMOTE_DOC).set(payload, { merge: true })
                .then(() => ({ synced: true }))
                .catch((error) => {
                    console.warn('Tema salvo apenas localmente:', error);
                    return { synced: false, localOnly: true, error: error };
                });
        }

        function loadCatalog() {
            return fetchJson(THEME_MANIFEST_PATH)
                .catch(() => EMBEDDED_MANIFEST)
                .then((loadedManifest) => {
                    manifest = {
                        ...EMBEDDED_MANIFEST,
                        ...loadedManifest,
                        themes: Array.isArray(loadedManifest && loadedManifest.themes) && loadedManifest.themes.length
                            ? loadedManifest.themes
                            : EMBEDDED_MANIFEST.themes
                    };
                    settingsStorageKey = manifest.storageKey || DEFAULT_SETTINGS_STORAGE_KEY;

                    return Promise.all(manifest.themes.map((entry) => {
                        return fetchJson(entry.path)
                            .then((theme) => normalizeTheme(theme))
                            .catch(() => {
                                if (entry.id === EMBEDDED_FALLBACK_THEME.id) {
                                    return EMBEDDED_FALLBACK_THEME;
                                }
                                if (entry.id === EMBEDDED_DARK_THEME.id) {
                                    return EMBEDDED_DARK_THEME;
                                }
                                return null;
                            });
                    }));
                })
                .then((loadedThemes) => {
                    const validThemes = loadedThemes.filter(Boolean);
                    const hasFallback = validThemes.some((theme) => theme.id === EMBEDDED_FALLBACK_THEME.id);
                    const hasDarkFallback = validThemes.some((theme) => theme.id === EMBEDDED_DARK_THEME.id);
                    themeList = hasFallback ? validThemes : validThemes.concat([EMBEDDED_FALLBACK_THEME]);
                    if (!hasDarkFallback) {
                        themeList = themeList.concat([EMBEDDED_DARK_THEME]);
                    }
                    themeList.sort((themeA, themeB) => themeA.sortOrder - themeB.sortOrder);
                    themeMap = new Map(themeList.map((theme) => [theme.id, theme]));
                })
                .catch(() => {
                    manifest = EMBEDDED_MANIFEST;
                    settingsStorageKey = DEFAULT_SETTINGS_STORAGE_KEY;
                    themeList = [EMBEDDED_FALLBACK_THEME, EMBEDDED_DARK_THEME];
                    themeMap = new Map([
                        [EMBEDDED_FALLBACK_THEME.id, EMBEDDED_FALLBACK_THEME],
                        [EMBEDDED_DARK_THEME.id, EMBEDDED_DARK_THEME]
                    ]);
                });
        }

        function init() {
            if (initPromise) return initPromise;

            initPromise = loadCatalog()
                .then(() => {
                    currentSettings = getCachedSettings();
                    return fetchRemoteSettings().then((remoteSettings) => {
                        if (shouldUseRemote(remoteSettings, currentSettings)) {
                            currentSettings = remoteSettings;
                            cacheSettings(currentSettings);
                        }
                    });
                })
                .catch(() => {
                    currentSettings = getCachedSettings();
                })
                .then(() => {
                    applyResolvedTheme('init');
                    bindRemoteSettings();
                    ready = true;
                    const payload = {
                        theme: currentTheme,
                        settings: { ...currentSettings },
                        bannerSlides: currentBannerSlides.slice()
                    };
                    window.dispatchEvent(new CustomEvent(THEME_READY_EVENT, { detail: payload }));
                    return payload;
                });

            return initPromise;
        }

        return {
            init: init,
            ready: function () {
                return initPromise || init();
            },
            isReady: function () {
                return ready;
            },
            getThemes: function () {
                return themeList.slice();
            },
            getThemeById: function (themeId) {
                return getThemeById(themeId);
            },
            getSettings: function () {
                return { ...(currentSettings || getCachedSettings()) };
            },
            getCurrentTheme: function () {
                return currentTheme;
            },
            getBannerSlides: function () {
                return currentBannerSlides.slice();
            },
            previewTheme: function (themeId) {
                previewThemeId = themeId;
                return Promise.resolve(applyResolvedTheme('preview'));
            },
            clearPreview: function () {
                previewThemeId = null;
                return Promise.resolve(applyResolvedTheme('preview-clear'));
            },
            saveSettings: function (partialSettings) {
                previewThemeId = null;
                currentSettings = sanitizeSettings({
                    ...currentSettings,
                    ...partialSettings,
                    updatedAt: Date.now()
                });
                applyResolvedTheme('save-settings');
                return persistSettings(currentSettings).then((result) => ({
                    ...result,
                    theme: currentTheme,
                    settings: { ...currentSettings }
                }));
            },
            subscribe: function (listener) {
                subscribers.add(listener);
                if (ready && currentTheme) {
                    listener({
                        theme: currentTheme,
                        settings: { ...currentSettings },
                        bannerSlides: currentBannerSlides.slice(),
                        reason: 'subscribe'
                    });
                }
                return function () {
                    subscribers.delete(listener);
                };
            }
        };
    }

    function shouldTrackPresence() {
        const path = (window.location.pathname || '').toLowerCase();
        return !(path.includes('/admin') || path.endsWith('admin.html'));
    }

    function getOrCreateSessionId() {
        let sessionId = safeGet(sessionStorage, PRESENCE_SESSION_KEY);
        if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
            safeSet(sessionStorage, PRESENCE_SESSION_KEY, sessionId);
        }
        return sessionId;
    }

    function getOrCreateSessionStart() {
        let startedAt = Number(safeGet(sessionStorage, PRESENCE_SESSION_START_KEY));
        if (!Number.isFinite(startedAt) || startedAt <= 0) {
            startedAt = Date.now();
            safeSet(sessionStorage, PRESENCE_SESSION_START_KEY, String(startedAt));
        }
        return startedAt;
    }

    function getOrCreateVisitorId() {
        let visitorId = safeGet(localStorage, PRESENCE_VISITOR_KEY);
        if (!visitorId) {
            visitorId = Math.random().toString(36).slice(2, 8).toUpperCase();
            safeSet(localStorage, PRESENCE_VISITOR_KEY, visitorId);
        }
        return visitorId;
    }

    function getDeviceType() {
        const ua = navigator.userAgent || '';
        if (/Tablet|iPad/i.test(ua)) return 'tablet';
        if (/Mobi|Android/i.test(ua)) return 'mobile';
        return 'desktop';
    }

    function getPagePath() {
        const path = (window.location.pathname || '/').trim();
        return path || '/';
    }

    function getPageLabel() {
        const title = (document.title || '').trim();
        if (title) return title.slice(0, 80);

        const path = getPagePath().toLowerCase();
        if (path === '/' || path.endsWith('/index.html')) return 'Pagina Principal';
        return path;
    }

    function getTimezone() {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        } catch (error) {
            return '';
        }
    }

    function getLocalDayKey(date) {
        const d = date || new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}${m}${day}`;
    }

    function createPresenceTracker() {
        const sessionId = getOrCreateSessionId();
        const sessionStart = getOrCreateSessionStart();
        const visitorId = getOrCreateVisitorId();
        const visitorLabel = 'Visitante ' + visitorId;

        let presenceRef = null;
        let presenceHistoryRef = null;
        let lastHistoryWrite = 0;
        let heartbeatTimer = null;
        let retryTimer = null;
        let retryCount = 0;
        let started = false;
        let listenersBound = false;

        function ensurePresenceRef() {
            const ctx = getFirebaseContext();
            if (!ctx) return null;
            if (!presenceRef) {
                presenceRef = ctx.db.collection('presence').doc(sessionId);
            }
            return { db: ctx.db, firebase: ctx.firebase, ref: presenceRef };
        }

        function ensurePresenceHistoryRef(ctx) {
            if (!presenceHistoryRef) {
                const dayKey = getLocalDayKey();
                const docId = sessionId + '_' + dayKey;
                presenceHistoryRef = ctx.db.collection('presenceDaily').doc(docId);
            }
            return presenceHistoryRef;
        }

        function buildHistoryPayload(ctx) {
            return {
                sessionId: sessionId,
                dayKey: getLocalDayKey(),
                visitorId: visitorId,
                page: getPagePath().slice(0, 40),
                pagina: getPageLabel().slice(0, 120),
                dispositivo: getDeviceType(),
                lastSeen: ctx.firebase.firestore.FieldValue.serverTimestamp(),
                lastSeenClient: Date.now()
            };
        }

        function writePresenceHistory(forceWrite) {
            const now = Date.now();
            if (!forceWrite && (now - lastHistoryWrite) < PRESENCE_HISTORY_MIN_WRITE_MS) return;
            const ctx = getFirebaseContext();
            if (!ctx) return;
            const ref = ensurePresenceHistoryRef(ctx);
            const payload = buildHistoryPayload(ctx);
            lastHistoryWrite = now;
            ref.set(payload, { merge: true }).catch(() => {});
        }

        function buildPayload(ctx, explicitStatus) {
            return {
                sessionId: sessionId,
                visitorId: visitorId,
                visitorLabel: visitorLabel,
                page: getPagePath(),
                pagina: getPageLabel(),
                pageTitle: (document.title || '').slice(0, 120),
                dispositivo: getDeviceType(),
                idioma: navigator.language || 'pt-BR',
                timezone: getTimezone(),
                referrer: document.referrer || '',
                status: explicitStatus || (document.hidden ? 'away' : 'online'),
                entrouClient: sessionStart,
                lastSeen: ctx.firebase.firestore.FieldValue.serverTimestamp(),
                lastSeenClient: Date.now()
            };
        }

        function writeInitialPresence() {
            const ctx = ensurePresenceRef();
            if (!ctx) return false;

            const payload = buildPayload(ctx);
            ctx.ref.get().then((snapshot) => {
                if (snapshot.exists) {
                    ctx.ref.update(payload).catch(() => {});
                    return;
                }

                ctx.ref.set({
                    ...payload,
                    entrou: ctx.firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true }).catch(() => {});
            }).catch(() => {
                ctx.ref.set({
                    ...payload,
                    entrou: ctx.firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true }).catch(() => {});
            });

            writePresenceHistory(true);
            return true;
        }

        function updatePresenceStatus(status) {
            const ctx = ensurePresenceRef();
            if (!ctx) return false;

            const payload = buildPayload(ctx, status);
            ctx.ref.update(payload).catch(() => {
                ctx.ref.set(payload, { merge: true }).catch(() => {});
            });

            return true;
        }

        function sendHeartbeat() {
            const ctx = ensurePresenceRef();
            if (!ctx) return false;

            const payload = buildPayload(ctx);
            ctx.ref.update(payload).catch(() => {
                ctx.ref.set(payload, { merge: true }).catch(() => {});
            });

            writePresenceHistory(false);
            return true;
        }

        function stopHeartbeat() {
            if (heartbeatTimer) {
                clearInterval(heartbeatTimer);
                heartbeatTimer = null;
            }
        }

        function startHeartbeat() {
            stopHeartbeat();
            heartbeatTimer = setInterval(() => {
                if (!sendHeartbeat()) {
                    scheduleRetry();
                }
            }, PRESENCE_HEARTBEAT_MS);
        }

        function scheduleRetry() {
            if (retryTimer || retryCount >= PRESENCE_FIREBASE_MAX_RETRIES) return;

            retryTimer = setTimeout(() => {
                retryTimer = null;
                retryCount += 1;

                if (ensurePresenceRef()) {
                    retryCount = 0;
                    writeInitialPresence();
                    startHeartbeat();
                    return;
                }

                scheduleRetry();
            }, PRESENCE_FIREBASE_WAIT_MS);
        }

        function ensureConnectedAndRunning() {
            if (writeInitialPresence()) {
                retryCount = 0;
                startHeartbeat();
            } else {
                scheduleRetry();
            }
        }

        function bindLifecycleListeners() {
            if (listenersBound) return;
            listenersBound = true;

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    updatePresenceStatus('away');
                    stopHeartbeat();
                    return;
                }
                ensureConnectedAndRunning();
            });

            window.addEventListener('focus', ensureConnectedAndRunning);

            window.addEventListener('pagehide', () => {
                stopHeartbeat();
                updatePresenceStatus('offline');
            });

            window.addEventListener('beforeunload', () => {
                stopHeartbeat();
                updatePresenceStatus('offline');
            });
        }

        return {
            start: function () {
                if (started || !shouldTrackPresence()) return;
                started = true;
                bindLifecycleListeners();
                ensureConnectedAndRunning();
            },
            isActive: function () {
                return started;
            },
            getSessionId: function () {
                return sessionId;
            }
        };
    }

    function getThemeToggleMarkup(isDark) {
        if (isDark) {
            return '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1.5" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="22.5"></line><line x1="4.22" y1="4.22" x2="5.99" y2="5.99"></line><line x1="18.01" y1="18.01" x2="19.78" y2="19.78"></line><line x1="1.5" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="22.5" y2="12"></line><line x1="4.22" y1="19.78" x2="5.99" y2="18.01"></line><line x1="18.01" y1="5.99" x2="19.78" y2="4.22"></line></svg>';
        }

        return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.64 13a1 1 0 0 0-1.05-.14 8 8 0 0 1-10.45-10.45 1 1 0 0 0-1.19-1.33A10 10 0 1 0 23 14.05a1 1 0 0 0-1.36-1.05Z"></path></svg>';
    }

    function getPreferredThemeIdForMode(manager, targetMode) {
        const preferredIds = targetMode === 'dark'
            ? ['dark-tech', 'gamer-rgb']
            : ['light-clean', 'classico-neutro', 'profissional-corporativo'];
        const themes = manager.getThemes();

        for (const preferredId of preferredIds) {
            const match = themes.find((theme) => theme.id === preferredId && theme.mode === targetMode);
            if (match) return match.id;
        }

        const modeMatch = themes.find((theme) => theme.mode === targetMode);
        if (modeMatch) return modeMatch.id;

        const settings = manager.getSettings();
        return settings.fallbackThemeId || settings.activeThemeId || EMBEDDED_FALLBACK_THEME.id;
    }

    function ensureThemeToggleButton(manager) {
        if (!manager || !document.body) return;

        let button = document.getElementById('themeToggleBtn');
        if (!button) {
            button = document.createElement('button');
            button.id = 'themeToggleBtn';
            button.type = 'button';
            document.body.appendChild(button);
        }

        function updateButton(theme) {
            const isDark = theme && theme.mode === 'dark';
            const nextLabel = isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro';
            button.innerHTML = getThemeToggleMarkup(isDark);
            button.setAttribute('title', nextLabel);
            button.setAttribute('aria-label', nextLabel);
        }

        if (button.dataset.boundThemeToggle !== '1') {
            button.dataset.boundThemeToggle = '1';
            button.addEventListener('click', () => {
                const currentTheme = manager.getCurrentTheme();
                const nextMode = currentTheme && currentTheme.mode === 'dark' ? 'light' : 'dark';
                const nextThemeId = getPreferredThemeIdForMode(manager, nextMode);
                // Ao voltar para claro, restaura autoSeasonal para que o tema sazonal
                // configurado seja reaplicado automaticamente, sem intervenção do usuário.
                manager.saveSettings({
                    activeThemeId: nextThemeId,
                    autoSeasonal: nextMode === 'light'
                });
            });

            manager.subscribe((payload) => {
                updateButton(payload.theme);
            });
        }

        updateButton(manager.getCurrentTheme());
    }

    window.PCFormatechThemeManager = window.PCFormatechThemeManager || createThemeManager();
    window.PCFTPresenceTracker = window.PCFTPresenceTracker || createPresenceTracker();

    window.PCFormatechThemeManager.init();
    window.PCFormatechThemeManager.ready().then(() => {
        ensureThemeToggleButton(window.PCFormatechThemeManager);
    }).catch(() => {
        ensureThemeToggleButton(window.PCFormatechThemeManager);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.PCFTPresenceTracker && typeof window.PCFTPresenceTracker.start === 'function') {
                window.PCFTPresenceTracker.start();
            }
        });
    } else if (window.PCFTPresenceTracker && typeof window.PCFTPresenceTracker.start === 'function') {
        window.PCFTPresenceTracker.start();
    }
})();
