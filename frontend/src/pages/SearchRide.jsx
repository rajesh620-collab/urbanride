import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { getSocket } from '../hooks/useWebSocket';
import LocationPicker from '../components/LocationPicker';
import RouteMap from '../components/RouteMap';

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

export default function SearchRide() {
  const navigate = useNavigate();
  const [landmarks, setLandmarks]       = useState([]);
  const [filters, setFilters]           = useState({ source: '', destination: '', femaleOnly: false });
  const [sourceCoords, setSourceCoords] = useState(null);
  const [destCoords, setDestCoords]     = useState(null);
  const [rides, setRides]               = useState([]);
  const [searched, setSearched]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [pendingSaved, setPendingSaved] = useState(false);
  const [liveAlert, setLiveAlert]       = useState(null);
  const [searchMode, setSearchMode]     = useState('quick'); // 'quick' or 'map'
  const [showResultsMap, setShowResultsMap] = useState(false);

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

  // Auto-detect nearest landmark via GPS
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

    // Set coordinates from landmark selection
    if (e.target.name === 'source' || e.target.name === 'destination') {
      const lm = landmarks.find(l => l.name === value);
      if (lm) {
        if (e.target.name === 'source') {
          setSourceCoords({ lat: lm.lat, lng: lm.lng, address: lm.name });
        } else {
          setDestCoords({ lat: lm.lat, lng: lm.lng, address: lm.name });
        }
      }
    }
  };

  const handleSearch = async e => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    setPendingSaved(false);
    setLiveAlert(null);
    try {
      const params = {};
      if (filters.source)      params.source      = filters.source;
      if (filters.destination) params.destination = filters.destination;
      if (filters.femaleOnly)  params.femaleOnly  = 'true';

      const res = await api.get('/rides/search', { params });
      const foundRides = res.data.data?.rides || res.data.rides || [];
      setRides(foundRides);

      if (foundRides.length === 0 && filters.source && filters.destination) {
        try {
          await api.post('/pending', {
            sourceLandmark:      filters.source,
            destinationLandmark: filters.destination,
            preferredTime:       new Date().toISOString(),
            femaleOnly:          filters.femaleOnly
          });
          setPendingSaved(true);
        } catch { /* silent */ }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: 640 }}>

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

      {/* Search form */}
      <div className="card" style={{ marginBottom: 24 }}>
        {/* Mode toggle */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 16,
          background: 'var(--cream-dark)', padding: 3,
          borderRadius: 'var(--radius-sm)', width: 'fit-content'
        }}>
          {[
            { key: 'quick', label: '⚡ Quick' },
            { key: 'map', label: '🗺️ Map' }
          ].map(tab => (
            <button key={tab.key} type="button" onClick={() => setSearchMode(tab.key)} style={{
              padding: '6px 14px', border: 'none', cursor: 'pointer',
              borderRadius: 6, fontSize: 12, fontWeight: 500,
              background: searchMode === tab.key ? 'var(--white)' : 'transparent',
              color: searchMode === tab.key ? 'var(--charcoal)' : 'var(--muted)',
              boxShadow: searchMode === tab.key ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s'
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch}>
          {searchMode === 'map' ? (
            <>
              <LocationPicker
                value={sourceCoords}
                onChange={(loc) => {
                  setSourceCoords(loc);
                  if (loc.address) {
                    const nearest = landmarks.find(l => loc.address.toLowerCase().includes(l.name.toLowerCase()));
                    setFilters(f => ({ ...f, source: nearest?.name || loc.address }));
                  }
                }}
                label="From"
                mode="pickup"
              />
              <LocationPicker
                value={destCoords}
                onChange={(loc) => {
                  setDestCoords(loc);
                  if (loc.address) {
                    const nearest = landmarks.find(l => loc.address.toLowerCase().includes(l.name.toLowerCase()));
                    setFilters(f => ({ ...f, destination: nearest?.name || loc.address }));
                  }
                }}
                label="To"
                mode="dropoff"
              />
            </>
          ) : (
            <div className="grid-2">
              <div className="field" style={{ marginBottom: 0 }}>
                <label>From</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select name="source" value={filters.source} onChange={handleChange} style={{ flex: 1 }}>
                    <option value="">Any source</option>
                    {landmarks && landmarks.map(lm => (
                      <option key={lm._id} value={lm.name}>{lm.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={detectNearestLandmark} style={{
                    padding: '6px 10px', background: 'var(--coral-pale)',
                    border: '1.5px solid var(--coral)', borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer', fontSize: 14, color: 'var(--coral)'
                  }} title="Detect my location">📍</button>
                </div>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>To</label>
                <select name="destination" value={filters.destination} onChange={handleChange}>
                  <option value="">Any destination</option>
                  {landmarks && landmarks.map(lm => (
                    <option key={lm._id} value={lm.name}>{lm.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" name="femaleOnly" checked={filters.femaleOnly}
                onChange={handleChange} style={{ accentColor: 'var(--coral)', width: 15, height: 15 }} />
              <span style={{ color: 'var(--charcoal)' }}>Female-only rides</span>
            </label>
            <button type="submit" className="btn-primary"
              disabled={loading} style={{ width: 'auto', padding: '10px 28px' }}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Ride Pooling Options</p>
            <div className="grid-2" style={{ gap: 10 }}>
              <button 
                type="button" 
                onClick={async () => {
                  const code = prompt('Enter 6-digit Pool Code:');
                  if (!code) return;
                  try {
                    const res = await api.post('/api/pools/join', { poolCode: code.toUpperCase() });
                    navigate(`/pool/${res.data.data?._id || res.data._id}`);
                  } catch (err) {
                    alert(err.response?.data?.message || 'Failed to join pool');
                  }
                }}
                className="btn-outline" 
                style={{ fontSize: 13, padding: '10px' }}
              >
                Join by Code
              </button>
              <button 
                type="button"
                onClick={async () => {
                  if (!filters.source || !filters.destination) return alert('Select source and destination first');
                  try {
                    setLoading(true);
                    const res = await api.post('/api/pools/auto-match', {
                      sourceLandmark: filters.source,
                      destinationLandmark: filters.destination,
                      sourceCoords,
                      destCoords
                    });
                    navigate(`/pool/${res.data.data?._id || res.data._id}`);
                  } catch (err) {
                    alert('Auto-match failed');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="btn-outline" 
                style={{ fontSize: 13, borderColor: 'var(--coral)', color: 'var(--coral)', padding: '10px' }}
              >
                Auto Match Pool
              </button>
            </div>
            <button 
                type="button"
                onClick={async () => {
                  if (!filters.source || !filters.destination) return alert('Select source and destination first');
                  try {
                    setLoading(true);
                    const res = await api.post('/api/pools/create', {
                      sourceLandmark: filters.source,
                      destinationLandmark: filters.destination,
                      sourceCoords,
                      destCoords
                    });
                    navigate(`/pool/${res.data.data?._id || res.data._id}`);
                  } catch (err) {
                    alert('Create pool failed');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="btn-primary" 
                style={{ marginTop: 10, width: '100%', padding: '12px', background: 'var(--charcoal)', fontSize: 14 }}
              >
                Create New Ride Pool
              </button>
          </div>
        </form>
      </div>

      {/* Loading skeletons */}
      {loading && [1, 2, 3].map(i => <RideCardSkeleton key={i} />)}

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

      {/* Results */}
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
                {showResultsMap ? '📋 List' : '🗺️ Map'}
              </button>
            )}
          </div>

          {/* Route map for results */}
          {showResultsMap && sourceCoords?.lat && destCoords?.lat && (
            <div style={{ marginBottom: 16 }}>
              <RouteMap
                sourceCoords={sourceCoords}
                destCoords={destCoords}
                height={220}
              />
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>💺 {ride.availableSeats} seat{ride.availableSeats !== 1 ? 's' : ''}</span>
                  <span>👤 {ride.driverName}</span>
                  {ride.distanceMeters && (
                    <span>📏 {(ride.distanceMeters / 1000).toFixed(1)} km</span>
                  )}
                </div>
                <span style={{ fontWeight: 700, color: 'var(--coral)', fontSize: 16, whiteSpace: 'nowrap', marginLeft: 12 }}>
                  ₹{ride.farePerSeat}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}