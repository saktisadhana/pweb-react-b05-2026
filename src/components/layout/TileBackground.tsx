// Background tile dekoratif (gaya SENO di Figma). Dibuat sekali di level modul
// dengan angka acak ber-seed, jadi polanya selalu sama setiap refresh.
interface BgTile { color: 'navy' | 'amber' | 'empty'; span: number; angle: number }

function makeTiles(count: number): BgTile[] {
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: count }, () => {
    const r = rand();
    return {
      color: r < 0.42 ? 'navy' : r < 0.7 ? 'amber' : 'empty',
      span: rand() < 0.22 ? 2 : 1,
      angle: Math.round(rand() * 360),
    };
  });
}

const TILES = makeTiles(220);

function Layer({ lit }: { lit?: boolean }) {
  return (
    <div className={`bg-tiles${lit ? ' bg-tiles--lit' : ''}`}>
      {TILES.map((t, i) => (
        <span
          key={i}
          className={`bg-tile bg-tile--${t.color}`}
          style={{ gridColumn: `span ${t.span}`, ['--a' as string]: `${t.angle}deg` }}
        />
      ))}
    </div>
  );
}

export function TileBackground() {
  return (
    <div className="bg" aria-hidden="true">
      <Layer />
      <Layer lit />
    </div>
  );
}
