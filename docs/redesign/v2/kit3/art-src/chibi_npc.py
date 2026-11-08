"""Chibis dos NPCs (dono, 06/11: "deixe [a boca falando] somente para os chibis deles" → "Pode fazer").
Fatia a folha gerada (4 linhas: frente, esquerda, direita, costas; 4 colunas: contato, passagem, contato, passagem)
em quadros de pixel de verdade, na mesma escala do chibi do jogador (célula 80x96, pés na linha 94), alinhados pela
cabeça, com uma paleta só. Depois monta as colunas de rosto a partir do quadro parado: boca aberta (frente e lados) e olhos fechados,
desenhados em pixel nas posições medidas (ROSTO).
Saída: art/npc-chibi/<nome>.png, colunas 0..3 andar, 4 parado, 5 boca aberta, 6 olhos fechados, 7 olhos fechados e
boca aberta; prancha ampliada em art-src/npc-chibi/<nome>-folha.png.
Uso: python -I art-src/chibi_npc.py [nomes]  (roda a partir de docs/redesign/v2/kit3; melissa só sob pedido)"""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image

AQUI = Path(sys.argv[0]).resolve().parent
ART = AQUI.parent / 'art' / 'npc-chibi'
ART.mkdir(exist_ok=True)
CW, CH, SOLA = 80, 96, 94
# altura do desenho em pixels de arte (o jogador tem 79 com o cabelo): o Simon do tamanho dele, o Erick mais alto
ALTURA = {'simon': 80, 'erick': 94, 'galo': 88, 'coruja': 84, 'javali': 91}
# geração aprovada de cada um (a 1ª ficou infantil no Simon e baixa no Erick: crítico, 06/11)
FONTE = {'simon': 'simon2', 'erick': 'erick2', 'galo': 'galo', 'coruja': 'coruja', 'javali': 'javali'}
# chibis que já foram aprovados antes deste formato: só ganham as colunas de rosto
APROVADOS = {'melissa'}
# posições do rosto no quadro parado de cada direção (x, y na célula), medidas na prancha: boca (x0, x1, y) e olhos
# [(x0, x1, y_linha)]; None quando a direção não mostra o rosto
ROSTO = json.loads((AQUI / 'npc-chibi' / 'rosto.json').read_text(encoding='utf-8')) if (AQUI / 'npc-chibi' / 'rosto.json').exists() else {}


def mascara(a):
    return (a[..., 1] - np.maximum(a[..., 0], a[..., 2])) < 60


def blocos(m, eixo, min_len=60, gap=6):
    idx = np.where(m.any(eixo))[0]
    gs = np.split(idx, np.where(np.diff(idx) > gap)[0] + 1)
    return [g for g in gs if len(g) > min_len]


def reduz(c, m, esc):
    """amostragem por bloco: cada pixel de arte é a mediana dos pixels de origem que caem nele (cobertura > 50%)"""
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


def fatia(nome):
    a = np.asarray(Image.open(AQUI / 'npc-chibi' / FONTE[nome] / f'chibi-{nome}.png').convert('RGB')).astype(np.int16)
    m = mascara(a)
    fil = blocos(m, 1)[:4]
    assert len(fil) == 4, len(fil)
    alt = max(g[-1] - g[0] + 1 for g in fil)
    esc = ALTURA[nome] / alt
    quadros = []
    for g in fil:
        sub = m[g[0]:g[-1] + 1]
        cols = blocos(sub, 0)[:4]
        assert len(cols) == 4, len(cols)
        linha = []
        for b in cols:
            c = a[g[0]:g[-1] + 1, b[0]:b[-1] + 1].astype(np.uint8)
            mm = sub[:, b[0]:b[-1] + 1]
            ys = np.where(mm.any(1))[0]
            linha.append(reduz(c[ys[0]:ys[-1] + 1], mm[ys[0]:ys[-1] + 1], esc))
        quadros.append(linha)
    return quadros


def folha_aprovada(nome):
    """a Melissa já tem chibi aprovado (art/chibi-melissa.png, 4x4 de 80x80, pés na linha 79): só muda de formato,
    para a célula de 80x96 com os pés na linha 94, e ganha a coluna parada (4) igual à passagem (1)"""
    a = np.asarray(Image.open(AQUI.parent / 'art' / f'chibi-{nome}.png').convert('RGBA'))
    folha = np.zeros((CH * 4, CW * 8, 4), np.uint8)
    d = SOLA - 79
    for l in range(4):
        for k in range(5):
            c = a[l * 80:(l + 1) * 80, (k if k < 4 else 1) * 80:((k if k < 4 else 1) + 1) * 80]
            folha[CH * l + d:CH * l + d + 80, CW * k:CW * (k + 1)] = c
    return folha


