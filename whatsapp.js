// Painel de atendimento do WhatsApp Business (PC Formatech).
//
// Lê as conversas e mensagens do Firestore (só o administrador logado tem
// permissão, pelas regras) e envia respostas pela rota /api/whatsapp-enviar,
// que fala com a Cloud API da Meta. O navegador nunca toca no token de acesso.

(function () {
    'use strict';

    var EMAIL_ADMIN = 'rafaelaraujo004@gmail.com';
    var JANELA_24H = 24 * 60 * 60 * 1000;

    var db = null, auth = null;
    var cancelarConversas = null, cancelarMensagens = null;
    var conversaAberta = null;

    // ── Elementos ───────────────────────────────────────────────────────────
    var el = function (id) { return document.getElementById(id); };
    var loginBox = el('login'), app = el('app');
    var formLogin = el('form-login'), erroLogin = el('erro-login'), btnEntrar = el('btn-entrar');

    // ── Inicialização do Firebase ────────────────────────────────────────────
    function iniciar() {
        if (typeof initFirebase !== 'function' || !initFirebase()) {
            erroLogin.textContent = 'Firebase não carregou. Verifique a conexão.';
            return;
        }
        db = firebase.firestore();
        auth = firebase.auth();
        auth.onAuthStateChanged(function (user) {
            if (user && String(user.email || '').toLowerCase() === EMAIL_ADMIN) {
                mostrarApp();
            } else {
                mostrarLogin();
            }
        });
    }

    function mostrarLogin() {
        app.classList.remove('ativo');
        loginBox.style.display = 'flex';
        if (cancelarConversas) { cancelarConversas(); cancelarConversas = null; }
        if (cancelarMensagens) { cancelarMensagens(); cancelarMensagens = null; }
    }

    function mostrarApp() {
        loginBox.style.display = 'none';
        app.classList.add('ativo');
        ouvirConversas();
    }

    // ── Login ────────────────────────────────────────────────────────────────
    formLogin.addEventListener('submit', function (e) {
        e.preventDefault();
        erroLogin.textContent = '';
        btnEntrar.disabled = true;
        var email = el('email').value.trim();
        var senha = el('senha').value;
        auth.signInWithEmailAndPassword(email, senha)
            .then(function (cred) {
                if (String(cred.user.email || '').toLowerCase() !== EMAIL_ADMIN) {
                    return auth.signOut().then(function () {
                        throw new Error('Usuário sem permissão de administrador.');
                    });
                }
            })
            .catch(function (err) {
                var msg = 'E-mail ou senha incorretos.';
                if (err && err.message && !/auth\//.test(String(err.code || ''))) msg = err.message;
                erroLogin.textContent = msg;
            })
            .finally(function () { btnEntrar.disabled = false; });
    });

    el('btn-sair').addEventListener('click', function () { auth.signOut(); });

    // ── Lista de conversas ─────────────────────────────────────────────────────
    function ouvirConversas() {
        if (cancelarConversas) cancelarConversas();
        cancelarConversas = db.collection('whatsappConversations')
            .orderBy('atualizadoEm', 'desc').limit(100)
            .onSnapshot(renderConversas, function (err) {
                console.error(err);
                el('conversas').innerHTML = '<div class="vazio">Não foi possível carregar as conversas.</div>';
            });
    }

    function iniciais(nome, tel) {
        var base = (nome || '').trim();
        if (base) return base.slice(0, 2).toUpperCase();
        return (tel || '·').slice(-2);
    }

    function telefoneBonito(tel) {
        var d = String(tel || '');
        if (d.length === 13 && d.indexOf('55') === 0) {
            return '+55 (' + d.slice(2, 4) + ') ' + d.slice(4, 9) + '-' + d.slice(9);
        }
        return '+' + d;
    }

    function renderConversas(snap) {
        var cont = el('conversas');
        if (snap.empty) {
            cont.innerHTML = '<div class="vazio">Nenhuma conversa ainda.<br>Elas aparecem aqui quando um cliente escreve para o número da empresa.</div>';
            return;
        }
        cont.innerHTML = '';
        snap.forEach(function (doc) {
            var d = doc.data();
            var div = document.createElement('div');
            div.className = 'conversa' + (conversaAberta === doc.id ? ' ativa' : '');
            var naoLidas = d.naoLidas > 0 ? '<span class="badge">' + d.naoLidas + '</span>' : '';
            div.innerHTML =
                '<div class="avatar">' + escapar(iniciais(d.nome, d.telefone)) + '</div>' +
                '<div class="meio">' +
                    '<div class="nome">' + escapar(d.nome || telefoneBonito(d.telefone)) + '</div>' +
                    '<div class="previa">' + escapar(d.ultimoTexto || '') + '</div>' +
                '</div>' + naoLidas;
            div.addEventListener('click', function () { abrirConversa(doc.id, d); });
            cont.appendChild(div);
        });
    }

    // ── Conversa aberta ────────────────────────────────────────────────────────
    function abrirConversa(id, dados) {
        conversaAberta = id;
        app.classList.add('ver-chat');
        el('sem-chat').style.display = 'none';
        el('chat-topo').style.display = 'flex';
        el('barra-envio').style.display = 'flex';
        el('chat-avatar').textContent = iniciais(dados.nome, dados.telefone);
        el('chat-nome').textContent = dados.nome || telefoneBonito(dados.telefone);
        el('chat-tel').textContent = telefoneBonito(dados.telefone);
        document.querySelectorAll('.conversa').forEach(function (c) { c.classList.remove('ativa'); });

        if (cancelarMensagens) cancelarMensagens();
        cancelarMensagens = db.collection('whatsappConversations').doc(id)
            .collection('mensagens').orderBy('criadoEm', 'asc').limit(300)
            .onSnapshot(function (snap) { renderMensagens(snap); });
    }

    function renderMensagens(snap) {
        var cont = el('mensagens');
        cont.innerHTML = '';
        var ultimaRecebida = 0;
        snap.forEach(function (doc) {
            var m = doc.data();
            var ms = m.criadoEm && m.criadoEm.toMillis ? m.criadoEm.toMillis() : 0;
            if (m.direcao === 'recebida' && ms > ultimaRecebida) ultimaRecebida = ms;
            var div = document.createElement('div');
            div.className = 'bolha ' + (m.direcao === 'enviada' ? 'enviada' : 'recebida');
            div.innerHTML = escapar(m.texto || '') + '<span class="hora">' + hora(ms) + '</span>';
            cont.appendChild(div);
        });
        cont.scrollTop = cont.scrollHeight;

        // Aviso da janela de 24 h: fora dela, só template é permitido pela Meta.
        var aviso = el('aviso-janela');
        if (ultimaRecebida && (Date.now() - ultimaRecebida) > JANELA_24H) {
            aviso.style.display = 'block';
            aviso.textContent = '⚠️ Passaram-se mais de 24 h desde a última mensagem do cliente. A Meta pode recusar texto livre; nesse caso só um modelo (template) aprovado é entregue.';
        } else {
            aviso.style.display = 'none';
        }
    }

    // ── Envio ──────────────────────────────────────────────────────────────────
    var texto = el('texto'), btnEnviar = el('btn-enviar');

    texto.addEventListener('input', function () {
        texto.style.height = 'auto';
        texto.style.height = Math.min(texto.scrollHeight, 120) + 'px';
    });
    texto.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
    });
    btnEnviar.addEventListener('click', enviar);

    function enviar() {
        var msg = texto.value.trim();
        if (!msg || !conversaAberta) return;
        btnEnviar.disabled = true;
        auth.currentUser.getIdToken().then(function (idToken) {
            return fetch('/api/whatsapp-enviar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: idToken, para: conversaAberta, texto: msg })
            });
        }).then(function (r) {
            return r.json().then(function (j) { return { ok: r.ok, j: j }; });
        }).then(function (res) {
            if (!res.ok) {
                alert(res.j.error || 'Não foi possível enviar.');
                return;
            }
            texto.value = '';
            texto.style.height = 'auto';
        }).catch(function () {
            alert('Falha de conexão ao enviar.');
        }).finally(function () {
            btnEnviar.disabled = false;
            texto.focus();
        });
    }

    el('btn-voltar').addEventListener('click', function () {
        app.classList.remove('ver-chat');
        conversaAberta = null;
        if (cancelarMensagens) { cancelarMensagens(); cancelarMensagens = null; }
    });

    // ── Util ─────────────────────────────────────────────────────────────────
    function escapar(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
    function hora(ms) {
        if (!ms) return '';
        try {
            return new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } catch (e) { return ''; }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
