import { useState } from 'react';
import type { Application } from '../types/application';
import type { Page } from '../data/figmaTiles';
import { isAtRiskOfGhosting } from '../utils/ghosting';
import { formatLongDate } from '../utils/format';
import { GridButton, GridTile } from './seno/GridTile';
import { CountUp } from './seno/CountUp';

interface MenuSummaryProps {
  applications: Application[];
  onOpenDetail: (id: string) => void;
  onNavigate: (page: Page) => void;
}

// Saat menu kiri dilipat ("<<<<"), area kosongnya (kolom 1-5, baris 1-3) dipakai untuk
// ringkasan singkat yang sama di semua halaman: interview terdekat, status lamaran,
// jumlah rawan ghosting, dan saran langkah berikutnya.
export function MenuSummary({ applications, onOpenDetail, onNavigate }: MenuSummaryProps) {
  const [now] = useState(() => new Date()); // waktu saat ringkasan dibuka
  const upcoming = applications
    .filter((a) => a.interviewDateTime && new Date(a.interviewDateTime) >= now)
    .sort((a, b) => a.interviewDateTime!.localeCompare(b.interviewDateTime!))[0];
  const count = (status: Application['status']) => applications.filter((a) => a.status === status).length;
  const atRisk = applications.filter((a) => isAtRiskOfGhosting(a, now));
  const wishlist = count('WISHLIST');

  let next: { text: string; go: () => void };
  if (atRisk.length > 0) {
    next = { text: `Follow up ${atRisk[0].company}: lebih dari 14 hari tanpa kabar`, go: () => onOpenDetail(atRisk[0].id) };
  } else if (wishlist > 0) {
    next = { text: `${wishlist} lowongan di Wishlist belum dilamar`, go: () => onNavigate('warroom') };
  } else if (applications.length === 0) {
    next = { text: 'Belum ada lamaran. Cari lowongan di Eksplorasi', go: () => onNavigate('explore') };
  } else {
    next = { text: 'Semua lamaran aman. Cari lowongan baru', go: () => onNavigate('explore') };
  }

  return (
    <>
      {upcoming ? (
        <GridButton c={1} r={1} w={5} hot onClick={() => onOpenDetail(upcoming.id)} ariaLabel={`Buka interview ${upcoming.company}`}>
          <span className="xs">/ Interview terdekat</span>
          <span className="h3">{upcoming.company} - {upcoming.role}</span>
          <span className="xs">{formatLongDate(upcoming.interviewDateTime!)}</span>
        </GridButton>
      ) : (
        <GridTile c={1} r={1} w={5} label="Interview terdekat">
          <span className="xs">/ Interview terdekat</span>
          <span className="h3">Belum ada jadwal interview</span>
        </GridTile>
      )}

      <GridTile c={1} r={2} w={3} label="Status lamaran">
        <span className="xs">/ Status lamaran</span>
        <span className="v">
          {applications.length} total, {count('APPLIED') + count('SCREENING')} menunggu, {count('INTERVIEW')} interview, {count('OFFER')} offer
        </span>
      </GridTile>
      <GridTile c={4} r={2} w={2} hot={atRisk.length > 0} label="Rawan ghosting">
        <span className="xs">/ Rawan ghosting</span>
        <span className="h2"><CountUp value={String(atRisk.length)} /></span>
      </GridTile>

      <GridButton c={1} r={3} w={5} onClick={next.go}>
        <span className="xs">/ Langkah berikutnya</span>
        <span className="h3 chev">{next.text}</span>
      </GridButton>
    </>
  );
}
