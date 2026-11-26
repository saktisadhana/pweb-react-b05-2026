import { useEffect, useState } from "react";

// Mengembalikan "value" yang baru berubah setelah user berhenti mengetik selama "delay" ms.
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Setiap kali value berubah, pasang timer baru
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: kalau value berubah lagi sebelum delay habis, timer lama dibatalkan
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}