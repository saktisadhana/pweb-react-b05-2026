import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  // Simpan onClose terbaru di ref, supaya effect di bawah cukup jalan sekali.
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // halaman di belakang modal tidak ikut ter-scroll
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal__panel tile" role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal__head">
          <h2 className="h-dot">/ {title}</h2>
          <button ref={closeRef} type="button" className="btn btn--ghost" onClick={onClose}>&gt; Tutup</button>
        </header>
        {children}
      </div>
    </div>
  );
}