def monta(nome, quadros):
    folha = np.zeros((CH * 4, CW * 8, 4), np.uint8)
    for l, linha in enumerate(quadros):
        for k, q in enumerate(linha + [linha[1]]):
            # alinha pela cabeça (o terço de cima) e pelos pés na linha SOLA
            h, w = q.shape[:2]
            cab = np.where(q[:h // 3, :, 3].any(0))[0]
            centro = (cab[0] + cab[-1]) // 2
            x, y = CW * k + CW // 2 - centro, CH * l + SOLA - h
            reg = folha[y:y + h, x:x + w]
            mk = q[..., 3] > 0
            reg[mk] = q[mk]
    # sem redução de paleta: a mediana por bloco já cai nas cores da arte, e a redução apagava os detalhes pequenos
    # (o amarelo dos olhos do Erick, o lacre vermelho do Simon)
    return folha


# pele lisa do rosto (o Simon tem mechas sobre os olhos: tirar a cor da coluna de baixo deixava borrão)
PELE = {'simon': np.array([246, 214, 190], np.uint8), 'erick': np.array([214, 144, 110], np.uint8),
        'melissa': np.array([250, 217, 201], np.uint8), 'galo': np.array([242, 174, 90], np.uint8),
        'coruja': np.array([251, 198, 174], np.uint8), 'javali': np.array([65, 53, 54], np.uint8)}


def retoca(folha, nome):
    """acertos do crítico (06/11): no Erick, o olho amarelo vira só um ponto pálido de 2 px sob a pálpebra (sem o
    brilho em volta); no Simon, a carta da bolsa deixa de ser um quadrado branco com ponto vermelho"""
    a = folha.astype(int)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3] > 0
    if nome == 'erick':
        for l in range(3):
            for k in range(8):
                y0, x0 = CH * l, CW * k
                cel = folha[y0:y0 + 40, x0:x0 + CW]
                c = cel.astype(int)
                am = (c[..., 3] > 0) & (c[..., 0] > 200) & (c[..., 1] > 165) & (c[..., 2] < 175)
                ys, xs = np.where(am)
                if not len(ys):
                    continue
                # cada olho é um grupo de colunas
                cols = sorted(set(xs)); grupos = []
                for x in cols:
                    if grupos and x - grupos[-1][1] <= 2:
                        grupos[-1][1] = x
                    else:
                        grupos.append([x, x])
                for gx0, gx1 in grupos:
                    sel = (xs >= gx0) & (xs <= gx1)
                    ty = ys[sel].min(); meio = (gx0 + gx1) / 2
                    for y, x in zip(ys[sel], xs[sel]):
                        if y == ty:
                            cel[y, x, :3] = (217, 204, 154) if abs(x - meio) <= .6 or (gx1 - gx0 >= 3 and abs(x - meio) <= 1) else (150, 88, 70)
                        else:
                            cel[y, x, :3] = PELE['erick']
    if nome == 'simon':
        corpo = np.zeros(al.shape, bool)
        for l in range(4):
            corpo[CH * l + 50:CH * (l + 1)] = True
        branco = corpo & al & (r > 220) & (g > 220) & (b > 215)
        verm = corpo & al & (r > 170) & (g < 90) & (b < 90)
        folha[branco, :3] = (221, 208, 182)
        folha[verm, :3] = (126, 44, 44)
    return folha


def rosto(folha, nome):
    """colunas 5..7 a partir do parado (4): boca aberta (frente e lados; de costas não há rosto), olhos fechados, os dois.
    Olho fechado: o olho vira a pele logo abaixo dele, na mesma coluna, e ganha uma linha de cílio a 65% da altura."""
    r = ROSTO.get(nome, {})
    for l in range(4):
        if str(l) not in r:
            pass
        base = folha[CH * l:CH * (l + 1), CW * 4:CW * 5].copy()
        d = r.get(str(l)) or {}
        for k, (olho, boca) in enumerate([(False, True), (True, False), (True, True)]):
            q = base.copy()
            if boca and d.get('boca'):
                x0, x1, y = d['boca']
                esc = np.array(d['cor_boca'], np.uint8)
                for x in range(x0, x1 + 1):
                    q[y, x, :3] = esc
                q[y + 1, (x0 + x1) // 2, :3] = (esc * .7).astype(np.uint8)
            if olho and d.get('olhos'):
                cil = np.array(d['cor_cilio'], np.uint8)
                for (x0, x1, y0, y1, *resto) in d['olhos']:
                    linha = resto[0] if resto else 1
                    for x in range(x0, x1 + 1):
                        pele = PELE[nome] if d.get('pele_fixa') else None
                        for yy in ([] if pele is not None else range(y1 + 1, y1 + 4)):
                            c = base[yy, x].astype(int)
                            if c[3] and c[0] - c[2] > 30 and .3 * c[0] + .59 * c[1] + .11 * c[2] > 110:
                                pele = base[yy, x, :3]
                                break
                        for yy in range(y0, y1 + 1):
                            if pele is not None and q[yy, x, 3]:
                                q[yy, x, :3] = pele
                    ly = y0 + round((y1 - y0) * .65)
                    for x in (range(x0, x1 + 1) if linha else []):
                        ponta = (x1 - x0) >= 5 and x in (x0, x1)
                        q[ly - (1 if ponta else 0), x, :3] = cil
            folha[CH * l:CH * (l + 1), CW * (5 + k):CW * (6 + k)] = q
    return folha


def prancha(nome, folha):
    Z = 4
    p = Image.new('RGB', (folha.shape[1], folha.shape[0]), (46, 40, 58))
    im = Image.fromarray(folha, 'RGBA')
    p.paste(im, (0, 0), im)
    p.resize((p.width * Z, p.height * Z), Image.NEAREST).save(AQUI / 'npc-chibi' / f'{nome}-folha.png')


if __name__ == '__main__':
    for nome in sys.argv[1:] or ['simon', 'erick', 'galo', 'coruja', 'javali']:
        base = folha_aprovada(nome) if nome in APROVADOS else retoca(monta(nome, fatia(nome)), nome)
        f = rosto(base, nome)
        Image.fromarray(f, 'RGBA').save(ART / f'{nome}.png', optimize=True)
        prancha(nome, f)
        print('ok', nome)
