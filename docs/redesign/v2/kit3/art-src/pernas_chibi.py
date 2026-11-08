# Pernas novas do chibi (dono, 02/11: "pode redesenhar"). As folhas originais das roupas não têm passo de verdade:
# de lado as pernas ficam sempre abertas e de costas são um bloco só. Este script redesenha, para cada roupa, só a
# parte de baixo das pernas (abaixo da barra do casaco) em 8 quadros de passo por direção, com as cores da própria
# roupa (calça, bota e contorno), e grava art/avatar/chibi/roupa-<n>-<f|m>-andar.png.
# Folha de saída: 10 colunas x 4 direções de 64x64 (mesma grade das roupas): coluna 0 parado, 1..8 passos, 9 parado
# (respirando). A parte de cima da roupa vem do quadro parado original e sobe 1 px nos quadros de passagem
# (BOB igual ao de folhaAndar em avatar-cor.js); as pernas ficam presas ao chão.
# Também os braços e a barra do casaco (06/11) e as mãos do corpo em corpo-<f|m>-andar.png. Ver campo().
# Uso: python art-src/pernas_chibi.py  (roda a partir de docs/redesign/v2/kit3)
import numpy as np
from PIL import Image

BASE = 'art/avatar/chibi/'
BOB = [0, 0, -1, -1, 0, 0, -1, -1]


def cores(c, y0, y1):
    """cores mais comuns (sem o contorno) numa faixa de linhas"""
    px = c[y0:y1].reshape(-1, 4)
    px = px[px[:, 3] > 0][:, :3]
    if not len(px):
        return None
    lum = px @ [.3, .59, .11]
    claros = px[lum > lum.min() + 6] if (lum > lum.min() + 6).any() else px
    v, n = np.unique(claros, axis=0, return_counts=True)
    lista = [tuple(int(t) for t in x) for x in v[np.argsort(-n)]]
    # o contorno das roupas puxa para o verde escuro; calça e bota nunca são esverdeadas
    sem_verde = [c for c in lista if not (c[1] > c[0] + 6 and c[1] > c[2] + 6)]
    return sem_verde or lista


def escuro(c):
    px = c.reshape(-1, 4)
    px = px[px[:, 3] > 0][:, :3]
    return tuple(int(t) for t in px[np.argmin(px @ [.3, .59, .11])])


def sombra(cor, f=.72):
    return tuple(int(t * f) for t in cor)


class Tela:
    def __init__(s):
        s.a = np.zeros((64, 64, 4), np.uint8)

    def px(s, x, y, cor):
        if 0 <= x < 64 and 0 <= y < 64:
            s.a[y, x] = (*cor, 255)

    def ret(s, x0, y0, x1, y1, cor):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                s.px(x, y, cor)

    def contorna(s, cor):
        """contorno de 1 px em volta de tudo que foi pintado (estilo das roupas)"""
        al = s.a[:, :, 3] > 0
        borda = np.zeros_like(al)
        borda[1:] |= al[:-1]; borda[:-1] |= al[1:]; borda[:, 1:] |= al[:, :-1]; borda[:, :-1] |= al[:, 1:]
        borda &= ~al
        s.a[borda] = (*cor, 255)


