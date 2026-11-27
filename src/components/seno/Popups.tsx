import { useEffect } from 'react';
import { GridButton, GridTile } from './GridTile';
import type { Application } from '../../types/application';
import { findInterviewConflicts } from '../../utils/interviewConflict';
import { isAtRiskOfGhosting } from '../../utils/ghosting';
import { formatShortDate } from '../../utils/format';
import { SHORTCUTS } from '../../data/shortcuts';

// Popup dibangun dari tile grid juga (sesuai frame popup di Figma), di atas lapisan blur.
const FOCUSABLE = 'input, select, textarea, button:not(:disabled), [tabindex="0"]';

export function Scrim({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Fokus masuk ke popup saat dibuka, Tab berputar di dalam popup, dan fokus kembali ke
  // tombol pemicunya saat popup ditutup.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
    const items = () => [...(dialog()?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    if (!dialog()?.contains(document.activeElement)) items()[0]?.focus({ preventScroll: true });

    const onTab = (e: KeyboardEvent) => {
      const list = items();
      if (e.key !== 'Tab' || list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const inside = dialog()?.contains(document.activeElement);
      if (!inside || (e.shiftKey && document.activeElement === first)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus({ preventScroll: true });
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    window.addEventListener('keydown', onTab);
    return () => {
      window.removeEventListener('keydown', onTab);
      opener?.focus({ preventScroll: true });
    };
  }, []);
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

export function KeyCaps({ keys }: { keys: string[] }) {
  return (
    <span className="kbds">
      {keys.map((k) => (
        <kbd key={k} className="kbd">{k}</kbd>
      ))}
    </span>
  );
}

// Popup tombol "?": semua shortcut dalam dua kolom tile.
export function ShortcutPopup({ onClose }: { onClose: () => void }) {
  const half = Math.ceil(SHORTCUTS.length / 2);
  return (
    <>
      <Scrim onClose={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Shortcut keyboard">
        <GridTile c={6} r={1} w={7} className="popup" label="Shortcut keyboard">
          <span className="h2">Shortcut keyboard</span>
          <span className="xs muted">Tidak aktif saat sedang mengetik di kolom isian.</span>
        </GridTile>
        <GridButton c={13} r={1} className="popup gt--center" onClick={onClose} ariaLabel="Tutup">
          <span className="s chev">Tutup</span>
        </GridButton>
        {SHORTCUTS.map((s, i) => (
          <GridTile key={s.label} c={i < half ? 6 : 10} r={2 + (i % half)} w={4} className="popup gt--row sc-tile" label={s.label}>
            <KeyCaps keys={s.keys} />
            <span className="s">{s.label}</span>
          </GridTile>
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
