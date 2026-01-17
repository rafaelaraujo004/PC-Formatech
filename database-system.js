// Sistema de Database com Firebase e fallback para localStorage
class DatabaseSystem {
    constructor() {
        this.useFirebase = false;
        this.collections = {
            clients: 'clients',
            budgets: 'budgets',
            products: 'products',
            slides: 'hero_slides'
        };
    }

    // Inicializar sistema
    async initialize() {
        if (isFirebaseConfigured() && db) {
            this.useFirebase = true;
            console.log('✅ Usando Firebase Firestore');
        } else {
            this.useFirebase = false;
            console.log('⚠️ Firebase não configurado. Usando localStorage.');
        }
    }

    // ========== CLIENTES ==========
    
    async saveClient(clientData) {
        if (this.useFirebase) {
            return await this.saveToFirebase(this.collections.clients, clientData);
        } else {
            return this.saveToLocalStorage('pcformatech_clients', clientData);
        }
    }

    async getClients() {
        if (this.useFirebase) {
            return await this.getFromFirebase(this.collections.clients);
        } else {
            return this.getFromLocalStorage('pcformatech_clients');
        }
    }

    async updateClient(clientId, clientData) {
        if (this.useFirebase) {
            return await this.updateInFirebase(this.collections.clients, clientId, clientData);
        } else {
            return this.updateInLocalStorage('pcformatech_clients', clientId, clientData);
        }
    }

    async deleteClient(clientId) {
        if (this.useFirebase) {
            return await this.deleteFromFirebase(this.collections.clients, clientId);
        } else {
            return this.deleteFromLocalStorage('pcformatech_clients', clientId);
        }
    }

    // ========== ORÇAMENTOS ==========
    
    async saveBudget(budgetData) {
        if (this.useFirebase) {
            return await this.saveToFirebase(this.collections.budgets, budgetData);
        } else {
            return this.saveToLocalStorage('pcformatech_budgets', budgetData);
        }
    }

    async getBudgets() {
        if (this.useFirebase) {
            return await this.getFromFirebase(this.collections.budgets);
        } else {
            return this.getFromLocalStorage('pcformatech_budgets');
        }
    }

    // ========== PRODUTOS ==========
    
    async saveProduct(productData) {
        if (this.useFirebase) {
            return await this.saveToFirebase(this.collections.products, productData);
        } else {
            return this.saveToLocalStorage('pcformatech_products', productData);
        }
    }

    async getProducts() {
        if (this.useFirebase) {
            return await this.getFromFirebase(this.collections.products);
        } else {
            return this.getFromLocalStorage('pcformatech_products');
        }
    }

    // ========== SLIDES ==========
    
    async saveSlides(slidesData) {
        if (this.useFirebase) {
            // Salvar como documento único
            return await db.collection(this.collections.slides).doc('main').set({
                slides: slidesData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            localStorage.setItem('pcformatech_hero_slides', JSON.stringify(slidesData));
            return { success: true };
        }
    }

    async getSlides() {
        if (this.useFirebase) {
            const doc = await db.collection(this.collections.slides).doc('main').get();
            return doc.exists ? doc.data().slides : [];
        } else {
            const data = localStorage.getItem('pcformatech_hero_slides');
            return data ? JSON.parse(data) : [];
        }
    }

    // ========== MÉTODOS FIREBASE ==========
    
    async saveToFirebase(collection, data) {
        try {
            const docRef = await db.collection(collection).add({
                ...data,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Erro ao salvar no Firebase:', error);
            return { success: false, error: error.message };
        }
    }

    async getFromFirebase(collection) {
        try {
            const snapshot = await db.collection(collection).orderBy('createdAt', 'desc').get();
            const data = [];
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });
            return data;
        } catch (error) {
            console.error('Erro ao buscar do Firebase:', error);
            return [];
        }
    }

    async updateInFirebase(collection, docId, data) {
        try {
            await db.collection(collection).doc(docId).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Erro ao atualizar no Firebase:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteFromFirebase(collection, docId) {
        try {
            await db.collection(collection).doc(docId).delete();
            return { success: true };
        } catch (error) {
            console.error('Erro ao deletar do Firebase:', error);
            return { success: false, error: error.message };
        }
    }

    // ========== MÉTODOS LOCALSTORAGE ==========
    
    saveToLocalStorage(key, data) {
        try {
            const existing = this.getFromLocalStorage(key);
            const dataWithId = { ...data, id: data.id || Date.now() };
            existing.push(dataWithId);
            localStorage.setItem(key, JSON.stringify(existing));
            return { success: true, id: dataWithId.id };
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
            return { success: false, error: error.message };
        }
    }

    getFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Erro ao buscar do localStorage:', error);
            return [];
        }
    }

    updateInLocalStorage(key, id, newData) {
        try {
            const existing = this.getFromLocalStorage(key);
            const index = existing.findIndex(item => item.id === id);
            if (index !== -1) {
                existing[index] = { ...existing[index], ...newData };
                localStorage.setItem(key, JSON.stringify(existing));
                return { success: true };
            }
            return { success: false, error: 'Item não encontrado' };
        } catch (error) {
            console.error('Erro ao atualizar no localStorage:', error);
            return { success: false, error: error.message };
        }
    }

    deleteFromLocalStorage(key, id) {
        try {
            const existing = this.getFromLocalStorage(key);
            const filtered = existing.filter(item => item.id !== id);
            localStorage.setItem(key, JSON.stringify(filtered));
            return { success: true };
        } catch (error) {
            console.error('Erro ao deletar do localStorage:', error);
            return { success: false, error: error.message };
        }
    }
}

// Instância global
window.dbSystem = new DatabaseSystem();
