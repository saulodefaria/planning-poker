import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SiteHeader } from "../components/SiteHeader";
import { createRoom, toRoomError } from "../services/room-api";

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
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto flex min-h-[calc(100vh-81px)] max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Estimate stories in real time</h1>
          <p className="text-lg text-slate-400">Name the room once, share the link, and let the team vote live.</p>
        </div>

        <form
          onSubmit={handleCreateRoom}
          className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-left shadow-2xl shadow-slate-950/20">
          <label htmlFor="room-name" className="mb-2 block text-sm font-medium text-slate-200">
            Room name
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="room-name"
              type="text"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              placeholder="Sprint 42 backlog refinement"
              maxLength={30}
              autoFocus
              disabled={loading}
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-base text-slate-100 outline-none transition-colors focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !roomName.trim()}
              className="rounded-xl bg-blue-500 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Creating..." : "Create room"}
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-400">Rooms expire after 24 hours without activity.</p>
          {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        </form>
      </main>
    </div>
  );
}
