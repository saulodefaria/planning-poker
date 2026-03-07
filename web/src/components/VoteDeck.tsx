import { VOTE_DECK } from '../types';
import type { VoteValue } from '../types';

interface Props {
  selectedVote: VoteValue | null;
  onVote: (vote: VoteValue) => void;
  disabled?: boolean;
}

export function VoteDeck({ selectedVote, onVote, disabled }: Props) {
  return (
    <div className="vote-deck">
      {VOTE_DECK.map((value) => (
        <button
          key={value}
          className={`vote-card ${selectedVote === value ? 'selected' : ''}`}
          onClick={() => onVote(value)}
          disabled={disabled}
        >
          {value}
        </button>
      ))}
    </div>
  );
}
