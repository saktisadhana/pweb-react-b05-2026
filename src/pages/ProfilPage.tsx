import { useRef, useState } from 'react';
import { GridButton, GridTile } from '../components/seno/GridTile';
import { addCaptainSkill, removeCaptainSkill } from '../utils/application';
import type { Application } from '../types/application';
import type { User } from '../utils/auth';

import type { JobSource } from '../services/jobService';
const MIN_SKILLS = 3;

interface ProfilPageProps {
  user: User;
  onLogout: () => void;
  kaptenSkills: string[];
  setKaptenSkills: (skills: string[]) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  jobSource: JobSource;
  setJobSource: (s: JobSource) => void;
  applications: Application[];
  onImport: (apps: Application[], skills: string[]) => void;
  onReset: () => void;
}

// Bonus: halaman profil Kapten (skill, mode gelap, backup data). Layout dari frame "Profil" di Figma.
export function ProfilPage(p: ProfilPageProps) {
  const [skill, setSkill] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const add = () => {
    try {
      p.setKaptenSkills(addCaptainSkill(p.kaptenSkills, skill));
      setSkill('');
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const remove = (s: string) => {
    if (p.kaptenSkills.length <= MIN_SKILLS) {
      setError(`Minimal ${MIN_SKILLS} skill supaya Match Score tetap berarti.`);
      return;
    }
    p.setKaptenSkills(removeCaptainSkill(p.kaptenSkills, s));
    setError(null);
  };

  const exportJson = () => {
    const data = JSON.stringify({ applications: p.applications, kaptenSkills: p.kaptenSkills }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aku-mw-magang-backup.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    try {
      const data: unknown = JSON.parse(await file.text());
      if (
        typeof data !== 'object' || data === null ||
        !Array.isArray((data as { applications?: unknown }).applications) ||
        !Array.isArray((data as { kaptenSkills?: unknown }).kaptenSkills)
      ) {
        throw new Error('Format file tidak dikenali.');
      }
      const { applications, kaptenSkills } = data as { applications: Application[]; kaptenSkills: string[] };
      p.onImport(applications, kaptenSkills);
      setImportMsg(`${applications.length} lamaran dipulihkan.`);
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : 'File tidak bisa dibaca.');
    }
  };

  return (
    <>
      <GridTile c={6} r={1} w={4} h={2} label="Akun">
        <span className="h1">{p.user.name}</span>
        <span className="s">{p.user.guest ? 'Mode demo, data contoh hanya di browser ini' : `@${p.user.username}`}</span>
        <button type="button" className="chip is-on" style={{ alignSelf: 'flex-start', marginTop: 10 }} onClick={p.onLogout}>
          {p.user.guest ? 'Keluar dari demo' : 'Keluar'}
        </button>
      </GridTile>

      <GridTile c={10} r={1} w={4} className="gt--row" label="Mode gelap">
        <span className="s">/ Mode gelap</span>
        <button type="button" role="switch" className="switch" aria-checked={p.theme === 'dark'} aria-label="Mode gelap" onClick={p.onToggleTheme} />
      </GridTile>

      <GridTile c={10} r={2} w={4} label="Shortcut keyboard">
        <span className="s">/ Shortcut keyboard</span>
        <span className="xs"><kbd className="chip" style={{ padding: '2px 7px', marginRight: 8 }}>/</kbd>fokus ke kolom pencarian War Room</span>
      </GridTile>

      <GridTile c={6} r={3} w={8} label="Profil skill">
        <span className="v">Skill di bawah dipakai untuk menghitung Match Score setiap lamaran.</span>
      </GridTile>

      <GridTile c={6} r={4} w={4} className={error ? 'is-error' : ''} label="Tambah skill">
        <span className="k">&gt;/ Tambah skill</span>
        <input
          className="field-input"
          placeholder="contoh: Tailwind"
          value={skill}
          onChange={(e) => { setSkill(e.target.value); setError(null); }}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        {error && <span className="err" role="alert">{error}</span>}
      </GridTile>

      <GridButton c={10} r={4} className="gt--center gt--navy" onClick={add}>
        <span className="xs chev">Tambah</span>
      </GridButton>

      <GridTile c={11} r={4} w={3} label="Jumlah skill">
        <span className="h2">{p.kaptenSkills.length} skill</span>
        <span className="xs">{p.kaptenSkills.length < MIN_SKILLS ? `/ tambah minimal ${MIN_SKILLS} skill` : `/ minimal ${MIN_SKILLS}`}</span>
      </GridTile>

      <GridTile c={6} r={5} w={8} h={2} className="gt--top" label="Daftar skill">
        <div className="chips">
          {p.kaptenSkills.length === 0 && <span className="s muted">Belum ada skill. Tambahkan skill yang kamu kuasai untuk menghitung Match Score.</span>}
          {p.kaptenSkills.map((s) => (
            <span key={s} className="chip" style={{ cursor: 'default' }}>
              {s}
              <button type="button" className="x" aria-label={`Hapus skill ${s}`} onClick={() => remove(s)}>x</button>
            </span>
          ))}
        </div>
      </GridTile>

      <GridTile c={6} r={7} w={8} label="Backup data">
        <span className="v">{importMsg ?? 'Simpan semua lamaran dan skill ke file JSON, atau pulihkan dari file backup.'}</span>
      </GridTile>

      <GridButton c={6} r={8} w={3} className="gt--center" onClick={exportJson}>
        <span className="h3 chev">Export JSON</span>
        <span className="xs">aku-mw-magang-backup.json</span>
      </GridButton>

      <GridButton c={9} r={8} w={3} className="gt--center" onClick={() => fileRef.current?.click()}>
        <span className="h3 chev">Import JSON</span>
        <span className="xs">Data sekarang akan diganti</span>
      </GridButton>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void importJson(f);
          e.target.value = '';
        }}
      />

      <GridButton
        c={12}
        r={8}
        w={2}
        hot={confirmReset}
        className="gt--center"
        onClick={() => {
          if (!confirmReset) {
            setConfirmReset(true);
            return;
          }
          p.onReset();
          setConfirmReset(false);
        }}
      >
        <span className="h3 chev" style={{ color: 'var(--red)' }}>{confirmReset ? 'Yakin? Klik lagi' : 'Reset data'}</span>
        <span className="xs">Tidak bisa dibatalkan</span>
      </GridButton>

      <GridTile c={1} r={4} w={5} h={2} className="gt--top" label="Sumber data lowongan">
        <span className="k">&gt;/ Sumber lowongan</span>
        {(
          [
            ['remotive', 'Remotive API (live)', 'remotive.com, kategori software-dev'],
            ['fallback', 'Dataset lokal', 'public/magang-fallback.json'],
          ] as const
        ).map(([value, name, desc]) => (
          <button
            key={value}
            type="button"
            className="chip"
            aria-pressed={p.jobSource === value}
            onClick={() => p.setJobSource(value)}
            style={{
              display: 'grid',
              justifyItems: 'start',
              width: '100%',
              marginTop: 6,
              background: p.jobSource === value ? 'var(--amber)' : undefined,
              color: p.jobSource === value ? '#233f7c' : undefined,
            }}
          >
            <span className="s">{p.jobSource === value ? '> ' : ''}{name}</span>
            <span className="xs">{desc}</span>
          </button>
        ))}
      </GridTile>
    </>
  );
}
