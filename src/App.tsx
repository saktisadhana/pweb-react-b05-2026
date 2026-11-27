import { useEffect, useRef, useState } from 'react';
import { Stage } from './components/seno/Stage';
import { AddPopup, NotifPopup, UndoToast } from './components/seno/Popups';
import { WarRoomPage } from './pages/WarRoomPage';
import { DetailPage } from './pages/DetailPage';
import { OfferPage } from './pages/OfferPage';
import { ProfilPage, type JobSource } from './pages/ProfilPage';
import { AgendaPage } from './pages/AgendaPage';
import { ExplorePage } from './pages/ExplorePage';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useUndoDelete } from './hooks/useUndoDelete';
import { ageApplicationForGhosting, isAtRiskOfGhosting } from './utils/ghosting';
import { findInterviewConflicts } from './utils/interviewConflict';
import { SAMPLE_APPLICATIONS, SAMPLE_SKILLS } from './data/sampleApplications';
import type { Application } from './types/application';
import type { Page, TileDef } from './data/figmaTiles';

type Popup = 'add' | 'notif' | null;

export default function App() {
  const [applications, setApplications] = useLocalStorage<Application[]>('applications', SAMPLE_APPLICATIONS);
  const [kaptenSkills, setKaptenSkills] = useLocalStorage<string[]>('kaptenSkills', SAMPLE_SKILLS);
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  const [jobSource, setJobSource] = useLocalStorage<JobSource>('jobSource', 'remotive');
  const [history, setHistory] = useState<Page[]>(['warroom']);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [popup, setPopup] = useState<Popup>(null);
  const [focusSearch, setFocusSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { pendingDeletion, deleteItem, undoDelete } = useUndoDelete(applications, setApplications);

  const page = history[history.length - 1];
  const notifCount = findInterviewConflicts(applications, 60).length + applications.filter((a) => isAtRiskOfGhosting(a)).length;

  const navigate = (next: Page) => {
    setPopup(null);
    setHistory((h) => (h[h.length - 1] === next ? h : [...h.slice(-19), next]));
  };
  const back = () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));

  const openDetail = (id: string) => {
    setSelectedId(id);
    navigate('detail');
  };

  const updateApp = (next: Application) =>
    setApplications((prev) => prev.map((a) => (a.id === next.id ? next : a)));

  // Logic Al: mundurkan lastUpdatedAt 15 hari (immutable, map mengembalikan array baru).
  const simulateGhosting = (id: string) =>
    setApplications((prev) => prev.map((a) => (a.id === id ? ageApplicationForGhosting(a, 15) : a)));

  const remove = (id: string) => {
    deleteItem(id);
    if (page === 'detail') navigate('warroom');
  };

  const onTileAction = (tile: TileDef) => {
    const action = tile.action;
    if (!action) return;
    if (action.type === 'nav') navigate(action.page);
    else if (action.type === 'back') back();
    else setPopup((p) => (p === 'notif' ? null : 'notif'));
  };

  // Tema disimpan di localStorage, dipasang ke <html data-theme>.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Shortcut "/" -> pindah ke War Room lalu fokus ke kolom cari.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest('input, textarea, select');
      if (e.key !== '/' || typing) return;
      e.preventDefault();
      navigate('warroom');
      setFocusSearch(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (!focusSearch || page !== 'warroom') return;
    searchRef.current?.focus();
    setFocusSearch(false);
  }, [focusSearch, page]);

  let overlay = null;
  if (popup === 'add') {
    overlay = (
      <AddPopup
        applications={applications}
        onClose={() => setPopup(null)}
        onAdd={(app) => {
          setApplications((prev) => [app, ...prev]);
          setPopup(null);
        }}
      />
    );
  } else if (popup === 'notif') {
    overlay = <NotifPopup applications={applications} onOpenDetail={openDetail} onClose={() => setPopup(null)} />;
  }

  return (
    <Stage
      page={page}
      notifCount={notifCount}
      onTileAction={onTileAction}
      onLogo={() => navigate('explore')}
      overlay={
        <>
          {overlay}
          {pendingDeletion && (
            <UndoToast key={pendingDeletion.item.id} company={pendingDeletion.item.company} onUndo={undoDelete} />
          )}
        </>
      }
    >
      {page === 'warroom' && (
        <WarRoomPage
          applications={applications}
          kaptenSkills={kaptenSkills}
          onOpenDetail={openDetail}
          onDelete={remove}
          onSimulateGhosting={simulateGhosting}
          onAdd={() => setPopup('add')}
          onOpenAgenda={() => navigate('agenda')}
          searchRef={searchRef}
        />
      )}
      {page === 'detail' && (
        <DetailPage
          app={applications.find((a) => a.id === selectedId)}
          onUpdate={updateApp}
          onDelete={remove}
          onSimulateGhosting={simulateGhosting}
          onBack={() => navigate('warroom')}
        />
      )}
      {page === 'offer' && <OfferPage applications={applications} kaptenSkills={kaptenSkills} />}
      {page === 'agenda' && <AgendaPage applications={applications} onOpenDetail={openDetail} />}
      {page === 'explore' && <ExplorePage kaptenSkills={kaptenSkills} />}
      {page === 'profil' && (
        <ProfilPage
          kaptenSkills={kaptenSkills}
          setKaptenSkills={setKaptenSkills}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          jobSource={jobSource}
          setJobSource={setJobSource}
          applications={applications}
          onImport={(apps, skills) => {
            setApplications(apps);
            setKaptenSkills(skills);
          }}
          onReset={() => {
            setApplications([]);
            setKaptenSkills(SAMPLE_SKILLS);
          }}
        />
      )}
    </Stage>
  );
}
