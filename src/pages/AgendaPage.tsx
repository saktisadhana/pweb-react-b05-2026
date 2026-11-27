import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { GridButton, GridTile } from '../components/seno/GridTile';
import type { Application } from '../types/application';
import { findInterviewConflicts } from '../utils/interviewConflict';
import { formatShortDate, formatTime, toDateKey } from '../utils/format';
import { addDays, addMonths, formatDayTitle, isSameMonth, MONTHS_LONG, monthGrid, parseDateKey, WEEKDAYS_SHORT } from '../utils/calendar';

interface AgendaPageProps {
  applications: Application[];
  onOpenDetail: (id: string) => void;
  // Hari yang dipilih ("YYYY-MM-DD") disimpan di App supaya shortcut [ dan ] bisa ganti bulan.
  day: string;
  today: string;
  onDayChange: (key: string) => void;
}

type Kind = 'interview' | 'ghosting' | 'applied' | 'wishlist';

interface AgendaEvent {
  kind: Kind;
  app: Application;
  at: Date;
  sub: string;
}

const DAY = 86_400_000;
const KINDS: Kind[] = ['interview', 'ghosting', 'applied', 'wishlist'];
const KIND_LABEL: Record<Kind, string> = {
  interview: 'Interview',
  ghosting: 'Rawan ghosting',
  applied: 'Melamar',
  wishlist: 'Wishlist',
};

// Semua kejadian diturunkan dari data lamaran (tidak disimpan terpisah).
function buildEvents(apps: Application[]): AgendaEvent[] {
  const events: AgendaEvent[] = [];
  for (const app of apps) {
    if (app.status === 'INTERVIEW' && app.interviewDateTime) {
      events.push({ kind: 'interview', app, at: new Date(app.interviewDateTime), sub: `Interview ${app.role}` });
    }
    if (app.status === 'APPLIED' || app.status === 'SCREENING') {
      events.push({ kind: 'ghosting', app, at: new Date(Date.parse(app.lastUpdatedAt) + 14 * DAY), sub: `${app.status} 14 hari tanpa kabar, kirim follow-up` });
    }
    if (app.appliedDate) {
      events.push({ kind: 'applied', app, at: new Date(`${app.appliedDate}T08:00`), sub: `Lamaran dikirim (${app.cvVersion ?? 'CV'})` });
    }
    if (app.status === 'WISHLIST') {
      events.push({ kind: 'wishlist', app, at: new Date(app.lastUpdatedAt), sub: 'Disimpan di Wishlist, belum dilamar' });
    }
  }
  // Interview didahulukan, lalu urut jam, supaya jadwal penting selalu terlihat di sel kalender.
  return events.sort((a, b) => Number(b.kind === 'interview') - Number(a.kind === 'interview') || a.at.getTime() - b.at.getTime());
}

const toIcsDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

