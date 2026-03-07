import { useState, useCallback } from 'react';
import type { LocalIdentity, VoteValue } from '../types';

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

  const persist = useCallback(
    (value: LocalIdentity) => {
      localStorage.setItem(storageKey(roomId), JSON.stringify(value));
      setIdentityState(value);
    },
    [roomId],
  );

  const saveIdentity = useCallback(
    (id: string, name: string) => {
      persist({ ...identity, participantId: id, name });
    },
    [identity, persist],
  );

  const saveVote = useCallback(
    (vote: VoteValue | null, round: number) => {
      if (!identity) return;
      persist({ ...identity, vote, round });
    },
    [identity, persist],
  );

  const clearIdentity = useCallback(() => {
    localStorage.removeItem(storageKey(roomId));
    setIdentityState(null);
  }, [roomId]);

  return { identity, saveIdentity, saveVote, clearIdentity };
}
