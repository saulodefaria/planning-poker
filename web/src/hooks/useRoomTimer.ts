import { useEffect, useMemo, useState } from "react";
import type { RoomTimerModel } from "../services/room-timer-state";
import { getDisplayTimerState } from "../services/room-timer-state";

interface UseRoomTimerParams {
  state: RoomTimerModel;
  serverNowMs: number;
}

export function useRoomTimer({ state, serverNowMs }: UseRoomTimerParams) {
  const [serverOffsetMs, setServerOffsetMs] = useState(() => serverNowMs - Date.now());
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    setServerOffsetMs(serverNowMs - Date.now());
    setNowMs(Date.now());
  }, [serverNowMs]);

  useEffect(() => {
    if (state.status !== "running") {
      return;
    }

    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [state.status, state.endsAtMs]);

  return useMemo(() => {
    const estimatedServerNowMs = nowMs + serverOffsetMs;
    return getDisplayTimerState(state, estimatedServerNowMs);
  }, [nowMs, serverOffsetMs, state]);
}
