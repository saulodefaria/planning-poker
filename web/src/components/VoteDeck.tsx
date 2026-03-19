import { VOTE_DECK } from "../types";
import type { VoteValue } from "../types";

interface Props {
  selectedVote: VoteValue | null;
  onVote: (vote: VoteValue) => void;
  disabled?: boolean;
}

function CardsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z" />
    </svg>
  );
}

export function VoteDeck({ selectedVote, onVote, disabled = false }: Props) {
  return (
    <section className="mb-5 flex flex-col gap-4 md:mb-6" data-testid="vote-deck">
      <h3 className="flex items-center gap-2 text-base font-semibold text-on-surface md:gap-3 md:text-lg">
        <CardsIcon className="size-5 text-primary md:size-6" />
        Pick your card
      </h3>
      <div className="flex flex-wrap justify-center gap-2 md:gap-3">
        {VOTE_DECK.map((value) => {
          const selected = selectedVote === value;
          return (
            <button
              key={value}
              type="button"
              className={`flex h-[4.25rem] w-[2.75rem] cursor-pointer items-center justify-center rounded-lg text-lg font-bold transition-all md:h-[5.25rem] md:w-14 md:rounded-xl md:text-xl ${
                selected
                  ? "-translate-y-1 border-none bg-primary text-on-primary shadow-[0_0_20px_rgba(78,222,163,0.35)] md:-translate-y-2"
                  : "border border-outline-variant/10 bg-surface-container-highest text-on-surface hover:-translate-y-1 hover:bg-surface-container-high md:hover:-translate-y-2"
              } disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0`}
              onClick={() => onVote(value)}
              disabled={disabled}>
              {value}
            </button>
          );
        })}
      </div>
    </section>
  );
}
