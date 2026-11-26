interface UndoToastProps {
  message: string;
  onUndo: () => void;
  durationMs?: number;
}

// Hanya tampilan. Timer 5 detik yang sebenarnya ada di logic Undo (useRef).
// Parent wajib memberi key berbeda tiap hapus (misal id lamaran), supaya
// bar hitung mundur mulai ulang dari penuh saat ada hapus kedua.
export function UndoToast({ message, onUndo, durationMs = 5000 }: UndoToastProps) {
  return (
    <div className="toast" role="status" aria-live="polite">
      <p className="toast__text">{message}</p>
      <button type="button" className="btn btn--amber" onClick={onUndo}>&gt; Undo</button>
      <span className="toast__bar" style={{ animationDuration: `${durationMs}ms` }} aria-hidden="true" />
    </div>
  );
}
