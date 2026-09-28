// Fundo Bird Tech aplicado automaticamente às fotos dos produtos.
//
// Recebe a foto enviada no painel e devolve uma imagem 940×908 no mesmo
// estilo das artes da loja: cenário cinza com nuvens, papel rasgado azul nos
// cantos, o produto sobre um pedestal branco e o nome numa pílula azul.
// Cores medidas nas artes originais (fone-hmaston-ej-40.webp).
//
// Se a foto tiver fundo liso e claro (produto fotografado sobre mesa branca,
// papel, parede), esse fundo é recortado antes de montar a arte.

(function () {
    'use strict';

    const LARGURA = 940;
    const ALTURA = 908;
    const COR = {
        fundoBorda: '#cccccc',
        fundoCentro: '#e8e8e8',
        papel: '#10637b',
        papelEscuro: '#093b48',
        pilula: '#2a768c',
        pontos: '#2e758f',
        pedestalTopo: '#f2f2f2',
        pedestalLado: '#d2d2d2'
    };

    // Aleatório com semente: a borda rasgada sai igual em todos os produtos.
    function aleatorio(semente) {
        let n = semente;
        return () => {
            n = (n * 16807) % 2147483647;
            return (n - 1) / 2147483646;
        };
    }

    function desenharCenario(ctx) {
        const base = ctx.createRadialGradient(LARGURA / 2, ALTURA * 0.45, 80, LARGURA / 2, ALTURA * 0.5, LARGURA * 0.72);
        base.addColorStop(0, COR.fundoCentro);
        base.addColorStop(1, COR.fundoBorda);
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, LARGURA, ALTURA);

        // Chão: a metade de baixo um pouco mais clara, como nas artes.
        const chao = ctx.createLinearGradient(0, ALTURA * 0.62, 0, ALTURA);
        chao.addColorStop(0, 'rgba(255,255,255,0.18)');
        chao.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = chao;
        ctx.fillRect(0, ALTURA * 0.62, LARGURA, ALTURA * 0.38);

        // Nuvens nas laterais.
        ctx.save();
        ctx.filter = 'blur(34px)';
        ctx.fillStyle = 'rgba(255,255,255,0.62)';
        [
            [140, 300, 130, 110], [110, 440, 160, 120], [220, 560, 150, 90],
            [800, 300, 130, 110], [830, 440, 160, 120], [720, 560, 150, 90],
            [470, 190, 170, 70]
        ].forEach(([x, y, rx, ry]) => {
            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    /**
     * Papel rasgado num canto. A borda é uma linha serrilhada entre dois
     * pontos; por baixo dela uma faixa branca irregular imita o rasgo.
     */
    function desenharPapelRasgado(ctx, inicio, fim, canto, semente) {
        const rnd = aleatorio(semente);
        const passos = 70;
        const linha = [];
        for (let i = 0; i <= passos; i++) {
            const t = i / passos;
            const x = inicio[0] + (fim[0] - inicio[0]) * t;
            const y = inicio[1] + (fim[1] - inicio[1]) * t;
            // Ondulação larga + serrilhado fino.
            const onda = Math.sin(t * Math.PI * 3 + semente) * 14;
            linha.push([x + (rnd() - 0.5) * 10, y + onda + (rnd() - 0.5) * 12]);
        }

        const contorno = (deslocamento) => {
            ctx.beginPath();
            linha.forEach(([x, y], i) => {
                const dx = x + deslocamento[0] * (0.6 + rnd() * 0.8);
                const dy = y + deslocamento[1] * (0.6 + rnd() * 0.8);
                if (i === 0) ctx.moveTo(dx, dy); else ctx.lineTo(dx, dy);
            });
            canto.forEach(([x, y]) => ctx.lineTo(x, y));
            ctx.closePath();
        };

        // Faixa branca do rasgo, deslocada para fora do papel (em direção ao
        // centro da arte): para baixo-esquerda no canto de cima, para
        // cima-direita no canto de baixo.
        const sentido = canto[0][1] === 0 ? 1 : -1;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#f7f7f7';
        contorno([sentido * -9, sentido * 11]);
        ctx.fill();
        ctx.restore();

        // Papel azul com um leve degradê e textura.
        const g = ctx.createLinearGradient(inicio[0], inicio[1], canto[1][0], canto[1][1]);
        g.addColorStop(0, COR.papel);
        g.addColorStop(1, COR.papelEscuro);
        ctx.fillStyle = g;
        contorno([0, 0]);
        ctx.fill();

        ctx.save();
        ctx.clip();
        for (let i = 0; i < 900; i++) {
            ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
            ctx.fillRect(rnd() * LARGURA, rnd() * ALTURA, 2 + rnd() * 3, 2 + rnd() * 3);
        }
        ctx.restore();
    }

    function desenharPedestal(ctx) {
        const cx = LARGURA / 2;
        const topo = 655;
        const rx = 300;
        const ry = 46;
        const altura = 62;

        // Sombra no chão.
        ctx.save();
        ctx.filter = 'blur(18px)';
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(cx, topo + altura + 10, rx * 1.02, ry * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Lateral do cilindro.
        const lado = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
        lado.addColorStop(0, '#c4c4c4');
        lado.addColorStop(0.45, '#e9e9e9');
        lado.addColorStop(1, '#bdbdbd');
        ctx.fillStyle = lado;
        ctx.beginPath();
        ctx.moveTo(cx - rx, topo);
        ctx.lineTo(cx - rx, topo + altura);
        ctx.ellipse(cx, topo + altura, rx, ry, 0, Math.PI, 0, true);
        ctx.lineTo(cx + rx, topo);
        ctx.closePath();
        ctx.fill();

        // Tampo.
        const tampo = ctx.createRadialGradient(cx, topo - 10, 20, cx, topo, rx);
        tampo.addColorStop(0, '#ffffff');
        tampo.addColorStop(1, COR.pedestalTopo);
        ctx.fillStyle = tampo;
        ctx.beginPath();
        ctx.ellipse(cx, topo, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 2;
        ctx.stroke();

        return { topo, cx };
    }

    function desenharProduto(ctx, fonte, pedestal) {
        const largMax = 540;
        const altMax = 500;
        const escala = Math.min(largMax / fonte.width, altMax / fonte.height);
        const w = fonte.width * escala;
        const h = fonte.height * escala;
        const x = pedestal.cx - w / 2;
        const y = pedestal.topo + 12 - h; // a base do produto pousa no tampo

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.28)';
        ctx.shadowBlur = 26;
        ctx.shadowOffsetY = 14;
        ctx.drawImage(fonte, x, y, w, h);
        ctx.restore();
    }

    function quebrarLinhas(ctx, texto, largura) {
        const palavras = texto.split(/\s+/).filter(Boolean);
        const linhas = [];
        let atual = '';
        palavras.forEach((p) => {
            const teste = atual ? atual + ' ' + p : p;
            if (ctx.measureText(teste).width > largura && atual) {
                linhas.push(atual);
                atual = p;
            } else {
                atual = teste;
            }
        });
        if (atual) linhas.push(atual);
        return linhas;
    }

    function desenharPilula(ctx, nome) {
        const texto = String(nome || '').toUpperCase().trim() || 'PRODUTO BIRD TECH';
        let tamanho = 34;
        let linhas;
        // Até 3 linhas; se não couber, diminui a fonte.
        do {
            ctx.font = `800 ${tamanho}px Montserrat, Sora, "Segoe UI", Arial, sans-serif`;
            linhas = quebrarLinhas(ctx, texto, 400);
            tamanho -= 2;
        } while (linhas.length > 3 && tamanho > 20);

        const alturaLinha = tamanho + 10;
        const largura = Math.max(340, Math.max(...linhas.map((l) => ctx.measureText(l).width)) + 110);
        const altura = linhas.length * alturaLinha + 44;
        const x = LARGURA / 2 - largura / 2;
        const y = 758 + Math.max(0, (112 - altura) / 2) - Math.max(0, altura - 118) * 0.35;
        const raio = Math.min(46, altura / 2);

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = COR.pilula;
        ctx.beginPath();
        ctx.roundRect(x, y, largura, altura, raio);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        linhas.forEach((linha, i) => {
            ctx.fillText(linha, LARGURA / 2, y + 22 + alturaLinha * i + alturaLinha / 2);
        });
    }

    function desenharPontos(ctx) {
        ctx.fillStyle = COR.pontos;
        for (let c = 0; c < 3; c++) {
            for (let l = 0; l < 4; l++) {
                ctx.beginPath();
                ctx.arc(785 + c * 55, 655 + l * 60, 7, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // ── Recorte do fundo claro da foto ──────────────────────────────────────

    function distancia(a, b) {
        const dr = a[0] - b[0];
        const dg = a[1] - b[1];
        const db = a[2] - b[2];
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    /**
     * Recorta o fundo quando a borda da foto é de uma cor só e clara (mesa,
     * papel, parede). Preenche a partir das bordas tudo o que for parecido
     * com essa cor. Fundo com textura ou escuro: devolve a foto como está.
     */
    function recortarFundoClaro(imagem) {
        const escala = Math.min(1, 900 / Math.max(imagem.width, imagem.height));
        const w = Math.round(imagem.width * escala);
        const h = Math.round(imagem.height * escala);
        const tela = document.createElement('canvas');
        tela.width = w;
        tela.height = h;
        const ctx = tela.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(imagem, 0, 0, w, h);
        const quadro = ctx.getImageData(0, 0, w, h);
        const px = quadro.data;
        const cor = (i) => [px[i * 4], px[i * 4 + 1], px[i * 4 + 2]];

        // Amostra da borda.
        const borda = [];
        for (let x = 0; x < w; x += 3) { borda.push(x); borda.push((h - 1) * w + x); }
        for (let y = 0; y < h; y += 3) { borda.push(y * w); borda.push(y * w + w - 1); }
        const media = [0, 1, 2].map((c) => borda.reduce((s, i) => s + px[i * 4 + c], 0) / borda.length);
        const desvio = Math.sqrt(borda.reduce((s, i) => s + distancia(cor(i), media) ** 2, 0) / borda.length);
        const claro = (media[0] + media[1] + media[2]) / 3 > 150;
        if (desvio > 26 || !claro) return { imagem: tela, recortado: false };

        const limite = 34 + desvio * 0.8;
        const fundo = new Uint8Array(w * h);
        const fila = new Int32Array(w * h);
        let ini = 0;
        let fim = 0;
        borda.forEach((i) => {
            if (!fundo[i] && distancia(cor(i), media) < limite) { fundo[i] = 1; fila[fim++] = i; }
        });
        while (ini < fim) {
            const i = fila[ini++];
            const x = i % w;
            const y = (i / w) | 0;
            const vizinhos = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1];
            for (const v of vizinhos) {
                if (v >= 0 && !fundo[v] && distancia(cor(v), media) < limite) { fundo[v] = 1; fila[fim++] = v; }
            }
        }

        const removidos = fim / (w * h);
        // Quase nada ou quase tudo removido: a detecção não é confiável.
        if (removidos < 0.08 || removidos > 0.92) return { imagem: tela, recortado: false };

        // Transparência com borda suave e a caixa do que sobrou.
        let minX = w; let minY = h; let maxX = 0; let maxY = 0;
        for (let i = 0; i < w * h; i++) {
            if (fundo[i]) {
                px[i * 4 + 3] = 0;
                continue;
            }
            const x = i % w;
            const y = (i / w) | 0;
            const perto = (x > 0 && fundo[i - 1]) || (x < w - 1 && fundo[i + 1]) || (y > 0 && fundo[i - w]) || (y < h - 1 && fundo[i + w]);
            if (perto) {
                const d = distancia(cor(i), media);
                px[i * 4 + 3] = Math.round(255 * Math.min(1, Math.max(0.25, (d - limite * 0.5) / limite)));
            }
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
        ctx.putImageData(quadro, 0, 0);

        const recorte = document.createElement('canvas');
        recorte.width = maxX - minX + 1;
        recorte.height = maxY - minY + 1;
        recorte.getContext('2d').drawImage(tela, minX, minY, recorte.width, recorte.height, 0, 0, recorte.width, recorte.height);
        return { imagem: recorte, recortado: true };
    }

    // ── API ─────────────────────────────────────────────────────────────────

    function carregarImagem(arquivoOuUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = typeof arquivoOuUrl === 'string' ? arquivoOuUrl : URL.createObjectURL(arquivoOuUrl);
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Não foi possível abrir a imagem.'));
            img.src = url;
        });
    }

    /**
     * Monta a arte. opcoes.recortarFundo (padrão true) tenta tirar o fundo
     * claro da foto. Devolve { canvas, recortado }.
     */
    async function montar(imagem, nome, opcoes) {
        const config = { recortarFundo: true, ...(opcoes || {}) };
        if (document.fonts && document.fonts.load) {
            try { await document.fonts.load('800 34px Montserrat'); } catch (e) { /* segue com a reserva */ }
        }

        let produto = imagem;
        let recortado = false;
        if (config.recortarFundo) {
            const r = recortarFundoClaro(imagem);
            produto = r.imagem;
            recortado = r.recortado;
        }

        const canvas = document.createElement('canvas');
        canvas.width = LARGURA;
        canvas.height = ALTURA;
        const ctx = canvas.getContext('2d');

        desenharCenario(ctx);
        desenharPapelRasgado(ctx, [LARGURA * 0.5, -10], [LARGURA + 10, ALTURA * 0.3], [[LARGURA, 0], [LARGURA, 0]], 7);
        desenharPapelRasgado(ctx, [-10, ALTURA * 0.83], [LARGURA * 0.32, ALTURA + 10], [[0, ALTURA], [0, ALTURA]], 13);
        desenharPontos(ctx);
        const pedestal = desenharPedestal(ctx);
        desenharProduto(ctx, produto, pedestal);
        desenharPilula(ctx, nome);

        return { canvas, recortado };
    }

    /** Canvas → data URL WebP dentro do limite da API (MAX_IMAGEM em api/loja.js). */
    function exportar(canvas, limite) {
        const maximo = limite || 650000;
        for (const qualidade of [0.86, 0.78, 0.68, 0.55]) {
            const url = canvas.toDataURL('image/webp', qualidade);
            if (url.startsWith('data:image/webp') && url.length < maximo) return url;
        }
        // Navegador sem WebP no canvas (Safari antigo): PNG preserva a
        // transparência da foto base; JPEG só como último recurso.
        const png = canvas.toDataURL('image/png');
        if (png.length < maximo) return png;
        return canvas.toDataURL('image/jpeg', 0.7);
    }

    /**
     * A foto recortada do produto, guardada para remontar a arte quando o nome
     * muda. Mantém a transparência (WebP) e cabe no MAX_FOTO_BASE da API.
     */
    function exportarBase(imagem) {
        for (const lado of [700, 520, 400]) {
            const escala = Math.min(1, lado / Math.max(imagem.width, imagem.height));
            const tela = document.createElement('canvas');
            tela.width = Math.max(1, Math.round(imagem.width * escala));
            tela.height = Math.max(1, Math.round(imagem.height * escala));
            tela.getContext('2d').drawImage(imagem, 0, 0, tela.width, tela.height);
            const url = exportar(tela, 290000);
            if (url.length < 290000) return url;
        }
        return null;
    }

    /** Recorte isolado, para o painel guardar a foto base antes de montar a arte. */
    function recortar(imagem) {
        return recortarFundoClaro(imagem);
    }

    window.BirdTechFundo = { montar, recortar, exportar, exportarBase, carregarImagem, LARGURA, ALTURA };
})();
