import type { CSSProperties } from 'react';
import type { TileColor, TileDef } from '../../data/figmaTiles';
import { enterDelay } from './grid';

interface TileButtonProps {
  tile: TileDef;
  isCurrent: boolean;
  shown: TileColor;
  pressed: boolean;
  badge?: number;
  onPress: (id: string | null) => void;
  onAction: (tile: TileDef) => void;
}

// Tombol transparen di atas canvas. Warnanya digambar oleh TileCanvas;
// tombol ini hanya untuk klik, keyboard, ikon, dan glow saat ditekan.
export function TileButton({ tile, isCurrent, shown, pressed, badge, onPress, onAction }: TileButtonProps) {
  const setPressed = (on: boolean) => onPress(on ? tile.id : null);

  return (
    <button
      type="button"
      className={`t-hit${tile.solid ? ' t-hit--solid' : ''}${pressed ? ' is-pressed' : ''}`}
      data-show={shown}
      style={{ left: tile.x, top: tile.y, width: tile.w, height: tile.h, '--d': `${enterDelay(tile)}ms` } as CSSProperties}
      aria-label={tileName(tile)}
      aria-current={isCurrent ? 'page' : undefined}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setPressed(true);
      }}
      onKeyUp={() => setPressed(false)}
      onBlur={() => setPressed(false)}
      onClick={() => onAction(tile)}
    >
      {tile.icon && <TileIcon tile={tile} />}
      {badge ? <span className="t__badge">{badge}</span> : null}
    </button>
  );
}

export function TileIcon({ tile, absolute }: { tile: TileDef; absolute?: boolean }) {
  const icon = tile.icon!;
  return (
    <img
      className="t__icon"
      src={icon.src}
      alt=""
      draggable={false}
      style={{
        left: (absolute ? tile.x : 0) + icon.dx,
        top: (absolute ? tile.y : 0) + icon.dy,
        width: icon.w,
        height: icon.h,
        '--d': `${enterDelay(tile)}ms`,
      } as CSSProperties}
    />
  );
}

const PAGE_NAMES = {
  explore: 'Eksplorasi',
  warroom: 'War Room',
  detail: 'Detail',
  offer: 'Bandingkan Offer',
  profil: 'Profil',
  agenda: 'Agenda',
};

function tileName(tile: TileDef): string {
  const a = tile.action;
  if (!a) return '';
  if (tile.name) return tile.name;
  if (a.type === 'back') return 'Kembali';
  if (a.type === 'notif') return 'Notifikasi';
  if (a.type === 'listPage') return `Halaman ${a.index + 1}`;
  if (a.type === 'pageStep') return a.delta < 0 ? 'Halaman sebelumnya' : 'Halaman berikutnya';
  if (tile.label) return tile.label.text.replace(/[>/<-]/g, '').trim();
  return PAGE_NAMES[a.page];
}
