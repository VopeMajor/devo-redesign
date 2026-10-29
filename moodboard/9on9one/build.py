"""Gera os PNGs e a composição do moodboard masculino (@9on9one).

Fotos reais vão em photos/: main.jpg (janela Notepad), detail.jpg (topo-esq.)
e setup.jpg (meio-esq.). Sem elas, o slot mostra um placeholder.
Uso: python3 build.py && node render.js
"""
import base64, math, os, random

ROOT = os.path.dirname(os.path.abspath(__file__))
W, H = 1470, 924
CY, CY2, LIME, INK = "#19c7ff", "#0a5cff", "#b6f200", "#0b0b0b"
FONT = "Inter, 'Liberation Sans', sans-serif"
rnd = random.Random(9)


def photo(name, w, h, label):
    for ext in ("jpg", "jpeg", "png", "webp"):
        p = os.path.join(ROOT, "photos", f"{name}.{ext}")
        if os.path.exists(p):
            mime = "image/png" if ext == "png" else f"image/{'jpeg' if ext in ('jpg','jpeg') else ext}"
            data = base64.b64encode(open(p, "rb").read()).decode()
            return (f'<image href="data:{mime};base64,{data}" width="{w}" height="{h}" '
                    f'preserveAspectRatio="xMidYMid slice"/>')
    lines = "".join(f'<line x1="{i}" y1="0" x2="{i-h}" y2="{h}" stroke="#3a3a3a" stroke-width="10"/>'
                    for i in range(0, w + h, 34))
    return (f'<rect width="{w}" height="{h}" fill="#2a2a2a"/>{lines}'
            f'<rect x="{w/2-170}" y="{h/2-38}" width="340" height="76" fill="{INK}" opacity=".85"/>'
            f'<text x="{w/2}" y="{h/2-6}" fill="#fff" font-family="{FONT}" font-weight="800" font-size="22" text-anchor="middle">FOTO @9on9one</text>'
            f'<text x="{w/2}" y="{h/2+22}" fill="{CY}" font-family="{FONT}" font-size="15" text-anchor="middle">{label}</text>')


def clip(id_, w, h, inner):
    return f'<clipPath id="{id_}"><rect width="{w}" height="{h}"/></clipPath><g clip-path="url(#{id_})">{inner}</g>'


def starburst(cx, cy, ro, ri, n, fill, jitter=.25, seed=1):
    r = random.Random(seed)
    pts = []
    for i in range(n * 2):
        a = math.pi * i / n - math.pi / 2
        rad = (ro if i % 2 == 0 else ri) * (1 + r.uniform(-jitter, jitter))
        pts.append(f"{cx + rad*math.cos(a):.1f},{cy + rad*math.sin(a):.1f}")
    return f'<polygon points="{" ".join(pts)}" fill="{fill}"/>'


# ---------- elementos (w, h, svg) ----------

def el_checker():
    s = 24
    return W, H, (f'<defs><pattern id="chk" width="{2*s}" height="{2*s}" patternUnits="userSpaceOnUse">'
                  f'<rect width="{2*s}" height="{2*s}" fill="#fff"/><rect width="{s}" height="{s}" fill="#d4d4d4"/>'
                  f'<rect x="{s}" y="{s}" width="{s}" height="{s}" fill="#d4d4d4"/></pattern></defs>'
                  f'<rect width="{W}" height="{H}" fill="url(#chk)"/>')


def el_photo_detail():
    w, h = 484, 350
    return w, h, clip("cA", w, h, photo("detail", w, h, "detalhe: baggy rasgada / correntes / tênis"))


def el_photo_setup():
    w, h = 480, 360
    return w, h, clip("cB", w, h, photo("setup", w, h, "no quarto / setup PC / com a guitarra"))


def el_stripes():
    w, h = 90, 230
    s = "".join(f'<rect y="{y}" width="{w}" height="9" fill="{CY}"/>' for y in range(0, h, 18))
    return w, h, f'<rect width="{w}" height="{h}" fill="#fff"/>{s}'


