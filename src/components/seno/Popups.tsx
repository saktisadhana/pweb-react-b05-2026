import { useEffect, useState } from 'react';
import { GridButton, GridTile } from './GridTile';
import { WORK_MODES, type Application, type InitialApplicationStatus, type WorkMode } from '../../types/application';
import { createApplication } from '../../utils/application';
import { findInterviewConflicts } from '../../utils/interviewConflict';
import { isAtRiskOfGhosting } from '../../utils/ghosting';
import { formatShortDate } from '../../utils/format';

// Popup dibangun dari tile grid juga (sesuai frame popup di Figma), di atas lapisan blur.
function Scrim({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return <div className="scrim" onClick={onClose} aria-hidden="true" />;
}

interface AddPopupProps {
  applications: Application[];
  onAdd: (app: Application) => void;
  onClose: () => void;
}

export function AddPopup({ applications, onAdd, onClose }: AddPopupProps) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<InitialApplicationStatus>('WISHLIST');
  const [workMode, setWorkMode] = useState<WorkMode>('Remote');
  const [skills, setSkills] = useState('');
  const [cv, setCv] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    try {
      // Validasi (wajib isi, duplikat, CV + tanggal untuk APPLIED) ada di createApplication milik Al.
      const app = createApplication(applications, {
        company,
        role,
        status,
        workMode,
        requiredSkills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        ...(status === 'APPLIED' && { cvVersion: cv, appliedDate: date }),
      });
      onAdd(app);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const errClass = error ? ' is-error' : '';

  return (
    <>
      <Scrim onClose={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Tambah lamaran">
        <GridTile c={5} r={2} w={5} className="popup" label="Judul">
          <span className="h1">/ Tambah lamaran</span>
        </GridTile>
        <GridButton c={10} r={2} className="popup gt--center" onClick={onClose} ariaLabel="Tutup">
          <span className="s chev">Tutup</span>
        </GridButton>

        <GridTile c={5} r={3} w={3} className={`popup${errClass}`} label="Perusahaan">
          <span className="k">&gt;/ Perusahaan</span>
          <input autoFocus className="field-input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Garuda FinTech" />
        </GridTile>
        <GridTile c={8} r={3} w={3} className={`popup${errClass}`} label="Posisi">
          <span className="k">&gt;/ Posisi</span>
          <input className="field-input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Frontend Intern" />
        </GridTile>

        <GridTile c={5} r={4} w={3} className="popup" label="Status awal">
          <span className="k">/ Status awal</span>
          <div className="chips">
            {(['WISHLIST', 'APPLIED'] as const).map((s) => (
              <button key={s} type="button" className={`chip${status === s ? ' is-on' : ''}`} aria-pressed={status === s} onClick={() => setStatus(s)}>
                {s}
              </button>
            ))}
          </div>
        </GridTile>
        <GridTile c={8} r={4} w={3} className="popup" label="Mode kerja">
          <span className="k">&gt;/ Mode kerja</span>
          <span className="select-wrap">
            <select value={workMode} onChange={(e) => setWorkMode(e.target.value as WorkMode)}>
              {WORK_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </span>
        </GridTile>

        <GridTile c={5} r={5} w={6} className="popup" label="Skill yang dibutuhkan">
          <span className="k">&gt;/ Skill yang dibutuhkan (pisahkan dengan koma)</span>
          <input className="field-input" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, Git" />
        </GridTile>

        {status === 'APPLIED' && (
          <>
            <GridTile c={5} r={6} w={3} className={`popup${errClass}`} label="Versi CV">
              <span className="k">&gt;/ Versi CV</span>
              <input className="field-input" value={cv} onChange={(e) => setCv(e.target.value)} placeholder="Kapten-CV-v2.pdf" />
            </GridTile>
            <GridTile c={8} r={6} w={3} className={`popup${errClass}`} label="Tanggal melamar">
              <span className="k">&gt;/ Tanggal melamar</span>
              <input className="field-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </GridTile>
          </>
        )}

        <GridTile c={5} r={status === 'APPLIED' ? 7 : 6} w={4} className="popup" label="Pesan">
          {error ? <span className="err" role="alert">{error}</span> : <span className="xs muted">Lamaran baru langsung masuk ke War Room.</span>}
        </GridTile>
        <GridButton c={9} r={status === 'APPLIED' ? 7 : 6} w={2} className="popup gt--center gt--navy" onClick={save}>
          <span className="h3 chev">Simpan</span>
        </GridButton>
      </div>
    </>
  );
}

interface NotifPopupProps {
  applications: Application[];
  onOpenDetail: (id: string) => void;
  onClose: () => void;
}

// Daftar notifikasi dari tile "!": jadwal bentrok + lamaran rawan ghosting.
export function NotifPopup({ applications, onOpenDetail, onClose }: NotifPopupProps) {
  const conflicts = findInterviewConflicts(applications, 60);
  const ghosting = applications.filter((a) => isAtRiskOfGhosting(a));
  const items = [
    ...conflicts.map((c) => ({
      id: `c-${c.firstApplication.id}-${c.secondApplication.id}`,
      title: '/ Jadwal interview bentrok',
      text: `${c.firstApplication.company} (${formatShortDate(c.firstApplication.interviewDateTime ?? '')}) dan ${c.secondApplication.company}, selisih ${c.differenceMinutes} menit.`,
      appId: c.secondApplication.id,
      hot: true,
    })),
    ...ghosting.map((a) => ({
      id: `g-${a.id}`,
      title: `/ ${a.company} rawan ghosting`,
      text: `Status ${a.status}, lebih dari 14 hari tanpa kabar. Coba kirim follow-up.`,
      appId: a.id,
      hot: false,
    })),
  ];

  return (
    <>
      <Scrim onClose={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Notifikasi">
        <GridTile c={6} r={1} w={7} className="popup" label="Notifikasi">
          <span className="h1">/ Notifikasi ({items.length})</span>
        </GridTile>
        <GridButton c={13} r={1} className="popup gt--center" onClick={onClose} ariaLabel="Tutup">
          <span className="s chev">Tutup</span>
        </GridButton>
        {items.length === 0 && (
          <GridTile c={6} r={2} w={8} className="popup" label="Kosong">
            <span className="s muted">Tidak ada notifikasi. Semua aman.</span>
          </GridTile>
        )}
        {items.slice(0, 7).map((n, i) => (
          <GridButton key={n.id} c={6} r={2 + i} w={8} hot={n.hot} className="popup" onClick={() => onOpenDetail(n.appId)}>
            <span className="h3">{n.title}</span>
            <span className="xs">{n.text}</span>
          </GridButton>
        ))}
      </div>
    </>
  );
}

interface UndoToastProps {
  company: string;
  onUndo: () => void;
}

// Fitur 6 (Sakti): toast undo 5 detik. Timer-nya ada di useUndoDelete (Al).
// Bar kuning di bawah menyusut 5 detik sebagai penanda waktu.
export function UndoToast({ company, onUndo }: UndoToastProps) {
  return (
    <GridTile c={6} r={10} w={8} hot className="toast gt--row" label="Lamaran dihapus">
      <span className="s" role="status">/ Lamaran {company} telah dihapus.</span>
      <button type="button" className="chip is-on" onClick={onUndo}>Undo</button>
      <i className="timebar" aria-hidden="true" />
    </GridTile>
  );
}
