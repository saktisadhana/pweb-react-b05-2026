// Skill yang paling sering diminta lowongan magang IT. Dipakai di Eksplorasi, Profil,
// dan form tambah lamaran supaya skill bisa ditambah dengan sekali klik.
const POPULAR_SKILLS = [
  'JavaScript', 'React', 'TypeScript', 'HTML', 'CSS', 'Git', 'Python', 'SQL', 'Node.js', 'Tailwind CSS',
  'Figma', 'Docker', 'Java', 'REST API', 'Next.js', 'Linux',
];

interface PopularSkillsProps {
  owned: string[]; // skill yang sudah ada (tidak ditampilkan lagi)
  onPick: (skill: string) => void;
  limit?: number;
  title?: string;
}

export function PopularSkills({ owned, onPick, limit = 8, title = 'Skill populer (klik untuk menambah):' }: PopularSkillsProps) {
  const have = new Set(owned.map((s) => s.trim().toLowerCase()));
  const suggestions = POPULAR_SKILLS.filter((s) => !have.has(s.toLowerCase())).slice(0, limit);
  if (suggestions.length === 0) return null;
  return (
    <>
      <span className="xs muted" style={{ marginTop: 4 }}>{title}</span>
      <div className="chips">
        {suggestions.map((skill) => (
          <button key={skill} type="button" className="chip chip--add" onClick={() => onPick(skill)} aria-label={`Tambah skill ${skill}`}>
            + {skill}
          </button>
        ))}
      </div>
    </>
  );
}
