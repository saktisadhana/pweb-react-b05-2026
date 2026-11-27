import { useCallback, useEffect, useRef, useState } from 'react';
import { Stage } from './components/seno/Stage';
import { NotifPopup, UndoToast } from './components/seno/Popups';
import { ApplicationForm } from './components/ApplicationForm';
import { WarRoomPage } from './pages/WarRoomPage';
import { DetailPage } from './pages/DetailPage';
import { OfferPage } from './pages/OfferPage';
import { ProfilPage } from './pages/ProfilPage';
import type { JobSource } from './services/jobService';
import { AgendaPage } from './pages/AgendaPage';
import { ExplorePage } from './pages/ExplorePage';
import { LoginPage } from './pages/LoginPage';
import { useAuth } from './hooks/useAuth';
import type { User } from './utils/auth';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useUndoDelete } from './hooks/useUndoDelete';
import { ageApplicationForGhosting, isAtRiskOfGhosting } from './utils/ghosting';
import { findInterviewConflicts } from './utils/interviewConflict';
import { DEFAULT_SKILLS, SAMPLE_APPLICATIONS, SAMPLE_SKILLS } from './data/sampleApplications';
import type { Application } from './types/application';
import type { Page, TileDef } from './data/figmaTiles';

type Popup = 'add' | 'notif' | null;

type Theme = 'light' | 'dark';

// Gerbang login: belum masuk -> LoginPage, sudah masuk -> Workspace.
export default function App() {
  const auth = useAuth();
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'light');

  // Tema disimpan di localStorage, dipasang ke <html data-theme> (juga di layar login).
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  if (!auth.user) {
    return <LoginPage onLogin={auth.login} onRegister={auth.register} onGuest={auth.loginAsGuest} />;
  }

  // key: ganti akun = Workspace dipasang ulang, jadi semua state dibaca ulang dari data akun itu.
  return <Workspace key={auth.user.username} user={auth.user} theme={theme} setTheme={setTheme} onLogout={auth.logout} />;
}

interface WorkspaceProps {
  user: User;
  theme: Theme;
  setTheme: (update: (t: Theme) => Theme) => void;
  onLogout: () => void;
}

function Workspace({ user, theme, setTheme, onLogout }: WorkspaceProps) {
  // Data tiap akun disimpan terpisah, misalnya "sakti:applications".
  // Mode demo (tamu) mulai dengan data contoh, akun baru mulai kosong.
  const ns = (key: string) => `${user.username}:${key}`;
  const [applications, setApplications] = useLocalStorage<Application[]>(ns('applications'), user.guest ? SAMPLE_APPLICATIONS : []);
  // Soal: default awal minimal 3 skill (React, TypeScript, CSS).
  const [kaptenSkills, setKaptenSkills] = useLocalStorage<string[]>(ns('kaptenSkills'), user.guest ? SAMPLE_SKILLS : DEFAULT_SKILLS);
  // Sumber lowongan dipakai bersama oleh Eksplorasi dan Profil.
  const [storedSource, setJobSource] = useLocalStorage<JobSource>(ns('jobSource'), 'remotive');
  const jobSource: JobSource = storedSource === 'fallback' ? 'fallback' : 'remotive';
  const [history, setHistory] = useState<Page[]>(['warroom']);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [popup, setPopup] = useState<Popup>(null);
  // Halaman daftar (pagination) disimpan per layar, misal War Room halaman 2, Eksplorasi halaman 3.
  const [listPages, setListPages] = useState<Partial<Record<Page, number>>>({});
  const [pageCount, setPageCount] = useState(1);
  const searchRef = useRef<HTMLInputElement>(null);
  const { pendingDeletion, deleteItem, undoDelete } = useUndoDelete(applications, setApplications);

  const page = history[history.length - 1];
  const listPage = Math.min(listPages[page] ?? 0, pageCount - 1);
  const setListPage = useCallback(
    (index: number) => setListPages((m) => ({ ...m, [history[history.length - 1]]: Math.max(0, index) })),
    [history],
  );
  const hasPager = page === 'warroom' || page === 'explore';
  const notifCount = findInterviewConflicts(applications, 60).length + applications.filter((a) => isAtRiskOfGhosting(a)).length;

  // useCallback: fungsi tetap sama antar render, jadi TileField (memo) tidak ikut render ulang.
  const navigate = useCallback((next: Page) => {
    setPopup(null);
    setHistory((h) => (h[h.length - 1] === next ? h : [...h.slice(-19), next]));
  }, []);
  const back = useCallback(() => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h)), []);

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

  const onTileAction = useCallback(
    (tile: TileDef) => {
      const action = tile.action;
      if (!action) return;
      if (action.type === 'nav') navigate(action.page);
      else if (action.type === 'back') back();
      else if (action.type === 'listPage') setListPage(action.index);
      else if (action.type === 'pageStep') setListPage(Math.min(pageCount - 1, listPage + action.delta));
      else setPopup((p) => (p === 'notif' ? null : 'notif'));
    },
    [navigate, back, setListPage, pageCount, listPage],
  );
  const goExplore = useCallback(() => navigate('explore'), [navigate]);

  // Shortcut "/" -> pindah ke War Room lalu fokus ke kolom cari.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest('input, textarea, select');
      if (e.key !== '/' || typing) return;
      e.preventDefault();
      navigate('warroom');
      // Tunggu War Room selesai dirender, lalu fokus ke kolom cari lewat useRef.
      requestAnimationFrame(() => requestAnimationFrame(() => searchRef.current?.focus()));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  let overlay = null;
  if (popup === 'add') {
    overlay = (
      <ApplicationForm
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
      onLogo={goExplore}
      pager={hasPager ? { count: pageCount, current: listPage } : undefined}
      paused={popup !== null}
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
          onExplore={goExplore}
          onLoadSample={() => setApplications(SAMPLE_APPLICATIONS)}
          onOpenAgenda={() => navigate('agenda')}
          searchRef={searchRef}
          listPage={listPage}
          onListPage={setListPage}
          onPageCount={setPageCount}
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
      {page === 'explore' && (
        <ExplorePage
          kaptenSkills={kaptenSkills}
          setKaptenSkills={setKaptenSkills}
          applications={applications}
          onAdd={(app) => setApplications((prev) => [app, ...prev])}
          source={jobSource}
          onSourceChange={setJobSource}
          listPage={listPage}
          onListPage={setListPage}
          onPageCount={setPageCount}
        />
      )}
      {page === 'profil' && (
        <ProfilPage
          user={user}
          onLogout={onLogout}
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
