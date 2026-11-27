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
      <GridTile c={6} r={1} w={8} label="Jadwal interview">
        <span className="h2">/ Jadwal interview aman</span>
        <span className="s muted">Tidak ada dua interview yang jaraknya kurang dari 60 menit.</span>
      </GridTile>
    );
  }

  const { firstApplication: a, secondApplication: b, differenceMinutes } = conflicts[0];
  const more = conflicts.length > 1 ? ` (+${conflicts.length - 1} bentrok lain)` : '';

  return (
    <GridTile c={6} r={1} w={8} hot className="gt--row" label="Jadwal interview bentrok">
      <div>
        <p className="h2">/ Jadwal interview bentrok</p>
        <p className="s">
          {a.company} ({formatShortDate(a.interviewDateTime ?? '')}) dan {b.company} ({formatShortDate(b.interviewDateTime ?? '')}) berselisih {differenceMinutes} menit.{more}
        </p>
      </div>
      <button type="button" className="chip" onClick={onOpen}>
        <span className="chev">Lihat</span>
      </button>
    </GridTile>
  );
}