def el_eye():
    w, h = 600, 300
    lashes = ""
    for i in range(13):
        t = i / 12
        x = 150 + t * 300
        y = 150 - math.sin(t * math.pi) * 62
        ang = -math.pi / 2 + (t - .5) * 1.9
        L = 40 + rnd.uniform(0, 26)
        tx, ty = x + L * math.cos(ang), y + L * math.sin(ang)
        lashes += f'<path d="M{x-7:.0f},{y+4:.0f} Q{(x+tx)/2-6:.0f},{(y+ty)/2:.0f} {tx:.0f},{ty:.0f} Q{(x+tx)/2+8:.0f},{(y+ty)/2+4:.0f} {x+8:.0f},{y+4:.0f}Z" fill="{INK}"/>'
    lower = "".join(f'<line x1="{190+i*26}" y1="{196+abs(i-4.5)*-3+12}" x2="{186+i*26}" y2="{214+abs(i-4.5)*-3+16}" stroke="{INK}" stroke-width="3"/>' for i in range(10))
    return w, h, (
        f'<rect width="{w}" height="{h}" fill="#fff"/>'
        f'<path d="M430,0 C520,40 560,90 600,60 L600,300 C540,250 470,300 440,260 C500,220 560,180 520,120 C480,70 420,40 430,0Z" fill="{INK}"/>'
        f'<path d="M0,40 C40,20 60,80 30,110 C10,130 40,170 0,180Z" fill="{INK}"/>'
        f'<path d="M0,250 C60,230 90,280 160,300 L0,300Z" fill="{INK}"/>'
        + starburst(300, 150, 150, 70, 12, CY, .3, 4) +
        f'<path d="M140,155 Q300,60 460,150 Q300,230 140,155Z" fill="#fff"/>'
        f'<circle cx="300" cy="150" r="54" fill="{INK}"/><circle cx="300" cy="150" r="34" fill="#2b2b2b"/>'
        f'<circle cx="300" cy="150" r="18" fill="{INK}"/><circle cx="318" cy="132" r="11" fill="#fff"/>'
        f'<circle cx="284" cy="170" r="5" fill="#fff"/>'
        f'<path d="M135,158 Q300,40 468,148 Q300,80 135,158Z" fill="{INK}" stroke="{INK}" stroke-width="10" stroke-linejoin="round"/>'
        f'<path d="M150,160 Q300,240 455,152" fill="none" stroke="{INK}" stroke-width="4"/>'
        + lashes + lower)


def el_burst():
    return 360, 360, starburst(180, 180, 175, 60, 9, CY, .35, 7) + starburst(180, 180, 80, 30, 9, "#fff", .3, 2)


def el_scribble():
    w, h = 420, 300
    pts = []
    for i in range(260):
        a = i / 40 * 2 * math.pi
        rr = 1 + .08 * math.sin(i * .37)
        pts.append(f"{w/2 + 170*rr*math.cos(a) + i*.15:.1f},{h/2 + 110*rr*math.sin(a) - i*.1:.1f}")
    return w, h, f'<polyline points="{" ".join(pts)}" fill="none" stroke="#fff" stroke-width="2.2" opacity=".9"/>'


def el_skull():
    w, h = 190, 210
    s = f'stroke="{INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"'
    return w, h, (
        f'<path d="M95,22 C150,22 172,62 168,104 C166,124 152,132 148,146 L146,170 L44,170 L42,146 C38,132 24,124 22,104 C18,62 40,22 95,22Z" fill="#fff" {s}/>'
        f'<path d="M58,92 l26,26 M84,92 l-26,26 M108,92 l26,26 M134,92 l-26,26" {s}/>'
        f'<path d="M95,128 l-9,16 h18Z" fill="{INK}" {s}/>'
        f'<path d="M60,170 v22 h70 v-22 M78,170 v22 M95,170 v22 M112,170 v22" fill="#fff" {s}/>'
        f'<path d="M18,108 C10,30 180,30 172,108" fill="none" {s} stroke-width="9"/>'
        f'<rect x="4" y="92" width="26" height="50" rx="8" fill="{CY}" {s}/>'
        f'<rect x="160" y="92" width="26" height="50" rx="8" fill="{CY}" {s}/>'
        f'<path d="M150,40 l14,-26 M160,50 l24,-14" {s} stroke-width="3"/>')


