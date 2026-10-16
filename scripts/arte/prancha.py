"""Prancha de comparação lado a lado: referência (esquerda) × prévia (direita) → docs/redesign/criticas/cosmeticos-previa.png"""
import os

from PIL import Image, ImageDraw, ImageFont

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
REF = os.path.join(R, 'docs', 'redesign', 'refs', 'cosmeticos-2')
PV = os.path.join(R, 'public', 'images', 'cosmeticos', 'previa')
AM = os.path.join(R, 'public', 'images', 'cosmeticos')
OUT = os.path.join(R, 'docs', 'redesign', 'criticas', 'cosmeticos-previa.png')
FUNDO = (18, 17, 22, 255)
CEL = 640


def fonte(t):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'):
        if os.path.exists(f):
            return ImageFont.truetype(f, t)
    return ImageFont.load_default()


def caber(img, w, h, fundo=FUNDO):
    img = img.convert('RGBA')
    k = min(w / img.width, h / img.height)
    img = img.resize((int(img.width * k), int(img.height * k)), Image.LANCZOS)
    c = Image.new('RGBA', (w, h), fundo)
    c.alpha_composite(img, ((w - img.width) // 2, (h - img.height) // 2))
    return c


def com_foto(moldura, foto, W, H, caixa):
    fr = Image.open(moldura).convert('RGBA').resize((W, H), Image.LANCZOS)
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    x0, y0, x1, y1 = caixa
    ph = Image.open(foto).convert('RGBA').resize((x1 - x0, y1 - y0), Image.LANCZOS)
    m = Image.new('L', ph.size, 0)
    ImageDraw.Draw(m).ellipse([0, 0, ph.size[0] - 1, ph.size[1] - 1], fill=255)
    out.paste(ph, (x0, y0), m)
    out.alpha_composite(fr)
    return out


def linha(ref_img, nossa, titulo_ref, titulo_nosso):
    cel = Image.new('RGBA', (CEL * 2 + 30, CEL + 40), FUNDO)
    cel.alpha_composite(caber(ref_img, CEL, CEL, (235, 234, 230, 255)), (0, 40))
    cel.alpha_composite(caber(nossa, CEL, CEL), (CEL + 30, 40))
    d = ImageDraw.Draw(cel)
    d.text((8, 8), titulo_ref, fill=(200, 196, 210), font=fonte(20))
    d.text((CEL + 38, 8), titulo_nosso, fill=(236, 229, 216), font=fonte(20))
    return cel


def main():
    av = com_foto(os.path.join(PV, 'asas-crepusculo-avatar.webp'), os.path.join(AM, 'amostra-retrato.jpg'), 720, 960, (120, 160, 600, 800))
    mi = com_foto(os.path.join(PV, 'asas-crepusculo-mini.webp'), os.path.join(AM, 'amostra-mini.jpg'), 288, 288, (64, 64, 224, 224))
    tamanhos = Image.new('RGBA', (720, 720), FUNDO)
    tamanhos.alpha_composite(mi.resize((420, 420), Image.LANCZOS), (150, 20))
    x = 60
    for s in (128, 96, 64, 48, 36):
        tamanhos.alpha_composite(mi.resize((s, s), Image.LANCZOS), (x, 520 + (128 - s) // 2))
        x += s + 28
    emb = Image.open(os.path.join(PV, 'coracao-condessa.webp')).convert('RGBA')
    embm = Image.open(os.path.join(PV, 'coracao-condessa-mini.webp')).convert('RGBA')
    eb = Image.new('RGBA', (720, 720), FUNDO)
    eb.alpha_composite(emb.resize((480, 480), Image.LANCZOS), (120, 10))
    papel = Image.new('RGBA', (720, 190), (231, 230, 227, 255))
    eb.alpha_composite(papel, (0, 530))
    d = ImageDraw.Draw(eb)
    x = 60
    for s in (48, 32, 24, 20, 16):
        eb.alpha_composite(embm.resize((s, s), Image.LANCZOS), (x, 560))
        eb.alpha_composite(embm.resize((s, s), Image.LANCZOS), (x, 640))
        d.text((x, 700), f'{s}px', fill=(60, 60, 60), font=fonte(13))
        x += s + 60
    linhas = [
        linha(Image.open(os.path.join(REF, 'ref-11.jpg')), av, 'Referência · ref-11 (asas, cristais, correntes)', 'Prévia · Asas do Crepúsculo (avatar, com foto)'),
        linha(Image.open(os.path.join(REF, 'ref-12.jpg')), tamanhos, 'Referência · ref-12 (silhueta orgânica, espinhos)', 'Prévia · miniperfil quadrado (adaptação) e tamanhos reais'),
        linha(Image.open(os.path.join(REF, 'ref-10.jpg')), eb, 'Referência · ref-10 (broches: cristal, ouro, laço)', 'Prévia · Coração da Condessa (grande; 16–48 px no negro e no papel)'),
    ]
    W = linhas[0].width
    H = sum(l.height for l in linhas) + 70
    out = Image.new('RGBA', (W, H), FUNDO)
    ImageDraw.Draw(out).text((10, 18), 'DEVO · cosméticos · prévia da nova direção — referência à esquerda, nossa arte à direita', fill=(236, 229, 216), font=fonte(24))
    y = 70
    for l in linhas:
        out.alpha_composite(l, (0, y))
        y += l.height
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    out.convert('RGB').save(OUT, optimize=True)
    print(OUT)


if __name__ == '__main__':
    main()
