import type { Application, WorkMode } from '../types/application';
import { getSkillMatch } from './application';

export const WEIGHTS = { salary: 0.5, workMode: 0.25, skill: 0.25 } as const;

export const WORK_MODE_SCORE: Record<WorkMode, number> = { Remote: 100, Hybrid: 75, Onsite: 50 };

export interface OfferScore {
  salary: number;      // Rp
  salaryScore: number; // 0-100, gaji dibagi gaji tertinggi dari kedua offer
  workModeScore: number;
  skillMatch: number;
  total: number;       // 0-100, sudah berbobot
}

const round1 = (n: number) => Math.round(n * 10) / 10;

// Total = (Normalisasi Gaji x 50%) + (Skor Mode Kerja x 25%) + (Skill Match % x 25%)
export function scoreOffers(a: Application, b: Application, kaptenSkills: string[]): [OfferScore, OfferScore] {
  const maxSalary = Math.max(a.salaryOffer ?? 0, b.salaryOffer ?? 0);

  const score = (app: Application): OfferScore => {
    const salary = app.salaryOffer ?? 0;
    const salaryScore = maxSalary === 0 ? 0 : (salary / maxSalary) * 100;
    const workModeScore = WORK_MODE_SCORE[app.workMode];
    const skillMatch = getSkillMatch(app.requiredSkills, kaptenSkills).score;
    const total =
      salaryScore * WEIGHTS.salary + workModeScore * WEIGHTS.workMode + skillMatch * WEIGHTS.skill;
    return { salary, salaryScore: round1(salaryScore), workModeScore, skillMatch, total: round1(total) };
  };

  return [score(a), score(b)];
}

export const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
