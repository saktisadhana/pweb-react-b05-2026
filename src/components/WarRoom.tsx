import { useState } from "react";
import {
  APPLICATION_STATUSES,
  type Application,
  type ApplicationStatus,
} from "../types/application";
import { getSkillMatch } from "../utils/application";
import { ageApplicationForGhosting, isAtRiskOfGhosting } from "../utils/ghosting";
import { getChecklistProgress } from "../utils/stateMachine";

interface WarRoomProps {
  applications: Application[];
  kaptenSkills: string[];
  onUpdate: (application: Application) => void;
  onOpenDetail: (id: string) => void;
}

type SortOption = "newest" | "interview" | "offer";

// "2026-11-30T10:00" -> "2026-11-30 10:00"
function formatDateTime(value: string): string {
  return value.replace("T", " ");
}

export function WarRoom({
  applications,
  kaptenSkills,
  onUpdate,
  onOpenDetail,
}: WarRoomProps) {
  // State filter: ini satu-satunya yang disimpan di useState
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "ALL">("ALL");
  const [onlyGhosting, setOnlyGhosting] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // ===== Derived state: semua di bawah dihitung ulang setiap render =====

  const search = keyword.trim().toLowerCase();

  const filtered = applications.filter((app) => {
    const matchKeyword =
      app.company.toLowerCase().includes(search) ||
      app.role.toLowerCase().includes(search);
    const matchStatus = statusFilter === "ALL" || app.status === statusFilter;
    const matchGhosting = !onlyGhosting || isAtRiskOfGhosting(app);
    return matchKeyword && matchStatus && matchGhosting;
  });

  // Salin dulu dengan [...] sebelum sort, karena .sort() mengubah array aslinya
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "interview") {
      // Yang punya jadwal interview di atas, urut dari yang paling dekat
      if (!a.interviewDateTime && !b.interviewDateTime) return 0;
      if (!a.interviewDateTime) return 1;
      if (!b.interviewDateTime) return -1;
      return Date.parse(a.interviewDateTime) - Date.parse(b.interviewDateTime);
    }
    if (sortBy === "offer") {
      return (b.salaryOffer ?? 0) - (a.salaryOffer ?? 0);
    }
    // "newest": yang paling baru di-update di atas
    return Date.parse(b.lastUpdatedAt) - Date.parse(a.lastUpdatedAt);
  });

  return (
    <section className="panel">
      <h2>War Room Lamaran ({applications.length})</h2>

      <div className="toolbar">
        <input
          className="grow"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Cari perusahaan atau posisi..."
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | "ALL")}
        >
          <option value="ALL">Semua Status</option>
          {APPLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
        >
          <option value="newest">Terbaru</option>
          <option value="interview">Jadwal Interview Terdekat</option>
          <option value="offer">Offer Tertinggi</option>
        </select>
        <label className="row">
          <input
            type="checkbox"
            checked={onlyGhosting}
            onChange={(e) => setOnlyGhosting(e.target.checked)}
          />
          Hanya Rawan Ghosting
        </label>
      </div>

      {applications.length === 0 && (
        <p className="state-box">
          Belum ada lamaran. Simpan dari Eksplorasi Lowongan atau catat manual.
        </p>
      )}
      {applications.length > 0 && sorted.length === 0 && (
        <p className="state-box">Tidak ada lamaran yang cocok dengan filter.</p>
      )}

      <div className="list">
        {sorted.map((app) => {
          const progress = getChecklistProgress(app.checklist);
          const match = getSkillMatch(app.requiredSkills, kaptenSkills);
          const ghosting = isAtRiskOfGhosting(app);
          const canSimulate = app.status === "APPLIED" || app.status === "SCREENING";

          return (
            <article key={app.id} className="card">
              <div className="card-head">
                <div>
                  <strong>{app.company}</strong>
                  <p>{app.role}</p>
                </div>
                <div className="tags">
                  <span className="badge">{app.status}</span>
                  {ghosting && <span className="badge badge-red">Rawan Ghosting</span>}
                </div>
              </div>

              <p className="muted">
                {app.workMode} • CV: {app.cvVersion || "-"} • Checklist:{" "}
                {progress.completed}/{progress.total} • Skill Match: {match.score}%
                {app.interviewDateTime &&
                  ` • Interview: ${formatDateTime(app.interviewDateTime)}`}
                {app.salaryOffer !== undefined &&
                  ` • Offer: Rp ${app.salaryOffer}`}
              </p>

              <div className="row">
                <button onClick={() => onOpenDetail(app.id)}>Detail</button>
                {canSimulate && (
                  <button
                    className="btn-outline"
                    onClick={() => onUpdate(ageApplicationForGhosting(app))}
                  >
                    Simulasi +15 Hari
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}