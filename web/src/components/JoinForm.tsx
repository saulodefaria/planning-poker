import { useEffect, useState } from "react";

interface Props {
  defaultName?: string;
  roomName?: string;
  onJoin: (name: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

export function JoinForm({ defaultName = "", roomName, onJoin, disabled, loading }: Props) {
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onJoin(trimmed);
  };

  return (
    <div className="flex w-full min-w-0 flex-col items-center justify-center px-4 py-12">
      <section className="w-full max-w-lg">
        <div className="nocturne-glass neon-glow rounded-4xl border border-outline-variant/15 p-8 shadow-[0_20px_40px_rgba(0,0,0,0.4)] md:p-12">
          <div className="mb-10 text-left">
            <h1 className="mb-4 text-4xl font-extrabold tracking-tighter text-on-surface md:text-5xl">
              {roomName ? `Join ${roomName}` : "Join room"}
            </h1>
            <p className="max-w-sm text-lg leading-relaxed text-on-surface-variant">
              Enter the name your teammates will see at the table.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label
                htmlFor="join-display-name"
                className="px-1 text-xs font-bold tracking-widest text-primary uppercase">
                Identification
              </label>
              <div className="group relative">
                <PersonIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary" />
                <input
                  id="join-display-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={30}
                  autoFocus
                  autoComplete="off"
                  disabled={disabled}
                  className="w-full rounded-2xl border-none bg-surface-container-lowest py-5 pr-6 pl-12 text-lg font-medium text-on-surface placeholder:text-on-surface-variant/40 transition-shadow outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={disabled || !name.trim()}
              className="group relative w-full overflow-hidden rounded-full bg-linear-to-br from-primary to-primary-container py-5 text-lg font-bold text-on-primary neon-glow transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? "Joining…" : "Join table"}
                {!loading ? (
                  <svg
                    className="size-5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                ) : null}
              </span>
            </button>
          </form>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/10 pt-8">
            <p className="text-xs font-medium text-on-surface-variant">Your vote stays hidden until the reveal.</p>
            <div className="flex items-center gap-1 text-on-surface-variant/50">
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
              <span className="text-[10px] font-bold tracking-tight uppercase">Session</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
