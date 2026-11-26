import { useState } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import type { Page } from './components/layout/Sidebar';
import { StatsCards } from './components/dashboard/StatsCards';
import { OfferComparator } from './components/offer/OfferComparator';
import { InterviewTimer } from './components/interview/InterviewTimer';
import { UndoToast } from './components/common/UndoToast';
import { ConflictBanner } from './components/common/ConflictBanner';
import { Modal } from './components/common/Modal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useUndoDelete } from './hooks/useUndoDelete';
import { computeDashboardStats } from './utils/dashboardStats';
import { ageApplicationForGhosting, isAtRiskOfGhosting } from './utils/ghosting';
import { SAMPLE_APPLICATIONS } from './data/sampleApplications';
import type { Application } from './types/application';

export default function App() {
  const [applications, setApplications] = useLocalStorage<Application[]>('applications', SAMPLE_APPLICATIONS);
  const [kaptenSkills] = useLocalStorage<string[]>('kaptenSkills', ['React', 'TypeScript', 'CSS', 'Git', 'REST API']);
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  const [page, setPage] = useState<Page>('warroom');
  const [prepForId, setPrepForId] = useState<string | null>(null);
  const { pendingDeletion, deleteItem, undoDelete } = useUndoDelete(applications, setApplications);

  const ghostingCount = computeDashboardStats(applications).ghostingRisk;
  const prepFor = applications.find((a) => a.id === prepForId) ?? null;

  // Logic Al: mundurkan lastUpdatedAt 15 hari (immutable, map mengembalikan array baru).
  const simulateGhosting = (id: string) =>
    setApplications((prev) => prev.map((a) => (a.id === id ? ageApplicationForGhosting(a, 15) : a)));

  return (
    <AppLayout
      page={page}
      onNavigate={setPage}
      theme={theme}
      onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      ghostingCount={ghostingCount}
      banner={<ConflictBanner applications={applications} />}
      toast={pendingDeletion && (
        <UndoToast
          key={pendingDeletion.item.id}
          message={`Lamaran ${pendingDeletion.item.company} dihapus.`}
          onUndo={undoDelete}
        />
      )}
    >
      {page === 'explore' && (
        <section className="tile empty">
          <h2 className="h-dot">/ Eksplorasi Lowongan</h2>
          <p>Tempat komponen Profil Skill dan Job Explorer (Marvel).</p>
        </section>
      )}

      {page === 'warroom' && (
        <>
          <StatsCards applications={applications} />
          {/* Daftar sementara. Ganti dengan War Room Pipeline + Detail Lamaran (Marvel). */}
          <ul className="app-list">
            {applications.map((a) => (
              <li key={a.id} className="tile app-list__row">
                <div>
                  <strong className="h-dot">{a.company}</strong>
                  <span className="muted">{a.role} / {a.status}</span>
                  {isAtRiskOfGhosting(a) && <span className="badge--ghost">Rawan ghosting</span>}
                </div>
                {(a.status === 'APPLIED' || a.status === 'SCREENING') && (
                  <button type="button" className="btn btn--ghost" onClick={() => simulateGhosting(a.id)}>&gt; Simulasi +15 hari</button>
                )}
                <button type="button" className="btn btn--ghost" onClick={() => setPrepForId(a.id)}>&gt; Latihan interview</button>
                <button type="button" className="btn btn--ghost" onClick={() => deleteItem(a.id)}>&gt; Hapus</button>
              </li>
            ))}
          </ul>
        </>
      )}

      {page === 'offer' && <OfferComparator applications={applications} kaptenSkills={kaptenSkills} />}

      {prepFor && (
        <Modal title={prepFor.company} onClose={() => setPrepForId(null)}>
          <InterviewTimer />
        </Modal>
      )}
    </AppLayout>
  );
}
