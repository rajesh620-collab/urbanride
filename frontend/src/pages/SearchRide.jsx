import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { getSocket } from '../hooks/useWebSocket';
import LocationPicker from '../components/LocationPicker';
import RouteMap from '../components/RouteMap';
import FareEstimator from '../components/FareEstimator';

// ── Create Pool Modal ──────────────────────────────────────────────────────
function CreatePoolModal({ landmarks, onClose }) {
  const navigate = useNavigate();
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [sourceCoords, setSourceCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [maxP, setMaxP] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!source || !destination) return setError('Please select both locations');
    if (source === destination) return setError('Source and destination cannot be the same');
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/pools/create', {
        sourceLandmark: source,
        destinationLandmark: destination,
        sourceCoords: sourceCoords ? { lat: sourceCoords.lat, lng: sourceCoords.lng } : undefined,
        destCoords:   destCoords   ? { lat: destCoords.lat,   lng: destCoords.lng   } : undefined,
        maxParticipants: maxP
      });
      const pool = res.data.data;
      navigate(`/pool/${pool._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create pool');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20
    }} onClick={onClose}>
      <div style={{
        background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)',
        padding: '28px 32px', width: '100%', maxWidth: 460,
        boxShadow: 'var(--shadow-lg)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, letterSpacing: '-0.01em' }}>Create Ride Pool</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--muted)' }}>×</button>
        </div>

        {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <LocationPicker
          value={sourceCoords}
          onChange={(loc) => { setSourceCoords(loc); setSource(loc.address); }}
          label="From (Pickup)"
          mode="pickup"
          hideGps hideMapToggle
        />

        <LocationPicker
          value={destCoords}
          onChange={(loc) => { setDestCoords(loc); setDestination(loc.address); }}
          label="To (Destination)"
          mode="dropoff"
          hideGps hideMapToggle
        />

        <div className="field">
          <label>Max Participants</label>
          <select value={maxP} onChange={e => setMaxP(Number(e.target.value))}>
            {[2, 3, 4, 6].map(n => <option key={n} value={n}>{n} people</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn-primary" onClick={handleCreate} disabled={loading} style={{ flex: 1 }}>
            {loading ? 'Creating...' : 'Create Pool'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Join Pool Modal ────────────────────────────────────────────────────────
function JoinPoolModal({ onClose }) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!code.trim()) return setError('Please enter a pool code');
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/pools/join', { poolCode: code.trim().toUpperCase() });
      navigate(`/pool/${res.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join pool');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20
    }} onClick={onClose}>
      <div style={{
        background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)',
        padding: 28, width: '100%', maxWidth: 380,
        boxShadow: 'var(--shadow-lg)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18 }}>Join by Code</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--muted)' }}>×</button>
        </div>

        {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <div className="field">
          <label>Pool Code</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. A1B2C3"
            maxLength={8}
            style={{ letterSpacing: 4, textTransform: 'uppercase', fontWeight: 700, fontSize: 18, textAlign: 'center' }}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn-primary" onClick={handleJoin} disabled={loading} style={{ flex: 1 }}>
            {loading ? 'Joining...' : 'Join Pool'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function RideCardSkeleton() {
  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 12
    }}>
      {[['70%', '30%'], ['50%', '20%']].map(([w1, w2], i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i === 0 ? 10 : 0 }}>
          <div className="skeleton" style={{ width: w1, height: 16, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: w2, height: 16, borderRadius: 6 }} />
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function SearchRide() {
  const navigate = useNavigate();
  const [landmarks, setLandmarks]           = useState([]);
  const [filters, setFilters]               = useState({ source: '', destination: '', femaleOnly: false });
  const [sourceCoords, setSourceCoords]     = useState(null);
  const [destCoords, setDestCoords]         = useState(null);
  const [rides, setRides]                   = useState([]);
  const [searched, setSearched]             = useState(false);
  const [loading, setLoading]               = useState(false);
  const [pendingSaved, setPendingSaved]     = useState(false);
  const [liveAlert, setLiveAlert]           = useState(null);
  const [showResultsMap, setShowResultsMap] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal]   = useState(false);
  const [isDiscovering, setIsDiscovering]   = useState(false);
  const [estimatedFare, setEstimatedFare]   = useState(0);
  const [selectedCabType, setSelectedCabType] = useState('Cab XL');

  useEffect(() => {
    api.get('/landmarks').then(res => {
      const lm = res.data.data?.landmarks || res.data.landmarks;
      setLandmarks(lm || []);
    });
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on('ride_match_found', data => setLiveAlert(data));
    return () => socket.off('ride_match_found');
  }, []);

  const detectNearestLandmark = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await api.get('/landmarks/nearest', {
          params: { lat: pos.coords.latitude, lng: pos.coords.longitude }
        });
        const lm = res.data.data?.landmark || res.data.landmark;
        if (lm) {
          setFilters(f => ({ ...f, source: lm.name }));
          setSourceCoords({ lat: lm.lat, lng: lm.lng, address: lm.name });
        }
      } catch { /* silent */ }
    });
  };

  const handleChange = e => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFilters({ ...filters, [e.target.name]: value });
    if (e.target.name === 'source' || e.target.name === 'destination') {
      const lm = landmarks.find(l => l.name === value);
      if (lm) {
        if (e.target.name === 'source') setSourceCoords({ lat: lm.lat, lng: lm.lng, address: lm.name });
        else setDestCoords({ lat: lm.lat, lng: lm.lng, address: lm.name });
      }
    }
  };

  const handleSearch = async e => {
    if (e) e.preventDefault();
    if (!filters.source || !filters.destination) return;
    
    setLoading(true);
    setSearched(true);
    setIsDiscovering(true); // Pulse effect
    setLiveAlert(null);

    // Simulate "Finding Drivers" phase for UX
    setTimeout(async () => {
      try {
        const params = {};
        if (filters.source)      params.source      = filters.source;
        if (filters.destination) params.destination = filters.destination;
        if (filters.femaleOnly)  params.femaleOnly  = 'true';

        const res = await api.get('/rides/search', { params });
        const foundRides = res.data.data?.rides || res.data.rides || [];
        setRides(foundRides);

        if (foundRides.length === 0) {
          // Auto-save interest
          api.post('/pending', {
            sourceLandmark:      filters.source,
            destinationLandmark: filters.destination,
            preferredTime:       new Date().toISOString(),
            femaleOnly:          filters.femaleOnly
          }).catch(() => {});
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setIsDiscovering(false);
      }
    }, 1500); 
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: 640 }}>

      {/* Modals */}
      {showCreateModal && (
        <CreatePoolModal landmarks={landmarks} onClose={() => setShowCreateModal(false)} />
      )}
      {showJoinModal && (
        <JoinPoolModal onClose={() => setShowJoinModal(false)} />
      )}

      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, letterSpacing: '-0.02em' }}>Find a Ride</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
          Search available rides near you — instant matches
        </p>
      </div>

      {/* Live alert */}
      {liveAlert && (
        <div className="alert-success" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 20
        }}>
          <div>
            <p style={{ fontWeight: 500, fontSize: 14 }}>New rides available!</p>
            <p style={{ fontSize: 13, marginTop: 2 }}>{liveAlert.message}</p>
          </div>
          <button className="btn-outline" style={{ borderColor: 'var(--success)', color: 'var(--success)' }}
            onClick={() => { setRides(liveAlert.rides || []); setSearched(true); setLiveAlert(null); }}>
            View
          </button>
        </div>
      )}

      {/* Search card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* FROM */}
            <LocationPicker
              value={sourceCoords}
              onChange={(loc) => {
                setSourceCoords(loc);
                setFilters(f => ({ ...f, source: loc.address }));
              }}
              label="From (Pickup)"
              mode="pickup"
              hideGps={true}
              hideMapToggle={true}
            />

            {/* Connector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '-4px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 18, color: 'var(--coral)' }}>↓</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* TO */}
            <LocationPicker
              value={destCoords}
              onChange={(loc) => {
                setDestCoords(loc);
                setFilters(f => ({ ...f, destination: loc.address }));
              }}
              label="To (Destination)"
              mode="dropoff"
              hideGps={true}
              hideMapToggle={true}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, flexWrap: 'wrap', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" name="femaleOnly" checked={filters.femaleOnly}
                onChange={handleChange} style={{ accentColor: 'var(--coral)', width: 15, height: 15 }} />
              <span style={{ color: 'var(--charcoal)' }}>Female-only rides</span>
            </label>
          </div>

          {sourceCoords && destCoords && (
            <div style={{ marginTop: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Select Service
              </p>
              <FareEstimator 
                sourceLandmark={filters.source}
                destinationLandmark={filters.destination}
                sourceCoords={sourceCoords}
                destCoords={destCoords}
                onFareSelect={setEstimatedFare}
              />

              {/* Cab Type List */}
              {estimatedFare > 0 && (() => {
                const base = estimatedFare;
                const cabTypes = [
                  { name: 'Cab XL', emoji: '🚐', minMult: 1.20, maxMult: 1.45, desc: '6-seater SUV' },
                  { name: 'Auto',   emoji: '🛺', minMult: 0.55, maxMult: 0.70, desc: '3-wheeler' },
                  { name: 'Cab Non AC', emoji: '🚕', minMult: 0.75, maxMult: 0.90, desc: 'Budget sedan' },
                  { name: 'Cab Premium', emoji: '🚘', minMult: 1.00, maxMult: 1.20, desc: 'AC sedan' },
                ];
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1.5px solid var(--border)' }}>
                    {cabTypes.map((cab, idx) => {
                      const isSelected = selectedCabType === cab.name;
                      const minFare = Math.round(base * cab.minMult);
                      const maxFare = Math.round(base * cab.maxMult);
                      return (
                        <div
                          key={cab.name}
                          onClick={() => { setSelectedCabType(cab.name); handleSearch(); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '14px 16px',
                            background: isSelected ? 'rgba(var(--coral-rgb,229,90,63),0.07)' : 'var(--card-bg)',
                            borderLeft: isSelected ? '3px solid var(--coral)' : '3px solid transparent',
                            borderBottom: idx < cabTypes.length - 1 ? '1px solid var(--border)' : 'none',
                            cursor: 'pointer',
                            transition: 'background 0.18s, border-left 0.18s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                          onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'rgba(var(--coral-rgb,229,90,63),0.07)' : 'var(--card-bg)'}
                        >
                          <span style={{ fontSize: 26, lineHeight: 1 }}>{cab.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{cab.name}</p>
                            <p style={{ fontSize: 11, color: 'var(--muted)' }}>{cab.desc}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontWeight: 700, fontSize: 14, color: isSelected ? 'var(--coral)' : 'var(--charcoal)' }}>
                              ₹{minFare} – ₹{maxFare}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </form>

        {/* ── Ride Pool Section ── */}
        <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Group Ride Pool
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowJoinModal(true)}
              className="btn-outline"
              style={{ flex: '1 1 140px', padding: '11px 16px', fontSize: 13 }}
            >
              Join by Code
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn-secondary"
              style={{ flex: '1 1 160px', padding: '11px 16px', fontSize: 13 }}
            >
              Create Ride Pool
            </button>
          </div>
        </div>
      </div>

      {/* Discovery State */}
      {isDiscovering && (
        <div style={{
          padding: '40px 20px', textAlign: 'center', 
          background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', 
          border: '1.5px dashed var(--coral)', marginBottom: 20
        }}>
          <div className="spinner" style={{ marginBottom: 16 }} />
          <p style={{ fontWeight: 600, fontSize: 16 }}>Searching for available drivers...</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Connecting with nearby ride-pools</p>
        </div>
      )}

      {/* Loading skeletons */}
      {!isDiscovering && loading && [1, 2, 3].map(i => <RideCardSkeleton key={i} />)}

      {/* No results */}
      {searched && !loading && rides.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '36px 20px',
          background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <p style={{ fontWeight: 500, fontSize: 16, marginBottom: 6 }}>No rides found</p>
          {pendingSaved ? (
            <p style={{ color: 'var(--coral)', fontSize: 13 }}>
              We'll notify you the moment a matching ride is posted
            </p>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>
              Try adjusting your filters or check back later
            </p>
          )}
        </div>
      )}

      {/* Results — fare shown only after booking confirmation (via RideDetail) */}
      {!loading && rides.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              {rides.length} ride{rides.length > 1 ? 's' : ''} available
            </p>
            {sourceCoords?.lat && destCoords?.lat && (
              <button type="button" onClick={() => setShowResultsMap(s => !s)} style={{
                padding: '5px 12px', background: showResultsMap ? 'var(--coral)' : 'var(--cream-dark)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', fontSize: 12, color: showResultsMap ? 'white' : 'var(--muted)',
                transition: 'all 0.2s'
              }}>
                {showResultsMap ? 'List View' : 'Map View'}
              </button>
            )}
          </div>

          {showResultsMap && sourceCoords?.lat && destCoords?.lat && (
            <div style={{ marginBottom: 16 }}>
              <RouteMap sourceCoords={sourceCoords} destCoords={destCoords} height={220} />
            </div>
          )}

          {rides.map(ride => (
            <div key={ride._id} style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 12,
              transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'pointer'
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
              onClick={() => navigate(`/ride/${ride._id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{ride.sourceLandmark}</span>
                  <span style={{ color: 'var(--coral)', fontSize: 18 }}>→</span>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{ride.destinationLandmark}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {ride.femaleOnly && <span className="badge-female">Female only</span>}
                  <span className={`badge-status status-${ride.status}`}>{ride.status}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>💺 {ride.availableSeats} seat{ride.availableSeats !== 1 ? 's' : ''}</span>
                  <span>👤 {ride.driverName}</span>
                  {ride.distanceMeters && (
                    <span>📏 {(ride.distanceMeters / 1000).toFixed(1)} km</span>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--coral)', marginBottom: 2 }}>₹{ride.farePerSeat}</p>
                  {ride.confirmedCount > 0 ? (
                    <p style={{ fontSize: 9, color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      ⚡ Shared Price ({ride.confirmedCount + 1} users)
                    </p>
                  ) : (
                    <p style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      👤 Solo Price
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}