// Peta tile background, disalin dari frame Figma SENO (1440 x 1238).
// Angka = posisi px di frame. Grid: tile 100px, jarak 5px, jadi 1 langkah = 105px.
// col(i) = -65 + 105i, row(j) = 59 + 105j.
import profileIcon from '../assets/profile.svg';
import oxIcon from '../assets/ox.svg';
import textIcon from '../assets/text.svg';

export type Page = 'explore' | 'warroom' | 'detail' | 'offer' | 'profil' | 'agenda';

// B = tile biru, Y = tile kuning.
export type TileColor = 'B' | 'Y';

// Aksi saat tile di-klik. Tile tanpa action hanya dekorasi.
export type TileAction =
  | { type: 'nav'; page: Page }
  | { type: 'back' }
  | { type: 'notif' }
  | { type: 'listPage'; index: number }
  | { type: 'pageStep'; delta: -1 | 1 };

export interface TileIcon {
  src: string;
  w: number; // ukuran tampil (px frame)
  h: number;
  dx: number;
  dy: number;
}

export interface TileDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: TileColor;
  label?: { text: string; dx: number; dy: number; rotate?: number };
  icon?: TileIcon;
  action?: TileAction;
  // Halaman mana saja yang membuat tile ini jadi "aktif" (kuning + garis biru).
  currentOn?: Page[];
  // Warna penuh tanpa mask global (seperti tile nomor halaman di Figma yang punya mask sendiri).
  solid?: boolean;
  name?: string; // nama untuk screen reader (tile ikon tanpa tulisan)
}

// Tile nomor halaman War Room (pola sama dengan frame Eksplorasi: baris y 1004,
// warna selang-seling, "/ Pages" di bawahnya). Maksimal 8 tile; kalau halaman
// lebih banyak, yang tampil adalah jendela di sekitar halaman aktif.
const PAGER_COLORS: TileColor[] = ['B', 'Y', 'B', 'Y', 'Y', 'B', 'Y', 'B'];
const PAGER_DX = [37, 39, 35, 35, 34, 35, 35, 35];

export function getPagerTiles(count: number, current: number): TileDef[] {
  const slots = 8;
  const start = Math.max(0, Math.min(current - 3, count - slots));
  const tiles: TileDef[] = [];
  for (let i = 0; i < Math.min(slots, count); i++) {
    const index = start + i;
    const text = String(index + 1);
    tiles.push({
      id: `pager:${i}`,
      x: 565 + 105 * i,
      y: 1004,
      w: 100,
      h: 100,
      color: PAGER_COLORS[i],
      label: { text, dx: text.length > 1 ? 18 : PAGER_DX[i], dy: 21 },
      action: { type: 'listPage', index },
      solid: true,
    });
  }
  tiles.push(
    { id: 'pager:label', x: 565, y: 1109, w: 310, h: 100, color: 'Y', label: { text: '/ Pages', dx: 37, dy: 21 } },
    { id: 'pager:line', x: 880, y: 1109, w: 310, h: 100, color: 'B', label: { text: '-'.repeat(Math.min(9, count + 2)), dx: 25, dy: 21 } },
  );
  return tiles;
}

type Row = [x: number, y: number, w: number, h: number, color: TileColor, extra?: Partial<TileDef>];

const lab = (text: string, dx: number, dy: number, rotate?: number) => ({ label: { text, dx, dy, rotate } });

const ICONS = {
  profile: { src: profileIcon, w: 38.7, h: 50, dx: 31, dy: 25 },
  ox: { src: oxIcon, w: 53.3, h: 52, dx: 23, dy: 24 },
  text: { src: textIcon, w: 64.7, h: 31.3, dx: 18, dy: 35 },
} satisfies Record<string, TileIcon>;

