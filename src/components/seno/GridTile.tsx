import type { CSSProperties, ReactNode } from 'react';

import { colX, rowY, span } from './grid';

interface GridTileProps {
  c: number; // kolom (1 = x 40)
  r: number; // baris (0 = y 59)
  w?: number; // lebar dalam jumlah tile
  h?: number;
  hot?: boolean; // glow kuning (penting / dipilih)
  className?: string;
  label?: string; // aria-label untuk section
  children: ReactNode;
}

function gridStyle(c: number, r: number, w: number, h: number): CSSProperties {
  return {
    '--x': `${colX(c)}px`,
    '--y': `${rowY(r)}px`,
    '--w': `${span(w)}px`,
    '--h': `${span(h)}px`,
    '--d': `${(c + r) * 22}ms`, // animasi masuk bergelombang dari kiri atas
  } as CSSProperties;
}

// Tile konten putih (white .95 + bayangan navy + glow saat hover).
export function GridTile({ c, r, w = 1, h = 1, hot, className = '', label, children }: GridTileProps) {
  return (
    <section
      className={`gt${hot ? ' is-hot' : ''} ${className}`}
      style={gridStyle(c, r, w, h)}
      aria-label={label}
    >
      {children}
    </section>
  );
}

interface GridButtonProps extends Omit<GridTileProps, 'label'> {
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  ariaLabel?: string;
  pressed?: boolean;
}

// Tile konten yang bisa diklik. Saat ditekan: glow kuning menyala (biru -> kuning).
export function GridButton({ c, r, w = 1, h = 1, hot, className = '', onClick, type = 'button', disabled, ariaLabel, pressed, children }: GridButtonProps) {
  return (
    <button
      type={type}
      className={`gt gt--btn${hot ? ' is-hot' : ''} ${className}`}
      style={gridStyle(c, r, w, h)}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={pressed}
    >
      {children}
    </button>
  );
}
