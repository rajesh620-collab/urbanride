import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

export default function PoolDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPool = async () => {
    try {
      const res = await api.get(`/pools/${id}`);
      setPool(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pool details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPool();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchPool, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const handleStartPool = async () => {
    try {
      setLoading(true);
      await api.post(`/pools/${id}/start`);
      fetchPool();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start pool');
      setLoading(false);
    }
  };

  if (loading && !pool) return <div className="page-wrapper" style={{ textAlign: 'center', padding: 100 }}><div className="spinner" /></div>;
  if (error) return <div className="page-wrapper"><div className="alert-error">{error}</div></div>;
  if (!pool) return <div className="page-wrapper"><div className="alert-error">Pool not found</div></div>;

  const isLeader = pool.leader._id === user.id;

  return (
    <div className="page-wrapper" style={{ maxWidth: 540 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 26, letterSpacing: '-0.02em' }}>Ride Pool</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
              Status: <span style={{ fontWeight: 600, color: 'var(--coral)', textTransform: 'capitalize' }}>{pool.status}</span>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Pool Code</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--charcoal)', letterSpacing: 2 }}>{pool.poolCode}</p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>Pickup</p>
            <p style={{ fontWeight: 600 }}>{pool.sourceLandmark}</p>
          </div>
          <div style={{ color: 'var(--coral)', fontSize: 20 }}>→</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>Destination</p>
            <p style={{ fontWeight: 600 }}>{pool.destinationLandmark}</p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Members ({pool.members.length}/{pool.maxParticipants})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pool.members.map((member, idx) => (
              <div key={member._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                    {member.name?.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500 }}>{member.name} {member._id === pool.leader._id && <span style={{ fontSize: 10, background: 'var(--coral-pale)', color: 'var(--coral)', padding: '2px 6px', borderRadius: 4, marginLeft: 4 }}>Leader</span>}</p>
                    {member.phone && <p style={{ fontSize: 11, color: 'var(--muted)' }}>{member.phone}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Share Section */}
      <div className="card" style={{ textAlign: 'center', padding: '24px 20px', marginBottom: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Invite friends to join</p>
        <button 
            type="button"
            className="btn-outline" 
            onClick={() => {
                navigator.clipboard.writeText(pool.poolCode);
                alert('Pool code copied to clipboard!');
            }}
            style={{ fontSize: 13 }}
        >
            📋 Copy Pool Code
        </button>
      </div>

      {/* Actions */}
      {isLeader && pool.status === 'waiting' && (
        <button 
          onClick={handleStartPool} 
          className="btn-primary" 
          disabled={loading}
          style={{ padding: '16px' }}
        >
          {loading ? 'Starting...' : '🚀 Start Ride Pool'}
        </button>
      )}

      {pool.status === 'active' && (
        <div className="alert-success" style={{ textAlign: 'center', padding: 20 }}>
          <p style={{ fontWeight: 600, color: 'var(--success)' }}>Ride Pool is Active!</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Waiting for a driver to accept the ride...</p>
        </div>
      )}

      {pool.status === 'picked_up' && (
        <div className="alert-success" style={{ textAlign: 'center', padding: 20 }}>
          <p style={{ fontWeight: 600, color: 'var(--success)' }}>You've been picked up!</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Ride in progress...</p>
        </div>
      )}
    </div>
  );
}
