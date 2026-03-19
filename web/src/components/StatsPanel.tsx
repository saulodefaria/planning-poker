import type { RoomStats } from "../types";

interface Props {
  stats: RoomStats;
}

export function StatsPanel({ stats }: Props) {
  return (
    <div className="mb-5 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 md:mb-6 md:p-6">
      <h3 className="mb-3 text-base font-bold text-on-surface md:mb-4 md:text-lg">Results</h3>

      <div className="mb-4 flex flex-wrap gap-6 md:mb-6 md:gap-8">
        {stats.average !== null ? (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-on-surface-variant">Average</span>
              <span className="text-2xl font-bold text-primary tabular-nums">{stats.average.toFixed(1)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-on-surface-variant">Nearest Fibonacci</span>
              <span className="text-2xl font-bold text-secondary tabular-nums">{stats.nearestFibonacci}</span>
            </div>
          </>
        ) : (
          <span className="text-sm text-on-surface-variant">No numeric votes</span>
        )}
      </div>

      <div className="border-t border-outline-variant/10 pt-4">
        <h4 className="mb-3 text-sm text-on-surface-variant">Vote distribution</h4>
        {stats.groupedVotes.map(({ vote, count }) => (
          <div key={vote} className="flex items-center gap-3 py-1.5">
            <span className="min-w-8 font-bold text-on-surface">{vote}</span>
            <span className="text-sm text-on-surface-variant">
              {count} {count === 1 ? "vote" : "votes"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
