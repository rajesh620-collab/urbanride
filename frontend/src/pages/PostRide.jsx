import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

export default function PostRide() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [landmarks, setLandmarks] = useState([]);
  const [form, setForm] = useState({
    sourceLandmark: '', destinationLandmark: '',
    departureTime: '', totalSeats: 1, femaleOnly: false, farePerSeat: ''
  });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/landmarks').then(res => setLandmarks(res.data.landmarks));
  }, []);

  const handleChange = e => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.sourceLandmark === form.destinationLandmark)
      return setError('Source and destination cannot be the same');
    setError('');
    setLoading(true);
    try {
      await api.post('/rides', form);
      setSuccess('Ride posted successfully! Redirecting...');
      setTimeout(() => navigate('/my-rides'), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post ride');
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: 13, display: 'flex',
          alignItems: 'center', gap: 4, padding: 0, marginBottom: 16
        }}>
          ← Back
        </button>
        <h2 style={{ fontSize: 26, letterSpacing: '-0.02em' }}>Post a Ride</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
          Share your journey and split the fare
        </p>
      </div>

      <div className="card">
        {error   && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>

          {/* Route section */}
          <p style={{
            fontSize: 11, fontWeight: 500, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--coral)', marginBottom: 14
          }}>
            Route
          </p>

          <div className="field">
            <label>From</label>
            <select name="sourceLandmark" value={form.sourceLandmark}
              onChange={handleChange} required>
              <option value="">Select source landmark</option>
              {landmarks.map(l => (
                <option key={l._id} value={l.name}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* Arrow connector */}
          <div style={{ textAlign: 'center', marginBottom: 14, color: 'var(--coral-light)' }}>
            ↓
          </div>

          <div className="field">
            <label>To</label>
            <select name="destinationLandmark" value={form.destinationLandmark}
              onChange={handleChange} required>
              <option value="">Select destination landmark</option>
              {landmarks.map(l => (
                <option key={l._id} value={l.name}>{l.name}</option>
              ))}
            </select>
          </div>

          <hr className="divider" />

          {/* Details section */}
          <p style={{
            fontSize: 11, fontWeight: 500, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--coral)', marginBottom: 14
          }}>
            Ride Details
          </p>

          <div className="field">
            <label>Departure Date &amp; Time</label>
            <input type="datetime-local" name="departureTime"
              value={form.departureTime} onChange={handleChange} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Available Seats</label>
              <select name="totalSeats" value={form.totalSeats} onChange={handleChange}>
                {[1,2,3,4].map(n => <option key={n} value={n}>{n} seat{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Fare Per Seat (₹)</label>
              <input type="number" name="farePerSeat" value={form.farePerSeat}
                onChange={handleChange} placeholder="50" required min={0} />
            </div>
          </div>

          {/* Female-only toggle */}
          {user?.gender === 'female' && (
            <div style={{
              marginTop: 20, padding: '14px 16px',
              background: 'var(--cream)', borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <p style={{ fontWeight: 500, fontSize: 14 }}>Female passengers only</p>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  Only women can book this ride
                </p>
              </div>
              <label style={{ position: 'relative', width: 44, height: 24, cursor: 'pointer' }}>
                <input type="checkbox" name="femaleOnly" checked={form.femaleOnly}
                  onChange={handleChange} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute', inset: 0,
                  background: form.femaleOnly ? 'var(--coral)' : 'var(--border)',
                  borderRadius: 12, transition: 'background 0.2s'
                }} />
                <span style={{
                  position: 'absolute', top: 3, left: form.femaleOnly ? 23 : 3,
                  width: 18, height: 18, background: 'white',
                  borderRadius: '50%', transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              </label>
            </div>
          )}

          <button type="submit" className="btn-primary"
            disabled={loading || !!success} style={{ marginTop: 24 }}>
            {loading ? 'Posting ride...' : 'Post Ride'}
          </button>
        </form>
      </div>
    </div>
  );
}