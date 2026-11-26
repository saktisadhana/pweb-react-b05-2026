import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

interface Identifiable {
  id: string;
}

export interface PendingDeletion<T extends Identifiable> {
  item: T;
}

export interface UseUndoDeleteResult<T extends Identifiable> {
  pendingDeletion: PendingDeletion<T> | null;
  deleteItem: (id: string) => void;
  undoDelete: () => void;
}

interface DeletedEntry<T extends Identifiable> {
  item: T;
  index: number;
  token: number;
}

export function useUndoDelete<T extends Identifiable>(
  items: T[],
  setItems: Dispatch<SetStateAction<T[]>>,
  durationMs = 5_000,
): UseUndoDeleteResult<T> {
  const [pendingDeletion, setPendingDeletion] =
    useState<PendingDeletion<T> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deletedEntryRef = useRef<DeletedEntry<T> | null>(null);
  const tokenRef = useRef(0);

  const deleteItem = useCallback(
    (id: string) => {
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) {
        return;
      }

      const item = items[index];
      if (!item) {
        return;
      }

      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      const token = tokenRef.current + 1;
      tokenRef.current = token;
      deletedEntryRef.current = { item, index, token };
      setItems((currentItems) =>
        currentItems.filter((currentItem) => currentItem.id !== id),
      );
      setPendingDeletion({ item });

      timeoutRef.current = setTimeout(() => {
        if (deletedEntryRef.current?.token === token) {
          deletedEntryRef.current = null;
          setPendingDeletion(null);
          timeoutRef.current = null;
        }
      }, durationMs);
    },
    [durationMs, items, setItems],
  );

  const undoDelete = useCallback(() => {
    const deletedEntry = deletedEntryRef.current;
    if (deletedEntry === null) {
      return;
    }

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    deletedEntryRef.current = null;
    setPendingDeletion(null);
    setItems((currentItems) => {
      if (currentItems.some((item) => item.id === deletedEntry.item.id)) {
        return currentItems;
      }

      const restoredItems = [...currentItems];
      restoredItems.splice(
        Math.min(deletedEntry.index, restoredItems.length),
        0,
        deletedEntry.item,
      );
      return restoredItems;
    });
  }, [setItems]);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  return { pendingDeletion, deleteItem, undoDelete };
}
