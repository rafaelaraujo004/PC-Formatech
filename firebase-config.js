// Configuração do Firebase - PC Formatech
// NOTA: Estas credenciais são PÚBLICAS e seguras de expor
// A segurança é garantida pelas regras do Firestore e autenticação
// Veja: https://firebase.google.com/docs/projects/api-keys

const firebaseConfig = {
  apiKey: "AIzaSyDor14-Ar2gnDkh87jjeA92B1CDd0TiwG8",
  authDomain: "pc-formatech.firebaseapp.com",
  projectId: "pc-formatech",
  storageBucket: "pc-formatech.firebasestorage.app",
  messagingSenderId: "584035762234",
  appId: "1:584035762234:web:90da30767e3e01d4b8b503",
  measurementId: "G-6BD3YXWEDK"
};

// Inicializar Firebase
let db = null;
let auth = null;

function initFirebase() {
    if (typeof firebase !== 'undefined') {
        const primeiraVez = !firebase.apps.length;
        if (primeiraVez) {
            firebase.initializeApp(firebaseConfig);
        }
        // Configurar cache offline (nova API - substitui enablePersistence deprecado)
        if (primeiraVez) {
            try {
                db = firebase.firestore();
                db.settings({
                    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
                });
                db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
                    if (err.code === 'failed-precondition') {
                        console.warn('Persistência offline: múltiplas abas abertas');
                    } else if (err.code === 'unimplemented') {
                        console.warn('Persistência offline não suportada neste navegador');
                    }
                });
            } catch(e) {
                db = firebase.firestore();
            }
        } else {
            db = firebase.firestore();
        }
        if (typeof firebase.auth !== 'undefined') {
            auth = firebase.auth();
        }
        console.log('✅ Firebase inicializado');
        return true;
    } else {
        console.error('❌ Firebase SDK não carregado');
        return false;
    }
}

// Função para verificar se Firebase está configurado
function isFirebaseConfigured() {
    return firebaseConfig.apiKey !== "SUA_API_KEY_AQUI";
}
