import type { Application } from '../../types/application';
import { findInterviewConflicts } from '../../utils/interviewConflict';

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

interface ConflictBannerProps {
  applications: Application[]; // selalu SEMUA lamaran, bukan hasil filter
}

export function ConflictBanner({ applications }: ConflictBannerProps) {
  let conflicts;
  try {
    conflicts = findInterviewConflicts(applications);
  } catch (error) {
    // Data INTERVIEW tanpa jadwal yang valid: tampilkan, jangan bikin app crash.
    return (
      <div className="tile tile--hot banner" role="alert">
        <strong className="h-dot">/ Ada jadwal interview yang tidak valid</strong>
        <span className="muted">{error instanceof Error ? error.message : String(error)}</span>
      </div>
    );
  }

  if (conflicts.length === 0) return null;

  return (
    <div className="tile tile--hot banner" role="alert">
      <strong className="h-dot">/ Jadwal interview bentrok</strong>
      {conflicts.map((c) => (
        <span key={`${c.firstApplication.id}-${c.secondApplication.id}`}>
          {c.firstApplication.company} ({formatTime(c.firstApplication.interviewDateTime ?? '')}) dan{' '}
          {c.secondApplication.company} ({formatTime(c.secondApplication.interviewDateTime ?? '')}) berselisih{' '}
          {Math.round(c.differenceMinutes)} menit.
        </span>
      ))}
    </div>
  );
}
