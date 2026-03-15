import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

export default function MyRides() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]   = useState('posted');
  const [postedRides, setPostedRides] = useState([]);
  const [bookedRides, setBookedRides] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([api.get('/rides/my'), api.get('/bookings/my')])
      .then(([p, b]) => {
        setPostedRides(p.data.rides);
        setBookedRides(b.data.bookings);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>
      Loading your rides...
    </div>
  );

  return (
    <div className="page-wrapper" style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, letterSpacing: '-0.02em' }}>My Rides</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
          Manage rides you've posted or joined
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        background: 'var(--cream-dark)', padding: 4,
        borderRadius: 'var(--radius-md)', width: 'fit-content'
      }}>
        {[
          { key: 'posted', label: `Posted (${postedRides.length})` },
          { key: 'booked', label: `Booked (${bookedRides.length})` }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '8px 20px', border: 'none', cursor: 'pointer',
            borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
            background: activeTab === tab.key ? 'var(--white)' : 'transparent',
            color: activeTab === tab.key ? 'var(--charcoal)' : 'var(--muted)',
            boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.2s'
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posted Rides */}
      {activeTab === 'posted' && (
        <div>
          {postedRides.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 20px',
              background: 'var(--white)', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)'
            }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>🚗</p>
              <p style={{ fontWeight: 500, marginBottom: 6 }}>No rides posted yet</p>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
                Share your route and split the cost
              </p>
              <button className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }}
                onClick={() => navigate('/post-ride')}>
                Post Your First Ride
              </button>
            </div>
          ) : (
            postedRides.map(ride => (
              <div key={ride._id} style={{
                background: 'var(--white)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: 15 }}>
                      {ride.sourceLandmark}
                      <span style={{ color: 'var(--coral)', margin: '0 8px' }}>→</span>
                      {ride.destinationLandmark}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>
                      {new Date(ride.departureTime).toLocaleString()}
                    </p>
                  </div>
                  <span className={`badge-status status-${ride.status}`}>
                    {ride.status.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                    {ride.availableSeats}/{ride.totalSeats} seats · ₹{ride.farePerSeat}/seat
                    {ride.femaleOnly && <span className="badge-female" style={{ marginLeft: 8 }}>Female only</span>}
                  </span>
                  <button className="btn-outline" style={{ padding: '6px 14px', fontSize: 12 }}
                    onClick={() => navigate(`/ride/${ride._id}`)}>
                    Manage
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Booked Rides */}
      {activeTab === 'booked' && (
        <div>
          {bookedRides.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 20px',
              background: 'var(--white)', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)'
            }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>🎫</p>
              <p style={{ fontWeight: 500, marginBottom: 6 }}>No rides booked yet</p>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
                Find a ride and book a seat
              </p>
              <button className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }}
                onClick={() => navigate('/search')}>
                Search Rides
              </button>
            </div>
          ) : (
            bookedRides.map(b => b.rideId && (
              <div key={b._id} style={{
                background: 'var(--white)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: 15 }}>
                      {b.rideId.sourceLandmark}
                      <span style={{ color: 'var(--coral)', margin: '0 8px' }}>→</span>
                      {b.rideId.destinationLandmark}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>
                      {new Date(b.rideId.departureTime).toLocaleString()}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20,
                    background: b.status === 'confirmed' ? '#EDF6F0' : '#FEE2E2',
                    color: b.status === 'confirmed' ? '#166534' : '#991B1B'
                  }}>
                    {b.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                    Driver: {b.rideId.driverName} · ₹{b.rideId.farePerSeat}
                  </span>
                  {b.status === 'confirmed' && (
                    <button className="btn-outline" style={{ padding: '6px 14px', fontSize: 12 }}
                      onClick={() => navigate(`/ride/${b.rideId._id}`)}>
                      View Ride
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}