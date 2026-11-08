"""Chibi fofo do jogador em peças (dono, 07/11: "deixe eles mais bonitinhos. estilo ddtank" → prova → "Aprovo").
Entrada (gerada no Codex, art-src/chibi-fofo/):
  f-base/base.png   corpo careca já vestido (roupa 1), andando: 4 linhas (frente, esquerda, direita, costas) x 4 passos;
  f-cab1/cabelo.png o cabelo 1 pintado só em azul (para virar camada de cinza), 4 vistas paradas.
Saída (art/avatar/fofo/):
  roupa-1-f.png   4 linhas x 9 colunas de 80x96: 0..3 andar, 4 parado, 5 piscar, 6 peito (tronco 1 px acima),
                  7/8 olhar para a esquerda/direita (a íris anda 1 px);
  roupa-1-f-mascara.png  mesma grade: vermelho = pele (recebe a cor de pele), verde = íris (recebe a cor dos olhos);
  cabelo-1.png    4 vistas de 80x96 em cinza (a cor vem de pintaCabelo no cliente);
  ancoras.json    por coluna e linha da roupa, onde a cabeça está em relação ao quadro parado (o cabelo acompanha).
Tudo em pixel inteiro: a redução é por bloco (mediana), nada de girar ou escalar no cliente.
Generalizado (dono, 07/11: "Aprovo" → o resto das peças; "não é pra todo chibi ter a mesma expressão"): 6 roupas x 2
corpos, 18 cabelos e 18 rostos. Roupa: roupa-<n>-<f|m>.png + -mascara.png + .json (âncoras, testa, desvio da cabeça em
relação à roupa 1 feminina, que é a referência). Cabelo: cabelo-<n>.png. Rosto: rosto-<n>.png + -mascara.png (4
variações x 3 vistas). Todas as cabeças têm o mesmo tamanho, então qualquer cabelo e rosto servem em qualquer roupa.
Uso: python -I art-src/chibi_fofo.py [roupas|cabelos|rostos|tudo]  (a partir de docs/redesign/v2/kit3)"""
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image

AQUI = Path(sys.argv[0]).resolve().parent
FONTE = AQUI / 'chibi-fofo'
ART = AQUI.parent / 'art' / 'avatar' / 'fofo'
ART.mkdir(parents=True, exist_ok=True)
CW, CH, SOLA = 80, 96, 94
OLHO_PE = 44  # distância do olho ao pé na prova aprovada (olho na linha 50 com o pé na 94)


def mascara(a):
    if fundo_magenta(a):  # roupa 6: a capa é verde, o fundo é magenta
        return ~((a[..., 0] - a[..., 1] > 60) & (a[..., 2] - a[..., 1] > 60))
    return (a[..., 1] - np.maximum(a[..., 0], a[..., 2])) < 60


def blocos(m, eixo, min_len=60, gap=6):
    idx = np.where(m.any(eixo))[0]
    gs = np.split(idx, np.where(np.diff(idx) > gap)[0] + 1)
    return [g for g in gs if len(g) > min_len]


def reduz(c, m, esc):
    h, w = m.shape
    nh, nw = max(1, round(h * esc)), max(1, round(w * esc))
    s = np.zeros((nh, nw, 4), np.uint8)
    ys = np.linspace(0, h, nh + 1).round().astype(int)
    xs = np.linspace(0, w, nw + 1).round().astype(int)
    for j in range(nh):
        for i in range(nw):
            bm = m[ys[j]:ys[j + 1], xs[i]:xs[i + 1]]
            if bm.size == 0 or bm.mean() < .5:
                continue
            px = c[ys[j]:ys[j + 1], xs[i]:xs[i + 1]][bm]
            s[j, i, :3] = np.median(px, axis=0)
            s[j, i, 3] = 255
    return s


def iris(c):
    """íris cinza neutra: pouca saturação, luz média"""
    a = c.astype(int)
    sat = a[..., :3].max(-1) - a[..., :3].min(-1)
    lum = .3 * a[..., 0] + .59 * a[..., 1] + .11 * a[..., 2]
    # íris cinza fria (azulada): o brilho da pele da cabeça careca é cinza quente e não entra
    return (sat < 26) & (lum > 70) & (lum < 190) & (a[..., 2] >= a[..., 0] - 2)


def pele(c):
    a = c.astype(int)
    lum = .3 * a[..., 0] + .59 * a[..., 1] + .11 * a[..., 2]
    return (a[..., 0] - a[..., 2] > 30) & (a[..., 0] >= a[..., 1]) & (lum > 95) & (a[..., 3] > 0)