def perna_lado(cal, cal_s, bota, bota_s, frisos, hx, topo, sola, pe_x, sobe, para_dir, contorno, tras, larg=4):
    """uma perna de perfil, numa tela própria (contorno só dela): coxa e canela de 4 px do quadril ao tornozelo, com
    joelho dobrado quando o pé está no ar, e bota com bico para onde anda"""
    t = Tela()
    s = 1 if para_dir else -1
    tornozelo = sola - 3 - sobe
    if sobe:
        # joelho a meia altura, 2 px à frente; a canela volta 1 px para trás do joelho
        jy = (topo + tornozelo) // 2
        jx = round((hx + pe_x) / 2) + 2 * s
        trechos = [((hx, topo), (jx, jy)), ((jx, jy), (pe_x - s, tornozelo))]
    else:
        trechos = [((hx, topo), (pe_x, tornozelo))]
    for (x0, y0), (x1, y1) in trechos:
        n = max(1, y1 - y0)
        for i in range(n + 1):
            y = y0 + i
            x = round(x0 + (x1 - x0) * i / n)
            e0 = x - larg // 2; e1 = e0 + larg - 1
            t.ret(e0, y, e1, y, cal)
            t.px(e0 if para_dir else e1, y, cal_s)  # lado de trás da perna mais escuro
    bx = (pe_x - s) if sobe else pe_x
    y = tornozelo + 1
    # bota: cano, peito do pé e sola; bico arredondado para a frente, friso claro no cano
    f = 1 if para_dir else -1
    t.ret(bx - 3, y - 1, bx + 2, y + 1, bota)
    t.ret(bx - 3 + f, y + 1, bx + 2 + f, y + 1, bota)
    t.ret(bx - 3, y + 2, bx + 2, y + 2, bota_s)
    t.px(bx + 3 if para_dir else bx - 4, y + 2, bota_s)
    t.px(bx + 3 if para_dir else bx - 4, y + 1, bota)
    if frisos:
        t.ret(bx - 3, y - 1, bx + 2, y - 1, frisos)
    t.contorna(contorno)
    if tras:
        t.a[:, :, :3] = (t.a[:, :, :3] * .62).astype(np.uint8)
    return t.a


def perna_frente(cal, cal_s, bota, bota_s, frisos, x, topo, sola, sobe, desce, contorno, costas, larg=5, dentro=0, fora=0):
    """perna de frente/costas. A que sobe encurta e o pé vai 1 px para dentro (joelho dobrando); a de apoio vai 1 px
    para fora no contato. Bota 2 px mais larga que a perna, com 4 linhas (é ela que dá o peso do chibi)"""
    t = Tela()
    tornozelo = sola - 4 - sobe + desce
    x += fora
    meio = (topo + tornozelo) // 2
    for y in range(topo, tornozelo + 1):
        dx = dentro if (sobe and y > meio) else 0
        fino = 1 if y >= tornozelo - 1 else 0  # canela afina 1 px logo acima da bota
        t.ret(x + dx + fino, y, x + dx + larg - 1, y, cal)
        t.px(x + dx + larg - 1, y, cal_s)
    bx = x + (dentro if sobe else 0) - 1
    t.ret(bx, tornozelo + 1, bx + larg + 1, tornozelo + 3, bota)
    t.ret(bx, tornozelo + 4, bx + larg + 1, tornozelo + 4, bota_s)
    if frisos and not costas:
        t.ret(bx + 1, tornozelo + 1, bx + larg, tornozelo + 1, frisos)
    t.contorna(contorno)
    return t.a


def cola(dst, src):
    m = src[:, :, 3] > 0
    dst[m] = src[m]


# passo de perfil (8 quadros): posição do pé em relação ao quadril e quanto ele sai do chão. A = perna de lá,
# B = perna de cá (B é A defasada em 4 quadros). Contato em 0 e 4 (pés abertos), passagem em 2 e 6.
LADO_A = [(6, 0), (3, 0), (0, 0), (-3, 0), (-6, 0), (-3, 1), (1, 2), (4, 1)]
LADO_B = LADO_A[4:] + LADO_A[:4]
# de frente / costas: quanto cada pé sobe (e, no contato, o pé que pisa desce 1 px, vindo na direção da câmera)
FRENTE_E = [0, 1, 2, 1, 0, 0, 0, 0]
FRENTE_D = [0, 0, 0, 0, 0, 1, 2, 1]
DESCE_E = [0, 0, 0, 0, 1, 0, 0, 0]
DESCE_D = [1, 0, 0, 0, 0, 0, 0, 0]
QUADRIL = 16  # as pernas novas começam 16 linhas acima da sola, por trás do casaco


