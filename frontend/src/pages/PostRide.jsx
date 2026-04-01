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
    sourceLandmark: '',
    destinationLandmark: '',
    totalSeats: 4,
    farePerSeat: 0,
    baseTotalRideFare: 0,
    femaleOnly: false
  });
  const [sourceCoords, setSourceCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [recentRides, setRecentRides] = useState([]);

  useEffect(() => {
    api.get('/landmarks').then(res =>
      setLandmarks(res.data.data?.landmarks || res.data.landmarks || [])
    );
    api.get('/saved-routes').then(res => setSavedRoutes(res.data.data?.routes || []));
    api.get('/rides/my').then(res => setRecentRides(res.data.data?.rides?.slice(0, 5) || []));
  }, []);

  const handleSaveRoute = async () => {
    if (!sourceCoords || !destCoords) return;
    try {
        const res = await api.post('/saved-routes', {
            sourceLandmark: sourceCoords.address,
            destinationLandmark: destCoords.address,
            sourceCoords: { lat: sourceCoords.lat, lng: sourceCoords.lng },
            destCoords: { lat: destCoords.lat, lng: destCoords.lng }
        });
        setSavedRoutes([res.data.data.route, ...savedRoutes]);
        setSuccess('Route saved to your favorites!');
    } catch (e) {
        setError(e.response?.data?.message || 'Could not save route');
    }
  };


  const resetOptions = () => {
    setActiveOption(null);
    setSourceCoords(null);
    setDestCoords(null);
    setForm({ sourceLandmark: '', destinationLandmark: '', totalSeats: 4, farePerSeat: 0, baseTotalRideFare: 0, femaleOnly: false });
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
  };

  const handleSubmit = async e => {
    if (e) e.preventDefault();
    if (activeOption === 'manual' && form.sourceLandmark === form.destinationLandmark)
      return setError('Source and destination cannot be the same');
    if (activeOption === 'manual' && (!sourceCoords || !destCoords)) {
      return setError('Please select both pickup and destination');
    }

    if (!form.baseTotalRideFare && activeOption === 'manual') {
      return setError('Please set the trip fare');
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...form,
        sourceCoords: sourceCoords ? { lat: sourceCoords.lat, lng: sourceCoords.lng, address: sourceCoords.address } : undefined,
        destCoords:   destCoords   ? { lat: destCoords.lat,   lng: destCoords.lng,   address: destCoords.address   } : undefined,
        sourceLandmark:      sourceCoords?.address || 'Current Location',
        destinationLandmark: destCoords?.address   || 'Nearby / Broadcast',
        farePerSeat: form.baseTotalRideFare || 100, // fallback/initial
        baseTotalRideFare: form.baseTotalRideFare || 100
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
                Directly share your current coordinates and wait for nearby ride requests.
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

          {/* Smart Search: Saved Routes */}
          {savedRoutes.length > 0 && (
            <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>Your Saved Routes</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {savedRoutes.map(route => (
                        <div key={route._id} className="route-chip" onClick={() => {
                            setSourceCoords({ lat: route.sourceCoords.lat, lng: route.sourceCoords.lng, address: route.sourceLandmark });
                            setDestCoords({ lat: route.destCoords.lat, lng: route.destCoords.lng, address: route.destinationLandmark });
                            setForm(f => ({ ...f, sourceLandmark: route.sourceLandmark, destinationLandmark: route.destinationLandmark }));
                            setActiveOption('manual');
                        }}>
                            ⭐ {route.label}
                        </div>
                    ))}
                </div>
            </div>
          )}

          {/* AI Suggestion: Return Trip */}
          {recentRides.length > 0 && (
              <div className="return-trip-banner" style={{ marginTop: 20 }} onClick={() => {
                  const last = recentRides[0];
                  setSourceCoords({ lat: last.destCoords.lat, lng: last.destCoords.lng, address: last.destinationLandmark });
                  setDestCoords({ lat: last.sourceCoords.lat, lng: last.sourceCoords.lng, address: last.sourceLandmark });
                  setForm(f => ({ ...f, sourceLandmark: last.destinationLandmark, destinationLandmark: last.sourceLandmark }));
                  setActiveOption('manual');
              }}>
                  <div style={{ fontSize: 24 }}>🔄</div>
                  <div>
                      <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Plan your return trip?</p>
                      <p style={{ fontSize: 12, opacity: 0.8, margin: 0 }}>Reversed route based on your last ride.</p>
                  </div>
              </div>
          )}
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

                <div style={{ padding: 16, background: 'var(--cream)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)', textAlign: 'center' }}>
                  <p style={{ fontSize: 14, color: 'var(--charcoal)', fontWeight: 500 }}>Broadcast visibility active</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    Your live location is shared. You will be notified of nearby passengers.
                  </p>
                </div>
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
                   <label>System Total Fare Recommendation</label>
                   <FareEstimator
                    sourceCoords={sourceCoords}
                    destCoords={destCoords}
                    onFareSelect={(fare) => setForm(f => ({ ...f, baseTotalRideFare: fare * 4, farePerSeat: fare * 4 }))}
                  />
                </div>
                <div className="field">
                  <label>Total Trip Cost to be shared (₹)</label>
                  <input type="number" name="baseTotalRideFare" value={form.baseTotalRideFare}
                    onChange={handleChange} placeholder="Set the total fare for this trip" required min={1} />
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    This cost will be split equally among all confirmed passengers.
                  </p>
                  <button type="button" onClick={handleSaveRoute} style={{
                      marginTop: 10, background: 'none', border: 'none', color: 'var(--coral)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                  }}>
                      ⭐ Save this route for later
                  </button>
                </div>

              </>
            ) : activeOption === 'manual' ? (
              <div style={{ padding: 16, textAlign: 'center', background: 'var(--cream)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)', marginBottom: 18 }}>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>Select destination to calculate fare</p>
              </div>
            ) : null}

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

            <button type="submit" className="btn-primary" 
              disabled={loading || !sourceCoords || (activeOption === 'manual' && !destCoords) || !!success} 
              style={{ marginTop: 24 }}>
              {loading ? 'Posting...' : 'Post Ride Now'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
