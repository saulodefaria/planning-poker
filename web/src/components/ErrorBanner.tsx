import type { RoomError } from "../types";

interface Props {
  error: RoomError | null;
  onDismiss: () => void;
}

export function ErrorBanner({ error, onDismiss }: Props) {
  if (!error) return null;

  return (
    <div className="mb-4 flex items-center justify-between rounded-xl border border-error/30 bg-error-container/40 px-4 py-3 text-on-error-container">
      <span className="text-sm">{error.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-4 cursor-pointer text-xl leading-none hover:opacity-80"
        aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
