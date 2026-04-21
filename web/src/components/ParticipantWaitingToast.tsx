import { WAITING_NUDGE_VISIBLE_MS } from "../services/participant-nudge";
import type { ParticipantNudgeEvent } from "../types";

interface Props {
  nudge: ParticipantNudgeEvent;
}

export function ParticipantWaitingToast({ nudge }: Props) {
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center md:right-6 md:bottom-6 md:left-auto">
      <div
        role="status"
        aria-live="polite"
        data-testid="participant-waiting-toast"
        className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border border-primary/20 bg-surface-container-high/92 shadow-[0_18px_48px_rgba(6,12,24,0.45)] backdrop-blur-xl">
        <div className="flex items-start gap-3 px-4 py-3.5">
          <span
            className="mt-1 size-2.5 shrink-0 rounded-full bg-primary shadow-[0_0_16px_rgba(78,222,163,0.65)]"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-on-surface">Waiting on you</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {nudge.fromParticipantName} is waiting for your vote.
            </p>
          </div>
        </div>

        <div className="h-1 w-full bg-primary/10">
          <div
            className="waiting-nudge-progress h-full bg-linear-to-r from-primary via-primary-container to-secondary"
            style={{ animationDuration: `${WAITING_NUDGE_VISIBLE_MS}ms` }}
          />
        </div>
      </div>
    </div>
  );
}
