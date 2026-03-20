import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface RoomHeaderContext {
  roomName: string;
  ticketKey: string | null;
  participantCount: number;
}

interface Props {
  action?: ReactNode;
  title?: string;
  subtitle?: string;
  /** When set, shows in-room meta in the top bar (desktop). */
  roomContext?: RoomHeaderContext;
}

function GitHubLink({ className }: { className?: string }) {
  return (
    <a
      href="https://github.com/saulodefaria/planning-poker"
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "rounded-full bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary-container transition-opacity hover:opacity-90 active:scale-[0.98]"
      }>
      GitHub
    </a>
  );
}

function GroupIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}

export function SiteHeader({ action, title, subtitle, roomContext }: Props) {
  const showStacked = Boolean(title || subtitle);

  return (
    <header className="sticky top-0 z-50 bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 items-center gap-4 md:gap-6">
          <Link to="/" className="shrink-0 text-xl font-bold tracking-tighter text-primary">
            Planning Poker
          </Link>

          {roomContext ? (
            <div className="hidden min-w-0 items-center gap-4 border-l border-outline-variant/20 pl-6 md:flex">
              <div className="min-w-0">
                <span className="text-[10px] font-medium uppercase tracking-widest text-on-surface-variant">
                  Current room
                </span>
                <p className="truncate text-sm font-medium tracking-tight text-primary">{roomContext.roomName}</p>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-medium uppercase tracking-widest text-on-surface-variant">
                  Ticket
                </span>
                <p className="truncate font-mono text-sm font-medium tracking-tight text-on-surface">
                  {roomContext.ticketKey ?? "—"}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {roomContext ? (
            <div className="hidden items-center gap-2 rounded-full border border-outline-variant/10 bg-surface-container-high px-3 py-1.5 sm:flex">
              <GroupIcon className="size-4 text-primary" />
              <span className="text-sm font-medium text-on-surface">
                {roomContext.participantCount} participant{roomContext.participantCount !== 1 ? "s" : ""}
              </span>
            </div>
          ) : null}
          {action}
          <GitHubLink />
        </div>
      </div>

      {showStacked ? (
        <div className="border-t border-outline-variant/10 bg-surface-container-lowest/30">
          <div className="mx-auto max-w-7xl px-6 py-5">
            {title ? (
              <h1 className="text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">{title}</h1>
            ) : null}
            {subtitle ? <p className="mt-1 text-on-surface-variant">{subtitle}</p> : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
