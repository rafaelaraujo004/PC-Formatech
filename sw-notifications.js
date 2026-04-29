// Service Worker - PC Formatech Notifications
const SW_VERSION = '1.0.0';

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

// Recebe mensagem da página principal para exibir notificação
self.addEventListener('message', event => {
    if (!event.data) return;
    if (event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body, tag, icon, badge, data } = event.data.payload;
        event.waitUntil(
            self.registration.showNotification(title, {
                body,
                tag: tag || 'pcformatech-notif',
                icon: icon || '/icon-192.png',
                badge: badge || '/favicon-32x32.png',
                vibrate: [200, 100, 200],
                requireInteraction: false,
                renotify: true,
                data: data || {}
            })
        );
    }
});

// Ao clicar na notificação, abre ou foca o painel admin
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            // Procura janela do admin aberta
            for (const client of clientList) {
                if (client.url.includes('admin') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Nenhuma aberta, abre nova
            if (self.clients.openWindow) {
                return self.clients.openWindow('/admin.html#parcelamentos');
            }
        })
    );
});
