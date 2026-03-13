import { useCallback, useEffect, useMemo, useState } from "react";
import { clearRoomIdentity, loadRoomIdentity, saveRoomIdentity } from "../services/room-identity-storage";
import type { LocalIdentity, VoteValue } from "../types";

interface IdentityState {
  identity: LocalIdentity | null;
  roomId: string;
}

export function useLocalRoomIdentity(roomId: string) {
  const [state, setState] = useState<IdentityState>(() => ({
    roomId,
    identity: loadRoomIdentity(roomId),
  }));

  const identity = useMemo(
    () => (state.roomId === roomId ? state.identity : loadRoomIdentity(roomId)),
    [roomId, state.identity, state.roomId],
  );

  useEffect(() => {
    if (state.roomId === roomId) {
      return;
    }

    setState({
      roomId,
      identity,
    });
  }, [identity, roomId, state.roomId]);

  const persist = useCallback(
    (updater: (current: LocalIdentity | null) => LocalIdentity | null) => {
      setState((currentState) => {
        const currentIdentity = currentState.roomId === roomId ? currentState.identity : loadRoomIdentity(roomId);
        const nextIdentity = updater(currentIdentity);

        if (nextIdentity) {
          saveRoomIdentity(roomId, nextIdentity);
        } else {
          clearRoomIdentity(roomId);
        }

        return {
          roomId,
          identity: nextIdentity,
        };
      });
    },
    [roomId],
  );

  const saveIdentity = useCallback(
    (id: string, name: string) => {
      persist((current) => ({
        ...current,
        participantId: id,
        name,
      }));
    },
    [persist],
  );

  const saveVote = useCallback(
    (vote: VoteValue | null, round: number) => {
      persist((current) => {
        if (!current) {
          return current;
        }

        if (current.vote === vote && current.round === round) {
          return current;
        }

        return {
          ...current,
          vote,
          round,
        };
      });
    },
    [persist],
  );

  const clearIdentity = useCallback(() => {
    persist(() => null);
  }, [persist]);

  return { identity, saveIdentity, saveVote, clearIdentity };
}