def thorn(bx, by, tx, ty, wd, bend):
    dx, dy = tx - bx, ty - by
    L = math.hypot(dx, dy)
    nx, ny = -dy / L, dx / L
    b1 = (bx + nx * wd, by + ny * wd)
    b2 = (bx - nx * wd, by - ny * wd)
    c = (bx + dx * .55 + nx * bend, by + dy * .55 + ny * bend)
    return (f"M{b1[0]:.1f},{b1[1]:.1f} Q{c[0]+nx*wd*.5:.1f},{c[1]+ny*wd*.5:.1f} {tx:.1f},{ty:.1f} "
            f"Q{c[0]-nx*wd*.5:.1f},{c[1]-ny*wd*.5:.1f} {b2[0]:.1f},{b2[1]:.1f}Z")


def el_sigil():
    w, h = 300, 560
    cx = w / 2
    d = [f"M{cx},8 C{cx+16},180 {cx+16},380 {cx},552 C{cx-16},380 {cx-16},180 {cx},8Z"]
    spec = [(90, 120, 40, 14, -30), (150, 140, 70, 12, 25), (230, 130, 150, 16, -35),
            (300, 110, 250, 12, 30), (360, 140, 330, 14, -25), (420, 100, 500, 12, 35),
            (470, 70, 420, 10, -20), (200, 60, 205, 9, 20)]
    for by, dxs, ty, wd, bend in spec:
        for sgn in (1, -1):
            d.append(thorn(cx, by, cx + sgn * dxs, ty, wd, bend * sgn))
    d.append(thorn(cx, 280, cx + 8, 280 - 1, 1, 0))
    paths = "".join(f'<path d="{p}"/>' for p in d)
    return w, h, (f'<g fill="#fff" stroke="#fff" stroke-width="16" stroke-linejoin="round">{paths}</g>'
                  f'<g fill="{INK}">{paths}</g>'
                  f'<circle cx="{cx}" cy="280" r="20" fill="{INK}" stroke="#fff" stroke-width="6"/>'
                  f'<circle cx="{cx}" cy="280" r="7" fill="{CY}"/>')


def el_notepad():
    w, h = 660, 470
    btn = lambda x, bw, fill, glyph: (f'<rect x="{x}" y="6" width="{bw}" height="24" rx="4" fill="{fill}" stroke="#5c7ea8"/>{glyph}')
    return w, h, (
        f'<defs><linearGradient id="fr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3eefb"/>'
        f'<stop offset="1" stop-color="#9fbfe6"/></linearGradient>'
        f'<linearGradient id="cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8907f"/><stop offset="1" stop-color="#c2352a"/></linearGradient></defs>'
        f'<rect x="0" y="0" width="{w}" height="{h}" rx="8" fill="url(#fr)" stroke="#4d6f99" stroke-width="2"/>'
        f'<text x="14" y="25" font-family="{FONT}" font-size="17" fill="#111">Untitled - Notepad</text>'
        + btn(486, 46, "#dfeaf8", '<rect x="502" y="20" width="14" height="4" fill="#333"/>')
        + btn(534, 46, "#dfeaf8", '<rect x="550" y="11" width="14" height="12" fill="none" stroke="#333" stroke-width="2.5"/>')
        + btn(582, 66, "url(#cl)", '<path d="M606,11 l16,14 M622,11 l-16,14" stroke="#fff" stroke-width="3.5"/>')
        + f'<g transform="translate(10,38)">{clip("cM", w-20, h-48, photo("main", w-20, h-48, "foto principal (rosto / close)"))}</g>'
        f'<rect x="10" y="38" width="{w-20}" height="{h-48}" fill="none" stroke="#6d8bb3"/>')


