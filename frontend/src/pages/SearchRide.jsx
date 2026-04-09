import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { getSocket } from '../hooks/useWebSocket';
import LocationPicker from '../components/LocationPicker';
import RouteMap from '../components/RouteMap';


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
        sourceCoords: sourceCoords ? { lat: sourceCoords.lat, lng: sourceCoords.lng, address: sourceCoords.address } : undefined,
        destCoords:   destCoords   ? { lat: destCoords.lat,   lng: destCoords.lng,   address: destCoords.address   } : undefined,
        maxParticipants: maxP
      });
      const pool = res.data.data;
      navigate(`/waiting/${pool._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create pool');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)', display: 'flex',
      alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px',
      overflowY: 'auto'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)',
        padding: '28px 32px', width: '100%', maxWidth: 460,
        boxShadow: 'var(--shadow-lg)', marginBottom: 20
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
      const res = await api.get(`/pools/join/code/${code.trim().toUpperCase()}`);
      navigate(`/waiting/${res.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join pool');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)', display: 'flex',
      alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px',
      overflowY: 'auto'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)',
        padding: 28, width: '100%', maxWidth: 380,
        boxShadow: 'var(--shadow-lg)', marginBottom: 20
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
  const [error, setError]                   = useState('');
  const [rides, setRides]                   = useState([]);
  const [pools, setPools]                   = useState([]);
  const [searched, setSearched]             = useState(false);
  const [loading, setLoading]               = useState(false);
  const [pendingSaved, setPendingSaved]     = useState(false);
  const [liveAlert, setLiveAlert]           = useState(null);
  const [showResultsMap, setShowResultsMap] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal]   = useState(false);
  const [isDiscovering, setIsDiscovering]   = useState(false);
  const [fareData, setFareData]             = useState(null);
  const [fareLoading, setFareLoading]       = useState(false);
  const [selectedCabType, setSelectedCabType] = useState('Cab XL');
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [recentRides, setRecentRides] = useState([]);
  const [scheduledPools, setScheduledPools] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);


  useEffect(() => {
    setInitialLoading(true);
    const p1 = api.get('/landmarks').then(res => {
      const lm = res.data.data?.landmarks || res.data.landmarks;
      setLandmarks(lm || []);
    });
    const p2 = api.get('/saved-routes').then(res => setSavedRoutes(res.data.data?.routes || []));
    const p3 = api.get('/rides/my').then(res => setRecentRides(res.data.data?.rides?.slice(0, 5) || []));
    const p4 = api.get('/pools/scheduled').then(res => setScheduledPools(res.data.data?.pools || []));
    
    Promise.all([p1, p2, p3, p4]).finally(() => setInitialLoading(false));
  }, []);


  // Fetch fare estimate whenever both coords are available
  useEffect(() => {
    if (!sourceCoords?.lat || !destCoords?.lat) { setFareData(null); return; }
    setFareLoading(true);
    const body = {};
    if (filters.source && filters.destination) {
      body.sourceLandmark = filters.source;
      body.destinationLandmark = filters.destination;
    } else {
      body.sourceLat = sourceCoords.lat;
      body.sourceLng = sourceCoords.lng;
      body.destLat   = destCoords.lat;
      body.destLng   = destCoords.lng;
    }
    api.post('/fare/estimate', body)
      .then(res => setFareData(res.data.data))
      .catch(() => setFareData(null))
      .finally(() => setFareLoading(false));
  }, [sourceCoords?.lat, sourceCoords?.lng, destCoords?.lat, destCoords?.lng]);

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
    
    if (filters.source === filters.destination) {
      setError('No two locations can be the same');
      return;
    }
    setError('');
    
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

        // Fetch Nearby Pools as well
        if (sourceCoords) {
           const poolRes = await api.get(`/pools/search?lat=${sourceCoords.lat}&lng=${sourceCoords.lng}`);
           setPools(poolRes.data.data?.pools || []);
        }

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

      {/* Scheduled Rides Scroller (Discover Mode) */}
      {!searched && (
        <div style={{ marginBottom: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Upcoming Rides</h3>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Pre-planned by expert drivers</p>
            </div>
            <button style={{ background: 'var(--coral-pale)', color: 'var(--coral)', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>See All</button>
          </div>

          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 15, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
            {initialLoading ? [1,2,3].map(i => (
              <div key={i} className="skeleton" style={{ minWidth: 260, height: 160, borderRadius: 24, flexShrink: 0 }} />
            )) : scheduledPools.length === 0 ? (
              <div style={{ width: '100%', padding: 30, background: 'var(--cream)', borderRadius: 24, textAlign: 'center', border: '1.5px dashed var(--border)' }}>
                 <p style={{ fontSize: 13, color: 'var(--muted)' }}>No pre-planned rides today. Be the first!</p>
              </div>
            ) : scheduledPools.map(p => (
              <div key={p._id} 
                onClick={() => navigate(`/waiting/${p._id}`)}
                style={{ 
                  minWidth: 280, background: 'var(--card-bg)', border: '1px solid var(--border)', 
                  borderRadius: 24, padding: 18, flexShrink: 0, boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer', transition: 'transform 0.2s', position: 'relative', overflow: 'hidden'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px 12px', background: 'var(--coral)', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: '0 0 0 12px' }}>SCHEDULED</div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--coral-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--coral)' }}>
                    {p.creator?.name?.[0] || 'D'}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700 }}>{p.creator?.name || 'Driver'}</p>
                    <p style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>★ 4.8 Verified</p>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                     <span style={{ fontSize: 14, fontWeight: 600 }}>{p.sourceCoords?.address?.split(',')[0]}</span>
                     <span style={{ color: 'var(--coral)' }}>→</span>
                     <span style={{ fontSize: 14, fontWeight: 600 }}>{p.destCoords?.address?.split(',')[0]}</span>
                   </div>
                   <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>🕒 {new Date(p.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(p.departureTime).toLocaleDateString([], { day: 'numeric', month: 'short' })}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, background: 'var(--cream-dark)', padding: '4px 10px', borderRadius: 10 }}>💺 {p.maxParticipants - p.members.length} left</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--coral)' }}>₹{Math.round(p.totalFare / p.members.length)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, letterSpacing: '-0.02em' }}>Find a Ride</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
          Search available rides near you — instant matches
        </p>

        {/* Smart Search: Saved Routes */}
        {savedRoutes.length > 0 && !searched && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>Quick Search</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {savedRoutes.map(route => (
                    <div key={route._id} className="route-chip" onClick={() => {
                        setSourceCoords({ lat: route.sourceCoords.lat, lng: route.sourceCoords.lng, address: route.sourceLandmark });
                        setDestCoords({ lat: route.destCoords.lat, lng: route.destCoords.lng, address: route.destinationLandmark });
                        setFilters(f => ({ ...f, source: route.sourceLandmark, destination: route.destinationLandmark }));
                        // Auto-trigger search
                        handleSearch();
                    }}>
                        ⭐ {route.label}
                    </div>
                ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 2 }}></div>
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

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 12, padding: '12px 16px', marginTop: 16,
              display: 'flex', alignItems: 'center', gap: 10, animation: 'shake 0.4s'
            }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <p style={{ fontSize: 13, color: '#EF4444', fontWeight: 600, margin: 0 }}>{error}</p>
            </div>
          )}

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

              {(() => {
                const cabTypes = [
                  { name: 'Cab XL',      emoji: '🚐', minMult: 1.20, maxMult: 1.45, desc: '6-seater SUV' },
                  { name: 'Auto',        emoji: '🛺', minMult: 0.55, maxMult: 0.70, desc: '3-wheeler · Open' },
                  { name: 'Cab Non AC',  emoji: '🚕', minMult: 0.75, maxMult: 0.90, desc: 'Budget sedan' },
                  { name: 'Cab Premium', emoji: '🚘', minMult: 1.00, maxMult: 1.20, desc: 'AC sedan' },
                ];
                const base = fareData?.suggestedFare || 0;
                return (
                  <div style={{
                    borderRadius: 'var(--radius-md)', overflow: 'hidden',
                    border: '1.5px solid var(--border)'
                  }}>
                    {cabTypes.map((cab, idx) => {
                      const isSelected = selectedCabType === cab.name;
                      const minFare = base > 0 ? Math.round(base * cab.minMult) : null;
                      const maxFare = base > 0 ? Math.round(base * cab.maxMult) : null;
                      return (
                        <div
                          key={cab.name}
                          onClick={() => { setSelectedCabType(cab.name); handleSearch(); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '15px 16px',
                            background: isSelected ? 'rgba(229,90,63,0.07)' : 'var(--card-bg)',
                            borderLeft: isSelected ? '3px solid var(--coral)' : '3px solid transparent',
                            borderBottom: idx < cabTypes.length - 1 ? '1px solid var(--border)' : 'none',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                        >
                          <span style={{ fontSize: 28, lineHeight: 1, minWidth: 32, textAlign: 'center' }}>{cab.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: 'var(--charcoal)' }}>{cab.name}</p>
                            <p style={{ fontSize: 11, color: 'var(--muted)' }}>{cab.desc}</p>
                          </div>
                          <div style={{ textAlign: 'right', minWidth: 90 }}>
                            {fareLoading ? (
                              <div style={{ display: 'inline-block', width: 70, height: 14, borderRadius: 6, background: 'var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                            ) : minFare ? (
                              <p style={{ fontWeight: 700, fontSize: 14, color: isSelected ? 'var(--coral)' : 'var(--charcoal)' }}>
                                ₹{minFare} – ₹{maxFare}
                              </p>
                            ) : (
                              <p style={{ fontSize: 13, color: 'var(--muted)' }}>–</p>
                            )}
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

      {/* Results List */}
      {!loading && (rides.length > 0 || scheduledPools.length > 0) && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              {searched ? 'Search Results' : 'Recommended for you'}
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

          {[...scheduledPools.filter(sp => {
              if(!searched) return false;
              const matchesSource = !filters.source || sp.sourceCoords?.address?.toLowerCase().includes(filters.source.toLowerCase());
              const matchesDest = !filters.destination || sp.destCoords?.address?.toLowerCase().includes(filters.destination.toLowerCase());
              return matchesSource && matchesDest;
          }), ...rides].map((item, idx) => {
             const isPool = !!item.poolCode || !!item.members;
             return (
              <div key={item._id} style={{
                background: isPool ? 'rgba(229,90,63,0.03)' : 'var(--card-bg)', 
                border: isPool ? '1.5px solid var(--coral)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 12,
                transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'pointer',
                position: 'relative'
              }}
              onClick={() => navigate(isPool ? `/waiting/${item._id}` : `/ride/${item._id}`)}>
                {isPool && (
                  <div style={{ position: 'absolute', top: -1, right: -1, padding: '3px 10px', background: 'var(--coral)', color: '#fff', fontSize: 9, fontWeight: 900, borderRadius: '0 8px 0 8px', letterSpacing: 0.5 }}>UPCOMING RIDE</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{isPool ? item.sourceCoords?.address?.split(',')[0] : item.sourceLandmark}</span>
                    <span style={{ color: 'var(--coral)', fontSize: 18 }}>→</span>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{isPool ? item.destCoords?.address?.split(',')[0] : item.destinationLandmark}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {item.femaleOnly && <span className="badge-female">Female only</span>}
                    <span className={`badge-status status-${item.status}`}>{item.status}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>💺 {isPool ? (item.maxParticipants - item.members.length) : item.availableSeats} seat{(isPool ? (item.maxParticipants - item.members.length) : item.availableSeats) !== 1 ? 's' : ''}</span>
                    <span>👤 {isPool ? (item.creator?.name || 'Driver') : item.driverName}</span>
                    {isPool && <span style={{ color: 'var(--coral)', fontWeight: 700 }}>🕒 {new Date(item.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--coral)', marginBottom: 2 }}>₹{isPool ? Math.round(item.totalFare / item.members.length) : item.farePerSeat}</p>
                  </div>
                </div>
              </div>
             );
          })}

        </div>
      )}
    </div>
  );
}