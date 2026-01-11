// Configuração do Firebase - PC Formatech
// NOTA: Estas credenciais são PÚBLICAS e seguras de expor
// A segurança é garantida pelas regras do Firestore e autenticação
// Veja: https://firebase.google.com/docs/projects/api-keys

const firebaseConfig = {
    apiKey: "AIzaSyAIKqmS_Mj4fOP9j8SSugosV5Hahm48J5M",
    authDomain: "pc-formatech.firebaseapp.com",
    projectId: "pc-formatech",
    storageBucket: "pc-formatech.firebasestorage.app",
    messagingSenderId: "584035762234",
    appId: "1:584035762234:web:97df96d921450949b8b503",
    measurementId: "G-3SMZZB891S"
};

// Inicializar Firebase
let db = null;
let auth = null;

function initFirebase() {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
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