def el_menu():
    w, h = 310, 330
    rows = [("Reply", "reply"), ("Copy", "copy"), ("Edit", "edit"), ("Forward", "fwd"), ("Delete", "del")]
    icons = {
        "reply": "M0,8 l8,-8 M0,8 l8,8 M0,8 h12 c6,0 10,4 10,10",
        "copy": "M4,0 h12 v16 h-12Z M0,4 v16 h12",
        "edit": "M2,20 l2,-7 l12,-12 l5,5 l-12,12Z",
        "fwd": "M22,8 l-8,-8 M22,8 l-8,8 M22,8 h-12 c-6,0 -10,4 -10,10",
        "del": "M2,4 h18 M5,4 l1,16 h10 l1,-16 M8,4 v-3 h6 v3 M9,8 v9 M13,8 v9",
    }
    out = f'<rect width="{w}" height="{h}" rx="22" fill="#f4f4f6" opacity=".96"/>'
    for i, (label, ic) in enumerate(rows):
        y = i * 54
        col = "#e5352b" if ic == "del" else "#111"
        out += (f'<text x="22" y="{y+35}" font-family="{FONT}" font-size="20" fill="{col}">{label}</text>'
                f'<path d="{icons[ic]}" transform="translate({w-48},{y+17})" fill="none" stroke="{col}" stroke-width="2" stroke-linejoin="round"/>')
        if i < 4:
            out += f'<rect x="0" y="{y+53}" width="{w}" height="1" fill="#cfcfd4"/>'
    out += (f'<rect x="0" y="270" width="{w}" height="10" fill="#dcdce1"/>'
            f'<text x="22" y="313" font-family="{FONT}" font-size="20" fill="#111">More...</text>'
            + "".join(f'<circle cx="{w-44+k*8}" cy="306" r="2.6" fill="#111"/>' for k in range(3)))
    return w, h, f'<g filter="url(#sh)">{out}</g>'


def el_tiles():
    w, h = 470, 234
    t = 39
    grid = "".join(f'<line x1="{x}" y1="0" x2="{x}" y2="{h}" stroke="#a9a59e" stroke-width="2.5"/>' for x in range(0, w, t))
    grid += "".join(f'<line x1="0" y1="{y}" x2="{w}" y2="{y}" stroke="#a9a59e" stroke-width="2.5"/>' for y in range(0, h, t))
    r = random.Random(3)
    scrib = ""
    for _ in range(46):
        x, y = r.uniform(0, w), r.uniform(0, h)
        pts = [(x, y)]
        for _ in range(r.randint(3, 8)):
            x += r.uniform(-26, 26); y += r.uniform(-18, 18); pts.append((x, y))
        col = r.choice(["#c8102e", "#c8102e", INK, CY2, "#c8102e"])
        scrib += f'<polyline points="{" ".join(f"{a:.0f},{b:.0f}" for a,b in pts)}" fill="none" stroke="{col}" stroke-width="{r.uniform(1.5,3.5):.1f}" stroke-linecap="round"/>'
    tags = [("9ON9ONE", 40, 70, -8, 40, "#c8102e"), ("XX", 330, 60, 6, 46, INK), ("NO FUTURE", 170, 170, -4, 30, CY2),
            ("ROT", 360, 200, -12, 36, "#c8102e"), ("666hz", 30, 210, 3, 26, INK), ("SYS_ERR", 230, 110, 10, 22, "#c8102e")]
    tg = "".join(f'<text x="{x}" y="{y}" transform="rotate({rot} {x} {y})" font-family="{FONT}" font-weight="900" font-style="italic" '
                 f'font-size="{fs}" fill="none" stroke="{c}" stroke-width="2.6" letter-spacing="-1">{s}</text>' for s, x, y, rot, fs, c in tags)
    return w, h, (f'<defs><linearGradient id="tl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1efea"/>'
                  f'<stop offset="1" stop-color="#cfccc5"/></linearGradient></defs>'
                  f'<rect width="{w}" height="{h}" fill="url(#tl)"/>{grid}{scrib}{tg}')


