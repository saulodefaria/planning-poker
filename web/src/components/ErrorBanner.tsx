import type { RoomError } from '../types';

interface Props {
  error: RoomError | null;
  onDismiss: () => void;
}

export function ErrorBanner({ error, onDismiss }: Props) {
  if (!error) return null;

  return (
    <div className="error-banner">
      <span>{error.message}</span>
      <button onClick={onDismiss} className="error-dismiss">&times;</button>
    </div>
  );
}
