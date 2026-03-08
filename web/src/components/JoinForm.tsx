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
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h2 className="text-2xl font-bold text-white">Join Room</h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          maxLength={30}
          autoFocus
          disabled={disabled}
          className="px-4 py-2.5 text-base bg-surface border border-border rounded-lg text-slate-100 outline-none focus:border-blue-500 w-60"
        />
        <button
          type="submit"
          disabled={disabled || !name.trim()}
          className="px-6 py-2.5 text-base font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Join
        </button>
      </form>
    </div>
  );
}