def el_player():
    w, h = 340, 156
    bars = "".join(f'<rect x="{20+i*9}" y="{98-v}" width="6" height="{v}" fill="{LIME}"/>'
                   for i, v in enumerate([12, 24, 30, 18, 34, 26, 14, 30, 22, 10, 28, 16]))
    btns = "".join(f'<rect x="{140+i*36}" y="112" width="30" height="24" fill="#3a3d45" stroke="#8a8f9a"/>' for i in range(5))
    glyphs = ('<path d="M150,118 v12 M162,118 l-9,6 l9,6Z M180,118 l10,6 l-10,6Z M218,118 h4 v12 h-4Z M226,118 h4 v12 h-4Z '
              'M255,118 h12 v12 h-12Z M290,118 l10,6 l-10,6Z M302,118 v12" fill="#ddd" stroke="#ddd" stroke-width="1.5"/>')
    return w, h, (
        f'<g filter="url(#sh)"><rect width="{w}" height="{h}" fill="#23252b" stroke="#6b7180" stroke-width="2"/>'
        f'<rect x="0" y="0" width="{w}" height="22" fill="{CY2}"/>'
        f'<text x="10" y="16" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700" fill="#fff">WINAMP  ::  CYBER.EXE</text>'
        f'<rect x="12" y="32" width="{w-24}" height="72" fill="#000" stroke="#555"/>'
        f'<text x="128" y="56" font-family="JetBrains Mono, monospace" font-size="15" fill="{LIME}">01:09</text>'
        f'<text x="128" y="80" font-family="JetBrains Mono, monospace" font-size="12" fill="{LIME}">9ON9ONE - FEEDBACK.WAV</text>'
        f'<text x="128" y="96" font-family="JetBrains Mono, monospace" font-size="10" fill="{CY}">320kbps  44kHz  stereo</text>'
        f'{bars}<rect x="12" y="140" width="{w-24}" height="6" fill="#444"/><rect x="12" y="140" width="120" height="6" fill="{CY}"/>'
        f'{btns}{glyphs}</g>')


def el_boot():
    w, h = 300, 110
    return w, h, (
        f'<g filter="url(#sh)"><rect width="{w}" height="{h}" fill="#c0c0c0" stroke="#fff" stroke-width="2"/>'
        f'<rect x="3" y="3" width="{w-6}" height="22" fill="#000080"/>'
        f'<text x="10" y="19" font-family="{FONT}" font-weight="700" font-size="13" fill="#fff">system_override.exe</text>'
        f'<text x="14" y="50" font-family="JetBrains Mono, monospace" font-size="13" fill="#000">uploading_soul... 67%</text>'
        f'<rect x="14" y="62" width="{w-28}" height="22" fill="#fff" stroke="#808080" stroke-width="2"/>'
        + "".join(f'<rect x="{18+i*14}" y="66" width="11" height="14" fill="#000080"/>' for i in range(12))
        + f'<text x="14" y="102" font-family="JetBrains Mono, monospace" font-size="10" fill="#333">01101110 01101111 00100001</text></g>')


def thorns_guitar():
    pass


