import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { getSocket } from '../hooks/useWebSocket';

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
  const [rides, setRides]               = useState([]);
  const [searched, setSearched]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [pendingSaved, setPendingSaved] = useState(false);
  const [liveAlert, setLiveAlert]       = useState(null);
  const [nearestInfo, setNearestInfo]   = useState(null);

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
        const dist = res.data.data?.distanceMeters || res.data.distanceMeters;
        if (lm) {
          setFilters(f => ({ ...f, source: lm.name }));
          setNearestInfo(`📍 ${lm.name} (${dist}m away)`);
        }
      } catch { /* silent */ }
    });
  };

  const handleChange = e => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFilters({ ...filters, [e.target.name]: value });
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
    <div className="page-wrapper" style={{ maxWidth: 620 }}>

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
        <form onSubmit={handleSearch}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
              {nearestInfo && (
                <p style={{ fontSize: 11, color: 'var(--success)', marginTop: 4 }}>{nearestInfo}</p>
              )}
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
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
            {rides.length} ride{rides.length > 1 ? 's' : ''} available
          </p>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{ride.sourceLandmark}</span>
                  <span style={{ color: 'var(--coral)', fontSize: 18 }}>→</span>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{ride.destinationLandmark}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {ride.femaleOnly && <span className="badge-female">Female only</span>}
                  <span className={`badge-status status-${ride.status}`}>{ride.status}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>💺 {ride.availableSeats} seat{ride.availableSeats !== 1 ? 's' : ''}</span>
                  <span>👤 {ride.driverName}</span>
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