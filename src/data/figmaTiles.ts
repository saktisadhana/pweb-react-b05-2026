// Peta tile background, disalin dari frame Figma SENO (1440 x 1238).
// Angka = posisi px di frame. Grid: tile 100px, jarak 5px, jadi 1 langkah = 105px.
// col(i) = -65 + 105i, row(j) = 59 + 105j.
import profileIcon from '../assets/profile.png';
import oxIcon from '../assets/ox.png';
import textIcon from '../assets/text.png';

export type Page = 'explore' | 'warroom' | 'detail' | 'offer' | 'profil' | 'agenda';

// B = tile biru, Y = tile kuning.
export type TileColor = 'B' | 'Y';

// Aksi saat tile di-klik. Tile tanpa action hanya dekorasi.
export type TileAction =
  | { type: 'nav'; page: Page }
  | { type: 'back' }
  | { type: 'notif' };

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
  [460, 164, 100, 100, 'B', { icon: ICONS.ox, action: { type: 'nav', page: 'agenda' }, currentOn: ['agenda'] }],
  [40, 269, 415, 100, 'B', { ...lab('> Compare-', 40, 21), action: { type: 'nav', page: 'offer' }, currentOn: ['offer'] }],
  [460, 269, 100, 100, 'B', { icon: ICONS.text, action: { type: 'nav', page: 'explore' }, currentOn: ['explore'] }],
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

// Frame Eksplorasi (Meow). Bagian ini milik Marvel, tapi tile-nya tetap mengikuti Figma.
const EXPLORE: Row[] = [
  [565, 164, 310, 100, 'B', lab('> Enter', 39, 21)],
  [880, 164, 100, 100, 'Y', lab('<', 19, 65, -90)],
  [985, 164, 415, 100, 'Y'],
  [1405, 164, 100, 205, 'B'],
  [-65, 269, 100, 205, 'B'],
  [565, 269, 310, 100, 'Y', lab('>/ ...', 40, 21)],
  [880, 269, 100, 100, 'B'],
  [985, 269, 415, 100, 'B'],
  [250, 374, 205, 100, 'Y'],
  [1405, 374, 100, 625, 'B'],
  SUMBER_DATA,
  [40, 584, 415, 100, 'Y', lab('>/ Add Skills', 33, 21)],
  [460, 584, 100, 100, 'B', lab('+', 35, 21)],
  [-65, 689, 100, 205, 'B'],
  [40, 689, 520, 205, 'B'],
  [-65, 899, 100, 100, 'B'],
  [40, 899, 520, 100, 'Y', lab('/ Profil Skills', 33, 21)],
  [-65, 1004, 100, 100, 'B'],
  [145, 1004, 100, 100, 'Y'],
  [250, 1004, 100, 100, 'B'],
  ARROWS,
  [565, 1004, 100, 100, 'B', lab('1', 37, 21)],
  [670, 1004, 100, 100, 'Y', lab('2', 39, 21)],
  [775, 1004, 100, 100, 'B', lab('3', 35, 21)],
  [880, 1004, 100, 100, 'Y', lab('4', 35, 21)],
  [985, 1004, 100, 100, 'Y', lab('5', 34, 21)],
  [1090, 1004, 100, 100, 'B', lab('6', 35, 21)],
  [1195, 1004, 100, 100, 'Y', lab('7', 35, 21)],
  [1300, 1004, 100, 100, 'B', lab('...', 12, 21)],
  [1405, 1004, 100, 205, 'B'],
  [40, 1109, 100, 100, 'Y'],
  [565, 1109, 310, 100, 'Y', lab('/ Pages', 37, 21)],
  [880, 1109, 310, 100, 'B', lab('---------', 25, 21)],
  [1195, 1109, 100, 100, 'Y', lab('<', 34, 19)],
  [1300, 1109, 100, 100, 'B', lab('<', 65, 19)],
  [40, 1214, 100, 100, 'Y'],
  [145, 1214, 100, 100, 'B'],
  [775, 1214, 100, 100, 'B'],
  [880, 1214, 415, 100, 'B'],
  [1405, 1214, 100, 100, 'Y'],
];

const build = (rows: Row[]): TileDef[] =>
  rows.map(([x, y, w, h, color, extra]) => ({ id: `${x}:${y}`, x, y, w, h, color, ...extra }));

export function getTiles(page: Page): TileDef[] {
  if (page === 'explore') return build([...HEADER, ...NAV, ...EXPLORE]);
  if (page === 'offer') return build([...HEADER, ...NAV, ...SHARED, SUMBER_DATA]);
  return build([...HEADER, ...NAV, ...SHARED]);
}
