import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { getSocket } from '../hooks/useWebSocket';

function RideCardSkeleton() {
  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--border)',
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
  const [filters, setFilters]           = useState({ source: '', destination: '', time: '', femaleOnly: false });
  const [rides, setRides]               = useState([]);
  const [searched, setSearched]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [pendingSaved, setPendingSaved] = useState(false);
  const [liveAlert, setLiveAlert]       = useState(null);

  useEffect(() => {
    api.get('/landmarks').then(res => setLandmarks(res.data.landmarks));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on('ride_match_found', data => setLiveAlert(data));
    return () => socket.off('ride_match_found');
  }, []);

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
      if (filters.time)        params.time        = filters.time;
      if (filters.femaleOnly)  params.femaleOnly  = 'true';

      const res = await api.get('/rides', { params });
      const foundRides = res.data.rides || [];
      setRides(foundRides);

      if (foundRides.length === 0 && filters.source && filters.destination) {
        try {
          await api.post('/pending', {
            sourceLandmark:      filters.source,
            destinationLandmark: filters.destination,
            preferredTime:       filters.time || new Date().toISOString(),
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
          Search rides between landmarks near you
        </p>
      </div>

      {/* Live alert */}
      {liveAlert && (
        <div style={{
          background: '#EDF6F0', border: '1px solid #A8D5B5',
          borderRadius: 'var(--radius-md)', padding: '14px 18px',
          marginBottom: 20, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <p style={{ fontWeight: 500, color: '#166534', fontSize: 14 }}>
              New rides available!
            </p>
            <p style={{ fontSize: 13, color: '#4A7C59', marginTop: 2 }}>
              {liveAlert.message}
            </p>
          </div>
          <button className="btn-outline" style={{ borderColor: '#4A7C59', color: '#4A7C59' }}
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
              <select name="source" value={filters.source} onChange={handleChange}>
                <option value="">Any source</option>
                {landmarks && landmarks.map(lm => (
                  <option key={lm._id} value={lm.name}>{lm.name}</option>
                ))}
              </select>
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

          <div className="field" style={{ marginTop: 14 }}>
            <label>Departure time (optional)</label>
            <input type="datetime-local" name="time" value={filters.time} onChange={handleChange} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
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
          background: 'var(--white)', borderRadius: 'var(--radius-lg)',
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
              background: 'var(--white)', border: '1px solid var(--border)',
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
                  <span>🕐 {new Date(ride.departureTime).toLocaleString()}</span>
                  <span>💺 {ride.availableSeats} seat{ride.availableSeats !== 1 ? 's' : ''} left</span>
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