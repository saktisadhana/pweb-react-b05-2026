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
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not read localStorage key "${key}": ${detail}`);
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
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`Could not write localStorage key "${key}": ${detail}`);
    }
  }, [key, value]);

  return [value, setValue];
}
