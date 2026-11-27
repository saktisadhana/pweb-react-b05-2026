import type { CSSProperties } from 'react';
import type { TileColor, TileDef } from '../../data/figmaTiles';

interface TileProps {
  tile: TileDef;
  isCurrent: boolean;
  pressed: boolean;
  badge?: number;
  onPress: (id: string | null) => void;
  onAction?: (tile: TileDef) => void;
}

// Warna yang tampil: tile aktif selalu kuning. Saat ditekan, warnanya dibalik
// (biru -> kuning, kuning -> biru).
export function shownColor(tile: TileDef, isCurrent: boolean, pressed: boolean): TileColor {
  const base: TileColor = isCurrent ? 'Y' : tile.color;
  return pressed ? (base === 'B' ? 'Y' : 'B') : base;
}

// Satu tile = beberapa layer bertumpuk, sama seperti di Figma:
// biru  -> G (kaca) + B1 + B2 + B3 + B4
// kuning -> Y2 + Y1 + Y3 (opacity .5)
// aktif -> Y2 + Y1 + N (garis biru) + Y3
// Tiap layer warna di-mask dengan gambar mask yang sama untuk seluruh layar,
// jadi warnanya memudar mengikuti mask, persis seperti di Figma.
function Layers({ color }: { color: TileColor }) {
  if (color === 'B') {
    return (
      <span className="t__set t__set--B" aria-hidden="true">
        <i className="t__g" />
        <i className="t__l t__b1" />
        <i className="t__l t__b" />
        <i className="t__l t__b" />
        <i className="t__l t__b" />
      </span>
    );
  }
  return (
    <span className="t__set t__set--Y" aria-hidden="true">
      <i className="t__l t__y" />
      <i className="t__l t__y" />
      <i className="t__n" />
      <i className="t__l t__y t__y3" />
    </span>
  );
}

export function Tile({ tile, isCurrent, pressed, badge, onPress, onAction }: TileProps) {
  const interactive = Boolean(tile.action);
  const shown = shownColor(tile, isCurrent, pressed);
  const setPressed = (on: boolean) => onPress(on ? tile.id : null);

  const style = {
    left: tile.x,
    top: tile.y,
    width: tile.w,
    height: tile.h,
    '--x': tile.x,
    '--y': tile.y,
  } as CSSProperties;

  const content = (
    <>
      {/* Tile yang bisa diklik menyimpan dua set layer supaya pergantian warna bisa dianimasikan. */}
      {interactive ? (
        <>
          <Layers color="B" />
          <Layers color="Y" />
        </>
      ) : (
        <Layers color={tile.color} />
      )}
      {tile.icon && (
        <img
          className="t__icon"
          src={tile.icon.src}
          alt=""
          style={{ left: tile.icon.dx, top: tile.icon.dy, width: tile.icon.w, height: tile.icon.h }}
        />
      )}
      {badge ? <span className="t__badge">{badge}</span> : null}
    </>
  );

  const className = `t${interactive ? ' t--btn' : ''}${isCurrent ? ' is-current' : ''}${pressed ? ' is-pressed' : ''}`;

  if (!interactive) {
    return (
      <div className={className} data-show={shown} style={style}>
        {content}
      </div>
    );
  }

  const name = tile.action?.type === 'nav' && tile.label ? tile.label.text.replace(/[>/<-]/g, '').trim() : labelFor(tile);

  return (
    <button
      type="button"
      className={className}
      data-show={shown}
      style={style}
      aria-label={name}
      aria-current={isCurrent ? 'page' : undefined}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setPressed(true);
      }}
      onKeyUp={() => setPressed(false)}
      onClick={() => onAction?.(tile)}
    >
      {content}
    </button>
  );
}

function labelFor(tile: TileDef): string {
  const a = tile.action;
  if (!a) return '';
  if (a.type === 'back') return 'Kembali';
  if (a.type === 'notif') return 'Notifikasi';
  const names = { explore: 'Eksplorasi', warroom: 'War Room', detail: 'Detail', offer: 'Bandingkan Offer', profil: 'Profil', agenda: 'Agenda' };
  return names[a.page];
}
