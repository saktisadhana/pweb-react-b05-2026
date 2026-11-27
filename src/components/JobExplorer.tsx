import { useEffect, useState, type CSSProperties } from 'react';
import type { JobListing } from '../types/job';
import type { Application } from '../types/application';
import { fetchJobs, guessWorkMode, type JobSource } from '../services/jobService';
import { useDebounce } from '../hooks/useDebounce';
import { createApplication, getSkillMatch, isDuplicateApplication } from '../utils/application';
import { GridButton, GridTile } from './seno/GridTile';
import { TileBtn, TileInput, TileLabel } from './seno/OverlayTile';
import { gridBox } from './seno/grid';
import { CountUp } from './seno/CountUp';

interface JobExplorerProps {
  kaptenSkills: string[];
  applications: Application[];
  onAdd: (application: Application) => void;
  source: JobSource;
  onSourceChange: (source: JobSource) => void;
  listPage: number; // halaman daftar (0 = halaman 1), dipilih lewat tile nomor di background
  onListPage: (index: number) => void;
  onPageCount: (count: number) => void;
}

type SortOption = 'match' | 'az';

// 1 lowongan besar ("paling cocok") + 3 baris, sesuai frame Eksplorasi di Figma.
export const JOBS_PER_PAGE = 4;

// Warna badge sesuai soal: hijau >= 70, kuning 40-69, merah < 40
function getMatchColor(score: number): string {
  if (score >= 70) return 'var(--green)';
  if (score >= 40) return 'var(--amber-text)';
  return 'var(--red)';
}

const matchStyle = (score: number): CSSProperties => ({ color: getMatchColor(score) });

