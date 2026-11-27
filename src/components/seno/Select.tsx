import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  // Pakai ariaLabel, atau id + <label htmlFor> di luar komponen.
  ariaLabel?: string;
  id?: string;
  className?: string;
}

interface Placement {
  host: HTMLElement;
  style: CSSProperties;
}

const ROW_H = 40;

// Pengganti <select>: daftar pilihan bawaan browser tidak bisa diberi font dan warna situs.
// Pola ARIA "select-only combobox": fokus tetap di tombol, pilihan aktif lewat aria-activedescendant.
export function Select<T extends string>({ value, options, onChange, ariaLabel, id, className = '' }: SelectProps<T>) {
  const autoId = useId();
  const listId = `${autoId}-list`;
  const optId = (i: number) => `${autoId}-opt-${i}`;
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: '', at: 0 });
  const [place, setPlace] = useState<Placement | null>(null);
  const [active, setActive] = useState(0);
  const open = place !== null;
  const current = Math.max(0, options.findIndex((o) => o.value === value));

  const close = () => setPlace(null);

  // Daftar dipasang di dalam .stage (bukan di dalam tile), karena tile memotong isi yang keluar
  // dari kotaknya. Stage di-scale, jadi posisi layar dibagi skala dulu.
  const show = (index: number) => {
    const btn = btnRef.current;
    const host = btn?.closest<HTMLElement>('.stage') ?? document.body;
    if (!btn) return;
    const hr = host.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    const scale = hr.width / (host.offsetWidth || hr.width) || 1;
    const left = (br.left - hr.left) / scale - 14;
    const below = (br.bottom - hr.top) / scale + 10;
    const height = Math.min(options.length * ROW_H + 12, 320);
    const room = (host === document.body ? window.innerHeight : host.offsetHeight) - below - 12;
    const style: CSSProperties = { left, minWidth: br.width / scale + 28, maxHeight: height };
    if (room < height && (br.top - hr.top) / scale > room) style.bottom = host.offsetHeight - (br.top - hr.top) / scale + 10;
    else style.top = below;
    setActive(index);
    setPlace({ host, style });
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
    close();
    btnRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !listRef.current?.contains(t)) close();
    };
    // Scroll di luar daftar atau ukuran jendela berubah: posisi sudah tidak pas, jadi tutup.
    const onScroll = (e: Event) => {
      if (!listRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  // Ketik huruf awal untuk lompat ke pilihan, seperti <select> biasa.
  const typeahead = (key: string) => {
    const now = Date.now();
    typed.current = { text: now - typed.current.at > 700 ? key : typed.current.text + key, at: now };
    const start = open ? active : current;
    const order = options.map((_, i) => (start + 1 + i) % options.length);
    const hit = order.find((i) => options[i].label.toLowerCase().startsWith(typed.current.text.toLowerCase()));
    if (hit === undefined) return;
    if (open) setActive(hit);
    else if (options[hit].value !== value) onChange(options[hit].value);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    const keys: Record<string, () => void> = open
      ? {
          ArrowDown: () => setActive((i) => Math.min(last, i + 1)),
          ArrowUp: () => setActive((i) => Math.max(0, i - 1)),
          Home: () => setActive(0),
          End: () => setActive(last),
          PageDown: () => setActive((i) => Math.min(last, i + 5)),
          PageUp: () => setActive((i) => Math.max(0, i - 5)),
          Enter: () => choose(active),
          ' ': () => choose(active),
          Escape: close,
        }
      : {
          ArrowDown: () => show(current),
          ArrowUp: () => show(current),
          Enter: () => show(current),
          ' ': () => show(current),
          Home: () => show(0),
          End: () => show(last),
        };
    if (e.key === 'Tab' && open) {
      close();
      return;
    }
    const run = keys[e.key];
    // Huruf/angka tunggal dipakai untuk mencari pilihan, jadi tidak boleh ikut memicu shortcut halaman.
    const printable = e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey;
    if (!run && !printable) return;
    e.preventDefault();
    e.stopPropagation();
    if (run) run();
    else typeahead(e.key);
  };

  return (
    <span className={`sel ${className}`}>
      <button
        ref={btnRef}
        id={id}
        type="button"
        role="combobox"
        className="sel__btn"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? optId(active) : undefined}
        onClick={() => (open ? close() : show(current))}
        onKeyDown={onKeyDown}
      >
        <span className="sel__value">{options[current]?.label}</span>
        <span className="sel__chev" aria-hidden="true">v</span>
      </button>
      {place &&
        createPortal(
          <ul ref={listRef} id={listId} role="listbox" aria-label={ariaLabel} className="sel__list" style={place.style}>
            {options.map((o, i) => (
              <li
                key={o.value}
                id={optId(i)}
                role="option"
                aria-selected={o.value === value}
                className={`sel__opt${i === active ? ' is-active' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onPointerMove={() => setActive(i)}
                onClick={() => choose(i)}
              >
                {o.label}
              </li>
            ))}
          </ul>,
          place.host,
        )}
    </span>
  );
}
