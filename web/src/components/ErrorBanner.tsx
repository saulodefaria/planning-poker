import type { RoomError } from '../types';

interface Props {
  error: RoomError | null;
  onDismiss: () => void;
}

export function ErrorBanner({ error, onDismiss }: Props) {
  if (!error) return null;

  return (
    <div className="flex items-center justify-between bg-red-500 text-white px-4 py-2.5 rounded-lg mb-4">
      <span className="text-sm">{error.message}</span>
      <button onClick={onDismiss} className="ml-4 text-xl leading-none hover:opacity-80 cursor-pointer">
        &times;
      </button>
    </div>
  );
}