def el_guitar():
    w, h = 560, 230
    body = ("M60,40 C100,18 140,44 182,54 C216,62 236,44 248,70 C255,90 240,100 240,112 C240,126 257,142 247,160 "
            "C234,184 202,167 172,172 C132,180 100,207 55,192 C15,177 8,142 24,112 C12,80 24,50 60,40Z")
    head = "M462,101 L484,98 C504,82 532,78 538,90 C542,99 522,106 512,114 L490,124 L462,123Z"
    neck = '<rect x="240" y="102" width="226" height="20" fill="#2a1a0e"/>'
    frets = "".join(f'<line x1="{x}" y1="102" x2="{x}" y2="122" stroke="#c9c9c9" stroke-width="2"/>' for x in range(256, 462, 17))
    dots = "".join(f'<circle cx="{x}" cy="112" r="2.5" fill="#eee"/>' for x in (290, 324, 358, 392, 444))
    strings = "".join(f'<line x1="70" y1="{104+i*3.2:.1f}" x2="{470+i*7}" y2="{104+i*3.2:.1f}" stroke="#e8e8e8" stroke-width="1"/>' for i in range(6))
    tuners = "".join(f'<circle cx="{482+i*9}" cy="{95-i*1.5:.0f}" r="3.5" fill="#d8d8d8" stroke="#555"/>' for i in range(6))
    guard = ("M70,58 C110,46 150,64 190,70 C220,74 236,92 240,102 L240,124 C232,140 210,150 175,156 "
             "C130,164 100,186 70,176 C40,166 36,140 46,112 C38,88 46,66 70,58Z")
    sticker = f'<g fill="#fff" stroke="#fff" stroke-width="22" stroke-linejoin="round"><path d="{body}"/><path d="{head}"/><rect x="240" y="102" width="226" height="20"/></g>'
    return w, h, (
        f'<defs><linearGradient id="gb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2d33"/><stop offset=".5" stop-color="{INK}"/>'
        f'<stop offset="1" stop-color="#1b1d22"/></linearGradient></defs>'
        f'<g filter="url(#sh)">{sticker}</g>'
        f'<path d="{body}" fill="url(#gb)" stroke="{INK}" stroke-width="2"/>'
        f'<path d="{guard}" fill="{CY}" stroke="#0d8fbd" stroke-width="2"/>'
        f'<path d="M80,64 C120,54 160,70 196,76" fill="none" stroke="#fff" stroke-width="3" opacity=".55"/>'
        f'{neck}{frets}{dots}<path d="{head}" fill="{INK}" stroke="#333"/>{tuners}'
        f'<rect x="196" y="98" width="20" height="28" rx="3" fill="#f2f2f2" stroke="#999"/>'
        f'<rect x="140" y="98" width="20" height="28" rx="3" fill="#f2f2f2" stroke="#999"/>'
        f'<rect x="98" y="99" width="12" height="26" fill="#bbb" stroke="#666"/>'
        f'<rect x="62" y="100" width="10" height="24" fill="#999" stroke="#555"/>'
        f'<circle cx="92" cy="150" r="7" fill="#ddd" stroke="#555"/><circle cx="114" cy="160" r="7" fill="#ddd" stroke="#555"/>'
        f'<rect x="150" y="60" width="26" height="8" rx="2" fill="#ddd"/>'
        f'{strings}<line x1="466" y1="101" x2="466" y2="123" stroke="#f5f0dc" stroke-width="3"/>')


