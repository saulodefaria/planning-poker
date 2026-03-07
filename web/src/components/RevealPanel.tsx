interface Props {
  onReveal: () => void;
  onRestart: () => void;
  isRevealed: boolean;
  hasParticipants: boolean;
}

export function RevealPanel({ onReveal, onRestart, isRevealed, hasParticipants }: Props) {
  if (!hasParticipants) return null;

  return (
    <div className="reveal-panel">
      {!isRevealed ? (
        <button className="btn-reveal" onClick={onReveal}>
          Reveal Votes
        </button>
      ) : (
        <button className="btn-restart" onClick={onRestart}>
          Start New Round
        </button>
      )}
    </div>
  );
}
