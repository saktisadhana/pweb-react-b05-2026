import { useEffect, useState } from "react";
import type { JobListing } from "../types/job";
import type { Application } from "../types/application";
import { fetchJobs, guessWorkMode, type JobSource } from "../services/jobService";
import { useDebounce } from "../hooks/useDebounce";
import {
  createApplication,
  getSkillMatch,
  isDuplicateApplication,
} from "../utils/application";

interface JobExplorerProps {
  kaptenSkills: string[];
  applications: Application[];
  onAdd: (application: Application) => void;
}

// Warna badge sesuai soal: hijau >= 70, kuning 40-69, merah < 40
function getMatchClass(score: number): string {
  if (score >= 70) return "badge badge-green";
  if (score >= 40) return "badge badge-yellow";
  return "badge badge-red";
}

export function JobExplorer({ kaptenSkills, applications, onAdd }: JobExplorerProps) {
  // State hasil fetch: data, loading, error
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [source, setSource] = useState<JobSource>("remotive");
  const [reloadKey, setReloadKey] = useState(0); // dinaikkan saat klik "Coba Lagi"

  // State filter
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("ALL");

  // Keyword yang baru "dipakai" setelah user berhenti mengetik 400ms
  const debouncedKeyword = useDebounce(keyword, 400);

  // Fetch ulang setiap kali sumber data berubah atau tombol Coba Lagi diklik
  useEffect(() => {
    const controller = new AbortController();

    async function loadJobs() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchJobs(source, controller.signal);
        setJobs(data);
      } catch (err) {
        // Request yang sengaja dibatalkan (cleanup) bukan error, abaikan
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
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

  const search = debouncedKeyword.trim().toLowerCase();

  // 1. filter keyword & kategori, 2. hitung skill match tiap lowongan, 3. urutkan match tertinggi
  // (.sort() aman di sini karena array-nya hasil baru dari .filter() dan .map(), bukan state)
  const visibleJobs = jobs
    .filter((job) => {
      const matchKeyword =
        job.title.toLowerCase().includes(search) ||
        job.company_name.toLowerCase().includes(search);
      const matchCategory = category === "ALL" || job.category === category;
      return matchKeyword && matchCategory;
    })
    .map((job) => ({ job, match: getSkillMatch(job.tags, kaptenSkills) }))
    .sort((a, b) => b.match.score - a.match.score);

  // Ubah lowongan jadi objek lamaran berstatus WISHLIST, lalu kirim ke App
  // (tidak mungkin duplikat, karena tombolnya sudah disabled kalau sudah dilamar)
  function handleSave(job: JobListing) {
    const newApplication = createApplication(applications, {
      company: job.company_name,
      role: job.title,
      status: "WISHLIST",
      requiredSkills: job.tags,
      workMode: guessWorkMode(job.candidate_required_location),
    });
    onAdd(newApplication);
  }

  return (
    <section className="panel">
      <div className="toolbar">
        <input
          className="grow"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Cari posisi atau perusahaan..."
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="ALL">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="row">
        <span className="muted">Sumber data:</span>
        <label>
          <input
            type="radio"
            checked={source === "remotive"}
            onChange={() => setSource("remotive")}
          />
          Remotive API (Live)
        </label>
        <label>
          <input
            type="radio"
            checked={source === "fallback"}
            onChange={() => setSource("fallback")}
          />
          Dataset Magang ID (Lokal)
        </label>
      </div>

      {isLoading && <p className="state-box">Memuat lowongan...</p>}

      {!isLoading && error && (
        <div className="state-box state-error">
          <p>Error: {error}</p>
          <div className="row">
            <button onClick={() => setReloadKey((k) => k + 1)}>Coba Lagi</button>
            {source === "remotive" && (
              <button onClick={() => setSource("fallback")}>Pakai Data Lokal</button>
            )}
          </div>
        </div>
      )}

      {!isLoading && !error && visibleJobs.length === 0 && (
        <p className="state-box">Tidak ada lowongan yang cocok.</p>
      )}

      {!isLoading && !error && visibleJobs.length > 0 && (
        <div className="grid">
          {visibleJobs.map(({ job, match }) => {
            const alreadySaved = isDuplicateApplication(
              applications,
              job.company_name,
              job.title,
            );

            return (
              <article key={job.id} className="card">
                <div className="card-head">
                  <div>
                    <strong>{job.company_name}</strong>
                    <p className="muted">{job.candidate_required_location}</p>
                  </div>
                  <span className={getMatchClass(match.score)}>{match.score}% Match</span>
                </div>

                <h3>{job.title}</h3>

                <div className="tags">
                  {match.matchedSkills.map((skill, i) => (
                    <span key={`ok-${skill}-${i}`} className="tag">
                      {skill}
                    </span>
                  ))}
                  {match.missingSkills.map((skill, i) => (
                    <span key={`miss-${skill}-${i}`} className="tag tag-missing">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="card-foot">
                  <span>{job.salary || "Gaji tidak dicantumkan"}</span>
                  <button disabled={alreadySaved} onClick={() => handleSave(job)}>
                    {alreadySaved ? "Sudah Dilamar" : "Simpan ke Wishlist"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}