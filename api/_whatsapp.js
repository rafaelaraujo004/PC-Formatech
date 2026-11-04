// Utilitários da integração oficial com o WhatsApp Business Platform (Cloud API).
// O prefixo "_" faz a Vercel não publicar este arquivo como rota.
//
// Esta integração é o atendimento DA EMPRESA aos seus próprios clientes: só
// chegam aqui as mensagens que o cliente envia para o número comercial da PC
// Formatech, e só saem as respostas que o atendente escreve no painel. Não há
// captura de conversas de terceiros nem de outros aparelhos — é o mesmo que o
// WhatsApp Web faz com o número do negócio, pela API que a Meta oferece.
//
// Variáveis de ambiente necessárias (configurar na Vercel, nunca no código):
//   WHATSAPP_TOKEN            — token de acesso do app (Meta)
//   WHATSAPP_PHONE_NUMBER_ID  — id do número comercial na Cloud API
//   WHATSAPP_VERIFY_TOKEN     — texto escolhido por você, usado só na verificação do webhook
//   WHATSAPP_APP_SECRET       — "App Secret" do app Meta, confere a assinatura das chamadas
//   WHATSAPP_API_VERSION      — opcional, versão da Graph API (padrão v21.0)

const crypto = require('crypto');

const VERSAO_API = process.env.WHATSAPP_API_VERSION || 'v21.0';

/** Diz se as variáveis mínimas para ENVIAR estão presentes. */
function configDeEnvio() {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneNumberId) return null;
    return { token, phoneNumberId };
}

/**
 * Confere a assinatura X-Hub-Signature-256 que a Meta manda em cada webhook.
 * Compara o HMAC-SHA256 do corpo bruto com o cabeçalho, em tempo constante.
 * Sem WHATSAPP_APP_SECRET definido, retorna false (a rota deve recusar).
 */
function assinaturaConfere(corpoBruto, cabecalho) {
    const segredo = process.env.WHATSAPP_APP_SECRET;
    if (!segredo || !cabecalho) return false;
    const esperado = 'sha256=' + crypto.createHmac('sha256', segredo).update(corpoBruto).digest('hex');
    const a = Buffer.from(esperado);
    const b = Buffer.from(String(cabecalho));
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

/**
 * Lê o corpo da requisição como bytes crus (necessário para conferir a
 * assinatura: o JSON.stringify mudaria os bytes e quebraria o HMAC).
 * Funciona tanto quando a Vercel já entregou um Buffer/string quanto lendo o
 * fluxo diretamente.
 */
async function lerCorpoBruto(req) {
    if (Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') return Buffer.from(req.body);
    // Sem body pré-processado: lê o fluxo.
    const partes = [];
    for await (const parte of req) partes.push(typeof parte === 'string' ? Buffer.from(parte) : parte);
    return Buffer.concat(partes);
}

/** Normaliza um telefone para só dígitos (vira o id da conversa). */
function soDigitos(valor) {
    return String(valor || '').replace(/\D+/g, '');
}

/**
 * Envia uma mensagem de texto para um cliente pela Cloud API.
 * Devolve { ok, id?, erro? }. Não lança: o chamador decide o que mostrar.
 */
async function enviarTexto(para, texto) {
    const cfg = configDeEnvio();
    if (!cfg) return { ok: false, erro: 'Integração do WhatsApp ainda não configurada no servidor.' };
    const destino = soDigitos(para);
    if (!destino) return { ok: false, erro: 'Número de destino inválido.' };
    const conteudo = String(texto || '').trim();
    if (!conteudo) return { ok: false, erro: 'Mensagem vazia.' };
    if (conteudo.length > 4096) return { ok: false, erro: 'Mensagem muito longa (máx. 4096 caracteres).' };

    const url = `https://graph.facebook.com/${VERSAO_API}/${cfg.phoneNumberId}/messages`;
    try {
        const resposta = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${cfg.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: destino,
                type: 'text',
                text: { preview_url: false, body: conteudo }
            })
        });
        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok) {
            const msg = (dados && dados.error && dados.error.message) || `Erro ${resposta.status} da Meta.`;
            return { ok: false, erro: msg, detalhe: dados };
        }
        const id = dados && dados.messages && dados.messages[0] && dados.messages[0].id;
        return { ok: true, id: id || null };
    } catch (err) {
        return { ok: false, erro: 'Falha de rede ao falar com a Meta.' };
    }
}

module.exports = {
    VERSAO_API,
    configDeEnvio,
    assinaturaConfere,
    lerCorpoBruto,
    soDigitos,
    enviarTexto
};