GLYPHS = {
    "O": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    "n": [".....", ".....", "#.##.", "##..#", "#...#", "#...#", "#...#"],
    "l": [".##..", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
    "i": ["..#..", ".....", ".##..", "..#..", "..#..", "..#..", ".###."],
    "e": [".....", ".....", ".###.", "#...#", "#####", "#....", ".###."],
    "N": ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
    "o": [".....", ".....", ".###.", "#...#", "#...#", "#...#", ".###."],
    "w": [".....", ".....", "#...#", "#...#", "#.#.#", "#.#.#", ".#.#."],
    "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
    " ": ["....."] * 7,
}


def el_online():
    px = 9
    text = "Online Now!"
    w, h = 110 + len(text) * 6 * px, 100
    rects = ""
    for ci, ch in enumerate(text):
        for ry, row in enumerate(GLYPHS[ch]):
            for rx, c in enumerate(row):
                if c == "#":
                    rects += f'<rect x="{110+(ci*6+rx)*px}" y="{18+ry*px}" width="{px}" height="{px}"/>'
    icon = (f'<g fill="{CY2}"><rect x="22" y="6" width="36" height="36"/><rect x="16" y="12" width="48" height="24"/>'
            f'<rect x="8" y="50" width="64" height="44"/><rect x="2" y="58" width="76" height="36"/></g>')
    return w, h, (icon + f'<g fill="{CY2}" stroke="{CY2}" stroke-width="5" stroke-linejoin="round">{rects}</g>'
                  f'<g fill="#c9f3ff">{rects}</g>')


def sticker_filter(id_, color, radius):
    return (f'<filter id="{id_}" x="-15%" y="-15%" width="130%" height="130%">'
            f'<feMorphology in="SourceAlpha" operator="dilate" radius="{radius}" result="d"/>'
            f'<feFlood flood-color="{color}"/><feComposite in2="d" operator="in" result="o"/>'
            f'<feDropShadow in="o" dx="0" dy="8" stdDeviation="9" flood-opacity=".35" result="os"/>'
            f'<feMerge><feMergeNode in="os"/><feMergeNode in="SourceGraphic"/></feMerge></filter>')


DEFS = ('<defs><filter id="sh" x="-20%" y="-20%" width="140%" height="140%">'
        '<feDropShadow dx="0" dy="6" stdDeviation="8" flood-opacity=".28"/></filter>'
        + sticker_filter("stkW", "#fff", 8) + sticker_filter("stkK", INK, 3) + '</defs>')


def png_sticker(name, height, filt):
    from PIL import Image
    p = os.path.join(ROOT, "assets", f"{name}.png")
    iw, ih = Image.open(p).size
    w, h = round(height * iw / ih), height
    data = base64.b64encode(open(p, "rb").read()).decode()
    return w, h, f'<image href="data:image/png;base64,{data}" width="{w}" height="{h}" filter="url(#{filt})"/>'

# nome, função, x, y, rotação — ordem = camadas (de trás pra frente)
LAYOUT = [
    ("bg_checker", el_checker, 0, 0, 0),
    ("lime", lambda: (210, 290, f'<rect width="210" height="290" fill="{LIME}"/>'), 0, 100, 0),
    ("photo_detail", el_photo_detail, 216, 40, 0),
    ("stripes", el_stripes, 800, 0, 0),
    ("eye", el_eye, 870, 0, 0),
    ("starburst", el_burst, 420, 30, 8),
    ("skull_headphones", el_skull, 664, 30, -8),
    ("cybersigil", el_sigil, 1250, 330, 10),
    ("notepad_window", el_notepad, 670, 220, 0),
    ("photo_setup", el_photo_setup, 70, 390, 0),
    ("scribble", el_scribble, 420, 230, -10),
    ("context_menu", el_menu, 430, 488, 0),
    ("graffiti_tiles", el_tiles, 1000, 690, 0),
    ("guitar_angel", lambda: png_sticker("guitar_angel", 600, "stkK"), 1215, 120, 6),
    ("winamp", el_player, 6, 770, -3),
    ("boot_window", el_boot, 10, 36, -4),
    ("guitar_scythe", lambda: png_sticker("guitar_scythe", 360, "stkW"), 800, 590, 30),
    ("online_now", el_online, 372, 826, 0),
]


def svg(w, h, inner):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{DEFS}{inner}</svg>'


def main():
    comp = ""
    pad = 30
    for name, fn, x, y, rot in LAYOUT:
        w, h, inner = fn()
        if name != "bg_checker" and not name.startswith("guitar_"):
            open(os.path.join(ROOT, "assets", f"{name}.svg"), "w").write(
                svg(w + 2 * pad, h + 2 * pad, f'<g transform="translate({pad},{pad})">{inner}</g>'))
        comp += f'<g transform="translate({x},{y}) rotate({rot} {w/2} {h/2})">{inner}</g>'
    open(os.path.join(ROOT, "moodboard.svg"), "w").write(svg(W, H, comp))


if __name__ == "__main__":
    main()