# Braços e barra (dono, 06/11: "pode fazer"; pedido do crítico de animação). Os braços não são redesenhados: o
# quadro parado é deformado por um campo de deslocamento em pixel inteiro (amostragem do vizinho mais próximo, sem
# borrão nem buraco). Cada mão (pele do corpo + aro da roupa) anda o deslocamento todo; a manga acompanha, de 0 no
# ombro até 1 na mão; o tronco fica parado. A barra do casaco também balança, só nas últimas linhas.
# De lado: a mão da frente vai e volta 3 px, oposta à perna de cá; a de trás, 1 px no sentido contrário.
# De frente/costas: o braço que vai à frente (oposto à perna que sobe) encurta: a mão sobe 1 px e entra 1 px; o
# outro, que vai para trás, abre 1 px para fora no mesmo quadro. Crítico (06/11): barra sempre arrastando um pouco.
LADO_BRACO = [3, 2, 0, -2, -3, -2, 0, 2]  # mão da frente, no sentido em que o chibi anda (fase da perna de lá)
LADO_BRACO_T = [-1, -1, 0, 1, 1, 1, 0, -1]  # mão de trás
FRENTE_BRACO = [0, 1, 1, 1, 0, 0, 0, 0]  # braço da direita da tela vai à frente enquanto a perna da esquerda sobe
LADO_BARRA = [1, 1, 2, 1, 1, 1, 2, 1]  # a barra fica para trás, mais na passagem
FRENTE_BARRA = [0, 1, 1, 0, 0, -1, -1, 0]  # de frente, a barra vai de um lado para o outro com o quadril
OMBRO = 10  # linhas acima do topo da mão onde a manga para de mexer


def maos(lado):
    """mãos (pele abaixo do pescoço) de cada direção, em coordenadas do corpo (célula de 80): [(cx, topo, base)]"""
    c = np.asarray(Image.open(BASE + f'corpo-{lado}.png').convert('RGBA')).astype(int)
    res = []
    for d in range(4):
        C = c[d * 80:(d + 1) * 80, 80:160]
        sk = (C[:, :, 3] > 0) & (C[:, :, 0] - C[:, :, 2] > 30)
        sk[:44] = 0; sk[60:] = 0
        ys, xs = np.where(sk)
        g = []
        for x in sorted(set(xs)):
            if g and x - g[-1][1] <= 2: g[-1][1] = x
            else: g.append([x, x])
        res.append([((a + b) / 2, int(ys[(xs >= a) & (xs <= b)].min()), int(ys[(xs >= a) & (xs <= b)].max())) for a, b in g])
    return res


def campo(M, d, k, sola_c):
    """deslocamento (dx, dy) por pixel na célula do corpo (80x80) para a direção d e o quadro de passo k"""
    dx = np.zeros((80, 80)); dy = np.zeros((80, 80))
    yy, xx = np.mgrid[0:80, 0:80]
    esq, dir_ = sorted(M[d], key=lambda m: m[0])[:2] if len(M[d]) >= 2 else (None, None)
    bracos = []
    if d in (1, 2):
        frente = -1 if d == 1 else 1
        na_frente, atras = (esq, dir_) if d == 1 else (dir_, esq)
        bracos = [(na_frente, frente * LADO_BRACO[k], 0), (atras, frente * LADO_BRACO_T[k], 0)]
    else:
        fr = FRENTE_BRACO[k]; fl = FRENTE_BRACO[(k + 4) % 8]
        if d == 3: fr, fl = fl, fr
        pico = k in (2, 6)
        bracos = [(dir_, (-1 if fr else 1 if fl else 0) * pico, -fr), (esq, (1 if fl else -1 if fr else 0) * pico, -fl)]
    for m, DX, DY in bracos:
        if m is None or (not DX and not DY): continue
        cx, top, bot = m
        sh = top - OMBRO
        wy = np.clip((yy - sh) / max(1, top - sh), 0, 1) * np.clip((bot + 5 - yy) / 3, 0, 1)
        wx = np.clip((8 - np.abs(xx - cx)) / 4, 0, 1)
        dx += DX * wy * wx; dy += DY * wy * wx
    # barra do casaco: as 6 linhas de cima da sola das pernas (só a roupa tem essas linhas por cima das pernas)
    h0 = sola_c - 13
    wb = np.clip((yy - h0) / 6, 0, 1)
    if d in (1, 2):
        dx += -(-1 if d == 1 else 1) * LADO_BARRA[k] * wb
    else:
        dx += FRENTE_BARRA[k] * wb
    return np.floor(dx + .5).astype(int), np.floor(dy + .5).astype(int)


