import { useState } from 'react';
import type { Application } from '../../types/application';
import { WEIGHTS, formatRupiah, scoreOffers, type OfferScore } from '../../utils/offerScore';

interface OfferComparatorProps {
  applications: Application[];
  kaptenSkills: string[];
}

export function OfferComparator({ applications, kaptenSkills }: OfferComparatorProps) {
  const offers = applications.filter((a) => a.status === 'OFFER');
  const [pickA, setPickA] = useState<string>('');
  const [pickB, setPickB] = useState<string>('');

  if (offers.length < 2) {
    return (
      <section className="tile empty">
        <h2 className="h-dot">/ Belum bisa dibandingkan</h2>
        <p>
          Butuh minimal 2 lamaran berstatus OFFER. Sekarang ada {offers.length}.
          Pindahkan lamaran ke OFFER di War Room (isi uang saku dan mode kerja).
        </p>
      </section>
    );
  }

  // Pilihan yang tidak valid lagi (misal lamarannya dihapus) jatuh ke default.
  const a = offers.find((o) => o.id === pickA) ?? offers[0];
  const b = offers.find((o) => o.id === pickB && o.id !== a.id) ?? offers.find((o) => o.id !== a.id)!;
  const [sa, sb] = scoreOffers(a, b, kaptenSkills);
  const diff = Math.round((sa.total - sb.total) * 10) / 10;
  const winner = diff === 0 ? null : diff > 0 ? a : b;

  const rows: { label: string; value: (app: Application, s: OfferScore) => string; score: (s: OfferScore) => number; max: number }[] = [
    { label: 'Uang saku / bulan', value: (_, s) => formatRupiah(s.salary), score: (s) => s.salaryScore * WEIGHTS.salary, max: 50 },
    { label: 'Mode kerja', value: (app, s) => `${app.workMode} (${s.workModeScore})`, score: (s) => s.workModeScore * WEIGHTS.workMode, max: 25 },
    { label: 'Kecocokan skill', value: (_, s) => `${s.skillMatch}%`, score: (s) => s.skillMatch * WEIGHTS.skill, max: 25 },
  ];

  const column = (app: Application, s: OfferScore, side: 'A' | 'B') => (
    <div className="offer__col">
      <div className="tile offer__head">
        <h3 className="h-dot">{app.company}</h3>
        <p className="muted">{app.role}</p>
      </div>
      {rows.map((r) => {
        const pts = r.score(s);
        return (
          <div key={r.label} className="tile offer__row">
            <div>
              <span className="muted">/ {r.label}</span>
              <strong>{r.value(app, s)}</strong>
            </div>
            <div className="offer__pts">
              <strong className="h-dot">{pts.toFixed(1)} / {r.max}</strong>
              <span className="meter"><span style={{ width: `${(pts / r.max) * 100}%` }} /></span>
            </div>
          </div>
        );
      })}
      <div className={`tile offer__total${winner?.id === app.id ? ' tile--hot' : ''}`} aria-label={`Total skor offer ${side}`}>
        <span className="muted">/ Total skor berbobot</span>
        <strong className="offer__score">{s.total.toFixed(1)}</strong>
        {winner?.id === app.id && <span className="badge">Rekomendasi Terbaik</span>}
      </div>
    </div>
  );

  return (
    <section className="offer">
      <div className="tile offer__title">
        <h2 className="h-dot">/ Bandingkan offer magang</h2>
        <p className="muted">
          Bobot: uang saku {WEIGHTS.salary * 100}%, mode kerja {WEIGHTS.workMode * 100}%, kecocokan skill {WEIGHTS.skill * 100}%.
        </p>
      </div>

      <div className="offer__pickers">
        <label className="field tile">
          <span>&gt;/ Offer A</span>
          <select value={a.id} onChange={(e) => setPickA(e.target.value)}>
            {offers.map((o) => <option key={o.id} value={o.id}>{o.company} - {o.role}</option>)}
          </select>
        </label>
        <label className="field tile">
          <span>&gt;/ Offer B</span>
          <select value={b.id} onChange={(e) => setPickB(e.target.value)}>
            {offers.filter((o) => o.id !== a.id).map((o) => <option key={o.id} value={o.id}>{o.company} - {o.role}</option>)}
          </select>
        </label>
      </div>

      <div className="offer__grid">
        {column(a, sa, 'A')}
        {column(b, sb, 'B')}
      </div>

      <p className="tile offer__verdict h-dot">
        {winner ? `/ ${winner.company} unggul ${Math.abs(diff).toFixed(1)} poin` : '/ Skor kedua offer sama'}
      </p>
    </section>
  );
}
