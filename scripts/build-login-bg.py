"""Bangun src/assets/login-bg.svg dari data frame Figma "Login" (node 415:2).

Tile di Figma = kotak transparan 10% + lapisan warna (navy/kuning) yang dipotong
oleh bentuk "blob" yang di-blur 200px. Di sini dibuat ulang sebagai SVG murni,
jadi tetap tajam di layar apa pun. Ikon "<o>", "-" dan teks tile dirender oleh
LoginPage (bukan bagian dari SVG ini).

Jalankan: python3 scripts/build-login-bg.py [sigma]  (default 88 = paling mirip render Figma)
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SIGMA = float(sys.argv[1]) if len(sys.argv) > 1 else 88.0

NAVY = '#233F7C'
AMBER = '#FDBB16'

# Bentuk blob (vektor "Mask" di Figma, sebelum di-blur).
BLOBS = {
    'A': (NAVY, 'M296.7 754.0C377.7 743.2 430.9 725.9 457.5 713.3C461.3 713.9 464.3 714.5 467.3 715.1C471.3 715.9 475.2 716.6 478.8 717.8C493.0 723.2 506.2 730.7 528.4 733.8C548.8 736.7 572.3 741.2 594.5 736.7C611.2 733.2 639.4 729.3 659.9 719.3C686.9 706.1 706.8 690.1 730.2 665.5C747.3 647.5 766.8 631.8 755.7 614.6C747.2 601.3 716.4 561.9 626.9 537.6C568.8 521.9 538.0 511.4 542.5 506.7C547.4 501.5 566.9 491.6 575.4 455.1C581.6 428.5 588.2 407.6 546.2 367.1C511.1 333.2 487.1 313.7 478.7 312.8C469.8 311.8 419.6 333.1 379.8 309.5C373.3 305.6 380.4 297.9 378.2 267.0C376.5 243.5 372.6 200.0 368.6 173.3C364.6 146.6 360.7 137.1 356.8 131.1C352.8 125.2 349.1 122.3 341.9 121.8C325.2 120.6 287.9 119.5 246.9 127.2C190.8 137.7 136.3 151.3 126.8 160.4C116.2 170.4 89.4 188.9 96.0 245.0C100.6 284.7 104.4 313.4 119.7 325.4C162.6 359.1 224.6 372.2 231.7 384.0C233.3 386.7 234.1 390.1 234.3 393.4C234.6 399.8 229.8 437.8 207.8 503.9C196.9 536.8 182.4 568.0 176.0 585.9C168.2 608.0 155.9 640.2 175.2 683.7C188.7 714.0 198.7 729.4 209.4 734.2C239.4 747.9 265.0 758.2 296.7 754.0Z'),
    'B': (NAVY, 'M923.6 437.2C989.8 429.1 1033.1 416.1 1054.9 406.6C1058.0 407.0 1060.4 407.5 1062.9 407.9C1066.1 408.5 1069.3 409.1 1072.3 409.9C1083.8 414.0 1094.7 419.6 1112.8 422.0C1129.4 424.2 1148.6 427.6 1166.7 424.2C1180.4 421.6 1203.4 418.6 1220.1 411.1C1242.2 401.1 1258.4 389.0 1277.5 370.5C1291.4 357.0 1307.3 345.1 1298.3 332.1C1291.3 322.1 1266.2 292.4 1193.1 274.1C1145.7 262.2 1120.6 254.3 1124.3 250.8C1128.3 246.9 1144.2 239.4 1151.1 211.9C1156.2 191.8 1161.6 176.1 1127.3 145.5C1098.6 120.0 1079.0 105.3 1072.2 104.6C1065 103.9 1023.9 119.9 991.4 102.1C986.1 99.2 991.9 93.4 990.1 70.1C988.7 52.3 985.6 19.5 982.3 -0.5C979.1 -20.6 975.9 -27.8 972.7 -32.3C969.4 -36.8 966.4 -39.0 960.6 -39.3C946.9 -40.2 916.4 -41.0 883.0 -35.2C837.2 -27.3 792.7 -17.1 784.9 -10.2C776.3 -2.7 754.4 11.2 759.8 53.5C763.5 83.4 766.7 105.1 779.2 114.1C814.2 139.5 864.8 149.4 870.5 158.3C871.9 160.3 872.5 162.9 872.7 165.4C872.9 170.2 869.0 198.8 851.1 248.7C842.1 273.5 830.3 297.0 825.1 310.5C818.8 327.1 808.7 351.4 824.5 384.3C835.5 407.1 843.7 418.7 852.4 422.3C876.8 432.6 897.7 440.4 923.6 437.2Z'),
    'C': (AMBER, 'M423.3 215.6C439.1 291.4 464.5 341.1 482.8 366.0C482.0 369.6 481.1 372.4 480.3 375.2C479.1 378.9 478.0 382.5 476.3 385.9C468.4 399.2 457.5 411.6 452.9 432.4C448.7 451.4 442.0 473.4 448.7 494.1C453.8 509.8 459.5 536.2 474.1 555.3C493.4 580.6 516.9 599.2 552.9 621.1C579.2 637.0 602.2 655.3 627.4 644.9C646.8 636.9 704.5 608.1 740.0 524.4C763.1 470.1 778.4 441.3 785.4 445.5C793.0 450.1 807.4 468.3 860.8 476.3C899.8 482.1 930.3 488.3 989.7 449.0C1039.2 416.1 1067.8 393.7 1069.2 385.8C1070.6 377.6 1039.4 330.6 1074.0 293.3C1079.6 287.3 1090.9 293.9 1136.1 291.8C1170.6 290.2 1234.3 286.6 1273.3 282.9C1312.4 279.2 1326.3 275.5 1335.0 271.8C1343.7 268.1 1348.1 264.7 1348.8 257.9C1350.4 242.3 1352.0 207.4 1340.8 169.0C1325.5 116.6 1305.5 65.6 1292.3 56.7C1277.6 46.9 1250.5 21.8 1168.3 27.9C1110.3 32.2 1068.2 35.8 1050.6 50.1C1001.4 90.2 982.1 148.2 965.0 154.8C961.0 156.3 956.0 157.1 951.1 157.3C941.8 157.6 886.2 153.1 789.4 132.5C741.2 122.3 695.5 108.7 669.3 102.8C637.1 95.5 589.9 83.9 526.2 102.0C481.8 114.6 459.4 124.0 452.3 134.0C432.3 162.0 417.2 186.0 423.3 215.6Z'),
    'D': (AMBER, 'M195.7 549.6C203.8 585.6 216.8 609.2 226.3 621.0C225.9 622.7 225.4 624.0 225.0 625.4C224.4 627.1 223.8 628.9 223.0 630.5C218.9 636.8 213.3 642.7 210.9 652.5C208.7 661.6 205.3 672.0 208.7 681.9C211.3 689.3 214.3 701.8 221.8 710.9C231.8 722.9 243.9 731.8 262.4 742.2C275.9 749.8 287.8 758.4 300.8 753.5C310.8 749.7 340.5 736.0 358.8 696.3C370.7 670.5 378.6 656.8 382.1 658.8C386.1 661.0 393.5 669.6 421.0 673.4C441.1 676.2 456.8 679.1 487.4 660.4C512.9 644.8 527.6 634.2 528.3 630.4C529.0 626.5 513.0 604.2 530.8 586.5C533.7 583.6 539.5 586.8 562.8 585.8C580.6 585.0 613.4 583.3 633.5 581.5C653.6 579.8 660.8 578.0 665.3 576.3C669.8 574.5 672.0 572.9 672.3 569.7C673.2 562.2 674.0 545.7 668.2 527.4C660.3 502.5 650.1 478.3 643.2 474.1C635.7 469.4 621.7 457.5 579.4 460.4C549.5 462.5 527.8 464.1 518.8 471.0C493.4 490.0 483.5 517.6 474.6 520.7C472.6 521.4 470.0 521.8 467.5 521.9C462.7 522.0 434.1 519.9 384.2 510.1C359.4 505.2 335.9 498.8 322.4 496.0C305.8 492.5 281.5 487.0 248.7 495.6C225.8 501.6 214.2 506.1 210.6 510.8C200.3 524.1 192.5 535.5 195.7 549.6Z'),
}

# (x, y, lebar, blob yang mewarnai tile, jenis dasar) -- tinggi semua tile 100.
# Dasar 'n' = navy 10%, 'w' = gradasi putih tipis. Urutan sama dengan layer Figma.
TILES = [
    (517, 695, 100, 'A', 'n'), (621, 275, 100, 'BA', 'n'), (516, 380, 100, 'BA', 'n'),
    (95, 275, 415, 'A', 'n'), (725, 380, 207, 'BA', 'n'), (-10, 590, 100, 'A', 'n'),
    (624, 595, 100, 'BA', 'n'), (200, 170, 100, 'A', 'n'), (306, 65, 100, 'A', 'n'),
    (305, 590, 100, 'A', 'n'),
    (930, -32, 100, 'C', 'w'), (516, 275, 100, 'DC', 'w'), (95, 380, 415, 'DC', 'w'),
    (306, 170, 415, 'DC', 'w'), (1140, -32, 415, 'C', 'w'), (517, 485, 513, 'DC', 'w'),
    (1140, 178, 100, 'C', 'w'), (305, 485, 100, 'DC', 'w'), (410, 485, 100, 'DC', 'w'),
    (410, 590, 100, 'DC', 'w'), (200, 800, 100, 'DC', 'w'), (305, 695, 100, 'DC', 'w'),
    (95, 485, 100, 'D', 'w'), (200, 590, 100, 'DC', 'w'), (1035, 178, 100, 'B', 'w'),
    (1035, 73, 100, 'B', 'w'), (1140, 73, 100, 'B', 'w'), (1350, 283, 100, 'B', 'w'),
    (1245, 178, 100, 'B', 'w'), (1035, 388, 100, 'B', 'w'), (1245, 388, 100, 'B', 'w'),
    (1140, 283, 100, 'B', 'w'), (95, 695, 100, 'D', 'w'),
]
H = 100


def f(v: float) -> str:
    return f'{v:.1f}'.rstrip('0').rstrip('.')


def glow_id(i: int) -> str:
    return f'g{i}'


def glow_grad(i: int, x: int, y: int, w: int) -> str:
    # Garis tepi putih yang memudar, sama dengan gradient radial di Figma.
    k = w / 100
    cx, cy = x + w / 2, y + H / 2
    m = f'{f(-69.4 * k)} 63.8 {f(-32.5 * k)} -69.4 {f(cx)} {f(cy)}'
    return (f'<radialGradient id="{glow_id(i)}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" '
            f'gradientTransform="matrix({m})"><stop stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>')


def tile_rect(x: int, y: int, w: int, fill: str, extra: str = '') -> str:
    return f'<rect x="{x}" y="{y}" width="{w}" height="{H}" rx="10" fill="{fill}"{extra}/>'


def glow_rect(i: int, x: int, y: int, w: int) -> str:
    return (f'<rect x="{f(x - 1.5)}" y="{f(y - 1.5)}" width="{w + 3}" height="{H + 3}" rx="11.5" '
            f'stroke="url(#{glow_id(i)})" stroke-width="3"/>')


def build() -> str:
    defs: list[str] = [
        '<radialGradient id="bg" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" '
        'gradientTransform="translate(794.5 393.5) rotate(99.3) scale(460.5 782)">'
        '<stop stop-color="#fff"/><stop offset="1" stop-color="#F1F8FC"/></radialGradient>',
        '<linearGradient id="wb" x1="0" y1="1" x2="1" y2="0">'
        '<stop stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0.3"/></linearGradient>',
        '<linearGradient id="fade" x1="0" y1="1" x2="0" y2="0">'
        '<stop stop-color="#F1F8FC"/><stop offset="1" stop-color="#F1F8FC" stop-opacity="0"/></linearGradient>',
        f'<filter id="blur" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="{f(SIGMA)}"/></filter>',
    ]
    body: list[str] = ['<rect width="1440" height="848" fill="url(#bg)"/>']

    # Dasar tiap tile: transparan 10% + garis tepi.
    for i, (x, y, w, _, base) in enumerate(TILES):
        defs.append(glow_grad(i, x, y, w))
        fill = NAVY if base == 'n' else 'url(#wb)'
        body.append(tile_rect(x, y, w, fill, ' fill-opacity="0.1"'))
        body.append(glow_rect(i, x, y, w))

    # Warna navy/kuning: semua tile yang memakai blob yang sama dikumpulkan dalam satu grup ber-mask.
    pad = 3 * SIGMA
    for key, (color, d) in BLOBS.items():
        defs.append(
            f'<mask id="m{key}" maskUnits="userSpaceOnUse" x="{f(-pad)}" y="{f(-pad)}" '
            f'width="{f(1440 + 2 * pad)}" height="{f(848 + 2 * pad)}" style="mask-type:alpha">'
            f'<path d="{d}" fill="#000" filter="url(#blur)"/></mask>')
        group = []
        for i, (x, y, w, blobs, _) in enumerate(TILES):
            if key in blobs:
                group.append(tile_rect(x, y, w, color))
                group.append(glow_rect(i, x, y, w))
        body.append(f'<g mask="url(#m{key})">{"".join(group)}</g>')

    # Logo SENO (sama dengan src/assets/logo.svg, diperbesar ke ukuran frame login).
    logo = (ROOT / 'src/assets/logo.svg').read_text()
    inner = re.search(r'<svg[^>]*>(.*)</svg>', logo, re.S).group(1)
    inner = re.sub(r'id="([^"]+)"', r'id="logo-\1"', inner)
    inner = re.sub(r'url\(#([^)]+)\)', r'url(#logo-\1)', inner)
    inner = re.sub(r'href="#([^"]+)"', r'href="#logo-\1"', inner)
    body.append(f'<g transform="translate(945 677) scale({405 / 155:.4f})">{inner.strip()}</g>')

    # Fade bawah (Rectangle 34 di Figma).
    body.append('<rect y="708" width="1440" height="140" fill="url(#fade)"/>')

    return ('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
            'width="1440" height="848" viewBox="0 0 1440 848" fill="none">'
            f'<defs>{"".join(defs)}</defs>{"".join(body)}</svg>\n')


if __name__ == '__main__':
    out = ROOT / 'src/assets/login-bg.svg'
    out.write_text(build())
    print(out, out.stat().st_size, 'bytes, sigma', SIGMA)