def deforma(img, dx, dy):
    """amostragem inversa: out[y, x] = img[y - dy, x - dx] (vizinho mais próximo)"""
    h, w = img.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    sy = yy - dy; sx = xx - dx
    ok = (sy >= 0) & (sy < h) & (sx >= 0) & (sx < w)
    out = np.zeros_like(img)
    out[ok] = img[sy[ok], sx[ok]]
    return out


def corpo_andar(lado, M, solas):
    """mãos andando: a mesma deformação aplicada ao corpo (pele), 8 quadros x 4 direções de 80x80"""
    c = np.asarray(Image.open(BASE + f'corpo-{lado}.png').convert('RGBA'))
    out = np.zeros((320, 640, 4), np.uint8)
    for d in range(4):
        C = c[d * 80:(d + 1) * 80, 80:160]
        for k in range(8):
            dx, dy = campo(M, d, k, solas[d])
            out[d * 80:(d + 1) * 80, k * 80:(k + 1) * 80] = deforma(C, dx, dy)
    Image.fromarray(out, 'RGBA').save(BASE + f'corpo-{lado}-andar.png', optimize=True)


def paleta_pernas(N, sola):
    """cores das pernas: as das últimas 6 linhas (bota e canela), que com certeza não são casaco"""
    px = N[sola - 5:sola + 2].reshape(-1, 4)
    return {tuple(int(t) for t in c[:3]) for c in px if c[3]}


def perto(cor, pal, lim=34):
    """a cor é da calça/bota (igual ou quase igual a uma cor da paleta das pernas)?"""
    c = np.array(cor, int)
    return any(np.abs(c - np.array(p)).sum() <= lim for p in pal)


