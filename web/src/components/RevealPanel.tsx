interface Props {
  onReveal: () => void;
  onRestart: () => void;
  isRevealed: boolean;
  hasParticipants: boolean;
}

export function RevealPanel({ onReveal, onRestart, isRevealed, hasParticipants }: Props) {
  if (!hasParticipants) return null;

  return (
    <div className="flex justify-center mb-6">
      {!isRevealed ? (
        <button
          className="px-8 py-3 text-base font-semibold bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors cursor-pointer"
          onClick={onReveal}
        >
          Reveal Votes
        </button>
      ) : (
        <button
          className="px-8 py-3 text-base font-semibold bg-violet-400 hover:bg-violet-500 text-white rounded-lg transition-colors cursor-pointer"
          onClick={onRestart}
        >
          Start New Round
        </button>
      )}
    </div>
  );
}
