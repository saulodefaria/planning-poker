import { useState } from "react";
import type { JiraTicket, RoomStatus, TicketVoteHistory } from "../types";

interface Props {
  roomStatus: RoomStatus;
  tickets: JiraTicket[];
  votedTickets: JiraTicket[];
  currentTicketKey: string | null;
  voteHistory: TicketVoteHistory[];
  onAddTicket: (url: string) => void;
  onRemoveTicket: (key: string) => void;
  onSetCurrentTicket: (key: string | null) => void;
}

function parseJiraKey(url: string): string | null {
  const match = url.trim().match(/https?:\/\/[^/]+\/browse\/([A-Z][A-Z0-9]*-\d+)/i);
  return match ? match[1].toUpperCase() : null;
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function VoteHistoryPanel({ history }: { history: TicketVoteHistory }) {
  return (
    <div className="mt-2 space-y-2 border-t border-outline-variant/10 pt-2">
      <div className="flex gap-4">
        {history.stats?.average !== null && history.stats != null ? (
          <>
            <div className="flex flex-col">
              <span className="text-xs text-on-surface-variant">Average</span>
              <span className="text-base font-bold text-primary tabular-nums">{history.stats.average?.toFixed(1)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-on-surface-variant">Nearest Fib</span>
              <span className="text-base font-bold text-secondary tabular-nums">{history.stats.nearestFibonacci}</span>
            </div>
          </>
        ) : (
          <span className="text-xs text-on-surface-variant">No numeric votes</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {history.votes.map((v) => (
          <span
            key={v.participantName}
            className="inline-flex items-center gap-1 rounded-md border border-outline-variant/15 bg-surface-container-high px-2 py-0.5 text-xs text-on-surface">
            <span className="text-on-surface-variant">{v.participantName}</span>
            <span className="font-semibold text-on-surface">{v.vote ?? "—"}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function TicketRow({
  ticket,
  isCurrent,
  history,
  onRowClick,
  onRemove,
  canSelect,
  canRemove,
  roomStatus,
}: {
  ticket: JiraTicket;
  isCurrent: boolean;
  history: TicketVoteHistory | undefined;
  onRowClick: () => void;
  onRemove: () => void;
  canSelect: boolean;
  canRemove: boolean;
  roomStatus: RoomStatus;
}) {
  const [expanded, setExpanded] = useState(false);

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a[href], button")) return;
    if (isCurrent && history) {
      setExpanded((v) => !v);
    } else if (isCurrent && canSelect) {
      onRowClick();
    } else if (canSelect) {
      onRowClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => e.key === "Enter" && handleRowClick(e as unknown as React.MouseEvent)}
      className={`rounded-xl p-4 transition-colors select-none ${
        isCurrent
          ? "border border-primary/25 bg-primary/5"
          : "border border-transparent bg-surface-container hover:bg-surface-container-high"
      } ${canSelect || isCurrent ? "cursor-pointer" : "cursor-default"}`}>
      <div className="group flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/15">
          <svg className="size-5 text-secondary" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {isCurrent ? (
              <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary uppercase">
                {roomStatus === "revealed" ? "Revealed" : "Voting"}
              </span>
            ) : null}
            <a
              href={ticket.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-primary transition-colors hover:text-primary/80">
              {ticket.key}
              <LinkIcon className="shrink-0 opacity-70" />
            </a>
            {history && !expanded ? (
              <span className="text-xs text-on-surface-variant">· round {history.round}</span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="Remove ticket"
          disabled={!canRemove}
          className="shrink-0 cursor-pointer p-2 text-on-surface-variant transition-colors hover:text-error disabled:cursor-not-allowed disabled:opacity-30">
          ✕
        </button>
      </div>
      {expanded && history ? <VoteHistoryPanel history={history} /> : null}
    </div>
  );
}

function VotedTicketRow({ ticket, history }: { ticket: JiraTicket; history: TicketVoteHistory | undefined }) {
  const [expanded, setExpanded] = useState(false);
  const fib = history?.stats?.nearestFibonacci;
  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container px-4 py-3 opacity-95">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={ticket.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary">
          {ticket.key}
          <LinkIcon className="shrink-0 opacity-70" />
        </a>
        {history ? (
          <span className="text-sm font-semibold text-primary tabular-nums">{fib != null ? fib : "—"}</span>
        ) : null}
        {history ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="ml-auto inline-flex cursor-pointer items-center gap-1 text-xs text-on-surface-variant transition-colors hover:text-on-surface">
            {expanded ? "Hide votes" : "Show votes"}
            <span className="text-[10px]">{expanded ? "▲" : "▼"}</span>
          </button>
        ) : null}
      </div>
      {expanded && history ? <VoteHistoryPanel history={history} /> : null}
    </div>
  );
}

export function TicketPanel({
  roomStatus,
  tickets,
  votedTickets,
  currentTicketKey,
  voteHistory,
  onAddTicket,
  onRemoveTicket,
  onSetCurrentTicket,
}: Props) {
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const isTicketSelectionLocked = roomStatus === "revealed";

  const handleAdd = () => {
    const key = parseJiraKey(inputValue);
    if (!key) {
      setInputError("Paste a Jira URL like https://yourorg.atlassian.net/browse/PROJ-123");
      return;
    }
    if (tickets.some((t) => t.key === key)) {
      setInputError(`${key} is already in this room`);
      return;
    }
    onAddTicket(inputValue.trim());
    setInputValue("");
    setInputError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") {
      setInputValue("");
      setInputError(null);
    }
  };

  const mostRecentHistory = (key: string): TicketVoteHistory | undefined => {
    const all = voteHistory.filter((h) => h.ticketKey === key);
    return all.length > 0 ? all[all.length - 1] : undefined;
  };

  const currentTicket = currentTicketKey ? tickets.find((t) => t.key === currentTicketKey) : null;

  const importCard = (
    <div className="flex h-full flex-col gap-4 rounded-2xl bg-surface-container p-4 md:gap-5 md:p-5">
      <div>
        <h4 className="text-base font-bold text-on-surface md:text-lg">Import ticket</h4>
        <p className="text-xs text-on-surface-variant md:text-sm">
          Paste a Jira issue link to track what you&apos;re estimating.
        </p>
      </div>
      <div className="flex flex-col gap-2 md:gap-3">
        <label className="text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Jira URL</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setInputError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="https://…/browse/PROJ-123"
            className="min-w-0 flex-1 rounded-lg border-none bg-surface-container-lowest p-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/35 outline-none focus:ring-2 focus:ring-primary/40 md:p-3"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inputValue.trim()}
            title="Add ticket"
            className="flex shrink-0 items-center justify-center rounded-lg border border-outline-variant/25 bg-surface-container-high p-2.5 text-primary transition-colors hover:border-primary/40 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-35 md:p-3">
            <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
        </div>
        {inputError ? <p className="text-xs text-error">{inputError}</p> : null}
      </div>
    </div>
  );

  const listCard = (
    <div className="flex flex-col gap-4 rounded-2xl bg-surface-container-low p-4 md:gap-5 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-base font-bold text-on-surface md:text-lg">Up for estimation</h4>
          {tickets.length > 0 ? (
            <span className="mt-1 inline-block rounded-full bg-surface-container-high px-3 py-1 text-xs text-on-surface-variant">
              {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} in queue
            </span>
          ) : null}
        </div>
        {currentTicket ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-on-surface-variant">Estimating:</span>
            <a
              href={currentTicket.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 font-mono font-semibold text-primary hover:text-primary/85">
              {currentTicket.key}
              <LinkIcon className="shrink-0 opacity-70" />
            </a>
            <button
              type="button"
              onClick={() => onSetCurrentTicket(null)}
              title="Deselect — vote without a ticket"
              disabled={isTicketSelectionLocked}
              className="rounded-lg border border-outline-variant/20 px-2 py-1 text-xs text-on-surface-variant transition-colors hover:border-outline-variant/40 hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-35">
              Clear
            </button>
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">No ticket selected — voting isn&apos;t tied to an issue.</p>
        )}
      </div>

      {tickets.length === 0 && votedTickets.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No tickets yet. Add a Jira URL on the left.</p>
      ) : (
        <>
          {tickets.length > 0 ? (
            <div className="flex flex-col gap-3">
              {tickets.map((ticket) => (
                <TicketRow
                  key={ticket.key}
                  ticket={ticket}
                  isCurrent={ticket.key === currentTicketKey}
                  history={mostRecentHistory(ticket.key)}
                  canSelect={!isTicketSelectionLocked}
                  canRemove={!isTicketSelectionLocked || ticket.key !== currentTicketKey}
                  roomStatus={roomStatus}
                  onRowClick={() => onSetCurrentTicket(ticket.key === currentTicketKey ? null : ticket.key)}
                  onRemove={() => onRemoveTicket(ticket.key)}
                />
              ))}
            </div>
          ) : null}
          {votedTickets.length > 0 ? (
            <div className="flex flex-col gap-3 border-t border-outline-variant/10 pt-6">
              <h4 className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">Voted on</h4>
              {votedTickets.map((ticket) => (
                <VotedTicketRow key={ticket.key} ticket={ticket} history={mostRecentHistory(ticket.key)} />
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">{importCard}</div>
      <div className="lg:col-span-2">{listCard}</div>
    </div>
  );
}
