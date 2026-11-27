import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { TileDef } from '../../data/figmaTiles';
import { enterDelay } from './grid';
import blueMaskSrc from '../../assets/masks/blue.png';
import yellowMaskSrc from '../../assets/masks/yellow.png';

export const STAGE_W = 1440;
export const STAGE_H = 1238;

export interface TileVisual {
  tile: TileDef;
  yellow: boolean; // warna yang sedang tampil (sudah termasuk efek tekan)
  current: boolean; // tile menu yang aktif (dapat garis biru)
  pressed: boolean;
}

interface TileCanvasProps {
  visuals: TileVisual[];
  resolution: number; // piksel canvas per px stage
}

const NAVY = '#233f7c';
const AMBER = '#fdbb16';

// Kotak mask dari Figma (koordinat frame 1440 x 1238).
const MASK_BLUE = { x: -366, y: -595, w: 2210, h: 2281 };
const MASK_BLUE_1 = { x: -464, y: -454, w: 2210, h: 2281 };
const MASK_YELLOW = { x: -200, y: -606, w: 2241, h: 2117 };
// Mask aslinya kecil (56 px). Saat load, mask dihaluskan sekali lalu
// tumpukan layer Figma digabung jadi satu mask per warna:
//   biru   = B1 + B2 + B3 + B4 (masing-masing opacity .5)
//   kuning = Y1 + Y2 (opacity .5) + Y3 (opacity .25)
// Hasilnya sama dengan menumpuk layer satu per satu, tapi per frame cukup
// menggambar 1 layer per warna (bukan 7).
const BAKE = 4; // mask disimpan 1/4 ukuran, diperbesar saat digambar

interface Box { x: number; y: number; w: number; h: number }
interface Baked { canvas: HTMLCanvasElement; box: Box }

function alphaOf(img: HTMLImageElement, box: Box, area: Box): Uint8ClampedArray {
  const c = document.createElement('canvas');
  c.width = Math.round(area.w / BAKE);
  c.height = Math.round(area.h / BAKE);
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.filter = 'blur(5px)';
  ctx.drawImage(img, (box.x - area.x) / BAKE, (box.y - area.y) / BAKE, box.w / BAKE, box.h / BAKE);
  return ctx.getImageData(0, 0, c.width, c.height).data;
}

