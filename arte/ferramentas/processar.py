"""Pós-processamento: fundo real, bordas, molde, tamanhos, camadas, 9-slice, prancha.

Uso:
  python3 arte/ferramentas/processar.py arte/pedidos/<id>.json <pasta-saida>

Lê <saida>/bruto/vNN.png (de gerar.py) ou o arquivo de "importar" do pedido e grava:
  final/<id>--vNN--<tam>.png|webp   original e derivados WebP com alfa
  final/<id>--vNN--<camada>--<tam>.webp   camadas de animação extraídas por cor (pos.camadas)
  final/<id>--vNN--kit-*.webp       balão: corpo esticável e pontas ornamentadas
  prancha.png, manifest.json, README.md, log.txt

Fundo:
  "liso"         rembg (BiRefNet; cai para ISNet) — imagens geradas com fundo liso.
  "quadriculado" imagens com o xadrez de "transparência" DESENHADO (outras IAs): detecta a zona do xadrez
                 (pixels cinza neutros claros com padrão claro/médio), troca por cor lisa, refina com rembg e
                 preserva tudo que não é cinza neutro (pétalas, correntes, gemas soltas).
Sem rembg instalado (sandbox local) usa só a cor e AVISA — serve para testar o resto do pipeline.
"""
from __future__ import annotations

import json
import math
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).parent))
from pedido import RAIZ, carregar  # noqa: E402

LOG: list[str] = []


def log(s: str) -> None:
    print(s, flush=True)
    LOG.append(s)


# ================================================================ fundo

_SESSOES: dict = {}


def mascara_rembg(im: Image.Image, modelo: str) -> tuple[np.ndarray, str]:
    from rembg import new_session, remove  # import tardio: só existe no runner

    for nome in (modelo, "birefnet-general", "isnet-general-use"):
        try:
            if nome not in _SESSOES:
                _SESSOES[nome] = new_session(nome)
            m = remove(im, session=_SESSOES[nome], only_mask=True, post_process_mask=False)
            return np.asarray(m.convert("L"), dtype=np.float32) / 255.0, nome
        except Exception as e:  # noqa: BLE001
            log(f"    rembg '{nome}' falhou: {e}")
    raise RuntimeError("nenhum modelo do rembg funcionou")


def cor_fundo(rgb: np.ndarray) -> np.ndarray:
    borda = np.concatenate([rgb[:8].reshape(-1, 3), rgb[-8:].reshape(-1, 3),
                            rgb[:, :8].reshape(-1, 3), rgb[:, -8:].reshape(-1, 3)])
    return np.median(borda, axis=0)


def mascara_por_cor(rgb: np.ndarray) -> np.ndarray:
    bg = cor_fundo(rgb)
    dist = np.sqrt(((rgb - bg) ** 2).sum(-1))
    a = np.clip((dist - 12.0) / 30.0, 0, 1)
    fundo = ndimage.label(a < 0.5)[0]
    ids_borda = set(np.unique(np.concatenate([fundo[0], fundo[-1], fundo[:, 0], fundo[:, -1]]))) - {0}
    areas = np.bincount(fundo.ravel())
    grandes = {i for i in range(1, len(areas)) if areas[i] > 0.01 * fundo.size}
    ligado = np.isin(fundo, list(ids_borda | grandes))
    a[~ligado] = np.maximum(a[~ligado], 1.0)
    return a


