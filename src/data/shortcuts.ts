import type { Page } from './figmaTiles';

export interface Shortcut {
  keys: string[];
  label: string;
}

// Urutan angka mengikuti urutan menu kiri. Agenda tidak ada di menu, jadi diberi angka terakhir sebelum Profil.
export const PAGE_KEYS: Record<string, Page> = {
  '1': 'warroom',
  '2': 'offer',
  '3': 'explore',
  '4': 'agenda',
  '5': 'profil',
};

// Satu sumber untuk popup "?", tile Profil, dan handler di App, supaya ketiganya tidak beda isi.
export const SHORTCUTS: Shortcut[] = [
  { keys: ['?'], label: 'Tampilkan semua shortcut' },
  { keys: ['/'], label: 'Cari lamaran di War Room' },
  { keys: ['N'], label: 'Tambah lamaran baru' },
  { keys: ['1'], label: 'Buka War Room' },
  { keys: ['2'], label: 'Buka Compare-Offer' },
  { keys: ['3'], label: 'Buka Eksplorasi lowongan' },
  { keys: ['4'], label: 'Buka Agenda' },
  { keys: ['5'], label: 'Buka Profil' },
  { keys: ['[', ']'], label: 'Halaman daftar atau bulan Agenda sebelumnya / berikutnya' },
  { keys: ['B'], label: 'Kembali ke layar sebelumnya' },
  { keys: ['I'], label: 'Buka atau tutup notifikasi' },
  { keys: ['M'], label: 'Lipat atau buka menu kiri' },
  { keys: ['T'], label: 'Ganti tema terang / gelap' },
  { keys: ['Esc'], label: 'Tutup popup' },
  { keys: ['←', '→'], label: 'Agenda: pindah hari (↑ ↓ pindah minggu)' },
  { keys: ['PgUp', 'PgDn'], label: 'Agenda: pindah bulan, Home ke hari ini' },
];
