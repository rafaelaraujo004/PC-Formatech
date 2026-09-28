// Entrar no painel com biometria (digital ou rosto), via passkey.
//
// Cadastro: já logado com e-mail e senha, o aparelho cria uma chave presa à
// biometria e /api/biometria guarda só a parte pública. Login: o aparelho
// assina um desafio depois da biometria, a rota confere e devolve um token do
// Firebase, e o painel abre como num login por senha.

(function () {
    'use strict';

    const ROTA = '/api/biometria';
    // Id da passkey criada neste aparelho. Serve para mostrar "este aparelho"
    // na lista e para já pedir a digital ao abrir o app.
    const CHAVE_LOCAL = 'pcft_biometria';
    const CHAVE_AUTO = 'pcft_biometria_auto';

    const lib = () => window.SimpleWebAuthnBrowser;

    function ler(chave, armazenamento) {
        try { return (armazenamento || localStorage).getItem(chave); } catch (e) { return null; }
    }

    function gravar(chave, valor, armazenamento) {
        try {
            const alvo = armazenamento || localStorage;
            if (valor) alvo.setItem(chave, valor); else alvo.removeItem(chave);
        } catch (e) { /* armazenamento bloqueado */ }
    }

    async function chamar(acao, dados) {
        const resposta = await fetch(ROTA, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ acao, ...(dados || {}) })
        });
        let json = {};
        try { json = await resposta.json(); } catch (e) { /* corpo vazio */ }
        if (!resposta.ok || !json.ok) {
            const erro = new Error(json.error || 'Sem resposta do servidor (' + resposta.status + ').');
            erro.status = resposta.status;
            throw erro;
        }
        return json;
    }

    async function suportado() {
        if (!window.PublicKeyCredential || !lib()) return false;
        try {
            return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch (e) {
            return false;
        }
    }

    function explicarErro(erro) {
        const nome = erro && erro.name;
        if (nome === 'NotAllowedError' || nome === 'AbortError') return 'Biometria cancelada. Toque no botão para tentar de novo.';
        if (nome === 'InvalidStateError') return 'Este aparelho já tem biometria cadastrada.';
        if (nome === 'SecurityError') return 'A biometria só funciona no endereço oficial do painel.';
        return (erro && erro.message) || 'Não foi possível usar a biometria.';
    }

    function nomeDoAparelho() {
        const ua = navigator.userAgent || '';
        let nome = 'Aparelho';
        if (/Android/i.test(ua)) nome = 'Celular Android';
        else if (/iPhone/i.test(ua)) nome = 'iPhone';
        else if (/iPad/i.test(ua)) nome = 'iPad';
        else if (/Windows/i.test(ua)) nome = 'Computador Windows';
        else if (/Macintosh/i.test(ua)) nome = 'Mac';
        else if (/Linux/i.test(ua)) nome = 'Computador Linux';
        return nome + ' · ' + new Date().toLocaleDateString('pt-BR');
    }

    function formatarData(ms) {
        if (!ms) return '';
        return new Date(ms).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }

    // ── Tela de login ─────────────────────────────────────────────────────

    const botaoEntrar = () => document.getElementById('btn-biometria');
    const statusLogin = () => document.getElementById('biometria-status');

    function mostrarStatusLogin(texto, erro) {
        const el = statusLogin();
        if (!el) return;
        el.textContent = texto || '';
        el.classList.toggle('is-erro', Boolean(erro));
    }

    async function entrar() {
        const botao = botaoEntrar();
        if (botao) botao.classList.add('is-carregando');
        mostrarStatusLogin('Confirme com sua digital ou rosto…');
        try {
            const { opcoes } = await chamar('login-opcoes');
            const resposta = await lib().startAuthentication({ optionsJSON: opcoes });
            mostrarStatusLogin('Conferindo…');
            const { token } = await chamar('login', { resposta });

            const credencial = await firebase.auth().signInWithCustomToken(token);
            const sistema = window.authSystem;
            if (!sistema) throw new Error('Módulo de autenticação indisponível.');
            // Mesmo estado que o login por senha deixa (auth-system).
            sistema.currentUser = credencial.user;
            sistema.sessionMode = 'firebase';
            sistema.resetLoginAttempts();
            sistema.startSession('firebase');

            gravar(CHAVE_LOCAL, resposta.id);
            mostrarStatusLogin('');
            await window.activateAdminPanel();
        } catch (erro) {
            // A passkey foi apagada no painel ou em outro aparelho.
            if (erro && erro.status === 401 && /cadastrada/.test(erro.message)) gravar(CHAVE_LOCAL, null);
            mostrarStatusLogin(explicarErro(erro), true);
        } finally {
            if (botao) botao.classList.remove('is-carregando');
        }
    }

    async function prepararLogin() {
        const botao = botaoEntrar();
        if (!botao || !(await suportado())) return;
        botao.hidden = false;
        const divisor = document.getElementById('login-divisor');
        if (divisor) divisor.hidden = false;
        botao.addEventListener('click', entrar);

        // Abriu o app com biometria cadastrada: já pede a digital, uma vez
        // por aba (depois de sair do painel, não pede de novo sozinho).
        const logado = window.authSystem && window.authSystem.isAuthenticated();
        if (!logado && ler(CHAVE_LOCAL) && !ler(CHAVE_AUTO, sessionStorage)) {
            gravar(CHAVE_AUTO, '1', sessionStorage);
            entrar();
        }
    }

    // ── Painel: cadastrar e gerenciar ─────────────────────────────────────

    function statusPainel(texto, erro) {
        const el = document.getElementById('bio-status');
        if (!el) return;
        el.textContent = texto || '';
        el.classList.toggle('is-erro', Boolean(erro));
    }

    async function tokenDoAdmin() {
        const usuario = window.firebase && firebase.auth().currentUser;
        if (!usuario) throw new Error('Para cadastrar, saia e entre de novo com e-mail e senha.');
        return usuario.getIdToken();
    }

    function desenharLista(lista) {
        const ul = document.getElementById('bio-lista');
        if (!ul) return;
        ul.innerHTML = '';
        const deste = ler(CHAVE_LOCAL);

        if (!lista.length) {
            const vazio = document.createElement('li');
            vazio.className = 'bio-vazio';
            vazio.textContent = 'Nenhum aparelho cadastrado ainda.';
            ul.appendChild(vazio);
        }

        lista.forEach((item) => {
            const li = document.createElement('li');
            li.className = 'bio-item' + (item.id === deste ? ' is-deste' : '');

            const icone = document.createElement('i');
            icone.className = 'fas fa-fingerprint';
            icone.setAttribute('aria-hidden', 'true');

            const texto = document.createElement('div');
            texto.className = 'bio-item-texto';
            const nome = document.createElement('strong');
            nome.textContent = (item.aparelho || 'Aparelho') + (item.id === deste ? ' (este)' : '');
            const detalhe = document.createElement('small');
            detalhe.textContent = item.usadoEm ? 'Último uso: ' + formatarData(item.usadoEm) : 'Ainda não usada para entrar';
            texto.append(nome, detalhe);

            const remover = document.createElement('button');
            remover.type = 'button';
            remover.className = 'bio-remover';
            remover.title = 'Remover este aparelho';
            remover.setAttribute('aria-label', 'Remover ' + (item.aparelho || 'aparelho'));
            remover.innerHTML = '<i class="fas fa-trash-alt" aria-hidden="true"></i>';
            remover.addEventListener('click', () => removerItem(item));

            li.append(icone, texto, remover);
            ul.appendChild(li);
        });

        const cadastrar = document.getElementById('bio-cadastrar');
        if (cadastrar) {
            const temDeste = lista.some((item) => item.id === deste);
            cadastrar.hidden = temDeste;
        }
    }

    async function atualizarLista() {
        try {
            const idToken = await tokenDoAdmin();
            const { lista } = await chamar('listar', { idToken });
            // Se a deste aparelho sumiu da lista, esquece a marca local.
            const deste = ler(CHAVE_LOCAL);
            if (deste && !lista.some((item) => item.id === deste)) gravar(CHAVE_LOCAL, null);
            desenharLista(lista);
        } catch (erro) {
            statusPainel(explicarErro(erro), true);
        }
    }

    async function cadastrar() {
        const botao = document.getElementById('bio-cadastrar');
        if (botao) botao.disabled = true;
        statusPainel('Confirme com sua digital ou rosto…');
        try {
            const idToken = await tokenDoAdmin();
            const { opcoes } = await chamar('cadastro-opcoes', { idToken });
            const resposta = await lib().startRegistration({ optionsJSON: opcoes });
            statusPainel('Salvando…');
            const { id } = await chamar('cadastro', { idToken, resposta, aparelho: nomeDoAparelho() });
            gravar(CHAVE_LOCAL, id);
            statusPainel('Pronto! Na próxima vez, é só usar a digital para entrar.');
            await atualizarLista();
        } catch (erro) {
            statusPainel(explicarErro(erro), true);
        } finally {
            if (botao) botao.disabled = false;
        }
    }

    async function removerItem(item) {
        if (!window.confirm('Remover a biometria de "' + (item.aparelho || 'aparelho') + '"? Esse aparelho vai precisar da senha para entrar.')) return;
        try {
            const idToken = await tokenDoAdmin();
            await chamar('remover', { idToken, id: item.id });
            if (item.id === ler(CHAVE_LOCAL)) gravar(CHAVE_LOCAL, null);
            statusPainel('Biometria removida.');
            await atualizarLista();
        } catch (erro) {
            statusPainel(explicarErro(erro), true);
        }
    }

    async function prepararPainel() {
        const cartao = document.getElementById('bio-cartao');
        if (!cartao) return;
        if (!(await suportado())) {
            statusPainel('Este aparelho ou navegador não tem biometria disponível.');
            const botao = document.getElementById('bio-cadastrar');
            if (botao) botao.hidden = true;
            return;
        }
        atualizarLista();
    }

    // O painel abre por activateAdminPanel (senha, biometria ou sessão salva).
    const abrirPainelOriginal = window.activateAdminPanel;
    if (typeof abrirPainelOriginal === 'function') {
        window.activateAdminPanel = async function () {
            await abrirPainelOriginal.apply(this, arguments);
            prepararPainel();
        };
    }

    function iniciar() {
        const botao = document.getElementById('bio-cadastrar');
        if (botao) botao.addEventListener('click', cadastrar);
        prepararLogin();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }

    window.PCFTBiometria = { entrar, cadastrar, atualizarLista };
})();
