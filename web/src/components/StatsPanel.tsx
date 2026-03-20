import { useMemo } from "react";
import { VOTE_DECK, type RoomStats } from "../types";

interface Props {
  stats: RoomStats;
}

function deckOrderIndex(vote: string): number {
  const i = (VOTE_DECK as readonly string[]).indexOf(vote);
  return i === -1 ? 999 : i;
}

function voteRowLabel(vote: string): string {
  if (vote === "?") return "Uncertain";
  return `${vote} Points`;
}

export function StatsPanel({ stats }: Props) {
  const { rows, maxCount, totalVotes } = useMemo(() => {
    const sorted = [...stats.groupedVotes].sort(
      (a, b) => b.count - a.count || deckOrderIndex(a.vote) - deckOrderIndex(b.vote),
    );
    const max = Math.max(0, ...sorted.map((g) => g.count));
    const total = sorted.reduce((sum, g) => sum + g.count, 0);
    return { rows: sorted, maxCount: max, totalVotes: total };
  }, [stats.groupedVotes]);

  return (
    <div className="mb-5 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 md:mb-6 md:p-6">
      <h3 className="mb-4 text-base font-bold text-on-surface md:mb-5 md:text-lg">Results</h3>

      <div className="flex flex-col gap-6 md:flex-row md:items-stretch md:gap-0">
        <div className="flex shrink-0 flex-wrap gap-6 md:flex-col md:gap-5 md:pr-8 lg:pr-10">
          {stats.average !== null ? (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-on-surface-variant">Average</span>
                <span className="text-2xl font-bold text-primary tabular-nums">{stats.average.toFixed(1)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-on-surface-variant">Nearest Fibonacci</span>
                <span className="text-2xl font-bold text-secondary tabular-nums">
                  {stats.nearestFibonacci ?? "—"}
                </span>
              </div>
            </>
          ) : (
            <span className="text-sm text-on-surface-variant">No numeric votes</span>
          )}
        </div>

        {rows.length > 0 ? (
          <div className="min-w-0 flex-1 border-t border-outline-variant/10 pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-8 lg:pl-10">
            <h4 className="mb-3 text-sm text-on-surface-variant md:mb-4">Vote distribution</h4>
            <ul className="flex flex-col gap-3.5 md:gap-4" aria-label="Votes per card value">
              {rows.map(({ vote, count }) => {
                const isLeader = maxCount > 0 && count === maxCount;
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                const aria = `${voteRowLabel(vote)}: ${count} ${count === 1 ? "vote" : "votes"}, ${pct} percent`;
                return (
                  <li key={vote} className="min-w-0" aria-label={aria}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                      <span
                        className={`min-w-0 truncate font-semibold tracking-tight ${
                          isLeader ? "text-primary" : "text-on-surface-variant"
                        }`}>
                        {voteRowLabel(vote)}
                      </span>
                      <span
                        className={`shrink-0 tabular-nums ${
                          isLeader ? "font-medium text-primary" : "font-medium text-on-surface-variant/85"
                        }`}>
                        {count} {count === 1 ? "vote" : "votes"} ({pct}%)
                      </span>
                    </div>
                    <div
                      className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high/60"
                      role="presentation">
                      <div
                        className={`h-full min-w-0 rounded-full transition-[width] duration-300 ${
                          isLeader ? "bg-primary shadow-[0_0_12px_rgba(78,222,163,0.25)]" : "bg-on-surface-variant/22"
                        }`}
                        style={{ width: `${pct}%`, minWidth: count > 0 ? 2 : 0 }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