def linha_olho(c, m):
    """linha média dos olhos no recorte original (só a metade de cima)"""
    h = c.shape[0]
    ir = iris(c) & m
    ir[h // 2:] = False
    ys = np.where(ir.any(1))[0]
    return None if not len(ys) else (ys[0] + ys[-1]) / 2


def recortes(caminho, linhas, colunas):
    a = np.asarray(Image.open(caminho).convert('RGB')).astype(np.int16)
    m = mascara(a)
    fil = blocos(m, 1)[:linhas] if linhas > 1 else [np.where(m.any(1))[0]]
    out = []
    for g in fil:
        sub = m[g[0]:g[-1] + 1]
        cols = blocos(sub, 0)[:colunas]
        assert len(cols) == colunas, (caminho, len(cols))
        linha = []
        for b in cols:
            mm = sub[:, b[0]:b[-1] + 1]
            ys = np.where(mm.any(1))[0]
            c = a[g[0]:g[-1] + 1, b[0]:b[-1] + 1][ys[0]:ys[-1] + 1].astype(np.uint8)
            linha.append((c, mm[ys[0]:ys[-1] + 1]))
        out.append(linha)
    return out


def escala(c, m):
    y = linha_olho(c, m)
    return OLHO_PE / (c.shape[0] - y)


def assenta(q, folha, l, k, cx=None):
    """põe o quadro reduzido na célula: pé na linha SOLA, centro da cabeça no meio"""
    h, w = q.shape[:2]
    cab = np.where(q[:h // 3, :, 3].any(0))[0]
    centro = (cab[0] + cab[-1]) // 2 if cx is None else cx
    x, y = CW * k + CW // 2 - centro, CH * l + SOLA - h
    reg = folha[y:y + h, x:x + w]
    mk = q[..., 3] > 0
    reg[mk] = q[mk]
    return x - CW * k, y - CH * l


def cabeca(q):
    """topo da cabeça (calva) e centro dela, no quadro reduzido"""
    al = q[..., 3] > 0
    ys = np.where(al.any(1))[0]
    topo = ys[0]
    faixa = al[topo:topo + 8]
    xs = np.where(faixa.any(0))[0]
    return topo, (xs[0] + xs[-1]) / 2


def olhos_fechados(cel, msk):
    """piscar: a íris e o branco do olho viram pele e ganham uma linha de cílio em arco a 60% da altura"""
    q = cel.copy()
    ir = msk[..., 1] > 0
    if not ir.any():
        return q
    al = q[..., 3] > 0
    peles = q[(msk[..., 0] > 0) & al][:, :3]
    if not len(peles):
        return q
    tom = np.median(peles, 0).astype(np.uint8)
    cols = sorted(set(np.where(ir)[1]))
    grupos = []
    for x in cols:
        if grupos and x - grupos[-1][1] <= 2:
            grupos[-1][1] = x
        else:
            grupos.append([x, x])
    for gx0, gx1 in grupos:
        ys = np.where(ir[:, gx0:gx1 + 1].any(1))[0]
        y0, y1 = ys[0], ys[-1]
        a = q.astype(int)
        lum = .3 * a[..., 0] + .59 * a[..., 1] + .11 * a[..., 2]
        for yy in range(y0 - 2, y1 + 2):
            for xx in range(gx0 - 1, gx1 + 2):
                if 0 <= yy < q.shape[0] and 0 <= xx < q.shape[1] and al[yy, xx] and not msk[yy, xx, 0] and (ir[yy, xx] or lum[yy, xx] < 80 or lum[yy, xx] > 200):
                    q[yy, xx, :3] = tom
        ly = y0 + round((y1 - y0) * .6)
        for xx in range(gx0 - 1, gx1 + 2):
            ponta = xx in (gx0 - 1, gx1 + 1)
            q[ly + (1 if ponta else 0), xx, :3] = (58, 36, 44)
    return q


def olhar(cel, msk, d):
    """a íris anda 1 px para o lado dentro do olho"""
    q = cel.copy()
    ir = msk[..., 1] > 0
    for y, x in zip(*np.where(ir)):
        sx = x - d
        if 0 <= sx < q.shape[1] and ir[y, sx]:
            q[y, x] = cel[y, sx]
        else:
            q[y, x, :3] = np.clip(cel[y, x, :3].astype(int) + 60, 0, 255)  # sobra: branco do olho
    return q


# colunas da folha fofo (crítico de animação, 07/11): 0..7 andar em 8 desenhos (contato, baixo, passagem, alto, contato,
# baixo, passagem, alto), 8 parado (os dois pés no chão), 9 piscar, 10 peito, 11/12 olhar com a íris, 13 piscar com o peito
# levantado, 14 assentar (cabeça e tronco 1 px abaixo, pés no chão)
PARADO, NCOL = 8, 15
# altura da cabeça em cada passo, definida aqui (não herdada do desenho): contato 0, baixo +1, passagem 0, alto -1
BOB8 = [0, 1, 0, -1, 0, 1, 0, -1]


def queixo_de(cel, msk):
    """última linha de pele do rosto, descendo do olho pelo meio da cabeça"""
    topo, cx = cabeca(cel)
    ir = np.where(msk[..., 1].any(1))[0]
    y = ir[-1] if len(ir) else topo + 22
    cx = int(round(cx))
    while y < CH - 1 and (msk[y + 1, cx - 4:cx + 5, 0] > 0).any():
        y += 1
    return y + 1


def desloca(cel, msk, y0, y1, d):
    """move as linhas y0..y1 (exclusivo) d px na vertical, o resto fica"""
    c, m = cel.copy(), msk.copy()
    faixa, fm = cel[y0:y1].copy(), msk[y0:y1].copy()
    c[y0:y1] = 0; m[y0:y1] = 0
    c[y0:y1][:0] = 0
    for yy in range(y1 - y0):
        t = y0 + yy + d
        if 0 <= t < CH:
            k = faixa[yy, :, 3] > 0
            c[t][k] = faixa[yy][k]; m[t][k] = fm[yy][k]
    # o que ficou por baixo (pernas) continua
    for yy in range(y0, y1):
        k = (c[yy, :, 3] == 0) & (cel[yy, :, 3] > 0) & (yy >= y1 - 1)
        c[yy][k] = cel[yy][k]; m[yy][k] = msk[yy][k]
    return c, m


def so_massa(h):
    """fica só a maior região ligada do cabelo (e as que tiverem pelo menos 15% dela)"""
    al = h[..., 3] > 0
    rot = np.zeros(al.shape, int); n = 0; tam = []
    for y0, x0 in zip(*np.where(al)):
        if rot[y0, x0]:
            continue
        n += 1; pilha = [(y0, x0)]; rot[y0, x0] = n; c = 0
        while pilha:
            y, x = pilha.pop(); c += 1
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
                v, u = y + dy, x + dx
                if 0 <= v < al.shape[0] and 0 <= u < al.shape[1] and al[v, u] and not rot[v, u]:
                    rot[v, u] = n; pilha.append((v, u))
        tam.append(c)
    if not tam:
        return h
    maior = max(tam)
    fica = np.isin(rot, [i + 1 for i, t in enumerate(tam) if t >= .15 * maior])
    h = h.copy(); h[~fica] = 0
    return h


def fundo_magenta(a):
    c = a[:8, :8].reshape(-1, 3).mean(0)
    return c[0] > 150 and c[2] > 150 and c[1] < 100


def larg(c, m):
    """largura da cabeça no terço de cima do desenho"""
    ys = np.where(m.any(1))[0]; topo = ys[0]; alt = ys[-1] - topo
    return max(np.ptp(np.where(m[y])[0]) for y in range(topo, topo + int(alt * .4)) if m[y].any())


def olhos(c, m, metade=.6):
    """centros dos dois olhos (íris cinza) na vista de frente, da esquerda para a direita"""
    ir = iris(c) & m
    ir[int(c.shape[0] * metade):] = False
    ys, xs = np.where(ir)
    if not len(xs):
        return None
    meio = (xs.min() + xs.max()) / 2
    e, d = xs < meio, xs >= meio
    if not e.any() or not d.any():
        return None
    return [(ys[e].mean(), xs[e].mean()), (ys[d].mean(), xs[d].mean())]


def espaco(c, m):
    o = olhos(c, m)
    return None if o is None else o[1][1] - o[0][1]


def queixo_src(c, m):
    a = c.astype(int); lum = .3 * a[..., 0] + .59 * a[..., 1] + .11 * a[..., 2]
    sk = (a[..., 0] - a[..., 2] > 30) & (a[..., 0] >= a[..., 1]) & (lum > 95) & m
    sk[int(c.shape[0] * .52):] = False
    return np.where(sk.any(1))[0].max() + 1


def reduz2(c, m, ex, ey):
    h, w = m.shape
    nh, nw = max(1, round(h * ey)), max(1, round(w * ex))
    out = np.zeros((nh, nw, 4), np.uint8)
    ys = np.linspace(0, h, nh + 1).round().astype(int); xs = np.linspace(0, w, nw + 1).round().astype(int)
    for j in range(nh):
        for i in range(nw):
            bm = m[ys[j]:ys[j + 1], xs[i]:xs[i + 1]]
            if bm.size == 0 or bm.mean() < .5:
                continue
            out[j, i, :3] = np.median(c[ys[j]:ys[j + 1], xs[i]:xs[i + 1]][bm], axis=0); out[j, i, 3] = 255
    return out


def mascaras(folha, linhas_rosto=3):
    msk = np.zeros_like(folha)
    msk[..., 0] = np.where(pele(folha), 255, 0)
    ir = iris(folha) & (folha[..., 3] > 0)
    for l in range(folha.shape[0] // CH):
        ir[CH * l + 58:CH * (l + 1)] = False
    msk[..., 1] = np.where(ir, 255, 0)
    msk[..., 3] = np.where(folha[..., 3] > 0, 255, 0)
    return msk


def limpa_fundo(folha, magenta):
    """sobra do fundo nas bordas: verde puxado vira neutro (ou magenta, na roupa 6); pixel solto sai"""
    a = folha.astype(int); al = folha[..., 3] > 0
    if magenta:
        dentro = al & np.roll(al, 1, 0) & np.roll(al, -1, 0) & np.roll(al, 1, 1) & np.roll(al, -1, 1)
        dentro2 = dentro & np.roll(dentro, 1, 0) & np.roll(dentro, -1, 0) & np.roll(dentro, 1, 1) & np.roll(dentro, -1, 1)
        sobra = al & ~dentro2 & (a[..., 0] > a[..., 1] + 25) & (a[..., 2] > a[..., 1] + 25)
        folha[sobra, 0] = np.minimum(a[..., 1] + 12, 255)[sobra]
        folha[sobra, 2] = np.minimum(a[..., 1] + 12, 255)[sobra]
    else:
        verde = al & (a[..., 1] > np.maximum(a[..., 0], a[..., 2]) + 6)
        folha[verde, 1] = ((a[..., 0] + a[..., 2]) // 2)[verde]
    al = folha[..., 3] > 0
    viz = np.zeros(al.shape, int)
    viz[1:] += al[:-1]; viz[:-1] += al[1:]; viz[:, 1:] += al[:, :-1]; viz[:, :-1] += al[:, 1:]
    folha[al & (viz == 0)] = 0


F = FONTE
# de onde vem cada roupa: andar (grade 4x8) e parado (grade 4x4 coluna 1, grade 4x8 coluna 0, ou linha de 4 vistas)
FONTES = {('f', 1): (F / 'f-base8' / 'base8.png', ('4x4', F / 'f-base' / 'base.png', 1)),
          ('m', 1): (F / 'r1m' / 'andar' / 'andar.png', ('4x8', F / 'r1m' / 'folha.png', 0))}
for _n in range(2, 7):
    FONTES[('f', _n)] = (F / f'r{_n}f' / 'folha.png', ('linha', F / f'r{_n}f' / 'parado' / 'parado.png', None))
# corpo masculino próprio (dono, 07/11: "corpo masculino"): ombros largos e retos, tronco reto, mãos e botas maiores
for _n in range(1, 7):
    FONTES[('m', _n)] = (F / 'm2' / f'r{_n}' / 'andar' / 'andar.png',
                         ('linha', F / 'm2' / f'r{_n}' / ('parado.png' if _n == 1 else 'parado/parado.png'), None))
ALTO_M = 3  # o corpo masculino é 3 px mais alto (a cabeça sobe; o cabelo e o rosto sobem junto pelo desvio)


def parados(fonte):
    tipo, caminho, col = fonte
    if tipo == 'linha':
        return recortes(caminho, 1, 4)[0]
    g = recortes(caminho, 4, 4 if tipo == '4x4' else 8)
    return [g[l][col] for l in range(4)]


# roupas pretas (crítico, 07/11: "Casaco, Enlutado, Paróquia e Turno viram a mesma massa marrom-acinzentada" e somem no
# piso escuro): o escuro neutro ou amarronzado vira preto-violeta, com o mais escuro em ~20% de luz; o que tem cor
# (roxo, dourado, vinho, prata) fica como está
ESFRIA = {1, 3, 4, 5}


def esfria(folha):
    a = folha.astype(int)
    al = folha[..., 3] > 0
    sat = a[..., :3].max(-1) - a[..., :3].min(-1)
    lum = .3 * a[..., 0] + .59 * a[..., 1] + .11 * a[..., 2]
    pel = pele(folha)
    sel = al & ~pel & (sat < 48) & (lum < 150) & ~((a[..., 2] > a[..., 0] + 12) & (lum > 60))
    t = np.clip((lum - 10) / 140, 0, 1)[..., None]
    escuro, claro = np.array([40, 33, 56]), np.array([150, 140, 172])
    cor = escuro + (claro - escuro) * t
    folha[sel, :3] = np.clip(cor[sel], 0, 255).astype(np.uint8)


REF = {}  # cabeça da roupa 1 feminina (referência dos cabelos e dos rostos)


def monta_roupa(lado, n):
    andar_p, parado_f = FONTES[(lado, n)]
    andar = recortes(andar_p, 4, 8)
    par = parados(parado_f)
    magenta = fundo_magenta(np.asarray(Image.open(andar_p).convert('RGB')))
    def cola(q, x, y):
        h, w = q.shape[:2]; reg = folha[y:y + h, x:x + w]; mk = q[..., 3] > 0; reg[mk] = q[mk]
    folha = np.zeros((CH * 4, CW * NCOL, 4), np.uint8)
    if (lado, n) == ('f', 1):
        # a referência: escala do olho ao pé da prova aprovada, pé na SOLA
        esc4 = escala(*par[0])
        for l in range(4):
            assenta(reduz(*par[l], esc4), folha, l, PARADO)
    else:
        # as outras: cabeça do mesmo tamanho (largura da cabeça careca) e na mesma altura da referência; o corpo, do
        # queixo ao pé, ajustado na vertical para o pé ficar na SOLA. Assim toda roupa tem a mesma altura.
        esc4 = REF['larg'] / larg(*par[0])
        for l in range(4):
            c, m = par[l]
            qz = queixo_src(*par[0]) if l == 3 else queixo_src(c, m)
            if l == 3:
                qz = int(round(qz * c.shape[0] / par[0][0].shape[0]))
            hq = reduz(c[:qz], m[:qz], esc4)
            _, hcx = cabeca(hq)
            rt, rc = REF['cab'][l][2], REF['cab'][l][3]
            topo = CH * l + rt - (ALTO_M if lado == 'm' else 0)
            corpo_y = topo + hq.shape[0]
            cor, mb = c[qz:], m[qz:]
            bq = reduz2(cor, mb, esc4, (CH * l + SOLA + 1 - corpo_y) / cor.shape[0])
            xs_c = np.where(m[:qz].any(0))[0]; xs_b = np.where(mb.any(0))[0]
            hx = CW * PARADO + rc - hcx
            cola(bq, int(round(hx + (xs_b[0] - xs_c[0]) * esc4)), corpo_y)
            cola(hq, int(round(hx)), topo)
    esc8 = esc4 * larg(*par[0]) / np.median([larg(*andar[0][k]) for k in range(8)])
    # andar em duas partes: cabeça na escala do parado, na altura de BOB8; corpo ajustado para o pé ficar na SOLA
    for l in range(4):
        t0, c0 = cabeca(folha[CH * l:CH * (l + 1), CW * PARADO:CW * (PARADO + 1)])
        for k, (c, m) in enumerate(andar[l]):
            qz = queixo_src(*andar[0][k]) if l == 3 else queixo_src(c, m)  # de costas não há pele: usa o queixo da frente
            cab, mc, cor, mb = c[:qz], m[:qz], c[qz:], m[qz:]
            hq = reduz(cab, mc, esc8)
            _, hcx = cabeca(hq)
            topo = CH * l + t0 + BOB8[k]
            corpo_y = topo + hq.shape[0]
            bq = reduz2(cor, mb, esc8, (CH * l + SOLA + 1 - corpo_y) / cor.shape[0])
            xs_c = np.where(mc.any(0))[0]; xs_b = np.where(mb.any(0))[0]
            hx = CW * k + c0 - hcx
            cola(bq, int(round(hx + (xs_b[0] - xs_c[0]) * esc8)), corpo_y)
            cola(hq, int(round(hx)), topo)
    limpa_fundo(folha, magenta)
    if n in ESFRIA:
        esfria(folha)
    msk = mascaras(folha)
    msk[CH * 3:CH * 4, :, 1] = 0  # de costas não há rosto
    # rosto do parado nos 8 passos (o rosto escolhido pelo jogador vem por cima, numa camada própria)
    for l in range(3):
        cel = folha[CH * l:CH * (l + 1), CW * PARADO:CW * (PARADO + 1)]
        cm = msk[CH * l:CH * (l + 1), CW * PARADO:CW * (PARADO + 1)]
        ys, xs = np.where(cm[..., 1] > 0)
        if not len(ys):
            continue
        y0, y1, x0, x1 = ys.min() - 2, ys.max() + 5, xs.min() - 1, xs.max() + 2
        for k in range(8):
            d = BOB8[k]
            dst = folha[CH * l + y0 + d:CH * l + y1 + d, CW * k + x0:CW * k + x1]
            dm = msk[CH * l + y0 + d:CH * l + y1 + d, CW * k + x0:CW * k + x1]
            src, sm = cel[y0:y1, x0:x1], cm[y0:y1, x0:x1]
            ok = (dst[..., 3] > 0) & (src[..., 3] > 0)
            dst[ok] = src[ok]; dm[ok] = sm[ok]
    def poe(l, j, c, m):
        folha[CH * l:CH * (l + 1), CW * j:CW * (j + 1)] = c
        msk[CH * l:CH * (l + 1), CW * j:CW * (j + 1)] = m
    for l in range(4):
        cel = folha[CH * l:CH * (l + 1), CW * PARADO:CW * (PARADO + 1)].copy()
        cm = msk[CH * l:CH * (l + 1), CW * PARADO:CW * (PARADO + 1)].copy()
        fecha = (lambda c, m: (olhos_fechados(c, m), m * (m[..., 1:2] == 0))) if l < 3 else (lambda c, m: (c, m))
        poe(l, 9, *fecha(cel, cm))
        qx = queixo_de(cel, cm) if l < 3 else queixo_de(folha[0:CH, CW * PARADO:CW * (PARADO + 1)], msk[0:CH, CW * PARADO:CW * (PARADO + 1)])
        pc, pm = desloca(cel, cm, qx, SOLA - 6, -1)
        poe(l, 10, pc, pm)
        poe(l, 13, *fecha(pc, pm))
        for j, d in ((11, -1), (12, 1)):
            poe(l, j, olhar(cel, cm, d) if l < 3 else cel, cm)
        ac, am = desloca(cel, cm, 0, SOLA - 4, 1)
        poe(l, 14, ac, am)
    anc = {l: [[0, BOB8[k]] for k in range(8)] + [[0, 0]] * 6 + [[0, 1]] for l in range(4)}
    testa, cabs = {}, {}
    for l in range(4):
        cel = folha[CH * l:CH * (l + 1), CW * PARADO:CW * (PARADO + 1)]
        cm = msk[CH * l:CH * (l + 1), CW * PARADO:CW * (PARADO + 1)]
        ys, xs = np.where(cm[..., 1] > 0)
        topo, cx = cabeca(cel)
        cabs[l] = (ys.mean(), xs.mean(), topo, cx) if len(ys) else (None, None, topo, cx)
        if l < 3 and len(ys):
            testa[l] = int(ys.min() - 3)
    testa[3] = testa.get(0, 40)
    if (lado, n) == ('f', 1):
        fr = folha[0:CH, CW * PARADO:CW * (PARADO + 1)]
        o = olhos(fr, fr[..., 3] > 0, .62)
        REF['espaco'] = o[1][1] - o[0][1]
        REF['larg'] = larg(fr, fr[..., 3] > 0)
        REF['cab'] = cabs
        REF['testa'] = testa
        REF['folha'] = folha.copy()
        REF['msk'] = msk.copy()
    # desvio da cabeça desta roupa em relação à referência (cabelo e rosto, alinhados à referência, andam junto)
    desvio = {}
    for l in range(4):
        y, x, topo, cx = cabs[l]; ry, rx, rtopo, rcx = REF['cab'][l]
        # pela cabeça (topo e centro): o rosto escolhido cobre o rosto da roupa, então o olho da roupa não conta
        desvio[l] = [int(round(cx - rcx)), int(topo - rtopo)]
    REF.setdefault('corpos', {})[(lado, n)] = (esc4, espaco(*par[0]))
    if (lado, n) != ('f', 1):
        # cabeças alinhadas à referência: a testa dela vale para todas, no desvio desta roupa (o olho de lado nem sempre
        # é achado)
        testa = {l: REF['testa'][l] + desvio[l][1] for l in range(4)}
    nome = f'roupa-{n}-{lado}'
    Image.fromarray(folha, 'RGBA').save(ART / f'{nome}.png', optimize=True)
    Image.fromarray(msk, 'RGBA').save(ART / f'{nome}-mascara.png', optimize=True)
    (ART / f'{nome}.json').write_text(json.dumps({'anc': anc, 'testa': testa, 'desvio': desvio}), encoding='utf-8')
    print('ok', nome, 'escala', round(esc4, 4), round(esc8, 4), 'desvio', desvio)
    return folha


def ponta_rosto(img, k, y0, y1, extra=None):
    """de lado, a frente do rosto: o pixel de pele mais à esquerda (vista 1) ou mais à direita (vista 2) entre y0 e y1"""
    sk = pele(img)
    if extra is not None:
        sk &= extra
    sk[:max(0, y0)] = False; sk[max(0, y1):] = False
    xs = np.where(sk.any(0))[0]
    if not len(xs):
        return None
    return xs[0] if k == 1 else xs[-1]


def azul_de(q):
    a = q.astype(int)
    return (a[..., 2] > a[..., 0] + 22) & (a[..., 2] >= a[..., 1] + 8) & (a[..., 3] > 0)


def monta_cabelo(n):
    caminho = F / 'f-cab1' / 'cabelo.png' if n == 1 else F / f'cab{n}' / 'cabelo.png'
    cab = recortes(caminho, 1, 4)[0]
    esc_b, esp_b = REF['corpos'][('f', 1) if n == 1 else ('f', 5)]
    e = espaco(*cab[0])
    escc = esc_b * esp_b / e if e and esp_b else esc_b
    if n == 1:
        escc = escala(*cab[0])  # o cabelo 1 foi encaixado e aprovado assim (olho ao pé)
    ref = REF['folha']
    cabelo = np.zeros((CH, CW * 4, 4), np.uint8)
    dy_frente = None
    for k, (c, m) in enumerate(cab):
        q = reduz(c, m, escc)
        a = q.astype(int)
        azul = azul_de(q)
        lum = .3 * a[..., 0] + .59 * a[..., 1] + .11 * a[..., 2]
        cinza = np.clip(20 + (lum - 20) * 1.25, 0, 255).astype(np.uint8)
        h = np.zeros_like(q)
        h[azul, 0] = h[azul, 1] = h[azul, 2] = cinza[azul]
        h[azul, 3] = 255
        hh, ww = q.shape[:2]
        cel = ref[CH * k:CH * (k + 1), CW * PARADO:CW * (PARADO + 1)]
        ib, ih = iris(cel) & (cel[..., 3] > 0), iris(q) & ~azul & (q[..., 3] > 0)
        ib[58:] = False; ih[int(hh * .6):] = False
        if k == 0 and ib.any() and ih.any():
            yb, xb = np.where(ib); yh, xh = np.where(ih)
            x = int(round(CW * k + xb.mean() - xh.mean()))
            y = int(round(yb.mean() - yh.mean()))
        elif k in (1, 2) and dy_frente is not None:
            # de lado: mesma altura da frente (mesmo desenho, mesma escala) e a ponta do rosto sobre a ponta do rosto
            y = dy_frente
            cm = REF['msk'][CH * k:CH * (k + 1), CW * PARADO:CW * (PARADO + 1)]
            t0, qz = REF['testa'][k], queixo_de(cel, cm)
            pr = ponta_rosto(cel, k, t0, qz)
            ph = ponta_rosto(q, k, t0 - y, qz - y, ~azul)
            x = int(round(CW * k + pr - ph)) if pr is not None and ph is not None else int(round(CW * k + (CW - ww) / 2))
        else:
            # de costas: centro da massa da cabeça na altura das orelhas; altura igual à da frente (mesmo desenho)
            topo, _ = cabeca(cel)
            alb = cel[topo + 14, :, 3] > 0; xs = np.where(alb)[0]; cb = (xs[0] + xs[-1]) / 2
            ah = h[..., 3] > 0; ys = np.where(ah.any(1))[0]; fx = np.where(ah[ys[0] + int((ys[-1] - ys[0]) * .55)])[0]
            x = int(round(CW * k + cb - (fx[0] + fx[-1]) / 2))
            y = dy_frente if dy_frente is not None else SOLA - hh
        if k == 0:
            dy_frente = y
        h = so_massa(h)
        # cola recortando o que sai da célula
        for yy in range(hh):
            ty = y + yy
            if not 0 <= ty < CH:
                continue
            for xx in range(ww):
                tx = x + xx
                if CW * k <= tx < CW * (k + 1) and h[yy, xx, 3]:
                    cabelo[ty, tx] = h[yy, xx]
    Image.fromarray(cabelo, 'RGBA').save(ART / f'cabelo-{n}.png', optimize=True)
    print('ok cabelo', n, 'escala', round(escc, 4))


# rostos (dono, 07/11: "não é pra todo chibi ter a mesma expressão viu"): os 18 rostos da criação, cada um uma camada que
# cobre a parte de dentro do rosto da roupa (dos olhos ao queixo) nas vistas de frente e de lado. 4 variações por vista:
# aberto, olhos fechados (piscar), olhar para a esquerda e para a direita (íris 1 px). Alinhado à cabeça da referência.
VARIA = 4


def monta_rosto(n):
    caminho = F / f'rosto{n}' / 'rosto.png'
    vs = recortes(caminho, 1, 4)[0]
    ref, rmsk = REF['folha'], REF['msk']
    # escala pela largura da cabeça careca (os olhos mudam de rosto para rosto)
    refcel = ref[0:CH, CW * PARADO:CW * (PARADO + 1)]
    al = refcel[..., 3] > 0
    esc = larg(refcel, al) / larg(*vs[0])
    out = np.zeros((CH * VARIA, CW * 3, 4), np.uint8)
    msk = np.zeros_like(out)
    for k in range(3):
        c, m = vs[k]
        q = reduz(c, m, esc)
        cel = ref[CH * k:CH * (k + 1), CW * PARADO:CW * (PARADO + 1)]
        cm = rmsk[CH * k:CH * (k + 1), CW * PARADO:CW * (PARADO + 1)]
        t0, c0 = cabeca(cel)
        t, cx = cabeca(q)
        x, y = int(round(c0 - cx)), int(t0 - t)
        if k in (1, 2):
            # de lado: a ponta do rosto sobre a ponta do rosto da referência
            qz0 = queixo_de(cel, cm)
            pr = ponta_rosto(cel, k, REF['testa'][k], qz0)
            ph = ponta_rosto(q, k, REF['testa'][k] - y, qz0 - y)
            if pr is not None and ph is not None:
                x = int(round(pr - ph))
        lay = np.zeros((CH, CW, 4), np.uint8)
        hh, ww = q.shape[:2]
        for yy in range(hh):
            for xx in range(ww):
                ty, tx = y + yy, x + xx
                if 0 <= ty < CH and 0 <= tx < CW and q[yy, xx, 3]:
                    lay[ty, tx] = q[yy, xx]
        # janela do rosto: da testa da referência até o queixo, só por dentro da cabeça (sem o contorno), e só onde a
        # cabeça da referência também tem pele (o rosto não escapa da cabeça de nenhuma roupa)
        testa = REF['testa'][k] - 6  # sobrancelhas inclusive
        qx = queixo_de(cel, cm)
        dentro = (cel[..., 3] > 0)
        for _ in range(1):
            dentro = dentro & np.roll(dentro, 1, 0) & np.roll(dentro, -1, 0) & np.roll(dentro, 1, 1) & np.roll(dentro, -1, 1)
        jan = np.zeros((CH, CW), bool); jan[testa:qx] = True
        jan &= dentro & (lay[..., 3] > 0)
        # na faixa de cima (testa), só pele: o cabelo da referência não entra
        face = lay.copy(); face[~jan] = 0
        fm = mascaras(face)
        variantes = [(face, fm)]
        variantes.append((olhos_fechados(face, fm), fm * (fm[..., 1:2] == 0)))
        variantes.append((olhar(face, fm, -1), fm))
        variantes.append((olhar(face, fm, 1), fm))
        for v, (fc, fmm) in enumerate(variantes):
            out[CH * v:CH * (v + 1), CW * k:CW * (k + 1)] = fc
            msk[CH * v:CH * (v + 1), CW * k:CW * (k + 1)] = fmm
    Image.fromarray(out, 'RGBA').save(ART / f'rosto-{n}.png', optimize=True)
    Image.fromarray(msk, 'RGBA').save(ART / f'rosto-{n}-mascara.png', optimize=True)
    print('ok rosto', n, 'escala', round(esc, 4))


def conferencia(nome, folha, cabelo, desvio, rosto=None):
    pr = Image.new('RGBA', (CW * 9, CH * 4), (46, 40, 58, 255))
    pr.alpha_composite(Image.fromarray(folha[:, :CW * 9], 'RGBA'))
    for l in range(4):
        dx0, dy0 = desvio.get(l, [0, 0])
        for k in range(9):
            dy = BOB8[k] if k < 8 else 0
            if rosto is not None and l < 3:
                pr.alpha_composite(Image.fromarray(rosto[0:CH, CW * l:CW * (l + 1)], 'RGBA'), (CW * k + dx0, CH * l + dy + dy0))
            pr.alpha_composite(Image.fromarray(cabelo[:, CW * l:CW * (l + 1)], 'RGBA'), (CW * k + dx0, CH * l + dy + dy0))
    pr.resize((pr.width * 2, pr.height * 2), Image.NEAREST).save(F / f'conf-{nome}.png')


def main():
    modo = sys.argv[1] if len(sys.argv) > 1 else 'tudo'
    folhas = {('f', 1): monta_roupa('f', 1), ('f', 5): monta_roupa('f', 5)}
    if modo in ('roupas', 'tudo'):
        for lado in 'fm':
            for n in range(1, 7):
                if (lado, n) not in folhas:
                    folhas[(lado, n)] = monta_roupa(lado, n)
    if modo in ('cabelos', 'tudo'):
        for n in range(1, 19):
            monta_cabelo(n)
    if modo in ('rostos', 'tudo'):
        for n in range(1, 19):
            if (F / f'rosto{n}' / 'rosto.png').exists():
                monta_rosto(n)
    c1 = np.asarray(Image.open(ART / 'cabelo-1.png'))
    r1 = np.asarray(Image.open(ART / 'rosto-1.png')) if (ART / 'rosto-1.png').exists() else None
    for (lado, n), f in folhas.items():
        j = json.loads((ART / f'roupa-{n}-{lado}.json').read_text(encoding='utf-8'))
        conferencia(f'roupa-{n}-{lado}', f, c1, {int(k): v for k, v in j['desvio'].items()}, r1)


if __name__ == '__main__':
    main()
