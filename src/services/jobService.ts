import type { JobListing } from '../types/job';
import type { WorkMode } from '../types/application';

// Remotive memblokir request yang terlalu sering (lebih dari 2x per menit) dan kadang
// lambat. Karena itu: hasil di-cache, request dibagi bersama, dijaga maksimal 2x per
// menit, dicoba ulang beberapa kali, dan kalau tetap gagal pakai data tersimpan.
const REMOTIVE_QUERY = 'remote-jobs?category=software-dev&limit=30';
const REMOTIVE_URL = `https://remotive.com/api/${REMOTIVE_QUERY}`;
// Lewat proxy Vite (lihat vite.config.ts), dipakai kalau request langsung kena CORS.
const REMOTIVE_PROXY_URL = `/remotive-api/${REMOTIVE_QUERY}`;
const FALLBACK_URL = '/magang-fallback.json';

const CACHE_KEY = 'remotiveCache';
const FRESH_MS = 30 * 60 * 1000; // data dianggap baru selama 30 menit
const STALE_MS = 7 * 24 * 60 * 60 * 1000; // data lama masih boleh dipakai cadangan sampai 7 hari
const TIMEOUT_MS = 20_000; // Remotive kadang lambat (5-15 detik)
const MAX_ATTEMPTS = 3;
const HITS_KEY = 'remotiveHits'; // waktu request terakhir, untuk menjaga batas 2x per menit
const HIT_LIMIT = 2;
const HIT_WINDOW_MS = 61_000;
const RETRY_WAIT_MS = 15_000; // percobaan ulang hanya kalau jatah request terbuka dalam 15 detik

export type JobSource = 'remotive' | 'fallback';

// Pesan status untuk ditampilkan selama proses (menunggu, mencoba lagi, data lama).
export type StatusListener = (message: string | null) => void;

interface CachedJobs {
  savedAt: number;
  jobs: JobListing[];
}

function readCache(maxAge: number): CachedJobs | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedJobs;
    if (Date.now() - cached.savedAt > maxAge) return null;
    return Array.isArray(cached.jobs) && cached.jobs.length > 0 ? cached : null;
  } catch {
    return null;
  }
}

function writeCache(jobs: JobListing[]): void {
  try {
    const value: CachedJobs = { savedAt: Date.now(), jobs };
    localStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    // localStorage penuh atau diblokir: tidak apa-apa, cukup tanpa cache
  }
}

// Data Remotive kadang tidak lengkap (tags kosong, salary string kosong).
function normalizeJob(raw: unknown): JobListing | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const job = raw as Record<string, unknown>;
  if (typeof job.title !== 'string' || typeof job.company_name !== 'string') return null;
  const id = typeof job.id === 'number' || typeof job.id === 'string' ? job.id : `${job.company_name}-${job.title}`;
  const salary = typeof job.salary === 'string' && job.salary.trim() !== '' ? job.salary : null;
  return {
    id,
    title: job.title,
    company_name: job.company_name,
    category: typeof job.category === 'string' ? job.category : 'Software Development',
    candidate_required_location:
      typeof job.candidate_required_location === 'string' && job.candidate_required_location !== ''
        ? job.candidate_required_location
        : 'Worldwide',
    salary,
    tags: Array.isArray(job.tags) ? job.tags.filter((t): t is string => typeof t === 'string') : [],
  };
}

function parseJobs(data: unknown): JobListing[] {
  const list = Array.isArray(data)
    ? data
    : typeof data === 'object' && data !== null && Array.isArray((data as { jobs?: unknown }).jobs)
      ? (data as { jobs: unknown[] }).jobs
      : null;
  if (!list) throw new Error('Format data lowongan tidak dikenali');
  return list.map(normalizeJob).filter((j): j is JobListing => j !== null);
}

