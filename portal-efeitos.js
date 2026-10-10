/* ═══════════════════════════════════════════════════════════════════════════
   PC FORMATECH — Efeitos da página de entrada (index.html)

   - O notebook do topo roda um "diagnóstico": as linhas aparecem uma a uma e a
     barra enche. Para quando o notebook sai da tela ou a aba fica escondida.
   - Com mouse, o notebook e os cartões de serviço inclinam acompanhando o
     ponteiro, e um brilho segue o mouse nos cartões.
   Quem pede menos movimento no aparelho vê tudo parado, com o diagnóstico
   completo (o HTML já vem assim, então sem este arquivo a página fica igual).
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (reduz) return;

    // ── Diagnóstico no notebook ─────────────────────────────────────────────
    const log = document.getElementById('pt-log');
    const barra = document.getElementById('pt-prog');
    const pct = document.getElementById('pt-pct');

    if (log && barra && pct) {
        const linhas = Array.from(log.children).map((li) => ({ classe: li.className, texto: li.textContent }));
        let mostradas = 1;
        let relogio = null;
        let naTela = true;

        const mostrar = (qtd) => {
            log.textContent = '';
            linhas.slice(0, qtd).forEach((linha, i) => {
                const li = document.createElement('li');
                li.className = linha.classe + (i === qtd - 1 ? ' novo' : '');
                li.textContent = linha.texto;
                log.appendChild(li);
            });
            const feito = Math.round((Math.max(qtd - 1, 0) / (linhas.length - 1)) * 100);
            barra.style.width = feito + '%';
            pct.textContent = feito + '%';
        };

        // Depois da última linha, segura o "pronto" um pouco e recomeça.
        const passo = () => {
            mostradas = mostradas >= linhas.length + 2 ? 1 : mostradas + 1;
            mostrar(Math.min(mostradas, linhas.length));
        };

        const atualizar = () => {
            const rodar = naTela && !document.hidden;
            if (rodar && !relogio) relogio = setInterval(passo, 1100);
            if (!rodar && relogio) { clearInterval(relogio); relogio = null; }
        };

        mostrar(mostradas);
        if ('IntersectionObserver' in window) {
            new IntersectionObserver((entradas) => {
                naTela = entradas[0].isIntersecting;
                atualizar();
            }).observe(log);
        }
        document.addEventListener('visibilitychange', atualizar);
        atualizar();
    }

    if (!mouse) return;

    // ── Notebook acompanha o mouse ──────────────────────────────────────────
    const palco = document.getElementById('pt-hero');
    const laptop = document.getElementById('pt-laptop');
    if (palco && laptop) {
        let pendente = null;
        palco.addEventListener('pointermove', (evento) => {
            if (pendente) { pendente = evento; return; }
            pendente = evento;
            requestAnimationFrame(() => {
                const r = palco.getBoundingClientRect();
                const x = (pendente.clientX - r.left) / r.width - 0.5;
                const y = (pendente.clientY - r.top) / r.height - 0.5;
                laptop.style.setProperty('--rx', (x * 16).toFixed(2));
                laptop.style.setProperty('--ry', (y * -10).toFixed(2));
                pendente = null;
            });
        });
        palco.addEventListener('pointerleave', () => {
            laptop.style.setProperty('--rx', 0);
            laptop.style.setProperty('--ry', 0);
        });
    }

    // ── Cartões inclinam e brilham sob o mouse ──────────────────────────────
    const grade = document.getElementById('pt-grid');
    if (grade) {
        let atual = null;
        const soltar = (card) => {
            if (!card) return;
            card.style.setProperty('--rx', 0);
            card.style.setProperty('--ry', 0);
        };
        grade.addEventListener('pointermove', (evento) => {
            const card = evento.target.closest('.pt-card');
            if (card !== atual) { soltar(atual); atual = card; }
            if (!card) return;
            const r = card.getBoundingClientRect();
            const x = (evento.clientX - r.left) / r.width;
            const y = (evento.clientY - r.top) / r.height;
            // O cartão deitado da busca é largo: inclina menos.
            const forca = card.offsetWidth > 500 ? 4 : 10;
            card.style.setProperty('--rx', ((x - 0.5) * forca).toFixed(2));
            card.style.setProperty('--ry', ((0.5 - y) * forca).toFixed(2));
            card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
            card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        });
        grade.addEventListener('pointerleave', () => { soltar(atual); atual = null; });
    }
})();
