// Pix com QR Code do valor exato (Pix "estático" com valor, padrão BR Code do
// Banco Central). O pagamento cai direto na conta da chave abaixo; a
// confirmação é feita por quem recebe, no app do banco. Não passa por
// nenhuma empresa de pagamento e não tem taxa.
//
// O QR Code é desenhado por vendor/qrcode-generator.js (MIT).

(function () {
    'use strict';

    const PIX = {
        chave: '+5594991405772',     // celular (94) 99140-5772
        nome: 'RAFAEL ARAUJO DA SILVA', // até 25 letras, sem acento (titular)
        empresa: 'PC Formatech',
        titular: 'Rafael Araújo da Silva',
        chaveTexto: '(94) 99140-5772',
        cidade: 'CANAA CARAJAS'      // até 15 letras, sem acento
    };

    const campo = (id, valor) => id + String(valor.length).padStart(2, '0') + valor;

    // Intervalo dos acentos combinantes (U+0300 a U+036F), montado por código.
    const ACENTOS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');
    const semAcento = (t) => String(t).normalize('NFD').replace(ACENTOS, '').replace(/[^ -~]/g, '');

    /** CRC16-CCITT (polinômio 0x1021, início 0xFFFF), exigido no fim do BR Code. */
    function crc16(texto) {
        let crc = 0xffff;
        for (let i = 0; i < texto.length; i++) {
            crc ^= texto.charCodeAt(i) << 8;
            for (let b = 0; b < 8; b++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
        }
        return crc.toString(16).toUpperCase().padStart(4, '0');
    }

    /**
     * Monta o "Pix copia e cola".
     * valor: número em reais (ex.: 44.97). identificador: até 25 letras e
     * números (aparece no extrato e ajuda a achar o pagamento). descricao:
     * texto curto opcional que alguns bancos mostram para quem paga.
     */
    function codigo(valor, identificador, descricao) {
        const conta = campo('00', 'br.gov.bcb.pix') + campo('01', PIX.chave)
            + (descricao ? campo('02', semAcento(descricao).slice(0, 40)) : '');
        const txid = (semAcento(identificador || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 25)) || '***';
        const semCrc = campo('00', '01')
            + campo('26', conta)
            + campo('52', '0000')
            + campo('53', '986')
            + (valor > 0 ? campo('54', Number(valor).toFixed(2)) : '')
            + campo('58', 'BR')
            + campo('59', semAcento(PIX.nome).slice(0, 25))
            + campo('60', semAcento(PIX.cidade).slice(0, 15))
            + campo('62', campo('05', txid))
            + '6304';
        return semCrc + crc16(semCrc);
    }

    /** Desenha o QR Code num <canvas> (nítido em telas de alta densidade). */
    function desenhar(canvas, texto, tamanhoCss) {
        const qr = window.qrcode(0, 'M');
        qr.addData(texto);
        qr.make();
        const n = qr.getModuleCount();
        const borda = 2;
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        const lado = tamanhoCss || 220;
        canvas.width = Math.round(lado * dpr);
        canvas.height = Math.round(lado * dpr);
        canvas.style.width = lado + 'px';
        canvas.style.height = lado + 'px';
        const ctx = canvas.getContext('2d');
        const modulo = canvas.width / (n + borda * 2);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0b1f20';
        for (let y = 0; y < n; y++) {
            for (let x = 0; x < n; x++) {
                if (qr.isDark(y, x)) ctx.fillRect(Math.floor((x + borda) * modulo), Math.floor((y + borda) * modulo), Math.ceil(modulo), Math.ceil(modulo));
            }
        }
    }

    window.PCFTPix = { codigo, desenhar, crc16, dados: PIX };
})();
