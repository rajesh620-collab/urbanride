import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import LocationPicker from '../components/LocationPicker';
import FareEstimator from '../components/FareEstimator';
import RouteMap from '../components/RouteMap';

export default function PostRide() {
  const navigate = useNavigate();
  const [activeOption, setActiveOption] = useState(null); // null, 'quick', 'manual'
  const [landmarks, setLandmarks] = useState([]);
  const [form, setForm] = useState({
    sourceLandmark: '', destinationLandmark: '',
    totalSeats: 1, femaleOnly: false, farePerSeat: ''
  });
  const [sourceCoords, setSourceCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    api.get('/landmarks').then(res =>
      setLandmarks(res.data.data?.landmarks || res.data.landmarks || [])
    );
  }, []);

  const resetOptions = () => {
    setActiveOption(null);
    setSourceCoords(null);
    setDestCoords(null);
    setForm({ sourceLandmark: '', destinationLandmark: '', totalSeats: 1, femaleOnly: false, farePerSeat: '' });
  };

  const handleQuickOption = () => {
    if (!navigator.geolocation) return setError('Geolocation not supported');
    setDetecting(true);
    setActiveOption('quick');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await api.get('/maps/reverse-geocode', { params: { lat, lng } });
          const addr = res.data.data.shortAddress;
          setSourceCoords({ lat, lng, address: addr });
          setForm(f => ({ ...f, sourceLandmark: addr }));
          setDetecting(false);
        } catch {
          setSourceCoords({ lat, lng, address: 'Current Location' });
          setForm(f => ({ ...f, sourceLandmark: 'Current Location' }));
          setDetecting(false);
        }
      },
      () => {
        setError('Location access denied');
        setDetecting(false);
        setActiveOption(null);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleChange = e => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSourceChange = (loc) => {
    setSourceCoords(loc);
    setForm(f => ({ ...f, sourceLandmark: loc.address }));
  };

  const handleDestChange = (loc) => {
    setDestCoords(loc);
    setForm(f => ({ ...f, destinationLandmark: loc.address }));
    // If it's quick mode, we might want to auto-scroll to the bottom
  };

  const handleSubmit = async e => {
    if (e) e.preventDefault();
    if (form.sourceLandmark === form.destinationLandmark)
      return setError('Source and destination cannot be the same');
    if (!form.farePerSeat || form.farePerSeat <= 0)
      return setError('Please set a fare per seat');
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        sourceCoords: sourceCoords ? { lat: sourceCoords.lat, lng: sourceCoords.lng } : undefined,
        destCoords: destCoords ? { lat: destCoords.lat, lng: destCoords.lng } : undefined
      };
      await api.post('/rides', payload);
      setSuccess('Ride posted! Waiting for acceptance...');
      setTimeout(() => navigate('/my-rides'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post ride');
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 28 }}>
        <button onClick={() => activeOption ? resetOptions() : navigate('/')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: 13, display: 'flex',
          alignItems: 'center', gap: 4, padding: 0, marginBottom: 16
        }}>← {activeOption ? 'Change Method' : 'Back'}</button>
        <h2 style={{ fontSize: 26, letterSpacing: '-0.02em' }}>Post a Ride</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
          Choose how you want to share your journey
        </p>
      </div>

      {!activeOption ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            onClick={handleQuickOption}
            className="card"
            style={{
              cursor: 'pointer', padding: '24px', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 20,
              transition: 'transform 0.2s', border: '2px solid transparent'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--radius-md)',
              background: 'var(--coral-pale)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 24
            }}>📡</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 18, marginBottom: 4 }}>Quick Post from My Location</h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.4 }}>
                Instant pickup at your current spot. Just set your destination and go.
              </p>
            </div>
          </div>

          <div
            onClick={() => setActiveOption('manual')}
            className="card"
            style={{
              cursor: 'pointer', padding: '24px', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 20,
              transition: 'transform 0.2s', border: '2px solid transparent'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--radius-md)',
              background: 'var(--cream-dark)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 24
            }}>📍</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 18, marginBottom: 4 }}>Plan a Custom Route</h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.4 }}>
                Select a specific pickup and destination point manually.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          {error   && <div className="alert-error">{error}</div>}
          {success && <div className="alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            {activeOption === 'quick' ? (
              <div style={{ marginBottom: 24 }}>
                <div style={{
                  padding: '12px 16px', background: 'var(--coral-pale)',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--coral)',
                  marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10
                }}>
                   <span style={{ fontSize: 18 }}>📍</span>
                   <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--coral)' }}>Current Pickup</p>
                      <p style={{ fontSize: 14, fontWeight: 500 }}>{detecting ? 'Detecting your location...' : (sourceCoords?.address || 'Detecting...')}</p>
                   </div>
                </div>

                <LocationPicker
                  value={destCoords}
                  onChange={handleDestChange}
                  label="To (Destination)"
                  mode="dropoff"
                />
              </div>
            ) : (
              <>
                <LocationPicker
                  value={sourceCoords}
                  onChange={handleSourceChange}
                  label="Pickup Location"
                  mode="pickup"
                />
                <div style={{ textAlign: 'center', margin: '0 0 10px', color: 'var(--border)', fontSize: 20 }}>↓</div>
                <LocationPicker
                  value={destCoords}
                  onChange={handleDestChange}
                  label="Destination"
                  mode="dropoff"
                />
              </>
            )}

            {sourceCoords?.lat && destCoords?.lat && (
              <div style={{ marginBottom: 20 }}>
                <RouteMap sourceCoords={sourceCoords} destCoords={destCoords} height={180} />
              </div>
            )}

            <hr className="divider" />

            {sourceCoords?.lat && destCoords?.lat ? (
              <>
                <div className="field">
                   <label>Suggested Fare Per Seat</label>
                   <FareEstimator
                    sourceCoords={sourceCoords}
                    destCoords={destCoords}
                    onFareSelect={(fare) => setForm(f => ({ ...f, farePerSeat: fare }))}
                  />
                </div>
                <div className="field">
                  <label>Final Fare Per Seat (₹)</label>
                  <input type="number" name="farePerSeat" value={form.farePerSeat}
                    onChange={handleChange} placeholder="Tap a suggestion above" required min={1} />
                </div>
              </>
            ) : (
              <div style={{ padding: 16, textAlign: 'center', background: 'var(--cream)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)', marginBottom: 18 }}>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>Select destination to calculate fare</p>
              </div>
            )}

            <div className="field">
              <label>Available Seats</label>
              <select name="totalSeats" value={form.totalSeats} onChange={handleChange}>
                {[1,2,3,4].map(n => <option key={n} value={n}>{n} seat{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>

            <div style={{
              padding: '14px 16px', background: 'var(--cream)',
              borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <p style={{ fontWeight: 500, fontSize: 14 }}>Female passengers only</p>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Limit requests to female riders</p>
              </div>
              <label style={{ position: 'relative', width: 44, height: 24, cursor: 'pointer' }}>
                <input type="checkbox" name="femaleOnly" checked={form.femaleOnly} onChange={handleChange} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', inset: 0, background: form.femaleOnly ? 'var(--coral)' : 'var(--border)', borderRadius: 12, transition: 'background 0.2s' }} />
                <span style={{ position: 'absolute', top: 3, left: form.femaleOnly ? 23 : 3, width: 18, height: 18, background: 'white', borderRadius: '50%', transition: 'left 0.2s' }} />
              </label>
            </div>

            <button type="submit" className="btn-primary" disabled={loading || !sourceCoords || !destCoords || !!success} style={{ marginTop: 24 }}>
              {loading ? 'Posting...' : 'Post Ride Now'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
