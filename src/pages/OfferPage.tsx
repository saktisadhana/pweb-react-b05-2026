import { useState } from 'react';
import { GridTile } from '../components/seno/GridTile';
import type { Application } from '../types/application';
import { formatRupiah, scoreOffers, WEIGHTS, type OfferScore } from '../utils/offerScore';
import { getSkillMatch } from '../utils/application';

interface OfferPageProps {
  applications: Application[];
  kaptenSkills: string[];
}

const fmt = (n: number) => n.toFixed(1);

// Bar 10 kotak, dipakai untuk skor per kategori.
function Blocks({ value, max }: { value: number; max: number }) {
  const on = Math.round((value / max) * 10);
  return (
    <span className="seg seg--small" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < on ? 'on' : ''} />)}
    </span>
  );
}

// Fitur 7 (Sakti): pilih 2 offer, hitung skor berbobot, tunjukkan pemenang.
export function OfferPage({ applications, kaptenSkills }: OfferPageProps) {
  const offers = applications.filter((a) => a.status === 'OFFER');
  const [aId, setAId] = useState(offers[0]?.id ?? '');
  const [bId, setBId] = useState(offers[1]?.id ?? '');

  const weights = (
    <GridTile c={1} r={5} w={5} h={4} className="gt--top" label="Bobot penilaian">
      <span className="h1">/ Bobot penilaian</span>
      <p className="xs" style={{ margin: '10px 0 14px' }}>
        Setiap kategori dinilai 0-100, lalu dikali bobotnya. Total skor maksimal 100.
      </p>
      {[
        ['Uang saku', WEIGHTS.salary],
        ['Mode kerja', WEIGHTS.workMode],
        ['Kecocokan skill', WEIGHTS.skill],
      ].map(([label, w]) => (
        <div key={label} style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          <span className="spread"><span className="h2" style={{ fontSize: 17 }}>{label}</span><span className="s">{Number(w) * 100}%</span></span>
          <span className="seg seg--block" aria-hidden="true">
            {Array.from({ length: 20 }, (_, i) => <i key={i} className={i < Number(w) * 20 ? 'on' : ''} />)}
          </span>
        </div>
      ))}
    </GridTile>
  );

  if (offers.length < 2) {
    return (
      <>
        <GridTile c={6} r={1} w={8} label="Bandingkan offer">
          <span className="h1">/ Bandingkan Offer Magang</span>
        </GridTile>
        <GridTile c={6} r={2} w={8} h={3} hot label="Offer belum cukup">
          <p className="h2">/ Butuh minimal 2 offer</p>
          <p className="s">
            Sekarang ada {offers.length} lamaran berstatus OFFER. Pindahkan lamaran ke OFFER dari halaman Detail
            (isi uang saku dan mode kerja), lalu kembali ke sini.
          </p>
        </GridTile>
        {weights}
      </>
    );
  }

  // Kalau pilihan lama sudah tidak ada (misal dihapus), pakai offer lain yang tersedia.
  const a = offers.find((o) => o.id === aId) ?? offers[0];
  const b = offers.find((o) => o.id === bId && o.id !== a.id) ?? offers.find((o) => o.id !== a.id)!;
  const [sa, sb] = scoreOffers(a, b, kaptenSkills);
  const winner = sa.total >= sb.total ? a : b;
  const loser = winner === a ? b : a;
  const gap = Math.abs(sa.total - sb.total);
  const tie = gap === 0;

  const picker = (c: number, label: string, value: string, other: string, onPick: (id: string) => void) => (
    <GridTile c={c} r={2} w={4} label={label}>
      <span className="k">&gt;/ {label}</span>
      <span className="select-wrap">
        <select value={value} onChange={(e) => onPick(e.target.value)}>
          {offers.filter((o) => o.id !== other).map((o) => <option key={o.id} value={o.id}>{o.company}</option>)}
        </select>
      </span>
    </GridTile>
  );

  const column = (c: number, app: Application, s: OfferScore, isWinner: boolean) => {
    const match = getSkillMatch(app.requiredSkills, kaptenSkills);
    const rows: [string, string, number, number][] = [
      ['/ Uang saku / bulan', formatRupiah(s.salary), s.salaryScore * WEIGHTS.salary, 50],
      ['/ Mode kerja', `${app.workMode} (${s.workModeScore})`, s.workModeScore * WEIGHTS.workMode, 25],
      ['/ Kecocokan skill', `${match.score}% (${match.matchedSkills.length} dari ${app.requiredSkills.length} skill)`, s.skillMatch * WEIGHTS.skill, 25],
    ];
    return (
      <>
        <GridTile c={c} r={3} w={4} label={app.company}>
          <span className="h2">{app.company}</span>
          <span className="xs">{app.role}</span>
        </GridTile>
        {rows.map(([k, v, points, max], i) => (
          <div key={k} style={{ display: 'contents' }}>
            <GridTile c={c} r={4 + i} w={2} label={k}>
              <span className="k">{k}</span>
              <span className="s">{v}</span>
            </GridTile>
            <GridTile c={c + 2} r={4 + i} w={2} label={`Skor ${k}`}>
              <span className="h2">{fmt(points)} / {max}</span>
              <Blocks value={points} max={max} />
            </GridTile>
          </div>
        ))}
        <GridTile c={c} r={7} w={4} h={2} hot={isWinner && !tie} label="Total skor">
          <span className="xs">/ Total skor berbobot</span>
          <span className="big">{fmt(s.total)}</span>
          {isWinner && !tie && <span className="xs">/ Rekomendasi terbaik</span>}
        </GridTile>
      </>
    );
  };

  const wa = winner === a ? sa : sb;
  const wb = winner === a ? sb : sa;
  const deltas: [string, number][] = [
    ['/ Uang saku', (wa.salaryScore - wb.salaryScore) * WEIGHTS.salary],
    ['/ Mode kerja', (wa.workModeScore - wb.workModeScore) * WEIGHTS.workMode],
    ['/ Kecocokan skill', (wa.skillMatch - wb.skillMatch) * WEIGHTS.skill],
  ];
  const short = (app: Application) => app.company.split(' ')[0];

  return (
    <>
      <GridTile c={6} r={1} w={8} label="Bandingkan offer">
        <span className="h1">/ Bandingkan Offer Magang</span>
      </GridTile>

      {picker(6, 'Offer A', a.id, b.id, setAId)}
      {picker(10, 'Offer B', b.id, a.id, setBId)}
      {column(6, a, sa, winner === a)}
      {column(10, b, sb, winner === b)}

      <GridTile c={6} r={9} w={8} h={2} label="Kesimpulan">
        <span className="h1">
          {tie ? '/ Skor kedua offer sama' : `/ ${winner.company} unggul ${fmt(gap)} poin`}
        </span>
        <div className="spread" style={{ marginTop: 10 }}>
          {deltas.map(([label, d]) => (
            <span key={label} style={{ display: 'grid', gap: 4 }}>
              <span className="xs">{label}</span>
              <span className="hx">+{fmt(Math.abs(d))}</span>
              <span className="xs">{d === 0 ? 'sama' : `untuk ${short(d > 0 ? winner : loser)}`}</span>
            </span>
          ))}
        </div>
      </GridTile>

      {weights}
    </>
  );
}
