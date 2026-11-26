import { useRef, useState } from "react";
import type {
  Application,
  InitialApplicationStatus,
  WorkMode,
} from "../types/application";
import { createApplication, isDuplicateApplication } from "../utils/application";

interface ApplicationFormProps {
  applications: Application[];
  onAdd: (application: Application) => void;
}

// Pesan error per input. "?" artinya boleh tidak ada (input itu tidak error)
interface FormErrors {
  company?: string;
  role?: string;
  skills?: string;
  cvVersion?: string;
  appliedDate?: string;
}

export function ApplicationForm({ applications, onAdd }: ApplicationFormProps) {
  // Controlled form: setiap input punya state sendiri (value + onChange)
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>("Remote");
  const [status, setStatus] = useState<InitialApplicationStatus>("WISHLIST");
  const [skillsText, setSkillsText] = useState("");
  const [cvVersion, setCvVersion] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
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
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill !== "");
  }

  function validate(): FormErrors {
    const newErrors: FormErrors = {};

    if (!company.trim()) newErrors.company = "Perusahaan wajib diisi";
    if (!role.trim()) newErrors.role = "Posisi wajib diisi";
    if (parseSkills(skillsText).length === 0)
      newErrors.skills = "Isi minimal 1 skill";

    if (status === "APPLIED") {
      if (!cvVersion.trim()) newErrors.cvVersion = "Versi CV wajib diisi";
      if (!appliedDate) newErrors.appliedDate = "Tanggal melamar wajib diisi";
    }

    // Anti-duplikat: company + role yang sama (huruf besar/kecil diabaikan)
    if (
      company.trim() &&
      role.trim() &&
      isDuplicateApplication(applications, company, role)
    ) {
      newErrors.company = "Lamaran untuk perusahaan + posisi ini sudah ada";
    }

    return newErrors;
  }

  function handleSubmit(e: React.FormEvent) {
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
      cvVersion: status === "APPLIED" ? cvVersion.trim() : undefined,
      appliedDate: status === "APPLIED" ? appliedDate : undefined,
    });
    onAdd(newApplication);

    // Reset form setelah berhasil
    setCompany("");
    setRole("");
    setWorkMode("Remote");
    setStatus("WISHLIST");
    setSkillsText("");
    setCvVersion("");
    setAppliedDate("");
  }

  return (
    <form className="panel form" onSubmit={handleSubmit}>
      <h2>Catat Lamaran Manual</h2>

      <label>
        Perusahaan
        <input
          ref={companyRef}
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Contoh: Nusantara Cloud"
        />
        {errors.company && <span className="error-text">{errors.company}</span>}
      </label>

      <label>
        Posisi / Role
        <input
          ref={roleRef}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Contoh: Frontend Intern"
        />
        {errors.role && <span className="error-text">{errors.role}</span>}
      </label>

      <label>
        Mode Kerja
        <select
          value={workMode}
          onChange={(e) => setWorkMode(e.target.value as WorkMode)}
        >
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Onsite">Onsite</option>
        </select>
      </label>

      <label>
        Status Awal
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as InitialApplicationStatus)}
        >
          <option value="WISHLIST">WISHLIST</option>
          <option value="APPLIED">APPLIED</option>
        </select>
      </label>

      <label>
        Required Skills (pisahkan dengan koma)
        <input
          ref={skillsRef}
          value={skillsText}
          onChange={(e) => setSkillsText(e.target.value)}
          placeholder="React, TypeScript, CSS"
        />
        {errors.skills && <span className="error-text">{errors.skills}</span>}
      </label>

      {/* Input kondisional: hanya muncul kalau status awal APPLIED */}
      {status === "APPLIED" && (
        <>
          <label>
            Versi CV
            <input
              ref={cvRef}
              value={cvVersion}
              onChange={(e) => setCvVersion(e.target.value)}
              placeholder="Contoh: Kapten-CV-v2.pdf"
            />
            {errors.cvVersion && (
              <span className="error-text">{errors.cvVersion}</span>
            )}
          </label>

          <label>
            Tanggal Melamar
            <input
              ref={dateRef}
              type="date"
              value={appliedDate}
              onChange={(e) => setAppliedDate(e.target.value)}
            />
            {errors.appliedDate && (
              <span className="error-text">{errors.appliedDate}</span>
            )}
          </label>
        </>
      )}

      <button type="submit">Simpan Lamaran</button>
    </form>
  );
}