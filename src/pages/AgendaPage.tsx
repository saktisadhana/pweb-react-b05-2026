import { useState } from 'react';
import { GridButton, GridTile } from '../components/seno/GridTile';
import type { Application } from '../types/application';
import { findInterviewConflicts } from '../utils/interviewConflict';
import { formatTime, monthName, toDateKey } from '../utils/format';

interface AgendaPageProps {
  applications: Application[];
  onOpenDetail: (id: string) => void;
}

type Kind = 'interview' | 'ghosting' | 'applied' | 'wishlist';

interface AgendaEvent {
  kind: Kind;
  app: Application;
  title: string;
  sub: string;
  at: Date;
}

const DAY = 86_400_000;
const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const LONG_DAY = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const KIND_LABEL: Record<Kind, string> = {
  interview: 'Jadwal interview',
  ghosting: 'Mulai rawan ghosting',
  applied: 'Tanggal melamar',
  wishlist: 'Lamaran WISHLIST',
};

function startOfWeek(d: Date): Date {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (s.getDay() + 6) % 7; // Senin = 0
  return new Date(s.getTime() - offset * DAY);
}

// Semua kejadian yang punya tanggal, diturunkan dari data lamaran (tidak disimpan terpisah).
function buildEvents(apps: Application[]): AgendaEvent[] {
  const events: AgendaEvent[] = [];
  for (const app of apps) {
    if (app.status === 'INTERVIEW' && app.interviewDateTime) {
      events.push({ kind: 'interview', app, at: new Date(app.interviewDateTime), title: `${formatTime(app.interviewDateTime)}  ${app.company}`, sub: `Interview, ${app.role}` });
    }
    if (app.status === 'APPLIED' || app.status === 'SCREENING') {
      events.push({ kind: 'ghosting', app, at: new Date(Date.parse(app.lastUpdatedAt) + 14 * DAY), title: app.company, sub: `Mulai rawan ghosting (${app.status}, 14 hari tanpa kabar)` });
    }
    if (app.appliedDate) {
      events.push({ kind: 'applied', app, at: new Date(`${app.appliedDate}T08:00`), title: app.company, sub: `Lamaran dikirim (${app.cvVersion ?? 'CV'})` });
    }
    if (app.status === 'WISHLIST') {
      events.push({ kind: 'wishlist', app, at: new Date(app.lastUpdatedAt), title: app.company, sub: 'Disimpan di Wishlist, belum dilamar' });
    }
  }
  return events.sort((a, b) => a.at.getTime() - b.at.getTime());
}

const toIcsDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

