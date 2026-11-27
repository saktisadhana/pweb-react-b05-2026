import type { TileColor, TileDef } from '../../data/figmaTiles';

// Rumus grid dari Figma: tile 100px, jarak 5px (1 langkah = 105px).
export const colX = (c: number) => -65 + 105 * c;
export const rowY = (r: number) => 59 + 105 * r;
export const span = (n: number) => 105 * n - 5;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Kotak dari posisi grid: kolom c, baris r, lebar w, tinggi h (dalam jumlah tile).
export const gridBox = (c: number, r: number, w = 1, h = 1): Box => ({ x: colX(c), y: rowY(r), w: span(w), h: span(h) });

// Warna yang tampil: tile aktif selalu kuning. Saat ditekan, warnanya dibalik
// (biru -> kuning, kuning -> biru).
export function shownColor(tile: TileDef, isCurrent: boolean, pressed: boolean): TileColor {
  const base: TileColor = isCurrent ? 'Y' : tile.color;
  return pressed ? (base === 'B' ? 'Y' : 'B') : base;
}

// Jeda animasi muncul tiap tile: bergelombang dari kiri atas ke kanan bawah (maks ~0,5 detik).
const ENTER_SPREAD_MS = 520;
export const enterDelay = (t: { x: number; y: number }) =>
  Math.round(((t.x + 65 + t.y) / (1440 + 1238)) * ENTER_SPREAD_MS);
