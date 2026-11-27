import { useEffect } from 'react';
import { GridButton, GridTile } from './GridTile';
import type { Application } from '../../types/application';
import { findInterviewConflicts } from '../../utils/interviewConflict';
import { isAtRiskOfGhosting } from '../../utils/ghosting';
import { formatShortDate } from '../../utils/format';

// Popup dibangun dari tile grid juga (sesuai frame popup di Figma), di atas lapisan blur.
export function Scrim({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return <div className="scrim" onClick={onClose} aria-hidden="true" />;
}

interface NotifPopupProps {
  applications: Application[];
  onOpenDetail: (id: string) => void;
  onClose: () => void;
}

// Daftar notifikasi dari tile "!": jadwal bentrok + lamaran rawan ghosting.
export function NotifPopup({ applications, onOpenDetail, onClose }: NotifPopupProps) {
  const conflicts = findInterviewConflicts(applications, 60);
  const ghosting = applications.filter((a) => isAtRiskOfGhosting(a));
  const items = [
    ...conflicts.map((c) => ({
      id: `c-${c.firstApplication.id}-${c.secondApplication.id}`,
      title: 'Jadwal interview bentrok',
      text: `${c.firstApplication.company} (${formatShortDate(c.firstApplication.interviewDateTime ?? '')}) dan ${c.secondApplication.company}, selisih ${c.differenceMinutes} menit.`,
      appId: c.secondApplication.id,
      hot: true,
    })),
    ...ghosting.map((a) => ({
      id: `g-${a.id}`,
      title: `${a.company} rawan ghosting`,
      text: `Status ${a.status}, lebih dari 14 hari tanpa kabar. Coba kirim follow-up.`,
      appId: a.id,
      hot: false,
    })),
  ];

  return (
    <>
      <Scrim onClose={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Notifikasi">
        <GridTile c={6} r={1} w={7} className="popup" label="Notifikasi">
          <span className="v">{items.length} notifikasi</span>
        </GridTile>
        <GridButton c={13} r={1} className="popup gt--center" onClick={onClose} ariaLabel="Tutup">
          <span className="s chev">Tutup</span>
        </GridButton>
        {items.length === 0 && (
          <GridTile c={6} r={2} w={8} className="popup" label="Kosong">
            <span className="s muted">Tidak ada notifikasi. Semua aman.</span>
          </GridTile>
        )}
        {items.slice(0, 7).map((n, i) => (
          <GridButton key={n.id} c={6} r={2 + i} w={8} hot={n.hot} className="popup" onClick={() => onOpenDetail(n.appId)}>
            <span className="h3">{n.title}</span>
            <span className="xs">{n.text}</span>
          </GridButton>
        ))}
      </div>
    </>
  );
}

interface UndoToastProps {
  company: string;
  onUndo: () => void;
}

// Fitur 6 (Sakti): toast undo 5 detik. Timer-nya ada di useUndoDelete (Al).
// Bar kuning di bawah menyusut 5 detik sebagai penanda waktu.
export function UndoToast({ company, onUndo }: UndoToastProps) {
  return (
    <GridTile c={6} r={10} w={8} hot className="toast gt--row" label="Lamaran dihapus">
      <span className="s" role="status">Lamaran {company} dihapus.</span>
      <button type="button" className="chip is-on" onClick={onUndo}>Undo</button>
      <i className="timebar" aria-hidden="true" />
    </GridTile>
  );
}
