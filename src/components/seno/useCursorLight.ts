import { useEffect, type RefObject } from 'react';

const SPOT = 280; // jari-jari cahaya (px stage)

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Custom hook: cahaya yang mengikuti kursor di atas tile.
// - Posisi mouse disimpan di variabel lokal effect (bukan state), jadi gerakan
//   mouse tidak membuat React render ulang.
// - Hanya mengubah `transform` dan `opacity`, yang dikerjakan GPU tanpa
//   menggambar ulang tile. Tile sendiri tidak digeser.
// - Loop requestAnimationFrame berhenti sendiri saat cahaya sudah diam, dan
//   cleanup melepas semua listener + frame saat komponen di-unmount.
export function useCursorLight(
  areaRef: RefObject<HTMLElement | null>, // elemen yang memuat cahaya (koordinat stage)
  spotRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    const area = areaRef.current;
    const spot = spotRef.current;
    if (!area || !spot) return;
    if (!enabled || prefersReducedMotion()) {
      spot.style.opacity = '0';
      return;
    }

    let cx = 0;
    let cy = 0;
    let inside = false;
    let light = 0;
    let frame = 0;
    let last = 0;

    const tick = (now: number) => {
      const dt = Math.min(50, last ? now - last : 16);
      last = now;
      const target = inside ? 1 : 0;
      light += (target - light) * (1 - Math.exp(-dt / 140));

      // Stage di-scale, jadi posisi layar dibagi skala untuk dapat koordinat stage.
      const r = area.getBoundingClientRect();
      const s = r.width / area.offsetWidth || 1;
      const sx = (cx - r.left) / s - SPOT;
      const sy = (cy - r.top) / s - SPOT;
      spot.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
      spot.style.opacity = light.toFixed(3);

      const settled = Math.abs(target - light) < 0.01;
      frame = settled ? 0 : requestAnimationFrame(tick);
      if (settled) last = 0;
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      cx = e.clientX;
      cy = e.clientY;
      inside = true;
      wake();
    };
    const onLeave = () => {
      inside = false;
      wake();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      cancelAnimationFrame(frame);
    };
  }, [areaRef, spotRef, enabled]);
}
