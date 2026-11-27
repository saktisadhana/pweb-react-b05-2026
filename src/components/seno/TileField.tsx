import { memo, useMemo, useRef, useState, type CSSProperties } from "react";
import { getFillTiles, getPagerTiles, getTiles, type Page, type Rect, type TileDef } from "../../data/figmaTiles";
import { TileButton, TileIcon } from "./Tile";
import { enterDelay, shownColor } from "./grid";
import { TileCanvas, type TileVisual } from "./TileCanvas";
import { useCursorLight } from "./useCursorLight";
import logo from "../../assets/logo.svg";

export interface Pager {
  count: number;
  current: number;
}

interface TileFieldProps {
  page: Page;
  pager?: Pager; // nomor halaman daftar (War Room)
  blocked?: string; // posisi tile konten "x,y,w,h;x,y,w,h" (diukur Stage), area lain diisi tile
  notifCount: number;
  resolution: number;
  effects: boolean;
  onAction: (tile: TileDef) => void;
  onLogo: () => void;
  menuOpen: boolean; // false: menu kiri dilipat lewat tile "<<<<"
}

const isCurrentOn = (tile: TileDef, page: Page, listPage: number) =>
  tile.action?.type === "listPage"
    ? tile.action.index === listPage
    : (tile.currentOn?.includes(page) ?? false);

// Urutan lapisan mengikuti Figma (paling bawah dulu):
// tile (canvas) + cahaya mouse + ikon -> logo -> overlay (fade atas & bawah, vignette, glare) -> tulisan tile.
// Semua ada di dalam .field__move (posisinya tetap, hanya cahaya yang mengikuti mouse).
// memo: tidak ikut render ulang saat isi halaman berubah (mengetik, timer, dll).
export const TileField = memo(function TileField({
  page,
  pager,
  blocked,
  notifCount,
  resolution,
  effects,
  onAction,
  onLogo,
  menuOpen,
}: TileFieldProps) {
  const [pressedId, setPressedId] = useState<string | null>(null);
  const moveRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLElement>(null);
  useCursorLight(moveRef, spotRef, effects);
  const pagerCount = pager && pager.count > 1 ? pager.count : 0;
  const pagerCurrent = pager?.current ?? 0;
  const tiles = useMemo(() => {
    const base = pagerCount ? [...getTiles(page, menuOpen), ...getPagerTiles(pagerCount, pagerCurrent)] : getTiles(page, menuOpen);
    if (blocked === undefined) return base;
    const rects: Rect[] = blocked
      .split(";")
      .filter(Boolean)
      .map((r) => {
        const [x, y, w, h] = r.split(",").map(Number);
        return { x, y, w, h };
      });
    return [...base, ...getFillTiles(base, rects)];
  }, [page, menuOpen, pagerCount, pagerCurrent, blocked]);

  const visuals: TileVisual[] = useMemo(
    () =>
      tiles.map((tile) => {
        const current = isCurrentOn(tile, page, pagerCurrent);
        const pressed = pressedId === tile.id;
        return {
          tile,
          current,
          pressed,
          yellow: shownColor(tile, current, pressed) === "Y",
        };
      }),
    [tiles, page, pressedId, pagerCurrent],
  );

  return (
    <div className="field">
      <div className="field__move" ref={moveRef}>
        <TileCanvas visuals={visuals} resolution={resolution} />
        <i className="spot" ref={spotRef} aria-hidden="true" />

        {visuals.map(({ tile, current, pressed, yellow }) =>
          tile.action ? (
            <TileButton
              key={tile.id}
              tile={tile}
              isCurrent={current}
              shown={yellow ? "Y" : "B"}
              pressed={pressed}
              badge={tile.action.type === "notif" ? notifCount : undefined}
              onPress={setPressedId}
              onAction={onAction}
            />
          ) : tile.icon ? (
            <TileIcon key={tile.id} tile={tile} absolute />
          ) : null,
        )}

        <button
          type="button"
          className="logo"
          onClick={onLogo}
          aria-label="SENO"
        >
          <img src={logo} alt="" width={155} height={45} />
        </button>

        <div className="fx" aria-hidden="true">
          <i className="fx__fade fx__fade--top" />
          <i className="fx__fade" />
          <i className="fx__vignette" />
          <i className="fx__glare fx__glare--1" />
          <i className="fx__glare fx__glare--2" />
          <i className="fx__glare fx__glare--3" />
        </div>

        <div className="labels" aria-hidden="true">
          {visuals
            .filter((v) => v.tile.label)
            .map(({ tile, yellow }) => {
              const label = tile.label!;
              return (
                // key ikut teks: angka halaman yang berganti ikut muncul dengan animasi.
                <span
                  key={`${tile.id}|${label.text}`}
                  className={`lbl lbl--${yellow ? "on-amber" : "on-navy"}`}
                  style={
                    {
                      left: tile.x + label.dx,
                      top: tile.y + label.dy,
                      rotate: label.rotate ? `${label.rotate}deg` : undefined,
                      "--d": `${enterDelay(tile)}ms`,
                    } as CSSProperties
                  }
                >
                  {label.text}
                </span>
              );
            })}
        </div>
      </div>
    </div>
  );
});