// Error yang ditandai "retryable" boleh dicoba lagi (jaringan, timeout, 429, 5xx).
class RemotiveError extends Error {
  retryable: boolean;
  constructor(message: string, retryable: boolean) {
    super(message);
    this.retryable = retryable;
  }
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  // Batalkan sendiri kalau server tidak menjawab dalam batas waktu.
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), TIMEOUT_MS);
  const onAbort = () => timeout.abort();
  signal?.addEventListener('abort', onAbort);
  try {
    const res = await fetch(url, { signal: timeout.signal });
    if (res.status === 429) throw new RemotiveError('Remotive membatasi request (terlalu sering).', true);
    if (!res.ok) throw new RemotiveError(`Gagal mengambil data lowongan (status ${res.status})`, res.status >= 500);
    return await res.json();
  } catch (err) {
    if (signal?.aborted) throw err; // dibatalkan pemanggil, biarkan
    if (timeout.signal.aborted) throw new RemotiveError(`Server Remotive tidak merespons (timeout ${TIMEOUT_MS / 1000} detik)`, true);
    throw err;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function readHits(): number[] {
  try {
    const hits = JSON.parse(localStorage.getItem(HITS_KEY) ?? '[]') as number[];
    return Array.isArray(hits) ? hits.filter((t) => Date.now() - t < HIT_WINDOW_MS) : [];
  } catch {
    return [];
  }
}

// Remotive memblokir lebih dari 2 request per menit. Sebelum request, tunggu dulu
// kalau jatahnya sudah habis (dicatat di localStorage, jadi reload pun ikut dihitung).
// Kalau harus menunggu lebih lama dari maxWaitMs, menyerah (return false).
async function waitForSlot(onStatus: StatusListener, maxWaitMs: number): Promise<boolean> {
  for (;;) {
    const hits = readHits();
    if (hits.length < HIT_LIMIT) {
      try {
        localStorage.setItem(HITS_KEY, JSON.stringify([...hits, Date.now()]));
      } catch {
        // tanpa localStorage: tetap jalan
      }
      return true;
    }
    const waitMs = Math.min(...hits) + HIT_WINDOW_MS - Date.now();
    if (waitMs > maxWaitMs) return false;
    onStatus(`Menunggu batas Remotive (2 request per menit), ${Math.ceil(waitMs / 1000)} detik lagi...`);
    await sleep(Math.min(waitMs, 1000));
  }
}

const NO_SLOT = 'Remotive sedang dibatasi (maksimal 2 request per menit). Coba lagi sebentar lagi.';

// Satu percobaan = satu request (supaya jatah 2x per menit cukup untuk mencoba ulang).
async function requestRemotive(url: string, onStatus: StatusListener, maxWaitMs: number): Promise<JobListing[]> {
  if (!(await waitForSlot(onStatus, maxWaitMs))) throw new RemotiveError(NO_SLOT, false);
  try {
    return parseJobs(await getJson(url));
  } catch (err) {
    if (err instanceof TypeError) throw new RemotiveError('Tidak bisa terhubung ke Remotive (diblokir atau CORS)', true);
    throw err;
  }
}

async function loadRemotive(onStatus: StatusListener): Promise<JobListing[]> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // Benar-benar offline: tidak usah menunggu / mencoba ulang.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      lastError = new RemotiveError('Tidak ada koneksi internet.', false);
      break;
    }
    if (attempt > 1) onStatus(`Remotive belum merespons, mencoba lagi (${attempt}/${MAX_ATTEMPTS})...`);
    // Gagal karena jaringan/CORS: percobaan berikutnya lewat proxy Vite (ada saat dev/preview).
    const viaProxy = lastError instanceof RemotiveError && lastError.message.startsWith('Tidak bisa terhubung') && attempt % 2 === 0;
    try {
      const jobs = await requestRemotive(viaProxy ? REMOTIVE_PROXY_URL : REMOTIVE_URL, onStatus, attempt === 1 ? Infinity : RETRY_WAIT_MS);
      if (jobs.length === 0) throw new RemotiveError('Remotive tidak mengembalikan lowongan', true);
      writeCache(jobs);
      onStatus(null);
      return jobs;
    } catch (err) {
      // Percobaan ulang yang batal karena jatah request habis: tampilkan error aslinya.
      if (err instanceof RemotiveError && err.message === NO_SLOT && lastError) break;
      lastError = err;
      // Misalnya format data salah atau status 404: mencoba lagi tidak akan membantu.
      const retryable = err instanceof RemotiveError ? err.retryable : err instanceof TypeError;
      if (!retryable) break;
      if (attempt < MAX_ATTEMPTS) await sleep(1500 * 2 ** (attempt - 1)); // 1,5 dtk lalu 3 dtk
    }
  }
  // Semua percobaan gagal: pakai data Remotive terakhir yang berhasil (kalau ada).
  const stale = readCache(STALE_MS);
  if (stale) {
    const minutes = Math.round((Date.now() - stale.savedAt) / 60000);
    const age = minutes < 60 ? `${minutes} menit` : `${Math.round(minutes / 60)} jam`;
    onStatus(`Remotive sedang tidak bisa diakses, menampilkan data Remotive tersimpan (${age} lalu).`);
    return stale.jobs;
  }
  onStatus(null);
  throw lastError instanceof Error ? lastError : new Error('Gagal mengambil data Remotive');
}

// Satu request untuk semua pemanggil. StrictMode (dev) menjalankan effect dua kali,
// dan pindah halaman bolak-balik memasang ulang komponen; tanpa ini tiap kali itu
// menjadi request baru dan cepat kena batas 2x per menit.
let inflight: Promise<JobListing[]> | null = null;
const listeners = new Set<StatusListener>();
const broadcast: StatusListener = (message) => listeners.forEach((listener) => listener(message));

function untilAborted<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Dibatalkan', 'AbortError'));
    const onAbort = () => reject(new DOMException('Dibatalkan', 'AbortError'));
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}

async function fetchRemotive(signal: AbortSignal, onStatus?: StatusListener): Promise<JobListing[]> {
  const fresh = readCache(FRESH_MS);
  if (fresh) return fresh.jobs;
  if (onStatus) listeners.add(onStatus);
  inflight ??= loadRemotive(broadcast).finally(() => {
    inflight = null;
  });
  try {
    // Komponen yang dibatalkan hanya berhenti menunggu; request-nya tetap jalan
    // dan hasilnya disimpan ke cache untuk pemanggil berikutnya.
    return await untilAborted(inflight, signal);
  } finally {
    if (onStatus) listeners.delete(onStatus);
  }
}

export async function fetchJobs(source: JobSource, signal: AbortSignal, onStatus?: StatusListener): Promise<JobListing[]> {
  if (source === 'remotive') return fetchRemotive(signal, onStatus);
  return parseJobs(await getJson(FALLBACK_URL, signal));
}

export function guessWorkMode(location: string): WorkMode {
  const text = location.toLowerCase();
  if (text.includes('hybrid')) return 'Hybrid';
  if (text.includes('onsite') || text.includes('on-site')) return 'Onsite';
  return 'Remote';
}
