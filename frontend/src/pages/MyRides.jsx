import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

function RideCardSkeleton() {
  return (
    <div className="ride-card-skeleton">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="skeleton" style={{ width: '60%', height: 16, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: '18%', height: 16, borderRadius: 20 }} />
      </div>
      <div className="skeleton" style={{ width: '40%', height: 12, borderRadius: 6, marginBottom: 14 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ width: '50%', height: 12, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: '20%', height: 28, borderRadius: 8 }} />
      </div>
    </div>
  );
}

export default function MyRides() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]     = useState('posted');
  const [postedRides, setPostedRides] = useState([]);
  const [bookedRides, setBookedRides] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([api.get('/rides/my'), api.get('/bookings/my')])
      .then(([p, b]) => {
        setPostedRides(p.data.data?.rides || p.data.rides || []);
        setBookedRides(b.data.data?.bookings || b.data.bookings || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-wrapper" style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <div className="skeleton" style={{ width: 120, height: 28, borderRadius: 8, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 220, height: 14, borderRadius: 6 }} />
      </div>
      {[1, 2, 3].map(i => <RideCardSkeleton key={i} />)}
    </div>
  );

  /* badge colour lookup for booking statuses */
  const bookingBadge = {
    confirmed: { bg: '#EDF6F0', color: '#166534' },
    accepted_by_driver: { bg: '#EFF6FF', color: '#1E40AF' },
    pending:   { bg: '#FEF3C7', color: '#92400E' },
    rejected:  { bg: '#FEE2E2', color: '#991B1B' },
    cancelled: { bg: '#F3F4F6', color: '#4B5563' },
  };

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
              background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)',
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
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 12,
                transition: 'box-shadow 0.2s', cursor: 'pointer'
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                onClick={() => navigate(`/ride/${ride._id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 15 }}>
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
                    {ride.availableSeats}/{ride.totalSeats} seats available
                    {ride.femaleOnly && <span className="badge-female" style={{ marginLeft: 8 }}>Female only</span>}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--coral)' }}>
                    ₹{ride.farePerSeat}
                  </span>
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
              background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)',
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
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 15 }}>
                      {b.rideId.sourceLandmark}
                      <span style={{ color: 'var(--coral)', margin: '0 8px' }}>→</span>
                      {b.rideId.destinationLandmark}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>
                      Driver: {b.rideId.driverName}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20,
                    background: (bookingBadge[b.status] || bookingBadge.cancelled).bg,
                    color:      (bookingBadge[b.status] || bookingBadge.cancelled).color
                  }}>
                    {b.status.replace('_', ' ')}
                  </span>
                </div>

                {/* OTP display when accepted by driver */}
                {b.status === 'accepted_by_driver' && b.otp && (
                  <div style={{
                    margin: '12px 0', padding: 14, background: 'var(--coral-pale)',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--coral)',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--coral)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      Your Pickup OTP
                    </p>
                    <div className="otp-display">
                      {b.otp.split('').map((d, i) => (
                        <div key={i} className="otp-digit">{d}</div>
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                      Show this to your driver at pickup
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--coral)' }}>
                    ₹{b.rideId.farePerSeat}
                  </span>
                  {(b.status === 'confirmed' || b.status === 'accepted_by_driver') && (
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