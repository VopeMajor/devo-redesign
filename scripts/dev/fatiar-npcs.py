#!/usr/bin/env python3
"""
Fatia as folhas de expressões dos NPCs (OCs do dono) em sprites individuais.

Entrada : docs/redesign/refs/npc-oc/<arquivo>.png — folha 4 colunas × 3 linhas = 12 expressões, PNG RGBA.
Saída   : public/images/npc/<id>/<expressao>.webp (WebP com alfa, qualidade alta)
          + public/images/npc/<id>/manifest.json (célula → expressão, enquadramento) — conferência humana.

Como funciona (nada de tamanho fixo):
  1. Grade: a partir da transparência, procura as 2 "costuras" horizontais de menor opacidade perto de 1/3 e 2/3 da
     altura, e em cada faixa as 3 costuras verticais perto de 1/4, 2/4 e 3/4 da largura. As costuras são caminhos
     de custo mínimo (programação dinâmica), então contornam mãos/cabelos que invadem a célula vizinha.
  2. Recorte: cada célula vira uma máscara; ficam só os pedaços opacos grandes (somem cisco, halos e restos de
     fundo com alfa baixo) e a transparência em volta é aparada.
  3. Normalização: todas as expressões de todos os NPCs vão para a MESMA tela (LARGURA×ALTURA), na MESMA escala de
     cabeça (`cabeca` = altura topo-do-crânio→queixo na folha, medida à mão numa célula de referência) e com o
     queixo da referência numa linha fixa. Dentro de um NPC, as 12 células usam o mesmo deslocamento, ancorado na linha de
     corte do busto (base) e no centro do tronco — trocar de expressão não faz o retrato "pular".

Uso:  python3 scripts/dev/fatiar-npcs.py            (todos)
      python3 scripts/dev/fatiar-npcs.py galo rato  (só alguns)
      python3 scripts/dev/fatiar-npcs.py --debug=DIR (salva provas de conferência em DIR; padrão /tmp/fatiar-npcs)
Requer Pillow, numpy e scipy.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

RAIZ = Path(__file__).resolve().parents[2]
ORIGEM = RAIZ / 'docs/redesign/refs/npc-oc'
DESTINO = RAIZ / 'public/images/npc'

# Tela comum a todos os sprites. Mais larga que o arco 3:4 do PortraitFrame (que recorta com object-cover)
# para caber mãos e braços abertos sem corte. Cabeça entre ~17% e ~53% da altura: acima sobra lugar para
# chapéu/mãos; abaixo do queixo o busto desce até a linha de corte, que o PortraitFrame dissolve em degradê.
LARGURA, ALTURA = 1080, 960
# Altura da cabeça (topo do crânio → queixo) na tela, e onde fica o queixo da célula de referência.
CABECA_PX = 345
QUEIXO_Y = 508
QUALIDADE = 90

# Vocabulário único de expressões (mesmo para todos os NPCs). Cada NPC usa 12 destes nomes,
# sempre o mais próximo do que a célula mostra; `padrao` é a expressão de repouso do NPC.
VOCABULARIO = [
    'neutro', 'sorriso', 'riso', 'malicia', 'piscadela', 'confiante', 'convite', 'apresenta', 'explica',
    'pensativo', 'entediado', 'desdem', 'serio', 'sombrio', 'trama', 'segredo', 'timido', 'animado',
    'surpreso', 'preocupado', 'triste', 'irritado', 'furioso',
]

# Por NPC: arquivo da folha; `ref` = célula de referência para medir a escala; `topo`/`queixo` = topo do crânio
# (sem chapéu, crista ou espetos de cabelo) e ponta do queixo/mandíbula NA CÉLULA APARADA, em px da folha;
# `fator` (opcional) reduz a escala de criaturas de cabeça pequena para o corpo (Rato, Javali), senão o busto
# estoura a tela; `celulas` = nome de cada célula em ordem de leitura (linha a linha, esquerda → direita).
NPCS: dict[str, dict] = {
    'melissa': {
        'arquivo': 'melissa.png', 'ref': 6, 'topo': 8, 'queixo': 205,
        'celulas': ['convite', 'explica', 'riso', 'preocupado',
                    'pensativo', 'timido', 'confiante', 'surpreso',
                    'animado', 'apresenta', 'triste', 'sorriso'],
    },
    'galo': {
        'arquivo': 'galo.png', 'ref': 0, 'topo': 30, 'queixo': 228,
        'celulas': ['neutro', 'malicia', 'riso', 'desdem',
                    'irritado', 'surpreso', 'timido', 'sorriso',
                    'sombrio', 'piscadela', 'entediado', 'confiante'],
    },
    'herdeiro': {
        'arquivo': 'herdeiro.png', 'ref': 0, 'topo': 8, 'queixo': 222,
        'celulas': ['neutro', 'malicia', 'confiante', 'riso',
                    'irritado', 'furioso', 'entediado', 'desdem',
                    'sorriso', 'surpreso', 'timido', 'trama'],
    },
    'javali': {
        'arquivo': 'javali.png', 'ref': 0, 'topo': 10, 'queixo': 148, 'fator': 0.82,
        'celulas': ['neutro', 'convite', 'trama', 'riso',
                    'pensativo', 'desdem', 'entediado', 'explica',
                    'furioso', 'surpreso', 'timido', 'sombrio'],
    },
    'rato': {
        'arquivo': 'rato.png', 'ref': 1, 'topo': 20, 'queixo': 168, 'fator': 0.8,
        'celulas': ['convite', 'malicia', 'desdem', 'surpreso',
                    'trama', 'pensativo', 'apresenta', 'triste',
                    'confiante', 'segredo', 'sorriso', 'irritado'],
    },
    'coruja': {
        'arquivo': 'Coruja.png', 'ref': 0, 'topo': 8, 'queixo': 205,
        'celulas': ['neutro', 'sorriso', 'piscadela', 'riso',
                    'desdem', 'preocupado', 'surpreso', 'serio',
                    'irritado', 'triste', 'timido', 'malicia'],
    },
}

ALFA_MASCARA = 64     # opacidade mínima para contar como "figura" na detecção
ALFA_CISCO = 14       # abaixo disso o pixel vira transparente (halo/ruído da remoção de fundo)
PEDACO_MIN = 0.004    # pedaços menores que isso (fração da maior parte da célula) são descartados


def costura(custo: np.ndarray) -> np.ndarray:
    """Caminho de custo mínimo de cima a baixo (uma posição por linha), passo de no máx. 1 px por linha."""
    h, w = custo.shape
    acc = custo.astype(np.float64).copy()
    for y in range(1, h):
        prev = acc[y - 1]
        esq = np.r_[np.inf, prev[:-1]]
        dir_ = np.r_[prev[1:], np.inf]
        acc[y] += np.minimum(np.minimum(esq, prev), dir_)
    caminho = np.zeros(h, dtype=int)
    caminho[-1] = int(np.argmin(acc[-1]))
    for y in range(h - 2, -1, -1):
        x = caminho[y + 1]
        lo, hi = max(0, x - 1), min(w, x + 2)
        caminho[y] = lo + int(np.argmin(acc[y, lo:hi]))
    return caminho


def custo_de(alfa: np.ndarray) -> np.ndarray:
    # opacidade + pequena penalidade constante (prefere caminhos retos no vazio)
    return (alfa.astype(np.float64) / 255.0) * 50.0 + 0.02


def grade(rgba: np.ndarray, linhas=3, colunas=4, folga=0.14) -> list[np.ndarray]:
    """Devolve 12 máscaras booleanas (ordem de leitura) separando as células por costuras."""
    alfa = rgba[:, :, 3]
    h, w = alfa.shape
    custo = custo_de(alfa)
    ys = np.arange(h)[:, None]
    xs = np.arange(w)[None, :]

    # 1) costuras horizontais (caminho da esquerda para a direita → transpor)
    cortes_h = []
    for i in range(1, linhas):
        y0 = int(h * (i / linhas - folga)); y1 = int(h * (i / linhas + folga))
        cortes_h.append(costura(custo[y0:y1, :].T) + y0)  # y por coluna x

    def verticais(bordas, r):
        faixa_r = (ys >= bordas[r][None, :]) & (ys < bordas[r + 1][None, :])
        top = int(bordas[r].min()); bot = int(bordas[r + 1].max())
        cortes_v = []
        for j in range(1, colunas):
            x0 = int(w * (j / colunas - folga * 0.8)); x1 = int(w * (j / colunas + folga * 0.8))
            sub = custo[top:bot, x0:x1].copy()
            sub[~faixa_r[top:bot, x0:x1]] = 0.02  # fora da faixa desta linha não atrapalha
            cortes_v.append(costura(sub) + x0)  # x por linha y (top..bot)
        return faixa_r, top, bot, [np.full(bot - top, 0)] + cortes_v + [np.full(bot - top, w)]

    # 2) onde o busto de cima ENCOSTA na cabeça de baixo (costura passando por pixel opaco), troca a costura
    #    pela linha reta de corte daquele busto: o percentil 90 da última linha opaca das colunas que não encostam.
    bordas = [np.full(w, 0)] + cortes_h + [np.full(w, h)]
    for i in range(1, linhas):
        s_ = bordas[i]
        _, top, bot, bv = verticais(bordas, i - 1)
        fim = [v[-1] for v in bv]  # colunas das células de cima, na base da faixa
        for c in range(colunas):
            xa, xb = int(fim[c]), int(fim[c + 1])
            colunas_x = np.arange(xa, xb)
            encosta = alfa[np.clip(s_[colunas_x], 0, h - 1), colunas_x] >= ALFA_MASCARA
            fundos = []
            for x in colunas_x[~encosta]:
                trecho = alfa[max(0, s_[x] - 80):s_[x], x] >= ALFA_MASCARA
                if trecho.any():
                    fundos.append(max(0, s_[x] - 80) + int(np.nonzero(trecho)[0].max()))
            if not fundos or not encosta.any():
                continue
            corte = int(np.percentile(fundos, 90)) + 1
            for x in colunas_x[encosta]:
                if s_[x] - 80 < corte < s_[x] + 40:
                    s_[x] = corte

    # 3) máscaras finais
    mascaras = []
    for r in range(linhas):
        faixa_r, top, bot, bv = verticais(bordas, r)
        for c in range(colunas):
            m = np.zeros((h, w), bool)
            m[top:bot] = (xs >= bv[c][:, None]) & (xs < bv[c + 1][:, None])
            mascaras.append(m & faixa_r)
    return mascaras


def recorta(rgba: np.ndarray, celula: np.ndarray) -> tuple[np.ndarray, tuple[int, int]]:
    """Recorta a figura da célula, limpa ciscos e apara a transparência. Devolve (rgba, (x0, y0) na folha)."""
    alfa = rgba[:, :, 3]
    figura = celula & (alfa >= ALFA_MASCARA)
    lab, n = ndi.label(figura)
    if n == 0:
        raise RuntimeError('célula vazia')
    tam = ndi.sum(figura, lab, range(1, n + 1))
    manter = np.zeros(n + 1, bool)
    manter[1:] = tam >= tam.max() * PEDACO_MIN
    nucleo = manter[lab]
    # devolve a borda suave (antialias) em volta do que ficou
    zona = ndi.binary_dilation(nucleo, iterations=3) & celula
    out = rgba.copy()
    a = np.where(zona, alfa, 0)
    a[a < ALFA_CISCO] = 0
    out[:, :, 3] = a
    ys, xs = np.nonzero(a)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    return out[y0:y1, x0:x1], (int(x0), int(y0))


def ancora(sprite: np.ndarray) -> tuple[float, float]:
    """(x do centro do tronco, y da linha de corte do busto) no sprite aparado."""
    a = sprite[:, :, 3] >= 128
    h = a.shape[0]
    larg = a.sum(axis=1)
    # linha de corte: última linha com largura "de tronco" (≥ 35% da maior largura)
    linhas = np.nonzero(larg >= larg.max() * 0.35)[0]
    base = float(linhas.max() + 1)
    faixa = a[max(0, int(base) - max(8, h // 12)):int(base)]
    xs = np.nonzero(faixa)[1]
    # centro do tronco = mediana das colunas opacas da base (resiste a braços abertos)
    cx = float(np.median(xs)) if xs.size else a.shape[1] / 2
    return cx, base


def processa(npc_id: str, cfg: dict, debug: Path | None) -> dict:
    folha = np.array(Image.open(ORIGEM / cfg['arquivo']).convert('RGBA'))
    mascaras = grade(folha)
    sprites = [recorta(folha, m) for m in mascaras]
    if debug:
        dbg = Image.fromarray(folha).convert('RGBA')
        fundo = Image.new('RGBA', dbg.size, (40, 44, 60, 255))
        fundo.alpha_composite(dbg)
        d = ImageDraw.Draw(fundo)
        for i, (sp, (x0, y0)) in enumerate(sprites):
            d.rectangle([x0, y0, x0 + sp.shape[1], y0 + sp.shape[0]], outline=(255, 60, 60, 255), width=2)
            d.text((x0 + 6, y0 + 6), str(i), fill=(255, 255, 0, 255))
        fundo.convert('RGB').save(debug / f'{npc_id}-grade.jpg', quality=80)

    nomes = cfg['celulas']
    if len(nomes) != 12 or len(set(nomes)) != 12:
        raise SystemExit(f'{npc_id}: o mapa de células precisa de 12 nomes distintos')
    for n in nomes:
        if n not in VOCABULARIO:
            raise SystemExit(f'{npc_id}: "{n}" fora do vocabulário')

    escala = CABECA_PX / float(cfg['queixo'] - cfg['topo']) * cfg.get('fator', 1.0)
    referencia, _ = sprites[cfg['ref']]
    _, nbase = ancora(referencia)
    # deslocamento: o queixo da referência vai para QUEIXO_Y; o tronco fica centrado na tela
    oy = QUEIXO_Y - cfg['queixo'] * escala
    base_y = oy + nbase * escala  # linha de corte comum a todas as expressões deste NPC
    pasta = DESTINO / npc_id
    pasta.mkdir(parents=True, exist_ok=True)
    for velho in pasta.glob('*.webp'):
        velho.unlink()
    info = {'celulas': {}, 'escala': round(escala, 4), 'linhaDeCorte': round(base_y / ALTURA, 4)}
    for i, (sp, _) in enumerate(sprites):
        cx, base = ancora(sp)  # noqa: E501
        img = Image.fromarray(sp)
        w, h = round(sp.shape[1] * escala), round(sp.shape[0] * escala)
        img = img.resize((w, h), Image.LANCZOS)
        x = round(LARGURA / 2 - cx * escala)
        y = round(base_y - base * escala)
        tela = Image.new('RGBA', (LARGURA, ALTURA), (0, 0, 0, 0))
        # recorta o que sair da tela (laterais e topo contam como corte; a base passar da borda é o esperado)
        sx0, sy0 = max(0, -x), max(0, -y)
        sx1, sy1 = min(w, LARGURA - x), min(h, ALTURA - y)
        tela.alpha_composite(img.crop((sx0, sy0, sx1, sy1)), (x + sx0, y + sy0))
        a_img = np.array(img)[:, :, 3] >= 128
        corte = int(a_img[:, :sx0].sum() + a_img[:, sx1:].sum() + a_img[:sy0, sx0:sx1].sum())
        if corte > 200:
            print(f'  aviso: {npc_id}/{nomes[i]} perde {corte} px opacos nas laterais/topo')
        nome = nomes[i]
        tela.save(pasta / f'{nome}.webp', 'WEBP', quality=QUALIDADE, method=6, alpha_quality=95)
        info['celulas'][str(i)] = nome
        if debug:
            prova = Image.new('RGBA', (LARGURA, ALTURA), (60, 64, 80, 255))
            prova.alpha_composite(tela)
            d = ImageDraw.Draw(prova)
            topo = QUEIXO_Y - CABECA_PX
            for yy, cor in ((topo, (0, 255, 255, 255)), (QUEIXO_Y, (255, 0, 255, 255)), (base_y, (255, 255, 0, 255))):
                d.line([(0, yy), (LARGURA, yy)], fill=cor, width=2)
            d.text((10, 10), f'{i} {nome}', fill=(255, 255, 255, 255))
            prova.convert('RGB').resize((LARGURA // 3, ALTURA // 3)).save(debug / f'{npc_id}-{i:02d}.jpg', quality=80)
    if debug:
        provas = [Image.open(debug / f'{npc_id}-{i:02d}.jpg') for i in range(12)]
        pw, ph = provas[0].size
        mosaico = Image.new('RGB', (pw * 4, ph * 3))
        for i, p in enumerate(provas):
            mosaico.paste(p, ((i % 4) * pw, (i // 4) * ph))
        mosaico.save(debug / f'{npc_id}-mosaico.jpg', quality=85)
    (pasta / 'manifest.json').write_text(json.dumps(info, ensure_ascii=False, indent=2) + '\n')
    return info


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dbg = [a for a in sys.argv[1:] if a.startswith('--debug')]
    debug = Path(dbg[0].split('=', 1)[1] if '=' in dbg[0] else '/tmp/fatiar-npcs') if dbg else None
    if debug:
        debug.mkdir(parents=True, exist_ok=True)
    for npc_id in args or NPCS:
        info = processa(npc_id, NPCS[npc_id], debug)
        print(npc_id, info['celulas'])


if __name__ == '__main__':
    main()
