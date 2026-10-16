// Página /pix/?v=155.00&n=2026-0004&t=laudo — aberta pelo botão "Copiar código
// Pix" do PDF. Monta o mesmo código do PDF (pix.js, com o mesmo identificador
// e a mesma descrição) e copia com um toque.
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const q = new URLSearchParams(location.search);
    const valor = Math.round(Number(String(q.get('v') || '').replace(',', '.')) * 100) / 100;
    const numero = String(q.get('n') || '').replace(/[^\d-]/g, '').slice(0, 12);
    const nomeDoc = q.get('t') === 'laudo' ? 'Laudo' : 'Orçamento';
    const moeda = (v) => 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    if (!(valor > 0 && valor < 1e6) || !numero || !window.PCFTPix) {
        $('valor').textContent = 'Link incompleto';
        $('doc').innerHTML = '<span class="erro">Peça o código Pix pelo WhatsApp (94) 98430-5772.</span>';
        $('copiar').hidden = true;
        $('qr').hidden = true;
        return;
    }

    const codigo = window.PCFTPix.codigo(valor, 'PCF' + numero.replace(/\D/g, ''), `${nomeDoc} ${numero}`);
    $('valor').textContent = moeda(valor);
    $('doc').textContent = `${nomeDoc} Nº ${numero}`;
    $('codigo').textContent = codigo;
    $('rec').textContent = `Recebedor: ${window.PCFTPix.dados.titular} (${window.PCFTPix.dados.empresa})`;
    window.PCFTPix.desenhar($('qr'), codigo, 200);

    async function copiar() {
        let ok = false;
        try { await navigator.clipboard.writeText(codigo); ok = true; } catch (e) {
            // Navegador antigo: seleciona e usa o comando de copiar.
            const area = document.createElement('textarea');
            area.value = codigo;
            document.body.appendChild(area);
            area.select();
            try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
            area.remove();
        }
        const b = $('copiar');
        b.textContent = ok ? '✓ Copiado! Agora cole no app do banco' : 'Segure o código acima e copie';
        b.classList.toggle('ok', ok);
    }
    $('copiar').addEventListener('click', copiar);
})();
