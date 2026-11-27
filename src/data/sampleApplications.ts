// Data contoh untuk mencoba tampilan. Tanggal dihitung relatif ke hari ini,
// jadi saat demo selalu ada interview bentrok minggu ini dan lamaran rawan ghosting.
import type { Application, ChecklistItem } from '../types/application';
import { toDateKey } from '../utils/format';

const DAY = 86_400_000;
const daysAgo = (d: number) => new Date(Date.now() - d * DAY).toISOString();
const dateOnly = (d: number) => toDateKey(new Date(Date.now() - d * DAY));
// 2 hari lagi jam hh:mm, format YYYY-MM-DDTHH:mm (sesuai validasi state machine Al)
const inTwoDays = (hm: string) => `${toDateKey(new Date(Date.now() + 2 * DAY))}T${hm}`;
const log = (id: string, d: number, message: string) => ({ id, timestamp: daysAgo(d), message });
const tasks = (items: [string, boolean][]): ChecklistItem[] =>
  items.map(([text, done], i) => ({ id: `t${i}-${text.length}`, text, done }));

export const SAMPLE_SKILLS = ['React', 'TypeScript', 'CSS', 'Git', 'REST API', 'PostgreSQL'];
export const DEFAULT_SKILLS = ['React', 'TypeScript', 'CSS']; // akun baru (soal: minimal 3 skill awal)

export const SAMPLE_APPLICATIONS: Application[] = [
  { id: 'a2', company: 'Bintang Commerce', role: 'Software Engineer Intern', workMode: 'Remote', status: 'OFFER',
    requiredSkills: ['React', 'TypeScript', 'CSS', 'Git', 'Testing'], cvVersion: 'Kapten-CV-v2.pdf', appliedDate: dateOnly(19),
    salaryOffer: 6_000_000, lastUpdatedAt: daysAgo(2),
    checklist: tasks([['Baca engineering blog', true], ['Latihan system design', true], ['Siapkan pertanyaan', true]]),
    activityLogs: [log('l3', 19, 'Lamaran dibuat dengan status APPLIED.'), log('l4', 2, 'Status berubah dari INTERVIEW ke OFFER.')] },
  { id: 'a1', company: 'Nusantara Cloud Tech', role: 'Frontend Engineering Intern', workMode: 'Hybrid', status: 'OFFER',
    requiredSkills: ['React', 'TypeScript', 'CSS', 'Git', 'REST API'], cvVersion: 'Kapten-CV-v2.pdf', appliedDate: dateOnly(20),
    salaryOffer: 4_500_000, lastUpdatedAt: daysAgo(1),
    checklist: tasks([['Riset tim frontend', true], ['Siapkan portofolio', true], ['Latihan live coding', true], ['Tanya soal mentoring', true]]),
    activityLogs: [log('l1', 20, 'Lamaran dibuat dengan status APPLIED.'), log('l2', 1, 'Status berubah dari INTERVIEW ke OFFER.')] },
  { id: 'a3', company: 'Garuda FinTech', role: 'Full-Stack Web Developer Intern', workMode: 'Remote', status: 'INTERVIEW',
    requiredSkills: ['React', 'TypeScript', 'PostgreSQL', 'Express', 'Prisma'], cvVersion: 'Kapten-CV-v2.pdf', appliedDate: dateOnly(17),
    interviewDateTime: inTwoDays('10:00'), lastUpdatedAt: daysAgo(3),
    checklist: tasks([['Sesuaikan CV dengan proyek React + TypeScript', true], ['Riset produk & stack Garuda FinTech', true], ['Latihan soal teknis React Hooks & REST API', true], ['Siapkan pertanyaan balik untuk pewawancara', false]]),
    activityLogs: [log('l5', 18, 'Disimpan ke Wishlist dari Katalog.'), log('l6', 17, 'Lamaran dikirim (CV: Kapten-CV-v2.pdf).'), log('l7', 12, 'Lolos tahap Screening.'), log('l8', 3, 'Status berubah dari SCREENING ke INTERVIEW.')] },
  { id: 'a6', company: 'Lintas Data Indonesia', role: 'Data Engineering Intern', workMode: 'Hybrid', status: 'INTERVIEW',
    requiredSkills: ['Python', 'SQL', 'Git'], cvVersion: 'Kapten-CV-v1.pdf', appliedDate: dateOnly(15),
    interviewDateTime: inTwoDays('10:30'), lastUpdatedAt: daysAgo(4),
    checklist: tasks([['Latihan SQL join', true], ['Pelajari Airflow dasar', false], ['Siapkan cerita proyek data', false]]),
    activityLogs: [log('l9', 15, 'Lamaran dibuat dengan status APPLIED.'), log('l10', 4, 'Status berubah dari SCREENING ke INTERVIEW.')] },
  { id: 'a4', company: 'Kopi Kode Studio', role: 'UI Engineer Intern', workMode: 'Onsite', status: 'APPLIED',
    requiredSkills: ['React', 'CSS', 'Figma', 'Git'], cvVersion: 'Kapten-CV-v2.pdf', appliedDate: dateOnly(16),
    lastUpdatedAt: daysAgo(16), checklist: tasks([['Follow-up email HRD', false], ['Update portofolio Figma', true]]),
    activityLogs: [log('l11', 16, 'Lamaran dibuat dengan status APPLIED.')] },
  { id: 'a7', company: 'Sinar Retail Tech', role: 'QA Automation Intern', workMode: 'Hybrid', status: 'SCREENING',
    requiredSkills: ['Testing', 'TypeScript'], cvVersion: 'Kapten-CV-v1.pdf', appliedDate: dateOnly(20),
    lastUpdatedAt: daysAgo(12), checklist: tasks([['Pelajari Playwright', false], ['Kerjakan take-home test', false]]),
    activityLogs: [log('l12', 20, 'Lamaran dibuat dengan status APPLIED.'), log('l13', 12, 'Status berubah dari APPLIED ke SCREENING.')] },
  { id: 'a5', company: 'AwanMerdeka Cloud', role: 'DevOps & Cloud Infrastructure Intern', workMode: 'Remote', status: 'WISHLIST',
    requiredSkills: ['Linux', 'Docker', 'CI/CD', 'Git', 'PostgreSQL'], lastUpdatedAt: daysAgo(25), checklist: [],
    activityLogs: [log('l14', 25, 'Lamaran dibuat dengan status WISHLIST.')] },
];
