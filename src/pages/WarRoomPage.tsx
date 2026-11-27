import { useState, type CSSProperties, type RefObject } from 'react';
import { GridButton, GridTile } from '../components/seno/GridTile';
import { ConflictTile } from '../components/seno/ConflictTile';
import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from '../types/application';
import { computeDashboardStats } from '../utils/dashboardStats';
import { getSkillMatch } from '../utils/application';
import { getChecklistProgress } from '../utils/stateMachine';
import { isAtRiskOfGhosting } from '../utils/ghosting';
import { formatShortDate, formatJuta } from '../utils/format';

type SortKey = 'terbaru' | 'terlama' | 'match' | 'az';

interface WarRoomPageProps {
  applications: Application[];
  kaptenSkills: string[];
  onOpenDetail: (id: string) => void;
  onDelete: (id: string) => void;
  onSimulateGhosting: (id: string) => void;
  onAdd: () => void;
  onOpenAgenda: () => void;
  searchRef: RefObject<HTMLInputElement | null>;
}

const SORT_LABEL: Record<SortKey, string> = {
  terbaru: 'Terbaru',
  terlama: 'Terlama',
  match: 'Match tertinggi',
  az: 'Perusahaan A-Z',
};

export function WarRoomPage({ applications, kaptenSkills, onOpenDetail, onDelete, onSimulateGhosting, onAdd, onOpenAgenda, searchRef }: WarRoomPageProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [sort, setSort] = useState<SortKey>('terbaru');
  const [ghostOnly, setGhostOnly] = useState(false);

  // Derived state: statistik dan daftar dihitung ulang dari applications setiap render.
  const stats = computeDashboardStats(applications);
  const matchOf = (a: Application) => getSkillMatch(a.requiredSkills, kaptenSkills).score;

  const q = query.trim().toLowerCase();
  const visible = applications
    .filter((a) => status === 'ALL' || a.status === status)
    .filter((a) => !ghostOnly || isAtRiskOfGhosting(a))
    .filter((a) => !q || a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q))
    .sort((a, b) => {
      if (sort === 'match') return matchOf(b) - matchOf(a);
      if (sort === 'az') return a.company.localeCompare(b.company);
      const diff = Date.parse(b.lastUpdatedAt) - Date.parse(a.lastUpdatedAt);
      return sort === 'terbaru' ? diff : -diff;
    });

  const statRows: [string, string, boolean][] = [
    ['Total lamaran', String(stats.total), false],
    ['Response rate', `${stats.responseRate}%`, false],
    ['Interview rate', `${stats.interviewRate}%`, false],
    ['Rawan ghosting', String(stats.ghostingRisk), stats.ghostingRisk > 0],
    ['Total offer', String(stats.totalOffer), false],
  ];

  return (
    <>
      <ConflictTile applications={applications} onOpen={onOpenAgenda} />

      <GridTile c={6} r={2} w={3} label="Cari">
        <span className="k">&gt;/ Cari</span>
        <input
          ref={searchRef}
          className="field-input"
          placeholder="Perusahaan atau posisi..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </GridTile>

      <GridTile c={9} r={2} w={2} label="Filter status">
        <span className="k">&gt;/ Status</span>
        <span className="select-wrap">
          <select value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus | 'ALL')}>
            <option value="ALL">Semua Status</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </span>
      </GridTile>

      <GridTile c={11} r={2} w={3} label="Urutkan">
        <span className="k">&gt;/ Urutkan</span>
        <span className="select-wrap">
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="dot">
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <option key={k} value={k}>{SORT_LABEL[k]}</option>
            ))}
          </select>
        </span>
      </GridTile>

      <GridTile c={6} r={3} w={3} className="gt--row" label="Filter ghosting">
        <span className="s">/ Hanya rawan ghosting</span>
        <button
          type="button"
          role="switch"
          className="switch"
          aria-checked={ghostOnly}
          aria-label="Hanya rawan ghosting"
          onClick={() => setGhostOnly((v) => !v)}
        />
      </GridTile>

      <GridTile c={9} r={3} w={3} label="Jumlah lamaran">
        <span className="h2">{visible.length} lamaran</span>
        <span className="xs muted">/ diurutkan dari yang {SORT_LABEL[sort].toLowerCase()}</span>
      </GridTile>

      <GridButton c={12} r={3} w={2} className="gt--center" onClick={onAdd}>
        <span className="h3 chev">+ Tambah lamaran</span>
      </GridButton>

      {statRows.map(([label, value, hot], i) => (
        <GridTile key={label} c={1} r={4 + i} w={5} hot={hot} className="gt--row" label={label}>
          <span className="s">{label}</span>
          <span className="h2">{value}</span>
        </GridTile>
      ))}

      <div className="rows" role="list" aria-label="Daftar lamaran">
        {visible.length === 0 && (
          <div className="gt cell empty-note" style={{ height: 'auto' }}>
            <p className="h3">/ Tidak ada lamaran yang cocok</p>
            <p className="s muted">Coba ubah kata kunci atau filter.</p>
          </div>
        )}
        {visible.map((a, i) => (
          <AppRow
            key={a.id}
            index={i}
            app={a}
            match={matchOf(a)}
            onOpenDetail={onOpenDetail}
            onDelete={onDelete}
            onSimulateGhosting={onSimulateGhosting}
          />
        ))}
      </div>
    </>
  );
}

