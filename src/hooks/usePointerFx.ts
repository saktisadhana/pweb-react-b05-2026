import { useEffect } from 'react';

// Satu listener untuk seluruh halaman. Posisi mouse ditulis ke CSS variable,
// lalu CSS yang menggambar efeknya (background + cahaya di tile).
// requestAnimationFrame: maksimal 1 update per frame, jadi tetap ringan.
export function usePointerFx() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const root = document.documentElement;
    let frame = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let target: HTMLElement | null = null;

    const apply = () => {
      frame = 0;
      root.style.setProperty('--mx', `${x}px`);
      root.style.setProperty('--my', `${y}px`);
      root.style.setProperty('--mx-r', (x / window.innerWidth - 0.5).toFixed(3));
      root.style.setProperty('--my-r', (y / window.innerHeight - 0.5).toFixed(3));
      if (target) {
        const r = target.getBoundingClientRect();
        target.style.setProperty('--px', `${x - r.left}px`);
        target.style.setProperty('--py', `${y - r.top}px`);
      }
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      target = e.target instanceof Element ? e.target.closest<HTMLElement>('.tile, .nav-tile, .btn') : null;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);
}