def zonas_quadriculado(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Xadrez desenhado: cinzas neutros (R≈G≈B, diferença ≤ 6) claros, alternando claro (~253) e médio (~207).
    zona = janelas 19×19 quase só de xadrez com as duas cores presentes; ext = zona + todos os pixels xadrez
    ligados a ela (a janela para antes do objeto). Fitas brancas/rosadas têm matiz (diferença ≥ 10) e ficam fora."""
    mx, mn = rgb.max(-1), rgb.min(-1)
    neutro = (mx - mn) <= 6
    xadrez = neutro & (mx > 186)
    clara = xadrez & (mx > 236)
    media = xadrez & (mx <= 236)
    f = lambda m: ndimage.uniform_filter(m.astype(np.float32), 19)  # noqa: E731
    zona = (f(xadrez) > 0.965) & (f(clara) > 0.08) & (f(media) > 0.08)
    # áreas de "névoa" branca do gerador sobre o xadrez: neutras e claras, coladas na zona
    nevoa = neutro & (mx > 200) & (f(neutro & (mx > 200)) > 0.95)
    rot, n = ndimage.label(nevoa)
    if n:
        toca = np.unique(rot[zona & (rot > 0)])
        zona |= np.isin(rot, toca[toca > 0])
    # cresce por pixels "de fundo": xadrez puro ou xadrez visto através de véu tingido (claro, pouca cor,
    # textura bimodal claro/escuro na janela 9×9), desde que ligados à zona. Fitas lisas não têm a textura.
    g = lambda m: ndimage.uniform_filter(m.astype(np.float32), 9)  # noqa: E731
    lum = rgb @ np.array([0.299, 0.587, 0.114])
    med = ndimage.uniform_filter(lum, 9)
    dp = np.sqrt(np.maximum(ndimage.uniform_filter(lum ** 2, 9) - med ** 2, 0))
    bimodal = (g(lum > med + 4) > 0.22) & (g(lum < med - 4) > 0.22) & (dp > 4.5) & (dp < 30)
    tingido = ((mx - mn) <= 22) & (lum > 175) & bimodal
    cand = (xadrez & bimodal) | tingido | zona
    rot_x, _ = ndimage.label(cand)
    ids = np.unique(rot_x[zona & (rot_x > 0)])
    ext = np.isin(rot_x, ids[ids > 0]) | zona
    ext = ndimage.binary_closing(ext, iterations=1) & (cand | xadrez)
    return zona, ext, xadrez


def periodicidade(lum: np.ndarray) -> np.ndarray:
    """~1 onde a textura é um xadrez (anticorrelação a 1 casa na horizontal e na vertical, correlação na
    diagonal, casas de 7–13 px); ~0 em penas, fitas e metal."""
    hp = lum - ndimage.gaussian_filter(lum, 5)
    e = ndimage.uniform_filter(hp * hp, 15) + 1e-3
    melhor = np.full(lum.shape, -9.0, np.float32)
    for c in range(7, 14):
        sx, sy = np.roll(hp, c, 1), np.roll(hp, c, 0)
        n1 = ndimage.uniform_filter(hp * sx, 15) / e
        n2 = ndimage.uniform_filter(hp * sy, 15) / e
        p = ndimage.uniform_filter(hp * np.roll(sx, c, 0), 15) / e
        melhor = np.maximum(melhor, (-(n1 + n2) / 2 + p) / 2)
    return melhor


def remover_fundo(bruto: Image.Image, rgb: np.ndarray, pos: dict, tem_rembg: bool):
    """Devolve (alfa, máscara de fundo certo, descrição, rgb possivelmente corrigido)."""
    if not pos["remover_fundo"]:
        return np.ones(rgb.shape[:2], np.float32), np.zeros(rgb.shape[:2], bool), "mantido", rgb
    if pos["fundo"] == "quadriculado":
        zona, ext, xadrez = zonas_quadriculado(rgb)
        plano = rgb.copy()
        plano[ext] = 128.0
        # objeto com certeza: nem xadrez, nem claro-e-quase-sem-cor (véu tingido fica a cargo do rembg)
        lum = rgb @ np.array([0.299, 0.587, 0.114])
        palido = ((rgb.max(-1) - rgb.min(-1)) <= 24) & (lum > 175)
        cor = ~xadrez & ~ext & ~palido
        if tem_rembg:
            a_r, usado = mascara_rembg(Image.fromarray(plano.astype(np.uint8)), pos["modelo_fundo"])
            desc = f"quadriculado+rembg:{usado}"
        else:  # pior caso do rembg: considera objeto tudo que não é zona de xadrez
            a_r, desc = (~ext).astype(np.float32), "quadriculado (teste, sem rembg)"
        a = np.maximum(a_r, cor.astype(np.float32))
        a[ext] = 0.0
        # xadrez visto através de véu tingido em qualquer lugar (o rembg costuma manter): claro, pouca cor,
        # textura claro/escuro na janela 9×9. Fitas e penas lisas ou coloridas não entram.
        g = lambda m: ndimage.uniform_filter(m.astype(np.float32), 9)  # noqa: E731
        med = ndimage.uniform_filter(lum, 9)
        dp = np.sqrt(np.maximum(ndimage.uniform_filter(lum ** 2, 9) - med ** 2, 0))
        veu = (g((rgb.max(-1) - rgb.min(-1)) <= 24) > 0.7) & (med > 185) & (dp < 30) & (periodicidade(lum) > 0.35)
        veu = ndimage.binary_closing(veu, iterations=2)
        rot, n = ndimage.label(veu)
        if n:
            areas = np.bincount(rot.ravel())
            veu = (areas[rot] >= 150) & (rot > 0)
        # véu translúcido pintado sobre o xadrez: estima a opacidade pelo contraste que sobrou do xadrez
        # (xadrez limpo: desvio ~23 de luminância) e troca a textura pela cor média desmisturada
        alvo = veu & ~cor
        alfa_v = np.clip(1 - dp / 23.0, 0, 1)
        alfa_v[alfa_v < 0.15] = 0
        media_rgb = np.dstack([ndimage.uniform_filter(rgb[..., i], 9) for i in range(3)])
        cor_v = (media_rgb - (1 - alfa_v[..., None]) * 230.0) / np.maximum(alfa_v[..., None], 1e-3)
        rgb = rgb.copy()
        rgb[alvo] = np.clip(cor_v[alvo], 0, 255)
        a[alvo] = np.minimum(a[alvo], alfa_v[alvo])
        fundo = ext | (alvo & (alfa_v == 0))
        return a.astype(np.float32), fundo, desc, rgb
    if tem_rembg:
        a, usado = mascara_rembg(bruto, pos["modelo_fundo"])
        return a, a < 0.02, f"rembg:{usado}", rgb
    a = mascara_por_cor(rgb)
    return a, a < 0.02, "cor (teste)", rgb


def limpar(rgb: np.ndarray, a: np.ndarray, fundo_certo: np.ndarray, ilha_min: int, ilha_rel: float,
           apara_palido: bool = False):
    """Halo, ilhas soltas e cor do fundo misturada nas bordas semitransparentes."""
    info = {}
    a = np.clip((a - 0.04) / 0.94, 0, 1)
    a[a > 0.985] = 1.0
    rot, n = ndimage.label(a > 0.1)
    if n > 1:
        areas = ndimage.sum(np.ones_like(a), rot, index=np.arange(1, n + 1))
        manter = np.zeros(n + 1, bool)
        manter[1:] = areas >= max(ilha_min, ilha_rel * areas.max())
        perto = ndimage.binary_dilation(manter[rot] & (rot > 0), iterations=3)
        a[~perto] = 0
        info["ilhas_removidas"] = int((~manter[1:]).sum())
    # cor do fundo local = pixel de fundo mais próximo (serve para fundo liso e para o xadrez)
    ref = fundo_certo if fundo_certo.any() else (a < 0.02)
    if ref.any():
        _, (iy, ix) = ndimage.distance_transform_edt(~ref, return_indices=True)
        bg = rgb[iy, ix]
    else:
        bg = np.broadcast_to(cor_fundo(rgb), rgb.shape)
    meio = (a > 0.02) & (a < 0.98)
    if meio.any():
        am = a[meio][:, None]
        rgb = rgb.copy()
        rgb[meio] = np.clip((rgb[meio] - (1 - am) * bg[meio]) / am, 0, 255)
    if apara_palido:
        # franja clara do xadrez colada na borda: pixel pálido (quase sem cor, claro) na beira do recorte some
        lum = rgb @ np.array([0.299, 0.587, 0.114])
        palido = ((rgb.max(-1) - rgb.min(-1)) <= 16) & (lum > 195)
        a = a.copy()
        total = 0
        for _ in range(3):  # até 3 anéis de franja
            borda = (a > 0) & ndimage.binary_dilation(a < 0.05, iterations=1) & palido
            a[borda] = 0
            total += int(borda.sum())
        info["franja_aparada_px"] = total
    rgb[a <= 0.0] = 0
    return rgb, a, info


def rgba(rgb: np.ndarray, a: np.ndarray) -> Image.Image:
    arr = np.dstack([np.clip(rgb, 0, 255), np.clip(a * 255, 0, 255)]).round().astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def redimensionar(im: Image.Image, tam: tuple[int, int]) -> Image.Image:
    """Redimensiona com alfa pré-multiplicado (sem franja escura)."""
    return im.convert("RGBa").resize(tam, Image.LANCZOS).convert("RGBA")


# ================================================================ moldura

def janela(molde: dict, S: int):
    """Forma da janela no quadro S×S: (sdf(xx, yy) em px, negativo dentro; raio polar alvo(θ); meta)."""
    cx, cy = molde["centro"][0] * S, molde["centro"][1] * S
    if molde["forma"] == "quadrado":
        h = molde["lado"] * S / 2
        rc = min(h, molde.get("raio_canto", 0.04) * S)

        def sdf(xx, yy):
            qx, qy = np.abs(xx - cx) - (h - rc), np.abs(yy - cy) - (h - rc)
            fora = np.sqrt(np.maximum(qx, 0) ** 2 + np.maximum(qy, 0) ** 2)
            return fora + np.minimum(np.maximum(qx, qy), 0) - rc

        def polar(th):
            return h / np.maximum(np.abs(np.cos(th)), np.abs(np.sin(th)))

        meta = {"forma": "quadrado", "centro_px": [round(cx, 1), round(cy, 1)], "lado_px": round(2 * h, 1),
                "raio_canto_px": round(rc, 1), "lado_fracao": molde["lado"]}
        return sdf, polar, meta
    if molde["forma"] == "oval":
        rxf, ryf = molde["raio"]
    else:
        rxf = ryf = molde["raio"]
    rx, ry = rxf * S, ryf * S

    def sdf(xx, yy):
        rho = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
        return (rho - 1) * min(rx, ry)

    def polar(th):
        return (rx * ry) / np.sqrt((ry * np.cos(th)) ** 2 + (rx * np.sin(th)) ** 2)

    meta = {"forma": molde["forma"], "centro_px": [round(cx, 1), round(cy, 1)],
            "raio_px": [round(rx, 1), round(ry, 1)], "raio_fracao": [rxf, ryf]}
    return sdf, polar, meta


def abrir_centro(rgb: np.ndarray, a: np.ndarray, bg: np.ndarray) -> tuple[np.ndarray, bool]:
    """Se o removedor deixou o miolo (cor do fundo) opaco, apaga a região da cor do fundo ligada ao centro."""
    h, w = a.shape
    dist = np.sqrt(((rgb - bg) ** 2).sum(-1))
    rot = ndimage.label(dist < 22)[0]
    alvo = rot[h // 2, w // 2]
    if not alvo:
        return a, False
    reg = rot == alvo
    if reg.sum() < 0.01 * a.size:
        return a, False
    perto = ndimage.binary_dilation(reg, iterations=2)
    suave = np.clip((dist - 12.0) / 30.0, 0, 1)
    a = a.copy()
    a[reg] = 0
    a[perto & ~reg] = np.minimum(a[perto & ~reg], suave[perto & ~reg])
    return a, True


def detectar_abertura(a: np.ndarray) -> dict | None:
    """Raios a partir do centro até o primeiro pixel opaco; recentra pelos pontos de contato."""
    h, w = a.shape
    cx, cy = w / 2, h / 2
    th = np.linspace(0, 2 * math.pi, 360, endpoint=False)
    passos = np.arange(2, min(w, h) * 0.49, 1.0)
    for _ in range(3):
        if a[int(cy), int(cx)] > 0.5:
            return None
        xs = cx + np.cos(th)[:, None] * passos[None]
        ys = cy + np.sin(th)[:, None] * passos[None]
        xi = np.clip(xs.round().astype(int), 0, w - 1)
        yi = np.clip(ys.round().astype(int), 0, h - 1)
        opaco = a[yi, xi] > 0.5
        bateu = opaco.any(1)
        if bateu.mean() < 0.6:
            return None
        idx = opaco.argmax(1)
        r = passos[idx]
        hx, hy = xs[np.arange(360), idx], ys[np.arange(360), idx]
        cx, cy = float(hx[bateu].mean()), float(hy[bateu].mean())
    return {"cx": cx, "cy": cy, "theta": th[bateu], "r": r[bateu], "cobertura": float(bateu.mean())}


def aplicar_molde(im: Image.Image, molde: dict, S: int, avisos: list[str]) -> tuple[Image.Image, dict]:
    a = np.asarray(im, dtype=np.float32)[..., 3] / 255.0
    w, h = im.size
    sdf, polar, meta_j = janela(molde, S)
    tcx, tcy = molde["centro"][0] * S, molde["centro"][1] * S
    jan = detectar_abertura(a)
    if jan is None:
        avisos.append("abertura central não detectada (centro ocupado ou aro aberto): molde aplicado sem reencaixe")
        s = S / max(w, h)
        cx, cy = w / 2, h / 2
    else:
        # escala que põe ~85% do aro interno dentro da janela alvo (sem fresta entre avatar e aro)
        s = float(np.percentile(polar(jan["theta"]) / jan["r"], 15))
        cx, cy = jan["cx"], jan["cy"]
    inv = (1 / s, 0, cx - tcx / s, 0, 1 / s, cy - tcy / s)
    quadro = im.convert("RGBa").transform((S, S), Image.AFFINE, inv, resample=Image.BICUBIC).convert("RGBA")
    total = a.sum() * s * s
    dentro = np.asarray(quadro, dtype=np.float32)[..., 3].sum() / 255.0
    cortado = max(0.0, 1 - dentro / total) if total else 0.0
    if cortado > 0.01:
        avisos.append(f"{cortado:.1%} do ornamento ficou fora do quadro — reduza a janela ou peça mais margem no prompt")
    arr = np.asarray(quadro, dtype=np.float32)
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32) + 0.5
    d = sdf(xx, yy)
    af = arr[..., 3] / 255.0 * np.clip(d + 0.5, 0, 1)
    larg = max(1.0, molde["largura_sombra"] * S)
    sh = np.where(d < 0, molde["sombra"] * np.clip(1 + d / larg, 0, 1) ** 2, 0.0)
    ao = af + sh * (1 - af)
    cor = np.where(ao[..., None] > 0, arr[..., :3] * af[..., None] / np.maximum(ao, 1e-6)[..., None], 0)
    meta = {"janela": meta_j,
            "reencaixe": None if jan is None else {"escala": round(float(s), 4), "cobertura_aro": round(float(jan["cobertura"]), 2)},
            "ornamento_cortado": round(float(cortado), 4)}
    return rgba(cor, ao), meta


# ================================================================ emblema / ilustração / camada

def recortar(im: Image.Image, S: int, margem: float, quadrado: bool) -> Image.Image:
    a = np.asarray(im)[..., 3]
    ys, xs = np.nonzero(a > 4)
    if not len(xs):
        raise RuntimeError("imagem ficou vazia depois de remover o fundo")
    obj = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    ow, oh = obj.size
    k = S * (1 - 2 * margem) / max(ow, oh)
    nw, nh = max(1, round(ow * k)), max(1, round(oh * k))
    obj = redimensionar(obj, (nw, nh))
    if quadrado:
        tela = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    else:
        m = round(S * margem)
        tela = Image.new("RGBA", (nw + 2 * m, nh + 2 * m), (0, 0, 0, 0))
    tela.alpha_composite(obj, ((tela.width - nw) // 2, (tela.height - nh) // 2))
    return tela


def camada_por_cor(final: Image.Image, c: dict) -> Image.Image:
    """Camada de animação alinhada ao final (mesmo quadro): só os pixels na faixa de matiz/saturação/valor.
    Ex.: gema para brilho, glifos que acendem. O CSS anima opacidade/filtro dela por cima do asset."""
    arr = np.asarray(final, dtype=np.float32) / 255.0
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    mx, mn = arr[..., :3].max(-1), arr[..., :3].min(-1)
    v, sat = mx, np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    hue = np.zeros_like(mx)
    dd = np.maximum(mx - mn, 1e-6)
    hue = np.where(mx == r, ((g - b) / dd) % 6, np.where(mx == g, (b - r) / dd + 2, (r - g) / dd + 4)) * 60
    h0, h1 = c["matiz"]
    em = (hue >= h0) & (hue <= h1) if h0 <= h1 else (hue >= h0) | (hue <= h1)
    m = em & (sat >= c.get("sat_min", 0.45)) & (v >= c.get("val_min", 0.35)) & (arr[..., 3] > 0.5)
    m = ndimage.binary_opening(m, iterations=1)
    rot, n = ndimage.label(m)
    if n:
        areas = ndimage.sum(np.ones_like(mx), rot, index=np.arange(1, n + 1))
        keep = np.zeros(n + 1, bool)
        keep[1:] = areas >= c.get("area_min", 30)
        m = keep[rot]
    suave = ndimage.gaussian_filter(m.astype(np.float32), 1.0)
    a = np.clip(suave * 1.6, 0, 1) * arr[..., 3]
    return rgba(arr[..., :3] * 255, a)


# ================================================================ balão (9-slice)

def energia(im: Image.Image) -> np.ndarray:
    arr = np.asarray(im, dtype=np.float32)
    lum = (arr[..., :3] @ np.array([0.299, 0.587, 0.114])) * (arr[..., 3] / 255.0)
    lum = ndimage.gaussian_filter(lum, 1.2)
    return np.hypot(ndimage.sobel(lum, 0), ndimage.sobel(lum, 1))


def corrida(perfil: np.ndarray, inicio: int, passo: int, lim: float, n: int = 6) -> int:
    """Do índice inicio andando em passo, primeiro ponto onde perfil > lim por n amostras seguidas."""
    i, seguidas = inicio, 0
    while 0 <= i < len(perfil):
        seguidas = seguidas + 1 if perfil[i] > lim else 0
        if seguidas >= n:
            return i - passo * (n - 1)
        i += passo
    return i - passo


def nove_fatias(final: Image.Image, pasta: Path, pid: str, nome: str, derivados: list[int], avisos: list[str]):
    """Mede as fatias do balão e monta o kit: corpo esticável (centro liso, borda uniforme) + pontas fixas."""
    W, H = final.size
    E = energia(final)
    al = np.asarray(final)[..., 3] / 255.0
    faixa_y = slice(int(H * 0.42), int(H * 0.58))
    faixa_x = slice(int(W * 0.40), int(W * 0.60))
    col = ndimage.uniform_filter1d(E[faixa_y].mean(0), 9)
    lin = ndimage.uniform_filter1d(E[:, faixa_x].mean(1), 5)
    base_c = float(np.median(col[int(W * 0.35):int(W * 0.65)]))
    base_l = float(np.median(lin[int(H * 0.4):int(H * 0.6)]))
    lim_c, lim_l = base_c * 3 + 2, base_l * 3 + 2
    L = corrida(col, W // 2, -1, lim_c, 10)
    R = corrida(col, W // 2, +1, lim_c, 10)
    T = corrida(lin, H // 2, -1, lim_l, 3)
    B = corrida(lin, H // 2, +1, lim_l, 3)
    pad = max(2, round(W * 0.004))
    L, R = max(1, L - pad), min(W - 1, R + pad)
    T, B = max(1, T - pad), min(H - 1, B + pad)
    if R - L < W * 0.2 or B - T < H * 0.15:
        avisos.append("9-slice: miolo liso estreito — conferir a prancha")
    # corpo: entre as pontas, perfil vertical mediano repetido na horizontal (borda uniforme e esticável)
    arr = np.asarray(final, dtype=np.float32)
    meio = arr[:, L:R]
    perfil = np.median(meio, axis=1)  # H × 4
    ys = np.nonzero(perfil[:, 3] > 128)[0]
    y0, y1 = (int(ys.min()), int(ys.max()) + 1) if len(ys) else (0, H)
    perfil = perfil[y0:y1].copy()
    t_c, b_c = max(1, T - y0), max(1, y1 - B)
    if t_c + b_c < len(perfil):
        perfil[t_c:len(perfil) - b_c] = perfil[t_c:len(perfil) - b_c].mean(0)  # centro liso para o texto
    larg_corpo = 64
    corpo = Image.fromarray(np.repeat(perfil[:, None, :], larg_corpo, 1).round().clip(0, 255).astype(np.uint8), "RGBA")
    # pontas: colunas 0..L e R..W com 3% de sobra que se funde ao corpo
    sobra = round(W * 0.03)
    esq = final.crop((0, 0, min(W, L + sobra), H))
    dir_ = final.crop((max(0, R - sobra), 0, W, H))
    for im, lado in ((esq, "esq"), (dir_, "dir")):
        a = np.asarray(im, dtype=np.float32).copy()
        rampa = np.linspace(1, 0, sobra)
        if lado == "esq":
            a[:, -sobra:, 3] *= rampa[None]
        else:
            a[:, :sobra, 3] *= rampa[::-1][None]
        im.paste(Image.fromarray(a.round().astype(np.uint8), "RGBA"))
    pasta.mkdir(parents=True, exist_ok=True)
    arquivos = []
    for nm, im in (("kit-corpo", corpo), ("kit-ponta-esq", esq), ("kit-ponta-dir", dir_)):
        for d in derivados:
            k = d / W
            t = redimensionar(im, (max(1, round(im.width * k)) if nm != "kit-corpo" else larg_corpo,
                                   max(1, round(im.height * k))))
            n = f"{pid}--{nome}--{nm}--{d}.webp"
            t.save(pasta / n, "WEBP", quality=92, alpha_quality=100, method=6)
            arquivos.append(n)
    meta = {
        "tamanho_px": [W, H],
        "nove_fatias": {"top": T, "right": W - R, "bottom": H - B, "left": L,
                        "css": f"border-image: url(...) {T} {W - R} {H - B} {L} fill / auto; border-image-repeat: stretch;",
                        "obs": "medidas em px do original; nos derivados multiplique por largura/W"},
        "kit": {"corpo": {"altura_px": int(y1 - y0), "topo_no_original": y0,
                          "fatias": {"top": t_c, "bottom": b_c, "left": 0, "right": 0},
                          "obs": "uniforme na horizontal; estique livre. Centro liso (texto)."},
                "ponta_esq": {"largura_px": esq.width, "sobreposicao_px": sobra},
                "ponta_dir": {"largura_px": dir_.width, "sobreposicao_px": sobra},
                "texto": {"x0": L, "x1": R, "y0": T, "y1": B}},
        "arquivos_kit": arquivos,
    }
    return meta, corpo, esq, dir_


# ================================================================ saída

def salvar(final: Image.Image, pid: str, nome: str, derivados: list[int], pasta: Path, sufixo: str = "",
           png: bool = True) -> list[dict]:
    pasta.mkdir(parents=True, exist_ok=True)
    arquivos = []
    lado = max(final.size)
    base = f"{pid}--{nome}{sufixo}--{lado}"
    if png:
        final.save(pasta / f"{base}.png", "PNG", optimize=True)
        arquivos.append(f"{base}.png")
    final.save(pasta / f"{base}.webp", "WEBP", quality=94, alpha_quality=100, method=6)
    arquivos.append(f"{base}.webp")
    for d in derivados:
        if d >= lado:
            continue
        k = d / lado
        im = redimensionar(final, (max(1, round(final.width * k)), max(1, round(final.height * k))))
        if d <= 96:
            im = im.filter(ImageFilter.UnsharpMask(radius=0.6, percent=60, threshold=1))
        n = f"{pid}--{nome}{sufixo}--{d}.webp"
        im.save(pasta / n, "WEBP", quality=90 if d >= 256 else 92, alpha_quality=100, method=6)
        arquivos.append(n)
    return [{"arquivo": f, "bytes": (pasta / f).stat().st_size} for f in arquivos]


def fonte(t: int):
    for nome in ("DejaVuSans.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(nome, t)
        except OSError:
            pass
    try:
        return ImageFont.load_default(size=t)
    except TypeError:
        return ImageFont.load_default()


ESCURO, CLARO = (20, 18, 26), (233, 228, 220)


def avatar_ficticio(S: int, meta: dict) -> Image.Image:
    """Avatar de teste sob a moldura (4% maior que a janela, como no app)."""
    j = meta["janela"]
    cx, cy = j["centro_px"]
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32) + 0.5
    if j["forma"] == "quadrado":
        h = j["lado_px"] / 2 * 1.04
        rc = j["raio_canto_px"]
        qx, qy = np.abs(xx - cx) - (h - rc), np.abs(yy - cy) - (h - rc)
        d = np.sqrt(np.maximum(qx, 0) ** 2 + np.maximum(qy, 0) ** 2) + np.minimum(np.maximum(qx, qy), 0) - rc
    else:
        rx, ry = (r * 1.04 for r in j["raio_px"])
        d = (np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2) - 1) * min(rx, ry)
    t = np.clip(yy / S, 0, 1)[..., None]
    cor = (1 - t) * np.array([120, 104, 150]) + t * np.array([46, 40, 64])
    return rgba(cor, np.clip(0.5 - d, 0, 1))


def ladrilho(im: Image.Image, fundo, w: int, h: int | None = None, avatar: Image.Image | None = None) -> Image.Image:
    h = h or w
    t = Image.new("RGBA", (w, h), tuple(fundo) + (255,))
    k = min(w / im.width, h / im.height)
    tam = (max(1, round(im.width * k)), max(1, round(im.height * k)))
    pos = ((w - tam[0]) // 2, (h - tam[1]) // 2)
    if avatar is not None:
        t.alpha_composite(redimensionar(avatar, tam), pos)
    t.alpha_composite(redimensionar(im, tam), pos)
    return t


def balao_montado(corpo, esq, dir_, meta, largura: int, altura_texto: int, escala: float) -> Image.Image:
    """Simula o balão no app: corpo esticado + pontas fixas, para conferir na prancha."""
    k = meta["kit"]
    ch = max(1, round(k["corpo"]["altura_px"] * escala))
    t_c, b_c = (round(k["corpo"]["fatias"][x] * escala) for x in ("top", "bottom"))
    alt_corpo = max(ch, t_c + b_c + altura_texto)
    topo = redimensionar(corpo.crop((0, 0, corpo.width, k["corpo"]["fatias"]["top"])), (largura, max(1, t_c)))
    base = redimensionar(corpo.crop((0, corpo.height - k["corpo"]["fatias"]["bottom"], corpo.width, corpo.height)),
                         (largura, max(1, b_c)))
    meio = redimensionar(corpo.crop((0, k["corpo"]["fatias"]["top"], corpo.width, corpo.height - k["corpo"]["fatias"]["bottom"])),
                         (largura, max(1, alt_corpo - t_c - b_c)))
    pe = redimensionar(esq, (max(1, round(esq.width * escala)), max(1, round(esq.height * escala))))
    pd = redimensionar(dir_, (max(1, round(dir_.width * escala)), max(1, round(dir_.height * escala))))
    oy = round(k["corpo"]["topo_no_original"] * escala)
    H = max(alt_corpo + 2 * oy, pe.height)
    tela = Image.new("RGBA", (largura, H), (0, 0, 0, 0))
    y = (H - alt_corpo) // 2
    tela.alpha_composite(topo, (0, y))
    tela.alpha_composite(meio, (0, y + t_c))
    tela.alpha_composite(base, (0, y + alt_corpo - b_c))
    yp = y + (alt_corpo - pe.height) // 2
    tela.alpha_composite(pe, (0, max(0, yp)))
    tela.alpha_composite(pd, (largura - pd.width, max(0, yp)))
    return tela


def prancha(pid: str, titulo: str, tipo: str, itens: list[dict], destino: Path) -> None:
    larg = 600 if tipo == "balao" else 300
    alt = 220 if tipo == "balao" else 300
    pad, cab = 16, 64
    cols = 2 if tipo == "balao" else min(4, max(1, len(itens)))
    cols = min(cols, max(1, len(itens)))
    linhas = math.ceil(len(itens) / cols)
    alt_cel = 26 + alt * 3 + pad * 3 + 100
    W = pad + cols * (larg + pad)
    H = cab + linhas * (alt_cel + pad)
    tela = Image.new("RGBA", (W, H), (40, 38, 46, 255))
    d = ImageDraw.Draw(tela)
    d.text((pad, 14), f"{titulo}  ·  {pid}", fill=(240, 236, 228), font=fonte(22))
    sub = ("linha 1: bruto · 2: escuro + fatias · 3: montado em 2 alturas · 4: 256px"
           if tipo == "balao" else "linha 1: bruto · 2: fundo escuro · 3: fundo claro · 4: 96px e 48px no escuro")
    d.text((pad, 42), sub, fill=(170, 165, 180), font=fonte(13))
    for i, it in enumerate(itens):
        x = pad + (i % cols) * (larg + pad)
        y = cab + (i // cols) * (alt_cel + pad)
        d.text((x, y + 4), it["rotulo"], fill=(230, 226, 218), font=fonte(13))
        y += 26
        if it.get("bruto") is not None:
            tela.alpha_composite(ladrilho(it["bruto"].convert("RGBA"), (0, 0, 0), larg, alt), (x, y))
        if it.get("final") is None:
            d.rectangle((x, y + alt + pad, x + larg, y + 3 * alt + 2 * pad), fill=(70, 30, 34))
            d.multiline_text((x + 10, y + alt + pad + 10), quebrar(it.get("erro", "falhou"), 40),
                             fill=(255, 210, 210), font=fonte(12))
            continue
        av = it.get("avatar")
        if tipo == "balao" and it.get("kit"):
            lad = ladrilho(it["final"], ESCURO, larg, alt)
            fw, fh = it["final"].size
            k = min(larg / fw, alt / fh)
            ox, oy = (larg - fw * k) / 2, (alt - fh * k) / 2
            nf = it["kit"]["nove_fatias"]
            dd = ImageDraw.Draw(lad)
            for xx in (nf["left"], fw - nf["right"]):
                dd.line([(ox + xx * k, oy), (ox + xx * k, oy + fh * k)], fill=(80, 220, 160), width=1)
            for yy in (nf["top"], fh - nf["bottom"]):
                dd.line([(ox, oy + yy * k), (ox + fw * k, oy + yy * k)], fill=(80, 220, 160), width=1)
            tela.alpha_composite(lad, (x, y + alt + pad))
            linha3 = Image.new("RGBA", (larg, alt), CLARO + (255,))
            e = 0.22
            m1 = balao_montado(*it["kit_imgs"], it["kit"], int(larg * 0.95), 10, e)
            m2 = balao_montado(*it["kit_imgs"], it["kit"], int(larg * 0.7), 70, e)
            linha3.alpha_composite(ladrilho(m1, CLARO, larg, alt // 2), (0, 0))
            linha3.alpha_composite(ladrilho(m2, CLARO, larg, alt // 2), (0, alt // 2))
            tela.alpha_composite(linha3, (x, y + 2 * (alt + pad)))
            yb = y + 3 * (alt + pad)
            d.rectangle((x, yb, x + larg, yb + 100), fill=ESCURO)
            tela.alpha_composite(ladrilho(it["final"], ESCURO, 256, 96), (x + 2, yb + 2))
            continue
        tela.alpha_composite(ladrilho(it["final"], ESCURO, larg, alt, av), (x, y + alt + pad))
        tela.alpha_composite(ladrilho(it["final"], CLARO, larg, alt, av), (x, y + 2 * (alt + pad)))
        yb = y + 3 * (alt + pad)
        d.rectangle((x, yb, x + larg, yb + 96 + 4), fill=ESCURO)
        tela.alpha_composite(ladrilho(it["final"], ESCURO, 96, 96, av), (x + 2, yb + 2))
        tela.alpha_composite(ladrilho(it["final"], ESCURO, 48, 48, av), (x + 110, yb + 26))
        for j, cam in enumerate(it.get("camadas", [])[:2]):
            tela.alpha_composite(ladrilho(cam, (60, 20, 80), 96, 96), (x + 170 + j * 64, yb + 2))
    tela.convert("RGB").save(destino, "PNG", optimize=True)


def quebrar(s: str, n: int) -> str:
    out, linha = [], ""
    for p in s.split():
        if len(linha) + len(p) + 1 > n:
            out.append(linha)
            linha = p
        else:
            linha = (linha + " " + p).strip()
    out.append(linha)
    return "\n".join(out[:14])


# ================================================================ principal

def main() -> int:
    p = carregar(sys.argv[1])
    saida = Path(sys.argv[2])
    pos = p["pos"]
    S = int(pos["tamanho_final"])
    (saida / "bruto").mkdir(parents=True, exist_ok=True)
    if p.get("importar"):
        Image.open(RAIZ / p["importar"]).convert("RGB").save(saida / "bruto" / "v01.png")
    ger = {}
    if (saida / "geracao.json").exists():
        ger = {v["nome"]: v for v in json.loads((saida / "geracao.json").read_text())["variacoes"]}
    try:
        import rembg  # noqa: F401
        tem_rembg = True
    except ImportError:
        tem_rembg = False
        log("AVISO: rembg não instalado — remoção de fundo só por cor (teste; não é o resultado final)")

    itens = []
    manifesto = {"pedido": p["id"], "titulo": p.get("titulo", p["id"]), "tipo": p["tipo"], "tamanho_final": S,
                 "importado": p.get("importar"), "variacoes": []}
    for v in p["variacoes"]:
        nome = f"v{v['n']:02d}"
        mod = v["modelo"].split("/")[-1]
        rot = f"{nome} · {mod}" + (f" · seed {v['seed']}" if not p.get("importar") else "")
        reg = {"nome": nome, "modelo": v["modelo"], "seed": v["seed"], "passos": v["passos"]}
        g = ger.get(nome, {})
        reg.update({k: g[k] for k in ("segundos", "neuronios_estimados", "erro") if g.get(k) is not None})
        arq = saida / "bruto" / f"{nome}.png"
        if not arq.exists():
            reg["erro"] = reg.get("erro", "sem imagem bruta")
            itens.append({"rotulo": rot, "erro": reg["erro"]})
            manifesto["variacoes"].append(reg)
            continue
        t0 = time.time()
        bruto = Image.open(arq).convert("RGB")
        avisos: list[str] = []
        it = {"rotulo": rot, "bruto": bruto}
        try:
            rgb = np.asarray(bruto, dtype=np.float32)
            a, fundo_certo, reg["fundo"], rgb = remover_fundo(bruto, rgb, pos, tem_rembg)
            if p["tipo"] == "moldura" and pos["fundo"] == "liso":
                a, aberto = abrir_centro(rgb, a, cor_fundo(rgb))
                if aberto:
                    reg["miolo_aberto_por_cor"] = True
            imp = bool(p.get("importar"))
            rgb, a, info = limpar(rgb, a, fundo_certo, ilha_min=60 if imp else 40, ilha_rel=0.0 if imp else 0.004,
                                  apara_palido=pos["fundo"] == "quadriculado")
            reg.update(info)
            recorte = rgba(rgb, a)
            av = None
            if p["tipo"] == "moldura":
                final, meta = aplicar_molde(recorte, pos["molde"], S, avisos)
                reg.update(meta)
                av = avatar_ficticio(S, meta)
            else:
                final = recortar(recorte, S, pos["margem"], quadrado=p["tipo"] in ("emblema", "camada"))
                fa = np.asarray(final)[..., 3]
                borda = np.concatenate([fa[0], fa[-1], fa[:, 0], fa[:, -1]])
                if (borda > 8).mean() > 0.02:
                    avisos.append("objeto encosta na borda — o gerador pode ter cortado a peça; peça mais margem")
            reg["arquivos"] = salvar(final, p["id"], nome, pos["derivados"], saida / "final")
            camadas = []
            for c in pos["camadas"]:
                cam = camada_por_cor(final, c)
                cob = float((np.asarray(cam)[..., 3] > 64).mean())
                reg.setdefault("camadas", []).append({"nome": c["nome"], "animacao": c.get("animacao", "brilho"),
                                                      "cobertura": round(cob, 4)})
                if cob < 0.0005:
                    avisos.append(f"camada '{c['nome']}' quase vazia — ajuste a faixa de cor")
                reg["arquivos"] += salvar(cam, p["id"], nome, pos["derivados"], saida / "final",
                                          sufixo=f"--{c['nome']}", png=False)
                camadas.append(cam)
            if p["tipo"] == "balao":
                kit, corpo, esq, dir_ = nove_fatias(final, saida / "final", p["id"], nome,
                                                    [d for d in pos["derivados"] if d <= max(final.size)] or [max(final.size)], avisos)
                reg["balao"] = kit
                it.update({"kit": kit, "kit_imgs": (corpo, esq, dir_)})
            reg["segundos_pos"] = round(time.time() - t0, 1)
            it.update({"final": final, "avatar": av, "camadas": camadas})
        except Exception as e:  # noqa: BLE001
            reg["erro"] = f"pós-processamento: {e}"
            it["erro"] = reg["erro"]
        itens.append(it)
        reg["avisos"] = avisos
        log(f"[{p['id']}] {nome}: {reg.get('fundo', '-')}; " + ("; ".join(avisos) or "sem avisos")
            + (f"; ERRO {reg['erro']}" if reg.get("erro") else ""))
        manifesto["variacoes"].append(reg)

    prancha(p["id"], p.get("titulo", p["id"]), p["tipo"], itens, saida / "prancha.png")
    (saida / "manifest.json").write_text(json.dumps(manifesto, ensure_ascii=False, indent=2), encoding="utf-8")
    (saida / "pedido.json").write_text(json.dumps(p, ensure_ascii=False, indent=2), encoding="utf-8")
    readme(p, manifesto, saida)
    with open(saida / "log.txt", "a", encoding="utf-8") as f:
        f.write("\n".join(LOG) + "\n")
    return 0 if any(v.get("arquivos") for v in manifesto["variacoes"]) else 1


def readme(p: dict, m: dict, saida: Path) -> None:
    L = [f"# {m['titulo']} (`{p['id']}`)", "", f"Tipo: **{p['tipo']}** · tamanho original {m['tamanho_final']}px", "",
         "![prancha](prancha.png)", "", "| var. | modelo | seed | fundo | avisos/erro | arquivos |", "|---|---|---|---|---|---|"]
    for v in m["variacoes"]:
        av = "; ".join(v.get("avisos") or [])
        if v.get("erro"):
            av = (av + " " if av else "") + "ERRO: " + v["erro"]
        arqs = ", ".join(f"[{a['arquivo'].split('--', 2)[-1]}](final/{a['arquivo']})" for a in v.get("arquivos", []))
        L.append(f"| {v['nome']} | {v['modelo'].split('/')[-1]} | {v['seed']} | {v.get('fundo', '-')} | {av.replace('|', '/')} | {arqs} |")
    j = next((v["janela"] for v in m["variacoes"] if v.get("janela")), None)
    if j:
        L += ["", f"Janela do avatar: `{json.dumps(j, ensure_ascii=False)}`. No app: avatar 4% maior que a janela, sob a moldura."]
    b = next((v["balao"] for v in m["variacoes"] if v.get("balao")), None)
    if b:
        L += ["", f"9-slice: `{json.dumps(b['nove_fatias'], ensure_ascii=False)}`", "",
              f"Kit (corpo esticável + pontas): `{json.dumps(b['kit'], ensure_ascii=False)}`"]
    if p.get("prompt"):
        L += ["", "Prompt:", "", "> " + p["prompt"].replace("\n", " ")]
    (saida / "README.md").write_text("\n".join(L) + "\n", encoding="utf-8")


if __name__ == "__main__":
    sys.exit(main())
