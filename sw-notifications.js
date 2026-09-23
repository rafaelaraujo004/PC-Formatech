// Service Worker - PC Formatech Notifications
const SW_VERSION = '1.1.0';

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

// ===== WEB PUSH (background — funciona com app fechado/telefone bloqueado) =====
self.addEventListener('push', event => {
    let data = {};
    try { data = event.data ? event.data.json() : {}; } catch (e) {}

    const title  = data.title  || '🔔 PC Formatech';
    const options = {
        body:              data.body  || 'Você tem uma parcela vencendo em breve.',
        tag:               data.tag   || 'pcformatech-notif',
        icon:              data.icon  || '/icon-192.png',
        badge:             data.badge || '/favicon-32x32.png',
        vibrate:           [200, 100, 200],
        requireInteraction: false,
        renotify:          true,
        data:              data.data  || {}
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// ===== MENSAGEM DA PÁGINA (app aberto) =====
self.addEventListener('message', event => {
    if (!event.data) return;
    if (event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body, tag, icon, badge, data } = event.data.payload;
        event.waitUntil(
            self.registration.showNotification(title, {
                body,
                tag:               tag   || 'pcformatech-notif',
                icon:              icon  || '/icon-192.png',
                badge:             badge || '/favicon-32x32.png',
                vibrate:           [200, 100, 200],
                requireInteraction: false,
                renotify:          true,
                data:              data  || {}
            })
        );
    }
});

// ===== CLIQUE NA NOTIFICAÇÃO =====
self.addEventListener('notificationclick', event => {
    event.notification.close();
    // Cada notificação diz para qual aba levar (visita → Tempo Real);
    // as de parcela, que não dizem, continuam indo para Parcelamentos.
    const destino = (event.notification.data && event.notification.data.url) || '/admin.html#parcelamentos';
    const aba = destino.split('#')[1] || '';
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if (client.url.includes('admin') && 'focus' in client) {
                    if (aba) client.postMessage({ type: 'ABRIR_ABA', aba });
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(destino);
            }
        })
    );
});

// Sem um "fetch" registrado, o Chrome do Android não oferece instalar o painel
// como aplicativo. Não guarda nada em cache: só deixa a requisição seguir.
self.addEventListener('fetch', () => {});