// Fitur 1 - Eksplorasi Lowongan (Marvel). Logika fetch, filter, dan sort dari
// versi Marvel; tampilannya mengikuti frame Eksplorasi (Meow) di Figma.
export function JobExplorer({ kaptenSkills, applications, onAdd, source, onSourceChange, listPage, onListPage, onPageCount }: JobExplorerProps) {
  // State hasil fetch: data, loading, error
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0); // dinaikkan saat klik "Coba Lagi"
  const [status, setStatus] = useState<string | null>(null); // pesan dari jobService (menunggu, mencoba lagi, data tersimpan)

  // State filter
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('match');
  const [forced, setForced] = useState<string | null>(null); // tombol Enter: pakai keyword sekarang juga

  // Keyword yang baru "dipakai" setelah user berhenti mengetik 400ms
  const debouncedKeyword = useDebounce(keyword, 400);

  // Fetch ulang setiap kali sumber data berubah atau tombol Coba Lagi diklik
  useEffect(() => {
    const controller = new AbortController();

    async function loadJobs() {
      setIsLoading(true);
      setError(null);
      setStatus(null);
      try {
        const data = await fetchJobs(source, controller.signal, (message) => {
          if (!controller.signal.aborted) setStatus(message);
        });
        setJobs(data);
      } catch (err) {
        // Request yang sengaja dibatalkan (cleanup) bukan error, abaikan
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadJobs();

    // Cleanup: batalkan request lama sebelum request baru dijalankan / saat unmount
    return () => controller.abort();
  }, [source, reloadKey]);

  // ===== Derived state: dihitung langsung dari state, tidak disimpan di useState =====

  // Daftar kategori unik dari data lowongan
  const categories = [...new Set(jobs.map((job) => job.category))];

  // Tombol Enter melewati jeda debounce; selain itu pakai keyword hasil debounce.
  const search = (forced === keyword ? keyword : debouncedKeyword).trim().toLowerCase();

  // 1. filter keyword & kategori, 2. hitung skill match tiap lowongan, 3. urutkan
  // (.sort() aman di sini karena array-nya hasil baru dari .filter() dan .map(), bukan state)
  const visibleJobs = jobs
    .filter((job) => {
      const matchKeyword = job.title.toLowerCase().includes(search) || job.company_name.toLowerCase().includes(search);
      const matchCategory = category === 'ALL' || job.category === category;
      return matchKeyword && matchCategory;
    })
    .map((job) => ({ job, match: getSkillMatch(job.tags, kaptenSkills) }))
    .sort((a, b) => (sortBy === 'match' ? b.match.score - a.match.score : a.job.title.localeCompare(b.job.title)));

  // Pagination: tile nomor halaman ada di background, jumlah halaman dilaporkan ke App.
  const pageCount = Math.max(1, Math.ceil(visibleJobs.length / JOBS_PER_PAGE));
  const current = Math.min(listPage, pageCount - 1);
  const pageJobs = visibleJobs.slice(current * JOBS_PER_PAGE, current * JOBS_PER_PAGE + JOBS_PER_PAGE);
  useEffect(() => onPageCount(isLoading || error ? 1 : pageCount), [pageCount, isLoading, error, onPageCount]);

  // Ganti filter = kembali ke halaman 1
  const filterChanged = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    onListPage(0);
  };

  // Ubah lowongan jadi objek lamaran berstatus WISHLIST, lalu kirim ke App
  // (tidak mungkin duplikat, karena tombolnya sudah disabled kalau sudah dilamar)
  function handleSave(job: JobListing) {
    const newApplication = createApplication(applications, {
      company: job.company_name,
      role: job.title,
      status: 'WISHLIST',
      requiredSkills: job.tags,
      workMode: guessWorkMode(job.candidate_required_location),
    });
    onAdd(newApplication);
  }

  const saved = (job: JobListing) => isDuplicateApplication(applications, job.company_name, job.title);
  const [featured, ...rest] = pageJobs;

  return (
    <>
      {/* Baris atas: tombol Enter, kolom cari, kategori, urutkan */}
      <TileBtn
        box={gridBox(6, 1, 3)}
        tone="navy"
        label="Cari sekarang"
        onClick={() => {
          setForced(keyword);
          onListPage(0);
        }}
      >
        <TileLabel tone="navy" x={39} y={21}>&gt; Enter</TileLabel>
      </TileBtn>
      <TileInput
        box={gridBox(6, 2, 3)}
        tone="amber"
        label="Cari posisi atau perusahaan"
        placeholder=">/ ..."
        value={keyword}
        onChange={filterChanged(setKeyword)}
        onEnter={() => setForced(keyword)}
      />

      <GridTile c={10} r={1} w={4} label="Filter kategori">
        <span className="k">&gt;/ Kategori</span>
        <span className="select-wrap">
          <select value={category} onChange={(e) => filterChanged(setCategory)(e.target.value)} className="dot">
            <option value="ALL">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </span>
      </GridTile>
      <GridTile c={10} r={2} w={4} label="Urutkan lowongan">
        <span className="k">&gt;/ Urutkan</span>
        <span className="select-wrap">
          <select value={sortBy} onChange={(e) => filterChanged(setSortBy)(e.target.value as SortOption)} className="dot">
            <option value="match">Match Tertinggi</option>
            <option value="az">Judul A-Z</option>
          </select>
        </span>
      </GridTile>

      {/* Sumber data: klik tile untuk ganti Remotive API <-> dataset lokal */}
      <TileBtn
        box={gridBox(1, 4, 5)}
        tone="navy"
        label={`Sumber data: ${source === 'remotive' ? 'Remotive API' : 'dataset lokal'}. Klik untuk ganti.`}
        onClick={() => {
          onSourceChange(source === 'remotive' ? 'fallback' : 'remotive');
          onListPage(0);
        }}
      >
        <TileLabel tone="navy" x={27} y={8}>/ Sumber Data</TileLabel>
        <span className="lt__note" title={status ?? undefined}>
          {source === 'fallback'
            ? `> Dataset lokal (${isLoading || error ? '…' : jobs.length} lowongan)`
            : !isLoading && status
              ? '> Remotive API (data tersimpan)'
              : '> Remotive API (live)'}
        </span>
      </TileBtn>

      {/* State Loading / Error / Kosong */}
      {isLoading && (
        <GridTile c={6} r={3} w={8} h={2} className="gt--center" label="Memuat">
          <p className="hx">Memuat lowongan...</p>
          <p className="s muted">{status ?? (source === 'remotive' ? 'Mengambil data dari Remotive API' : 'Membaca magang-fallback.json')}</p>
        </GridTile>
      )}

      {!isLoading && error && (
        <>
          <GridTile c={6} r={3} w={8} hot className="is-error" label="Gagal memuat">
            <p className="v">Lowongan gagal dimuat. {error}</p>
            <p className="xs muted">Periksa koneksi internet, lalu coba lagi atau pakai dataset lokal.</p>
          </GridTile>
          <GridButton c={6} r={4} w={4} className="gt--center" onClick={() => setReloadKey((k) => k + 1)}>
            <span className="h2 chev">Coba Lagi</span>
          </GridButton>
          {source === 'remotive' && (
            <GridButton c={10} r={4} w={4} className="gt--center gt--navy" onClick={() => onSourceChange('fallback')}>
              <span className="h2 chev">Pakai Data Lokal</span>
            </GridButton>
          )}
        </>
      )}

      {!isLoading && !error && visibleJobs.length === 0 && (
        <GridTile c={6} r={3} w={8} label="Tidak ada lowongan">
          <p className="v">
            {jobs.length === 0 ? 'Sumber data ini tidak berisi lowongan.' : 'Tidak ada lowongan yang cocok dengan pencarian atau kategori ini.'}
          </p>
        </GridTile>
      )}

      {/* Lowongan pertama di halaman ini: kartu besar */}
      {!isLoading && !error && featured && (
        <>
          <GridTile c={6} r={3} w={2} h={2} hot={current === 0} className="gt--center" label="Skill match">
            <span className="big" style={matchStyle(featured.match.score)}>
              <CountUp value={`${featured.match.score}%`} />
            </span>
            <span className="xs">{current === 0 ? '/ paling cocok' : `/ halaman ${current + 1}`}</span>
          </GridTile>
          <GridTile c={8} r={3} w={6} label="Posisi">
            <span className="hx">{featured.job.title}</span>
          </GridTile>
          <GridTile c={8} r={4} w={4} label="Perusahaan">
            <span className="h2">{featured.job.company_name}</span>
            <span className="xs">{featured.job.candidate_required_location}</span>
          </GridTile>
          <GridTile c={12} r={4} w={2} label="Gaji">
            <span className="h3">{featured.job.salary || 'Tidak dicantumkan'}</span>
            {featured.job.salary && <span className="xs">/ bulan</span>}
          </GridTile>
          <GridTile c={6} r={5} w={6} label="Skill">
            <span className="xs">/ Skill kamu yang cocok</span>
            <span className="h3">{featured.match.matchedSkills.join(', ') || 'Belum ada yang cocok'}</span>
            {featured.match.missingSkills.length > 0 && (
              <span className="xs" style={{ color: 'var(--red)' }}>Kurang: {featured.match.missingSkills.join(', ')}</span>
            )}
          </GridTile>
          <GridButton c={12} r={5} w={2} className="gt--center" disabled={saved(featured.job)} onClick={() => handleSave(featured.job)}>
            <span className="h3 chev">{saved(featured.job) ? 'Sudah Dilamar' : 'Simpan ke Wishlist'}</span>
          </GridButton>
        </>
      )}

      {/* Sisa lowongan di halaman ini: 3 baris */}
      {!isLoading &&
        !error &&
        rest.map(({ job, match }, i) => (
          <JobRow key={job.id} r={6 + i} job={job} match={match} saved={saved(job)} onSave={() => handleSave(job)} />
        ))}
    </>
  );
}

