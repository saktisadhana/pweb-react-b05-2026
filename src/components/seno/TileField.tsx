import { useState } from 'react';
import { getTiles, type Page, type TileDef } from '../../data/figmaTiles';
import { Tile, shownColor } from './Tile';
import logo from '../../assets/logo.svg';

interface TileFieldProps {
  page: Page;
  notifCount: number;
  onAction: (tile: TileDef) => void;
  onLogo: () => void;
}

const isCurrentOn = (tile: TileDef, page: Page) => tile.currentOn?.includes(page) ?? false;

// Urutan lapisan mengikuti Figma (paling bawah dulu):
// tile + ikon -> logo -> overlay (fade bawah, vignette, glare) -> tulisan tile -> konten.
// "spot" adalah cahaya yang mengikuti mouse, di atas tile.
export function TileField({ page, notifCount, onAction, onLogo }: TileFieldProps) {
  const [pressedId, setPressedId] = useState<string | null>(null);
  const tiles = getTiles(page);

  return (
    <div className="field">
      {tiles.map((tile) => (
        <Tile
          key={tile.id}
          tile={tile}
          isCurrent={isCurrentOn(tile, page)}
          pressed={pressedId === tile.id}
          badge={tile.action?.type === 'notif' ? notifCount : undefined}
          onPress={setPressedId}
          onAction={onAction}
        />
      ))}

      <button type="button" className="logo" onClick={onLogo} aria-label="SENO, ke halaman Eksplorasi">
        <img src={logo} alt="" width={155} height={45} />
      </button>

      <div className="fx" aria-hidden="true">
        <i className="fx__fade" />
        <i className="fx__vignette" />
        <i className="fx__glare fx__glare--1" />
        <i className="fx__glare fx__glare--2" />
        <i className="fx__glare fx__glare--3" />
      </div>

      <i className="spot" aria-hidden="true" />

      <div className="labels" aria-hidden="true">
        {tiles
          .filter((t) => t.label)
          .map((t) => {
            const color = shownColor(t, isCurrentOn(t, page), pressedId === t.id);
            const label = t.label!;
            return (
              <span
                key={t.id}
                className={`lbl lbl--${color === 'B' ? 'on-navy' : 'on-amber'}`}
                style={{
                  left: t.x + label.dx,
                  top: t.y + label.dy,
                  transform: label.rotate ? `rotate(${label.rotate}deg)` : undefined,
                }}
              >
                {label.text}
              </span>
            );
          })}
      </div>
    </div>
  );
}
