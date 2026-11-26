export type Page = 'explore' | 'warroom' | 'offer';

const NAV: { page: Page; label: string }[] = [
  { page: 'explore', label: 'Eksplorasi Lowongan' },
  { page: 'warroom', label: 'War Room' },
  { page: 'offer', label: 'Bandingkan Offer' },
];

interface SidebarProps {
  current: Page;
  onNavigate: (page: Page) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  ghostingCount: number;
}

export function Sidebar({ current, onNavigate, theme, onToggleTheme, ghostingCount }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="brand">Aku Mw Magang</span>
        <span className="muted">Pelacak lamaran Kapten</span>
      </div>

      <nav className="sidebar__nav" aria-label="Menu utama">
        {NAV.map((n) => (
          <button
            key={n.page}
            type="button"
            className={`nav-tile${current === n.page ? ' is-current' : ''}`}
            aria-current={current === n.page ? 'page' : undefined}
            onClick={() => onNavigate(n.page)}
          >
            <span className="nav-tile__prefix">&gt;</span> {n.label}
            {n.page === 'warroom' && ghostingCount > 0 && (
              <span className="nav-tile__count" aria-label={`${ghostingCount} rawan ghosting`}>{ghostingCount}</span>
            )}
          </button>
        ))}
      </nav>

      <button type="button" className="theme-toggle" onClick={onToggleTheme} aria-pressed={theme === 'dark'}>
        / Mode gelap <span className={`switch${theme === 'dark' ? ' is-on' : ''}`} aria-hidden="true" />
      </button>
    </aside>
  );
}