interface JobRowProps {
  r: number;
  job: JobListing;
  match: ReturnType<typeof getSkillMatch>;
  saved: boolean;
  onSave: () => void;
}

function JobRow({ r, job, match, saved, onSave }: JobRowProps) {
  return (
    <>
      <GridTile c={6} r={r} className="gt--center" label="Skill match">
        <span className="h2" style={matchStyle(match.score)}>
          {match.score}%
        </span>
        <span className="bar" style={{ width: '100%' }}>
          <i style={{ width: `${match.score}%`, background: getMatchColor(match.score) }} />
        </span>
      </GridTile>
      <GridTile c={7} r={r} w={4} label={job.title}>
        <span className="h3">{job.title}</span>
        <span className="xs">
          {job.company_name}, {job.candidate_required_location}
          {job.salary ? ` / ${job.salary}` : ''}
        </span>
      </GridTile>
      <GridTile c={11} r={r} w={2} label="Skill yang kurang">
        <span className="xs">{match.missingSkills.length ? '/ Kurang' : '/ Skill lengkap'}</span>
        <span className="s" style={match.missingSkills.length ? { color: 'var(--red)' } : undefined}>
          {match.missingSkills.join(', ') || match.matchedSkills.join(', ')}
        </span>
      </GridTile>
      <GridButton c={13} r={r} className="gt--center" disabled={saved} onClick={onSave}>
        <span className="xs chev">{saved ? 'Sudah Dilamar' : 'Simpan'}</span>
      </GridButton>
    </>
  );
}
