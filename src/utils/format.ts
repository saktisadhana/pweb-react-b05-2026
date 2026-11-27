// Format tampilan tanggal dan uang (bahasa Indonesia).

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const pad = (n: number) => String(n).padStart(2, '0');

// "2026-11-22T10:00" -> "22 Nov, 10:00"
export function formatShortDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "2026-11-22T10:00" -> "22 Nov 2026, 10:00"
export function formatLongDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const formatTime = (value: string) => {
  const d = new Date(value);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const monthName = (m: number) => MONTHS[m];

// 4_500_000 -> "4,5 jt"
export const formatJuta = (n: number) =>
  `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(n / 1_000_000)} jt`;

// Tanggal lokal "YYYY-MM-DD" (bukan UTC, supaya tidak geser hari).
export const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
