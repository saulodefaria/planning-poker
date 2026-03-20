import { useMemo } from "react";
import { VOTE_DECK, type RoomStats } from "../types";

interface Props {
  stats: RoomStats;
}

function deckOrderIndex(vote: string): number {
  const i = (VOTE_DECK as readonly string[]).indexOf(vote);
  return i === -1 ? 999 : i;
}

export function StatsPanel({ stats }: Props) {
  const { sortedVotes, maxCount } = useMemo(() => {
    const sorted = [...stats.groupedVotes].sort((a, b) => deckOrderIndex(a.vote) - deckOrderIndex(b.vote));
    const max = Math.max(0, ...sorted.map((g) => g.count));
    return { sortedVotes: sorted, maxCount: max };
  }, [stats.groupedVotes]);

  const scale = maxCount > 0 ? maxCount : 1;

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

        {sortedVotes.length > 0 ? (
          <div className="min-w-0 flex-1 border-t border-outline-variant/10 pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-8 lg:pl-10">
            <h4 className="mb-4 text-sm text-on-surface-variant">Vote distribution</h4>
            <div
              className="flex h-36 items-end gap-1.5 sm:gap-2 md:h-40"
              role="list"
              aria-label="Votes per card value">
              {sortedVotes.map(({ vote, count }) => {
                const heightPct = (count / scale) * 100;
                const label = `${vote}: ${count} ${count === 1 ? "vote" : "votes"}`;
                return (
                  <div
                    key={vote}
                    className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                    role="listitem"
                    aria-label={label}>
                    <div className="flex h-28 w-full flex-col justify-end md:h-32">
                      <div
                        className="w-full rounded-t-md bg-linear-to-t from-primary/50 to-primary shadow-[0_0_12px_rgba(78,222,163,0.2)] transition-[height] duration-300"
                        style={{
                          height: `${heightPct}%`,
                          minHeight: count > 0 ? 4 : 0,
                        }}
                      />
                    </div>
                    <span className="text-center text-xs font-bold tabular-nums text-on-surface">{vote}</span>
                    <span className="text-center text-[10px] font-medium tabular-nums text-on-surface-variant/80">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