function downloadIcs(applications: Application[]) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Seno Magang Portal//SENO//ID'];
  for (const app of applications) {
    if (app.status !== 'INTERVIEW' || !app.interviewDateTime) continue;
    const s = new Date(app.interviewDateTime);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${app.id}@seno-magang-portal`,
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
}

const evLabel = (e: AgendaEvent) => (e.kind === 'interview' ? `${formatTime(e.at.toISOString())} ${e.app.company}` : e.app.company);

// Bonus: halaman Agenda, kalender bulanan (Senin sampai Minggu, 6 minggu).
export function AgendaPage({ applications, onOpenDetail, day, today, onDayChange }: AgendaPageProps) {
  const [show, setShow] = useState<Record<Kind, boolean>>({ interview: true, ghosting: true, applied: true, wishlist: false });
  const gridRef = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);

  const selected = parseDateKey(day);
  const cells = monthGrid(day);
  const weeks = Array.from({ length: 6 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  const events = buildEvents(applications).filter((e) => show[e.kind]);
  const byDay = new Map<string, AgendaEvent[]>();
  for (const e of events) {
    const key = toDateKey(e.at);
    byDay.set(key, [...(byDay.get(key) ?? []), e]);
  }
  const dayList = byDay.get(day) ?? [];
  // Hari kosong: tampilkan agenda terdekat setelahnya, supaya panel tetap berguna.
  const upcoming = dayList.length === 0 ? events.filter((e) => toDateKey(e.at) > day).sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 4) : [];
  const monthCount = events.filter((e) => isSameMonth(e.at, selected)).length;

  const conflicts = findInterviewConflicts(applications, 60).filter((c) => isSameMonth(new Date(c.firstApplication.interviewDateTime ?? ''), selected));
  const conflictDays = new Set(conflicts.map((c) => toDateKey(new Date(c.firstApplication.interviewDateTime ?? ''))));

  // Fokus ikut pindah hanya kalau perpindahan berasal dari keyboard di dalam kalender.
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${day}"]`)?.focus();
  }, [day]);

  const moveTo = (key: string) => {
    moveFocus.current = true;
    onDayChange(key);
  };

  const onGridKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (step !== undefined) moveTo(addDays(day, step));
    else if (e.key === 'PageUp' || e.key === 'PageDown') moveTo(addMonths(day, e.key === 'PageUp' ? -1 : 1));
    else if (e.key === 'Home') moveTo(today);
    else return;
    e.preventDefault();
  };

  const title = `${MONTHS_LONG[selected.getMonth()]} ${selected.getFullYear()}`;
  const first = conflicts[0];

  return (
    <>
      <GridTile c={6} r={1} w={4} label="Agenda">
        <span className="h1">{title}</span>
        <span className="xs muted">{monthCount === 0 ? 'Belum ada agenda bulan ini' : `${monthCount} agenda bulan ini`}</span>
      </GridTile>
      <GridButton c={10} r={1} className="gt--center" ariaLabel="Bulan sebelumnya" onClick={() => onDayChange(addMonths(day, -1))}>
        <span className="h2" aria-hidden="true">&lt;</span>
        <span className="kbd" aria-hidden="true">[</span>
      </GridButton>
      <GridButton c={11} r={1} w={2} className="gt--center" onClick={() => onDayChange(today)}>
        <span className="s chev">Hari ini</span>
      </GridButton>
      <GridButton c={13} r={1} className="gt--center" ariaLabel="Bulan berikutnya" onClick={() => onDayChange(addMonths(day, 1))}>
        <span className="h2" aria-hidden="true">&gt;</span>
        <span className="kbd" aria-hidden="true">]</span>
      </GridButton>

      <GridTile c={6} r={2} w={8} h={7} className="cal-tile" label={`Kalender ${title}`}>
        <div className="cal" role="grid" aria-label={`Kalender ${title}`} ref={gridRef} onKeyDown={onGridKey}>
          <div className="cal__head" role="row">
            {WEEKDAYS_SHORT.map((w) => (
              <span key={w} role="columnheader">{w}</span>
            ))}
          </div>
          {weeks.map((week) => (
            <div key={toDateKey(week[0])} className="cal__week" role="row">
              {week.map((d, i) => {
                const key = toDateKey(d);
                const list = byDay.get(key) ?? [];
                const cls = [
                  'cal__cell',
                  i >= 5 && 'is-weekend',
                  !isSameMonth(d, selected) && 'is-out',
                  key === today && 'is-today',
                  key === day && 'is-selected',
                  conflictDays.has(key) && 'is-conflict',
                ].filter(Boolean).join(' ');
                return (
                  <div key={key} role="gridcell" aria-selected={key === day} className={cls} onClick={() => onDayChange(key)}>
                    <button
                      type="button"
                      className="cal__num"
                      data-day={key}
                      tabIndex={key === day ? 0 : -1}
                      aria-label={`${formatDayTitle(d)}${key === today ? ' (hari ini)' : ''}, ${list.length} agenda`}
                      onClick={() => onDayChange(key)}
                    >
                      {d.getDate()}
                    </button>
                    {list.length > 0 && (
                      <div className="cal__events">
                        {list.map((e) => (
                          <button
                            key={`${e.kind}-${e.app.id}`}
                            type="button"
                            tabIndex={-1}
                            className={`cal-ev cal-ev--${e.kind}`}
                            title={`${KIND_LABEL[e.kind]}: ${e.app.company}`}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              onOpenDetail(e.app.id);
                            }}
                          >
                            {evLabel(e)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </GridTile>

      <GridTile c={6} r={9} w={5} className="gt--row" label="Tampilkan jenis agenda">
        <span className="k">Tampilkan</span>
        <span className="chips cal-keys">
          {KINDS.map((k) => (
            <button key={k} type="button" className={`chip cal-key cal-key--${k}`} aria-pressed={show[k]} onClick={() => setShow((s) => ({ ...s, [k]: !s[k] }))}>
              <i aria-hidden="true" />
              {KIND_LABEL[k]}
            </button>
          ))}
        </span>
      </GridTile>
      <GridButton c={11} r={9} w={3} className="gt--navy" onClick={() => downloadIcs(applications)}>
        <span className="h3 chev">Unduh jadwal (.ics)</span>
        <span className="xs">Buka di Google Calendar atau Outlook</span>
      </GridButton>

      <GridTile c={1} r={4} w={5} h={4} className="gt--top" label="Agenda hari dipilih">
        <span className="h3">{formatDayTitle(selected)}</span>
        <span className="xs muted">{day === today ? 'Hari ini' : 'Pilih tanggal lain di kalender, atau pakai tombol panah'}</span>
        <div className="scroll-inner day-list" tabIndex={0} aria-label="Daftar agenda hari dipilih">
          {dayList.length === 0 && (
            <p className="s muted">
              Tidak ada agenda. Lamaran berstatus INTERVIEW dengan jadwal, tanggal melamar, dan batas follow-up muncul di sini.
            </p>
          )}
          {upcoming.length > 0 && <span className="k day-list__next">Agenda berikutnya</span>}
          {upcoming.map((e) => (
            <button key={`${e.kind}-${e.app.id}`} type="button" className={`day-ev day-ev--${e.kind}`} onClick={() => onDayChange(toDateKey(e.at))}>
              <span className="day-ev__tag">{`${e.at.getDate()} ${MONTHS_LONG[e.at.getMonth()].slice(0, 3)}`}</span>
              <span className="day-ev__name">{e.app.company}</span>
              <span className="day-ev__sub">{KIND_LABEL[e.kind]}{e.kind === 'interview' ? ` ${formatTime(e.at.toISOString())}` : ''}, pilih tanggal ini</span>
            </button>
          ))}
          {dayList.map((e) => (
            <button key={`${e.kind}-${e.app.id}`} type="button" className={`day-ev day-ev--${e.kind}`} onClick={() => onOpenDetail(e.app.id)}>
              <span className="day-ev__tag">{e.kind === 'interview' ? formatTime(e.at.toISOString()) : KIND_LABEL[e.kind]}</span>
              <span className="day-ev__name">{e.app.company}</span>
              <span className="day-ev__sub">{e.sub}</span>
            </button>
          ))}
        </div>
      </GridTile>

      {first ? (
        <GridButton c={1} r={8} w={5} hot onClick={() => onDayChange(toDateKey(new Date(first.firstApplication.interviewDateTime ?? '')))}>
          <span className="h3 chev">Jadwal bentrok</span>
          <span className="xs">
            {first.firstApplication.company} {formatShortDate(first.firstApplication.interviewDateTime ?? '')} dan {first.secondApplication.company} hanya berjarak {first.differenceMinutes} menit.
          </span>
        </GridButton>
      ) : (
        <GridTile c={1} r={8} w={5} className="gt--quiet" label="Jadwal bentrok">
          <span className="s">Tidak ada interview bentrok</span>
          <span className="xs muted">Dicek untuk {title}, jarak minimal 60 menit.</span>
        </GridTile>
      )}
    </>
  );
}