interface AppRowProps {
  app: Application;
  index: number;
  match: number;
  onOpenDetail: (id: string) => void;
  onDelete: (id: string) => void;
  onSimulateGhosting: (id: string) => void;
}

function AppRow({ app, index, match, onOpenDetail, onDelete, onSimulateGhosting }: AppRowProps) {
  const progress = getChecklistProgress(app.checklist);
  const atRisk = isAtRiskOfGhosting(app);
  const canAge = app.status === 'APPLIED' || app.status === 'SCREENING';
  const delay = { '--d': `${120 + index * 45}ms` } as CSSProperties;

  let statusDetail = '';
  if (app.status === 'OFFER' && app.salaryOffer) statusDetail = `Rp ${formatJuta(app.salaryOffer)}`;
  else if (app.status === 'INTERVIEW' && app.interviewDateTime) statusDetail = formatShortDate(app.interviewDateTime);
  else if (atRisk) statusDetail = 'Rawan ghosting';

  return (
    <div className="row" role="listitem">
      <div className="gt cell" style={delay}>
        <span className="h3">{match}%</span>
        <span className={`bar ${match >= 75 ? 'bar--green' : 'bar--amber'}`}><i style={{ width: `${match}%` }} /></span>
      </div>

      <button type="button" className="gt gt--btn cell info" style={delay} onClick={() => onOpenDetail(app.id)}>
        <span className="h3">{app.company}</span>
        <span className="xs">{app.role}</span>
        <span className="xs muted">{app.cvVersion ? `CV: ${app.cvVersion}` : 'Belum dilamar'}</span>
      </button>

      <div className={`gt cell st${atRisk ? ' is-hot' : ''}`} style={delay}>
        <span>/ {app.status}</span>
        {statusDetail && <span className="muted">{statusDetail}</span>}
      </div>

      <div className="gt cell" style={delay}>
        <span className="h3">{progress.completed}/{progress.total}</span>
        <span className="bar"><i style={{ width: `${progress.percentage}%` }} /></span>
      </div>

      {canAge && !atRisk ? (
        <button type="button" className="gt gt--btn cell act" style={delay} onClick={() => onSimulateGhosting(app.id)}>
          <span className="chev">Simulasi +15 hari</span>
        </button>
      ) : (
        <button type="button" className="gt gt--btn cell act" style={delay} onClick={() => onOpenDetail(app.id)}>
          <span className="chev">{app.status === 'WISHLIST' ? 'Lamar' : 'Detail'}</span>
        </button>
      )}

      <button
        type="button"
        className="gt gt--btn cell act"
        style={delay}
        onClick={() => onDelete(app.id)}
        aria-label={`Hapus lamaran ${app.company}`}
      >
        <span className="chev">Hapus</span>
      </button>
    </div>
  );
}
