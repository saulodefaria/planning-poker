import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const createRoom = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rooms', { method: 'POST' });
      const data = await res.json();
      navigate(data.roomUrl);
    } catch {
      alert('Failed to create room. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
      <h1 className="text-4xl sm:text-5xl font-bold text-white">Planning Poker</h1>
      <p className="text-slate-400 text-lg">Estimate stories with your team in real time.</p>
      <button
        className="mt-4 px-10 py-3.5 text-lg font-semibold bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg transition-colors cursor-pointer"
        onClick={createRoom}
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Room'}
      </button>
    </div>
  );
}
