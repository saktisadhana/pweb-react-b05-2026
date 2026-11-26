// Data contoh untuk mencoba tampilan. Hapus setelah form dan explorer Marvel jalan.
import type { Application } from '../types/application';

const now = new Date().toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export const SAMPLE_APPLICATIONS: Application[] = [
  { id: 'a1', company: 'Nusantara Cloud Tech', role: 'Frontend Engineering Intern', workMode: 'Hybrid', status: 'OFFER',
    requiredSkills: ['React', 'TypeScript', 'CSS', 'Git', 'REST API'], cvVersion: 'Kapten-CV-v2.pdf', appliedDate: '2026-11-02',
    salaryOffer: 4_500_000, lastUpdatedAt: now, checklist: [], activityLogs: [] },
  { id: 'a2', company: 'Bintang Commerce', role: 'Software Engineer Intern', workMode: 'Remote', status: 'OFFER',
    requiredSkills: ['React', 'TypeScript', 'CSS', 'Git', 'Testing'], cvVersion: 'Kapten-CV-v2.pdf', appliedDate: '2026-11-03',
    salaryOffer: 6_000_000, lastUpdatedAt: now, checklist: [], activityLogs: [] },
  { id: 'a3', company: 'Garuda FinTech', role: 'Full-Stack Web Developer Intern', workMode: 'Remote', status: 'INTERVIEW',
    requiredSkills: ['React', 'TypeScript', 'PostgreSQL', 'Express', 'Prisma'], cvVersion: 'Kapten-CV-v2.pdf', appliedDate: '2026-11-10',
    interviewDateTime: '2026-11-22T10:00', lastUpdatedAt: now, checklist: [], activityLogs: [] },
  { id: 'a4', company: 'Kopi Kode Studio', role: 'UI Engineer Intern', workMode: 'Onsite', status: 'APPLIED',
    requiredSkills: ['React', 'CSS', 'Figma'], cvVersion: 'Kapten-CV-v2.pdf', appliedDate: '2026-11-01',
    lastUpdatedAt: daysAgo(16), checklist: [], activityLogs: [] },
  { id: 'a5', company: 'AwanMerdeka Cloud', role: 'DevOps & Cloud Infrastructure Intern', workMode: 'Remote', status: 'WISHLIST',
    requiredSkills: ['Linux', 'Docker', 'CI/CD', 'Git', 'PostgreSQL'], lastUpdatedAt: now, checklist: [], activityLogs: [] },
  { id: 'a6', company: 'Lintas Data Indonesia', role: 'Data Engineering Intern', workMode: 'Hybrid', status: 'INTERVIEW',
    requiredSkills: ['Python', 'SQL', 'Git'], cvVersion: 'Kapten-CV-v1.pdf', appliedDate: '2026-11-08',
    interviewDateTime: '2026-11-22T10:30', lastUpdatedAt: now, checklist: [], activityLogs: [] },
];
