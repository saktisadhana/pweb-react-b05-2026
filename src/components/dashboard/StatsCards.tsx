import type { Application } from '../../types/application';
import { computeDashboardStats } from '../../utils/dashboardStats';

interface StatsCardsProps {
  applications: Application[];
}

export function StatsCards({ applications }: StatsCardsProps) {
  // Derived state: tidak ada useState di sini, semua dihitung dari props.
  const s = computeDashboardStats(applications);

  const items = [
    { label: 'Total lamaran', value: String(s.total), hint: `${s.sent} sudah dikirim` },
    { label: 'Response rate', value: `${s.responseRate}%`, hint: 'dari lamaran terkirim' },
    { label: 'Interview rate', value: `${s.interviewRate}%`, hint: 'sampai tahap interview' },
    { label: 'Rawan ghosting', value: String(s.ghostingRisk), hint: '> 14 hari tanpa kabar', hot: s.ghostingRisk > 0 },
    { label: 'Total offer', value: String(s.totalOffer), hint: 'siap dibandingkan' },
  ];

  return (
    <dl className="stats">
      {items.map((it) => (
        <div key={it.label} className={`stats__item tile${it.hot ? ' tile--hot' : ''}`}>
          <dt>{it.label}</dt>
          <dd className="stats__value">{it.value}</dd>
          <dd className="muted">{it.hint}</dd>
        </div>
      ))}
    </dl>
  );
}
