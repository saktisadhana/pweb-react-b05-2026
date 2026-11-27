import { useRef, useState, type FormEvent } from 'react';
import type { Application, InitialApplicationStatus, WorkMode } from '../types/application';
import { createApplication, isDuplicateApplication } from '../utils/application';
import { GridButton, GridTile } from './seno/GridTile';
import { Scrim } from './seno/Popups';
import { PopularSkills } from './seno/PopularSkills';
import { Select } from './seno/Select';

interface ApplicationFormProps {
  applications: Application[];
  onAdd: (application: Application) => void;
  onClose: () => void;
}

// Pesan error per input. "?" artinya boleh tidak ada (input itu tidak error)
interface FormErrors {
  company?: string;
  role?: string;
  skills?: string;
  cvVersion?: string;
  appliedDate?: string;
}

// Fitur 2 - Form Tambah Lamaran Manual (Marvel). Logika validasi dan auto-focus
// dari versi Marvel; tampilannya popup tile SENO di atas War Room.
export function ApplicationForm({ applications, onAdd, onClose }: ApplicationFormProps) {
  // Controlled form: setiap input punya state sendiri (value + onChange)
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [workMode, setWorkMode] = useState<WorkMode>('Remote');
  const [status, setStatus] = useState<InitialApplicationStatus>('WISHLIST');
  const [skillsText, setSkillsText] = useState('');
  const [cvVersion, setCvVersion] = useState('');
  const [appliedDate, setAppliedDate] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  // useRef untuk menunjuk elemen input, supaya bisa difokuskan lewat kode
  const companyRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const skillsRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  // "React, TypeScript , CSS" -> ["React", "TypeScript", "CSS"]
  function parseSkills(text: string): string[] {
    return text
      .split(',')
      .map((skill) => skill.trim())
      .filter((skill) => skill !== '');
  }

  function validate(): FormErrors {
    const newErrors: FormErrors = {};

    if (!company.trim()) newErrors.company = 'Perusahaan wajib diisi';
    if (!role.trim()) newErrors.role = 'Posisi wajib diisi';
    if (parseSkills(skillsText).length === 0) newErrors.skills = 'Isi minimal 1 skill';

    if (status === 'APPLIED') {
      if (!cvVersion.trim()) newErrors.cvVersion = 'Versi CV wajib diisi';
      if (!appliedDate) newErrors.appliedDate = 'Tanggal melamar wajib diisi';
    }

    // Anti-duplikat: company + role yang sama (huruf besar/kecil diabaikan)
    if (company.trim() && role.trim() && isDuplicateApplication(applications, company, role)) {
      newErrors.company = 'Lamaran untuk perusahaan + posisi ini sudah ada';
    }

    return newErrors;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const newErrors = validate();
    setErrors(newErrors);

    // Fokus ke input PERTAMA yang error, urut dari atas ke bawah
    if (newErrors.company) {
      companyRef.current?.focus();
      return;
    }
    if (newErrors.role) {
      roleRef.current?.focus();
      return;
    }
    if (newErrors.skills) {
      skillsRef.current?.focus();
      return;
    }
    if (newErrors.cvVersion) {
      cvRef.current?.focus();
      return;
    }
    if (newErrors.appliedDate) {
      dateRef.current?.focus();
      return;
    }

    // Lolos validasi: buat objek lamaran (createApplication buatan Al) lalu kirim ke App
    const newApplication = createApplication(applications, {
      company,
      role,
      status,
      workMode,
      requiredSkills: parseSkills(skillsText),
      cvVersion: status === 'APPLIED' ? cvVersion.trim() : undefined,
      appliedDate: status === 'APPLIED' ? appliedDate : undefined,
    });
    onAdd(newApplication);
  }

  const err = (msg?: string) => (msg ? <span className="err" role="alert">{msg}</span> : null);
  const lastRow = status === 'APPLIED' ? 7 : 6;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <>
      <Scrim onClose={onClose} />
      <form role="dialog" aria-modal="true" aria-label="Tambah lamaran" onSubmit={handleSubmit} noValidate className="contents">
        <GridTile c={5} r={2} w={5} className="popup" label="Judul">
          <span className="v">Catat lamaran manual</span>
        </GridTile>
        <GridButton c={10} r={2} className="popup gt--center" onClick={onClose} ariaLabel="Tutup">
          <span className="s chev">Tutup</span>
        </GridButton>

        <GridTile c={5} r={3} w={3} className={`popup${errors.company ? ' is-error' : ''}`} label="Perusahaan">
          <label className="k" htmlFor="form-company">&gt;/ Perusahaan</label>
          <input id="form-company" ref={companyRef} autoFocus className="field-input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Contoh: Nusantara Cloud" />
          {err(errors.company)}
        </GridTile>
        <GridTile c={8} r={3} w={3} className={`popup${errors.role ? ' is-error' : ''}`} label="Posisi">
          <label className="k" htmlFor="form-role">&gt;/ Posisi / Role</label>
          <input id="form-role" ref={roleRef} className="field-input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Contoh: Frontend Intern" />
          {err(errors.role)}
        </GridTile>

        <GridTile c={5} r={4} w={3} className="popup" label="Status awal">
          <span className="k">&gt;/ Status awal</span>
          <div className="chips">
            {(['WISHLIST', 'APPLIED'] as const).map((s) => (
              <button key={s} type="button" className={`chip${status === s ? ' is-on' : ''}`} aria-pressed={status === s} onClick={() => setStatus(s)}>
                {s}
              </button>
            ))}
          </div>
        </GridTile>
        <GridTile c={8} r={4} w={3} className="popup" label="Mode kerja">
          <label className="k" htmlFor="form-mode">&gt;/ Mode kerja</label>
          <Select<WorkMode>
            id="form-mode"
            className="dot"
            value={workMode}
            onChange={setWorkMode}
            options={[
              { value: 'Remote', label: 'Remote' },
              { value: 'Hybrid', label: 'Hybrid' },
              { value: 'Onsite', label: 'Onsite' },
            ]}
          />
        </GridTile>

        <GridTile c={5} r={5} w={6} className={`popup${errors.skills ? ' is-error' : ''}`} label="Required skills">
          <label className="k" htmlFor="form-skills">&gt;/ Required skills (pisahkan dengan koma)</label>
          <input id="form-skills" ref={skillsRef} className="field-input" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} placeholder="React, TypeScript, CSS" />
          {err(errors.skills)}
          {/* Klik skill populer untuk langsung menambahkannya ke daftar di atas. */}
          <PopularSkills
            owned={parseSkills(skillsText)}
            limit={6}
            title="Tambah cepat:"
            onPick={(skill) => setSkillsText([...parseSkills(skillsText), skill].join(', '))}
          />
        </GridTile>

        {/* Input kondisional: hanya muncul kalau status awal APPLIED */}
        {status === 'APPLIED' && (
          <>
            <GridTile c={5} r={6} w={3} className={`popup${errors.cvVersion ? ' is-error' : ''}`} label="Versi CV">
              <label className="k" htmlFor="form-cv">&gt;/ Versi CV</label>
              <input id="form-cv" ref={cvRef} className="field-input" value={cvVersion} onChange={(e) => setCvVersion(e.target.value)} placeholder="Contoh: Kapten-CV-v2.pdf" />
              {err(errors.cvVersion)}
            </GridTile>
            <GridTile c={8} r={6} w={3} className={`popup${errors.appliedDate ? ' is-error' : ''}`} label="Tanggal melamar">
              <label className="k" htmlFor="form-date">&gt;/ Tanggal melamar</label>
              <input id="form-date" ref={dateRef} className="field-input" type="date" value={appliedDate} onChange={(e) => setAppliedDate(e.target.value)} />
              {err(errors.appliedDate)}
            </GridTile>
          </>
        )}

        <GridTile c={5} r={lastRow} w={4} className="popup" label="Keterangan">
          <span className="xs muted">
            {hasErrors ? 'Periksa isian yang ditandai merah.' : 'Lamaran baru langsung masuk ke War Room.'}
          </span>
        </GridTile>
        <GridButton c={9} r={lastRow} w={2} type="submit" className="popup gt--center gt--navy">
          <span className="h3 chev">Simpan Lamaran</span>
        </GridButton>
      </form>
    </>
  );
}
