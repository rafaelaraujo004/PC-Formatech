// Painel sempre na versão mais nova.
//
// O app do painel no celular fica aberto por dias e continua rodando a versão
// que carregou (foi assim que os Reels saíram como imagem: o painel antigo
// não conhecia vídeo). Toda vez que a pessoa volta para o painel, ele confere
// se o admin.html mudou no servidor (ETag) e recarrega. Se houver uma janela
// ou um campo em edição, não interrompe: mostra um aviso para tocar e atualizar.

(function () {
    'use strict';

    const INTERVALO_MINIMO = 60 * 1000;
    let versao = null;
    let ultimaConferencia = 0;

    const lerVersao = () => fetch('/admin.html', { method: 'HEAD', cache: 'no-store' })
        .then((r) => (r.ok ? r.headers.get('etag') || r.headers.get('last-modified') : null))
        .catch(() => null);

    function ocupado() {
        if (document.querySelector('dialog[open]')) return true;
        const foco = document.activeElement;
        return Boolean(foco && /^(INPUT|TEXTAREA|SELECT)$/.test(foco.tagName) && foco.type !== 'search');
    }

    function avisar() {
        if (document.getElementById('pcft-nova-versao')) return;
        const b = document.createElement('button');
        b.id = 'pcft-nova-versao';
        b.type = 'button';
        b.textContent = 'Painel atualizado. Toque aqui para carregar a versão nova.';
        b.style.cssText = 'position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:9999;max-width:calc(100% - 32px);padding:12px 18px;border:0;border-radius:12px;background:#0b4a45;color:#fff;font:700 15px Manrope,system-ui,sans-serif;box-shadow:0 10px 30px -8px rgba(0,0,0,.5);cursor:pointer';
        b.addEventListener('click', () => location.reload());
        document.body.appendChild(b);
    }

    async function conferir() {
        if (document.hidden || !versao || Date.now() - ultimaConferencia < INTERVALO_MINIMO) return;
        ultimaConferencia = Date.now();
        const atual = await lerVersao();
        if (!atual || atual === versao) return;
        if (ocupado()) avisar();
        else location.reload();
    }

    lerVersao().then((v) => { versao = v; ultimaConferencia = Date.now(); });
    document.addEventListener('visibilitychange', conferir);
    window.addEventListener('focus', conferir);
})();
