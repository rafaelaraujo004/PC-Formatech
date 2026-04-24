// Configuração do Firebase - PC Formatech
// INSTRUÇÕES: 
// 1. Copie este arquivo para "firebase-config.js"
// 2. Substitua os valores abaixo pelas suas credenciais do Firebase
// 3. NUNCA commite o arquivo firebase-config.js no Git

const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto-id",
    storageBucket: "seu-projeto.firebasestorage.app",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID",
    measurementId: "SEU_MEASUREMENT_ID"
};

// Inicializar Firebase
let db = null;
let auth = null;

function initFirebase() {
    try {
        // Verificar se Firebase já foi carregado
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK não carregado. Adicione o script do Firebase no HTML.');
            return false;
        }

        // Inicializar Firebase
        firebase.initializeApp(firebaseConfig);
        
        // Inicializar Firestore
        db = firebase.firestore();
        
        // Inicializar Authentication
        auth = firebase.auth();
        
        console.log('✅ Firebase inicializado com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        return false;
    }
}
