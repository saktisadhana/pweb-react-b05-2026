import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Page, TileDef } from '../../data/figmaTiles';
import { TileField } from './TileField';

export const STAGE_W = 1440;
export const STAGE_H = 1238;
const FLOW_BREAKPOINT = 900; // di bawah ini layout grid diganti jadi satu kolom

interface StageProps {
  page: Page;
  notifCount: number;
  onTileAction: (tile: TileDef) => void;
  onLogo: () => void;
  overlay?: ReactNode; // popup / toast, ikut di dalam stage
  children: ReactNode;
}

// Stage = frame Figma 1440 x 1238. Semua tile dan konten diletakkan dengan
// koordinat px Figma, lalu seluruh stage di-scale mengikuti lebar layar.
export function Stage({ page, notifCount, onTileAction, onLogo, overlay, children }: StageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [flow, setFlow] = useState(false);
  const [fieldScale, setFieldScale] = useState(1);

  useLayoutEffect(() => {
    const fit = () => {
      const w = document.documentElement.clientWidth;
      setFlow(w < FLOW_BREAKPOINT);
      setScale(w / STAGE_W);
      // Mode HP: tile jadi background tetap, di-scale mengikuti tinggi layar.
      setFieldScale(Math.max(0.55, Math.min(0.8, window.innerHeight / STAGE_H)));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // Posisi mouse -> CSS variable. Maksimal 1 update per frame (requestAnimationFrame).
  // --px/--py: posisi mouse dalam koordinat stage (untuk cahaya spot).
  // --mx/--my: -1..1 dari tengah layar (untuk menggeser mask warna tile).
  useEffect(() => {
    const el = stageRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    let mx = 0; // nilai yang sedang tampil, mengejar target pelan-pelan (efek "berat")
    let my = 0;

    const apply = () => {
      const r = el.getBoundingClientRect();
      const s = r.width / STAGE_W;
      el.style.setProperty('--px', `${((cx - r.left) / s).toFixed(1)}px`);
      el.style.setProperty('--py', `${((cy - r.top) / s).toFixed(1)}px`);

      const tx = cx / window.innerWidth - 0.5;
      const ty = cy / window.innerHeight - 0.5;
      mx += (tx - mx) * 0.08;
      my += (ty - my) * 0.08;
      el.style.setProperty('--mx', mx.toFixed(4));
      el.style.setProperty('--my', my.toFixed(4));

      // Terus animasi sampai posisi mask sudah sampai target.
      frame = Math.abs(tx - mx) + Math.abs(ty - my) > 0.0005 ? requestAnimationFrame(apply) : 0;
    };

    const onMove = (e: PointerEvent) => {
      cx = e.clientX;
      cy = e.clientY;
      el.classList.add('has-pointer');
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => el.classList.remove('has-pointer');

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className={`stage-wrap${flow ? ' is-flow' : ''}`}
      style={flow ? ({ '--fs': fieldScale } as CSSProperties) : { height: STAGE_H * scale }}
    >
      <div
        ref={stageRef}
        className="stage"
        style={flow ? undefined : { transform: `scale(${scale})` }}
      >
        <TileField page={page} notifCount={notifCount} onAction={onTileAction} onLogo={onLogo} />
        {/* key={page}: konten dipasang ulang saat pindah halaman, jadi animasi masuk diputar lagi. */}
        <main className="content" key={page}>
          {children}
        </main>
        {overlay}
      </div>
    </div>
  );
}
