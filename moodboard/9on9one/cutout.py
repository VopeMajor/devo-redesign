"""Remove o fundo branco das guitarras (flood fill a partir das bordas) -> assets/*.png"""
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops

def cutout(src, dst, thr):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    r, g, b = im.split()
    mn = ImageChops.darker(ImageChops.darker(r, g), b)
    m = mn.point(lambda v: 255 if v >= thr else 0)
    for x in range(0, w, 4):
        for y in (0, h - 1):
            if m.getpixel((x, y)) == 255: ImageDraw.floodfill(m, (x, y), 128)
    for y in range(0, h, 4):
        for x in (0, w - 1):
            if m.getpixel((x, y)) == 255: ImageDraw.floodfill(m, (x, y), 128)
    alpha = m.point(lambda v: 0 if v == 128 else 255).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.8))
    out = im.convert("RGBA"); out.putalpha(alpha)
    out.crop(alpha.getbbox()).save(dst)

cutout("src/guitar_angel.jpg", "assets/guitar_angel.png", 246)
cutout("src/guitar_scythe.jpg", "assets/guitar_scythe.png", 232)
