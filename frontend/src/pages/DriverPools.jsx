import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

export default function DriverPools() {
    const navigate = useNavigate();
    const [pools, setPools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const fetchPools = async () => {
        try {
            const res = await api.get('/pools/active/driver-view');
            setPools(res.data.data || []);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch group pools');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPools();
    }, []);

    const handleAcceptPool = async (poolId) => {
        try {
            const res = await api.post(`/pools/${poolId}/accept`);
            setSuccess(res.data.message);
            fetchPools();
            setTimeout(() => {
                setSuccess('');
                // Optionally navigate to navigation view
                // navigate(`/navigate/pool-${poolId}`);
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to accept pool');
            setTimeout(() => setError(''), 3000);
        }
    };

    return (
        <div className="page-wrapper" style={{ maxWidth: 640 }}>
            <div style={{ marginBottom: 28 }}>
                <button onClick={() => navigate(-1)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--muted)', fontSize: 13, display: 'flex',
                    alignItems: 'center', gap: 4, padding: 0, marginBottom: 16
                }}>← Back</button>
                <h2 style={{ fontSize: 26, letterSpacing: '-0.02em' }}>Active Group Pools</h2>
                <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
                    Pick up a ready group — higher earnings, less waiting
                </p>
            </div>

            {success && <div className="alert-success" style={{ marginBottom: 20 }}>{success}</div>}
            {error && <div className="alert-error" style={{ marginBottom: 20 }}>{error}</div>}

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : pools.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                    <p style={{ color: 'var(--muted)' }}>No active group pools at the moment.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                    {pools.map(pool => (
                        <div key={pool._id} className="card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--coral)', textTransform: 'uppercase' }}>Group Ride · {pool.members.length} People</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                        <span style={{ fontWeight: 600 }}>{pool.sourceLandmark}</span>
                                        <span style={{ color: 'var(--coral)' }}>→</span>
                                        <span style={{ fontWeight: 600 }}>{pool.destinationLandmark}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>Lead by</p>
                                    <p style={{ fontWeight: 600, fontSize: 14 }}>{pool.leader?.name}</p>
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Members</p>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    {pool.members.map((m, i) => (
                                        <span key={i} style={{ fontSize: 10, background: 'var(--cream-dark)', padding: '2px 8px', borderRadius: 4 }}>
                                            {m.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => handleAcceptPool(pool._id)}
                                className="btn-primary"
                                style={{ padding: '10px' }}
                            >
                                Accept & Start Pickup
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
