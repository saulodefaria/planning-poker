import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SiteHeader } from "../components/SiteHeader";
import { createRoom, toRoomError } from "../services/room-api";
import { VOTE_DECK } from "../types";

function SpeedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.38 8.57l-1.23 1.85a8 8 0 01-.22 7.58H5.07A8 8 0 0115.58 6.85l1.85-1.23A10 10 0 003.35 19h17.3a10 10 0 00-2.27-10.43zM10.59 15.41a2 2 0 002.83 2.83l5.66-8.49-8.49 5.66z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
    </svg>
  );
}

function MeetingRoomIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-8-2h2v-4h4v-2h-4V7h-2v4H7v2h4z" />
    </svg>
  );
}

const PREVIEW_VALUES: readonly string[] = ["?", "1", "2", "3", "5", "8", "13"];

export function HomePage() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = roomName.trim();
    if (!trimmedName) return;

    setLoading(true);
    setError(null);

    try {
      const data = await createRoom(trimmedName);
      navigate(data.roomUrl);
    } catch (err) {
      setError(toRoomError(err, "Failed to create room. Is the server running?").message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-surface text-on-surface">
      <SiteHeader />

      <div className="pointer-events-none absolute top-[-10%] left-[-5%] -z-10 h-[60%] w-[40%] rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-5%] bottom-[-10%] -z-10 h-[50%] w-[30%] rounded-full bg-secondary/5 blur-[100px]" />

      <main className="flex flex-1 flex-col">
        <section className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 pt-16 pb-20 lg:grid-cols-12 lg:pt-20 lg:pb-28">
          <div className="space-y-8 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant/15 bg-surface-container-low px-3 py-1">
              <span className="size-2 animate-pulse rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                Live estimation
              </span>
            </div>

            <h1 className="text-5xl leading-[1.1] font-extrabold tracking-tight text-on-surface lg:text-7xl">
              Better estimates. <br />
              <span className="bg-linear-to-r from-primary to-primary-container bg-clip-text text-transparent">
                Frictionless flow.
              </span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-on-surface-variant">
              Name the room once, share the link, and let the team vote in sync—without the clutter of a typical standup
              tool.
            </p>

            <div className="grid max-w-lg grid-cols-2 gap-4">
              <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
                <SpeedIcon className="mb-3 size-7 text-primary" />
                <h3 className="text-lg font-bold text-on-surface">Real-time</h3>
                <p className="mt-1 text-xs text-on-surface-variant">Reveal when everyone is ready.</p>
              </div>
              <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
                <LockIcon className="mb-3 size-7 text-secondary" />
                <h3 className="text-lg font-bold text-on-surface">Ephemeral</h3>
                <p className="mt-1 text-xs text-on-surface-variant">Rooms expire after idle time.</p>
              </div>
            </div>
          </div>

          <div className="relative lg:col-span-5">
            <div className="glass-card neon-glow relative overflow-hidden rounded-4xl border border-outline-variant/20 p-8 sm:p-10">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <span className="text-7xl font-light text-on-surface">♠</span>
              </div>
              <div className="relative z-10 space-y-8">
                <div>
                  <h2 className="mb-2 text-2xl font-bold text-on-surface">Estimate stories in real time</h2>
                  <p className="text-sm text-on-surface-variant">Create a session and invite your squad.</p>
                </div>

                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div>
                    <label
                      htmlFor="room-name"
                      className="mb-2 block px-1 text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
                      Room name
                    </label>
                    <div className="relative">
                      <MeetingRoomIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        id="room-name"
                        type="text"
                        value={roomName}
                        onChange={(event) => setRoomName(event.target.value)}
                        placeholder="Sprint 42 — Grooming"
                        maxLength={30}
                        autoFocus
                        disabled={loading}
                        className="w-full rounded-xl border-none bg-surface-container-lowest py-4 pr-4 pl-12 text-on-surface placeholder:text-on-surface-variant/40 transition-shadow outline-none ring-0 focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !roomName.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-br from-primary to-primary-container py-4 font-bold text-on-primary shadow-[0_10px_30px_rgba(78,222,163,0.2)] transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">
                    <span>{loading ? "Creating…" : "Create room"}</span>
                    {!loading ? (
                      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    ) : null}
                  </button>

                  {error ? <p className="text-sm text-error">{error}</p> : null}
                </form>

                <div className="flex items-center gap-3 border-t border-outline-variant/10 pt-4">
                  <svg className="size-4 shrink-0 text-on-surface-variant" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.962 8.962 0 0012 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                  </svg>
                  <p className="text-xs text-on-surface-variant/80 italic">
                    Rooms expire after 24 hours without activity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-24">
          <h4 className="mb-8 text-center text-[10px] font-bold tracking-[0.4em] text-on-surface-variant/50 uppercase">
            Fibonacci deck
          </h4>
          <div className="flex flex-wrap justify-center gap-4">
            {PREVIEW_VALUES.map((v) => {
              const isSelected = v === "3";
              return (
                <div
                  key={v}
                  className={`flex h-24 w-16 cursor-default items-center justify-center rounded-xl transition-transform ${
                    isSelected
                      ? "border-4 border-primary/20 bg-primary shadow-[0_0_20px_rgba(78,222,163,0.3)]"
                      : "border border-outline-variant/10 bg-surface-container-highest"
                  }`}>
                  <span className={`text-xl font-bold ${isSelected ? "text-on-primary" : "text-on-surface-variant"}`}>
                    {v}
                  </span>
                </div>
              );
            })}
            <div className="flex h-24 w-16 items-center justify-center rounded-xl border border-outline-variant/10 bg-surface-container-highest">
              <span className="text-xl text-on-surface-variant">☕</span>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-on-surface-variant/60">
            In the room you&apos;ll use the full set: {VOTE_DECK.join(", ")}.
          </p>
        </section>
      </main>

      <footer className="mt-auto border-t border-outline-variant/10 bg-surface-container-lowest py-10">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-[10px] tracking-widest text-on-surface-variant/40 uppercase">
            Planning Poker — built for focused estimation
          </p>
        </div>
      </footer>
    </div>
  );
}
