import { useState } from 'react';

interface Props {
  defaultName?: string;
  onJoin: (name: string) => void;
  disabled?: boolean;
}

export function JoinForm({ defaultName = '', onJoin, disabled }: Props) {
  const [name, setName] = useState(defaultName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onJoin(trimmed);
  };

  return (
    <div className="join-form-container">
      <h2>Join Room</h2>
      <form onSubmit={handleSubmit} className="join-form">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          maxLength={30}
          autoFocus
          disabled={disabled}
        />
        <button type="submit" disabled={disabled || !name.trim()}>
          Join
        </button>
      </form>
    </div>
  );
}