// Baris paling atas + baris logo, sama di semua halaman.
const HEADER: Row[] = [
  [145, -46, 100, 100, 'B'],
  [250, -46, 310, 100, 'B'],
  [565, -46, 100, 100, 'Y'],
  [670, -46, 100, 100, 'B'],
  [880, -46, 520, 100, 'Y'],
  [1405, -46, 100, 100, 'B'],
  [-65, 59, 100, 100, 'Y'],
  [250, 59, 100, 100, 'B', { ...lab('<', 32, 19), action: { type: 'back' } }],
  [355, 59, 100, 100, 'Y', { icon: ICONS.profile, action: { type: 'nav', page: 'profil' }, currentOn: ['profil'] }],
  [565, 59, 100, 100, 'B', { ...lab('!', 45, 19), action: { type: 'notif' } }],
  [670, 59, 730, 100, 'B', lab('/ Info', 39, 19)],
];

// Menu kiri. Warna aslinya biru; saat aktif berubah kuning (lihat currentOn).
const NAV: Row[] = [
  [40, 164, 415, 100, 'B', { ...lab('> War Room', 40, 21), action: { type: 'nav', page: 'warroom' }, currentOn: ['warroom', 'detail'] }],
  // Ikon di sebelah kanan adalah bagian dari menu di kirinya (satu pasang, aktif bersama).
  [460, 164, 100, 100, 'B', { icon: ICONS.ox, name: 'War Room (ikon)', action: { type: 'nav', page: 'warroom' }, currentOn: ['warroom', 'detail'] }],
  [40, 269, 415, 100, 'B', { ...lab('> Compare-', 40, 21), action: { type: 'nav', page: 'offer' }, currentOn: ['offer'] }],
  [460, 269, 100, 100, 'B', { icon: ICONS.text, name: 'Compare-Offer (ikon)', action: { type: 'nav', page: 'offer' }, currentOn: ['offer'] }],
  [40, 374, 205, 100, 'B', { ...lab('-Offer', 18, 21), action: { type: 'nav', page: 'offer' }, currentOn: ['offer'] }],
];

const ARROWS: Row = [355, 1004, 205, 100, 'B', { ...lab('<<<<', 33, 21), action: { type: 'back' } }];

// Frame War Room, Detail, Offer, Profil, Agenda memakai peta yang sama.
const SHARED: Row[] = [
  [985, 164, 415, 100, 'Y'],
  [1405, 164, 100, 205, 'B'],
  [-65, 269, 100, 205, 'B'],
  [985, 269, 415, 100, 'B'],
  [250, 374, 205, 100, 'Y'],
  [1405, 374, 100, 625, 'B'],
  [-65, 689, 100, 205, 'B'],
  [-65, 899, 100, 100, 'B'],
  [-65, 1004, 100, 100, 'B'],
  [145, 1004, 100, 100, 'Y'],
  [250, 1004, 100, 100, 'B'],
  ARROWS,
  [1405, 1004, 100, 205, 'B'],
  [40, 1109, 100, 100, 'Y'],
  [40, 1214, 100, 100, 'Y'],
  [145, 1214, 100, 100, 'B'],
  [775, 1214, 100, 100, 'B'],
  [880, 1214, 415, 100, 'B'],
  [1405, 1214, 100, 100, 'Y'],
];

const SUMBER_DATA: Row = [40, 479, 520, 100, 'B', lab('/ Sumber Data', 40, 21)];

