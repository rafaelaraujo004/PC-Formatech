// Dados padrão dos serviços
        const defaultServices = {
            formatacao: {
                name: 'Formatação de Computadores',
                price: 80,
                description: 'Formatação completa com instalação do Windows',
                features: ['Windows 10 ou 11', 'Drivers atualizados', 'Programas básicos']
            },
            programas: {
                name: 'Instalação de Programas',
                price: 50,
                description: 'Instalação de programas essenciais',
                features: ['Office', 'Antivírus', 'Navegadores']
            },
            seguranca: {
                name: 'Proteção e Segurança',
                price: 60,
                description: 'Antivírus e proteção completa',
                features: ['Antivírus premium', 'Firewall', 'Anti-malware']
            },
            manutencao: {
                name: 'Manutenção Preventiva',
                price: 70,
                description: 'Limpeza e otimização do sistema',
                features: ['Limpeza de disco', 'Otimização', 'Desfragmentação']
            },
            drivers: {
                name: 'Instalação de Drivers',
                price: 40,
                description: 'Drivers para todos os componentes',
                features: ['Placa de vídeo', 'Som', 'Rede']
            },
            backup: {
                name: 'Backup de Dados',
                price: 45,
                description: 'Backup seguro dos seus arquivos',
                features: ['Documentos', 'Fotos', 'Vídeos']
            },
            remoto: {
                name: 'Atendimento Remoto',
                price: 0,
                discount: 20,
                description: 'Desconto de 10% no atendimento remoto',
                features: ['Via AnyDesk', 'Sem sair de casa', '10% OFF']
            }
        };

        // Estrutura de dados para clientes
        let clients = [];
        let editingClientId = null;

        // Slides da tela inicial
        let heroSlides = [];

        // ===== FIREBASE SYNC HELPERS =====

        // Garante que Firebase está pronto e retorna o db
        function getFirebaseDB() {
            if (typeof db !== 'undefined' && db) return db;
            if (typeof initFirebase === 'function') initFirebase();
            return (typeof db !== 'undefined') ? db : null;
        }

        // Sincroniza qualquer coleção com Firestore (em background, sem bloquear a UI)
        function _syncToFirebase(docName, data) {
            const firebaseDb = getFirebaseDB();
            if (!firebaseDb) {
                console.warn('⚠️ Firebase indisponível — dado salvo apenas localmente: ' + docName);
                return;
            }
            firebaseDb.collection('data').doc(docName)
                .set({ data: data, updatedAt: new Date() })
                .then(() => console.log('✅ Sincronizado no Firebase: ' + docName))
                .catch(err => console.error('❌ Erro ao sincronizar ' + docName + ':', err));
        }

        // Carrega todos os dados do Firebase ao iniciar
        async function _loadAllFromFirebase() {
            const firebaseDb = getFirebaseDB();
            if (!firebaseDb) return;
            try {
                const [clientsDoc, productsDoc, budgetsDoc, servicesDoc] = await Promise.all([
                    firebaseDb.collection('data').doc('clients').get(),
                    firebaseDb.collection('data').doc('products').get(),
                    firebaseDb.collection('data').doc('budgets').get(),
                    firebaseDb.collection('data').doc('services').get()
                ]);
                if (clientsDoc.exists && clientsDoc.data().data) {
                    const carregados = clientsDoc.data().data;
                    // Remover duplicatas pelo nome (mantém o primeiro cadastrado)
                    const vistos = new Set();
                    const semDuplicatas = carregados.filter(c => {
                        const chave = c.name.toLowerCase().replace(/\s+/g, ' ').trim();
                        if (vistos.has(chave)) return false;
                        vistos.add(chave);
                        return true;
                    });
                    if (semDuplicatas.length < carregados.length) {
                        console.warn(`⚠️ ${carregados.length - semDuplicatas.length} cliente(s) duplicado(s) removido(s) automaticamente`);
                        // Salvar lista limpa de volta no Firebase
                        _syncToFirebase('clients', semDuplicatas);
                    }
                    clients = semDuplicatas;
                    localStorage.setItem('pcformatech_clients', JSON.stringify(clients));
                    console.log('✅ Clientes carregados do Firebase');
                }
                if (productsDoc.exists && productsDoc.data().data) {
                    products = productsDoc.data().data;
                    localStorage.setItem('pcformatech_products', JSON.stringify(products));
                    console.log('✅ Produtos carregados do Firebase');
                }
                if (budgetsDoc.exists && budgetsDoc.data().data) {
                    budgets = budgetsDoc.data().data;
                    localStorage.setItem('pcformatech_budgets', JSON.stringify(budgets));
                    console.log('✅ Orçamentos carregados do Firebase');
                }
                if (servicesDoc.exists && servicesDoc.data().data) {
                    localStorage.setItem('pcformatech_services', JSON.stringify(servicesDoc.data().data));
                    console.log('✅ Serviços/preços carregados do Firebase');
                }
                // Orçamentos antigos ganham etapa e número certo; a arrumação só é
                // gravada agora, com os dados da nuvem já lidos.
                orcamentosDaNuvem = true;
                prepararOrcamentos();
                // Atualizar UI com dados do Firebase
                loadClientsTable();
                if (typeof loadProductsTable === 'function') loadProductsTable();
                if (typeof loadBudgetsTable === 'function') loadBudgetsTable();
                updateDashboard();
            } catch (err) {
                console.error('❌ Erro ao carregar do Firebase:', err);
            }
        }

        // Inicialização
        document.addEventListener('DOMContentLoaded', async () => {
            loadClientsFromStorage();
            populateServiceTypes();
            if (window.authSystem && window.authSystem.isAuthenticated()) {
                await activateAdminPanel();
            }
            // loadHeroSlides e _loadAllFromFirebase só rodam após login
        });

        async function activateAdminPanel() {
            if (window.authSystem && window.authSystem.getSessionMode() === 'firebase') {
                await window.authSystem.waitForAuthReady();
            }
            document.getElementById('loginContainer').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            // Quem entra no painel é o dono: a partir daqui, as visitas deste
            // aparelho ao site não entram na contagem de visitantes. Pode ser
            // desfeito na aba Tempo Real.
            try {
                if (localStorage.getItem('pcft_dono') !== '0') localStorage.setItem('pcft_dono', '1');
            } catch (e) { /* armazenamento bloqueado: segue sem marcar */ }
            loadHeroSlides();
            _loadAllFromFirebase();
            updateDashboard();
            loadClientsTable();
            iniciarNotificacoes();
            restaurarAbaSalva();
            ativarOrdenacaoDeTabelas();
        }

        /**
         * Volta para a aba em que se estava trabalhando. Antes, qualquer
         * recarregamento — inclusive o F5 depois de salvar algo — jogava de
         * volta no Dashboard.
         */
        function restaurarAbaSalva() {
            // O endereço manda primeiro: as notificações abrem admin.html#realtime.
            let aba = (window.location.hash || '').slice(1);
            if (!aba || !document.getElementById(`tab-${aba}`)) {
                try { aba = localStorage.getItem('pcformatech_admin_tab'); } catch (e) { return; }
            }
            // A aba antiga de imagens do banner deu lugar à de Anúncios.
            if (aba === 'slider') aba = 'anuncios';
            if (!aba || aba === 'dashboard') return;
            if (!document.getElementById(`tab-${aba}`)) return;
            switchTab(aba);
        }

        /**
         * Ordenação por clique no cabeçalho, em todas as tabelas do painel.
         *
         * Nenhuma das 16 colunas era ordenável: com a lista crescendo, achar o
         * cliente mais recente ou o maior orçamento virava rolagem no olho.
         * A ordenação é feita sobre as linhas já renderizadas, então funciona
         * em qualquer tabela sem depender de como os dados foram carregados.
         */
        function ativarOrdenacaoDeTabelas() {
            document.querySelectorAll('.admin-panel table').forEach((tabela) => {
                const cabecalhos = tabela.querySelectorAll('thead th');
                if (!cabecalhos.length || tabela.dataset.ordenacaoAtiva) return;
                tabela.dataset.ordenacaoAtiva = '1';

                cabecalhos.forEach((th, indice) => {
                    // A última coluna costuma ser "Ações" (botões): não ordena.
                    const rotulo = th.textContent.trim().toLowerCase();
                    if (!rotulo || rotulo === 'ações' || rotulo === 'acoes') return;

                    th.classList.add('admin-sortable');
                    th.tabIndex = 0;
                    th.setAttribute('role', 'button');
                    th.setAttribute('aria-sort', 'none');
                    th.title = 'Ordenar por ' + th.textContent.trim();

                    const ordenar = () => {
                        const corpo = tabela.querySelector('tbody');
                        if (!corpo) return;
                        const linhas = [...corpo.querySelectorAll('tr')]
                            .filter((tr) => !tr.classList.contains('admin-empty-row'));
                        if (linhas.length < 2) return;

                        const crescente = th.getAttribute('aria-sort') !== 'ascending';

                        cabecalhos.forEach((outro) => {
                            outro.setAttribute('aria-sort', 'none');
                            outro.classList.remove('sort-asc', 'sort-desc');
                        });
                        th.setAttribute('aria-sort', crescente ? 'ascending' : 'descending');
                        th.classList.add(crescente ? 'sort-asc' : 'sort-desc');

                        linhas.sort((a, b) => {
                            const x = valorDaCelula(a, indice);
                            const y = valorDaCelula(b, indice);
                            const cmp = (typeof x === 'number' && typeof y === 'number')
                                ? x - y
                                : String(x).localeCompare(String(y), 'pt-BR', { numeric: true, sensitivity: 'base' });
                            return crescente ? cmp : -cmp;
                        });

                        linhas.forEach((tr) => corpo.appendChild(tr));
                    };

                    th.addEventListener('click', ordenar);
                    th.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ordenar(); }
                    });
                });
            });
        }

        /**
         * Valor comparável de uma célula. Reconhece dinheiro (R$ 1.234,56),
         * data brasileira (dd/mm/aaaa) e número puro; o resto vira texto.
         */
        function valorDaCelula(linha, indice) {
            const celula = linha.children[indice];
            if (!celula) return '';
            const texto = celula.textContent.trim();

            const data = texto.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (data) return new Date(`${data[3]}-${data[2]}-${data[1]}`).getTime();

            if (/^R\$/.test(texto) || /^[\d.,]+$/.test(texto)) {
                const numero = Number(texto.replace(/[^\d,-]/g, '').replace(/\./g, '').replace(',', '.'));
                if (Number.isFinite(numero)) return numero;
            }

            const soDigitos = texto.match(/^\D*?(\d+)/);
            if (soDigitos && texto.length < 12) return Number(soDigitos[1]);

            return texto.toLowerCase();
        }

        // ===== SISTEMA DE TABS =====
        /**
         * Traz o botão da aba ativa para dentro da faixa visível.
         *
         * A barra tem 10 abas e rola na horizontal; sem isto, trocar de aba por
         * código (ou ao restaurar a aba salva) deixava a ativa fora de vista e
         * nada indicava onde se estava. scrollIntoView não serve aqui porque
         * rola também a página verticalmente — o cálculo é feito na mão sobre o
         * scrollLeft da própria barra.
         */
        function revelarAbaNaBarra(botao) {
            const barra = botao.closest('.admin-tabs');
            if (!barra || barra.scrollWidth <= barra.clientWidth) return;

            // Medido por getBoundingClientRect: offsetLeft é relativo ao offsetParent,
            // que não é a barra quando ela não tem position própria — era por isso
            // que o cálculo anterior nunca rolava nada.
            const margem = 16;
            const areaBarra = barra.getBoundingClientRect();
            const areaBotao = botao.getBoundingClientRect();

            const sobraEsquerda = areaBotao.left - areaBarra.left;
            const sobraDireita = areaBotao.right - areaBarra.right;

            let destino = null;
            if (sobraEsquerda < margem) {
                destino = barra.scrollLeft + sobraEsquerda - margem;
            } else if (sobraDireita > -margem) {
                destino = barra.scrollLeft + sobraDireita + margem;
            }
            if (destino === null) return;

            // Sem animação: a rolagem suave era interrompida pelo relayout que o
            // conteúdo da aba provoca logo em seguida, e a barra voltava ao lugar.
            barra.scrollLeft = Math.max(0, destino);
        }

        function switchTab(tabName) {
            // Remover active de todos os botões e conteúdos
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            // Resíduo de versões anteriores, que marcavam o <i> em vez do botão
            document.querySelectorAll('.tab-button i.active').forEach(i => i.classList.remove('active'));

            // O botão é localizado pelo próprio tabName. Antes vinha de
            // event.target, que costuma ser o <i> do ícone e não o <button> —
            // clicar no ícone deixava NENHUMA aba destacada. Chamar a função
            // por código também quebrava, porque `event` era undefined.
            const botaoAtivo = document.querySelector(`.tab-button[onclick*="'${tabName}'"]`);
            if (botaoAtivo) botaoAtivo.classList.add('active');

            const conteudoAba = document.getElementById(`tab-${tabName}`);
            if (!conteudoAba) return;
            conteudoAba.classList.add('active');

            // Recarregar volta para a aba em que se estava trabalhando.
            try { localStorage.setItem('pcformatech_admin_tab', tabName); } catch (e) {}
            
            // Carregar dados conforme a tab
            if (tabName === 'dashboard') {
                updateDashboard();
            } else if (tabName === 'clients') {
                loadClientsTable();
            } else if (tabName === 'services') {
                loadServiceClients();
            } else if (tabName === 'products') {
                loadProductsTable();
            } else if (tabName === 'budgets') {
                loadBudgetsTable();
            } else if (tabName === 'prices') {
                loadServices();
            } else if (tabName === 'slider') {
                renderSlides();
            } else if (tabName === 'themes') {
                loadThemeManagerTab();
            } else if (tabName === 'realtime') {
                initRealtimeDashboard();
            } else if (tabName === 'parcelamentos') {
                renderParcelamentosTab();
            }

            // Por último e fora deste ciclo: renderizar o conteúdo da aba muda o
            // layout, e a rolagem precisa ser calculada sobre a posição final.
            if (botaoAtivo) setTimeout(() => revelarAbaNaBarra(botaoAtivo), 0);
        }

        // ===== GERENCIADOR DE TEMAS =====
        let themePreviewThemeId = null;
        let themeSubscriptionBound = false;

        function getThemeManager() {
            if (!window.PCFormatechThemeManager || typeof window.PCFormatechThemeManager.ready !== 'function') {
                return null;
            }
            return window.PCFormatechThemeManager;
        }

        function formatThemeMode(mode) {
            return mode === 'dark' ? 'Escuro' : 'Claro';
        }

        function buildSeasonalPreviewHeadline(theme) {
            const bannerSlideTitle = theme && theme.banner && Array.isArray(theme.banner.slides) && theme.banner.slides[0]
                ? String(theme.banner.slides[0].title || '').trim()
                : '';
            if (bannerSlideTitle) {
                return bannerSlideTitle;
            }
            const cleanName = String(theme && theme.name ? theme.name : 'Data Comemorativa').trim();
            if (!cleanName) {
                return 'Feliz Data Comemorativa!';
            }
            return /^feliz\b/i.test(cleanName) ? cleanName : `Feliz ${cleanName}!`;
        }

        function updateThemePreviewPanel(theme) {
            const summary = document.getElementById('themePreviewSummary');
            const banner = document.getElementById('themePreviewBanner');
            const metrics = document.getElementById('themePreviewMetrics');
            const status = document.getElementById('themeCurrentStatus');
            if (!summary || !banner || !metrics || !status) return;

            if (!theme) {
                summary.textContent = 'Selecione um tema para ver o preview.';
                banner.innerHTML = '';
                metrics.innerHTML = '';
                status.innerHTML = '';
                return;
            }

            const cover = (theme.preview && theme.preview.cover) || (theme.tokens && theme.tokens.pageBackground) || 'linear-gradient(135deg, #f5f5f5, #d8e1ea)';
            const accent = (theme.preview && theme.preview.accent) || (theme.tokens && theme.tokens.accent) || '#40998F';
            const surface = (theme.preview && theme.preview.surface) || (theme.tokens && theme.tokens.themeSurface) || '#ffffff';
            const seasonalSubtitle = theme.banner && Array.isArray(theme.banner.slides) && theme.banner.slides[0]
                ? theme.banner.slides[0].subtitle
                : '';
            const previewHeadline = theme.category === 'seasonal'
                ? buildSeasonalPreviewHeadline(theme)
                : theme.name;
            const previewDescription = theme.category === 'seasonal'
                ? (seasonalSubtitle || 'Tema sazonal em modo preview')
                : 'Pré-visualização do tema selecionado';

            summary.textContent = `${theme.name} · ${formatThemeMode(theme.mode)} · ${theme.category === 'seasonal' ? 'Sazonal' : 'Padrão'}`;

            banner.innerHTML = `
                <div style="height: 140px; border-radius: 12px; border: 1px solid rgba(0,0,0,.08); background: ${cover}; position: relative; overflow: hidden;">
                    <div style="position:absolute;inset:auto 12px 12px 12px;padding:10px 12px;border-radius:10px;background:rgba(0,0,0,.45);color:#fff;">
                        <div style="font-weight:700;line-height:1.2;">${previewHeadline}</div>
                        <div style="font-size:12px;opacity:.9;line-height:1.25;margin-top:2px;">${previewDescription}</div>
                    </div>
                </div>
            `;

            metrics.innerHTML = `
                <div class="theme-metric-chip"><span>Modo</span><strong>${formatThemeMode(theme.mode)}</strong></div>
                <div class="theme-metric-chip"><span>Categoria</span><strong>${theme.category === 'seasonal' ? 'Sazonal' : 'Padrão'}</strong></div>
                <div class="theme-metric-chip"><span>Acento</span><strong style="color:${accent}">${accent}</strong></div>
                <div class="theme-metric-chip"><span>Superfície</span><strong style="color:${surface}">${surface}</strong></div>
            `;
        }

        function renderThemeCatalog(themes, currentThemeId) {
            const catalog = document.getElementById('themeCatalog');
            if (!catalog) return;

            catalog.innerHTML = themes.map(theme => {
                const isCurrent = theme.id === currentThemeId;
                const isPreview = theme.id === themePreviewThemeId;
                const cover = (theme.preview && theme.preview.cover) || (theme.tokens && theme.tokens.pageBackground) || 'linear-gradient(135deg, #f5f5f5, #d8e1ea)';
                const accent = (theme.preview && theme.preview.accent) || (theme.tokens && theme.tokens.accent) || '#40998F';
                return `
                    <article class="theme-card ${isCurrent ? 'is-active' : ''} ${isPreview ? 'is-preview' : ''}" style="border:1px solid var(--theme-border);border-radius:12px;padding:12px;background:var(--theme-surface);">
                        <div style="height:86px;border-radius:10px;background:${cover};border:1px solid rgba(0,0,0,.08);"></div>
                        <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;gap:8px;">
                            <div>
                                <h4 style="margin:0 0 4px 0;font-size:14px;">${theme.name}</h4>
                                <p style="margin:0;color:var(--theme-muted);font-size:12px;">${formatThemeMode(theme.mode)} · ${theme.category === 'seasonal' ? 'Sazonal' : 'Padrão'}</p>
                            </div>
                            <span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${accent};"></span>
                        </div>
                        <div style="margin-top:10px;display:flex;gap:8px;">
                            <button type="button" class="theme-secondary" style="flex:1;" onclick="previewThemeById('${theme.id}')">
                                <i class="fas fa-eye"></i> Preview
                            </button>
                        </div>
                    </article>
                `;
            }).join('');
        }

        async function loadThemeManagerTab() {
            const manager = getThemeManager();
            if (!manager) return;

            await manager.ready();

            if (!themeSubscriptionBound) {
                themeSubscriptionBound = true;
                manager.subscribe(() => {
                    renderThemeManagerState();
                });
            }

            renderThemeManagerState();
        }

        function renderThemeManagerState() {
            const manager = getThemeManager();
            if (!manager) return;

            const themes = manager.getThemes();
            const settings = manager.getSettings();
            // O catálogo mostra o tema do site, não o claro/escuro deste aparelho.
            const currentTheme = manager.getSiteTheme ? manager.getSiteTheme() : manager.getCurrentTheme();

            const autoSeasonal = document.getElementById('themeAutoSeasonal');
            const fallbackSelect = document.getElementById('themeFallbackSelect');
            const status = document.getElementById('themeCurrentStatus');
            const applyBtn = document.getElementById('themeApplyPreviewBtn');
            const resetBtn = document.getElementById('themeResetPreviewBtn');

            if (autoSeasonal) {
                autoSeasonal.checked = settings.autoSeasonal !== false;
            }

            if (fallbackSelect) {
                const fallbackOptions = themes
                    .filter(theme => theme.category !== 'seasonal')
                    .map(theme => `<option value="${theme.id}">${theme.name} (${formatThemeMode(theme.mode)})</option>`)
                    .join('');
                fallbackSelect.innerHTML = fallbackOptions;
                fallbackSelect.value = settings.fallbackThemeId || settings.activeThemeId || (currentTheme && currentTheme.id) || '';
            }

            renderThemeCatalog(themes, currentTheme && currentTheme.id);

            const previewTheme = themePreviewThemeId ? manager.getThemeById(themePreviewThemeId) : currentTheme;
            updateThemePreviewPanel(previewTheme);

            if (status && currentTheme) {
                status.innerHTML = `
                    <strong>Tema publicado:</strong> ${currentTheme.name}<br>
                    <small>Modo ${formatThemeMode(currentTheme.mode)} · ${settings.autoSeasonal ? 'Automação sazonal ativada' : 'Automação sazonal desativada'}</small>
                `;
            }

            if (applyBtn) {
                applyBtn.disabled = !themePreviewThemeId;
            }

            if (resetBtn) {
                resetBtn.disabled = !themePreviewThemeId;
            }
        }

        async function previewThemeById(themeId) {
            const manager = getThemeManager();
            if (!manager || !themeId) return;

            await manager.previewTheme(themeId);
            themePreviewThemeId = themeId;
            renderThemeManagerState();
        }

        async function saveThemeAutomation() {
            const manager = getThemeManager();
            if (!manager) return;

            const autoSeasonal = document.getElementById('themeAutoSeasonal')?.checked !== false;
            const fallbackThemeId = document.getElementById('themeFallbackSelect')?.value || manager.getSettings().fallbackThemeId;
            const currentActive = manager.getSettings().activeThemeId || (manager.getCurrentTheme() && manager.getCurrentTheme().id);

            await manager.saveSettings({
                autoSeasonal,
                fallbackThemeId,
                activeThemeId: currentActive
            });

            showSuccess();
            renderThemeManagerState();
        }

        async function applyPreviewedTheme() {
            const manager = getThemeManager();
            if (!manager || !themePreviewThemeId) return;

            const autoSeasonal = document.getElementById('themeAutoSeasonal')?.checked !== false;
            const fallbackThemeId = document.getElementById('themeFallbackSelect')?.value || manager.getSettings().fallbackThemeId;

            await manager.saveSettings({
                activeThemeId: themePreviewThemeId,
                autoSeasonal,
                fallbackThemeId
            });

            themePreviewThemeId = null;
            showSuccess();
            renderThemeManagerState();
        }

        async function resetThemePreview() {
            const manager = getThemeManager();
            if (!manager) return;

            await manager.clearPreview();
            themePreviewThemeId = null;
            renderThemeManagerState();
        }

        window.previewThemeById = previewThemeById;
        window.saveThemeAutomation = saveThemeAutomation;
        window.applyPreviewedTheme = applyPreviewedTheme;
        window.resetThemePreview = resetThemePreview;

        // ===== LOGIN/LOGOUT =====
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('adminEmail').value.trim().toLowerCase();
            const password = document.getElementById('password').value;
            try {
                if (!window.authSystem) {
                    throw new Error('Módulo de autenticação indisponível.');
                }

                if (!email) {
                    throw new Error('Informe o usuário de acesso (e-mail).');
                }

                // Só o Firebase: o antigo login local (senha no próprio código)
                // saiu, porque o código do painel é público.
                const result = await window.authSystem.loginWithFirebase(email, password);

                if (!result || !result.success) {
                    throw new Error(result?.error || 'Credenciais inválidas');
                }

                document.getElementById('adminEmail').value = email;
                document.getElementById('password').value = '';
                await activateAdminPanel();
            } catch (error) {
                alert(error.message || 'Senha incorreta!');
            }
        });

        function logout() {
            if (window.authSystem) {
                window.authSystem.logout();
                return;
            }
            document.getElementById('adminPanel').style.display = 'none';
            document.getElementById('loginContainer').style.display = 'block';
            document.getElementById('adminEmail').value = '';
            document.getElementById('password').value = '';
        }

        // ===== GESTÃO DE CLIENTES =====
        function loadClientsFromStorage() {
            const saved = localStorage.getItem('pcformatech_clients');
            clients = saved ? JSON.parse(saved) : [];
        }

        function saveClientsToStorage() {
            localStorage.setItem('pcformatech_clients', JSON.stringify(clients));
            _syncToFirebase('clients', clients);
        }

        function saveClient() {
            const name = document.getElementById('clientName').value.trim();
            const phone = document.getElementById('clientPhone').value.trim();
            const email = document.getElementById('clientEmail').value.trim();
            const cpf = document.getElementById('clientCPF').value.trim();
            const address = document.getElementById('clientAddress').value.trim();
            const city = document.getElementById('clientCity').value.trim();

            if (!name || !phone) {
                alert('Por favor, preencha o nome e telefone do cliente!');
                return;
            }

            // Verificar duplicidade pelo nome (ignorando maiúsculas/minúsculas e espaços extras)
            const nomaNormalizado = name.toLowerCase().replace(/\s+/g, ' ').trim();
            const duplicado = clients.find(c =>
                c.id !== editingClientId &&
                c.name.toLowerCase().replace(/\s+/g, ' ').trim() === nomaNormalizado
            );
            if (duplicado) {
                alert(`Já existe um cliente cadastrado com o nome "${duplicado.name}".\nVerifique a lista antes de cadastrar novamente.`);
                return;
            }

            const agora = new Date();
            const createdAtISO = agora.toISOString(); // ex: "2026-04-23T14:35:00.000Z"

            const client = {
                id: editingClientId || Date.now(),
                name,
                phone,
                email,
                cpf,
                address,
                city,
                services: editingClientId ? clients.find(c => c.id === editingClientId).services : [],
                createdAt: editingClientId ? clients.find(c => c.id === editingClientId).createdAt : createdAtISO
            };

            if (editingClientId) {
                // Editar cliente existente
                const index = clients.findIndex(c => c.id === editingClientId);
                clients[index] = client;
                editingClientId = null;
            } else {
                // Novo cliente
                clients.push(client);
            }

            saveClientsToStorage();
            clearClientForm();
            loadClientsTable();
            showSuccess();
        }

        function clearClientForm() {
            document.getElementById('clientForm').reset();
            editingClientId = null;
        }

        /**
         * Desenha o estado vazio de uma tabela.
         *
         * Sem isto, a tabela sem registros mostrava só o cabeçalho e um branco
         * mudo: não dava para distinguir "não há nada cadastrado" de "a busca
         * não encontrou" ou "quebrou ao carregar". A mensagem muda conforme o
         * caso, porque a ação que o operador precisa tomar é outra em cada um.
         */
        function renderTabelaVazia(tbody, { buscando, icone, tituloVazio, textoVazio, tituloBusca, textoBusca }) {
            const colunas = tbody.closest('table')?.querySelectorAll('thead th').length || 5;
            tbody.innerHTML = `
                <tr class="admin-empty-row">
                    <td colspan="${colunas}">
                        <i class="fas fa-${buscando ? 'search' : icone}" aria-hidden="true"></i>
                        <strong>${buscando ? tituloBusca : tituloVazio}</strong>
                        <span>${buscando ? textoBusca : textoVazio}</span>
                    </td>
                </tr>`;
        }

        function loadClientsTable() {
            const tbody = document.getElementById('clientsTableBody');
            if (!tbody) return; // Painel ainda não visível
            tbody.innerHTML = '';

            const searchTerm = document.getElementById('searchClient')?.value.toLowerCase() || '';
            
            // String(...) protege contra registro sem nome ou sem telefone, que
            // antes derrubava a listagem inteira com TypeError.
            const contem = (valor) => String(valor || '').toLowerCase().includes(searchTerm);
            const filteredClients = clients.filter(client =>
                contem(client.name) || contem(client.phone) || contem(client.cpf)
            );

            // Sem isto, a tabela vazia mostrava só o cabeçalho: nada distinguia
            // "não há clientes" de "a busca não achou nada" ou "quebrou".
            if (!filteredClients.length) {
                renderTabelaVazia(tbody, {
                    buscando: !!searchTerm,
                    icone: 'user-plus',
                    tituloVazio: 'Nenhum cliente cadastrado ainda',
                    textoVazio: 'Use o formulário acima para cadastrar o primeiro cliente.',
                    tituloBusca: 'Nenhum cliente encontrado',
                    textoBusca: 'Nada corresponde à busca. Verifique a grafia ou limpe o campo.'
                });
                return;
            }

            filteredClients.forEach(client => {
                const row = document.createElement('tr');
                const serviceCount = client.services ? client.services.length : 0;
                
                row.innerHTML = `
                    <td><strong>${client.name}</strong></td>
                    <td>${client.phone}</td>
                    <td>${client.email || '-'}</td>
                    <td><span class="service-status status-${serviceCount > 0 ? 'concluido' : 'pendente'}">${serviceCount} serviço(s)</span></td>
                    <td>
                        <button class="btn-action btn-view" onclick="viewClient(${client.id})">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        <button class="btn-action btn-edit" onclick="editClient(${client.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-action btn-whatsapp" onclick="openWhatsApp('${client.phone}', '${client.name}')">
                            <i class="fab fa-whatsapp"></i> WhatsApp
                        </button>
                        <button class="btn-action avaliar-btn-claro" onclick="pedirAvaliacao(${client.id})" title="Pedir avaliação no Google pelo WhatsApp">
                            <i class="fas fa-star"></i> Avaliação
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteClient(${client.id})">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        /** Agrupa chamadas seguidas: só a última, depois de `espera`, executa. */
        function debounce(fn, espera = 180) {
            let id;
            return function (...args) {
                clearTimeout(id);
                id = setTimeout(() => fn.apply(this, args), espera);
            };
        }

        const _buscarClientes = debounce(() => loadClientsTable());
        function searchClients() {
            _buscarClientes();
        }

        function viewClient(clientId) {
            const client = clients.find(c => c.id === clientId);
            if (!client) return;

            const details = document.getElementById('clientDetails');
            const totalValue = client.services ? client.services.reduce((sum, s) => sum + s.price, 0) : 0;
            
            details.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <h3><i class="fas fa-user-circle"></i> ${client.name}</h3>
                    <p><strong>WhatsApp:</strong> ${client.phone}</p>
                    <p><strong>E-mail:</strong> ${client.email || '-'}</p>
                    <p><strong>CPF:</strong> ${client.cpf || '-'}</p>
                    <p><strong>Endereço:</strong> ${client.address || '-'}</p>
                    <p><strong>Cidade:</strong> ${client.city || '-'}</p>
                    <p><strong>Cliente desde:</strong> ${new Date(client.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Belem', day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                </div>

                <div style="margin-top: 30px;">
                    <h3><i class="fas fa-briefcase"></i> Histórico de Serviços (${client.services ? client.services.length : 0})</h3>
                    <p><strong>Valor Total:</strong> R$ ${totalValue.toFixed(2).replace('.', ',')}</p>
                    
                    <button class="btn-save" onclick="openAddServiceModal(${client.id})" style="margin: 15px 0;">
                        <i class="fas fa-plus"></i> Adicionar Novo Serviço
                    </button>
                    
                    ${client.services && client.services.length > 0 ? `
                        <div>
                            ${client.services.map((service, index) => {
                                let parcelasHtml = '';
                                if (service.parcelamento && service.parcelamento.ativo) {
                                    const parc = service.parcelamento;
                                    const pagas = parc.parcelas.filter(p => p.pago).length;
                                    const total = parc.parcelas.length;
                                    const valorPago = parc.parcelas.filter(p => p.pago).reduce((s, p) => s + p.valor, 0);
                                    const valorPendente = parc.parcelas.filter(p => !p.pago).reduce((s, p) => s + p.valor, 0);
                                    parcelasHtml = `
                                        <div style="background:#f0fff8;border:1px solid #b2dfdb;border-radius:8px;padding:10px;margin-top:8px;">
                                            <p style="font-weight:700;color:#0B3D3D;margin-bottom:6px;"><i class="fas fa-hand-holding-usd"></i> ${getResumoCobranca(parc)}</p>
                                            <p style="font-size:13px;color:#444;"><strong>${pagas}/${total}</strong> parcelas pagas · <span style="color:#4CAF50;">Recebido: R$ ${valorPago.toFixed(2).replace('.', ',')}</span> · <span style="color:#e65100;">Pendente: R$ ${valorPendente.toFixed(2).replace('.', ',')}</span></p>
                                            <div style="margin-top:8px;">
                                                ${parc.parcelas.map((p, pIdx) => {
                                                    const st = p.pago ? 'pago' : (new Date(p.dataVencimento+'T12:00:00') < new Date() ? 'vencida' : 'pendente');
                                                    const badge = st === 'pago' ? '<span class="parcela-badge-pago">✔ Pago</span>' : st === 'vencida' ? '<span class="parcela-badge-vencida">⚠ Vencida</span>' : '<span class="parcela-badge-pendente">⏳ Pendente</span>';
                                                    const numLabel = getRotuloParcela(parc, p);
                                                    const vencFmt = new Date(p.dataVencimento+'T12:00:00').toLocaleDateString('pt-BR');
                                                    const acaoBtn = st !== 'pago'
                                                        ? `<button class="btn-pagar-parcela" style="font-size:11px;padding:4px 8px;" onclick="marcarParcelaPagaView(${client.id}, ${index}, ${pIdx})"><i class="fas fa-check"></i> Pago</button>`
                                                        : `<button class="btn-estornar-parcela" style="font-size:11px;padding:4px 8px;" onclick="estornarParcelaView(${client.id}, ${index}, ${pIdx})"><i class="fas fa-undo"></i></button>`;
                                                    return `<div class="parc-inline-row"><span class="parc-inline-info"><strong>${numLabel}</strong> · ${vencFmt} · <strong>R$ ${p.valor.toFixed(2).replace('.', ',')}</strong></span>${badge} ${acaoBtn}</div>`;
                                                }).join('')}
                                            </div>
                                        </div>`;
                                }
                                const semParc = !service.parcelamento || !service.parcelamento.ativo;
                                return `
                                <div class="service-item">
                                    <div class="service-header">
                                        <strong>${service.type}</strong>
                                        <span class="service-status status-${service.status}">${service.status.toUpperCase()}</span>
                                    </div>
                                    <p><strong>Descrição:</strong> ${service.description || '-'}</p>
                                    <p><strong>Valor:</strong> R$ ${service.price.toFixed(2).replace('.', ',')}</p>
                                    <p><strong>Data:</strong> ${new Date(service.date).toLocaleDateString('pt-BR')}</p>
                                    ${parcelasHtml}
                                    <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
                                        <button class="btn-action btn-edit" onclick="editService(${client.id}, ${index})">
                                            <i class="fas fa-edit"></i> Editar Status
                                        </button>
                                        ${semParc ? `<button class="btn-parcelar-servico" onclick="openParcelarServicoModal(${client.id}, ${index})"><i class="fas fa-hand-holding-usd"></i> Cobrança</button>` : ''}
                                        <button class="btn-action btn-delete" onclick="deleteService(${client.id}, ${index})">
                                            <i class="fas fa-trash"></i> Remover
                                        </button>
                                    </div>
                                </div>`;
                            }).join('')}
                        </div>
                    ` : '<p style="color: #999; text-align: center; padding: 20px;">Nenhum serviço registrado ainda.</p>'}
                </div>
            `;
            
            document.getElementById('clientModal').style.display = 'block';
        }

        function editClient(clientId) {
            const client = clients.find(c => c.id === clientId);
            if (!client) return;

            editingClientId = clientId;
            document.getElementById('clientName').value = client.name;
            document.getElementById('clientPhone').value = client.phone;
            document.getElementById('clientEmail').value = client.email || '';
            document.getElementById('clientCPF').value = client.cpf || '';
            document.getElementById('clientAddress').value = client.address || '';
            document.getElementById('clientCity').value = client.city || '';

            // Scroll para o formulário
            document.getElementById('clientForm').scrollIntoView({ behavior: 'smooth' });
        }

        function deleteClient(clientId) {
            // Nomear o registro evita o clique errado numa lista longa, em que
            // "este cliente" não diz qual linha foi acionada.
            const alvo = clients.find(c => c.id === clientId);
            const nome = alvo?.name ? `"${alvo.name}"` : 'este cliente';
            const qtdServicos = alvo?.services?.length || 0;
            const detalhe = qtdServicos
                ? ` Isso apaga também os ${qtdServicos} serviço(s) registrados.`
                : '';

            if (confirm(`Excluir ${nome} e todo o histórico?${detalhe}\n\nEsta ação não pode ser desfeita.`)) {
                clients = clients.filter(c => c.id !== clientId);
                saveClientsToStorage();
                loadClientsTable();
                showSuccess();
            }
        }

        function openWhatsApp(phone, name) {
            const cleanPhone = phone.replace(/\D/g, '');
            const message = `Olá ${name}! Aqui é da PC Formatech. Como posso ajudá-lo(a) hoje?`;
            const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        }

        /** Pede a avaliação no Google pelo WhatsApp do cliente (admin-avaliacao.js). */
        function pedirAvaliacao(clientId) {
            const cliente = clients.find(c => c.id === clientId);
            if (!cliente || !window.PCFAvaliacao) return;
            window.PCFAvaliacao.abrir(cliente.phone, cliente.name);
        }

        // ===== GESTÃO DE SERVIÇOS =====
        function populateServiceTypes() {
            const select = document.getElementById('serviceType');
            const saved = localStorage.getItem('pcformatech_services');
            const services = saved ? JSON.parse(saved) : defaultServices;
            
            Object.keys(services).forEach(key => {
                if (key !== 'remoto') { // Remoto é desconto, não serviço direto
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = `${services[key].name} - R$ ${services[key].price.toFixed(2)}`;
                    select.appendChild(option);
                }
            });
        }

        function openAddServiceModal(clientId) {
            document.getElementById('serviceClientId').value = clientId;
            document.getElementById('serviceClientSelectGroup').style.display = 'none';
            document.getElementById('addServiceForm').reset();
            resetServiceFormExtras();
            document.getElementById('serviceModal').style.display = 'block';
        }
        
        function openAddServiceDirectModal() {
            // Mostrar seleção de cliente
            document.getElementById('serviceClientSelectGroup').style.display = 'block';
            document.getElementById('serviceClientId').value = '';
            
            // Popular lista de clientes
            const select = document.getElementById('serviceClientSelect');
            select.innerHTML = '<option value="">Selecione um cliente...</option>';
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = `${client.name} - ${client.phone}`;
                select.appendChild(option);
            });
            
            document.getElementById('addServiceForm').reset();
            resetServiceFormExtras();
            document.getElementById('serviceModal').style.display = 'block';
        }

        document.getElementById('addServiceForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Pegar clientId do campo hidden ou do select
            let clientId = parseInt(document.getElementById('serviceClientId').value);
            
            // Se não tiver clientId no hidden, pegar do select
            if (!clientId) {
                const selectValue = document.getElementById('serviceClientSelect').value;
                if (!selectValue) {
                    alert('Por favor, selecione um cliente!');
                    return;
                }
                clientId = parseInt(selectValue);
            }
            
            const serviceKey = document.getElementById('serviceType').value;
            const description = document.getElementById('serviceDescription').value;
            const price = parseFloat(document.getElementById('servicePrice').value);
            const status = document.getElementById('serviceStatus').value;
            
            const saved = localStorage.getItem('pcformatech_services');
            const services = saved ? JSON.parse(saved) : defaultServices;

            // ===== COBRANÇA (PARCELADO / A PRAZO) =====
            const cobranca = gerarCobrancaServico({
                modo: document.getElementById('serviceCondicaoPagamento').value,
                price,
                nParcelas: parseInt(document.getElementById('serviceNParcelas').value) || 2,
                entrada: parseFloat(document.getElementById('serviceEntrada').value) || 0,
                primeiroVenc: document.getElementById('servicePrimeiroVenc').value
            });
            if (cobranca.error) {
                alert(cobranca.error);
                return;
            }
            let parcelamento = cobranca.parcelamento;

            const service = {
                id: Date.now(),
                type: services[serviceKey].name,
                description,
                price,
                status,
                date: new Date().toISOString(),
                conclusionDate: status === 'concluido' ? new Date().toISOString() : null,
                parcelamento
            };
            
            const client = clients.find(c => c.id === clientId);
            if (!client) {
                alert('Cliente não encontrado!');
                return;
            }
            if (!client.services) client.services = [];
            client.services.push(service);
            
            saveClientsToStorage();
            closeModal('serviceModal');
            
            // Se foi aberto da visualização do cliente, atualizar
            const clientModal = document.getElementById('clientModal');
            if (clientModal.style.display === 'block') {
                viewClient(clientId);
            } else {
                // Se foi aberto da aba de serviços, recarregar a lista
                loadServiceClients();
            }
            
            showSuccess();
        });

        // Preencher preço automaticamente ao selecionar serviço
        document.getElementById('serviceType').addEventListener('change', (e) => {
            const serviceKey = e.target.value;
            if (!serviceKey) return;
            
            const saved = localStorage.getItem('pcformatech_services');
            const services = saved ? JSON.parse(saved) : defaultServices;
            
            document.getElementById('servicePrice').value = services[serviceKey].price;
            calcularPreviewParcelas();
        });

        // ===== FUNÇÕES DE PARCELAMENTO =====

        function formatDateBR(dateStr) {
            if (!dateStr) return '';
            return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
        }

        function getModoCobranca(parcelamento) {
            if (!parcelamento) return 'vista';
            if (parcelamento.modo) return parcelamento.modo;
            return parcelamento.totalParcelas === 1 && !parcelamento.entrada ? 'a_prazo' : 'parcelado';
        }

        function getRotuloParcela(parcelamento, parcela) {
            if (parcela.tipo === 'entrada') return 'Entrada';
            return getModoCobranca(parcelamento) === 'a_prazo' ? 'Vencimento' : `${parcela.numero}ª parcela`;
        }

        function getResumoCobranca(parcelamento) {
            if (!parcelamento || !parcelamento.ativo) return 'À vista';
            const modo = getModoCobranca(parcelamento);
            if (modo === 'a_prazo') {
                const vencimento = parcelamento.parcelas?.find(p => p.tipo !== 'entrada')?.dataVencimento || '';
                return `A prazo: 1x de R$ ${parcelamento.valorParcela.toFixed(2).replace('.', ',')}${vencimento ? ` · vence em ${formatDateBR(vencimento)}` : ''}`;
            }
            return `Parcelamento: ${parcelamento.totalParcelas}x de R$ ${parcelamento.valorParcela.toFixed(2).replace('.', ',')}${parcelamento.entrada > 0 ? ` + entrada R$ ${parcelamento.entrada.toFixed(2).replace('.', ',')}` : ''}`;
        }

        function gerarCobrancaServico({ modo, price, nParcelas, entrada, primeiroVenc }) {
            if (modo === 'vista') return { parcelamento: null };

            if (!primeiroVenc) {
                return { error: modo === 'a_prazo' ? 'Informe a data de vencimento!' : 'Informe a data da 1ª parcela!' };
            }

            if (modo === 'a_prazo') {
                const valor = parseFloat(price.toFixed(2));
                return {
                    parcelamento: {
                        ativo: true,
                        modo: 'a_prazo',
                        totalParcelas: 1,
                        entrada: 0,
                        valorParcela: valor,
                        parcelas: [{
                            numero: 1,
                            tipo: 'parcela',
                            valor,
                            dataVencimento: primeiroVenc,
                            pago: false,
                            dataPagamento: null
                        }]
                    }
                };
            }

            if (entrada >= price) {
                return { error: 'A entrada não pode ser maior ou igual ao valor total do serviço!' };
            }

            const valorRestante = price - entrada;
            const valorParcela = parseFloat((valorRestante / nParcelas).toFixed(2));
            const parcelas = [];

            if (entrada > 0) {
                parcelas.push({
                    numero: 0,
                    tipo: 'entrada',
                    valor: entrada,
                    dataVencimento: primeiroVenc,
                    pago: false,
                    dataPagamento: null
                });
            }

            const baseDate = new Date(primeiroVenc + 'T12:00:00');
            for (let i = 0; i < nParcelas; i++) {
                const venc = new Date(baseDate);
                venc.setMonth(venc.getMonth() + (entrada > 0 ? i + 1 : i));
                const dd = String(venc.getDate()).padStart(2, '0');
                const mm = String(venc.getMonth() + 1).padStart(2, '0');
                const yyyy = venc.getFullYear();
                parcelas.push({
                    numero: i + 1,
                    tipo: 'parcela',
                    valor: i === nParcelas - 1
                        ? parseFloat((valorRestante - valorParcela * (nParcelas - 1)).toFixed(2))
                        : valorParcela,
                    dataVencimento: `${yyyy}-${mm}-${dd}`,
                    pago: false,
                    dataPagamento: null
                });
            }

            return {
                parcelamento: {
                    ativo: true,
                    modo: 'parcelado',
                    totalParcelas: nParcelas,
                    entrada,
                    valorParcela,
                    parcelas
                }
            };
        }

        function toggleParcelamento() {
            const modo = document.getElementById('serviceCondicaoPagamento').value;
            const show = modo !== 'vista';
            document.getElementById('parcelamentoFields').style.display = show ? 'block' : 'none';
            document.getElementById('serviceNParcelasGroup').style.display = modo === 'parcelado' ? 'block' : 'none';
            document.getElementById('serviceEntradaGroup').style.display = modo === 'parcelado' ? 'block' : 'none';
            document.getElementById('servicePrimeiroVencLabel').textContent = modo === 'a_prazo' ? 'Data do Vencimento: *' : 'Data 1ª Parcela: *';

            if (modo !== 'parcelado') {
                document.getElementById('serviceEntrada').value = '0';
            }

            if (show) {
                const hoje = new Date().toISOString().split('T')[0];
                if (!document.getElementById('servicePrimeiroVenc').value) {
                    document.getElementById('servicePrimeiroVenc').value = hoje;
                }
                calcularPreviewParcelas();
            } else {
                document.getElementById('parcelaPreview').style.display = 'none';
            }
        }

        function calcularPreviewParcelas() {
            const modo = document.getElementById('serviceCondicaoPagamento').value;
            const price = parseFloat(document.getElementById('servicePrice').value) || 0;
            const nParcelas = parseInt(document.getElementById('serviceNParcelas').value) || 2;
            const entrada = parseFloat(document.getElementById('serviceEntrada').value) || 0;
            const primeiroVenc = document.getElementById('servicePrimeiroVenc').value;
            const preview = document.getElementById('parcelaPreview');

            if (!price || modo === 'vista') { preview.style.display = 'none'; return; }

            if (modo === 'a_prazo') {
                let html = `<strong>A prazo</strong> → 1x de <strong>R$ ${String(price.toFixed(2)).replace('.', ',')}</strong>`;
                if (primeiroVenc) {
                    html += ` com vencimento em <strong>${formatDateBR(primeiroVenc)}</strong>`;
                }
                preview.innerHTML = html;
                preview.style.display = 'block';
                return;
            }

            const valorRestante = price - entrada;
            if (valorRestante <= 0) {
                preview.innerHTML = '<span style="color:#c62828;">⚠️ A entrada não pode ser maior ou igual ao valor total!</span>';
                preview.style.display = 'block';
                return;
            }

            const valorParcela = (valorRestante / nParcelas).toFixed(2);
            let html = `<strong>R$ ${String(price.toFixed(2)).replace('.', ',')}</strong> → `;
            if (entrada > 0) {
                html += `Entrada: <strong>R$ ${entrada.toFixed(2).replace('.', ',')}</strong> + `;
            }
            html += `<strong>${nParcelas}x</strong> de <strong>R$ ${String(valorParcela).replace('.', ',')}</strong>`;
            preview.innerHTML = html;
            preview.style.display = 'block';
        }

        // Limpar campos de parcelamento ao resetar o formulário de serviço
        function resetServiceFormExtras() {
            document.getElementById('serviceCondicaoPagamento').value = 'vista';
            document.getElementById('parcelamentoFields').style.display = 'none';
            document.getElementById('parcelaPreview').style.display = 'none';
            document.getElementById('serviceEntrada').value = '0';
            document.getElementById('servicePrimeiroVenc').value = '';
            document.getElementById('serviceNParcelas').value = '2';
            document.getElementById('serviceNParcelasGroup').style.display = 'block';
            document.getElementById('serviceEntradaGroup').style.display = 'block';
            document.getElementById('servicePrimeiroVencLabel').textContent = 'Data 1ª Parcela: *';
        }

        // ===== ABA PARCELAMENTOS =====

        function _getStatusParcela(parcela) {
            if (parcela.pago) return 'pago';
            const hoje = new Date(); hoje.setHours(0,0,0,0);
            const venc = new Date(parcela.dataVencimento + 'T12:00:00');
            venc.setHours(0,0,0,0);
            if (venc < hoje) return 'vencida';
            return 'pendente';
        }

        function renderParcelamentosTab() {
            const search = (document.getElementById('parc-search')?.value || '').toLowerCase();
            const filtroStatus = document.getElementById('parc-filtro-status')?.value || 'todos';
            const ordem = document.getElementById('parc-filtro-ordem')?.value || 'vencimento';

            // Coletar todas as parcelas de todos os clientes
            let todasParcelas = [];
            clients.forEach(client => {
                if (!client.services) return;
                client.services.forEach((service, sIdx) => {
                    if (!service.parcelamento || !service.parcelamento.ativo) return;
                    service.parcelamento.parcelas.forEach((parcela, pIdx) => {
                        todasParcelas.push({
                            clientId: client.id,
                            clientName: client.name,
                            clientPhone: client.phone,
                            serviceIdx: sIdx,
                            serviceId: service.id,
                            serviceType: service.type,
                            servicePrice: service.price,
                            parcelaIdx: pIdx,
                            parcela,
                            parcelamento: service.parcelamento
                        });
                    });
                });
            });

            // Resumo
            let totPend = 0, totVenc = 0, totPago = 0, totServicos = new Set();
            todasParcelas.forEach(item => {
                const st = _getStatusParcela(item.parcela);
                if (st === 'pago') totPago += item.parcela.valor;
                else if (st === 'vencida') totVenc += item.parcela.valor;
                else totPend += item.parcela.valor;
                totServicos.add(`${item.clientId}_${item.serviceIdx}`);
            });
            document.getElementById('parc-tot-pendente').textContent = `R$ ${totPend.toFixed(2).replace('.', ',')}`;
            document.getElementById('parc-tot-vencido').textContent = `R$ ${totVenc.toFixed(2).replace('.', ',')}`;
            document.getElementById('parc-tot-pago').textContent = `R$ ${totPago.toFixed(2).replace('.', ',')}`;
            document.getElementById('parc-tot-servicos').textContent = totServicos.size;

            // Filtros
            let filtradas = todasParcelas.filter(item => {
                const matchSearch = item.clientName.toLowerCase().includes(search) || item.serviceType.toLowerCase().includes(search);
                const st = _getStatusParcela(item.parcela);
                const matchStatus = filtroStatus === 'todos' || st === filtroStatus;
                return matchSearch && matchStatus;
            });

            // Ordenação
            if (ordem === 'vencimento') {
                filtradas.sort((a, b) => a.parcela.dataVencimento.localeCompare(b.parcela.dataVencimento));
            } else if (ordem === 'cliente') {
                filtradas.sort((a, b) => a.clientName.localeCompare(b.clientName));
            } else if (ordem === 'valor') {
                filtradas.sort((a, b) => b.parcela.valor - a.parcela.valor);
            }

            const container = document.getElementById('parc-lista-container');
            if (filtradas.length === 0) {
                container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">Nenhum parcelamento encontrado.</p>';
                return;
            }

            // Agrupar por cliente (consolidado por pessoa, sem dividir por serviço)
            const grupos = {};
            filtradas.forEach(item => {
                const key = String(item.clientId);
                if (!grupos[key]) {
                    grupos[key] = {
                        clientName: item.clientName,
                        clientPhone: item.clientPhone,
                        clientId: item.clientId,
                        parcelas: []
                    };
                }
                grupos[key].parcelas.push(item);
            });

            let html = '';
            Object.values(grupos).forEach(grupo => {
                grupo.parcelas.sort((a, b) => {
                    if (ordem === 'valor') return b.parcela.valor - a.parcela.valor;
                    if (ordem === 'cliente') return a.serviceType.localeCompare(b.serviceType);
                    return a.parcela.dataVencimento.localeCompare(b.parcela.dataVencimento);
                });

                const qtdPagas = grupo.parcelas.filter(i => _getStatusParcela(i.parcela) === 'pago').length;
                const qtdTotal = grupo.parcelas.length;
                const totalCliente = grupo.parcelas.reduce((s, i) => s + i.parcela.valor, 0);
                const recebidoCliente = grupo.parcelas
                    .filter(i => _getStatusParcela(i.parcela) === 'pago')
                    .reduce((s, i) => s + i.parcela.valor, 0);
                const pendenteCliente = totalCliente - recebidoCliente;

                html += `<div style="margin-bottom:20px;">
                    <div class="parc-group-title">
                        <i class="fas fa-user-circle"></i>
                        ${grupo.clientName}
                        <span style="font-weight:400;color:#666;font-size:12px;">${grupo.clientPhone}</span>
                        <span style="margin-left:10px;font-size:12px;">Total: <strong>R$ ${totalCliente.toFixed(2).replace('.', ',')}</strong></span>
                        <span style="margin-left:auto;font-size:12px;color:#888;">${qtdPagas}/${qtdTotal} parcelas pagas</span>
                    </div>
                    <div style="font-size:12px;color:#666;margin: -2px 0 8px 34px;">
                        Recebido: <strong>R$ ${recebidoCliente.toFixed(2).replace('.', ',')}</strong> · Pendente: <strong>R$ ${pendenteCliente.toFixed(2).replace('.', ',')}</strong>
                    </div>
                    <div class="table-wrapper">
                    <table class="parcelas-table">
                        <thead>
                            <tr>
                                <th>Serviço</th>
                                <th>Parcela</th>
                                <th>Vencimento</th>
                                <th>Valor</th>
                                <th>Status</th>
                                <th>Pago em</th>
                                <th>Ação</th>
                            </tr>
                        </thead>
                        <tbody>`;

                grupo.parcelas.forEach(item => {
                    const p = item.parcela;
                    const st = _getStatusParcela(p);
                    const trClass = st === 'pago' ? 'pago-sim' : '';
                    const vencFormatado = new Date(p.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR');
                    const pagoEm = p.dataPagamento ? new Date(p.dataPagamento).toLocaleDateString('pt-BR') : '—';
                    const parcelaLabel = p.tipo === 'entrada'
                        ? 'Entrada'
                        : (getModoCobranca(item.parcelamento) === 'a_prazo' ? 'A prazo' : `${p.numero}ª parcela`);

                    let badgeHtml = '';
                    if (st === 'pago') badgeHtml = '<span class="parcela-badge-pago">✔ Pago</span>';
                    else if (st === 'vencida') badgeHtml = '<span class="parcela-badge-vencida">⚠ Vencida</span>';
                    else badgeHtml = '<span class="parcela-badge-pendente">⏳ Pendente</span>';

                    let acaoHtml = '';
                    if (st !== 'pago') {
                        acaoHtml = `<button class="btn-pagar-parcela" onclick="marcarParcelaPaga(${item.clientId}, ${item.serviceIdx}, ${item.parcelaIdx})">
                            <i class="fas fa-check"></i> Marcar Pago
                        </button>`;
                    } else {
                        acaoHtml = `<button class="btn-estornar-parcela" onclick="estornarParcela(${item.clientId}, ${item.serviceIdx}, ${item.parcelaIdx})">
                            <i class="fas fa-undo"></i> Estornar
                        </button>`;
                    }

                    html += `<tr class="${trClass}">
                        <td><strong>${item.serviceType}</strong></td>
                        <td><span style="font-size:12px;color:#444;">${parcelaLabel}</span></td>
                        <td>${vencFormatado}</td>
                        <td><strong>R$ ${p.valor.toFixed(2).replace('.', ',')}</strong></td>
                        <td>${badgeHtml}</td>
                        <td style="color:#888;font-size:12px;">${pagoEm}</td>
                        <td>${acaoHtml}</td>
                    </tr>`;
                });

                html += `</tbody></table></div></div>`;
            });

            container.innerHTML = html;
        }

        function _marcarParcelaPagaCore(clientId, serviceIdx, parcelaIdx) {
            const client = clients.find(c => c.id === clientId);
            if (!client) return false;
            const service = client.services[serviceIdx];
            if (!service || !service.parcelamento) return false;
            const parcela = service.parcelamento.parcelas[parcelaIdx];
            if (!parcela) return false;
            parcela.pago = true;
            parcela.dataPagamento = new Date().toISOString();
            const todasPagas = service.parcelamento.parcelas.every(p => p.pago);
            if (todasPagas) {
                service.status = 'concluido';
                if (!service.conclusionDate) service.conclusionDate = new Date().toISOString();
            }
            saveClientsToStorage();
            return true;
        }

        function marcarParcelaPaga(clientId, serviceIdx, parcelaIdx) {
            if (!_marcarParcelaPagaCore(clientId, serviceIdx, parcelaIdx)) return;
            renderParcelamentosTab();
            showSuccess();
        }

        function marcarParcelaPagaView(clientId, serviceIdx, parcelaIdx) {
            if (!_marcarParcelaPagaCore(clientId, serviceIdx, parcelaIdx)) return;
            viewClient(clientId);
            renderParcelamentosTab();
            showSuccess();
        }

        function _estornarParcelaCore(clientId, serviceIdx, parcelaIdx) {
            const client = clients.find(c => c.id === clientId);
            if (!client) return false;
            const service = client.services[serviceIdx];
            if (!service || !service.parcelamento) return false;
            const parcela = service.parcelamento.parcelas[parcelaIdx];
            if (!parcela) return false;
            parcela.pago = false;
            parcela.dataPagamento = null;
            saveClientsToStorage();
            return true;
        }

        function estornarParcela(clientId, serviceIdx, parcelaIdx) {
            if (!confirm('Deseja estornar o pagamento desta parcela?')) return;
            if (!_estornarParcelaCore(clientId, serviceIdx, parcelaIdx)) return;
            renderParcelamentosTab();
            showSuccess();
        }

        function estornarParcelaView(clientId, serviceIdx, parcelaIdx) {
            if (!confirm('Deseja estornar o pagamento desta parcela?')) return;
            if (!_estornarParcelaCore(clientId, serviceIdx, parcelaIdx)) return;
            viewClient(clientId);
            renderParcelamentosTab();
            showSuccess();
        }

        function editService(clientId, serviceIndex) {
            const client = clients.find(c => c.id === clientId);
            const service = client.services[serviceIndex];
            
            const newStatus = prompt('Novo status do serviço:\n1 - Pendente\n2 - Em Andamento\n3 - Concluído\n4 - Cancelado', '1');
            
            const statusMap = {
                '1': 'pendente',
                '2': 'andamento',
                '3': 'concluido',
                '4': 'cancelado'
            };
            
            if (newStatus && statusMap[newStatus]) {
                service.status = statusMap[newStatus];
                if (statusMap[newStatus] === 'concluido' && !service.conclusionDate) {
                    service.conclusionDate = new Date().toISOString();
                }
                saveClientsToStorage();
                viewClient(clientId);
                showSuccess();
            }
        }

        function deleteService(clientId, serviceIndex) {
            if (confirm('Tem certeza que deseja remover este serviço?')) {
                const client = clients.find(c => c.id === clientId);
                client.services.splice(serviceIndex, 1);
                saveClientsToStorage();
                viewClient(clientId);
                showSuccess();
            }
        }

        function loadServiceClients() {
            const container = document.getElementById('serviceClientsContainer');
            container.innerHTML = '';

            const searchTerm = document.getElementById('searchServiceClient')?.value.toLowerCase() || '';
            
            const filteredClients = clients.filter(client => 
                client.name.toLowerCase().includes(searchTerm) &&
                client.services && client.services.length > 0
            );

            if (filteredClients.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Nenhum cliente com serviços encontrado.</p>';
                return;
            }

            filteredClients.forEach(client => {
                const totalValue = client.services.reduce((sum, s) => sum + s.price, 0);
                const pendingServices = client.services.filter(s => s.status === 'pendente' || s.status === 'andamento').length;
                
                const clientCard = document.createElement('div');
                clientCard.className = 'service-card';
                clientCard.innerHTML = `
                    <h3>${client.name} <span style="font-size: 14px; color: #666;">${client.phone}</span></h3>
                    <p><strong>Total de Serviços:</strong> ${client.services.length}</p>
                    <p><strong>Serviços Pendentes:</strong> ${pendingServices}</p>
                    <p><strong>Valor Total:</strong> R$ ${totalValue.toFixed(2).replace('.', ',')}</p>
                    <button class="btn-save" onclick="viewClient(${client.id})">
                        <i class="fas fa-eye"></i> Ver Detalhes Completos
                    </button>
                `;
                container.appendChild(clientCard);
            });
        }

        function searchServiceClients() {
            loadServiceClients();
        }

        // ===== DASHBOARD =====
        function updateDashboard() {
            const totalClients = clients.length;
            let totalServices = 0;
            let pendingServices = 0;
            let totalRevenue = 0;

            clients.forEach(client => {
                if (client.services) {
                    totalServices += client.services.length;
                    client.services.forEach(service => {
                        if (service.status === 'pendente' || service.status === 'andamento') {
                            pendingServices++;
                        }
                        if (service.status === 'concluido') {
                            totalRevenue += service.price;
                        }
                    });
                }
            });

            document.getElementById('totalClients').textContent = totalClients;
            document.getElementById('totalServices').textContent = totalServices;
            document.getElementById('pendingServices').textContent = pendingServices;
            document.getElementById('totalRevenue').textContent = `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`;
            
            // Atualizar gráfico
            updateStatsChart();
        }

      // ===== GRÁFICO DE ESTATÍSTICAS =====
let statsChart = null;

// Detecta corretamente o tema (data-theme OU classe .dark)
function isDarkThemeEnabled() {
    const html = document.documentElement;
    return html.getAttribute('data-theme') === 'dark' || html.classList.contains('dark');
}

// Paleta de cores baseada no tema
function getChartThemePalette() {
    const dark = isDarkThemeEnabled();

    return {
        legendColor: dark ? '#dce7f3' : '#2e3f54',
        tickColor: dark ? '#b9c9db' : '#5d6a7c',
        gridColor: dark ? 'rgba(211, 217, 224, 0.2)' : 'rgba(0, 0, 0, 0.06)',
        tooltipBg: dark ? 'rgba(18, 31, 48, 0.96)' : 'rgba(255, 255, 255, 0.95)',
        tooltipText: dark ? '#f2f7ff' : '#243548',
        doughnutBorder: dark ? '#17263b' : '#ffffff',
        revenueBar: dark ? 'rgba(98, 200, 189, 0.72)' : 'rgba(64,153,143,0.7)',
        revenueBorder: dark ? '#62c8bd' : '#40998F',
        projBtnBg: dark ? '#1a2f4a' : '#f0f7ff',
        projBtnBorder: dark ? '#355b85' : '#c9deef',
        projBtnText: dark ? '#dce8f5' : '#0B3D3D',
        projBtnBgMuted: dark ? '#1f3a2b' : '#e8f5e9',
        projBtnBorderMuted: dark ? '#2f6248' : '#4CAF50'
    };
}

function updateProjectionToggleButton() {
    const btn = document.getElementById('btnToggleProjecao');
    if (!btn) return;

    const palette = getChartThemePalette();
    const hiddenMode = !_projecaoVisivel;

    btn.style.background = hiddenMode ? palette.projBtnBgMuted : palette.projBtnBg;
    btn.style.borderColor = hiddenMode ? palette.projBtnBorderMuted : palette.projBtnBorder;
    btn.style.color = palette.projBtnText;
}

// Atualiza o gráfico quando o tema muda
function updateChartTheme() {
    if (!statsChart) return;

    const palette = getChartThemePalette();

    // legenda
    statsChart.options.plugins.legend.labels.color = palette.legendColor;

    // eixos
    if (statsChart.options.scales) {
        if (statsChart.options.scales.x) {
            statsChart.options.scales.x.ticks.color = palette.tickColor;
            statsChart.options.scales.x.grid.color = palette.gridColor;
        }
        if (statsChart.options.scales.y) {
            statsChart.options.scales.y.ticks.color = palette.tickColor;
            statsChart.options.scales.y.grid.color = palette.gridColor;
        }
    }

    statsChart.update();
}

        function getMonthlyData() {
            const months = [];
            const now = new Date();

            // 6 meses atrás + mês atual + 6 meses futuros = 13 meses
            for (let i = -6; i <= 6; i++) {
                const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
                const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'America/Belem' });
                months.push(monthName);
            }

            // Dados reais: índices 0-6 (6 meses atrás até mês atual)
            const clientsReal = new Array(7).fill(0);
            const servicesCompletedReal = new Array(7).fill(0);
            const servicesPendingReal = new Array(7).fill(0);
            // Datas exatas de conclusão por bucket mensal (índices 0-6)
            const serviceDatesPerMonth = Array.from({ length: 7 }, () => []);

            clients.forEach(client => {
                const clientDate = new Date(client.createdAt);
                if (isNaN(clientDate.getTime())) return;

                const monthDiff = (now.getFullYear() - clientDate.getFullYear()) * 12 + now.getMonth() - clientDate.getMonth();

                if (monthDiff >= 0 && monthDiff <= 6) {
                    const index = 6 - monthDiff;
                    clientsReal[index]++;
                }

                if (client.services) {
                    client.services.forEach(service => {
                        // Para serviços concluídos, usar data de conclusão; demais usam data de criação
                        const refDateStr = service.status === 'concluido'
                            ? (service.conclusionDate || service.date)
                            : service.date;
                        const serviceDate = new Date(refDateStr);
                        if (isNaN(serviceDate.getTime())) return;

                        const serviceDiff = (now.getFullYear() - serviceDate.getFullYear()) * 12 + now.getMonth() - serviceDate.getMonth();

                        if (serviceDiff >= 0 && serviceDiff <= 6) {
                            const index = 6 - serviceDiff;
                            if (service.status === 'concluido') {
                                servicesCompletedReal[index]++;
                                // Guardar data ISO para ordenar depois
                                serviceDatesPerMonth[index].push(refDateStr);
                            } else if (service.status === 'pendente' || service.status === 'andamento') {
                                servicesPendingReal[index]++;
                            }
                        }
                    });
                }
            });

            // Ordenar datas e converter para exibição dd/mm
            const serviceDatesDisplay = serviceDatesPerMonth.map(dates =>
                dates
                    .sort()
                    .map(d => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Belem' }))
            );

            // Projeção fixa para próximos 6 meses (média dos dados reais — sem aleatoriedade)
            const avgClients = Math.round(clientsReal.reduce((a, b) => a + b, 0) / 7);
            const avgCompleted = Math.round(servicesCompletedReal.reduce((a, b) => a + b, 0) / 7);
            const avgPending = Math.round(servicesPendingReal.reduce((a, b) => a + b, 0) / 7);

            // Arrays completos (13 pontos)
            // Dados reais: índices 0-6, null para futuros
            const clientsData = [...clientsReal, ...new Array(6).fill(null)];
            const servicesCompletedData = [...servicesCompletedReal, ...new Array(6).fill(null)];
            const servicesPendingData = [...servicesPendingReal, ...new Array(6).fill(null)];

            // Projeção: null para passado, conecta no mês atual (índice 6) e segue
            const clientsProj = [...new Array(6).fill(null), clientsReal[6], ...new Array(6).fill(avgClients)];
            const servicesCompletedProj = [...new Array(6).fill(null), servicesCompletedReal[6], ...new Array(6).fill(avgCompleted)];
            const servicesPendingProj = [...new Array(6).fill(null), servicesPendingReal[6], ...new Array(6).fill(avgPending)];

            return {
                labels: months,
                clientsData,
                servicesCompletedData,
                servicesPendingData,
                clientsProj,
                servicesCompletedProj,
                servicesPendingProj,
                serviceDatesPerMonth: serviceDatesDisplay
            };
        }

        // Controla visibilidade da projeção no gráfico
        let _projecaoVisivel = true;

        function toggleProjecaoChart() {
            _projecaoVisivel = !_projecaoVisivel;
            const btn = document.getElementById('btnToggleProjecao');
            if (btn) {
                btn.innerHTML = _projecaoVisivel
                    ? '<i class="fas fa-eye-slash"></i> Ocultar Projeção'
                    : '<i class="fas fa-eye"></i> Mostrar Projeção';
            }
            updateProjectionToggleButton();
            updateStatsChart();
        }

        function updateStatsChart() {
            const data = getMonthlyData();
            const ctx = document.getElementById('statsChart');
            if (!ctx) return;
            updateProjectionToggleButton();
            if (statsChart) statsChart.destroy();

            const isMobile = window.innerWidth <= 768;
            const palette = getChartThemePalette();
            // Índice divisório: 6 = mês atual, >6 = projeção
            const PIVOT = 6;

            // Mescla dados reais e projeção num único array por série
            // Pontos reais: índice 0-6; pontos de projeção: 7-12
            // Projeção é visualmente diferenciada via `segment`
            const buildMerged = (real, proj) => {
                // real.slice(0, PIVOT + 1) = só os 7 meses reais. Antes usava o
                // array inteiro, que já traz 6 nulls futuros: 13 + 6 = 19 pontos
                // para 13 rótulos, e o Chart.js descartava justamente os 6 da
                // projeção. Resultado: a projeção nunca aparecia, e o botão
                // "Ocultar Projeção" não tinha efeito visível.
                return real.slice(0, PIVOT + 1).concat(
                    proj.slice(PIVOT + 1).map(v => (_projecaoVisivel ? v : null))
                );
            };

            const clientsMerged        = buildMerged(data.clientsData, data.clientsProj);
            const completedMerged      = buildMerged(data.servicesCompletedData, data.servicesCompletedProj);
            const pendingMerged        = buildMerged(data.servicesPendingData, data.servicesPendingProj);

            // Preenche o gap entre mês atual e projeção para continuidade visual
            if (_projecaoVisivel) {
                clientsMerged[PIVOT]   = data.clientsProj[PIVOT];
                completedMerged[PIVOT] = data.servicesCompletedProj[PIVOT];
                pendingMerged[PIVOT]   = data.servicesPendingProj[PIVOT];
            }

            // Segment: distingue visualmente real vs projeção na mesma linha
            const makeSegment = (solidColor, alphaColor) => ({
                borderColor: ctx => ctx.p0DataIndex >= PIVOT ? alphaColor : solidColor,
                borderDash:  ctx => ctx.p0DataIndex >= PIVOT ? [6, 4] : [],
                borderWidth: ctx => ctx.p0DataIndex >= PIVOT ? 1.5 : (isMobile ? 2 : 2.5)
            });

            statsChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [
                        {
                            label: 'Clientes',
                            data: clientsMerged,
                            borderColor: '#40998F',
                            backgroundColor: 'rgba(64,153,143,0.10)',
                            borderWidth: isMobile ? 2 : 2.5,
                            fill: true,
                            tension: 0.4,
                            spanGaps: false,
                            pointRadius: ctx => ctx.dataIndex > PIVOT ? 0 : (isMobile ? 2 : 4),
                            pointHoverRadius: 6,
                            segment: makeSegment('#40998F', 'rgba(64,153,143,0.5)')
                        },
                        {
                            label: 'Serviços Realizados',
                            data: completedMerged,
                            borderColor: '#4CAF50',
                            backgroundColor: 'rgba(76,175,80,0.10)',
                            borderWidth: isMobile ? 2 : 2.5,
                            fill: true,
                            tension: 0.4,
                            spanGaps: false,
                            pointRadius: ctx => ctx.dataIndex > PIVOT ? 0 : (isMobile ? 2 : 4),
                            pointHoverRadius: 6,
                            segment: makeSegment('#4CAF50', 'rgba(76,175,80,0.5)')
                        },
                        {
                            label: 'Serviços Pendentes',
                            data: pendingMerged,
                            borderColor: '#FF9800',
                            backgroundColor: 'rgba(255,152,0,0.10)',
                            borderWidth: isMobile ? 2 : 2.5,
                            fill: true,
                            tension: 0.4,
                            spanGaps: false,
                            pointRadius: ctx => ctx.dataIndex > PIVOT ? 0 : (isMobile ? 2 : 4),
                            pointHoverRadius: 6,
                            segment: makeSegment('#FF9800', 'rgba(255,152,0,0.5)')
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: isMobile ? 'bottom' : 'top',
                            labels: {
                                font: { size: isMobile ? 11 : 13, weight: '600' },
                                padding: isMobile ? 12 : 24,
                                usePointStyle: true,
                                pointStyleWidth: isMobile ? 10 : 14,
                                color: palette.legendColor
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: palette.tooltipBg,
                            titleColor: palette.tooltipText,
                            bodyColor: palette.tooltipText,
                            padding: isMobile ? 8 : 12,
                            titleFont: { size: isMobile ? 12 : 13, weight: 'bold' },
                            bodyFont: { size: isMobile ? 11 : 12 },
                            callbacks: {
                                title: function(items) {
                                    const idx = items[0]?.dataIndex ?? 0;
                                    const label = data.labels[idx] || '';
                                    return idx > PIVOT && _projecaoVisivel
                                        ? `${label}  (projeção)`
                                        : label;
                                },
                                label: function(item) {
                                    if (item.raw === null || item.raw === undefined) return null;
                                    const suffix = item.dataIndex > PIVOT ? ' ~' : '';
                                    return ` ${item.dataset.label}: ${item.raw}${suffix}`;
                                },
                                afterLabel: function(item) {
                                    // Mostrar datas exatas de conclusão sob "Serviços Realizados"
                                    if (item.datasetIndex !== 1 || item.dataIndex > PIVOT) return null;
                                    const dates = data.serviceDatesPerMonth[item.dataIndex] || [];
                                    if (dates.length === 0) return null;
                                    const shown = dates.slice(0, 6);
                                    const extra = dates.length - shown.length;
                                    let str = '  ' + shown.join(' · ');
                                    if (extra > 0) str += ` (+${extra})`;
                                    return str;
                                },
                                // Remove entradas nulas do tooltip
                                afterBody: function() { return []; }
                            },
                            filter: function(item) {
                                return item.raw !== null && item.raw !== undefined;
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                precision: 0,
                                font: { size: isMobile ? 10 : 11 },
                                maxTicksLimit: isMobile ? 5 : 7,
                                color: palette.tickColor
                            },
                            grid: { color: palette.gridColor }
                        },
                        x: {
                            ticks: {
                                font: { size: isMobile ? 9 : 11 },
                                maxRotation: isMobile ? 40 : 0,
                                minRotation: isMobile ? 40 : 0,
                                color: ctx => {
                                    // Destacar mês atual; tingir meses futuros mais suavemente
                                    const idx = ctx.index;
                                    if (idx === PIVOT) return palette.legendColor;
                                    if (idx > PIVOT) return palette.tickColor + '99';
                                    return palette.tickColor;
                                },
                                callback: function(val, index) {
                                    if (isMobile) return index % 2 === 0 ? this.getLabelForValue(val) : '';
                                    return this.getLabelForValue(val);
                                }
                            },
                            grid: { display: false }
                        }
                    },
                    interaction: { mode: 'index', axis: 'x', intersect: false }
                }
            });
        }

        // ===== GESTÃO DE PREÇOS (código original) =====
        // ===== GESTÃO DE PREÇOS (código original) =====
        function loadServices() {
            const saved = localStorage.getItem('pcformatech_services');
            const services = saved ? JSON.parse(saved) : defaultServices;
            
            const grid = document.getElementById('servicesGrid');
            grid.innerHTML = '';

            Object.keys(services).forEach(key => {
                const service = services[key];
                const card = document.createElement('div');
                card.className = 'service-card';
                card.innerHTML = `
                    <h3>${service.name}</h3>
                    <div class="input-group">
                        <label>Nome do Serviço:</label>
                        <input type="text" id="${key}_name" value="${service.name}">
                    </div>
                    <div class="input-group">
                        <label>Preço (R$):</label>
                        <input type="number" id="${key}_price" value="${service.price}" step="0.01">
                    </div>
                    <div class="input-group">
                        <label>Descrição:</label>
                        <textarea id="${key}_description">${service.description}</textarea>
                    </div>
                    ${service.discount ? `
                    <div class="discount-section">
                        <h4>Desconto Especial</h4>
                        <div class="input-group">
                            <label>Desconto (%):</label>
                            <input type="number" id="${key}_discount" value="${service.discount}" min="0" max="100">
                        </div>
                    </div>
                    ` : ''}
                    <button class="btn-save" onclick="saveService('${key}')">
                        <i class="fas fa-save"></i> Salvar Alterações
                    </button>
                `;
                grid.appendChild(card);
            });
        }

        // Salvar serviço individual
        function saveService(key) {
            const saved = localStorage.getItem('pcformatech_services');
            const services = saved ? JSON.parse(saved) : defaultServices;
            
            services[key].name = document.getElementById(`${key}_name`).value;
            services[key].price = parseFloat(document.getElementById(`${key}_price`).value);
            services[key].description = document.getElementById(`${key}_description`).value;
            
            if (services[key].discount !== undefined) {
                services[key].discount = parseFloat(document.getElementById(`${key}_discount`).value);
            }

            localStorage.setItem('pcformatech_services', JSON.stringify(services));
            _syncToFirebase('services', services);
            
            showSuccess();
            populateServiceTypes(); // Atualizar opções de serviço
        }

        // ===== MODALS =====
        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        // Fechar modal ao clicar fora
        window.onclick = function(event) {
            if (event.target && event.target.classList && event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        }

        // ===== UTILITÁRIOS =====
        function showSuccess() {
            const msg = document.getElementById('successMessage');
            msg.style.display = 'block';
            setTimeout(() => {
                msg.style.display = 'none';
            }, 3000);
        }

        // Exportar dados para o site principal
        function getServiceData() {
            const saved = localStorage.getItem('pcformatech_services');
            return saved ? JSON.parse(saved) : defaultServices;
        }

        // Máscaras para inputs
        document.getElementById('clientPhone')?.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
                value = value.replace(/(\d)(\d{4})$/, '$1-$2');
            }
            e.target.value = value;
        });

        document.getElementById('clientCPF')?.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            }
            e.target.value = value;
        });
        
        // ===== GESTÃO DE PRODUTOS =====
        let products = [];
        let editingProductId = null;

        function loadProductsFromStorage() {
            const saved = localStorage.getItem('pcformatech_products');
            products = saved ? JSON.parse(saved) : [];
        }

        function saveProductsToStorage() {
            localStorage.setItem('pcformatech_products', JSON.stringify(products));
            _syncToFirebase('products', products);
        }

        function saveProduct() {
            const name = document.getElementById('productName').value.trim();
            const price = parseFloat(document.getElementById('productPrice').value);
            const stock = parseInt(document.getElementById('productStock').value) || 0;
            const category = document.getElementById('productCategory').value;
            const description = document.getElementById('productDescription').value.trim();

            if (!name || !price) {
                alert('Por favor, preencha nome e preço do produto!');
                return;
            }

            const product = {
                id: editingProductId || Date.now(),
                name,
                price,
                stock,
                category,
                description,
                createdAt: editingProductId ? products.find(p => p.id === editingProductId).createdAt : new Date().toISOString()
            };

            if (editingProductId) {
                const index = products.findIndex(p => p.id === editingProductId);
                products[index] = product;
                editingProductId = null;
            } else {
                products.push(product);
            }

            saveProductsToStorage();
            clearProductForm();
            loadProductsTable();
            showSuccess();
        }

        function clearProductForm() {
            document.getElementById('productForm').reset();
            editingProductId = null;
        }

        function loadProductsTable() {
            const tbody = document.getElementById('productsTableBody');
            tbody.innerHTML = '';

            const searchTerm = document.getElementById('searchProduct')?.value.toLowerCase() || '';
            
            // String(...) evita TypeError em produto sem nome ou sem categoria.
            const filteredProducts = products.filter(product =>
                String(product.name || '').toLowerCase().includes(searchTerm) ||
                String(product.category || '').toLowerCase().includes(searchTerm)
            );

            if (!filteredProducts.length) {
                renderTabelaVazia(tbody, {
                    buscando: !!searchTerm,
                    icone: 'box-open',
                    tituloVazio: 'Nenhum produto cadastrado',
                    textoVazio: 'Cadastre peças e produtos para usá-los nos orçamentos.',
                    tituloBusca: 'Nenhum produto encontrado',
                    textoBusca: 'Busque pelo nome do produto ou pela categoria.'
                });
                return;
            }

            filteredProducts.forEach(product => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${product.name}</strong><br><small style="color: #666;">${product.description || ''}</small></td>
                    <td>R$ ${product.price.toFixed(2).replace('.', ',')}</td>
                    <td><span class="service-status ${product.stock > 0 ? 'status-concluido' : 'status-cancelado'}">${product.stock} un</span></td>
                    <td>${getCategoryName(product.category)}</td>
                    <td>
                        <button class="btn-action btn-edit" onclick="editProduct(${product.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        function getCategoryName(category) {
            const categories = {
                hardware: 'Hardware',
                software: 'Software',
                perifericos: 'Periféricos',
                acessorios: 'Acessórios',
                outros: 'Outros'
            };
            return categories[category] || category;
        }

        const _buscarProdutos = debounce(() => loadProductsTable());
        function searchProducts() {
            _buscarProdutos();
        }

        function editProduct(productId) {
            const product = products.find(p => p.id === productId);
            if (!product) return;

            editingProductId = productId;
            document.getElementById('productName').value = product.name;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productStock').value = product.stock;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productDescription').value = product.description || '';

            document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
        }

        function deleteProduct(productId) {
            if (confirm('Tem certeza que deseja excluir este produto?')) {
                products = products.filter(p => p.id !== productId);
                saveProductsToStorage();
                loadProductsTable();
                showSuccess();
            }
        }

        // ===== ORÇAMENTO → SERVIÇO → LAUDO =====
        // Um atendimento segue sempre esta ordem e guarda um número só:
        //   1. Orçamento: em aberto até a validade; o cliente pode recusar.
        //   2. Serviço: "Converter em serviço" lança os itens no histórico do
        //      cliente, e o orçamento deixa de contar como em aberto.
        //   3. Laudo: emitido depois do serviço, com diagnóstico e solução.
        // O número é AAAA-NNNN (2026-0007), dado ao salvar e reiniciado a cada
        // ano. Até 10/2026 saía "0NaN-25" a partir do segundo orçamento (somava
        // 1 a um texto): esses ganham número novo, e o antigo fica em
        // numeroAntigo (a busca acha pelos dois). O PDF é de orcamento-pdf.js.
        let budgets = [];
        let currentBudget = null;
        let modoOrcamento = 'orcamento';     // o que a janela está editando: orçamento ou laudo
        let filtroOrcamentos = 'todos';
        let orcamentosDaNuvem = false;       // a arrumação só é gravada depois de ler o Firebase

        const NUMERO_ORCAMENTO = /^(\d{4})-(\d{4,})$/;
        const VALIDADE_PADRAO = 7;
        const GARANTIA_DIAS = 90;
        const PAGAMENTO_PADRAO = 'Pix, cartão ou dinheiro';
        const ETAPAS_ORCAMENTO = [['orcamento', 'Orçamento'], ['servico', 'Serviço'], ['laudo', 'Laudo']];
        const PDF_ORC = () => window.PCFTOrcamentoPDF;

        const escHtml = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        const reais = (v) => (PDF_ORC() ? PDF_ORC().moeda(v) : 'R$ ' + (Number(v) || 0).toFixed(2).replace('.', ','));
        const campoOrc = (id) => document.getElementById(id);

        function hojeISO() {
            const d = new Date();
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        }

        function somarDiasISO(iso, dias) {
            const d = new Date(String(iso || hojeISO()).slice(0, 10) + 'T12:00:00');
            d.setDate(d.getDate() + (Number(dias) || 0));
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        }

        const diasAte = (iso) => Math.round((Date.parse(iso + 'T12:00:00') - Date.parse(hojeISO() + 'T12:00:00')) / 864e5);
        const textoGarantia = (iso) => `3 meses (até ${formatDateBR(somarDiasISO(iso, GARANTIA_DIAS))})`;
        const garantiaPadrao = (t) => !String(t || '').trim() || /^3 meses/i.test(String(t).trim());

        function loadBudgetsFromStorage() {
            try { budgets = JSON.parse(localStorage.getItem('pcformatech_budgets') || '[]') || []; } catch (e) { budgets = []; }
        }

        function saveBudgetsToStorage() {
            localStorage.setItem('pcformatech_budgets', JSON.stringify(budgets));
            _syncToFirebase('budgets', budgets);
        }

        const clienteDoOrcamento = (b) => clients.find(c => c.id === b.clientId) || null;

        /** Próximo número do ano: 2026-0001, 2026-0002… */
        function proximoNumeroOrcamento(ano) {
            const maior = budgets.reduce((m, b) => {
                const r = NUMERO_ORCAMENTO.exec(String(b.number || ''));
                return r && Number(r[1]) === ano ? Math.max(m, Number(r[2])) : m;
            }, 0);
            return ano + '-' + String(maior + 1).padStart(4, '0');
        }

        /** Orçamento antigo que já tinha virado serviço (o histórico do cliente guarda a origem). */
        function foiConvertido(b) {
            const c = clienteDoOrcamento(b);
            const origem = `Convertido do ${b.type || 'orcamento'} Nº ${b.number}`;
            return Boolean(c && (c.services || []).some(s => s.orcamentoId === b.id
                || (String(s.description || '').startsWith(origem) && s.date === b.date)));
        }

        /** Dá etapa, situação e número certo aos orçamentos antigos. Devolve true se mudou algo. */
        function normalizarOrcamentos() {
            let mudou = false;
            const peso = (b) => Date.parse(b.createdAt || '') || Number(b.id) || 0;
            [...budgets].sort((a, b) => peso(a) - peso(b)).forEach((b) => {
                if (!b.etapa) {
                    if (b.type === 'laudo') { b.etapa = 'laudo'; b.laudoData = b.laudoData || b.date; }
                    else if (foiConvertido(b)) { b.etapa = 'servico'; b.convertidoEm = b.convertidoEm || b.date; }
                    else b.etapa = 'orcamento';
                    mudou = true;
                }
                if (b.etapa === 'orcamento' && !b.situacao) { b.situacao = 'aberto'; mudou = true; }
                if (!NUMERO_ORCAMENTO.test(String(b.number || ''))) {
                    if (b.number && !b.numeroAntigo) b.numeroAntigo = String(b.number);
                    b.number = proximoNumeroOrcamento(Number(String(b.date || '').slice(0, 4)) || new Date().getFullYear());
                    mudou = true;
                }
            });
            return mudou;
        }

        // Arrumação feita antes de ler a nuvem fica pendente até poder gravar.
        let orcamentosArrumar = false;
        function prepararOrcamentos() {
            if (normalizarOrcamentos()) orcamentosArrumar = true;
            if (orcamentosArrumar && orcamentosDaNuvem && budgets.length) { orcamentosArrumar = false; saveBudgetsToStorage(); }
        }

        /** Onde o atendimento está: em aberto, vencido, recusado, em serviço ou com laudo. */
        function situacaoOrcamento(b) {
            if (b.etapa === 'laudo') return { chave: 'laudo', texto: 'Laudo emitido', detalhe: b.laudoData ? formatDateBR(b.laudoData) : '' };
            if (b.etapa === 'servico') return { chave: 'servico', texto: 'Virou serviço', detalhe: b.convertidoEm ? formatDateBR(b.convertidoEm) : '' };
            if (b.situacao === 'recusado') return { chave: 'recusado', texto: 'Recusado', detalhe: '' };
            const dias = diasAte(somarDiasISO(b.date, b.validadeDias || VALIDADE_PADRAO));
            if (dias < 0) return { chave: 'vencido', texto: 'Vencido', detalhe: '' };
            return { chave: 'aberto', texto: 'Em aberto', detalhe: dias === 0 ? 'vence hoje' : dias === 1 ? 'vence amanhã' : `vence em ${dias} dias` };
        }

        function calculateBudgetTotal(budget) {
            if (PDF_ORC()) return PDF_ORC().totais(budget).total;
            const soma = (l) => (l || []).reduce((t, i) => t + (i.quantity || 1) * (i.price || 0), 0);
            return Math.max(0, soma(budget.services) + soma(budget.products) - (Number(budget.desconto) || 0));
        }

        // ── Lista ─────────────────────────────────────────────────────────

        function desenharResumoOrcamentos() {
            const caixa = campoOrc('orcResumo');
            if (!caixa) return;
            const mes = hojeISO().slice(0, 7);
            let abertos = 0, valorAberto = 0, vencendo = 0, convertidos = 0, decididos = 0, mesQtd = 0, mesValor = 0;
            budgets.forEach((b) => {
                const s = situacaoOrcamento(b);
                const total = calculateBudgetTotal(b);
                if (s.chave === 'aberto') {
                    abertos++;
                    valorAberto += total;
                    if (diasAte(somarDiasISO(b.date, b.validadeDias || VALIDADE_PADRAO)) <= 1) vencendo++;
                }
                if (s.chave === 'servico' || s.chave === 'laudo') {
                    convertidos++;
                    if (String(b.convertidoEm || b.laudoData || b.date || '').slice(0, 7) === mes) { mesQtd++; mesValor += total; }
                }
                if (s.chave !== 'aberto') decididos++;
            });
            const taxa = decididos ? Math.round((convertidos / decididos) * 100) + '%' : '—';
            caixa.innerHTML = `
                <div class="orc-kpi is-aberto"><span>Em aberto</span><strong>${abertos}</strong><small>${reais(valorAberto)}${vencendo ? ` · ${vencendo} vencendo` : ''}</small></div>
                <div class="orc-kpi is-servico"><span>Fechados no mês</span><strong>${mesQtd}</strong><small>${reais(mesValor)}</small></div>
                <div class="orc-kpi is-taxa"><span>Aprovação</span><strong>${taxa}</strong><small>${convertidos} de ${decididos} decididos</small></div>`;
        }

        function etapasHtml(b) {
            const atual = ETAPAS_ORCAMENTO.findIndex(([e]) => e === b.etapa);
            return `<ol class="orc-etapas" aria-label="Etapa do atendimento">${ETAPAS_ORCAMENTO.map(([, nome], i) =>
                `<li class="${i < atual ? 'is-feita' : i === atual ? 'is-atual' : ''}">${nome}</li>`).join('')}</ol>`;
        }

        function acoesOrcamentoHtml(b, s) {
            const botao = (acao, icone, texto, classe) => `<button type="button" class="orc-acao ${classe || ''}" data-acao="${acao}"${texto ? '' : ' aria-label="Excluir" title="Excluir"'}><i class="fas fa-${icone}" aria-hidden="true"></i>${texto ? ' ' + texto : ''}</button>`;
            const excluir = botao('excluir', 'trash-alt', '', 'is-perigo');
            if (b.etapa === 'laudo') {
                return botao('enviar-laudo', 'paper-plane', 'Enviar laudo', 'is-principal') + botao('pdf-laudo', 'file-pdf', 'PDF')
                    + botao('editar', 'pen', 'Editar laudo') + (b.convertidoEm ? botao('pdf-orcamento', 'file-invoice', 'Orçamento') : '') + excluir;
            }
            if (b.etapa === 'servico') {
                return botao('laudo', 'clipboard-check', 'Emitir laudo', 'is-principal') + botao('pdf-orcamento', 'file-pdf', 'PDF do orçamento') + excluir;
            }
            if (s.chave === 'recusado') return botao('reabrir', 'undo', 'Reabrir') + botao('pdf-orcamento', 'file-pdf', 'PDF') + excluir;
            return botao('enviar', 'paper-plane', 'Enviar', 'is-principal') + botao('converter', 'check-circle', 'Virou serviço', 'is-ok')
                + botao('editar', 'pen', 'Editar') + botao('pdf-orcamento', 'file-pdf', 'PDF')
                + (s.chave === 'vencido' ? botao('reabrir', 'redo', 'Renovar') : botao('recusar', 'times-circle', 'Recusou')) + excluir;
        }

        function loadBudgetsTable() {
            const lista = campoOrc('orcLista');
            if (!lista) return;
            prepararOrcamentos();
            desenharResumoOrcamentos();
            document.querySelectorAll('[data-orc-filtro]').forEach((b) => {
                b.classList.toggle('is-ativo', b.dataset.orcFiltro === filtroOrcamentos);
                b.setAttribute('aria-pressed', String(b.dataset.orcFiltro === filtroOrcamentos));
            });

            const termo = (campoOrc('searchBudget')?.value || '').trim().toLowerCase();
            const filtrados = budgets.filter((b) => {
                const s = situacaoOrcamento(b).chave;
                if (filtroOrcamentos === 'encerrados' ? !['recusado', 'vencido'].includes(s) : (filtroOrcamentos !== 'todos' && s !== filtroOrcamentos)) return false;
                if (!termo) return true;
                const c = clienteDoOrcamento(b);
                return [c && c.name, b.number, b.numeroAntigo, b.equipamento].some(v => String(v || '').toLowerCase().includes(termo));
            }).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.number).localeCompare(String(a.number)));

            if (!filtrados.length) {
                const buscando = Boolean(termo) || filtroOrcamentos !== 'todos';
                lista.innerHTML = `<div class="orc-vazio"><i class="fas fa-${buscando ? 'search' : 'file-invoice-dollar'}" aria-hidden="true"></i>
                    <strong>${buscando ? 'Nada encontrado' : 'Nenhum orçamento ainda'}</strong>
                    <span>${buscando ? 'Mude o filtro ou busque pelo nome do cliente ou pelo número.' : 'Toque em "Novo orçamento" para criar o primeiro.'}</span></div>`;
                return;
            }

            lista.innerHTML = filtrados.map((b) => {
                const c = clienteDoOrcamento(b);
                const s = situacaoOrcamento(b);
                const itens = [...(b.services || []), ...(b.products || [])].filter(i => i && i.name);
                const resumo = itens.length
                    ? escHtml(itens[0].name) + (itens.length > 1 ? ` <span class="orc-mais">+ ${itens.length - 1} ${itens.length === 2 ? 'item' : 'itens'}</span>` : '')
                    : '<span class="orc-mais">Sem itens</span>';
                const enviado = b.etapa === 'laudo' ? b.laudoEnviadoEm : b.enviadoEm;
                return `<article class="orc-card is-${s.chave}" data-id="${b.id}">
                    <div class="orc-card-topo">
                        <span class="orc-numero">Nº ${escHtml(b.number)}</span>
                        <span class="orc-chip">${s.texto}${s.detalhe ? ' · ' + s.detalhe : ''}</span>
                    </div>
                    <strong class="orc-cliente">${escHtml(c ? c.name : 'Cliente excluído')}</strong>
                    <p class="orc-resumo">${resumo}${b.equipamento ? `<small>${escHtml(b.equipamento)}</small>` : ''}</p>
                    <div class="orc-card-meio">
                        <span>${formatDateBR(b.date)}${enviado ? ` · <i class="fas fa-check-double" aria-hidden="true"></i> enviado ${formatDateBR(enviado)}` : ''}${b.numeroAntigo ? ` · antes ${escHtml(b.numeroAntigo)}` : ''}</span>
                        <strong class="orc-total">${reais(calculateBudgetTotal(b))}</strong>
                    </div>
                    ${etapasHtml(b)}
                    <div class="orc-acoes">${acoesOrcamentoHtml(b, s)}</div>
                </article>`;
            }).join('');
        }

        const _buscarOrcamentos = debounce(() => loadBudgetsTable());
        function searchBudgets() {
            _buscarOrcamentos();
        }

        function avisoOrcamentos(texto, erro, id) {
            const el = campoOrc(id || 'orcStatus');
            if (!el) return;
            el.textContent = texto || '';
            el.classList.toggle('is-erro', Boolean(erro));
            if (texto && !erro) setTimeout(() => { if (el.textContent === texto) el.textContent = ''; }, 5000);
        }

        // Ações dos cartões (um ouvinte só para a lista inteira).
        document.addEventListener('click', (e) => {
            const filtro = e.target.closest('[data-orc-filtro]');
            if (filtro) { filtroOrcamentos = filtro.dataset.orcFiltro; loadBudgetsTable(); return; }
            const botao = e.target.closest('#orcLista .orc-acao');
            if (!botao) return;
            const id = Number(botao.closest('.orc-card').dataset.id);
            const b = budgets.find(x => x.id === id);
            if (!b) return;
            const acoes = {
                'enviar': () => enviarOrcamento(b, 'orcamento', botao),
                'enviar-laudo': () => enviarOrcamento(b, 'laudo', botao),
                'pdf-orcamento': () => abrirPdfOrcamento(b, 'orcamento', botao),
                'pdf-laudo': () => abrirPdfOrcamento(b, 'laudo', botao),
                'editar': () => editBudget(b.id),
                'laudo': () => emitirLaudo(b.id),
                'converter': () => convertBudgetToService(b.id),
                'recusar': () => mudarSituacaoOrcamento(b, 'recusado'),
                'reabrir': () => mudarSituacaoOrcamento(b, 'aberto'),
                'excluir': () => deleteBudget(b.id)
            };
            if (acoes[botao.dataset.acao]) acoes[botao.dataset.acao]();
        });

        function mudarSituacaoOrcamento(b, situacao) {
            b.situacao = situacao;
            if (situacao === 'recusado') b.recusadoEm = hojeISO();
            if (situacao === 'aberto') {
                // Reabrir um orçamento vencido dá mais uma validade inteira a partir de hoje.
                const passou = -diasAte(somarDiasISO(b.date, b.validadeDias || VALIDADE_PADRAO));
                if (passou > 0) b.validadeDias = (b.validadeDias || VALIDADE_PADRAO) + passou + VALIDADE_PADRAO;
                delete b.recusadoEm;
            }
            b.updatedAt = new Date().toISOString();
            saveBudgetsToStorage();
            loadBudgetsTable();
            avisoOrcamentos(situacao === 'recusado' ? `Orçamento Nº ${b.number} marcado como recusado.` : `Orçamento Nº ${b.number} em aberto de novo, válido até ${formatDateBR(somarDiasISO(b.date, b.validadeDias))}.`);
        }

        // ── Janela de edição ──────────────────────────────────────────────

        function servicosConhecidos() {
            let mapa = defaultServices;
            try { mapa = JSON.parse(localStorage.getItem('pcformatech_services') || 'null') || defaultServices; } catch (e) { /* padrão */ }
            return Object.keys(mapa).filter(k => k !== 'remoto' && mapa[k] && mapa[k].name)
                .map(k => ({ nome: mapa[k].name, preco: Number(mapa[k].price) || 0 }));
        }

        const produtosConhecidos = () => (products || []).filter(p => p && p.name).map(p => ({ nome: p.name, preco: Number(p.price) || 0 }));

        function preencherSugestoes() {
            const lista = (id, itens) => {
                const dl = campoOrc(id);
                if (dl) dl.innerHTML = itens.map(i => `<option value="${escHtml(i.nome)}">${reais(i.preco)}</option>`).join('');
            };
            lista('orcSugestoesServico', servicosConhecidos());
            lista('orcSugestoesProduto', produtosConhecidos());
            const rapidos = campoOrc('orcRapidos');
            if (rapidos) {
                rapidos.innerHTML = servicosConhecidos().slice(0, 6).map(s =>
                    `<button type="button" class="orc-rapido" data-nome="${escHtml(s.nome)}" data-preco="${s.preco}">${escHtml(s.nome.replace(/ de (Computadores?|Dados)$/i, ''))} <b>${reais(s.preco)}</b></button>`).join('');
            }
        }

        function linhaItemOrcamento(tipo, item) {
            const i = item || {};
            const div = document.createElement('div');
            div.className = 'orc-item';
            div.dataset.tipo = tipo;
            div.dataset.auto = i.price ? '0' : '1';
            div.innerHTML = `
                <span class="orc-item-tipo">${tipo === 'produto' ? 'Produto' : 'Serviço'}</span>
                <input type="text" class="orc-item-nome" list="${tipo === 'produto' ? 'orcSugestoesProduto' : 'orcSugestoesServico'}" placeholder="${tipo === 'produto' ? 'Produto (escolha ou digite)' : 'Serviço (escolha ou digite)'}" value="${escHtml(i.name || '')}" aria-label="Descrição">
                <label class="orc-item-qtd"><span>Qtd</span><input type="number" min="1" step="1" inputmode="numeric" value="${Number(i.quantity) || 1}"></label>
                <label class="orc-item-preco"><span>Valor (R$)</span><input type="number" min="0" step="0.01" inputmode="decimal" value="${i.price != null && i.price !== '' ? Number(i.price).toFixed(2) : ''}" placeholder="0,00"></label>
                <strong class="orc-item-total">R$ 0,00</strong>
                <button type="button" class="orc-item-remover" aria-label="Remover item" title="Remover"><i class="fas fa-times" aria-hidden="true"></i></button>`;
            campoOrc('orcItens').appendChild(div);
            return div;
        }

        function addServiceToBudget(nome, preco) {
            const linha = linhaItemOrcamento('servico', nome ? { name: nome, price: preco } : null);
            atualizarTotaisOrcamento();
            if (!nome) linha.querySelector('.orc-item-nome').focus();
        }

        function addProductToBudget() {
            linhaItemOrcamento('produto').querySelector('.orc-item-nome').focus();
            atualizarTotaisOrcamento();
        }

        function lerItensOrcamento() {
            const servicos = [], produtosItens = [];
            document.querySelectorAll('#orcItens .orc-item').forEach((div) => {
                const nome = div.querySelector('.orc-item-nome').value.trim();
                if (!nome) return;
                const [qtd, preco] = div.querySelectorAll('input[type="number"]');
                const item = { name: nome, quantity: Math.max(1, parseFloat(qtd.value) || 1), unit: 'un', price: Math.max(0, parseFloat(preco.value) || 0) };
                (div.dataset.tipo === 'produto' ? produtosItens : servicos).push(item);
            });
            return { services: servicos, products: produtosItens };
        }

        function atualizarTotaisOrcamento() {
            document.querySelectorAll('#orcItens .orc-item').forEach((div) => {
                const [qtd, preco] = div.querySelectorAll('input[type="number"]');
                div.querySelector('.orc-item-total').textContent = reais((parseFloat(qtd.value) || 0) * (parseFloat(preco.value) || 0));
            });
            const parcial = { ...lerItensOrcamento(), desconto: parseFloat(campoOrc('budgetDesconto').value) || 0 };
            const t = PDF_ORC() ? PDF_ORC().totais(parcial) : { subtotal: 0, desconto: 0, total: 0 };
            campoOrc('orcSubtotal').textContent = reais(t.subtotal);
            campoOrc('orcDescontoValor').textContent = t.desconto ? '- ' + reais(t.desconto) : reais(0);
            campoOrc('budgetTotal').textContent = reais(t.total);
            const extenso = PDF_ORC() ? PDF_ORC().extenso(t.total) : '';
            campoOrc('orcExtenso').textContent = extenso ? extenso.charAt(0).toUpperCase() + extenso.slice(1) : '';
            campoOrc('orcItensVazio').hidden = Boolean(document.querySelector('#orcItens .orc-item'));
        }
        const updateBudgetTotal = atualizarTotaisOrcamento;

        // Digitar ou escolher um serviço conhecido já põe o preço (até a pessoa mudar o valor).
        document.addEventListener('input', (e) => {
            const div = e.target.closest && e.target.closest('#orcItens .orc-item');
            if (div) {
                if (e.target.classList.contains('orc-item-nome')) {
                    const conhecido = (div.dataset.tipo === 'produto' ? produtosConhecidos() : servicosConhecidos())
                        .find(i => i.nome.toLowerCase() === e.target.value.trim().toLowerCase());
                    const preco = div.querySelectorAll('input[type="number"]')[1];
                    if (conhecido && (div.dataset.auto === '1' || !preco.value)) { preco.value = conhecido.preco.toFixed(2); div.dataset.auto = '1'; }
                } else if (e.target === div.querySelectorAll('input[type="number"]')[1]) {
                    div.dataset.auto = '0';
                }
                atualizarTotaisOrcamento();
                return;
            }
            if (e.target.id === 'budgetDesconto') atualizarTotaisOrcamento();
            if (e.target.id === 'budgetDate' || e.target.id === 'budgetLaudoData') {
                const base = modoOrcamento === 'laudo' ? campoOrc('budgetLaudoData').value : campoOrc('budgetDate').value;
                if (base && garantiaPadrao(campoOrc('budgetWarranty').value)) campoOrc('budgetWarranty').value = textoGarantia(base);
                desenharFaixaOrcamento();
            }
            if (e.target.id === 'budgetValidade') desenharFaixaOrcamento();
        });

        document.addEventListener('click', (e) => {
            const rapido = e.target.closest('#orcRapidos .orc-rapido');
            if (rapido) { addServiceToBudget(rapido.dataset.nome, Number(rapido.dataset.preco)); return; }
            const remover = e.target.closest('#orcItens .orc-item-remover');
            if (remover) { remover.closest('.orc-item').remove(); atualizarTotaisOrcamento(); }
        });

        function populateClientSelect() {
            const select = campoOrc('budgetClientId');
            const ordenados = [...clients].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR'));
            select.innerHTML = '<option value="">Escolha o cliente…</option>' + ordenados.map(c =>
                `<option value="${c.id}">${escHtml(c.name)}${c.phone ? ' · ' + escHtml(c.phone) : ''}</option>`).join('');
        }

        function desenharFaixaOrcamento() {
            const faixa = campoOrc('orcFaixa');
            if (!faixa || !currentBudget) return;
            const ano = Number(String(campoOrc('budgetDate').value || hojeISO()).slice(0, 4));
            const numero = currentBudget.number || proximoNumeroOrcamento(ano);
            const etapa = modoOrcamento === 'laudo' ? 'laudo' : (currentBudget.etapa || 'orcamento');
            let detalhe = '';
            if (modoOrcamento === 'orcamento') {
                const vence = somarDiasISO(campoOrc('budgetDate').value || hojeISO(), parseInt(campoOrc('budgetValidade').value) || VALIDADE_PADRAO);
                detalhe = `Válido até ${formatDateBR(vence)}`;
            } else {
                detalhe = 'Depois do serviço: diagnóstico, solução e garantia';
            }
            faixa.innerHTML = `
                <div class="orc-faixa-num"><span>${modoOrcamento === 'laudo' ? 'Laudo técnico' : 'Orçamento'}</span>
                    <strong>Nº ${escHtml(numero)}</strong>${currentBudget.number ? '' : '<small>número dado ao salvar</small>'}</div>
                <div class="orc-faixa-info">${etapasHtml({ etapa })}<small>${detalhe}</small></div>`;
        }

        function abrirJanelaOrcamento(modo) {
            modoOrcamento = modo;
            const b = currentBudget;
            const laudo = modo === 'laudo';
            preencherSugestoes();
            populateClientSelect();
            campoOrc('budgetModalTitle').innerHTML = laudo
                ? `<i class="fas fa-clipboard-check"></i> ${b.etapa === 'laudo' ? 'Editar laudo técnico' : 'Emitir laudo técnico'}`
                : `<i class="fas fa-file-invoice-dollar"></i> ${b.id ? 'Editar orçamento' : 'Novo orçamento'}`;
            campoOrc('budgetClientId').value = b.clientId || '';
            campoOrc('budgetDate').value = b.date || hojeISO();
            // Validade fora da lista (um orçamento renovado, por exemplo) ganha a sua opção.
            const validade = campoOrc('budgetValidade');
            const dias = String(b.validadeDias || VALIDADE_PADRAO);
            validade.querySelectorAll('option[data-extra]').forEach(o => o.remove());
            if (![...validade.options].some(o => o.value === dias)) validade.insertAdjacentHTML('beforeend', `<option value="${dias}" data-extra>${dias} dias</option>`);
            validade.value = dias;
            campoOrc('budgetLaudoData').value = b.laudoData || hojeISO();
            campoOrc('budgetEquipamento').value = b.equipamento || '';
            campoOrc('budgetDefect').value = b.defect || '';
            campoOrc('budgetReport').value = b.report || '';
            campoOrc('budgetSolution').value = b.solution || '';
            campoOrc('budgetObservations').value = b.observations || '';
            campoOrc('budgetDesconto').value = b.desconto ? Number(b.desconto).toFixed(2) : '';
            campoOrc('budgetPagamento').value = b.pagamento || PAGAMENTO_PADRAO;
            campoOrc('budgetPix').checked = b.pix !== false;
            const baseGarantia = laudo ? campoOrc('budgetLaudoData').value : campoOrc('budgetDate').value;
            campoOrc('budgetWarranty').value = garantiaPadrao(b.warranty) ? textoGarantia(baseGarantia) : b.warranty;

            campoOrc('orcValidadeCampo').hidden = laudo;
            campoOrc('orcLaudoDataCampo').hidden = !laudo;
            campoOrc('orcLaudoSecao').hidden = !laudo;
            campoOrc('orcDefeitoRotulo').textContent = laudo ? 'Defeito relatado pelo cliente' : 'Problema relatado pelo cliente';
            campoOrc('budgetSaveButton').innerHTML = `<i class="fas fa-save"></i> ${laudo ? 'Salvar laudo' : 'Salvar orçamento'}`;
            campoOrc('orcEnviarBtn').innerHTML = `<i class="fab fa-whatsapp"></i> ${laudo ? 'Enviar laudo' : 'Enviar ao cliente'}`;

            campoOrc('orcItens').innerHTML = '';
            (b.services || []).forEach(s => linhaItemOrcamento('servico', s));
            (b.products || []).forEach(p => linhaItemOrcamento('produto', p));
            avisoOrcamentos('', false, 'orcModalStatus');
            desenharFaixaOrcamento();
            atualizarTotaisOrcamento();
            campoOrc('budgetModal').style.display = 'block';
            const conteudo = campoOrc('budgetModal').querySelector('.modal-content');
            if (conteudo) conteudo.scrollTop = 0;
        }

        function openNewBudgetModal() {
            const hoje = hojeISO();
            currentBudget = {
                id: null, number: null, etapa: 'orcamento', situacao: 'aberto', type: 'orcamento',
                clientId: null, date: hoje, validadeDias: VALIDADE_PADRAO,
                services: [], products: [], desconto: 0, pagamento: PAGAMENTO_PADRAO, pix: true,
                equipamento: '', defect: '', report: '', solution: '', observations: '',
                warranty: textoGarantia(hoje)
            };
            abrirJanelaOrcamento('orcamento');
        }

        function editBudget(budgetId) {
            const budget = budgets.find(b => b.id === budgetId);
            if (!budget) { alert('Orçamento não encontrado.'); return; }
            currentBudget = JSON.parse(JSON.stringify(budget));
            abrirJanelaOrcamento(budget.etapa === 'laudo' ? 'laudo' : 'orcamento');
        }

        function viewBudget(budgetId) {
            editBudget(budgetId);
        }

        /** Etapa 3: depois do serviço, o laudo com diagnóstico, solução e garantia. */
        function emitirLaudo(budgetId) {
            const budget = budgets.find(b => b.id === budgetId);
            if (!budget) return;
            currentBudget = JSON.parse(JSON.stringify(budget));
            if (!currentBudget.laudoData) currentBudget.laudoData = hojeISO();
            if (!currentBudget.solution) currentBudget.solution = lerResumoItens(currentBudget);
            abrirJanelaOrcamento('laudo');
            setTimeout(() => campoOrc('budgetReport').focus(), 50);
        }

        const lerResumoItens = (b) => [...(b.services || []), ...(b.products || [])].filter(i => i && i.name).map(i => i.name).join(', ');

        function lerFormularioOrcamento() {
            const b = { ...currentBudget, ...lerItensOrcamento() };
            b.clientId = parseInt(campoOrc('budgetClientId').value) || null;
            b.date = campoOrc('budgetDate').value || hojeISO();
            b.validadeDias = parseInt(campoOrc('budgetValidade').value) || VALIDADE_PADRAO;
            b.equipamento = campoOrc('budgetEquipamento').value.trim();
            b.defect = campoOrc('budgetDefect').value.trim();
            b.report = campoOrc('budgetReport').value.trim();
            b.solution = campoOrc('budgetSolution').value.trim();
            b.observations = campoOrc('budgetObservations').value.trim();
            b.warranty = campoOrc('budgetWarranty').value.trim();
            b.pagamento = campoOrc('budgetPagamento').value.trim() || PAGAMENTO_PADRAO;
            b.desconto = Math.max(0, parseFloat(campoOrc('budgetDesconto').value) || 0);
            b.pix = campoOrc('budgetPix').checked;
            if (modoOrcamento === 'laudo') b.laudoData = campoOrc('budgetLaudoData').value || hojeISO();
            return b;
        }

        /** Salva o que está na janela. Devolve o orçamento salvo, ou null se falta algo. */
        function saveBudget() {
            const b = lerFormularioOrcamento();
            if (!b.clientId) {
                avisoOrcamentos('Escolha o cliente.', true, 'orcModalStatus');
                campoOrc('budgetClientId').focus();
                return null;
            }
            if (modoOrcamento === 'orcamento' && !b.services.length && !b.products.length) {
                avisoOrcamentos('Coloque pelo menos um item no orçamento.', true, 'orcModalStatus');
                return null;
            }
            if (b.desconto > 0 && PDF_ORC() && PDF_ORC().totais({ ...b, desconto: 0 }).subtotal < b.desconto) {
                avisoOrcamentos('O desconto é maior que o subtotal.', true, 'orcModalStatus');
                campoOrc('budgetDesconto').focus();
                return null;
            }
            const novo = !b.id;
            if (novo) {
                b.id = Date.now();
                b.createdAt = new Date().toISOString();
            }
            if (!b.number) b.number = proximoNumeroOrcamento(Number(b.date.slice(0, 4)) || new Date().getFullYear());
            if (modoOrcamento === 'laudo') { b.etapa = 'laudo'; b.type = 'laudo'; }
            else { b.etapa = b.etapa || 'orcamento'; b.type = 'orcamento'; if (b.etapa === 'orcamento' && !b.situacao) b.situacao = 'aberto'; }
            b.updatedAt = new Date().toISOString();

            const i = budgets.findIndex(x => x.id === b.id);
            if (i >= 0) budgets[i] = b; else budgets.push(b);
            currentBudget = JSON.parse(JSON.stringify(b));
            saveBudgetsToStorage();
            loadBudgetsTable();
            desenharFaixaOrcamento();
            return b;
        }

        function salvarEFechar() {
            const b = saveBudget();
            if (!b) return;
            closeModal('budgetModal');
            avisoOrcamentos(`${modoOrcamento === 'laudo' ? 'Laudo' : 'Orçamento'} Nº ${b.number} salvo.`);
        }

        // ── PDF e envio ───────────────────────────────────────────────────

        async function comBotaoOcupado(botao, texto, tarefa) {
            const antes = botao ? botao.innerHTML : '';
            if (botao) { botao.disabled = true; botao.innerHTML = `<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> ${texto}`; }
            try { return await tarefa(); }
            finally { if (botao) { botao.disabled = false; botao.innerHTML = antes; } }
        }

        async function abrirPdfOrcamento(b, tipo, botao) {
            const c = clienteDoOrcamento(b);
            if (!c) { alert('O cliente deste orçamento não foi encontrado.'); return; }
            try {
                await comBotaoOcupado(botao, 'Gerando…', async () => {
                    const doc = await PDF_ORC().gerar(b, c, { tipo });
                    const nome = PDF_ORC().nomeArquivo(b, c, tipo);
                    // Computador abre o PDF numa aba; celular (sem leitor de PDF) baixa.
                    if (navigator.pdfViewerEnabled) {
                        const aba = window.open(doc.output('bloburl'), '_blank');
                        if (!aba) doc.save(nome);
                    } else {
                        doc.save(nome);
                    }
                });
            } catch (e) {
                alert('Não foi possível gerar o PDF: ' + (e && e.message ? e.message : e));
            }
        }

        const numeroWhatsCliente = (fone) => {
            const d = String(fone || '').replace(/\D/g, '');
            if (d.length === 10 || d.length === 11) return '55' + d;
            if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d;
            return '';
        };

        function mensagemEnvio(b, c, tipo) {
            const nome = String(c.name || '').trim().split(/\s+/)[0];
            const ola = `Olá${nome ? ', ' + nome : ''}!`;
            if (tipo === 'laudo') {
                return `${ola} Segue o laudo técnico Nº ${b.number} do seu atendimento na PC Formatech, com o diagnóstico, o que foi feito e a garantia. Qualquer dúvida, é só chamar.`;
            }
            const vence = formatDateBR(somarDiasISO(b.date, b.validadeDias || VALIDADE_PADRAO));
            return `${ola} Segue o orçamento Nº ${b.number} da PC Formatech: ${reais(calculateBudgetTotal(b))}, válido até ${vence}. Para aprovar, é só responder esta mensagem.`;
        }

        async function enviarOrcamento(b, tipo, botao) {
            const c = clienteDoOrcamento(b);
            if (!c) { alert('O cliente deste orçamento não foi encontrado.'); return; }
            try {
                await comBotaoOcupado(botao, 'Preparando…', async () => {
                    const doc = await PDF_ORC().gerar(b, c, { tipo });
                    const nome = PDF_ORC().nomeArquivo(b, c, tipo);
                    const texto = mensagemEnvio(b, c, tipo);
                    const arquivo = new File([doc.output('blob')], nome, { type: 'application/pdf' });
                    if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
                        try {
                            await navigator.share({ files: [arquivo], text: texto, title: nome.replace(/\.pdf$/, '') });
                            marcarEnviado(b, tipo);
                            return;
                        } catch (erro) {
                            if (erro && erro.name === 'AbortError') return;
                            if (erro && erro.name === 'NotAllowedError') {
                                avisoOrcamentos('O PDF ficou pronto. Toque de novo em Enviar.', false, campoOrc('budgetModal').style.display === 'block' ? 'orcModalStatus' : 'orcStatus');
                                return;
                            }
                        }
                    }
                    // Sem o menu de compartilhar (computador): baixa o PDF e abre a
                    // conversa do cliente com a mensagem, para anexar o arquivo.
                    doc.save(nome);
                    const fone = numeroWhatsCliente(c.phone);
                    window.open(`https://api.whatsapp.com/send?${fone ? 'phone=' + fone + '&' : ''}text=${encodeURIComponent(texto)}`, '_blank');
                    marcarEnviado(b, tipo);
                    avisoOrcamentos(`O PDF foi baixado. Anexe ${tipo === 'laudo' ? 'o laudo' : 'o orçamento'} na conversa que abriu.`);
                });
            } catch (e) {
                alert('Não foi possível enviar: ' + (e && e.message ? e.message : e));
            }
        }

        function marcarEnviado(b, tipo) {
            const alvo = budgets.find(x => x.id === b.id);
            if (!alvo) return;
            alvo[tipo === 'laudo' ? 'laudoEnviadoEm' : 'enviadoEm'] = hojeISO();
            saveBudgetsToStorage();
            loadBudgetsTable();
        }

        // Botões da janela: salvar, PDF e enviar (os dois últimos salvam antes).
        document.addEventListener('click', (e) => {
            if (e.target.closest('#budgetSaveButton')) { salvarEFechar(); return; }
            const pdf = e.target.closest('#orcPdfBtn');
            if (pdf) { const b = saveBudget(); if (b) abrirPdfOrcamento(b, modoOrcamento, pdf); return; }
            const enviar = e.target.closest('#orcEnviarBtn');
            if (enviar) { const b = saveBudget(); if (b) enviarOrcamento(b, modoOrcamento, enviar); }
        });

        function generatePDF() {
            const b = saveBudget();
            if (b) abrirPdfOrcamento(b, modoOrcamento, null);
        }

        function generatePDFForBudget(budgetId) {
            const b = budgets.find(x => x.id === budgetId);
            if (b) abrirPdfOrcamento(b, b.etapa === 'laudo' ? 'laudo' : 'orcamento', null);
        }

        // ── Etapa 2: virou serviço ────────────────────────────────────────

        function convertBudgetToService(budgetId) {
            const budget = budgets.find(b => b.id === budgetId);
            if (!budget) { alert('Orçamento não encontrado.'); return; }
            if (budget.etapa !== 'orcamento') { alert(`O orçamento Nº ${budget.number} já virou serviço em ${formatDateBR(budget.convertidoEm || budget.date)}.`); return; }
            const client = clienteDoOrcamento(budget);
            if (!client) { alert('O cliente deste orçamento não foi encontrado.'); return; }
            const itens = [...(budget.services || []), ...(budget.products || [])].filter(i => i && i.name);
            const total = calculateBudgetTotal(budget);
            if (!confirm(`O cliente ${client.name} aprovou o orçamento Nº ${budget.number} (${reais(total)})?\n\nOs ${itens.length} item(ns) vão para o histórico do cliente e o orçamento sai de "em aberto". Depois do serviço, emita o laudo.`)) return;

            if (!client.services) client.services = [];
            const hoje = hojeISO();
            // O desconto entra proporcional em cada item, para o histórico somar o total certo.
            const subtotal = itens.reduce((t, i) => t + (i.quantity || 1) * (i.price || 0), 0);
            const fator = subtotal > 0 ? total / subtotal : 1;
            const produtos = new Set(budget.products || []);
            itens.forEach((item) => {
                const produto = produtos.has(item);
                client.services.push({
                    type: produto ? `Produto: ${item.name}` : item.name,
                    description: `Do orçamento Nº ${budget.number}${budget.equipamento ? ' · ' + budget.equipamento : ''}${budget.defect ? ' · ' + budget.defect : ''}`,
                    price: Math.round((item.quantity || 1) * (item.price || 0) * fator * 100) / 100,
                    status: 'concluido',
                    date: hoje,
                    orcamentoId: budget.id
                });
            });
            budget.etapa = 'servico';
            budget.situacao = 'aprovado';
            budget.convertidoEm = hoje;
            budget.updatedAt = new Date().toISOString();

            saveClientsToStorage();
            saveBudgetsToStorage();
            if (typeof updateDashboard === 'function') updateDashboard();
            loadBudgetsTable();
            avisoOrcamentos(`Orçamento Nº ${budget.number} virou serviço. Quando terminar, toque em "Emitir laudo".`);
        }

        function deleteBudget(budgetId) {
            const b = budgets.find(x => x.id === budgetId);
            if (!b) return;
            const c = clienteDoOrcamento(b);
            const nome = b.etapa === 'laudo' ? 'laudo' : 'orçamento';
            const extra = b.etapa === 'orcamento' ? '' : '\n\nOs serviços já lançados no histórico do cliente continuam lá.';
            if (!confirm(`Excluir o ${nome} Nº ${b.number}${c ? ' de ' + c.name : ''}?${extra}\n\nEsta ação não pode ser desfeita.`)) return;
            budgets = budgets.filter(x => x.id !== budgetId);
            saveBudgetsToStorage();
            loadBudgetsTable();
            avisoOrcamentos(`${nome.charAt(0).toUpperCase() + nome.slice(1)} Nº ${b.number} excluído.`);
        }

        // Inicialização de produtos e orçamentos (incorporada no DOMContentLoaded principal acima)
        document.addEventListener('DOMContentLoaded', () => {
            loadProductsFromStorage();
            loadBudgetsFromStorage();
        });

        // ===== GESTÃO DE IMAGENS DO SLIDER =====
        
        // Slides padrão
        const defaultSlides = [
            { url: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=90&w=2400', alt: 'Laptop em Manutenção' },
            { url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=90&w=2400', alt: 'Workspace com Laptop' },
            { url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=90&w=2400', alt: 'Programação e Desenvolvimento' },
            { url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=90&w=2400', alt: 'Computador Profissional' },
            { url: 'https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&q=90&w=2400', alt: 'Laptop em Ambiente Profissional' },
            { url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=90&w=2400', alt: 'Setup Moderno de Programação' },
            { url: 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&q=90&w=2400', alt: 'Hardware e Componentes' },
            { url: 'https://images.unsplash.com/photo-1484788984921-03950022c9ef?auto=format&fit=crop&q=90&w=2400', alt: 'MacBook Pro Workspace' },
            { url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=90&w=2400', alt: 'Tech Workspace Minimalista' },
            { url: 'https://images.unsplash.com/photo-1537498425277-c283d32ef9db?auto=format&fit=crop&q=90&w=2400', alt: 'Gaming PC Setup' },
            { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=90&w=2400', alt: 'Setup Clean com Teclado Retroiluminado' },
            { url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=90&w=2400', alt: 'Mesa com Múltiplos Monitores' },
            { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=90&w=2400', alt: 'Setup de Programação com Luzes LED' },
            { url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=90&w=2400', alt: 'Estação de Trabalho Minimalista' },
            { url: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&q=90&w=2400', alt: 'Espaço de Trabalho com Luz e Monitores' },
            { url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=90&w=2400', alt: 'Interior de PC com Componentes Visíveis' },
            { url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&q=90&w=2400', alt: 'Setup Gamer RGB Aesthetic' },
            { url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=90&w=2400', alt: 'Setup Gamer com Iluminação RGB' },
            { url: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?auto=format&fit=crop&q=90&w=2400', alt: 'Setup Aesthetic com Monitor Ultrawide' },
        ];

        function loadHeroSlides() {
            // Inicializar Firebase apenas se ainda não foi feito
            const firebaseDb = getFirebaseDB();
            if (!firebaseDb) {
                console.warn('Firebase não disponível, usando localStorage');
                const saved = localStorage.getItem('pcformatech_hero_slides');
                heroSlides = saved ? JSON.parse(saved) : defaultSlides;
                renderSlides();
                return;
            }

            // Carregar do Firestore em tempo real
            if (firebaseDb) {
                firebaseDb.collection('slider')
                    .doc('images')
                    .onSnapshot((doc) => {
                        if (doc.exists) {
                            heroSlides = doc.data().slides || defaultSlides;
                            // Migração automática: se Firebase tem menos slides que o padrão, atualiza
                            if (heroSlides.length < defaultSlides.length) {
                                heroSlides = defaultSlides;
                                saveHeroSlides();
                            }
                        } else {
                            heroSlides = defaultSlides;
                        }
                        renderSlides();
                    }, (error) => {
                        console.error('Erro ao carregar imagens:', error);
                        const saved = localStorage.getItem('pcformatech_hero_slides');
                        heroSlides = saved ? JSON.parse(saved) : defaultSlides;
                        renderSlides();
                    });
            } else {
                const saved = localStorage.getItem('pcformatech_hero_slides');
                heroSlides = saved ? JSON.parse(saved) : defaultSlides;
                renderSlides();
            }
        }

        async function saveHeroSlides() {
            // Salvar também no localStorage como backup
            localStorage.setItem('pcformatech_hero_slides', JSON.stringify(heroSlides));
            
            // Salvar no Firebase se disponível
            const firebaseDb = getFirebaseDB();
            if (!firebaseDb) {
                console.warn('Firebase não disponível, salvo apenas localmente');
                return;
            }

            try {
                await firebaseDb.collection('slider').doc('images').set({
                    slides: heroSlides,
                    updatedAt: new Date()
                });
                console.log('✅ Imagens sincronizadas na nuvem');
            } catch (error) {
                console.error('Erro ao salvar no Firebase:', error);
                alert('Erro ao sincronizar imagens. Salvo localmente.');
            }
        }

        async function uploadImageToFirebase(base64Data, fileName) {
            // Imagens são armazenadas como Base64 no Firestore (sem CORS, funciona em qualquer dispositivo)
            // Firebase Storage foi desativado por exigir configuração de CORS e regras de autenticação
            console.log('Imagem processada e pronta para salvar no Firestore:', fileName);
            return base64Data;
        }

        function renderSlides() {
            const container = document.getElementById('slidesContainer');
            if (!container) return; // Painel ainda não visível
            container.innerHTML = '';

            heroSlides.forEach((slide, index) => {
                const card = document.createElement('div');
                card.className = 'slide-card';
                card.innerHTML = `
                    <img src="${slide.url}" alt="${slide.alt}" class="slide-preview" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22800%22 height%3D%22400%22%3E%3Crect width%3D%22100%25%22 height%3D%22100%25%22 fill%3D%22%23333%22%2F%3E%3Ctext x%3D%2250%25%22 y%3D%2250%25%22 dominant-baseline%3D%22middle%22 text-anchor%3D%22middle%22 fill%3D%22%23aaa%22 font-size%3D%2220%22 font-family%3D%22sans-serif%22%3EImagem+Indispon%C3%ADvel%3C%2Ftext%3E%3C%2Fsvg%3E'">
                    <div class="slide-info">
                        <div class="slide-order">
                            <span>Imagem ${index + 1}</span>
                        </div>
                        <p style="font-size: 12px; color: #666; word-break: break-all; margin: 10px 0;">${slide.alt}</p>
                        <div class="slide-actions">
                            <button class="btn-update" onclick="openSlideModal(${index})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn-remove" onclick="removeSlide(${index})">
                                <i class="fas fa-trash"></i> Remover
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function addNewSlide() {
            openSlideModal();
        }

        function openSlideModal(index = null) {
            const modal = document.getElementById('slideModal');
            const form = document.getElementById('slideForm');
            const urlInput = document.getElementById('slideUrl');
            const altInput = document.getElementById('slideAlt');
            const indexInput = document.getElementById('slideIndex');
            const titleSpan = document.getElementById('slideModalTitle');
            const buttonText = document.getElementById('slideModalButtonText');
            
            form.reset();
            
            if (index !== null) {
                // Modo editar
                const slide = heroSlides[index];
                urlInput.value = slide.url;
                altInput.value = slide.alt;
                indexInput.value = index;
                titleSpan.textContent = 'Editar Imagem';
                buttonText.textContent = 'Salvar Alterações';
                updateSlidePreview();
            } else {
                // Modo adicionar
                indexInput.value = '';
                titleSpan.textContent = 'Adicionar Nova Imagem';
                buttonText.textContent = 'Adicionar';
                document.getElementById('slidePreview').style.display = 'none';
            }
            
            modal.style.display = 'block';
        }

        function closeSlideModal() {
            const modal = document.getElementById('slideModal');
            modal.style.display = 'none';
            document.getElementById('slideForm').reset();
            document.getElementById('slidePreview').style.display = 'none';
        }

        function updateSlidePreview() {
            const url = document.getElementById('slideUrl').value;
            const preview = document.getElementById('slidePreview');
            
            if (url) {
                preview.src = url;
                preview.style.display = 'block';
                preview.onerror = function() {
                    this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22800%22 height%3D%22400%22%3E%3Crect width%3D%22100%25%22 height%3D%22100%25%22 fill%3D%22%23333%22%2F%3E%3Ctext x%3D%2250%25%22 y%3D%2250%25%22 dominant-baseline%3D%22middle%22 text-anchor%3D%22middle%22 fill%3D%22%23aaa%22 font-size%3D%2220%22 font-family%3D%22sans-serif%22%3EURL+Inv%C3%A1lida%3C%2Ftext%3E%3C%2Fsvg%3E';
                };
            } else {
                preview.style.display = 'none';
            }
        }

        function switchSlideTab(tab) {
            // Mudar abas de URL e Upload
            const urlTab = document.getElementById('slideUrlTab');
            const uploadTab = document.getElementById('slideUploadTab');
            const urlBtn = document.querySelector('[onclick="switchSlideTab(\'url\')"]');
            const uploadBtn = document.querySelector('[onclick="switchSlideTab(\'upload\')"]');
            
            if (tab === 'url') {
                urlTab.style.display = 'block';
                uploadTab.style.display = 'none';
                urlBtn.style.borderBottomColor = '#40998F';
                urlBtn.style.color = '#0B3D3D';
                uploadBtn.style.borderBottomColor = 'transparent';
                uploadBtn.style.color = '#999';
                
                // Fazer URL obrigatório
                document.getElementById('slideUrl').required = true;
                document.getElementById('slideFile').required = false;
            } else {
                urlTab.style.display = 'none';
                uploadTab.style.display = 'block';
                uploadBtn.style.borderBottomColor = '#40998F';
                uploadBtn.style.color = '#0B3D3D';
                urlBtn.style.borderBottomColor = 'transparent';
                urlBtn.style.color = '#999';
                
                // Fazer arquivo obrigatório
                document.getElementById('slideUrl').required = false;
                document.getElementById('slideFile').required = true;
            }
        }

        function resizeAndConvertImage(file, maxWidth = 600, maxHeight = 300, quality = 0.70) {
            return new Promise((resolve, reject) => {
                if (!file.type.startsWith('image/')) {
                    reject(new Error('Por favor, selecione um arquivo de imagem válido'));
                    return;
                }

                if (file.size > 10 * 1024 * 1024) {
                    reject(new Error('Arquivo muito grande. Máximo 10MB'));
                    return;
                }

                const reader = new FileReader();

                reader.onload = function(e) {
                    const img = new Image();
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;

                        // Manter proporção enquanto redimensiona
                        if (width > height) {
                            if (width > maxWidth) {
                                height = Math.round((height * maxWidth) / width);
                                width = maxWidth;
                            }
                        } else {
                            if (height > maxHeight) {
                                width = Math.round((width * maxHeight) / height);
                                height = maxHeight;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;

                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // Converter para Base64 com qualidade apropriada
                        const base64 = canvas.toDataURL('image/jpeg', quality);
                        resolve(base64);
                    };

                    img.onerror = function() {
                        reject(new Error('Erro ao processar imagem'));
                    };

                    img.src = e.target.result;
                };

                reader.onerror = function() {
                    reject(new Error('Erro ao ler arquivo'));
                };

                reader.readAsDataURL(file);
            });
        }

        function handleSlideFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            // Mostrar loading
            const preview = document.getElementById('slidePreview');
            preview.style.display = 'block';
            preview.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3EProcessando...%3C/text%3E%3C/svg%3E';

            resizeAndConvertImage(file)
                .then(base64 => {
                    document.getElementById('slideUrl').value = base64;
                    document.getElementById('slidePreview').src = base64;
                    document.getElementById('slidePreview').style.display = 'block';
                    showSuccess('Imagem carregada e redimensionada com sucesso!');
                })
                .catch(error => {
                    alert('Erro: ' + error.message);
                    preview.style.display = 'none';
                    event.target.value = '';
                });
        }

        async function saveSlideFromModal(event) {
            event.preventDefault();
            
            const url = document.getElementById('slideUrl').value;
            const alt = document.getElementById('slideAlt').value;
            const indexInput = document.getElementById('slideIndex');
            const index = indexInput.value;
            
            if (!url || !alt) {
                alert('Por favor, preencha a URL e o texto alternativo!');
                return;
            }
            
            let finalUrl = url;
            
            // Se for Base64 (upload do dispositivo), verificar tamanho antes de salvar
            if (url.startsWith('data:image/')) {
                const fileName = `slide-${Date.now()}.jpg`;
                finalUrl = await uploadImageToFirebase(url, fileName);
                
                // Verificar tamanho total estimado do documento Firestore (limite ~900KB)
                const totalSize = heroSlides.reduce((acc, s) => acc + (s.url.startsWith('data:') ? s.url.length : 500), 0) + finalUrl.length;
                if (totalSize > 900000) {
                    alert('Limite de imagens atingido! Remova uma imagem existente antes de adicionar outra.');
                    return;
                }
            }
            
            if (index === '' || index === null) {
                // Novo slide
                heroSlides.push({ url: finalUrl, alt });
            } else {
                // Atualizar slide existente
                heroSlides[parseInt(index)] = { url: finalUrl, alt };
            }
            
            await saveHeroSlides();
            renderSlides();
            showSuccess('✓ Imagem sincronizada com sucesso!');
            closeSlideModal();
        }

        // Adicionar evento para atualizar preview enquanto digita
        document.addEventListener('DOMContentLoaded', () => {
            const urlInput = document.getElementById('slideUrl');
            if (urlInput) {
                urlInput.addEventListener('change', updateSlidePreview);
                urlInput.addEventListener('input', updateSlidePreview);
            }
            
            const fileInput = document.getElementById('slideFile');
            if (fileInput) {
                fileInput.addEventListener('change', handleSlideFileUpload);
            }
        });



        async function removeSlide(index) {
            if (heroSlides.length <= 1) {
                alert('Você precisa ter pelo menos 1 imagem no carrossel!');
                return;
            }

            if (confirm('Tem certeza que deseja remover esta imagem?')) {
                heroSlides.splice(index, 1);
                await saveHeroSlides();
                renderSlides();
                showSuccess('✓ Imagem removida');
            }
        }

        async function removeBrokenSlides() {
            if (!heroSlides.length) return;

            const brokenIndexes = await Promise.all(heroSlides.map((slide, i) =>
                new Promise(resolve => {
                    const img = new Image();
                    img.onload  = () => resolve(null);
                    img.onerror = () => resolve(i);
                    img.src = slide.url;
                })
            ));

            const toRemove = brokenIndexes.filter(i => i !== null);
            if (!toRemove.length) {
                alert('Nenhuma imagem quebrada encontrada.');
                return;
            }

            if (!confirm(`Encontrei ${toRemove.length} imagem(ns) com erro de carregamento. Remover agora?`)) return;

            // Remove de trás para frente para preservar índices
            toRemove.sort((a, b) => b - a).forEach(i => heroSlides.splice(i, 1));

            if (!heroSlides.length) {
                alert('Não é possível remover todas as imagens. Pelo menos 1 deve permanecer.');
                return;
            }

            await saveHeroSlides();
            renderSlides();
            showSuccess(`✓ ${toRemove.length} imagem(ns) quebrada(s) removida(s)`);
        }



        // ===== DASHBOARD EM TEMPO REAL =====
        let _rtInterval = null;
        let _rtFirebaseUnsub = null;
        let _rtPresenceUnsub = null;
        let _rtPresenceHistoryUnsub = null;
        let _rtRevenueChart = null;
        let _rtStatusChart = null;
        let _rtPresenceHistoryChart = null;

        function _rtFmt(val) {
            return 'R$ ' + (val || 0).toFixed(2).replace('.', ',');
        }

        function _rtSet(id, val) {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        }

        function _rtEsc(value) {
            return String(value == null ? '' : value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function _rtToMillis(value) {
            if (!value) return 0;
            if (value.toDate && typeof value.toDate === 'function') {
                return value.toDate().getTime();
            }
            const num = Number(value);
            return Number.isFinite(num) ? num : 0;
        }

        function _rtFmtDuration(elapsedMs) {
            const totalSec = Math.max(0, Math.floor((elapsedMs || 0) / 1000));
            const hours = Math.floor(totalSec / 3600);
            const mins = Math.floor((totalSec % 3600) / 60);
            const secs = totalSec % 60;

            if (hours > 0) {
                return `${hours}h ${String(mins).padStart(2, '0')}m`;
            }
            if (mins > 0) {
                return `${mins}m ${String(secs).padStart(2, '0')}s`;
            }
            return `${secs}s no site`;
        }

        function _rtGetDayKey(date) {
            const d = date || new Date();
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}${m}${day}`;
        }

        function _rtBuildLast7DayEntries() {
            const entries = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const key = _rtGetDayKey(d);
                const label = i === 0 ? 'Hoje' : i === 1 ? 'Ontem' : d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
                entries.push({ key, label, total: 0, desktop: 0, mobile: 0, tablet: 0 });
            }
            return entries;
        }

        function _rtRenderPresenceHistory(docs) {
            const entries = _rtBuildLast7DayEntries();
            const seen = new Set();
            docs.forEach((doc) => {
                const d = doc.data() || {};
                const dayKey = d.dayKey;
                if (!dayKey) return;
                const uniqueKey = `${d.sessionId || doc.id}_${dayKey}`;
                if (seen.has(uniqueKey)) return;
                seen.add(uniqueKey);
                const entry = entries.find((e) => e.key === dayKey);
                if (!entry) return;
                entry.total++;
                const disp = String(d.dispositivo || 'desktop').toLowerCase();
                if (disp === 'mobile') entry.mobile++;
                else if (disp === 'tablet') entry.tablet++;
                else entry.desktop++;
            });

            const labels = entries.map((e) => e.label);
            const totalData = entries.map((e) => e.total);
            const desktopData = entries.map((e) => e.desktop);
            const mobileData = entries.map((e) => e.mobile);
            const tabletData = entries.map((e) => e.tablet);

            _rtRenderPresenceHistoryChart(labels, totalData, desktopData, mobileData, tabletData);

            const listEl = document.getElementById('rt-presence-history-list');
            if (!listEl) return;
            const maxVal = Math.max(...totalData, 1);
            listEl.innerHTML = entries.map((e) => {
                const pct = Math.round((e.total / maxVal) * 100);
                return `<div class="rt-history-row">
                    <span class="rt-history-day">${_rtEsc(e.label)}</span>
                    <div class="rt-history-bar-wrap"><div class="rt-history-bar" style="width:${pct}%"></div></div>
                    <span class="rt-history-val">${e.total}</span>
                </div>`;
            }).join('');
        }

        function _rtRenderPresenceHistoryChart(labels, totalData, desktopData, mobileData, tabletData) {
            const canvas = document.getElementById('rt-presence-history-chart');
            if (!canvas || typeof Chart === 'undefined') return;
            if (_rtPresenceHistoryChart) {
                _rtPresenceHistoryChart.destroy();
                _rtPresenceHistoryChart = null;
            }
            _rtPresenceHistoryChart = new Chart(canvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        { label: 'Desktop', data: desktopData, backgroundColor: 'rgba(33,150,243,0.7)', borderRadius: 4, stack: 'a' },
                        { label: 'Mobile', data: mobileData, backgroundColor: 'rgba(76,175,80,0.7)', borderRadius: 4, stack: 'a' },
                        { label: 'Tablet', data: tabletData, backgroundColor: 'rgba(255,152,0,0.7)', borderRadius: 4, stack: 'a' }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } }, tooltip: { mode: 'index' } },
                    scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } }
                }
            });
        }

        function initRealtimeDashboard() {
            updateRealtimeDashboard();

            // Listener Firestore em tempo real (dados)
            const fdb = getFirebaseDB();
            if (fdb) {
                if (_rtFirebaseUnsub) _rtFirebaseUnsub();
                _rtFirebaseUnsub = fdb.collection('data').doc('clients').onSnapshot(() => {
                    _loadAllFromFirebase().then(() => updateRealtimeDashboard());
                });

                // Listener de presença em tempo real
                if (_rtPresenceUnsub) _rtPresenceUnsub();
                _rtPresenceUnsub = fdb.collection('presence').onSnapshot((snap) => {
                    _rtUpdatePresence(snap.docs);
                });

                // Listener de histórico diário (últimos 7 dias)
                const minDayKey = _rtGetDayKey(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
                if (_rtPresenceHistoryUnsub) _rtPresenceHistoryUnsub();
                _rtPresenceHistoryUnsub = fdb.collection('presenceDaily')
                    .where('dayKey', '>=', minDayKey)
                    .onSnapshot((snap) => { _rtRenderPresenceHistory(snap.docs); });
            }

            // Polling 30s
            if (_rtInterval) clearInterval(_rtInterval);
            _rtInterval = setInterval(updateRealtimeDashboard, 30000);
        }

        function _rtUpdatePresence(docs) {
            const LIMITE_MS = 70 * 1000; // sem heartbeat por ~70s = offline
            const agora = Date.now();

            const ativos = (docs || [])
                .map((doc) => {
                    const d = doc.data() || {};
                    const lastSeen = _rtToMillis(d.lastSeen) || _rtToMillis(d.lastSeenClient);
                    const entrou = _rtToMillis(d.entrou) || _rtToMillis(d.entrouClient) || lastSeen;
                    return { id: doc.id, d, lastSeen, entrou };
                })
                .filter((item) => {
                    if (!item.lastSeen) return false;
                    if (item.d.status === 'offline') return false;
                    return (agora - item.lastSeen) < LIMITE_MS;
                })
                .sort((a, b) => b.lastSeen - a.lastSeen);

            _rtSet('rt-online-agora', ativos.length);
            const badge = document.getElementById('rt-online-badge');
            if (badge) {
                badge.textContent = ativos.length === 1 ? 'visitante' : 'visitantes';
                badge.className = 'rt-kpi-badge ' + (ativos.length > 0 ? 'up' : 'neutral');
            }

            // Contagem por dispositivo
            const byDevice = { desktop: 0, mobile: 0, tablet: 0 };
            ativos.forEach((item) => {
                const disp = String(item.d.dispositivo || 'desktop').toLowerCase();
                if (disp === 'mobile') byDevice.mobile++;
                else if (disp === 'tablet') byDevice.tablet++;
                else byDevice.desktop++;
            });
            _rtSet('rt-online-desktop', byDevice.desktop);
            _rtSet('rt-online-mobile', byDevice.mobile);
            _rtSet('rt-online-tablet', byDevice.tablet);

            const listaEl = document.getElementById('rt-online-lista');
            if (!listaEl) return;

            if (ativos.length === 0) {
                listaEl.innerHTML = '<div class="rt-empty">Nenhum visitante online no momento</div>';
                return;
            }

            listaEl.innerHTML = ativos.map((item) => {
                const d = item.d;
                const dispRaw = String(d.dispositivo || 'desktop').toLowerCase();
                const disp = dispRaw === 'mobile' ? 'mobile' : dispRaw === 'tablet' ? 'tablet' : 'desktop';
                const icon = disp === 'desktop' ? 'fa-desktop' : disp === 'tablet' ? 'fa-tablet-alt' : 'fa-mobile-alt';
                const pagina = d.pagina || d.pageTitle || d.page || 'Site';
                const visitante = d.visitorLabel || ('Visitante ' + String(d.visitorId || item.id || '').slice(-4).toUpperCase());
                const sessao = String(d.sessionId || item.id || '').slice(-6).toUpperCase() || '------';
                const inicio = item.entrou ? new Date(item.entrou) : null;
                const inicioTxt = inicio
                    ? inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : '--:--:--';
                const tempoTxt = _rtFmtDuration(agora - item.entrou);

                return `<div class="rt-online-row">
                    <span class="rt-online-dot"></span>
                    <i class="fas ${icon} rt-online-device-icon"></i>
                    <div class="rt-online-main">
                        <div class="rt-online-name">${_rtEsc(visitante)} <span class="rt-online-device-text">${_rtEsc(disp)}</span></div>
                        <div class="rt-online-page">${_rtEsc(pagina)}</div>
                        <div class="rt-online-meta">Iniciou às ${inicioTxt} · Sessão ${_rtEsc(sessao)}</div>
                    </div>
                    <span class="rt-online-duration">${tempoTxt}</span>
                </div>`;
            }).join('');
        }

        function updateRealtimeDashboard() {
            const now = new Date();
            const tz = 'America/Belem';

            // ── Helpers de data ──────────────────────────────────────
            const mesAtualStr = now.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric', timeZone: tz });
            const hojeStr = now.toLocaleDateString('pt-BR', { timeZone: tz });
            const inicioSemana = new Date(now);
            inicioSemana.setDate(now.getDate() - now.getDay());
            inicioSemana.setHours(0,0,0,0);

            function mesStr(d) { return new Date(d).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric', timeZone: tz }); }

            // ── Clientes ──────────────────────────────────────────────
            const totalClientes = clients.length;
            const novosMes = clients.filter(c => c.createdAt && mesStr(c.createdAt) === mesAtualStr).length;

            // ── Todos os serviços (achatados) ─────────────────────────
            const allSvcs = clients.flatMap(c => (c.services || []).map(s => ({ ...s, clientName: c.name, clientId: c.id })));
            const svPendente  = allSvcs.filter(s => s.status === 'pendente').length;
            const svAndamento = allSvcs.filter(s => s.status === 'andamento').length;
            const svConcluido = allSvcs.filter(s => s.status === 'concluido').length;
            const svCancelado = allSvcs.filter(s => s.status === 'cancelado').length;
            const svConcDocs  = allSvcs.filter(s => s.status === 'concluido');

            // ── Faturamento ───────────────────────────────────────────
            function sumRev(arr) { return arr.reduce((t, s) => t + (parseFloat(s.price) || 0), 0); }
            const fatTotal   = sumRev(svConcDocs);
            const fatDia     = sumRev(svConcDocs.filter(s => s.date && new Date(s.date).toLocaleDateString('pt-BR', { timeZone: tz }) === hojeStr));
            const fatSemana  = sumRev(svConcDocs.filter(s => s.date && new Date(s.date) >= inicioSemana));
            const fatMes     = sumRev(svConcDocs.filter(s => s.date && mesStr(s.date) === mesAtualStr));
            const clientsComFat = clients.filter(c => (c.services||[]).some(s => s.status==='concluido')).length;
            const ticketMedio = clientsComFat > 0 ? fatTotal / clientsComFat : 0;

            // ── Orçamentos ────────────────────────────────────────────
            prepararOrcamentos();
            const orcAbertos   = budgets.filter(b => situacaoOrcamento(b).chave === 'aberto').length;
            const orcFechados  = budgets.filter(b => b.etapa === 'servico' || b.etapa === 'laudo').length;
            // Orçamentos que viraram serviço, sobre o total de orçamentos.
            // Antes era svConcluido / budgets.length — serviços concluídos sobre
            // orçamentos, duas populações sem relação, que dava 233%.
            const taxaConv     = budgets.length > 0 ? Math.round((orcFechados / budgets.length) * 100) : 0;

            // ── Atualizar KPIs ────────────────────────────────────────
            _rtSet('rt-total-clientes', totalClientes);
            _rtSet('rt-total-servicos', allSvcs.length);
            _rtSet('rt-serv-concluido', svConcluido);
            _rtSet('rt-serv-pendente', svPendente);
            _rtSet('rt-orc-abertos', orcAbertos);
            _rtSet('rt-taxa-conversao', taxaConv + '%');
            _rtSet('rt-fat-dia', _rtFmt(fatDia));
            _rtSet('rt-fat-semana', _rtFmt(fatSemana));
            _rtSet('rt-fat-mes', _rtFmt(fatMes));
            _rtSet('rt-fat-total', _rtFmt(fatTotal));
            _rtSet('rt-ticket-medio', _rtFmt(ticketMedio));

            const badge = document.getElementById('rt-novos-mes-badge');
            if (badge) {
                badge.textContent = '+' + novosMes + ' este mês';
                badge.className = 'rt-kpi-badge ' + (novosMes > 0 ? 'up' : 'neutral');
            }

            // ── Badges de status ──────────────────────────────────────
            _rtSet('rt-b-pendente', svPendente);
            _rtSet('rt-b-andamento', svAndamento);
            _rtSet('rt-b-concluido', svConcluido);
            _rtSet('rt-b-cancelado', svCancelado);

            // ── Gráfico de status (doughnut) ──────────────────────────
            _rtRenderStatusChart(svPendente, svAndamento, svConcluido, svCancelado);

            // ── Funil ─────────────────────────────────────────────────
            const comServico = clients.filter(c => (c.services||[]).length > 0).length;
            _rtRenderFunnel([
                { label: 'Clientes cadastrados', val: totalClientes, color: '#40998F' },
                { label: 'Com orçamento', val: Math.min(budgets.length, totalClientes), color: '#2196F3' },
                { label: 'Com serviço', val: comServico, color: '#FF9800' },
                { label: 'Serviços concluídos', val: svConcluido, color: '#4CAF50' }
            ]);

            // ── Top serviços ──────────────────────────────────────────
            const svCount = {};
            allSvcs.forEach(s => {
                const k = s.type || 'Outros';
                svCount[k] = (svCount[k] || 0) + 1;
            });
            const topSvcs = Object.entries(svCount).sort((a,b) => b[1]-a[1]).slice(0,5);
            const maxSvc = topSvcs.length ? topSvcs[0][1] : 1;
            const svHtml = topSvcs.length ? topSvcs.map(([name, cnt], i) => `
                <li>
                    <div class="rt-li-left">
                        <span class="rt-rank">${i+1}</span>
                        <div>
                            <div class="rt-li-name">${name}</div>
                            <div class="rt-bar-bg"><div class="rt-bar-fill" style="width:${Math.round((cnt/maxSvc)*100)}%"></div></div>
                        </div>
                    </div>
                    <span class="rt-val">${cnt}x</span>
                </li>`).join('') : '<li class="rt-empty">Sem serviços cadastrados</li>';
            const svEl = document.getElementById('rt-top-servicos');
            if (svEl) svEl.innerHTML = svHtml;

            // ── Top clientes ──────────────────────────────────────────
            const topClients = clients.map(c => ({
                name: c.name,
                total: sumRev((c.services||[]).filter(s => s.status==='concluido')),
                count: (c.services||[]).length
            })).sort((a,b) => b.total-a.total).slice(0,5);
            const maxCli = topClients.length ? Math.max(topClients[0].total, 1) : 1;
            const topCliComFat = topClients.filter(c => c.total > 0);
            const cliHtml = topCliComFat.length > 0
                ? topCliComFat.map((c, i) => `
                <li>
                    <div class="rt-li-left">
                        <span class="rt-rank">${i+1}</span>
                        <div>
                            <div class="rt-li-name">${c.name}</div>
                            <div class="rt-bar-bg"><div class="rt-bar-fill" style="width:${Math.round((c.total/maxCli)*100)}%"></div></div>
                        </div>
                    </div>
                    <span class="rt-val">${_rtFmt(c.total)}</span>
                </li>`).join('')
                : topClients.length > 0
                    ? topClients.map((c, i) => `
                <li>
                    <div class="rt-li-left">
                        <span class="rt-rank">${i+1}</span>
                        <div class="rt-li-name">${c.name}</div>
                    </div>
                    <span class="rt-val">${c.count} serv.</span>
                </li>`).join('')
                    : '<li class="rt-empty">Sem clientes cadastrados</li>';
            const cliEl = document.getElementById('rt-top-clientes');
            if (cliEl) cliEl.innerHTML = cliHtml;

            // ── Últimas atividades ────────────────────────────────────
            const recentSvcs = [...allSvcs]
                .filter(s => s.date)
                .sort((a,b) => new Date(b.date)-new Date(a.date))
                .slice(0,8);
            const recentBudgets = [...budgets]
                .filter(b => b.date)
                .sort((a,b) => new Date(b.date)-new Date(a.date))
                .slice(0,4);

            const statusIcon = { pendente:'⏳', andamento:'🔧', concluido:'✅', cancelado:'❌' };
            const atHtml = recentSvcs.length ? recentSvcs.map(s => `
                <div class="rt-alert">
                    <div class="rt-alert-icon">${statusIcon[s.status] || '🔧'}</div>
                    <div class="rt-alert-body">
                        <strong>${s.type || 'Serviço'}</strong> — ${s.clientName}
                        <div class="rt-alert-time">${s.date ? new Date(s.date).toLocaleDateString('pt-BR') : '—'} · ${_rtFmt(parseFloat(s.price)||0)} · <span class="rt-badge ${s.status}" style="padding:1px 6px;font-size:10px;">${s.status}</span></div>
                    </div>
                </div>`).join('') : '<div class="rt-empty">Nenhuma atividade registrada ainda.</div>';
            const atEl = document.getElementById('rt-atividades');
            if (atEl) atEl.innerHTML = atHtml;

            // ── Gráfico de receita mensal ─────────────────────────────
            _rtRenderRevenueChart();

            // ── Timestamp ─────────────────────────────────────────────
            _rtSet('rt-last-update', 'Atualizado às ' + now.toLocaleTimeString('pt-BR', { timeZone: tz }));
        }

        function _rtRenderStatusChart(pend, and, conc, canc) {
            const ctx = document.getElementById('rt-status-chart');
            if (!ctx) return;
            if (_rtStatusChart) { _rtStatusChart.destroy(); _rtStatusChart = null; }
            if (pend + and + conc + canc === 0) return;
            const palette = getChartThemePalette();
            _rtStatusChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Pendente','Em Andamento','Concluído','Cancelado'],
                    datasets: [{
                        data: [pend, and, conc, canc],
                        backgroundColor: ['#FF9800','#2196F3','#4CAF50','#E91E63'],
                        borderWidth: 2,
                        borderColor: palette.doughnutBorder
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { font: { size: 11 }, padding: 10, color: palette.legendColor }
                        }
                    }
                }
            });
        }

        function _rtRenderFunnel(steps) {
            const el = document.getElementById('rt-funnel');
            if (!el) return;
            const maxVal = steps[0].val || 1;
            el.innerHTML = steps.map(s => {
                const pct = Math.max(8, Math.round((s.val / maxVal) * 100));
                return `<div class="rt-funnel-step">
                    <div class="rt-funnel-label">${s.label}</div>
                    <div class="rt-funnel-bar-bg">
                        <div class="rt-funnel-bar-fill" style="width:${pct}%;background:${s.color};">${s.val}</div>
                    </div>
                </div>`;
            }).join('');
        }

        function _rtRenderRevenueChart() {
            const ctx = document.getElementById('rt-revenue-chart');
            if (!ctx) return;
            if (_rtRevenueChart) { _rtRevenueChart.destroy(); _rtRevenueChart = null; }
            const palette = getChartThemePalette();

            const now = new Date();
            const tz = 'America/Belem';
            const labels = [], data = [];

            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                labels.push(d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: tz }));
                const mStr = d.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric', timeZone: tz });
                const rev = clients.flatMap(c => (c.services||[]))
                    .filter(s => s.status === 'concluido' && s.date && new Date(s.date).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric', timeZone: tz }) === mStr)
                    .reduce((t,s) => t+(parseFloat(s.price)||0), 0);
                data.push(rev);
            }

            _rtRevenueChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Receita (R$)',
                        data,
                        backgroundColor: palette.revenueBar,
                        borderColor: palette.revenueBorder,
                        borderWidth: 2,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                font: { size: 11 },
                                color: palette.tickColor,
                                callback: v => 'R$ ' + v.toFixed(0)
                            },
                            grid: { color: palette.gridColor }
                        },
                        x: { ticks: { font: { size: 11 }, color: palette.tickColor }, grid: { display: false } }
                    }
                }
            });
        }

        // Re-renderiza gráficos quando o tema muda
        window.addEventListener('pcformatech:themechange', () => {
            updateStatsChart();
            if (document.getElementById('tab-realtime')?.classList.contains('active')) {
                updateRealtimeDashboard();
            }
        });

        // ===== PARCELAR SERVIÇO EXISTENTE =====
        function openParcelarServicoModal(clientId, serviceIdx) {
            const client = clients.find(c => c.id === clientId);
            if (!client) return;
            const service = client.services[serviceIdx];
            if (!service) return;

            document.getElementById('parcServicoClientId').value = clientId;
            document.getElementById('parcServicoIdx').value = serviceIdx;
            document.getElementById('parcServicoCondicao').value = 'parcelado';
            document.getElementById('parcServicoEntrada').value = '0';
            document.getElementById('parcServicoNParcelas').value = '2';

            // Data padrão: hoje
            const hoje = new Date().toISOString().split('T')[0];
            document.getElementById('parcServicoPrimeiroVenc').value = hoje;

            document.getElementById('parcelarServicoInfo').innerHTML =
                `<strong>${service.type}</strong> — R$ ${service.price.toFixed(2).replace('.', ',')}<br>
                 <span style="color:#555;font-size:12px;">Cliente: ${client.name} · ${client.phone}</span>`;

            toggleParcelamentoExistente();
            calcularPreviewParcelasExistente();
            document.getElementById('parcelarServicoModal').style.display = 'block';
        }

        function toggleParcelamentoExistente() {
            const modo = document.getElementById('parcServicoCondicao').value;
            document.getElementById('parcServicoNParcelasGroup').style.display = modo === 'parcelado' ? 'block' : 'none';
            document.getElementById('parcServicoEntradaGroup').style.display = modo === 'parcelado' ? 'block' : 'none';
            document.getElementById('parcServicoVencLabel').textContent = modo === 'a_prazo' ? 'Data do Vencimento' : 'Data da 1ª Parcela';
            if (modo !== 'parcelado') {
                document.getElementById('parcServicoEntrada').value = '0';
            }
            calcularPreviewParcelasExistente();
        }

        function calcularPreviewParcelasExistente() {
            const clientId = parseInt(document.getElementById('parcServicoClientId').value);
            const serviceIdx = parseInt(document.getElementById('parcServicoIdx').value);
            if (!clientId && clientId !== 0) return;
            const client = clients.find(c => c.id === clientId);
            if (!client) return;
            const service = client.services[serviceIdx];
            if (!service) return;

            const price = service.price;
            const modo = document.getElementById('parcServicoCondicao').value;
            const nParcelas = parseInt(document.getElementById('parcServicoNParcelas').value) || 2;
            const entrada = parseFloat(document.getElementById('parcServicoEntrada').value) || 0;
            const primeiroVenc = document.getElementById('parcServicoPrimeiroVenc').value;
            const preview = document.getElementById('parcServicoPreview');

            if (modo === 'a_prazo') {
                let texto = `<strong>A prazo</strong> → 1x de <strong>R$ ${price.toFixed(2).replace('.', ',')}</strong>`;
                if (primeiroVenc) {
                    texto += ` com vencimento em <strong>${formatDateBR(primeiroVenc)}</strong>`;
                }
                preview.style.display = 'block';
                preview.innerHTML = texto;
                return;
            }

            if (entrada >= price) {
                preview.style.display = 'block';
                preview.innerHTML = '<span style="color:#c62828">⚠ Entrada não pode ser igual ou maior que o valor total.</span>';
                return;
            }

            const valorRestante = price - entrada;
            const valorParcela = (valorRestante / nParcelas).toFixed(2);
            let texto = `<strong>R$ ${price.toFixed(2).replace('.', ',')}</strong> → `;
            if (entrada > 0) texto += `Entrada: <strong>R$ ${entrada.toFixed(2).replace('.', ',')}</strong> + `;
            texto += `${nParcelas}x de <strong>R$ ${parseFloat(valorParcela).toFixed(2).replace('.', ',')}</strong>`;
            preview.style.display = 'block';
            preview.innerHTML = texto;
        }

        document.getElementById('parcelarServicoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const clientId = parseInt(document.getElementById('parcServicoClientId').value);
            const serviceIdx = parseInt(document.getElementById('parcServicoIdx').value);
            const client = clients.find(c => c.id === clientId);
            if (!client) return;
            const service = client.services[serviceIdx];
            if (!service) return;

            const cobranca = gerarCobrancaServico({
                modo: document.getElementById('parcServicoCondicao').value,
                price: service.price,
                nParcelas: parseInt(document.getElementById('parcServicoNParcelas').value) || 2,
                entrada: parseFloat(document.getElementById('parcServicoEntrada').value) || 0,
                primeiroVenc: document.getElementById('parcServicoPrimeiroVenc').value
            });
            if (cobranca.error) {
                alert(cobranca.error);
                return;
            }

            service.parcelamento = cobranca.parcelamento;
            saveClientsToStorage();
            closeModal('parcelarServicoModal');
            viewClient(clientId);
            renderParcelamentosTab();
            showSuccess();
        });

        // ===== SISTEMA DE NOTIFICAÇÕES =====
        let _swRegistration = null;
        let _notifEnviadas = new Set();

        // Chave pública VAPID (apenas a pública fica no frontend)
        const VAPID_PUBLIC_KEY = 'BOsP5fvAxVrJrzfLuJUvjQdKhmegU1Pvf9O_oY9B0FlTuDI35qeVKKHfuDUjxE8kLaigwAngE5Ye_tdWWs_O_0M';

        function _urlBase64ToUint8Array(base64String) {
            const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
            const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
            const raw = atob(base64);
            return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
        }

        /** Usuário do Firebase Auth; espera até 10 s se o login ainda está carregando. */
        function _usuarioLogado() {
            const auth = window.firebase && firebase.auth ? firebase.auth() : null;
            if (!auth) return Promise.resolve(null);
            if (auth.currentUser) return Promise.resolve(auth.currentUser);
            return new Promise((resolve) => {
                const desligar = auth.onAuthStateChanged((u) => { if (u) { desligar(); resolve(u); } });
                setTimeout(() => { desligar(); resolve(auth.currentUser || null); }, 10000);
            });
        }

        async function _registrarWebPush(registration) {
            if (!('PushManager' in window)) return;
            try {
                let sub = await registration.pushManager.getSubscription();
                if (!sub) {
                    sub = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: _urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                    });
                }

                const isLocalEnv = ['localhost', '127.0.0.1'].includes(window.location.hostname);
                if (isLocalEnv) {
                    console.log('ℹ️ Ambiente local detectado: registro de subscription no backend foi ignorado.');
                    return;
                }

                // Enviar subscription ao backend para armazenar. A rota só aceita
                // o administrador logado: sem o idToken, ela recusa (401).
                const usuario = await _usuarioLogado();
                if (!usuario) {
                    console.warn('Web Push: entre no painel para ativar os avisos neste aparelho.');
                    return;
                }
                const idToken = await usuario.getIdToken();
                const response = await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken, subscription: sub.toJSON() })
                });

                if (!response.ok) {
                    console.warn(`Web Push subscription não salva no backend (HTTP ${response.status}).`);
                    return;
                }

                console.log('✅ Web Push subscription registrada');
            } catch (err) {
                console.warn('Web Push subscription falhou:', err);
            }
        }

        async function iniciarNotificacoes() {
            if (!('Notification' in window)) {
                _atualizarStatusNotif('Notificações não suportadas neste navegador.');
                return;
            }

            // Registrar Service Worker
            if ('serviceWorker' in navigator) {
                try {
                    _swRegistration = await navigator.serviceWorker.register('/sw-notifications.js');
                } catch (err) {
                    console.warn('SW não registrado:', err);
                }
            }

            if (Notification.permission === 'granted') {
                _atualizarStatusNotif('✅ Notificações ativas. Você receberá alertas mesmo com o app fechado.');
                verificarNotificacoesParcelas();
                setInterval(verificarNotificacoesParcelas, 30 * 60 * 1000);
                // Registrar Web Push para notificações em background
                const reg = _swRegistration || await navigator.serviceWorker.ready;
                await _registrarWebPush(reg);
            } else if (Notification.permission === 'default') {
                const bar = document.getElementById('notif-permission-bar');
                if (bar) bar.style.display = 'flex';
                _atualizarStatusNotif('⚠️ Permissão não concedida. Clique em "Ativar Notificações" acima.');
            } else {
                _atualizarStatusNotif('🚫 Notificações bloqueadas neste navegador. Desbloqueie nas configurações do site.');
            }
        }

        async function solicitarPermissaoNotificacao() {
            if (!('Notification' in window)) {
                alert('Este navegador não suporta notificações.');
                return;
            }
            const perm = await Notification.requestPermission();
            if (perm === 'granted') {
                document.getElementById('notif-permission-bar').style.display = 'none';
                _atualizarStatusNotif('✅ Notificações ativas! Você receberá alertas mesmo com o app fechado.');
                if (!_swRegistration && 'serviceWorker' in navigator) {
                    try { _swRegistration = await navigator.serviceWorker.register('/sw-notifications.js'); } catch(e) {}
                }
                verificarNotificacoesParcelas();
                setInterval(verificarNotificacoesParcelas, 30 * 60 * 1000);
                // Registrar Web Push para notificações em background
                const reg = _swRegistration || await navigator.serviceWorker.ready;
                await _registrarWebPush(reg);
            } else {
                alert('Permissão de notificação negada. Você pode ativar nas configurações do navegador.');
            }
        }

        async function enviarNotificacao(titulo, corpo, tag) {
            if (Notification.permission !== 'granted') return;
            if (_swRegistration && _swRegistration.active) {
                _swRegistration.active.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    payload: { title: titulo, body: corpo, tag, icon: '/icon-192.png', badge: '/favicon-32x32.png' }
                });
            } else {
                // Fallback direto
                new Notification(titulo, { body: corpo, tag, icon: '/icon-192.png' });
            }
        }

        function verificarNotificacoesParcelas() {
            if (Notification.permission !== 'granted') return;

            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const amanha = new Date(hoje); amanha.setDate(hoje.getDate() + 1);

            const hojeStr = hoje.toISOString().split('T')[0];
            const amanhaStr = amanha.toISOString().split('T')[0];

            let contHoje = 0, contAmanha = 0;

            clients.forEach(client => {
                if (!client.services) return;
                client.services.forEach((service, sIdx) => {
                    if (!service.parcelamento || !service.parcelamento.ativo) return;
                    service.parcelamento.parcelas.forEach((parcela, pIdx) => {
                        if (parcela.pago) return;
                        const venc = parcela.dataVencimento;
                        const tag = `parc-${client.id}-${sIdx}-${pIdx}-${venc}`;
                        if (_notifEnviadas.has(tag)) return;

                        if (venc === hojeStr) {
                            const tipo = parcela.tipo === 'entrada' ? 'Entrada' : `${parcela.numero}ª parcela`;
                            enviarNotificacao(
                                '⚠️ Parcela vence HOJE — PC Formatech',
                                `${client.name} · ${service.type}\n${tipo} · R$ ${parcela.valor.toFixed(2).replace('.', ',')}`,
                                tag
                            );
                            _notifEnviadas.add(tag);
                            contHoje++;
                        } else if (venc === amanhaStr) {
                            const tipo = parcela.tipo === 'entrada' ? 'Entrada' : `${parcela.numero}ª parcela`;
                            enviarNotificacao(
                                '🔔 Parcela vence amanhã — PC Formatech',
                                `${client.name} · ${service.type}\n${tipo} · R$ ${parcela.valor.toFixed(2).replace('.', ',')}`,
                                tag
                            );
                            _notifEnviadas.add(tag);
                            contAmanha++;
                        }
                    });
                });
            });

            // Atualizar badge
            const total = contHoje + contAmanha;
            const badge = document.getElementById('notifBadgeHeader');
            if (badge) {
                if (total > 0) { badge.style.display = 'flex'; badge.textContent = total; }
                else { badge.style.display = 'none'; }
            }

            const msg = contHoje === 0 && contAmanha === 0
                ? 'Nenhum vencimento para hoje ou amanhã.'
                : `${contHoje} hoje · ${contAmanha} amanhã — notificações enviadas.`;
            _atualizarStatusNotif('✅ ' + msg);
        }

        function testarNotificacao() {
            if (Notification.permission !== 'granted') {
                solicitarPermissaoNotificacao();
                return;
            }
            enviarNotificacao(
                '🔔 Teste — PC Formatech',
                'Notificações de parcelas estão funcionando corretamente!\nVocê receberá alertas no dia e 1 dia antes do vencimento.',
                'pcformatech-teste-' + Date.now()
            );
            _atualizarStatusNotif('✅ Notificação de teste enviada!');
        }

        function _atualizarStatusNotif(msg) {
            const el = document.getElementById('notif-status-text');
            if (el) el.textContent = 'Status: ' + msg;
        }

        // ===== PAINEL VISUAL DE NOTIFICAÇÕES =====
        function abrirPainelNotificacoes(event) {
            if (event) event.stopPropagation();
            const panel = document.getElementById('notif-panel');
            if (!panel) return;
            if (panel.style.display === 'block') {
                panel.style.display = 'none';
                return;
            }
            _renderizarPainelNotificacoes();
            panel.style.display = 'block';
            setTimeout(() => {
                document.addEventListener('click', _fecharPainelFora, { once: true });
            }, 0);
        }

        function fecharPainelNotificacoes() {
            const panel = document.getElementById('notif-panel');
            if (panel) panel.style.display = 'none';
        }

        function _fecharPainelFora(e) {
            const panel = document.getElementById('notif-panel');
            const btn = document.getElementById('btnNotifHeader');
            if (!panel) return;
            if (!panel.contains(e.target) && btn && !btn.contains(e.target)) {
                panel.style.display = 'none';
            } else if (panel.style.display === 'block') {
                setTimeout(() => document.addEventListener('click', _fecharPainelFora, { once: true }), 0);
            }
        }

        function _renderizarPainelNotificacoes() {
            const body = document.getElementById('notif-panel-body');
            const btnAtivar = document.getElementById('notif-panel-ativar-btn');
            const btnTestar = document.getElementById('notif-panel-testar-btn');
            if (!body) return;

            const permGranted = (typeof Notification !== 'undefined') && Notification.permission === 'granted';
            if (btnAtivar) btnAtivar.style.display = permGranted ? 'none' : 'inline-flex';
            if (btnTestar) btnTestar.style.display = permGranted ? 'inline-flex' : 'none';

            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const amanha = new Date(hoje);
            amanha.setDate(hoje.getDate() + 1);
            const hojeStr = hoje.toISOString().split('T')[0];
            const amanhaStr = amanha.toISOString().split('T')[0];

            const itens = [];
            clients.forEach(client => {
                if (!client.services) return;
                client.services.forEach((service) => {
                    if (!service.parcelamento || !service.parcelamento.ativo) return;
                    service.parcelamento.parcelas.forEach((parcela) => {
                        if (parcela.pago) return;
                        const venc = parcela.dataVencimento;
                        if (venc === hojeStr || venc === amanhaStr) {
                            const tipo = parcela.tipo === 'entrada' ? 'Entrada' : `${parcela.numero}ª parcela`;
                            itens.push({ client, service, parcela, tipo, isHoje: venc === hojeStr });
                        }
                    });
                });
            });

            itens.sort((a, b) => (a.isHoje ? 0 : 1) - (b.isHoje ? 0 : 1));

            if (itens.length === 0) {
                body.innerHTML = `<div class="notif-panel-empty">
                    <i class="fas fa-check-circle" style="font-size:24px;color:#4CAF50;display:block;margin-bottom:8px;"></i>
                    Nenhum vencimento para hoje ou amanhã.
                </div>`;
                return;
            }

            body.innerHTML = itens.map(({ client, service, parcela, tipo, isHoje }) => `
                <div class="notif-item">
                    <span class="notif-item-icon">${isHoje ? '⚠️' : '🔔'}</span>
                    <div class="notif-item-info">
                        <div class="notif-item-title">${client.name}</div>
                        <div class="notif-item-sub">${service.type} · ${tipo}</div>
                        <div class="notif-item-sub" style="margin-top:4px;">
                            <strong>R$ ${parcela.valor.toFixed(2).replace('.', ',')}</strong>
                            &nbsp;<span class="${isHoje ? 'notif-badge-hoje' : 'notif-badge-amanha'}">${isHoje ? 'HOJE' : 'AMANHÃ'}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }