#!/usr/bin/env node
/**
 * Escreve no index.html os valores que estão em site-config.js.
 *
 * Uso: npm run sync:config          (aplica)
 *      npm run check:config         (só verifica, sai com erro se houver divergência)
 *
 * Por que existe: site-config.js é a fonte única e reescreve tudo no
 * carregamento, mas os valores continuam no HTML para quem chega sem JS. Sem
 * este passo, o HTML estático envelheceria em silêncio toda vez que um preço
 * mudasse na configuração — e voltaríamos ao problema que a configuração
 * resolveu. Rode depois de alterar qualquer preço ou o telefone.
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const HTML = path.join(RAIZ, 'site.html');
const CONFIG = path.join(RAIZ, 'site-config.js');

const apenasVerificar = process.argv.includes('--check');

/** Lê site-config.js sem navegador: só precisa do objeto que ele expõe. */
function carregarConfig() {
    const fonte = fs.readFileSync(CONFIG, 'utf8');
    const sandbox = { window: {}, document: { readyState: 'complete', addEventListener() {}, querySelectorAll: () => [], getElementById: () => null, querySelector: () => null } };
    // eslint-disable-next-line no-new-func
    new Function('window', 'document', fonte)(sandbox.window, sandbox.document);
    if (!sandbox.window.PCFT_CONFIG) throw new Error('site-config.js não expôs PCFT_CONFIG');
    return sandbox.window.PCFT_CONFIG;
}

function formatarPreco(valor) {
    if (!valor) return 'Sob consulta';
    // Sem Intl para não depender do locale da máquina que roda o script.
    return 'R$ ' + valor.toFixed(2).replace('.', ',');
}

function main() {
    const cfg = carregarConfig();
    let html = fs.readFileSync(HTML, 'utf8');
    const original = html;
    const mudancas = [];

    cfg.SERVICOS.forEach((servico) => {
        const preco = formatarPreco(servico.preco);

        // 1 · data-price do card
        const cardRe = new RegExp('(data-service="' + servico.id + '" data-price=")\\d+(")');
        html = html.replace(cardRe, (m, a, b) => {
            if (m !== a + servico.preco + b) mudancas.push(servico.id + ' · data-price do card');
            return a + servico.preco + b;
        });

        // 2 · etiqueta visível do card (na ordem em que os cards aparecem)
        // 3 · preço do modal
        const modalRe = new RegExp('(<div class="modal" id="modal-' + servico.id + '">[\\s\\S]*?<p class="price">)[^<]*(</p>)');
        html = html.replace(modalRe, (m, a, b) => {
            const novo = a + 'A partir de ' + preco + b;
            if (m !== novo) mudancas.push(servico.id + ' · preço do modal');
            return novo;
        });

        // 4 · opção do formulário de agendamento
        const opcaoRe = new RegExp(
            '(<input type="checkbox" name="service\\[\\]" value="' + escapeRe(servico.nome) + '" data-price=")\\d+(">\\s*<span>)[^<]*(</span>)'
        );
        html = html.replace(opcaoRe, (m, a, b, c) => {
            const novo = a + servico.preco + b + servico.nome + ' - ' + preco + c;
            if (m !== novo) mudancas.push(servico.id + ' · opção do agendamento');
            return novo;
        });
    });

    // Etiquetas .price-tag seguem a ordem dos cards com preço.
    const comCard = cfg.SERVICOS.filter((s) => /^(formatacao|programas|seguranca|manutencao|drivers|backup)$/.test(s.id));
    let i = 0;
    html = html.replace(/(<div class="price-tag"><span>A partir de<\/span><span>)[^<]*(<\/span><\/div>)/g, (m, a, b) => {
        const servico = comCard[i++];
        if (!servico) return m;
        const novo = a + formatarPreco(servico.preco) + b;
        if (m !== novo) mudancas.push(servico.id + ' · etiqueta do card');
        return novo;
    });

    // Telefone: links e textos marcados.
    const numeroAntigo = /api\.whatsapp\.com\/send\?phone=\d+/g;
    html = html.replace(numeroAntigo, (m) => {
        const novo = 'api.whatsapp.com/send?phone=' + cfg.CONTATO.whatsapp;
        if (m !== novo) mudancas.push('link de WhatsApp');
        return novo;
    });
    html = html.replace(/(wa\.me\/)\d+/g, (m, a) => {
        const novo = a + cfg.CONTATO.whatsapp;
        if (m !== novo) mudancas.push('link wa.me');
        return novo;
    });
    html = html.replace(/(data-contato="whatsapp"[^>]*>)[^<]*(<)/g, (m, a, b) => {
        const novo = a + cfg.CONTATO.whatsappExibicao + b;
        if (m !== novo) mudancas.push('telefone exibido');
        return novo;
    });

    const unicas = [...new Set(mudancas)];

    if (html === original) {
        console.log('site.html já está de acordo com site-config.js.');
        return;
    }

    if (apenasVerificar) {
        console.error('site.html está DESATUALIZADO em relação a site-config.js:');
        unicas.forEach((m) => console.error('  · ' + m));
        console.error('\nRode: npm run sync:config');
        process.exit(1);
    }

    fs.writeFileSync(HTML, html);
    console.log('site.html sincronizado com site-config.js:');
    unicas.forEach((m) => console.log('  · ' + m));
}

function escapeRe(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main();
