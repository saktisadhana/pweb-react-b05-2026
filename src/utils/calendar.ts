import { toDateKey } from './format';

export const MONTHS_LONG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const DAYS_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
// Kalender Indonesia dimulai hari Senin.
export const WEEKDAYS_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Pakai konstruktor Date (bukan tambah milidetik) supaya pergantian jam musim panas tidak menggeser hari.
export function addDays(key: string, n: number): string {
  const d = parseDateKey(key);
  return toDateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
}

// 31 Jan + 1 bulan -> 28/29 Feb, bukan 3 Maret.
export function addMonths(key: string, n: number): string {
  const d = parseDateKey(key);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
  return toDateKey(new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), lastDay)));
}

// Selalu 6 minggu x 7 hari, supaya tinggi kalender tidak lompat saat ganti bulan.
export function monthGrid(key: string): Date[] {
  const d = parseDateKey(key);
  const offset = (new Date(d.getFullYear(), d.getMonth(), 1).getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => new Date(d.getFullYear(), d.getMonth(), 1 - offset + i));
}

export const isSameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export const formatDayTitle = (d: Date) => `${DAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