// Bonus: halaman Agenda (layout dari frame "Agenda" di Figma).
export function AgendaPage({ applications, onOpenDetail }: AgendaPageProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  // "Hari ini" diambil sekali saat halaman dibuka (render harus murni, tidak memanggil new Date()).
  const [now] = useState(() => new Date());
  const [show, setShow] = useState<Record<Kind, boolean>>({ interview: true, ghosting: true, applied: true, wishlist: false });

  const start = new Date(startOfWeek(now).getTime() + weekOffset * 7 * DAY);
  const days = Array.from({ length: 7 }, (_, i) => new Date(start.getTime() + i * DAY));
  const end = days[6];

  const events = buildEvents(applications).filter((e) => show[e.kind]);
  // Interview didahulukan supaya dua jadwal yang bentrok tampil berdampingan.
  const byDay = (d: Date) =>
    events
      .filter((e) => toDateKey(e.at) === toDateKey(d))
      .sort((a, b) => Number(b.kind === 'interview') - Number(a.kind === 'interview'));

  const conflicts = findInterviewConflicts(applications, 60).filter((c) => {
    const t = new Date(c.firstApplication.interviewDateTime ?? '');
    return t >= start && t < new Date(end.getTime() + DAY);
  });
  const conflictDay = conflicts[0] ? toDateKey(new Date(conflicts[0].firstApplication.interviewDateTime ?? '')) : null;

  const range = `${start.getDate()}${start.getMonth() !== end.getMonth() ? ` ${monthName(start.getMonth())}` : ''} - ${end.getDate()} ${monthName(end.getMonth())} ${end.getFullYear()}`;

  const downloadIcs = () => {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Aku Mw Magang//SENO//ID'];
    for (const app of applications) {
      if (app.status !== 'INTERVIEW' || !app.interviewDateTime) continue;
      const s = new Date(app.interviewDateTime);
      lines.push(
        'BEGIN:VEVENT',
        `UID:${app.id}@aku-mw-magang`,
        `DTSTAMP:${toIcsDate(new Date())}`,
        `DTSTART:${toIcsDate(s)}`,
        `DTEND:${toIcsDate(new Date(s.getTime() + 60 * 60_000))}`,
        `SUMMARY:Interview ${app.company}`,
        `DESCRIPTION:${app.role}`,
        'END:VEVENT',
      );
    }
    lines.push('END:VCALENDAR');
    const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jadwal-interview.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <GridTile c={6} r={1} w={4} label="Agenda">
        <span className="h1">{range}</span>
      </GridTile>
      <GridButton c={10} r={1} w={2} className="gt--center" onClick={() => setWeekOffset((w) => w - 1)}>
        <span className="s chev">Minggu lalu</span>
      </GridButton>
      <GridButton c={12} r={1} w={2} className="gt--center" onClick={() => setWeekOffset((w) => w + 1)}>
        <span className="s chev">Minggu depan</span>
      </GridButton>

      {conflicts.length > 0 ? (
        <GridTile c={6} r={2} w={8} hot label="Jadwal bentrok">
          <span className="v">
            Interview <b className="dot">{conflicts[0].firstApplication.company}</b> {formatTime(conflicts[0].firstApplication.interviewDateTime ?? '')} dan{' '}
            <b className="dot">{conflicts[0].secondApplication.company}</b> {formatTime(conflicts[0].secondApplication.interviewDateTime ?? '')} di hari{' '}
            {LONG_DAY[new Date(conflicts[0].firstApplication.interviewDateTime ?? '').getDay()]} hanya berjarak {conflicts[0].differenceMinutes} menit.
          </span>
        </GridTile>
      ) : (
        <GridTile c={6} r={2} w={8} label="Jadwal bentrok">
          <span className="s muted">Tidak ada jadwal interview yang bentrok minggu ini.</span>
        </GridTile>
      )}

      {days.map((d, i) => {
        const r = 3 + i;
        const list = byDay(d);
        const isConflict = toDateKey(d) === conflictDay;
        const today = toDateKey(d) === toDateKey(now);
        return (
          <div key={toDateKey(d)} style={{ display: 'contents' }}>
            <GridTile c={6} r={r} hot={isConflict} className={`gt--center${list.length === 0 ? ' gt--quiet' : ''}`} label={`${LONG_DAY[d.getDay()]} ${d.getDate()}`}>
              <span className="xs">{DAY_NAMES[d.getDay()]}</span>
              <span className={`h1${list.length === 0 ? ' muted' : ''}`} style={today ? { color: 'var(--amber)' } : undefined}>{d.getDate()}</span>
            </GridTile>

            {list.length === 0 && (
              <GridTile c={7} r={r} w={7} className="gt--quiet" label="Kosong">
                <span className="xs muted">Tidak ada agenda</span>
              </GridTile>
            )}

            {list.length === 1 && (
              <>
                <GridTile c={7} r={r} w={4} label={list[0].title}>
                  <span className="h3">{list[0].title}</span>
                  <span className="xs">{list[0].sub}</span>
                </GridTile>
                <GridButton c={11} r={r} w={3} className="gt--center" onClick={() => onOpenDetail(list[0].app.id)}>
                  <span className="s chev">Buka lamaran</span>
                </GridButton>
              </>
            )}

            {list.length >= 2 && (
              <>
                {list.slice(0, 2).map((e, j) => (
                  <GridButton key={`${e.kind}-${e.app.id}`} c={7 + j * 3} r={r} w={3} hot={isConflict} onClick={() => onOpenDetail(e.app.id)}>
                    <span className="h3">{e.title}</span>
                    <span className="xs">{e.sub}</span>
                  </GridButton>
                ))}
                <GridButton c={13} r={r} className={`gt--center${isConflict ? ' gt--navy' : ''}`} onClick={() => onOpenDetail(list[isConflict ? 1 : 0].app.id)}>
                  <span className="xs chev">{isConflict ? 'Atur ulang' : list.length > 2 ? `+${list.length - 2} lagi` : 'Buka'}</span>
                </GridButton>
              </>
            )}
          </div>
        );
      })}

      <GridTile c={1} r={4} w={5} h={2} className="gt--top" label="Tampilkan">
        <span className="k">&gt;/ Tampilkan</span>
        {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
          <span key={k} className="spread s" style={{ alignItems: 'center', marginTop: 6 }}>
            {KIND_LABEL[k]}
            <button type="button" role="switch" className="switch" aria-checked={show[k]} aria-label={KIND_LABEL[k]} onClick={() => setShow((s) => ({ ...s, [k]: !s[k] }))} />
          </span>
        ))}
      </GridTile>

      <GridButton c={1} r={6} w={5} className="gt--navy" onClick={downloadIcs}>
        <span className="h3 chev">Unduh ke kalender (.ics)</span>
        <span className="xs">Bisa dibuka di Google Calendar atau Outlook</span>
      </GridButton>
    </>
  );
}
