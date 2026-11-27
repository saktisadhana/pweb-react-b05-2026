import type { Application, ApplicationStatus } from '../types/application';
import { isAtRiskOfGhosting } from './ghosting';

export interface DashboardStats {
  total: number;
  sent: number;
  responseRate: number;
  interviewRate: number;
  ghostingRisk: number;
  totalOffer: number;
}

// Status yang berarti perusahaan sudah membalas lamaran.
const RESPONDED: ApplicationStatus[] = ['SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED'];
// Status yang berarti lamaran sudah sampai tahap interview (atau lewat).
const REACHED_INTERVIEW: ApplicationStatus[] = ['INTERVIEW', 'OFFER'];

const percent = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));

// Derived state: dihitung ulang dari applications, tidak disimpan ke useState.
export function computeDashboardStats(applications: Application[], now: Date = new Date()): DashboardStats {
  const sent = applications.filter((a) => a.status !== 'WISHLIST').length;
  const responded = applications.filter((a) => RESPONDED.includes(a.status)).length;
  const interviewed = applications.filter((a) => REACHED_INTERVIEW.includes(a.status)).length;

  return {
    total: applications.length,
    sent,
    responseRate: percent(responded, sent),
    interviewRate: percent(interviewed, sent),
    ghostingRisk: applications.filter((a) => isAtRiskOfGhosting(a, now)).length,
    totalOffer: applications.filter((a) => a.status === 'OFFER').length,
  };
}
