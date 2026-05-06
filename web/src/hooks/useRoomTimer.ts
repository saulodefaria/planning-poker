import { useEffect, useReducer, useCallback } from "react";
import { initialRoomTimer, reduceRoomTimer } from "../services/room-timer-state";

/** Delay before auto-reset after countdown ends; exported for tests to stay in sync. */
export const ROOM_TIMER_ENDED_RESET_DELAY_MS = 3000;

export function useRoomTimer() {
  const [state, dispatch] = useReducer(reduceRoomTimer, null, () => initialRoomTimer());

  useEffect(() => {
    if (state.status !== "running") {
      return;
    }

    const id = window.setInterval(() => {
      dispatch({ type: "TICK" });
    }, 1000);

    return () => window.clearInterval(id);
  }, [state.status]);

  useEffect(() => {
    if (state.status !== "ended") {
      return;
    }

    const id = window.setTimeout(() => {
      dispatch({ type: "RESET_TO_DEFAULT" });
    }, ROOM_TIMER_ENDED_RESET_DELAY_MS);

    return () => window.clearTimeout(id);
  }, [state.status]);

  const play = useCallback(() => dispatch({ type: "PLAY" }), []);
  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
  const cancel = useCallback(() => dispatch({ type: "CANCEL" }), []);
  const addMinute = useCallback(() => dispatch({ type: "ADD_MINUTE" }), []);
  const subMinute = useCallback(() => dispatch({ type: "SUB_MINUTE" }), []);

  return { state, play, pause, cancel, addMinute, subMinute };
}
