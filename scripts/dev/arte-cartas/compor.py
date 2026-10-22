"""Monta a arte das cartas da Coleção Xadrez: o fundo comum da coleção + a peça pintada (PNG sem fundo) por cima.

Uso: python3 scripts/dev/arte-cartas/compor.py <fundo.png> <peca.png> <id-da-carta> [altura=0.56] [base=0.86]
Gera public/images/cartas/<id>/arte-{512,768,1024}.webp na proporção da janela da carta (74 × 144).
`altura` é a fração da altura da janela ocupada pela peça; `base` é onde fica o pé da peça (0 = topo, 1 = fundo).
"""
import os
import sys

from PIL import Image, ImageFilter

PROP = 144 / 74


def janela(fundo: Image.Image, largura: int) -> Image.Image:
    alt = round(largura * PROP)
    f = fundo.convert('RGB')
    esc = max(largura / f.width, alt / f.height)
    f = f.resize((round(f.width * esc), round(f.height * esc)), Image.LANCZOS)
    x, y = (f.width - largura) // 2, (f.height - alt) // 2
    return f.crop((x, y, x + largura, y + alt))


def compor(fundo, peca, largura=1024, altura=0.56, base=0.86):
    tela = janela(fundo, largura).convert('RGBA')
    H = tela.height
    p = peca.convert('RGBA')
    p = p.crop(p.getbbox())
    h = round(H * altura)
    w = round(p.width * h / p.height)
    if w > largura * 0.9:
        w = round(largura * 0.9)
        h = round(p.height * w / p.width)
    p = p.resize((w, h), Image.LANCZOS)
    x, y = (largura - w) // 2, round(H * base) - h
    # sombra de contato no chão
    sombra = Image.new('RGBA', tela.size, (0, 0, 0, 0))
    elipse = Image.new('L', (round(w * 0.9), max(8, round(h * 0.07))), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(elipse).ellipse((0, 0, elipse.width - 1, elipse.height - 1), fill=170)
    sombra.paste((8, 6, 14, 255), (x + (w - elipse.width) // 2, y + h - elipse.height // 2), elipse)
    tela = Image.alpha_composite(tela, sombra.filter(ImageFilter.GaussianBlur(largura * 0.018)))
    # halo ametista atrás da peça
    halo = Image.new('RGBA', tela.size, (0, 0, 0, 0))
    a = p.split()[3].filter(ImageFilter.GaussianBlur(largura * 0.03)).point(lambda v: v * 0.45)
    halo.paste((170, 150, 230, 255), (x, y), a)
    tela = Image.alpha_composite(tela, halo)
    camada = Image.new('RGBA', tela.size, (0, 0, 0, 0))
    camada.paste(p, (x, y), p)
    return Image.alpha_composite(tela, camada).convert('RGB')


if __name__ == '__main__':
    fundo, peca, cid = Image.open(sys.argv[1]), Image.open(sys.argv[2]), sys.argv[3]
    altura = float(sys.argv[4]) if len(sys.argv) > 4 else 0.56
    base = float(sys.argv[5]) if len(sys.argv) > 5 else 0.86
    d = f'public/images/cartas/{cid}'
    os.makedirs(d, exist_ok=True)
    img = compor(fundo, peca, 1024, altura, base)
    for w in (512, 768, 1024):
        img.resize((w, round(img.height * w / 1024)), Image.LANCZOS).save(f'{d}/arte-{w}.webp', quality=86, method=6)
    print('ok', d)
