import { VOTE_DECK } from '../types';
import type { VoteValue } from '../types';

interface Props {
  selectedVote: VoteValue | null;
  onVote: (vote: VoteValue) => void;
  disabled?: boolean;
}

export function VoteDeck({ selectedVote, onVote, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mb-6">
      {VOTE_DECK.map((value) => (
        <button
          key={value}
          className={`w-13 h-18 text-lg font-bold rounded-lg border-2 transition-all duration-150 cursor-pointer
            ${
              selectedVote === value
                ? 'bg-blue-500 border-blue-500 text-white -translate-y-1'
                : 'bg-surface border-border text-slate-100 hover:border-blue-500 hover:-translate-y-1'
            }
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
          onClick={() => onVote(value)}
          disabled={disabled}
        >
          {value}
        </button>
      ))}
    </div>
  );
}