def folha(nome, M):
    solas = []
    src = np.asarray(Image.open(BASE + nome + '.png').convert('RGBA'))
    out = np.zeros((64 * 4, 64 * 10, 4), np.uint8)
    for d in range(4):
        N = src[d * 64:(d + 1) * 64, 64:128].copy()
        al = N[:, :, 3] > 0
        ys = np.where(al.any(1))[0]
        sola = int(ys.max()) - 1  # a última linha é o contorno; o contorno novo cai no mesmo lugar
        solas.append(sola + 16)
        topo = sola - QUADRIL
        baixo = np.where(al[sola - 4])[0]
        hx = (baixo.min() + baixo.max()) / 2 if len(baixo) else 32
        contorno = escuro(N)
        cal = (cores(N, sola - 8, sola - 3) or [(60, 60, 60)])[0]
        bota = (cores(N, sola - 2, sola + 1) or [(40, 40, 40)])[0]
        # friso da bota: a cor mais clara das botas originais, se for bem mais clara que a bota (fivela, cadarço)
        bc = cores(N, sola - 3, sola + 1) or []
        claras = [c for c in bc if sum(c) > sum(bota) + 90]
        frisos = claras[0] if claras else None
        # parte de cima: apaga só as pernas originais (cores da paleta das pernas, perto do meio) abaixo do quadril;
        # o casaco e a barra ficam inteiros
        pal = paleta_pernas(N, sola)
        # até onde as pernas originais se abrem (as do passo antigo, nas últimas linhas), com 2 px de folga
        pes = np.where(al[sola - 6:sola + 2].any(0))[0]
        xa, xb = (int(pes.min()) - 2, int(pes.max()) + 2) if len(pes) else (int(hx) - 8, int(hx) + 8)
        joelho = np.where(al[sola - 8])[0]
        larg = int(np.clip(round((joelho.max() - joelho.min() + 1) / 2) - 1, 5, 6)) if len(joelho) and d in (0, 3) else 5
        if d in (1, 2):
            larg = 6 if len(joelho) and (joelho.max() - joelho.min()) > 16 else 5
        cima = N.copy()
        for y in range(topo, 64):
            for x in range(64):
                if cima[y, x, 3] and (xa <= x <= xb or y > sola - 4) and perto(cima[y, x, :3], pal):
                    cima[y, x] = 0
        for col in range(10):
            k = col - 1
            anda = 1 <= col <= 8
            bob = 1 if col == 9 else (BOB[k] if anda else 0)
            cel = np.zeros((64, 64, 4), np.uint8)
            if d in (1, 2):
                para_dir = d == 2
                s = 1 if para_dir else -1
                a = LADO_A[k] if anda else (1, 0)
                b = LADO_B[k] if anda else (-1, 0)
                cola(cel, perna_lado(cal, sombra(cal), bota, sombra(bota), frisos, round(hx), topo + bob, sola, round(hx + s * a[0]), a[1], para_dir, contorno, True, larg))
                cola(cel, perna_lado(cal, sombra(cal), bota, sombra(bota), frisos, round(hx), topo + bob, sola, round(hx + s * b[0]), b[1], para_dir, contorno, False, larg))
            else:
                costas = d == 3
                e = FRENTE_E[k] if anda else 0
                dd = FRENTE_D[k] if anda else 0
                de = DESCE_E[k] if anda else 0
                ddd = DESCE_D[k] if anda else 0
                if costas:
                    e, dd = dd, e
                    de, ddd = 0, 0  # de costas, o pé que pisa sobe 1 px (vai para longe da câmera)
                    if anda and k in (0, 4):
                        e, dd = (1, 0) if k == 4 else (0, 1)
                x0 = round(hx) - larg
                # no contato (pé descendo/subindo 1 px), a perna de apoio abre 1 px para fora
                fe = -1 if (de or (costas and anda and k == 4)) else 0
                fd = 1 if (ddd or (costas and anda and k == 0)) else 0
                cola(cel, perna_frente(cal, sombra(cal), bota, sombra(bota), frisos, x0, topo + bob, sola, e, de, contorno, costas, larg, dentro=1, fora=fe))
                cola(cel, perna_frente(cal, sombra(cal), bota, sombra(bota), frisos, x0 + larg + 1, topo + bob, sola, dd, ddd, contorno, costas, larg, dentro=-1, fora=fd))
            # a parte de cima da roupa (casaco, barra) vem por cima das pernas, com o sobe-e-desce do corpo
            # braços e barra: o mesmo campo das mãos do corpo, na grade da roupa (64x64 em +8,+16)
            base = cima
            if anda:
                dx, dy = campo(M, d, k, sola + 16)
                base = deforma(cima, dx[16:80, 8:72], dy[16:80, 8:72])
            c2 = np.zeros_like(base)
            if bob < 0:
                c2[:bob] = base[-bob:]
            elif bob > 0:
                c2[bob:] = base[:-bob]
            else:
                c2 = base
            cola(cel, c2)
            out[d * 64:(d + 1) * 64, col * 64:(col + 1) * 64] = cel
    Image.fromarray(out, 'RGBA').save(BASE + nome + '-andar.png', optimize=True)
    return solas


if __name__ == '__main__':
    for lado in 'fm':
        M = maos(lado)
        for r in range(1, 7):
            folha(f'roupa-{r}-{lado}', M)
            print('ok', f'roupa-{r}-{lado}-andar.png')
        corpo_andar(lado, M, [999] * 4)  # no corpo só as mãos importam (a barra é da roupa)
        print('ok', f'corpo-{lado}-andar.png')
