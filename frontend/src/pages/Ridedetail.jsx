import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../hooks/useWebSocket';
import RouteMap from '../components/RouteMap';
import LiveTracking from '../components/LiveTracking';

const STATUS_STEPS = ['open', 'full', 'in_progress', 'completed'];
const STATUS_LABELS = {
  open:        'Open',
  full:        'Full',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
};

function StatusTimeline({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="alert-error" style={{ textAlign: 'center', marginBottom: 20 }}>
        🚫 This ride has been cancelled
      </div>
    );
  }
  const currentIdx = STATUS_STEPS.indexOf(status);
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{
        fontSize: 11, color: 'var(--muted)', fontWeight: 500,
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12
      }}>Ride Progress</p>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {STATUS_STEPS.map((step, i) => {
          const done    = i <= currentIdx;
          const current = i === currentIdx;
          return (
            <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STATUS_STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 12,
                  background: done ? 'var(--coral)' : 'var(--cream-dark)',
                  color: done ? 'white' : 'var(--muted)',
                  fontWeight: 700,
                  boxShadow: current ? '0 0 0 3px rgba(204,120,92,0.25)' : 'none',
                  transition: 'all 0.3s'
                }}>
                  {done && !current ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: 10, color: done ? 'var(--coral)' : 'var(--muted)',
                  fontWeight: current ? 600 : 400, whiteSpace: 'nowrap'
                }}>
                  {STATUS_LABELS[step]}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 2, marginBottom: 20,
                  background: i < currentIdx ? 'var(--coral)' : 'var(--cream-dark)',
                  transition: 'background 0.3s'
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <div className="spinner" />
    </div>
  );
}

