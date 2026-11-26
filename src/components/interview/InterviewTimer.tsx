import { useEffect, useState } from 'react';
import { INTERVIEW_QUESTIONS } from '../../data/interviewQuestions';

const DURATION_SECONDS = 120; // 02:00 per soal

const formatTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

interface InterviewTimerProps {
  questions?: string[];
}

export function InterviewTimer({ questions = INTERVIEW_QUESTIONS }: InterviewTimerProps) {
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(DURATION_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const isDone = secondsLeft === 0;

  // Satu interval hanya hidup selama timer jalan. Cleanup wajib: saat pause,
  // saat waktu habis, dan saat panel ditutup (unmount), interval dihapus,
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

  const nextQuestion = () => {
    setIndex((i) => (i + 1) % questions.length);
    reset();
  };

  const progress = secondsLeft / DURATION_SECONDS;

  return (
    <section className="timer" aria-labelledby="timer-title">
      <header className="timer__head">
        <h3 id="timer-title" className="h-dot">/ Latihan interview</h3>
        <span className="muted">Soal {index + 1} / {questions.length}</span>
      </header>

      <p className="timer__question">"{questions[index]}"</p>

      <div className="timer__steps" aria-hidden="true">
        {questions.map((q, i) => (
          <span key={q} className={i < index ? 'is-done' : i === index ? 'is-current' : ''} />
        ))}
      </div>

      <div className="timer__row">
        <div className={`timer__clock${isDone ? ' is-done' : ''}`}>
          <span className="timer__time">{formatTime(secondsLeft)}</span>
          <span className="timer__bar"><span style={{ width: `${progress * 100}%` }} /></span>
          <span className="muted" role="status">{isDone ? 'Waktu habis' : '/ sisa waktu'}</span>
        </div>

        <div className="timer__actions">
          <button
            type="button"
            className={isRunning && !isDone ? 'btn btn--amber' : 'btn btn--navy'}
            onClick={() => setIsRunning((r) => !r)}
            disabled={isDone}
          >
            &gt; {isRunning && !isDone ? 'Pause' : 'Start'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={reset}>&gt; Reset</button>
          <button type="button" className="btn btn--ghost" onClick={nextQuestion}>&gt; Soal berikutnya</button>
        </div>
      </div>
    </section>
  );
}
