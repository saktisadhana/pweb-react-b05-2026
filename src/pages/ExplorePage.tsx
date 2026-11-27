import { GridTile } from '../components/seno/GridTile';

interface ExplorePageProps {
  kaptenSkills: string[];
}

// Halaman Eksplorasi = bagian Marvel (Job Explorer + jobService Remotive).
// Posisi tile sudah sesuai frame "Meow" di Figma, Marvel tinggal mengisi isinya:
// best match (6,3, 2x2), judul (8,3, 6), perusahaan (8,4, 4), gaji (12,4, 2),
// skill (6,5, 6), simpan (12,5, 2), daftar lowongan baris 6-8.
export function ExplorePage({ kaptenSkills }: ExplorePageProps) {
  return (
    <>
      <GridTile c={6} r={3} w={8} h={6} className="gt--top" label="Job Explorer">
        <span className="h1">/ Eksplorasi lowongan</span>
        <p className="s" style={{ marginTop: 8 }}>
          Tempat Job Explorer (Marvel). Lowongan dari Remotive API tampil di grid ini dengan Match Score dari profil skill di kiri.
        </p>
      </GridTile>

      <GridTile c={1} r={6} w={5} h={2} className="gt--top" label="Skill kamu">
        <span className="xs">/ Skill kamu ({kaptenSkills.length})</span>
        <div className="chips" style={{ marginTop: 6 }}>
          {kaptenSkills.map((s) => <span key={s} className="chip" style={{ cursor: 'default' }}>{s}</span>)}
        </div>
      </GridTile>
    </>
  );
}
