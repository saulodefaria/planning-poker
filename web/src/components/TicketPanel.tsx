import { useState } from 'react';
import type { JiraTicket, TicketVoteHistory } from '../types';

interface Props {
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
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function VoteHistoryPanel({ history }: { history: TicketVoteHistory }) {
  return (
    <div className="mt-2 pt-2 border-t border-border space-y-2">
      <div className="flex gap-4">
        {history.stats?.average !== null && history.stats != null ? (
          <>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400">Average</span>
              <span className="text-base font-bold text-violet-400">{history.stats.average?.toFixed(1)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400">Nearest Fib</span>
              <span className="text-base font-bold text-violet-400">{history.stats.nearestFibonacci}</span>
            </div>
          </>
        ) : (
          <span className="text-xs text-slate-400">No numeric votes</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {history.votes.map((v) => (
          <span
            key={v.participantName}
            className="inline-flex items-center gap-1 text-xs rounded-md px-2 py-0.5 bg-slate-800 text-slate-300 border border-border">
            <span className="text-slate-400">{v.participantName}</span>
            <span className="font-semibold text-white">{v.vote ?? '—'}</span>
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
}: {
  ticket: JiraTicket;
  isCurrent: boolean;
  history: TicketVoteHistory | undefined;
  onRowClick: () => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a[href], button')) return;
    if (isCurrent && history) {
      setExpanded((v) => !v);
    } else if (isCurrent) {
      onRowClick(); // deselect (set to null)
    } else {
      onRowClick(); // select this ticket
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => e.key === 'Enter' && handleRowClick(e as unknown as React.MouseEvent)}
      className={`rounded-lg border px-3 py-2.5 transition-colors cursor-pointer select-none ${
        isCurrent
          ? 'border-blue-500 bg-blue-500/20 ring-2 ring-blue-400/50'
          : 'border-border bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/60'
      }`}>
      <div className="flex items-center gap-2">
        {isCurrent && (
          <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/30 px-1.5 py-0.5 rounded">
            Voting
          </span>
        )}

        <a
          href={ticket.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
          {ticket.key}
          <LinkIcon className="flex-shrink-0 opacity-70" />
        </a>

        {history && !expanded && (
          <span className="text-xs text-slate-400">· round {history.round}</span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="Remove ticket"
          className="ml-auto text-slate-500 hover:text-red-400 transition-colors cursor-pointer text-sm leading-none p-0.5">
          ✕
        </button>
      </div>

      {expanded && history && <VoteHistoryPanel history={history} />}
    </div>
  );
}

function VotedTicketRow({ ticket, history }: { ticket: JiraTicket; history: TicketVoteHistory | undefined }) {
  const [expanded, setExpanded] = useState(false);
  const fib = history?.stats?.nearestFibonacci;
  return (
    <div className="rounded-lg border border-border bg-slate-800/30 px-3 py-2.5 opacity-90">
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={ticket.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-slate-400 hover:text-blue-400 transition-colors">
          {ticket.key}
          <LinkIcon className="flex-shrink-0 opacity-70" />
        </a>
        {history && (
          <span className="text-sm text-violet-400 font-semibold tabular-nums">
            {fib != null ? fib : '—'}
          </span>
        )}
        {history && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
            {expanded ? 'hide votes' : 'show votes'}
            <span className="text-[10px]">{expanded ? '▲' : '▼'}</span>
          </button>
        )}
      </div>
      {expanded && history && <VoteHistoryPanel history={history} />}
    </div>
  );
}

export function TicketPanel({
  tickets,
  votedTickets,
  currentTicketKey,
  voteHistory,
  onAddTicket,
  onRemoveTicket,
  onSetCurrentTicket,
}: Props) {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const handleAdd = () => {
    const key = parseJiraKey(inputValue);
    if (!key) {
      setInputError('Paste a Jira URL like https://yourorg.atlassian.net/browse/PROJ-123');
      return;
    }
    if (tickets.some((t) => t.key === key)) {
      setInputError(`${key} is already in this room`);
      return;
    }
    onAddTicket(inputValue.trim());
    setInputValue('');
    setInputError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') {
      setInputValue('');
      setInputError(null);
    }
  };

  const mostRecentHistory = (key: string): TicketVoteHistory | undefined => {
    const all = voteHistory.filter((h) => h.ticketKey === key);
    return all.length > 0 ? all[all.length - 1] : undefined;
  };

  const currentTicket = currentTicketKey ? tickets.find((t) => t.key === currentTicketKey) : null;

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-white">Tickets</h3>
        {currentTicket ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Estimating:</span>
            <a
              href={currentTicket.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 font-mono font-semibold text-blue-400 hover:text-blue-300">
              {currentTicket.key}
              <LinkIcon className="flex-shrink-0 opacity-70" />
            </a>
            <button
              type="button"
              onClick={() => onSetCurrentTicket(null)}
              title="Deselect — vote without a ticket"
              className="text-xs text-slate-500 hover:text-white border border-slate-600 hover:border-slate-400 rounded px-2 py-0.5 transition-colors cursor-pointer">
              Clear
            </button>
          </div>
        ) : (
          <span className="text-sm text-slate-500">No ticket selected — voting not tied to a ticket</span>
        )}
      </div>

      <div className="flex gap-2 mb-1">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setInputError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Paste a Jira URL…"
          className="flex-1 rounded-lg bg-slate-800 border border-border text-sm text-white placeholder-slate-500 px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="px-4 py-2 text-sm font-semibold bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors cursor-pointer">
          Add
        </button>
      </div>

      {inputError && <p className="text-xs text-red-400 mb-2">{inputError}</p>}

      {tickets.length === 0 && votedTickets.length === 0 ? (
        <p className="text-sm text-slate-400 mt-3">No tickets yet. Paste a Jira URL above to add one.</p>
      ) : (
        <>
          {tickets.length > 0 && (
            <div className="space-y-2 mt-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Up for estimation</h4>
              {tickets.map((ticket) => (
                <TicketRow
                  key={ticket.key}
                  ticket={ticket}
                  isCurrent={ticket.key === currentTicketKey}
                  history={mostRecentHistory(ticket.key)}
                  onRowClick={() =>
                    onSetCurrentTicket(ticket.key === currentTicketKey ? null : ticket.key)
                  }
                  onRemove={() => onRemoveTicket(ticket.key)}
                />
              ))}
            </div>
          )}
          {votedTickets.length > 0 && (
            <div className="space-y-2 mt-4 pt-4 border-t border-border">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Voted on</h4>
              {votedTickets.map((ticket) => (
                <VotedTicketRow
                  key={ticket.key}
                  ticket={ticket}
                  history={mostRecentHistory(ticket.key)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