export default function RideDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ride, setRide]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [booking, setBooking]     = useState(false);
  const [message, setMessage]     = useState('');
  const [error, setError]         = useState('');
  const [booked, setBooked]           = useState(false);
  const [routeCoords, setRouteCoords] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'map' | 'track'
  const [requests, setRequests]   = useState([]);
  const [actingOn, setActingOn]   = useState(null); // id of booking being accepted/rejected

  useEffect(() => {
    api.get(`/rides/${id}`)
      .then(res => {
        const r = res.data.data?.ride || res.data.ride;
        setRide(r);
        // If driver, fetch requests
        if (String(r.driverId) === String(user?.id)) {
          api.get(`/bookings/ride/${id}`).then(res2 => {
            setRequests(res2.data.data?.bookings || res2.data.bookings || []);
          });
        }
      })
      .catch(() => setError('Ride not found'))
      .finally(() => setLoading(false));
  }, [id, user?.id]);

  // Fetch route once coords available
  useEffect(() => {
    if (!ride?.sourceCoords?.lat || !ride?.destCoords?.lat) return;
    api.get('/maps/route', {
      params: {
        srcLat: ride.sourceCoords.lat, srcLng: ride.sourceCoords.lng,
        dstLat: ride.destCoords.lat,   dstLng: ride.destCoords.lng
      }
    }).then(res => {
      const geom = res.data.data?.geometry;
      if (geom?.coordinates) {
        setRouteCoords(geom.coordinates.map(([lng, lat]) => [lat, lng]));
      }
    }).catch(() => {});
  }, [ride?.sourceCoords?.lat, ride?.destCoords?.lat]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !id) return;
    socket.emit('join_ride_room', { rideId: id });
    socket.on('seat_booked', data => {
      setRide(prev => prev ? { ...prev, availableSeats: data.availableSeats } : prev);
      setMessage(data.message);
    });
    socket.on('ride_status_updated', data => {
      setRide(prev => prev ? { ...prev, status: data.newStatus } : prev);
      setMessage(data.message);
    });
    return () => { socket.off('seat_booked'); socket.off('ride_status_updated'); };
  }, [id]);

  const handleBook = async () => {
    setError(''); setBooking(true);
    try {
      await api.post('/bookings', { rideId: id });
      setBooked(true);
      setMessage('Join request sent! Waiting for driver acceptance.');
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    } finally {
      setBooking(false);
    }
  };

  const handleRequestAction = async (bookingId, action) => {
    setActingOn(bookingId);
    setError('');
    try {
      await api.patch(`/bookings/${bookingId}/${action}`);
      setMessage(`Request ${action}ed`);
      // Refresh both ride and requests
      const [rRes, bRes] = await Promise.all([
        api.get(`/rides/${id}`),
        api.get(`/bookings/ride/${id}`)
      ]);
      setRide(rRes.data.data?.ride || rRes.data.ride);
      setRequests(bRes.data.data?.bookings || bRes.data.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setActingOn(null);
    }
  };

  const updateStatus = async status => {
    setError('');
    try {
      const res = await api.patch(`/rides/${id}/status`, { status });
      setRide(res.data.data?.ride || res.data.ride);
      setMessage(`Ride marked as ${STATUS_LABELS[status] || status}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading) return <Spinner />;

  if (!ride) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <p>Ride not found.</p>
      <button className="btn-outline" onClick={() => navigate('/search')} style={{ marginTop: 16 }}>
        Back to Search
      </button>
    </div>
  );

  const isDriver = String(ride.driverId) === String(user?.id);
  const canBook  = !isDriver && ride.status === 'open' && ride.availableSeats > 0;
  const seatPct  = ((ride.totalSeats - ride.availableSeats) / ride.totalSeats) * 100;
  const hasMap   = ride.sourceCoords?.lat && ride.destCoords?.lat;
  const inProgress = ride.status === 'in_progress';

  const tabs = [
    { key: 'details', label: 'Details' },
    ...(hasMap ? [{ key: 'map', label: '🗺️ Route' }] : []),
    ...(inProgress ? [{ key: 'track', label: '📍 Live Track' }] : []),
  ];

  return (
    <div className="page-wrapper" style={{ maxWidth: 580 }}>

      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--muted)', fontSize: 13, display: 'flex',
        alignItems: 'center', gap: 4, padding: 0, marginBottom: 20
      }}>← Back</button>

      {/* Header card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Route
            </p>
            <h3 style={{ fontSize: 20, letterSpacing: '-0.01em' }}>
              {ride.sourceLandmark}
              <span style={{ color: 'var(--coral)', margin: '0 10px' }}>→</span>
              {ride.destinationLandmark}
            </h3>
            {ride.distanceMeters && (
              <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                📏 {(ride.distanceMeters / 1000).toFixed(1)} km
                {ride.estimatedDurationMin && ` · ~${ride.estimatedDurationMin} min`}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            <span className={`badge-status status-${ride.status}`}>
              {ride.status.replace('_', ' ')}
            </span>
            {ride.femaleOnly && <span className="badge-female">Female only</span>}
          </div>
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div style={{
            display: 'flex', gap: 4, marginBottom: 16,
            background: 'var(--cream-dark)', padding: 3,
            borderRadius: 'var(--radius-sm)', width: 'fit-content'
          }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                padding: '6px 14px', border: 'none', cursor: 'pointer',
                borderRadius: 6, fontSize: 12, fontWeight: 500,
                background: activeTab === tab.key ? 'var(--white)' : 'transparent',
                color: activeTab === tab.key ? 'var(--charcoal)' : 'var(--muted)',
                boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s'
              }}>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Details Tab ── */}
        {activeTab === 'details' && (
          <>
            <StatusTimeline status={ride.status} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Driver',  value: ride.driverName },
                { label: 'Seats',   value: `${ride.availableSeats} / ${ride.totalSeats} free` },
                { label: 'Status',  value: STATUS_LABELS[ride.status] || ride.status },
                {
                  label: 'Fare / Seat',
                  value: ride.farePerSeat ? `₹${ride.farePerSeat}` : 'Not set'
                },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {label}
                  </p>
                  <p style={{ fontWeight: 600, fontSize: 16, color: 'var(--charcoal)' }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Seat progress */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Seat availability
                </p>
                <p style={{ fontSize: 13, fontWeight: 500 }}>
                  {ride.availableSeats} of {ride.totalSeats} free
                </p>
              </div>
              <div style={{ height: 6, background: 'var(--cream-dark)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${seatPct}%`,
                  background: seatPct === 100 ? 'var(--error)' : 'var(--coral)',
                  borderRadius: 3, transition: 'width 0.4s'
                }} />
              </div>
            </div>

            {/* Alerts */}
            {message && !booked && <div className="alert-success">{message}</div>}
            {error   && <div className="alert-error">{error}</div>}

            {/* Join status for passenger */}
            {booked && (
              <div style={{
                background: 'rgba(236,102,82,0.05)', border: '1.5px dashed var(--coral)',
                borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: 12
              }}>
                <p style={{ fontWeight: 700, color: 'var(--coral)', fontSize: 15, marginBottom: 4 }}>Request Pending</p>
                <p style={{ fontSize: 13, color: 'var(--charcoal)' }}>
                  Your request to join has been sent to the driver. You'll be notified once they accept.
                </p>
              </div>
            )}

            {/* Request button — only if not yet booked */}
            {canBook && !booked && (
              <button className="btn-primary" onClick={handleBook} disabled={booking}>
                {booking ? 'Sending request...' : 'Join Ride'}
              </button>
            )}

            {!isDriver && ride.status === 'open' && ride.availableSeats === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--error)', fontSize: 14 }}>
                All seats are filled
              </p>
            )}

            {/* Passenger Requests (Driver Only) */}
            {isDriver && requests.length > 0 && (
              <div style={{ marginTop: 24, padding: 20, background: 'var(--cream)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 16 }}>
                  Join Requests
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {requests.map(req => (
                    <div key={req._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--white)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14 }}>{req.passengerName}</p>
                        <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {req.seatsBooked} seat(s) · <span style={{ color: 'var(--success)', fontWeight: 600 }}>₹{ride.farePerSeat * req.seatsBooked}</span>
                        </p>
                        <p style={{ fontSize: 10, marginTop: 4, textTransform: 'uppercase', fontWeight: 700, color: req.status === 'confirmed' ? 'var(--success)' : 'var(--coral)' }}>
                          Status: {req.status}
                        </p>
                      </div>
                      {req.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            disabled={actingOn === req._id}
                            onClick={() => handleRequestAction(req._id, 'accept')}
                            style={{ padding: '6px 12px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
                          >
                            {actingOn === req._id ? '...' : 'Accept'}
                          </button>
                          <button 
                            disabled={actingOn === req._id}
                            onClick={() => handleRequestAction(req._id, 'reject')}
                            style={{ padding: '6px 12px', background: 'var(--cream-dark)', color: 'var(--charcoal)', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
                          >
                            Ignore
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Driver controls */}
            {isDriver && ride.status !== 'completed' && ride.status !== 'cancelled' && (
              <div style={{ marginTop: 24 }}>
                <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Ride Controls
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {/* Navigate button — shown when ride is open/full and has coords */}
                  {hasMap && (ride.status === 'open' || ride.status === 'full') && (
                    <button
                      className="btn-primary"
                      style={{ width: 'auto', padding: '9px 20px' }}
                      onClick={() => navigate(`/navigate/${id}`)}
                    >
                      🧭 Start Navigation
                    </button>
                  )}
                  {(ride.status === 'open' || ride.status === 'full') && (
                    <button className="btn-secondary" onClick={() => updateStatus('in_progress')}>
                      ▶ Start Ride
                    </button>
                  )}
                  {ride.status === 'in_progress' && (
                    <>
                      {hasMap && (
                        <button
                          className="btn-primary"
                          style={{ width: 'auto', padding: '9px 20px' }}
                          onClick={() => navigate(`/navigate/${id}`)}
                        >
                          🧭 Navigate
                        </button>
                      )}
                      <button className="btn-secondary" onClick={() => updateStatus('completed')}>
                        ✓ Complete Ride
                      </button>
                    </>
                  )}
                  <button onClick={() => updateStatus('cancelled')} style={{
                    padding: '9px 18px', background: 'var(--coral-pale)', color: 'var(--error)',
                    border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer'
                  }}>
                    Cancel Ride
                  </button>
                </div>
              </div>
            )}

            {/* Track ride button for passengers when in_progress */}
            {!isDriver && inProgress && (
              <div style={{ marginTop: 12 }}>
                <button
                  className="btn-outline"
                  style={{ width: '100%' }}
                  onClick={() => setActiveTab('track')}
                >
                  📍 Track Driver Live
                </button>
              </div>
            )}

            {/* Rating prompt */}
            {ride.status === 'completed' && (
              <div style={{
                marginTop: 20, padding: '16px', background: 'var(--coral-pale)',
                borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--coral-light)',
                textAlign: 'center'
              }}>
                <p style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>
                  ⭐ Ride completed!
                </p>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
                  Please rate your experience
                </p>
                <button className="btn-primary" onClick={() => navigate(`/rate/${id}`)}
                  style={{ maxWidth: 200 }}>
                  Rate Now
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Route Map Tab ── */}
        {activeTab === 'map' && hasMap && (
          <RouteMap
            sourceCoords={{ ...ride.sourceCoords, address: ride.sourceLandmark }}
            destCoords={{ ...ride.destCoords, address: ride.destinationLandmark }}
            height={360}
            showRoute={true}
          />
        )}

        {/* ── Live Tracking Tab ── */}
        {activeTab === 'track' && inProgress && (
          <LiveTracking
            rideId={id}
            sourceCoords={hasMap ? { ...ride.sourceCoords, address: ride.sourceLandmark } : null}
            destCoords={hasMap ? { ...ride.destCoords, address: ride.destinationLandmark } : null}
            sourceName={ride.sourceLandmark}
            destName={ride.destinationLandmark}
            routeCoords={routeCoords}
            isDriver={isDriver}
            height={380}
          />
        )}
      </div>
    </div>
  );
}