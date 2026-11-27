import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

function readStoredValue<T>(key: string, initialValue: T): T {
  if (typeof window === "undefined") {
    return initialValue;
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    if (storedValue === null) {
      return initialValue;
    }

    const parsedValue: unknown = JSON.parse(storedValue);
    return parsedValue as T;
  } catch (error) {
    // Data rusak/bukan JSON: jangan bikin seluruh app crash, pakai nilai awal.
    console.warn(`Data localStorage "${key}" tidak bisa dibaca, memakai nilai awal.`, error);
    return initialValue;
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() =>
    readStoredValue(key, initialValue),
  );

  useEffect(() => {
    try {
      const serializedValue = JSON.stringify(value);
      if (serializedValue === undefined) {
        throw new Error("The value cannot be serialized as JSON.");
      }

      window.localStorage.setItem(key, serializedValue);
    } catch (error) {
      // Storage penuh atau diblokir browser: state tetap jalan di memori.
      console.warn(`Data localStorage "${key}" tidak bisa disimpan.`, error);
    }
  }, [key, value]);

  return [value, setValue];
}
