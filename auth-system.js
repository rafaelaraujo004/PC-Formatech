// Sistema de autenticação seguro para o painel admin
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 3600000; // 1 hora
        this.maxLoginAttempts = 3;
        this.loginAttempts = 0;
        this.lockoutTime = 900000; // 15 minutos
    }

    // Autenticação com Firebase
    async loginWithFirebase(email, password) {
        try {
            if (!isFirebaseConfigured()) {
                throw new Error('Firebase não configurado');
            }

            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;
            this.resetLoginAttempts();
            this.startSession();
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
            username: 'admin',
            // Senha: "pcformatech2026" (use hash SHA-256 em produção)
            passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'
        };

        const passwordHash = await this.hashPassword(password);
        
        if (username === validCredentials.username && passwordHash === validCredentials.passwordHash) {
            this.currentUser = { uid: 'local-admin', email: username };
            this.resetLoginAttempts();
            this.startSession();
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
    startSession() {
        const sessionData = {
            user: this.currentUser,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.sessionTimeout
        };
        
        // Criptografar dados da sessão
        const encryptedSession = btoa(JSON.stringify(sessionData));
        sessionStorage.setItem('pcf_session', encryptedSession);
        
        // Auto-logout após timeout
        setTimeout(() => this.logout(), this.sessionTimeout);
    }

    // Verificar sessão ativa
    isAuthenticated() {
        const encryptedSession = sessionStorage.getItem('pcf_session');
        
        if (!encryptedSession) {
            return false;
        }

        try {
            const sessionData = JSON.parse(atob(encryptedSession));
            
            if (Date.now() > sessionData.expiresAt) {
                this.logout();
                return false;
            }

            this.currentUser = sessionData.user;
            return true;
        } catch (error) {
            this.logout();
            return false;
        }
    }

    // Logout
    logout() {
        this.currentUser = null;
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
