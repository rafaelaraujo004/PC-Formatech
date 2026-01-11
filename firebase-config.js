// Configuração do Firebase - PC Formatech
// 
// ⚠️ ATENÇÃO GITHUB SCANNER: Estas credenciais são INTENCIONALMENTE públicas
// Firebase API Keys são SEGURAS de expor publicamente por design do Google
// 
// Segurança implementada através de:
// 1. Regras do Firestore (bloqueiam acesso não autorizado)
// 2. Firebase Authentication (apenas usuários autenticados)
// 3. Restrições de domínio no Firebase Console
// 
// Documentação oficial: https://firebase.google.com/docs/projects/api-keys
// "Unlike how API keys are typically used, API keys for Firebase services are 
//  not used to control access to backend resources; that can only be done with 
//  Firebase Security Rules"

const firebaseConfig = {
    apiKey: "AIzaSyAIKqmS_Mj4fOP9j8SSugosV5Hahm48J5M", // gitleaks:allow
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
