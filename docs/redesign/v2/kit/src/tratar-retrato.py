"""Regra de unidade retrato x pixel (provisório, para o kit).
Entrada: um retrato anime RGBA. Saída: retrato com
 1) traço escuro puxado para a tinta da paleta (#3d3247) em vez de preto;
 2) luz chapada: no máximo 64 cores (quantização), sombras em degraus;
 3) leve aquecimento para o papel da paleta (#f3e4cc, 8%);
 4) contorno externo de 1 px de arte (3 px na tela) na cor da tinta.
Uso: python3 tratar-retrato.py entrada.webp saida.png [caixa x0,y0,x1,y1]
"""
import sys
from PIL import Image, ImageFilter, ImageChops

TINTA = (61, 50, 71)
PAPEL = (243, 228, 204)

def tratar(src, out, box=None):
    im = Image.open(src).convert('RGBA')
    if box:
        im = im.crop(box)
    a = im.getchannel('A')
    rgb = im.convert('RGB')
    # 2) luz chapada
    q = rgb.quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    # 1) traço escuro -> tinta
    px = q.load(); w, h = q.size
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            l = 0.299 * r + 0.587 * g + 0.114 * b
            sat = max(r, g, b) - min(r, g, b)
            if l < 48 and sat < 40:  # só o traço neutro; olhos e cores saturadas ficam
                t = l / 48
                px[x, y] = tuple(int(TINTA[i] * (1 - t * .5) + (r, g, b)[i] * t * .5) for i in range(3))
    # 3) aquecimento
    q = Image.blend(q, ImageChops.multiply(q, Image.new('RGB', q.size, PAPEL)), .08)
    out_im = q.convert('RGBA'); out_im.putalpha(a)
    # 4) contorno externo
    mask = a.point(lambda v: 255 if v > 110 else 0)
    grow = mask.filter(ImageFilter.MaxFilter(7))
    edge = ImageChops.subtract(grow, mask)
    base = Image.new('RGBA', out_im.size, TINTA + (0,))
    base.putalpha(edge)
    final = Image.alpha_composite(base, out_im)
    final.save(out)

if __name__ == '__main__':
    box = tuple(int(v) for v in sys.argv[3].split(',')) if len(sys.argv) > 3 else None
    tratar(sys.argv[1], sys.argv[2], box)
