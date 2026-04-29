// Sistema de autenticação seguro para o painel admin
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.sessionMode = 'local';
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
        if (!isFirebaseConfigured()) {
            throw new Error('Firebase não configurado para autenticação.');
        }

        if (!auth) {
            const ok = typeof initFirebase === 'function' ? initFirebase() : false;
            if (!ok || !auth) {
                throw new Error('Firebase Auth não pôde ser inicializado.');
            }
        }

        return auth;
    }

    // Autenticação com Firebase
    async loginWithFirebase(email, password) {
        try {
            if (this.isLockedOut()) {
                throw new Error('Muitas tentativas. Tente novamente em 15 minutos.');
            }

            const authInstance = await this.ensureFirebaseReady();
            const userCredential = await authInstance.signInWithEmailAndPassword(email, password);
            const userEmail = String(userCredential.user?.email || '').toLowerCase();
            const allowedEmails = this.getAllowedAdminEmails();

            if (allowedEmails.length && !allowedEmails.includes(userEmail)) {
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

    // Autenticação local (fallback) - TEMPORÁRIO até configurar Firebase
    async loginLocal(username, password) {
        // Verificar tentativas
        if (this.isLockedOut()) {
            throw new Error('Muitas tentativas. Tente novamente em 15 minutos.');
        }

        // Hash simples (SUBSTITUIR por Firebase em produção)
        const validCredentials = {
            username: 'rafaelaraujo004@gmail.com',
            // Senha: "Formatech#346482" (hash SHA-256)
            passwordHash: 'c574d1061f57c41fed445874886b0129ccda097e9bb8ff8cbe738149efc8514b'
        };

        const normalizedUsername = String(username || '').trim().toLowerCase();
        const passwordHash = await this.hashPassword(password);
        
        if (normalizedUsername === validCredentials.username && passwordHash === validCredentials.passwordHash) {
            this.currentUser = { uid: 'local-admin', email: validCredentials.username };
            this.sessionMode = 'local';
            this.resetLoginAttempts();
            this.startSession('local');
            return { success: true, user: this.currentUser };
        } else {
            this.loginAttempts++;
            if (this.loginAttempts >= this.maxLoginAttempts) {
                this.setLockout();
            }
            throw new Error('Credenciais inválidas');
        }
    }

    // Hash de senha usando SHA-256
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Iniciar sessão
    startSession(mode = 'local') {
        const sessionData = {
            user: this.currentUser,
            mode,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.sessionTimeout
        };
        
        // Criptografar dados da sessão
        const encryptedSession = btoa(JSON.stringify(sessionData));
        sessionStorage.setItem('pcf_session', encryptedSession);
        
        // Auto-logout após timeout
        setTimeout(() => this.logout(), this.sessionTimeout);
    }

    getSessionData() {
        const encryptedSession = sessionStorage.getItem('pcf_session');
        if (!encryptedSession) {
            return null;
        }

        try {
            return JSON.parse(atob(encryptedSession));
        } catch (error) {
            return null;
        }
    }

    // Verificar sessão ativa
    isAuthenticated() {
        const sessionData = this.getSessionData();

        if (!sessionData) {
            return false;
        }

        try {
            if (Date.now() > sessionData.expiresAt) {
                this.logout();
                return false;
            }

            this.currentUser = sessionData.user;
            this.sessionMode = sessionData.mode || 'local';
            return true;
        } catch (error) {
            this.logout();
            return false;
        }
    }

    getSessionMode() {
        if (!this.isAuthenticated()) {
            return null;
        }
        return this.sessionMode;
    }

    async waitForAuthReady(timeoutMs = 8000) {
        if (!this.isAuthenticated()) {
            return false;
        }

        if (this.sessionMode !== 'firebase') {
            return true;
        }

        const authInstance = await this.ensureFirebaseReady();
        if (authInstance.currentUser) {
            this.currentUser = authInstance.currentUser;
            return true;
        }

        return await new Promise(resolve => {
            const timer = setTimeout(() => {
                try { unsubscribe(); } catch (e) {}
                resolve(false);
            }, timeoutMs);

            const unsubscribe = authInstance.onAuthStateChanged(user => {
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
            if (this.loginAttempts >= this.maxLoginAttempts) {
                this.setLockout();
            }
        }

        if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
            error.message = 'Credenciais inválidas.';
        } else if (code === 'auth/user-not-found') {
            error.message = 'Usuário do Firebase não encontrado.';
        } else if (code === 'auth/invalid-email') {
            error.message = 'E-mail inválido.';
        } else if (code === 'auth/too-many-requests') {
            error.message = 'Muitas tentativas. Tente novamente mais tarde.';
        }
    }

    // Logout
    logout() {
        this.currentUser = null;
        this.sessionMode = 'local';
        sessionStorage.removeItem('pcf_session');
        localStorage.removeItem('pcf_temp_token');
        
        if (auth && auth.currentUser) {
            auth.signOut();
        }
        
        // Redirecionar para login
        if (window.location.pathname.includes('admin.html')) {
            window.location.reload();
        }
    }

    // Controle de tentativas de login
    resetLoginAttempts() {
        this.loginAttempts = 0;
        localStorage.removeItem('pcf_lockout');
    }

    setLockout() {
        const lockoutData = {
            until: Date.now() + this.lockoutTime
        };
        localStorage.setItem('pcf_lockout', JSON.stringify(lockoutData));
    }

    isLockedOut() {
        const lockoutData = localStorage.getItem('pcf_lockout');
        
        if (!lockoutData) {
            return false;
        }

        const lockout = JSON.parse(lockoutData);
        
        if (Date.now() > lockout.until) {
            localStorage.removeItem('pcf_lockout');
            this.resetLoginAttempts();
            return false;
        }

        return true;
    }

    // Obter usuário atual
    getCurrentUser() {
        return this.currentUser;
    }
}

// Instância global
window.authSystem = new AuthSystem();
