import { useCallback, useEffect, useRef, useState } from "react";
import { WAITING_NUDGE_VISIBLE_MS } from "../services/participant-nudge";
import { playWaitingNudgeSound } from "../services/waiting-nudge-sound";
import type { ParticipantNudgeEvent } from "../types";

type PlayWaitingNudgeSound = () => void | Promise<void>;

export function useParticipantNudge(
  playSound: PlayWaitingNudgeSound = playWaitingNudgeSound,
  visibleMs: number = WAITING_NUDGE_VISIBLE_MS,
) {
  const [activeNudge, setActiveNudge] = useState<ParticipantNudgeEvent | null>(null);
  const activeNudgeRef = useRef<ParticipantNudgeEvent | null>(null);
  const dismissalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDismissalTimeout = useCallback(() => {
    if (dismissalTimeoutRef.current) {
      clearTimeout(dismissalTimeoutRef.current);
      dismissalTimeoutRef.current = null;
    }
  }, []);

  const dismissNudge = useCallback(() => {
    clearDismissalTimeout();
    activeNudgeRef.current = null;
    setActiveNudge(null);
  }, [clearDismissalTimeout]);

  const receiveNudge = useCallback(
    (event: ParticipantNudgeEvent) => {
      if (activeNudgeRef.current) {
        return;
      }

      activeNudgeRef.current = event;
      setActiveNudge(event);
      clearDismissalTimeout();

      dismissalTimeoutRef.current = setTimeout(() => {
        if (activeNudgeRef.current?.id === event.id) {
          activeNudgeRef.current = null;
          setActiveNudge(null);
        }

        dismissalTimeoutRef.current = null;
      }, visibleMs);

      void Promise.resolve(playSound()).catch(() => {});
    },
    [clearDismissalTimeout, playSound, visibleMs],
  );

  useEffect(() => dismissNudge, [dismissNudge]);

  return {
    activeNudge,
    dismissNudge,
    receiveNudge,
  };
}
