import type { RoomStats } from '../types';

interface Props {
  stats: RoomStats;
}

export function StatsPanel({ stats }: Props) {
  return (
    <div className="stats-panel">
      <h3>Results</h3>
      <div className="stats-grid">
        {stats.average !== null && (
          <>
            <div className="stat-item">
              <span className="stat-label">Average</span>
              <span className="stat-value">{stats.average.toFixed(1)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Nearest Fibonacci</span>
              <span className="stat-value">{stats.nearestFibonacci}</span>
            </div>
          </>
        )}
        {stats.average === null && (
          <div className="stat-item">
            <span className="stat-label">No numeric votes</span>
          </div>
        )}
      </div>
      <div className="grouped-votes">
        <h4>Vote Distribution</h4>
        {stats.groupedVotes.map(({ vote, count }) => (
          <div key={vote} className="vote-group">
            <span className="vote-group-value">{vote}</span>
            <span className="vote-group-count">
              {count} {count === 1 ? 'vote' : 'votes'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
