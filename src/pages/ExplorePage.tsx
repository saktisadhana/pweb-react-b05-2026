import { JobExplorer } from '../components/JobExplorer';
import { SkillProfile } from '../components/SkillProfile';
import type { Application } from '../types/application';
import type { JobSource } from '../services/jobService';

interface ExplorePageProps {
  kaptenSkills: string[];
  setKaptenSkills: (skills: string[]) => void;
  applications: Application[];
  onAdd: (application: Application) => void;
  source: JobSource;
  onSourceChange: (source: JobSource) => void;
  listPage: number;
  onListPage: (index: number) => void;
  onPageCount: (count: number) => void;
}

// Halaman Eksplorasi (frame "Meow" di Figma): Profil Skill di kiri, lowongan di kanan.
// Komponen dan logikanya buatan Marvel (Fitur 1).
export function ExplorePage({ kaptenSkills, setKaptenSkills, ...explorer }: ExplorePageProps) {
  return (
    <>
      <SkillProfile skills={kaptenSkills} onChange={setKaptenSkills} />
      <JobExplorer kaptenSkills={kaptenSkills} {...explorer} />
    </>
  );
}
