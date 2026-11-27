import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Page, TileDef } from '../../data/figmaTiles';
import { TileField, type Pager } from './TileField';
import { STAGE_H, STAGE_W } from './TileCanvas';
import { prefersReducedMotion } from './useCursorLight';

const FLOW_BREAKPOINT = 900; // di bawah ini layout grid diganti jadi satu kolom

interface StageProps {
  page: Page;
  pager?: Pager;
  notifCount: number;
  onTileAction: (tile: TileDef) => void;
  onLogo: () => void;
  overlay?: ReactNode; // popup / toast, ikut di dalam stage
  paused?: boolean; // true saat popup terbuka: efek mouse dimatikan (latar sedang di-blur)
  menuOpen?: boolean;
  children: ReactNode;
}


// Stage = frame Figma 1440 x 1238. Semua tile dan konten diletakkan dengan
// koordinat px Figma, lalu seluruh stage di-scale mengikuti lebar layar.
export function Stage({ page, pager, notifCount, onTileAction, onLogo, overlay, paused = false, menuOpen = true, children }: StageProps) {
  const contentRef = useRef<HTMLElement>(null);
  const [blocked, setBlocked] = useState<string | undefined>(undefined);
  const [scale, setScale] = useState(1);
  const [flow, setFlow] = useState(false);
  const [fieldScale, setFieldScale] = useState(1);
  const [dpr, setDpr] = useState(1);

  useLayoutEffect(() => {
    let timer = 0;
    const fit = () => {
      const w = document.documentElement.clientWidth;
      setFlow(w < FLOW_BREAKPOINT);
      setScale(w / STAGE_W);
      // Mode HP: tile jadi background tetap, di-scale mengikuti tinggi layar.
      setFieldScale(Math.max(0.55, Math.min(0.8, window.innerHeight / STAGE_H)));
      setDpr(window.devicePixelRatio || 1);
    };
    // Saat jendela di-resize, tunggu sebentar sebelum menghitung ulang
    // (canvas tidak perlu dibuat ulang di setiap piksel resize).
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(fit, 120);
    };
    fit();
    window.addEventListener('resize', onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Ukur posisi semua tile konten, supaya area yang kosong bisa diisi tile biru/kuning.
  // Diukur ulang setiap isi halaman berubah (pindah halaman, filter, pagination, dll).
  // Memakai offsetLeft/offsetTop (posisi layout), jadi tidak terganggu animasi masuk.
  useEffect(() => {
    const el = contentRef.current;
    if (flow || !el) {
      setBlocked(undefined);
      return;
    }
    let frame = 0;
    const measure = () => {
      frame = 0;
      const rects: string[] = [];
      el.querySelectorAll<HTMLElement>('.gt:not(.cell), .row, .empty-note').forEach((node) => {
        let x = 0;
        let y = 0;
        let cur: HTMLElement | null = node;
        while (cur && cur !== el) {
          x += cur.offsetLeft;
          y += cur.offsetTop;
          cur = cur.offsetParent as HTMLElement | null;
        }
        rects.push([x, y, node.offsetWidth, node.offsetHeight].map(Math.round).join(','));
      });
      setBlocked(rects.sort().join(';'));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(el, { childList: true, subtree: true });
    schedule();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [flow, page]);

  // Resolusi canvas = ukuran tampil x devicePixelRatio, maksimal 3x (layar 4K/retina tetap tajam).
  const shown = flow ? fieldScale : scale;
  const resolution = Math.round(Math.min(3, Math.max(0.5, shown * dpr)) * 4) / 4;

  return (
    <div
      className={`stage-wrap${flow ? ' is-flow' : ''}`}
      style={flow ? ({ '--fs': fieldScale } as CSSProperties) : { height: STAGE_H * scale }}
    >
      <div className="stage" style={flow ? undefined : { transform: `scale(${scale})`, width: STAGE_W, height: STAGE_H }}>
        <TileField
          page={page}
          pager={pager}
          blocked={blocked}
          notifCount={notifCount}
          resolution={resolution}
          effects={!flow && !paused && !prefersReducedMotion()}
          onAction={onTileAction}
          onLogo={onLogo}
          menuOpen={menuOpen}
        />
        {/* key={page}: konten dipasang ulang saat pindah halaman, jadi animasi masuk diputar lagi. */}
        <main className="content" key={page} ref={contentRef}>
          {children}
        </main>
        {overlay}
      </div>
    </div>
  );
}
