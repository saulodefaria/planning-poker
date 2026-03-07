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
    <div className="home-page">
      <h1>Planning Poker</h1>
      <p>Estimate stories with your team in real time.</p>
      <button className="btn-create" onClick={createRoom} disabled={loading}>
        {loading ? 'Creating...' : 'Create Room'}
      </button>
    </div>
  );
}
