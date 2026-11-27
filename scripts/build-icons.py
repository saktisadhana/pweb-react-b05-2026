"""Bangun ikon titik-titik (profil, Ox, T) sebagai SVG dari data vektor Figma.

Tiap ikon di Figma adalah kumpulan lingkaran putih dengan garis luar 1px bergradasi.
Di path Figma tiap lingkaran ditulis sebagai 4 busur seperempat; data di bawah adalah
titik tengah tiap busur (4 titik = 1 lingkaran), diambil dari node Figma:
profile 456:4783, ox 456:4792, text 456:4809.

Jalankan: python3 scripts/build-icons.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NAVY = '#233F7C'
AMBER = '#FDBB16'

# Gradient garis luar di Figma (sama untuk ketiga ikon).
GRAD_T = ((1.3217157, 0.0574932, -0.3717905), (-2.8171680, 1.3217157, 2.1659961))


def pairs(points, r):
    """Tiap 4 titik berurutan = satu lingkaran. r = jarak antar titik = jari-jari lingkaran."""
    out = []
    for i in range(0, len(points), 4):
        quad = points[i:i + 4]
        cx = sum(x for x, _ in quad) / 4
        cy = sum(y for _, y in quad) / 4
        out.append((round(cx, 2), round(cy, 2), r))
    return out


def blocks(xs, ys, r):
    """Lingkaran di grid: xs/ys berisi pasangan busur (2 nilai per lingkaran)."""
    cxs = [(xs[i] + xs[i + 1]) / 2 for i in range(0, len(xs), 2)]
    cys = [(ys[i] + ys[i + 1]) / 2 for i in range(0, len(ys), 2)]
    return [(round(x, 2), round(y, 2), r) for x in cxs for y in cys]


# Titik ditulis dalam urutan yang sama dengan path Figma.
PROFILE = pairs([
    (6.5, 19.3), (9, 19.3), (9, 16.8), (6.5, 16.8), (6.5, 14.2), (9, 14.2), (9, 11.7), (6.5, 11.7),
    (6.5, 9), (9, 9), (9, 6.5), (6.5, 6.5), (11.7, 24.5), (14.2, 24.5), (14.2, 22), (11.7, 22),
    (11.7, 3.8), (14.2, 3.8), (14.2, 1.3), (11.7, 1.3), (16.8, 24.5), (19.3, 24.5), (19.3, 22), (16.8, 22),
    (16.8, 3.8), (19.3, 3.8), (19.3, 1.3), (16.8, 1.3), (22, 24.5), (24.5, 24.5), (24.5, 22), (22, 22),
    (22, 3.8), (24.5, 3.8), (24.5, 1.3), (22, 1.3), (27.2, 19.3), (29.7, 19.3), (29.7, 16.8), (27.2, 16.8),
    (27.2, 14.2), (29.7, 14.2), (29.7, 11.7), (27.2, 11.7), (27.2, 9), (29.7, 9), (29.7, 6.5), (27.2, 6.5),
    (6.5, 33.5), (6.5, 36), (9, 36), (9, 33.5), (11.7, 33.5), (11.7, 36), (14.2, 36), (14.2, 33.5),
    (16.8, 33.5), (16.8, 36), (19.3, 36), (19.3, 33.5), (22, 33.5), (22, 36), (24.5, 36), (24.5, 33.5),
    (27.2, 33.5), (27.2, 36), (29.7, 36), (29.7, 33.5), (1.3, 38.7), (1.3, 41.2), (3.8, 41.2), (3.8, 38.7),
    (32.4, 38.7), (32.4, 41.2), (34.8, 41.2), (34.8, 38.7), (1.3, 43.9), (1.3, 46.3), (3.8, 46.3), (3.8, 43.9),
    (32.4, 43.9), (32.4, 46.3), (34.8, 46.3), (34.8, 43.9),
], 2.6)

OX = pairs([
    (1.3, 19.3), (3.8, 19.3), (3.8, 16.8), (1.3, 16.8), (1.3, 14.2), (3.8, 14.2), (3.8, 11.7), (1.3, 11.7),
    (1.3, 9), (3.8, 9), (3.8, 6.5), (1.3, 6.5), (6.5, 24.5), (9, 24.5), (9, 22), (6.5, 22),
    (6.5, 3.8), (9, 3.8), (9, 1.3), (6.5, 1.3), (11.7, 24.5), (14.2, 24.5), (14.2, 22), (11.7, 22),
    (11.7, 3.8), (14.2, 3.8), (14.2, 1.3), (11.7, 1.3), (16.8, 24.5), (19.3, 24.5), (19.3, 22), (16.8, 22),
    (16.8, 3.8), (19.3, 3.8), (19.3, 1.3), (16.8, 1.3), (22, 19.3), (24.5, 19.3), (24.5, 16.8), (22, 16.8),
    (22, 14.2), (24.5, 14.2), (24.5, 11.7), (22, 11.7), (22, 9), (24.5, 9), (24.5, 6.5), (22, 6.5),
], 2.6) + pairs([
    (28.2, 48.8), (30.6, 48.8), (30.6, 46.4), (28.2, 46.4), (28.2, 29.6), (30.6, 29.6), (30.6, 27.2), (28.2, 27.2),
    (33, 44), (35.4, 44), (35.4, 41.6), (33, 41.6), (33, 34.4), (35.4, 34.4), (35.4, 32), (33, 32),
    (37.8, 39.2), (40.2, 39.2), (40.2, 36.8), (37.8, 36.8), (42.6, 44), (45, 44), (45, 41.6), (42.6, 41.6),
    (42.6, 34.4), (45, 34.4), (45, 32), (42.6, 32), (47.4, 48.8), (49.8, 48.8), (49.8, 46.4), (47.4, 46.4),
    (47.4, 29.6), (49.8, 29.6), (49.8, 27.2), (47.4, 27.2),
], 2.4)

# Ikon "T": dua kotak kiri-kanan, batang atas, batang tengah, garis bawah.
TEXT = (
    blocks([1.2, 3.6, 6, 8.4], [6.2, 8.6, 11, 13.4], 2.4)        # kotak kiri
    + blocks([54.2, 56.6, 59, 61.4], [6.2, 8.6, 11, 13.4], 2.4)  # kotak kanan
    # batang atas (di Figma tersusun dari tiga potongan yang saling tumpang)
    + blocks([10.2 + 2.4 * i for i in range(10)], [1.2, 3.6], 2.4)
    + blocks([20.2, 22.6, 25, 27.4, 34.6, 37, 39.4, 41.8], [1.2, 3.6], 2.4)
    + blocks([30.2 + 2.4 * i for i in range(10)], [1.2, 3.6], 2.4)
    + blocks([29.8, 32.2], [1.2, 3.6, 6, 8.4, 10.8, 13.2, 15.6, 18, 20.4, 22.8], 2.4)  # batang tengah
    + blocks([20.2 + 2.4 * i for i in range(10)], [25.2, 27.6], 2.4)  # garis bawah
)

# Ikon kaca pembesar untuk menu "> Cari" (dibuat sendiri, gaya titik sama dengan ikon lain).
SEARCH_ART = [
    '..XXX....',
    '.X...X...',
    'X.....X..',
    'X.....X..',
    'X.....X..',
    '.X...X...',
    '..XXX.X..',
    '.......X.',
    '........X',
]
SEARCH = [(2.6 + 5.1 * c, 2.6 + 5.1 * r, 2.6) for r, row in enumerate(SEARCH_ART) for c, ch in enumerate(row) if ch == 'X']

# Ukuran node di Figma dan kotak tampilnya (node + ruang untuk garis luar).
ICONS = {
    'profile': (PROFILE, NAVY, (36.175, 47.679), (-1.25, -1.15, 38.7, 50)),
    'ox': (OX, AMBER, (51, 50), (-1.15, -1, 53.3, 52)),
    'text': (TEXT, AMBER, (62.6, 28.8), (-1.05, -1.25, 64.7, 31.3)),
    'search': (SEARCH, AMBER, (45.1, 45.1), (-1.2, -1.2, 47.5, 47.5)),
}


def gradient_line(w: float, h: float) -> tuple[float, float, float, float]:
    """Titik awal/akhir gradient: kebalikan dari gradientTransform Figma (ruang 0..1 node)."""
    (a, b, c), (d, e, f) = GRAD_T
    det = a * e - b * d

    def inv(u: float, v: float) -> tuple[float, float]:
        x = (e * (u - c) - b * (v - f)) / det
        y = (-d * (u - c) + a * (v - f)) / det
        return x * w, y * h

    x1, y1 = inv(0, 0.5)
    x2, y2 = inv(1, 0.5)
    return x1, y1, x2, y2


def n(v: float) -> str:
    return f'{v:.2f}'.rstrip('0').rstrip('.')


def build(dots, color, size, box) -> str:
    w, h = size
    x1, y1, x2, y2 = gradient_line(w, h)
    unique = sorted(set(dots))
    circles = ''.join(f'<circle cx="{n(x)}" cy="{n(y)}" r="{n(r)}"/>' for x, y, r in unique)
    # Garis luar: gambar semua titik dengan stroke 2px, lalu tutup bagian dalamnya dengan isi putih.
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{" ".join(n(v) for v in box)}" '
        f'width="{n(box[2])}" height="{n(box[3])}">'
        f'<defs><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="{n(x1)}" y1="{n(y1)}" x2="{n(x2)}" y2="{n(y2)}">'
        f'<stop stop-color="{color}"/><stop offset="1" stop-color="{color}" stop-opacity="0"/></linearGradient></defs>'
        f'<g fill="none" stroke="url(#s)" stroke-width="2">{circles}</g>'
        f'<g fill="#fff">{circles}</g></svg>\n'
    )


if __name__ == '__main__':
    for name, (dots, color, size, box) in ICONS.items():
        out = ROOT / 'src/assets' / f'{name}.svg'
        out.write_text(build(dots, color, size, box))
        print(out.name, len(set(dots)), 'titik', out.stat().st_size, 'bytes')