function bake(area: Box, layers: { img: HTMLImageElement; box: Box; opacity: number }[]): Baked {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(area.w / BAKE);
  canvas.height = Math.round(area.h / BAKE);
  const ctx = canvas.getContext('2d')!;
  const out = ctx.createImageData(canvas.width, canvas.height);
  const alphas = layers.map((l) => alphaOf(l.img, l.box, area));
  for (let i = 3; i < out.data.length; i += 4) {
    let keep = 1; // bagian yang masih tembus pandang setelah semua layer ditumpuk
    layers.forEach((l, j) => {
      keep *= 1 - l.opacity * (alphas[j][i] / 255);
    });
    out.data[i] = Math.round((1 - keep) * 255);
  }
  ctx.putImageData(out, 0, 0);
  return { canvas, box: area };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const tilePath = (l: CanvasRenderingContext2D, t: TileDef, grow = 0) =>
  l.roundRect(t.x - grow, t.y - grow, t.w + grow * 2, t.h + grow * 2, 10 + grow);

let maskPromise: Promise<{ blue: Baked; yellow: Baked }> | null = null;

// Mask di-bake sekali untuk seluruh aplikasi (dipakai ulang di semua halaman).
function loadMasks() {
  maskPromise ??= Promise.all([loadImage(blueMaskSrc), loadImage(yellowMaskSrc)]).then(([blue, yellow]) => ({
    blue: bake(
      { x: MASK_BLUE_1.x, y: MASK_BLUE.y, w: MASK_BLUE.x + MASK_BLUE.w - MASK_BLUE_1.x, h: MASK_BLUE_1.y + MASK_BLUE_1.h - MASK_BLUE.y },
      [
        { img: blue, box: MASK_BLUE_1, opacity: 0.5 },
        { img: blue, box: MASK_BLUE, opacity: 0.5 },
        { img: blue, box: MASK_BLUE, opacity: 0.5 },
        { img: blue, box: MASK_BLUE, opacity: 0.5 },
      ],
    ),
    yellow: bake(MASK_YELLOW, [
      { img: yellow, box: MASK_YELLOW, opacity: 0.5 },
      { img: yellow, box: MASK_YELLOW, opacity: 0.5 },
      { img: yellow, box: MASK_YELLOW, opacity: 0.25 },
    ]),
  }));
  return maskPromise;
}

let layerCanvas: HTMLCanvasElement | null = null;

// Satu warna: isi kotak tile, lalu potong dengan mask (hanya di dalam tile).
function paintColor(ctx: CanvasRenderingContext2D, k: number, all: TileVisual[], color: string, mask: Baked) {
  const tiles = all.filter((v) => !v.tile.solid);
  if (tiles.length === 0) return;
  // Kanvas lapisan dipakai ulang (membuat kanvas 1440x1238 baru tiap gambar itu mahal).
  layerCanvas ??= document.createElement('canvas');
  const layer = layerCanvas;
  if (layer.width !== ctx.canvas.width || layer.height !== ctx.canvas.height) {
    layer.width = ctx.canvas.width;
    layer.height = ctx.canvas.height;
  }
  const l = layer.getContext('2d')!;
  l.save();
  l.setTransform(1, 0, 0, 1, 0, 0);
  l.globalCompositeOperation = 'source-over';
  l.clearRect(0, 0, layer.width, layer.height);
  l.setTransform(k, 0, 0, k, 0, 0);
  l.fillStyle = color;
  for (const v of tiles) {
    l.beginPath();
    tilePath(l, v.tile);
    l.fill();
  }
  l.beginPath();
  for (const v of tiles) tilePath(l, v.tile);
  l.clip();
  l.globalCompositeOperation = 'destination-in';
  l.drawImage(mask.canvas, mask.box.x, mask.box.y, mask.box.w, mask.box.h);
  l.restore(); // buang clip & mode komposit supaya pemakaian berikutnya bersih
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(layer, 0, 0);
  // Tile yang ditekan digambar dua kali supaya warnanya lebih kuat.
  for (const v of tiles.filter((t) => t.pressed)) {
    const x = Math.max(0, v.tile.x * k);
    const y = Math.max(0, v.tile.y * k);
    const w = Math.min(layer.width - x, v.tile.w * k);
    const h = Math.min(layer.height - y, v.tile.h * k);
    if (w > 0 && h > 0) ctx.drawImage(layer, x, y, w, h, x, y, w, h);
  }
}

// Gambar seluruh tile background sekali (tidak ada animasi per frame).
function paintAll(ctx: CanvasRenderingContext2D, k: number, visuals: TileVisual[], masks: { blue: Baked; yellow: Baked }) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Urutan Figma: kuning (Y1-Y3), garis tile aktif, kaca, biru (B1-B4).
  paintColor(ctx, k, visuals.filter((v) => v.yellow), AMBER, masks.yellow);

  ctx.setTransform(k, 0, 0, k, 0, 0);
  for (const v of visuals) {
    if (v.tile.solid) continue; // digambar oleh tombolnya sendiri (CSS), di atas overlay glare
    const { x, y, w, h } = v.tile;
    if (v.current && v.yellow) {
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = '#0050ff';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.roundRect(x + 4.5, y + 4.5, w - 9, h - 9, 5.5);
      ctx.stroke();
    }
    if (v.yellow) continue;
    const fill = ctx.createLinearGradient(x, y, x + w, y + h);
    fill.addColorStop(0, 'rgba(255,255,255,0)');
    fill.addColorStop(1, 'rgba(255,255,255,0.39)');
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = fill;
    ctx.beginPath();
    tilePath(ctx, v.tile);
    ctx.fill();
    const cx = x + w * 0.78;
    const cy = y + h * 0.22;
    const ring = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.86);
    ring.addColorStop(0, 'rgba(255,255,255,1)');
    ring.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = ring;
    ctx.lineWidth = 3;
    ctx.beginPath();
    tilePath(ctx, v.tile, 1.5);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  paintColor(ctx, k, visuals.filter((v) => !v.yellow), NAVY, masks.blue);
}

// Semua tile digambar sekali ke satu canvas besar (di luar layar), lalu tiap tile
// disalin ke canvas kecilnya sendiri ("sprite"). Dengan begitu tiap tile bisa
// muncul / hilang dengan animasi CSS (transform + opacity, diproses GPU) tanpa
// menggambar ulang apa pun per frame. Gerakan mouse juga tidak menggambar ulang.
const PAD = 3; // ruang untuk garis tepi tile yang keluar dari kotaknya (3px, tidak sampai ke tile tetangga)
const LEAVE_MS = 360; // lama animasi tile menghilang (samakan dengan .tile-sprite.is-leaving)

