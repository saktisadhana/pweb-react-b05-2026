import { useState, type FormEvent } from 'react';
import { addCaptainSkill, removeCaptainSkill } from '../utils/application';
import { GridTile } from './seno/GridTile';
import { TileBtn, TileInput, TileLabel } from './seno/OverlayTile';
import { gridBox } from './seno/grid';

interface SkillProfileProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

// Fitur 1 - Profil Skill Kapten (Marvel). Tampilan mengikuti frame Eksplorasi di Figma:
// tile ">/ Add Skills" jadi input, tile "+" jadi tombol tambah, daftar skill di tile putih.
export function SkillProfile({ skills, onChange }: SkillProfileProps) {
  const [newSkill, setNewSkill] = useState('');
  const [error, setError] = useState('');

  function handleAdd(e?: FormEvent) {
    e?.preventDefault();
    try {
      // addCaptainSkill (buatan Al) menolak skill kosong & duplikat dengan throw Error
      onChange(addCaptainSkill(skills, newSkill));
      setNewSkill('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambah skill');
    }
  }

  function handleRemove(skill: string) {
    onChange(removeCaptainSkill(skills, skill));
  }

  return (
    <form onSubmit={handleAdd} className="contents" aria-label="Profil skill Kapten">
      <TileInput
        box={gridBox(1, 5, 4)}
        tone="amber"
        label="Tambah skill"
        placeholder=">/ Add Skills"
        value={newSkill}
        onChange={(v) => {
          setNewSkill(v);
          setError('');
        }}
        error={Boolean(error)}
      />
      <TileBtn box={gridBox(5, 5)} tone="navy" label="Tambah skill" type="submit">
        <TileLabel tone="navy" x={35} y={21}>+</TileLabel>
      </TileBtn>

      <GridTile c={1} r={6} w={5} h={2} className={`gt--top${error ? ' is-error' : ''}`} label="Daftar skill Kapten">
        <div className="chips">
          {skills.map((skill) => (
            <span key={skill} className="chip" style={{ cursor: 'default' }}>
              {skill}
              <button type="button" className="x" aria-label={`Hapus skill ${skill}`} onClick={() => handleRemove(skill)}>
                x
              </button>
            </span>
          ))}
        </div>
        {skills.length === 0 && <p className="s muted">Belum ada skill. Ketik di kolom Add Skills lalu tekan +.</p>}
        {error && (
          <p className="err" role="alert" style={{ marginTop: 'auto' }}>
            {error}
          </p>
        )}
      </GridTile>
    </form>
  );
}
