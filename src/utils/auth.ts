// Akun lokal (tanpa backend). Akun disimpan di localStorage browser ini.
// Password TIDAK disimpan apa adanya: yang disimpan hanya hash SHA-256 dari
// salt acak + password. Ini cukup untuk tugas front-end, tapi bukan keamanan
// sungguhan (siapa pun yang memegang browser bisa membuka localStorage).

export interface Account {
  username: string; // huruf kecil, unik
  name: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

export interface User {
  username: string;
  name: string;
  guest: boolean;
}

export interface RegisterInput {
  name: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export const GUEST: User = { username: 'tamu', name: 'Tamu', guest: true };
export const MIN_PASSWORD = 6;
const USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/;

export const normalizeUsername = (u: string) => u.trim().toLowerCase();

const toHex = (bytes: Uint8Array) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

// crypto.subtle hanya ada di https atau localhost. Kalau web dibuka lewat
// http://192.168.x.x, pakai hash sederhana (FNV-1a) supaya tetap bisa login.
async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', data);
    return toHex(new Uint8Array(digest));
  }
  let h = 0x811c9dc5;
  for (const byte of data) {
    h ^= byte;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `fnv-${h.toString(16)}`;
}

// Melempar Error berisi pesan untuk ditampilkan kalau isian tidak valid.
export function validateRegistration(input: RegisterInput, accounts: readonly Account[]): void {
  const username = normalizeUsername(input.username);
  if (!USERNAME_PATTERN.test(username)) {
    throw new Error('Username 3-20 karakter, hanya huruf, angka, titik, atau garis bawah.');
  }
  if (username === GUEST.username) throw new Error('Username "tamu" dipakai untuk mode demo.');
  if (accounts.some((a) => a.username === username)) throw new Error('Username sudah dipakai.');
  if (input.password.length < MIN_PASSWORD) throw new Error(`Password minimal ${MIN_PASSWORD} karakter.`);
  if (input.password !== input.confirmPassword) throw new Error('Ulangi password tidak sama.');
}

export async function createAccount(input: RegisterInput, accounts: readonly Account[]): Promise<Account> {
  validateRegistration(input, accounts);
  const salt = randomSalt();
  return {
    username: normalizeUsername(input.username),
    name: input.name.trim() || normalizeUsername(input.username),
    salt,
    passwordHash: await hashPassword(input.password, salt),
    createdAt: new Date().toISOString(),
  };
}

// Pesannya sengaja sama untuk username salah dan password salah,
// supaya tidak membocorkan username mana yang terdaftar.
export async function verifyLogin(username: string, password: string, accounts: readonly Account[]): Promise<Account> {
  if (!username.trim() || !password) throw new Error('Username dan password wajib diisi.');
  const account = accounts.find((a) => a.username === normalizeUsername(username));
  const hash = await hashPassword(password, account?.salt ?? 'tidak-ada');
  if (!account || hash !== account.passwordHash) throw new Error('Username atau password salah.');
  return account;
}

export const toUser = (a: Account): User => ({ username: a.username, name: a.name, guest: false });
