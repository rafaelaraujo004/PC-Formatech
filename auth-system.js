// Login do painel: só pelo Firebase (e-mail e senha, ou biometria em
// admin-biometria.js, que entra com um token do Firebase).
//
// Antes havia um "login local" de reserva com o e-mail e o hash da senha
// escritos aqui (e a própria senha num comentário). Este arquivo é público
// no site e no GitHub, então qualquer um podia abrir o painel com ela. A
// proteção de verdade sempre foi o Firebase (regras do Firestore e as rotas
// /api/, que exigem o token), por isso o login local saiu de vez.
//
// A sessão guardada no sessionStorage só lembra que o painel já foi aberto
// nesta aba; quem decide o acesso aos dados é o Firebase Auth.

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.sessionMode = null;
        this.sessionTimeout = 3600000; // 1 hora
        this.maxLoginAttempts = 3;
        this.loginAttempts = 0;
        this.lockoutTime = 900000; // 15 minutos
        this.adminEmail = 'rafaelaraujo004@gmail.com';
    }

    getAllowedAdminEmails() {
        return [this.adminEmail];
    }

    async ensureFirebaseReady() {
        if (typeof isFirebaseConfigured !== 'function' || !isFirebaseConfigured()) {
            throw new Error('Firebase não configurado para autenticação.');
        }
        if (!auth) {
            const ok = typeof initFirebase === 'function' ? initFirebase() : false;
            if (!ok || !auth) throw new Error('Firebase Auth não pôde ser inicializado.');
        }
        return auth;
    }

    async loginWithFirebase(email, password) {
        try {
            if (this.isLockedOut()) {
                throw new Error('Muitas tentativas. Tente novamente em 15 minutos.');
            }
            const authInstance = await this.ensureFirebaseReady();
            const userCredential = await authInstance.signInWithEmailAndPassword(email, password);
            const userEmail = String(userCredential.user?.email || '').toLowerCase();
            if (!this.getAllowedAdminEmails().includes(userEmail)) {
                await authInstance.signOut();
                throw new Error('Este usuário não tem permissão administrativa.');
            }
            this.currentUser = userCredential.user;
            this.sessionMode = 'firebase';
            this.resetLoginAttempts();
            this.startSession('firebase');
            return { success: true, user: this.currentUser };
        } catch (error) {
            this.handleLoginError(error);
            return { success: false, error: error.message };
        }
    }

    startSession(mode = 'firebase') {
        const sessionData = {
            user: this.currentUser ? { uid: this.currentUser.uid, email: this.currentUser.email } : null,
            mode,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.sessionTimeout
        };
        sessionStorage.setItem('pcf_session', btoa(JSON.stringify(sessionData)));
        setTimeout(() => this.logout(), this.sessionTimeout);
    }

    getSessionData() {
        const salva = sessionStorage.getItem('pcf_session');
        if (!salva) return null;
        try {
            return JSON.parse(atob(salva));
        } catch (error) {
            return null;
        }
    }

    isAuthenticated() {
        const sessionData = this.getSessionData();
        if (!sessionData) return false;
        // Sessão vencida, ou do antigo login local: vale como deslogado.
        if (Date.now() > sessionData.expiresAt || sessionData.mode !== 'firebase') {
            this.currentUser = null;
            this.sessionMode = null;
            sessionStorage.removeItem('pcf_session');
            return false;
        }
        if (!this.currentUser) this.currentUser = sessionData.user;
        this.sessionMode = 'firebase';
        return true;
    }

    getSessionMode() {
        return this.isAuthenticated() ? this.sessionMode : null;
    }

    async waitForAuthReady(timeoutMs = 8000) {
        if (!this.isAuthenticated()) return false;

        const authInstance = await this.ensureFirebaseReady();
        if (authInstance.currentUser) {
            this.currentUser = authInstance.currentUser;
            return true;
        }

        return await new Promise((resolve) => {
            const timer = setTimeout(() => {
                try { unsubscribe(); } catch (e) {}
                resolve(false);
            }, timeoutMs);

            const unsubscribe = authInstance.onAuthStateChanged((user) => {
                clearTimeout(timer);
                unsubscribe();
                if (user) {
                    this.currentUser = user;
                    resolve(true);
                    return;
                }
                resolve(false);
            });
        });
    }

    handleLoginError(error) {
        const code = String(error?.code || '');
        const shouldCountAttempt = [
            'auth/wrong-password',
            'auth/user-not-found',
            'auth/invalid-credential',
            'auth/invalid-email',
            'auth/too-many-requests'
        ].includes(code) || !code;

        if (shouldCountAttempt) {
            this.loginAttempts++;
            if (this.loginAttempts >= this.maxLoginAttempts) this.setLockout();
        }

        if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/user-not-found') {
            error.message = 'E-mail ou senha incorretos.';
        } else if (code === 'auth/invalid-email') {
            error.message = 'E-mail inválido.';
        } else if (code === 'auth/too-many-requests') {
            error.message = 'Muitas tentativas. Tente novamente mais tarde.';
        } else if (code === 'auth/network-request-failed') {
            error.message = 'Sem conexão com a internet. Tente de novo.';
        }
    }

    logout() {
        this.currentUser = null;
        this.sessionMode = null;
        sessionStorage.removeItem('pcf_session');
        localStorage.removeItem('pcf_temp_token');

        if (typeof auth !== 'undefined' && auth && auth.currentUser) {
            auth.signOut();
        }

        if (window.location.pathname.includes('admin.html')) {
            window.location.reload();
        }
    }

    resetLoginAttempts() {
        this.loginAttempts = 0;
        localStorage.removeItem('pcf_lockout');
    }

    setLockout() {
        localStorage.setItem('pcf_lockout', JSON.stringify({ until: Date.now() + this.lockoutTime }));
    }

    isLockedOut() {
        let lockout = null;
        try { lockout = JSON.parse(localStorage.getItem('pcf_lockout') || 'null'); } catch (e) { /* valor estragado: ignora */ }
        if (!lockout) return false;
        if (Date.now() > lockout.until) {
            this.resetLoginAttempts();
            return false;
        }
        return true;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

window.authSystem = new AuthSystem();
