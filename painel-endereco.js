// O painel mudou para www.pcformatech.com.br em 16/10/2026 (o APK novo abre
// lá). Quem chegar pelo endereço antigo, pcformatech.vercel.app (APK antigo,
// favorito, aviso que já estava na tela), vai para o novo com o mesmo caminho,
// busca e #aba.
//
// Antes de sair, cancela a inscrição de avisos do endereço antigo: o painel no
// www faz a dele, e as duas juntas mandariam cada lembrete duas vezes. O
// servidor apaga a inscrição cancelada no próximo envio (api/_push.js, 404/410).
//
// Fica no topo do <head> do admin.html e para o carregamento do resto da
// página, para o painel antigo não chegar a se inscrever de novo.

(function () {
    'use strict';
    if (location.hostname !== 'pcformatech.vercel.app') return;

    var destino = 'https://www.pcformatech.com.br' + location.pathname + location.search + location.hash;
    var foi = false;
    function ir() {
        if (foi) return;
        foi = true;
        location.replace(destino);
    }

    try { window.stop(); } catch (e) { /* navegador antigo: segue o redirecionamento */ }
    document.documentElement.style.visibility = 'hidden';
    setTimeout(ir, 2500); // não espera mais que isso pelo cancelamento

    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.getRegistrations) { ir(); return; }
    navigator.serviceWorker.getRegistrations()
        .then(function (registros) {
            return Promise.all(registros.map(function (r) {
                if (!r.pushManager) return null;
                return r.pushManager.getSubscription().then(function (s) { return s && s.unsubscribe(); });
            }));
        })
        .catch(function () { /* sem inscrição para cancelar */ })
        .then(ir);
})();
