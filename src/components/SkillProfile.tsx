import { useState } from "react";
import { addCaptainSkill, removeCaptainSkill } from "../utils/application";

interface SkillProfileProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

export function SkillProfile({ skills, onChange }: SkillProfileProps) {
  const [newSkill, setNewSkill] = useState("");
  const [error, setError] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      // addCaptainSkill (buatan Al) menolak skill kosong & duplikat dengan throw Error
      onChange(addCaptainSkill(skills, newSkill));
      setNewSkill("");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah skill");
    }
  }

  function handleRemove(skill: string) {
    onChange(removeCaptainSkill(skills, skill));
  }

  return (
    <section className="panel">
      <h2>Profil Skill Kapten</h2>
      <p className="muted">Dipakai untuk menghitung persentase kecocokan tiap lowongan.</p>

      <form className="row" onSubmit={handleAdd}>
        <input
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          placeholder="Tambah skill..."
        />
        <button type="submit">Tambah</button>
      </form>
      {error && <p className="error-text">{error}</p>}

      <div className="tags">
        {skills.map((skill) => (
          <span key={skill} className="tag">
            {skill}
            <button
              type="button"
              className="tag-remove"
              onClick={() => handleRemove(skill)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      {skills.length === 0 && <p className="muted">Belum ada skill.</p>}
    </section>
  );
}