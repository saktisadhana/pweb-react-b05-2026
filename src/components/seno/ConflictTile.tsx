import { GridTile } from './GridTile';
import type { Application } from '../../types/application';
import { findInterviewConflicts } from '../../utils/interviewConflict';
import { formatShortDate } from '../../utils/format';

interface ConflictTileProps {
  applications: Application[];
  onOpen: () => void;
}

// Banner di baris atas War Room (6,1, lebar 8). Glow kuning kalau ada jadwal bentrok.
export function ConflictTile({ applications, onOpen }: ConflictTileProps) {
  const conflicts = findInterviewConflicts(applications, 60);

  if (conflicts.length === 0) {
    return (
      <GridTile c={6} r={1} w={8} className="gt--row" label="Jadwal interview">
        <span className="s muted">Tidak ada jadwal interview yang bentrok.</span>
        <button type="button" className="chip" onClick={onOpen}>
          <span className="chev">Agenda</span>
        </button>
      </GridTile>
    );
  }

  const { firstApplication: a, secondApplication: b, differenceMinutes } = conflicts[0];
  const more = conflicts.length > 1 ? ` (+${conflicts.length - 1} bentrok lain)` : '';

  return (
    <GridTile c={6} r={1} w={8} hot className="gt--row" label="Jadwal interview bentrok">
      <p className="v">
        Interview <b className="dot">{a.company}</b> ({formatShortDate(a.interviewDateTime ?? '')}) dan{' '}
        <b className="dot">{b.company}</b> ({formatShortDate(b.interviewDateTime ?? '')}) hanya berjarak {differenceMinutes} menit.{more}
      </p>
      <button type="button" className="chip" onClick={onOpen}>
        <span className="chev">Agenda</span>
      </button>
    </GridTile>
  );
}
