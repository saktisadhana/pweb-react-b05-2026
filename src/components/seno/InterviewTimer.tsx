import { useEffect, useState } from 'react';
import { GridButton, GridTile } from './GridTile';
import { INTERVIEW_QUESTIONS } from '../../data/interviewQuestions';

const DURATION_SECONDS = 120; // 02:00 per soal

const formatClock = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

interface InterviewTimerProps {
  questions?: string[];
}

// Fitur 5 (Sakti). Posisi tile mengikuti frame Detail di Figma:
// soal (10,4, 4x4), jam (10,8, 2x2), jeda (12,8, 2), reset (12,9), lanjut (13,9).
export function InterviewTimer({ questions = INTERVIEW_QUESTIONS }: InterviewTimerProps) {
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(DURATION_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const isDone = secondsLeft === 0;

  // Interval hanya hidup selama timer jalan. Cleanup menghapus interval saat
  // pause, saat waktu habis, dan saat halaman ditinggal (unmount),
  // jadi tidak ada interval dobel yang membuat detik jalan 2x lebih cepat.
  useEffect(() => {
    if (!isRunning || isDone) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRunning, isDone]);

  const reset = () => {
    setSecondsLeft(DURATION_SECONDS);
    setIsRunning(false);
  };

  const next = () => {
    setIndex((i) => (i + 1) % questions.length);
    reset();
  };

  const running = isRunning && !isDone;

  return (
    <>
      <GridTile c={10} r={4} w={4} h={4} className="gt--top" label="Latihan interview">
        <div className="spread">
          <span className="h2">/ Latihan interview</span>
          <span className="xs">Soal {index + 1} / {questions.length}</span>
        </div>
        {/* key: animasi masuk diputar ulang setiap ganti soal */}
        <p key={index} className="question" style={{ marginTop: 14, animation: 'gt-in .5s var(--ease) both' }}>
          "{questions[index]}"
        </p>
        <span className="seg" style={{ marginTop: 'auto' }} aria-hidden="true">
          {questions.map((q, i) => (
            <i key={q} className={i < index ? 'on' : i === index ? 'cur' : ''} />
          ))}
        </span>
      </GridTile>

      <GridTile c={10} r={8} w={2} h={2} className="gt--center" label="Sisa waktu">
        <span className={`clock${isDone ? ' is-done' : ''}`} role="timer">{formatClock(secondsLeft)}</span>
        <span className="xs" role="status">{isDone ? '/ waktu habis' : '/ sisa waktu'}</span>
        <span className="bar" style={{ width: '70%' }}>
          <i style={{ width: `${(secondsLeft / DURATION_SECONDS) * 100}%` }} />
        </span>
      </GridTile>

      <GridButton c={12} r={8} w={2} hot={running} className="gt--center" onClick={() => setIsRunning((r) => !r)} disabled={isDone}>
        <span className="h2 chev">{running ? 'Jeda' : secondsLeft < DURATION_SECONDS ? 'Lanjutkan' : 'Mulai'}</span>
      </GridButton>

      <GridButton c={12} r={9} className="gt--center" onClick={reset}>
        <span className="s chev">Reset</span>
      </GridButton>

      <GridButton c={13} r={9} className="gt--center" onClick={next}>
        <span className="s chev">Lanjut</span>
      </GridButton>
    </>
  );
}