let masksReady: { blue: Baked; yellow: Baked } | null = null;
let offscreen: HTMLCanvasElement | null = null;

function copySprite(canvas: HTMLCanvasElement, src: HTMLCanvasElement, t: TileDef, k: number) {
  const w = Math.round((t.w + PAD * 2) * k);
  const h = Math.round((t.h + PAD * 2) * k);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);
  // Bagian tile di luar stage (misalnya x negatif) memang kosong: geser titik asal saja.
  const sx = (t.x - PAD) * k;
  const sy = (t.y - PAD) * k;
  ctx.drawImage(src, sx, sy, w, h, 0, 0, w, h);
}

// Tanda tampilan sprite: kalau tidak berubah, sprite tidak perlu disalin ulang.
const signature = (v: TileVisual, k: number) => `${v.tile.w}x${v.tile.h}|${v.yellow}|${v.pressed}|${v.current}|${k}`;

function paintSprites(visuals: TileVisual[], resolution: number, sprites: Map<string, HTMLCanvasElement>) {
  if (!masksReady) return false;
  // Hanya tile yang baru muncul atau berubah warna/status yang digambar ulang.
  const stale = visuals.filter((v) => {
    const sprite = sprites.get(v.tile.id);
    return sprite && sprite.dataset.sig !== signature(v, resolution);
  });
  if (stale.length === 0) return true;
  offscreen ??= document.createElement('canvas');
  const w = Math.round(STAGE_W * resolution);
  const h = Math.round(STAGE_H * resolution);
  if (offscreen.width !== w || offscreen.height !== h) {
    offscreen.width = w;
    offscreen.height = h;
  }
  paintAll(offscreen.getContext('2d')!, resolution, visuals, masksReady);
  for (const v of stale) {
    const sprite = sprites.get(v.tile.id)!;
    copySprite(sprite, offscreen, v.tile, resolution);
    sprite.dataset.sig = signature(v, resolution);
  }
  return true;
}

export function TileCanvas({ visuals, resolution }: TileCanvasProps) {
  const sprites = useRef(new Map<string, HTMLCanvasElement>());
  // Tile yang baru saja hilang tetap dipasang sebentar supaya animasi keluarnya terlihat.
  const [prev, setPrev] = useState(visuals);
  const [leaving, setLeaving] = useState<TileVisual[]>([]);
  if (prev !== visuals) {
    const ids = new Set(visuals.map((v) => v.tile.id));
    const gone = prev.filter((v) => !ids.has(v.tile.id) && !v.tile.solid);
    setPrev(visuals);
    setLeaving((old) => [...old.filter((v) => !ids.has(v.tile.id)), ...gone]);
  }

  useEffect(() => {
    if (leaving.length === 0) return;
    const timer = setTimeout(() => setLeaving([]), LEAVE_MS + 40);
    return () => clearTimeout(timer);
  }, [leaving]);

  useLayoutEffect(() => {
    if (paintSprites(visuals, resolution, sprites.current)) return;
    let cancelled = false;
    void loadMasks().then((masks) => {
      masksReady = masks;
      if (!cancelled) paintSprites(visuals, resolution, sprites.current);
    });
    return () => {
      cancelled = true;
    };
  }, [visuals, resolution]);

  const spriteEl = (v: TileVisual, isLeaving: boolean) => {
    const t = v.tile;
    return (
      <canvas
        key={t.id}
        ref={(el) => {
          if (el) sprites.current.set(t.id, el);
          else sprites.current.delete(t.id);
        }}
        className={`tile-sprite${isLeaving ? ' is-leaving' : ''}${v.pressed ? ' is-pressed' : ''}`}
        style={{
          left: t.x - PAD,
          top: t.y - PAD,
          width: t.w + PAD * 2,
          height: t.h + PAD * 2,
          '--d': `${enterDelay(t)}ms`,
        } as CSSProperties}
      />
    );
  };

  return (
    <div className="tiles-canvas" aria-hidden="true">
      {/* Satu array supaya canvas yang hilang tidak dipasang ulang (isinya tetap ada). */}
      {[...visuals.filter((v) => !v.tile.solid).map((v) => spriteEl(v, false)), ...leaving.map((v) => spriteEl(v, true))]}
    </div>
  );
}
