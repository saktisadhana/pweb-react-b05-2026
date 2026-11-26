// CATATAN: App.tsx ini versi SEMENTARA dari Marvel supaya project bisa jalan & dites.
// Sakti silakan ganti layout, sidebar, dashboard, dsb. Yang penting state & fungsi di bawah dipertahankan.
import { useState } from "react";
import type { Application } from "./types/application";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { SkillProfile } from "./components/SkillProfile";
import { JobExplorer } from "./components/JobExplorer";
import { ApplicationForm } from "./components/ApplicationForm";
import { WarRoom } from "./components/WarRoom";
import { findInterviewConflicts } from "./utils/interviewConflict";

type Page = "explore" | "pipeline";

export default function App() {
  // State utama, otomatis tersimpan ke localStorage (hook buatan Al)
  const [applications, setApplications] = useLocalStorage<Application[]>(
    "applications",
    [],
  );
  const [kaptenSkills, setKaptenSkills] = useLocalStorage<string[]>("kaptenSkills", [
    "React",
    "TypeScript",
    "CSS",
  ]);

  const [page, setPage] = useState<Page>("explore");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Tambah lamaran baru (dipakai Form manual & tombol Simpan ke Wishlist)
  function handleAdd(newApplication: Application) {
    setApplications([...applications, newApplication]);
  }

  // Ganti 1 lamaran dengan versi barunya (dipakai Simulasi +15 Hari, Detail, dll)
  function handleUpdate(updated: Application) {
    setApplications(
      applications.map((app) => (app.id === updated.id ? updated : app)),
    );
  }

  const selected = applications.find((app) => app.id === selectedId);

  // Derived state: cek bentrok dari SELURUH applications (bukan yang ter-filter),
  // ditaruh di App supaya banner tampil di semua halaman
  const conflicts = findInterviewConflicts(applications);

  return (
    <div className="app">
      <header className="topbar">
        <h1>Aku Mw Magang</h1>
        <nav className="row">
          <button
            className={page === "explore" ? "" : "btn-outline"}
            onClick={() => setPage("explore")}
          >
            Eksplorasi Lowongan
          </button>
          <button
            className={page === "pipeline" ? "" : "btn-outline"}
            onClick={() => setPage("pipeline")}
          >
            Pipeline Lamaran ({applications.length})
          </button>
        </nav>
      </header>

      {conflicts.length > 0 && (
        <div className="banner-danger">
          <strong>Jadwal Interview Bentrok!</strong>
          {conflicts.map((c) => (
            <p key={c.firstApplication.id + c.secondApplication.id}>
              {c.firstApplication.company} ({c.firstApplication.interviewDateTime?.replace("T", " ")})
              {" dan "}
              {c.secondApplication.company} ({c.secondApplication.interviewDateTime?.replace("T", " ")})
              {" berselisih "}
              {c.differenceMinutes} menit.
            </p>
          ))}
        </div>
      )}

      {page === "explore" && (
        <main className="layout">
          <SkillProfile skills={kaptenSkills} onChange={setKaptenSkills} />
          <JobExplorer
            kaptenSkills={kaptenSkills}
            applications={applications}
            onAdd={handleAdd}
          />
        </main>
      )}

      {page === "pipeline" && (
        <main className="layout">
          <ApplicationForm applications={applications} onAdd={handleAdd} />
          <div>
            <WarRoom
              applications={applications}
              kaptenSkills={kaptenSkills}
              onUpdate={handleUpdate}
              onOpenDetail={setSelectedId}
            />
            {selected && (
              <section className="panel">
                <h2>
                  Detail: {selected.role} - {selected.company}
                </h2>
                <p className="muted">Komponen ApplicationDetail (bagian Al) dipasang di sini.</p>
                <button onClick={() => setSelectedId(null)}>Tutup</button>
              </section>
            )}
          </div>
        </main>
      )}
    </div>
  );
}