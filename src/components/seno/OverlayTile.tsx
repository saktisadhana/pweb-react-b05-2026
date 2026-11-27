import type { CSSProperties, ReactNode, Ref } from 'react';
import { enterDelay, type Box } from './grid';

export type { Box } from './grid';

// Tombol dan input yang menumpang di atas tile background (dipakai di layar
// login dan Eksplorasi). Tile-nya sendiri tetap digambar di background; komponen
// ini transparen dan hanya menambah tulisan, efek hover, dan efek tekan
// (biru -> kuning, kuning -> biru) + glow.

export type Tone = 'navy' | 'amber'; // warna tile di bawahnya, menentukan warna garis tulisan

// --d: jeda animasi muncul, sama dengan tile background (lihat enterDelay).
const boxStyle = (b: Box): CSSProperties => ({ left: b.x, top: b.y, width: b.w, height: b.h, '--d': `${enterDelay(b)}ms` } as CSSProperties);

interface TileBtnProps {
  box: Box;
  tone: Tone;
  label: string; // nama untuk screen reader
  children: ReactNode;
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  pressed?: boolean;
}

export function TileBtn({ box, tone, label, children, type = 'button', onClick, disabled, pressed }: TileBtnProps) {
  return (
    <button
      type={type}
      className={`lt lt--${tone}`}
      style={boxStyle(box)}
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

interface TileInputProps {
  box: Box;
  tone: Tone;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  type?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  onEnter?: () => void;
}

// Input teks besar (font dot 48px) di atas tile; placeholder-nya adalah tulisan tile.
export function TileInput({ box, tone, label, placeholder, value, onChange, error, inputRef, type = 'text', autoComplete = 'off', autoFocus, onEnter }: TileInputProps) {
  return (
    <label className={`lt lt--${tone} lt--input${error ? ' is-error' : ''}`} style={boxStyle(box)}>
      <span className="sr-only">{label}</span>
      <input
        ref={inputRef}
        className={`lt__input lbl--on-${tone}`}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize="none"
        spellCheck={false}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onEnter) {
            e.preventDefault();
            onEnter();
          }
        }}
      />
    </label>
  );
}

// Tulisan tile (font dot 48px) di dalam TileBtn.
export function TileLabel({ tone, children, x, y, small }: { tone: Tone; children: ReactNode; x: number; y: number; small?: boolean }) {
  return (
    <span className={`lbl lbl--on-${tone}${small ? ' lbl--small' : ''}`} style={{ left: x, top: y }}>
      {children}
    </span>
  );
}