// Frame Eksplorasi (Meow). Tile yang bisa diklik/diketik (Enter, kolom cari,
// Sumber Data, Add Skills, +) tidak diberi tulisan di sini: tulisannya ikut
// overlay di JobExplorer/SkillProfile supaya ikut berubah warna saat ditekan.
// Nomor halaman memakai getPagerTiles (bisa diklik), bukan angka statis.
const EXPLORE: Row[] = [
  [565, 164, 310, 100, 'B'],
  [880, 164, 100, 100, 'Y', lab('<', 19, 65, -90)],
  [985, 164, 415, 100, 'Y'],
  [1405, 164, 100, 205, 'B'],
  [-65, 269, 100, 205, 'B'],
  [565, 269, 310, 100, 'Y'],
  [880, 269, 100, 100, 'B'],
  [985, 269, 415, 100, 'B'],
  [250, 374, 205, 100, 'Y'],
  [1405, 374, 100, 625, 'B'],
  [40, 479, 520, 100, 'B'],
  [40, 584, 415, 100, 'Y'],
  [460, 584, 100, 100, 'B'],
  [-65, 689, 100, 205, 'B'],
  [40, 689, 520, 205, 'B'],
  [-65, 899, 100, 100, 'B'],
  [40, 899, 520, 100, 'Y', lab('/ Profil Skills', 33, 21)],
  [-65, 1004, 100, 100, 'B'],
  [145, 1004, 100, 100, 'Y'],
  [250, 1004, 100, 100, 'B'],
  ARROWS,
  [1405, 1004, 100, 205, 'B'],
  [40, 1109, 100, 100, 'Y'],
  [1195, 1109, 100, 100, 'Y', { ...lab('<', 34, 19), name: 'Halaman sebelumnya', action: { type: 'pageStep', delta: -1 } }],
  [1300, 1109, 100, 100, 'B', { ...lab('>', 34, 19), name: 'Halaman berikutnya', action: { type: 'pageStep', delta: 1 } }],
  [40, 1214, 100, 100, 'Y'],
  [145, 1214, 100, 100, 'B'],
  [775, 1214, 100, 100, 'B'],
  [880, 1214, 415, 100, 'B'],
  [1405, 1214, 100, 100, 'Y'],
];

const build = (rows: Row[]): TileDef[] =>
  rows.map(([x, y, w, h, color, extra]) => ({ id: `${x}:${y}:${w}:${h}`, x, y, w, h, color, ...extra }));

export function getTiles(page: Page): TileDef[] {
  if (page === 'explore') return build([...HEADER, ...NAV, ...EXPLORE]);
  if (page === 'offer') return build([...HEADER, ...NAV, ...SHARED, SUMBER_DATA]);
  return build([...HEADER, ...NAV, ...SHARED]);
}

// Isi area kosong (tidak ada konten dan tidak ada tile) dengan tile biru/kuning.
// Area yang diisi: kolom 1-13, baris 1-9 (di bawah header, di atas baris "<<<<").
// Tidak semua sel diisi: sekitar 40% dibiarkan bolong seperti di desain Figma.
// Sel yang diisi dan bersebelahan digabung jadi tile selebar 1-3 sel. Bolong dan
// warna dipilih dari posisi sel, jadi polanya selalu sama (tidak acak tiap render).
export interface Rect { x: number; y: number; w: number; h: number }

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w - 10 && b.x < a.x + a.w - 10 && a.y < b.y + b.h - 10 && b.y < a.y + a.h - 10;

const hash = (c: number, r: number) => {
  let h = (c * 73856093) ^ (r * 19349663);
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
  return (h ^ (h >>> 15)) >>> 0;
};

const HOLE_PERCENT = 40;
const isHole = (c: number, r: number) => hash(c * 7 + 3, r * 5 + 1) % 100 < HOLE_PERCENT;

export function getFillTiles(tiles: TileDef[], blocked: Rect[]): TileDef[] {
  const taken = [...tiles, ...blocked];
  const fills: TileDef[] = [];
  for (let r = 1; r <= 9; r++) {
    let c = 1;
    while (c <= 13) {
      const cell = { x: -65 + 105 * c, y: 59 + 105 * r, w: 100, h: 100 };
      if (isHole(c, r) || taken.some((t) => overlaps(cell, t))) {
        c++;
        continue;
      }
      // Lebar tile: 1-3 sel, selama sel di kanannya juga kosong.
      const want = 1 + (hash(c, r) % 3);
      let w = 1;
      while (w < want && c + w <= 13) {
        const next = { x: -65 + 105 * (c + w), y: cell.y, w: 100, h: 100 };
        if (isHole(c + w, r) || taken.some((t) => overlaps(next, t))) break;
        w++;
      }
      fills.push({
        id: `fill:${c}:${r}:${w}`,
        x: cell.x,
        y: cell.y,
        w: 105 * w - 5,
        h: 100,
        color: hash(r, c) % 10 < 3 ? 'Y' : 'B',
      });
      c += w;
    }
  }
  return fills;
}
