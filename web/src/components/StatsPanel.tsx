import type { RoomStats } from '../types';

interface Props {
  stats: RoomStats;
}

export function StatsPanel({ stats }: Props) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <h3 className="text-lg font-semibold mb-3 text-white">Results</h3>

      <div className="flex gap-6 mb-4">
        {stats.average !== null ? (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">Average</span>
              <span className="text-2xl font-bold text-violet-400">{stats.average.toFixed(1)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">Nearest Fibonacci</span>
              <span className="text-2xl font-bold text-violet-400">{stats.nearestFibonacci}</span>
            </div>
          </>
        ) : (
          <span className="text-sm text-slate-400">No numeric votes</span>
        )}
      </div>

      <div className="border-t border-border pt-3">
        <h4 className="text-sm text-slate-400 mb-2">Vote Distribution</h4>
        {stats.groupedVotes.map(({ vote, count }) => (
          <div key={vote} className="flex items-center gap-2 py-1">
            <span className="font-bold min-w-7 text-white">{vote}</span>
            <span className="text-sm text-slate-400">
              {count} {count === 1 ? 'vote' : 'votes'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
