import { useState } from 'react';
import { GridButton, GridTile } from '../components/seno/GridTile';
import { InterviewTimer } from '../components/seno/InterviewTimer';
import { Select } from '../components/seno/Select';
import { buildInterviewQuestions } from '../data/interviewQuestions';
import { WORK_MODES, type Application, type ApplicationStatus, type WorkMode } from '../types/application';
import {
  addApplicationNote,
  addChecklistItem,
  getAllowedTransitions,
  getChecklistProgress,
  removeChecklistItem,
  toggleChecklistItem,
  transitionApplication,
} from '../utils/stateMachine';
import { isAtRiskOfGhosting } from '../utils/ghosting';
import { formatLongDate } from '../utils/format';
import { formatRupiah } from '../utils/offerScore';

interface DetailPageProps {
  app: Application | undefined;
  kaptenSkills?: string[]; // untuk soal tentang skill yang belum dikuasai
  onUpdate: (next: Application) => void;
  onDelete: (id: string) => void;
  onSimulateGhosting: (id: string) => void;
  onBack: () => void;
}

const STAGES: ApplicationStatus[] = ['WISHLIST', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER'];
const title = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export function DetailPage({ app, kaptenSkills = [], onUpdate, onDelete, onSimulateGhosting, onBack }: DetailPageProps) {
  if (!app) {
    return (
      <GridTile c={6} r={1} w={8} h={2} label="Lamaran tidak ditemukan">
        <p className="v">Lamaran ini tidak ditemukan, mungkin sudah dihapus.</p>
        <button type="button" className="chip" onClick={onBack} style={{ alignSelf: 'flex-start' }}>
          <span className="chev">Kembali ke War Room</span>
        </button>
      </GridTile>
    );
  }
  // key: state form di-reset kalau pindah ke lamaran lain.
  return <Detail key={app.id} app={app} kaptenSkills={kaptenSkills} onUpdate={onUpdate} onDelete={onDelete} onSimulateGhosting={onSimulateGhosting} />;
}

function Detail({ app, kaptenSkills = [], onUpdate, onDelete, onSimulateGhosting }: Omit<DetailPageProps, 'app' | 'onBack'> & { app: Application }) {
  const allowed = getAllowedTransitions(app.status);
  const [target, setTarget] = useState<ApplicationStatus | null>(allowed[0] ?? null);
  const [salary, setSalary] = useState(app.salaryOffer ? String(app.salaryOffer) : '');
  const [mode, setMode] = useState<WorkMode>(app.workMode);
  const [interviewAt, setInterviewAt] = useState(app.interviewDateTime ?? '');
  const [cv, setCv] = useState(app.cvVersion ?? '');
  const [appliedDate, setAppliedDate] = useState(app.appliedDate ?? '');
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState('');
  const [note, setNote] = useState('');
  const [prepOpen, setPrepOpen] = useState(false); // panel Latihan Interview

  const progress = getChecklistProgress(app.checklist);
  const atRisk = isAtRiskOfGhosting(app);
  const stageIndex = STAGES.indexOf(app.status);

  // Semua perubahan lewat fungsi Al. Kalau validasi gagal, Al melempar Error
  // dan pesannya ditampilkan di tile (tidak ada data yang berubah).
  const run = (change: () => Application, after?: () => void) => {
    try {
      onUpdate(change());
      setError(null);
      after?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const confirmTransition = () => {
    if (!target) return;
    run(() =>
      transitionApplication(app, target, {
        ...(target === 'APPLIED' && { cvVersion: cv, appliedDate }),
        ...(target === 'INTERVIEW' && { interviewDateTime: interviewAt }),
        ...(target === 'OFFER' && { salaryOffer: Number(salary), workMode: mode }),
      }),
    );
  };

  return (
    <>
      <GridTile c={6} r={1} w={4} h={2} className="gt--top" label="Lamaran">
        <p className="h1" style={{ fontSize: 24 }}>{app.role}</p>
        <p className="h3" style={{ marginTop: 8 }}>{app.company}</p>
        <p className="xs" style={{ marginTop: 'auto' }}>{app.workMode}</p>
        <p className="xs">{app.cvVersion ? `CV: ${app.cvVersion}` : 'CV belum dipilih'}</p>
        {app.interviewDateTime && <p className="xs">Jadwal interview: {formatLongDate(app.interviewDateTime)}</p>}
        {app.status === 'OFFER' && app.salaryOffer ? <p className="xs">Uang saku: {formatRupiah(app.salaryOffer)}</p> : null}
      </GridTile>

      <GridTile c={10} r={1} w={2} hot label="Status">
        <span className="k">/ Status</span>
        <span className="h2">{title(app.status)}</span>
        {atRisk && <span className="xs" style={{ color: 'var(--red)' }}>Rawan ghosting</span>}
      </GridTile>

      <GridButton
        c={12}
        r={1}
        className="gt--center"
        onClick={() => onSimulateGhosting(app.id)}
        disabled={!(app.status === 'APPLIED' || app.status === 'SCREENING')}
      >
        <span className="xs chev">Simulasi +15 hari</span>
      </GridButton>

      <GridButton c={13} r={1} className="gt--center" onClick={() => onDelete(app.id)} ariaLabel={`Hapus lamaran ${app.company}`}>
        <span className="s chev">Hapus</span>
      </GridButton>

      <GridTile c={10} r={2} w={4} label="Tahap seleksi">
        <span className="s">/ Tahap seleksi</span>
        <span className="seg">
          {STAGES.map((s, i) => (
            <i key={s} className={i < stageIndex ? 'on' : i === stageIndex ? 'cur' : ''} />
          ))}
        </span>
        <span className="spread xs">
          {STAGES.map((s) => <span key={s}>{title(s)}</span>)}
        </span>
        {(app.status === 'REJECTED' || app.status === 'GHOSTED') && <span className="xs" style={{ color: 'var(--red)' }}>Berhenti di status {app.status}</span>}
      </GridTile>

      <GridTile c={6} r={3} w={4} className={error ? 'is-error' : ''} label="Pindah status">
        <div className="chips" style={{ alignItems: 'center' }}>
          <span className="xs">/ Pindah ke</span>
          {allowed.length === 0 && <span className="xs muted">Status akhir, tidak bisa dipindah.</span>}
          {allowed.map((s) => (
            <button
              key={s}
              type="button"
              className={`chip${target === s ? ' is-on' : ''}`}
              aria-pressed={target === s}
              onClick={() => { setTarget(s); setError(null); }}
            >
              {title(s)}
            </button>
          ))}
        </div>
        {error && <span className="err" role="alert">{error}</span>}
      </GridTile>

      {/* Isian yang dibutuhkan berbeda per status tujuan (aturan dari state machine Al). */}
      {target === 'OFFER' && (
        <>
          <GridTile c={10} r={3} w={2} label="Uang saku">
            <span className="k">&gt;/ Uang saku</span>
            <input className="field-input" inputMode="numeric" placeholder="5500000" value={salary} onChange={(e) => setSalary(e.target.value.replace(/\D/g, ''))} />
            {salary && <span className="xs muted">{formatRupiah(Number(salary))}</span>}
          </GridTile>
          <GridTile c={12} r={3} className="tight" label="Mode kerja">
            <span className="k">&gt;/ Mode</span>
            <Select<WorkMode> ariaLabel="Mode kerja" className="dot" value={mode} onChange={setMode} options={WORK_MODES.map((m) => ({ value: m, label: m }))} />
          </GridTile>
        </>
      )}
      {target === 'INTERVIEW' && (
        <GridTile c={10} r={3} w={3} label="Jadwal interview">
          <span className="k">&gt;/ Jadwal interview</span>
          <input className="field-input" type="datetime-local" value={interviewAt} onChange={(e) => setInterviewAt(e.target.value)} />
        </GridTile>
      )}
      {target === 'APPLIED' && (
        <>
          <GridTile c={10} r={3} w={2} label="Versi CV">
            <span className="k">&gt;/ Versi CV</span>
            <input className="field-input" placeholder="Kapten-CV-v2.pdf" value={cv} onChange={(e) => setCv(e.target.value)} />
          </GridTile>
          <GridTile c={12} r={3} className="tight" label="Tanggal melamar">
            <span className="k">&gt;/ Tanggal</span>
            <input className="field-input xs" type="date" value={appliedDate} onChange={(e) => setAppliedDate(e.target.value)} />
          </GridTile>
        </>
      )}
      {(target === 'REJECTED' || target === 'GHOSTED' || target === 'SCREENING') && (
        <GridTile c={10} r={3} w={3} label="Keterangan">
          <span className="xs muted">Tidak perlu isian tambahan untuk {title(target)}.</span>
        </GridTile>
      )}

      <GridButton c={13} r={3} className="gt--center" onClick={confirmTransition} disabled={!target}>
        <span className="xs chev">Konfirmasi</span>
      </GridButton>

      <GridTile c={1} r={4} w={5} h={4} className="gt--top" label="Daftar persiapan">
        <span className="s">
          {progress.total === 0 ? 'Belum ada tugas persiapan.' : `${progress.completed} dari ${progress.total} tugas persiapan selesai`}
        </span>
        <span className="seg" style={{ margin: '8px 0 6px' }}>
          {app.checklist.length === 0 ? <i /> : app.checklist.map((c) => <i key={c.id} className={c.done ? 'on' : ''} />)}
        </span>
        <div style={{ overflowY: 'auto' }}>
          {app.checklist.map((c) => (
            <label key={c.id} className={`check${c.done ? ' is-done' : ''}`}>
              <input type="checkbox" checked={c.done} onChange={() => run(() => toggleChecklistItem(app, c.id))} />
              <span>{c.text}</span>
              <button type="button" className="x" aria-label={`Hapus tugas ${c.text}`} onClick={() => run(() => removeChecklistItem(app, c.id))}>x</button>
            </label>
          ))}
        </div>
      </GridTile>

      <GridTile c={1} r={8} w={4} label="Tugas baru">
        <input
          className="field-input s"
          placeholder=">/ Tambah tugas persiapan baru..."
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && task.trim() && run(() => addChecklistItem(app, task), () => setTask(''))}
        />
      </GridTile>
      <GridButton c={5} r={8} className="gt--center" disabled={!task.trim()} onClick={() => run(() => addChecklistItem(app, task), () => setTask(''))}>
        <span className="s chev">Tambah</span>
      </GridButton>

      <GridTile c={6} r={4} w={4} h={505 / 105 + 5 / 105} className="gt--top" label="Riwayat aktivitas">
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, overflowY: 'auto', display: 'grid', gap: 16 }}>
          {app.activityLogs.length === 0 && <li className="s muted">Belum ada aktivitas.</li>}
          {[...app.activityLogs].reverse().map((log, i) => (
            <li key={log.id} style={{ display: 'grid', gridTemplateColumns: '14px 1fr', gap: 6 }}>
              <i style={{ width: 8, height: 8, marginTop: 4, background: i === 0 ? 'var(--amber)' : '#8b9cc0' }} />
              <span>
                <span className="xs" style={{ display: 'block' }}>{formatLongDate(log.timestamp)}</span>
                <span className="dot" style={{ fontSize: 14 }}>{log.message}</span>
              </span>
            </li>
          ))}
        </ol>
      </GridTile>

      <GridTile c={6} r={9} w={4} className="gt--row" label="Catatan">
        <label style={{ flex: 1 }}>
          <span className="k" style={{ display: 'block' }}>&gt;/ Catatan</span>
          <input
            className="field-input s"
            placeholder="Tulis catatan untuk riwayat..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && note.trim() && run(() => addApplicationNote(app, note), () => setNote(''))}
          />
        </label>
        <button type="button" className="chip is-on" disabled={!note.trim()} onClick={() => run(() => addApplicationNote(app, note), () => setNote(''))}>
          Simpan
        </button>
      </GridTile>

      {prepOpen ? (
        // Soal disesuaikan dengan posisi & skill yang diminta lowongan ini.
        <InterviewTimer questions={buildInterviewQuestions(app, kaptenSkills)} onClose={() => setPrepOpen(false)} />
      ) : (
        <GridButton c={10} r={4} w={4} className="gt--center" onClick={() => setPrepOpen(true)}>
          <span className="h2 chev">Buka latihan interview</span>
          <span className="xs">5 soal, timer 02:00 per soal</span>
        </GridButton>
      )}
    </>
  );
}
