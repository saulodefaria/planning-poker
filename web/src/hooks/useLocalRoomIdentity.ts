import { useState, useCallback } from 'react';
import type { LocalIdentity } from '../types';

function storageKey(roomId: string): string {
  return `planning-poker:room:${roomId}:identity`;
}

export function useLocalRoomIdentity(roomId: string) {
  const [identity, setIdentityState] = useState<LocalIdentity | null>(() => {
    try {
      const raw = localStorage.getItem(storageKey(roomId));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const saveIdentity = useCallback(
    (id: string, name: string) => {
      const value: LocalIdentity = { participantId: id, name };
      localStorage.setItem(storageKey(roomId), JSON.stringify(value));
      setIdentityState(value);
    },
    [roomId],
  );

  const clearIdentity = useCallback(() => {
    localStorage.removeItem(storageKey(roomId));
    setIdentityState(null);
  }, [roomId]);

  return { identity, saveIdentity, clearIdentity };
}
