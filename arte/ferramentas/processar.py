"""Pós-processamento das imagens geradas: fundo real, bordas, molde, tamanhos, prancha.

Uso:
  python3 arte/ferramentas/processar.py arte/pedidos/<id>.json <pasta-saida>

Lê <saida>/bruto/vNN.png (de gerar.py) e grava:
  final/<id>--vNN--<tam>.png|webp   original (1024–1536) e derivados 512/256/96/48 (WebP com alfa)
  prancha.png                       grade das variações sobre fundo escuro e claro
  manifest.json, README.md, log.txt

Remoção de fundo: rembg (BiRefNet; cai para ISNet). Sem rembg instalado (ex.: sandbox local),
usa recorte por cor do fundo e AVISA no log — serve só para testar o resto do pipeline.
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
from pedido import carregar  # noqa: E402

LOG: list[str] = []


def log(s: str) -> None:
    print(s, flush=True)
    LOG.append(s)


# ---------------------------------------------------------------- fundo

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
    # só remove o fundo ligado à borda (preserva áreas de cor parecida dentro do objeto)
    fundo = ndimage.label(a < 0.5)[0]
    ids_borda = set(np.unique(np.concatenate([fundo[0], fundo[-1], fundo[:, 0], fundo[:, -1]]))) - {0}
    areas = np.bincount(fundo.ravel())
    grandes = {i for i in range(1, len(areas)) if areas[i] > 0.01 * fundo.size}
    ligado = np.isin(fundo, list(ids_borda | grandes))
    a[~ligado] = np.maximum(a[~ligado], 1.0)
    return a


def limpar(rgb: np.ndarray, a: np.ndarray) -> tuple[np.ndarray, np.ndarray, dict]:
    """Halo, ilhas soltas e contaminação de cor do fundo nas bordas semitransparentes."""
    info = {}
    a = np.clip((a - 0.04) / 0.94, 0, 1)  # corta o véu fraco que vira halo
    a[a > 0.985] = 1.0
    rot, n = ndimage.label(a > 0.1)
    if n > 1:
        areas = ndimage.sum(np.ones_like(a), rot, index=np.arange(1, n + 1))
        maior = areas.max()
        manter = np.zeros(n + 1, bool)
        manter[1:] = (areas >= max(40, 0.004 * maior))
        removidas = int((~manter[1:]).sum())
        a = a * manter[rot] + a * (rot == 0)  # pixels <0.1 ficam (antisserrilhado)
        # os de fora de qualquer ilha mantida e longe dela somem
        perto = ndimage.binary_dilation(manter[rot] & (rot > 0), iterations=3)
        a[~perto] = 0
        info["ilhas_removidas"] = removidas
    bg = cor_fundo(rgb)
    meio = (a > 0.02) & (a < 0.98)
    if meio.any():
        am = a[meio][:, None]
        rgb = rgb.copy()
        rgb[meio] = np.clip((rgb[meio] - (1 - am) * bg) / am, 0, 255)
    rgb[a <= 0.0] = 0
    info["fundo_rgb"] = [int(x) for x in bg]
    return rgb, a, info


def rgba(rgb: np.ndarray, a: np.ndarray) -> Image.Image:
    arr = np.dstack([np.clip(rgb, 0, 255), np.clip(a * 255, 0, 255)]).round().astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def redimensionar(im: Image.Image, tam: tuple[int, int]) -> Image.Image:
    """Redimensiona com alfa pré-multiplicado (sem franja escura)."""
    return im.convert("RGBa").resize(tam, Image.LANCZOS).convert("RGBA")


# ---------------------------------------------------------------- moldura

def abrir_centro(rgb: np.ndarray, a: np.ndarray, bg: np.ndarray) -> tuple[np.ndarray, bool]:
    """Garante a abertura da moldura: se o removedor deixou o miolo (cor do fundo) opaco,
    apaga a região da cor do fundo ligada ao centro da imagem."""
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


def raio_alvo(theta: np.ndarray, rx: float, ry: float) -> np.ndarray:
    return (rx * ry) / np.sqrt((ry * np.cos(theta)) ** 2 + (rx * np.sin(theta)) ** 2)


def detectar_janela(a: np.ndarray) -> dict | None:
    """Acha a abertura central: raios a partir do centro até o primeiro pixel opaco."""
    h, w = a.shape
    cx, cy = w / 2, h / 2
    th = np.linspace(0, 2 * math.pi, 360, endpoint=False)
    rmax = min(w, h) * 0.49
    passos = np.arange(2, rmax, 1.0)
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
    if molde["forma"] == "oval":
        rxf, ryf = molde["raio"]
    else:
        rxf = ryf = molde["raio"]
    rx, ry = rxf * S, ryf * S
    tcx, tcy = molde["centro"][0] * S, molde["centro"][1] * S

    jan = detectar_janela(a)
    if jan is None:
        avisos.append("abertura central não detectada (centro ocupado ou aro aberto): molde aplicado sem reencaixe")
        s = S / max(w, h)
        cx, cy = w / 2, h / 2
    else:
        # escala que põe ~85% do aro interno dentro da janela alvo (sem fresta entre avatar e aro)
        s = float(np.percentile(raio_alvo(jan["theta"], rx, ry) / jan["r"], 15))
        cx, cy = jan["cx"], jan["cy"]
    # transforma: ponto (cx, cy) do bruto -> (tcx, tcy) no quadro S
    inv = (1 / s, 0, cx - tcx / s, 0, 1 / s, cy - tcy / s)
    quadro = im.convert("RGBa").transform((S, S), Image.AFFINE, inv, resample=Image.BICUBIC).convert("RGBA")

    # quanto do ornamento ficou fora do quadro
    total = a.sum() * s * s
    dentro = np.asarray(quadro, dtype=np.float32)[..., 3].sum() / 255.0
    cortado = max(0.0, 1 - dentro / total) if total else 0.0
    if cortado > 0.01:
        avisos.append(f"{cortado:.1%} do ornamento ficou fora do quadro — reduza pos.molde.raio ou peça mais margem no prompt")

    arr = np.asarray(quadro, dtype=np.float32)
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32) + 0.5
    rho = np.sqrt(((xx - tcx) / rx) ** 2 + ((yy - tcy) / ry) ** 2)
    dpx = (rho - 1) * min(rx, ry)  # distância aproximada em px até a borda da janela (negativa dentro)
    manter = np.clip(dpx + 0.5, 0, 1)
    af = arr[..., 3] / 255.0 * manter
    # sombra interna leve: preto translúcido dentro da janela, junto da borda, sobre o avatar
    larg = max(1.0, molde["largura_sombra"] * S)
    sh = np.where(dpx < 0, molde["sombra"] * np.clip(1 + dpx / larg, 0, 1) ** 2, 0.0)
    ao = af + sh * (1 - af)
    cor = np.where(ao[..., None] > 0, arr[..., :3] * af[..., None] / np.maximum(ao, 1e-6)[..., None], 0)
    out = rgba(cor, ao)
    meta = {
        "janela": {"forma": molde["forma"], "centro_px": [round(float(tcx), 1), round(float(tcy), 1)],
                   "raio_px": [round(float(rx), 1), round(float(ry), 1)], "raio_fracao": [rxf, ryf]},
        "reencaixe": None if jan is None else {"escala": round(float(s), 4), "cobertura_aro": round(float(jan["cobertura"]), 2)},
        "ornamento_cortado": round(float(cortado), 4),
    }
    return out, meta


# ---------------------------------------------------------------- emblema / ilustração

def recortar(im: Image.Image, S: int, margem: float, quadrado: bool) -> Image.Image:
    a = np.asarray(im)[..., 3]
    ys, xs = np.nonzero(a > 4)
    if not len(xs):
        raise RuntimeError("imagem ficou vazia depois de remover o fundo")
    caixa = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    obj = im.crop(caixa)
    ow, oh = obj.size
    util = S * (1 - 2 * margem)
    k = util / max(ow, oh)
    nw, nh = max(1, round(ow * k)), max(1, round(oh * k))
    obj = redimensionar(obj, (nw, nh))
    if quadrado:
        tela = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    else:
        m = round(S * margem)
        tela = Image.new("RGBA", (nw + 2 * m, nh + 2 * m), (0, 0, 0, 0))
    tela.alpha_composite(obj, ((tela.width - nw) // 2, (tela.height - nh) // 2))
    return tela


# ---------------------------------------------------------------- saída

def salvar(final: Image.Image, pid: str, nome: str, derivados: list[int], pasta: Path) -> list[dict]:
    pasta.mkdir(parents=True, exist_ok=True)
    arquivos = []
    lado = max(final.size)
    base = f"{pid}--{nome}--{lado}"
    final.save(pasta / f"{base}.png", "PNG", optimize=True)
    final.save(pasta / f"{base}.webp", "WEBP", quality=94, alpha_quality=100, method=6)
    arquivos += [f"{base}.png", f"{base}.webp"]
    for d in derivados:
        k = d / lado
        im = redimensionar(final, (max(1, round(final.width * k)), max(1, round(final.height * k))))
        if d <= 96:
            im = im.filter(ImageFilter.UnsharpMask(radius=0.6, percent=60, threshold=1))
        q = 90 if d >= 256 else 92
        n = f"{pid}--{nome}--{d}.webp"
        im.save(pasta / n, "WEBP", quality=q, alpha_quality=100, method=6)
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
    """Disco de avatar de teste sob a moldura (4% maior que a janela, como no app)."""
    j = meta["janela"]
    cx, cy = j["centro_px"]
    rx, ry = (r * 1.04 for r in j["raio_px"])
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    rho = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
    t = np.clip(yy / S, 0, 1)[..., None]
    cor = (1 - t) * np.array([120, 104, 150]) + t * np.array([46, 40, 64])
    a = np.clip((1 - rho) * min(rx, ry), 0, 1)
    return rgba(cor, a)


def ladrilho(im: Image.Image, fundo, lado: int, avatar: Image.Image | None = None) -> Image.Image:
    t = Image.new("RGBA", (lado, lado), fundo + (255,))
    if avatar is not None:
        t.alpha_composite(redimensionar(avatar, (lado, lado)))
    k = lado / max(im.size)
    p = redimensionar(im, (max(1, round(im.width * k)), max(1, round(im.height * k))))
    t.alpha_composite(p, ((lado - p.width) // 2, (lado - p.height) // 2))
    return t


def prancha(pid: str, titulo: str, itens: list[dict], destino: Path) -> None:
    L, pad, cab = 300, 16, 64
    cols = min(4, max(1, len(itens)))
    linhas = math.ceil(len(itens) / cols)
    alt_cel = 26 + L * 3 + pad * 3 + 100
    W = pad + cols * (L + pad)
    H = cab + linhas * (alt_cel + pad)
    tela = Image.new("RGBA", (W, H), (40, 38, 46, 255))
    d = ImageDraw.Draw(tela)
    d.text((pad, 14), f"{titulo}  ·  {pid}", fill=(240, 236, 228), font=fonte(22))
    d.text((pad, 42), "linha 1: bruto · 2: fundo escuro · 3: fundo claro · 4: 96px e 48px no escuro",
           fill=(170, 165, 180), font=fonte(13))
    for i, it in enumerate(itens):
        x = pad + (i % cols) * (L + pad)
        y = cab + (i // cols) * (alt_cel + pad)
        d.text((x, y + 4), it["rotulo"], fill=(230, 226, 218), font=fonte(13))
        y += 26
        if it.get("bruto") is not None:
            tela.alpha_composite(ladrilho(it["bruto"].convert("RGBA"), (0, 0, 0), L), (x, y))
        if it.get("final") is None:
            d.rectangle((x, y + L + pad, x + L, y + 3 * L + 2 * pad), fill=(70, 30, 34))
            d.multiline_text((x + 10, y + L + pad + 10), quebrar(it.get("erro", "falhou"), 40),
                             fill=(255, 210, 210), font=fonte(12))
            continue
        av = it.get("avatar")
        tela.alpha_composite(ladrilho(it["final"], ESCURO, L, av), (x, y + L + pad))
        tela.alpha_composite(ladrilho(it["final"], CLARO, L, av), (x, y + 2 * (L + pad)))
        yb = y + 3 * (L + pad)
        d.rectangle((x, yb, x + L, yb + 96 + 4), fill=ESCURO)
        tela.alpha_composite(ladrilho(it["final"], ESCURO, 96, av), (x + 2, yb + 2))
        tela.alpha_composite(ladrilho(it["final"], ESCURO, 48, av), (x + 110, yb + 26))
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


# ---------------------------------------------------------------- principal

def main() -> int:
    p = carregar(sys.argv[1])
    saida = Path(sys.argv[2])
    pos = p["pos"]
    S = int(pos["tamanho_final"])
    ger = {}
    if (saida / "geracao.json").exists():
        ger = {v["nome"]: v for v in json.loads((saida / "geracao.json").read_text())["variacoes"]}

    try:
        import rembg  # noqa: F401
        tem_rembg = True
    except ImportError:
        tem_rembg = False
        log("AVISO: rembg não instalado — usando recorte por cor (só para teste; não é o resultado final)")

    itens, manifesto = [], {"pedido": p["id"], "titulo": p.get("titulo", p["id"]), "tipo": p["tipo"],
                            "tamanho_final": S, "variacoes": []}
    for v in p["variacoes"]:
        nome = f"v{v['n']:02d}"
        mod = v["modelo"].split("/")[-1]
        rot = f"{nome} · {mod} · seed {v['seed']}"
        reg = {"nome": nome, "modelo": v["modelo"], "seed": v["seed"], "passos": v["passos"]}
        reg.update({k: ger.get(nome, {}).get(k) for k in ("segundos", "neuronios_estimados", "erro") if ger.get(nome, {}).get(k) is not None})
        arq = saida / "bruto" / f"{nome}.png"
        if not arq.exists():
            reg["erro"] = reg.get("erro", "sem imagem bruta")
            itens.append({"rotulo": rot, "erro": reg["erro"]})
            manifesto["variacoes"].append(reg)
            continue
        t0 = time.time()
        bruto = Image.open(arq).convert("RGB")
        avisos: list[str] = []
        try:
            rgb = np.asarray(bruto, dtype=np.float32)
            if not pos["remover_fundo"]:
                a = np.ones(rgb.shape[:2], np.float32)
                reg["fundo"] = "mantido"
            elif tem_rembg:
                a, usado = mascara_rembg(bruto, pos["modelo_fundo"])
                reg["fundo"] = f"rembg:{usado}"
            else:
                a = mascara_por_cor(rgb)
                reg["fundo"] = "cor (teste)"
            if p["tipo"] == "moldura":
                a, aberto = abrir_centro(rgb, a, cor_fundo(rgb))
                if aberto:
                    reg["miolo_aberto_por_cor"] = True
            rgb, a, info = limpar(rgb, a)
            reg.update(info)
            recorte = rgba(rgb, a)
            av = None
            if p["tipo"] == "moldura":
                final, meta = aplicar_molde(recorte, pos["molde"], S, avisos)
                reg.update(meta)
                av = avatar_ficticio(S, meta)
            else:
                final = recortar(recorte, S, pos["margem"], quadrado=(p["tipo"] == "emblema"))
            if p["tipo"] != "moldura":
                fa = np.asarray(final)[..., 3]
                borda = np.concatenate([fa[0], fa[-1], fa[:, 0], fa[:, -1]])
                if (borda > 8).mean() > 0.02:
                    avisos.append("objeto encosta na borda — o gerador pode ter cortado a peça; peça mais margem")
            reg["arquivos"] = salvar(final, p["id"], nome, pos["derivados"], saida / "final")
            reg["segundos_pos"] = round(time.time() - t0, 1)
            itens.append({"rotulo": rot, "bruto": bruto, "final": final, "avatar": av})
        except Exception as e:  # noqa: BLE001
            reg["erro"] = f"pós-processamento: {e}"
            itens.append({"rotulo": rot, "bruto": bruto, "erro": reg["erro"]})
        reg["avisos"] = avisos
        log(f"[{p['id']}] {nome}: {reg.get('fundo', '-')}; " + ("; ".join(avisos) or "sem avisos")
            + (f"; ERRO {reg['erro']}" if reg.get("erro") else ""))
        manifesto["variacoes"].append(reg)

    prancha(p["id"], p.get("titulo", p["id"]), itens, saida / "prancha.png")
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
        av = "; ".join(v.get("avisos") or []) or ""
        if v.get("erro"):
            av = (av + " " if av else "") + "ERRO: " + v["erro"]
        arqs = ", ".join(f"[{a['arquivo'].split('--')[-1]}](final/{a['arquivo']})" for a in v.get("arquivos", []))
        L.append(f"| {v['nome']} | {v['modelo'].split('/')[-1]} | {v['seed']} | {v.get('fundo', '-')} | {av.replace('|', '/')} | {arqs} |")
    if p["tipo"] == "moldura":
        j = next((v["janela"] for v in m["variacoes"] if v.get("janela")), None)
        if j:
            L += ["", f"Janela do avatar: {j['forma']}, centro {j['centro_px']} px, raio {j['raio_px']} px "
                  f"(fração {j['raio_fracao']}). No app: avatar com diâmetro 2×raio×1,04 sob a moldura."]
    L += ["", "Prompt:", "", "> " + p["prompt"].replace("\n", " ")]
    (saida / "README.md").write_text("\n".join(L) + "\n", encoding="utf-8")


if __name__ == "__main__":
    sys.exit(main())
