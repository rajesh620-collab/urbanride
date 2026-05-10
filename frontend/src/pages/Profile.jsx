import { useState } from 'react';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleVerify = async (type) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.patch('/auth/verify-identity', { type });
      // Update local user state
      if (login) login(res.data.token); // Assuming token refresh updates user
      setMessage(`${type === 'aadhar' ? 'Aadhar' : 'Gender'} verified successfully!`);
      window.location.reload(); // Hard refresh to update context for now
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: 500 }}>
      <div className="card">
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>Account & Safety</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>Manage your verification status and trust badges</p>

        {message && <div className="alert-success" style={{ marginBottom: 20 }}>{message}</div>}
        {error && <div className="alert-error" style={{ marginBottom: 20 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* User Info */}
          <div style={{ padding: 16, background: 'var(--cream)', borderRadius: 16 }}>
             <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Name</p>
             <p style={{ fontWeight: 700, fontSize: 18 }}>{user?.name}</p>
          </div>

          {/* Verification Sections */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15 }}>Aadhar Verification</p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>Verify your identity with official ID</p>
              </div>
              {user?.isAadharVerified ? (
                <span style={{ color: '#16A34A', fontSize: 12, fontWeight: 700 }}>✅ Verified</span>
              ) : (
                <button 
                  className="btn-primary" 
                  style={{ width: 'auto', padding: '8px 16px', fontSize: 12 }}
                  onClick={() => handleVerify('aadhar')}
                  disabled={loading}
                >
                  Verify Now
                </button>
              )}
            </div>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15 }}>Gender Verification</p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>Verify gender for female-only safety features</p>
              </div>
              {user?.isGenderVerified ? (
                <span style={{ color: '#16A34A', fontSize: 12, fontWeight: 700 }}>✅ Verified</span>
              ) : (
                <button 
                  className="btn-primary" 
                  style={{ width: 'auto', padding: '8px 16px', fontSize: 12 }}
                  onClick={() => handleVerify('gender')}
                  disabled={loading}
                >
                  Verify Now
                </button>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <p style={{ fontSize: 11, color: 'var(--muted)' }}>
              Verified profiles receive special badges and access to restricted ride types.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
