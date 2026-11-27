import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  value: string; // teks berisi satu angka, misal "95.0" atau "42%"
  ms?: number;
}

const NUMBER = /-?\d+(?:\.\d+)?/;
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// Angka berjalan dari nilai sebelumnya (awal: 0) ke nilai baru. Hanya komponen
// kecil ini yang render ulang tiap frame, bukan halamannya.
export function CountUp({ value, ms = 700 }: CountUpProps) {
  const match = value.match(NUMBER);
  const target = match ? Number(match[0]) : 0;
  const hasNumber = match !== null;
  const decimals = match?.[0].split('.')[1]?.length ?? 0;
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (!hasNumber) return;
    const start = performance.now();
    const begin = from.current;
    const duration = reduceMotion() ? 0 : ms;
    let frame = 0;
    const tick = (now: number) => {
      const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      const next = begin + (target - begin) * eased;
      from.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [hasNumber, target, ms]);

  if (!match) return <>{value}</>;
  const text = shown.toFixed(decimals);
  return (
    <span className="countup">
      {value.slice(0, match.index)}
      {text}
      {value.slice((match.index ?? 0) + match[0].length)}
    </span>
  );
}
