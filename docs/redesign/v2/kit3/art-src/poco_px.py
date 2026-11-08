"""Poço: cenas e itens em pixel, e as falas e o lixo do jogo copiados sem mudar nenhuma palavra (lib/devo/poco-neblina.ts e poco.ts).
Uso: python poco_px.py (na pasta art-src)"""
from pathlib import Path
from PIL import Image

AQUI = Path(__file__).parent
RAIZ = AQUI.parents[4]
SAI = AQUI.parent / "art" / "os" / "poco"
SAI.mkdir(parents=True, exist_ok=True)

for nome in ("rua", "cena", "figura", "mao"):
    im = Image.open(AQUI / f"poco-{nome}.png").convert("RGB")
    w, h = im.size
    alto = min(h, w * 3 // 4)
    larg = alto * 4 // 3
    x, y = (w - larg) // 2, (h - alto) // 2
    q = im.crop((x, y, x + larg, y + alto)).resize((192, 144), Image.BOX)
    q.quantize(colors=48, method=Image.MEDIANCUT, dither=Image.NONE).save(SAI / f"{nome}.png", optimize=True)
    print(nome, im.size)

# moedas e fragmentos têm desenho próprio em pixel (moedas_px.py)
for f in (RAIZ / "public" / "images" / "poco" / "itens").glob("*-256.webp"):
    if f.stem.startswith(("dracma", "fragmento")):
        continue
    im = Image.open(f).convert("RGBA").resize((64, 64), Image.LANCZOS)
    alfa = im.getchannel("A").point(lambda v: 255 if v > 110 else 0)
    cor = im.convert("RGB").quantize(colors=20, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGBA")
    cor.putalpha(alfa)
    cor.save(SAI / f"{f.stem.replace('-256', '')}.png", optimize=True)

ts = (RAIZ / "lib" / "devo" / "poco-neblina.ts").read_text(encoding="utf-8")
neb = ts[ts.index("export const NEBLINA: NeblinaNo[] = ["):]
neb = neb[:neb.index("\n]\n") + 3].replace("export const NEBLINA: NeblinaNo[] = [", "const NEBLINA=[")
t2 = (RAIZ / "lib" / "devo" / "poco.ts").read_text(encoding="utf-8")
lix = t2[t2.index("export const POCO_LIXO"):]
lix = lix[:lix.index("\n]\n") + 3]
lix = lix[lix.index("= [") + 2:]
(AQUI.parent / "os-poco-dados.js").write_text(
    "// Gerado por art-src/poco_px.py a partir de lib/devo/poco-neblina.ts e poco.ts: não editar à mão.\n"
    "const N=(id,texto,palco)=>({id,tipo:'fala',quem:'narrador',texto,palco}),J=(id,texto,palco)=>({id,tipo:'fala',quem:'jogador',texto,palco}),F=(id,texto,palco)=>({id,tipo:'fala',quem:'figura',texto,palco});\n"
    + neb + "const POCO_LIXO=" + lix, encoding="utf-8")
print("ok")
