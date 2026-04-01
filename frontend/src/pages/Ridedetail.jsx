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
  const [myBooking, setMyBooking] = useState(null);
  const [actingOn, setActingOn]   = useState(null); // id of booking being accepted/rejected
  const isDriverRef   = useRef(false);
  const myBookingRef  = useRef(null);

  useEffect(() => {
    api.get(`/rides/${id}`)
      .then(res => {
        const r = res.data.data?.ride || res.data.ride;
        setRide(r);
        const driverId = String(r.driverId);
        const userId   = String(user?._id || user?.id);
        isDriverRef.current = driverId === userId;
        // If driver, fetch requests
        if (driverId === userId) {
          api.get(`/bookings/ride/${id}`).then(res2 => {
            setRequests(res2.data.data?.bookings || res2.data.bookings || []);
          });
        } else if (user) {
          // If passenger, check my booking status
          api.get('/bookings/my').then(res2 => {
            const bookings = res2.data.data?.bookings || res2.data.bookings || [];
            const mine = bookings.find(b => String(b.rideId?._id || b.rideId) === String(id));
            if (mine) {
                setMyBooking(mine);
                myBookingRef.current = mine;
                setBooked(true);
            }
          });
        }
      })
      .catch(() => setError('Ride not found'))
      .finally(() => setLoading(false));
  }, [id, user]);

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
    socket.on('price_updated', data => {
        setRide(r => ({ ...r, farePerSeat: data.newFare }));
        setMessage(data.message);
    });
    // Real-time new booking requests for driver
    socket.on('new_booking_request', async (data) => {
      if (isDriverRef.current) {
        const bRes = await api.get(`/bookings/ride/${id}`);
        setRequests(bRes.data.data?.bookings || bRes.data.bookings || []);
      }
    });
    // Real-time booking status changes for passenger
    socket.on('driver_accepted_match', (data) => {
      if (String(data.bookingId) && myBookingRef.current) {
        setMyBooking(b => b ? { ...b, status: 'accepted_by_driver' } : b);
        setMessage('Driver accepted your request! Review the fare to confirm.');
      }
    });
    socket.on('booking_rejected', () => {
      setMyBooking(b => b ? { ...b, status: 'rejected' } : b);
      setMessage('Your request was declined by the driver.');
    });
    return () => { 
        socket.off('seat_booked'); 
        socket.off('ride_status_updated'); 
        socket.off('price_updated');
        socket.off('new_booking_request');
        socket.off('driver_accepted_match');
        socket.off('booking_rejected');
    };
  }, [id]);

  const handleBook = async () => {
    setError(''); setBooking(true);
    try {
      const res = await api.post('/bookings', { rideId: id });
      setBooked(true);
      setMyBooking(res.data.data.booking);
      setMessage('Join request sent! Waiting for driver acceptance.');
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    } finally {
      setBooking(false);
    }
  };

  const handleConfirmBooking = async () => {
    setError('');
    setBooking(true);
    try {
        await api.patch(`/bookings/${myBooking._id}/confirm`);
        setMessage('Ride confirmed! Final price applied.');
        // Refresh
        const res = await api.get(`/rides/${id}`);
        setRide(res.data.data?.ride || res.data.ride);
        setMyBooking(b => ({ ...b, status: 'confirmed' }));
    } catch (err) {
        setError(err.response?.data?.message || 'Confirmation failed');
    } finally {
        setBooking(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel your request?')) return;
    setError('');
    try {
        await api.patch(`/bookings/${myBooking._id}/cancel`);
        setBooked(false);
        setMyBooking(null);
        setMessage('Ride cancelled.');
        const res = await api.get(`/rides/${id}`);
        setRide(res.data.data?.ride || res.data.ride);
    } catch (err) {
        setError(err.response?.data?.message || 'Cancellation failed');
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

  const isDriver = String(ride.driverId) === String(user?._id || user?.id);
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

            {/* Join stage 1: Request Pending */}
            {booked && myBooking?.status === 'pending' && (
              <div style={{
                background: 'rgba(236,102,82,0.05)', border: '1.5px dashed var(--coral)',
                borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: 12
              }}>
                <p style={{ fontWeight: 700, color: 'var(--coral)', fontSize: 15, marginBottom: 4 }}>Request Pending</p>
                <p style={{ fontSize: 13, color: 'var(--charcoal)' }}>
                  Your request has been sent to the driver. You'll be notified once they accept the match.
                </p>
                <button 
                  onClick={handleCancelBooking}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer', padding: 0, marginTop: 10, textDecoration: 'underline' }}>
                  Cancel Request
                </button>
              </div>
            )}

            {/* Join stage 2: Driver Accepted, Passenger must confirm price */}
            {booked && myBooking?.status === 'accepted_by_driver' && (
              <div style={{
                background: 'var(--floating-bg)', border: '1.5px solid var(--coral)',
                borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: 16,
                boxShadow: 'var(--shadow-md)'
              }}>
                <p style={{ fontWeight: 700, color: 'var(--coral)', fontSize: 16, marginBottom: 8 }}>Driver Ready!</p>
                <p style={{ fontSize: 13, color: 'var(--charcoal)', marginBottom: 16 }}>
                  Driver is ready to pick you up. Based on the current shared pool, your final fare is:
                </p>
                <div style={{ padding: '12px 16px', background: 'var(--cream)', borderRadius: 8, textAlign: 'center', marginBottom: 20 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--coral)' }}>₹{ride.farePerSeat}</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-primary" onClick={handleConfirmBooking} disabled={booking} style={{ flex: 2 }}>
                    {booking ? '...' : 'Confirm & Join Ride'}
                  </button>
                  <button className="btn-outline" onClick={handleCancelBooking} style={{ flex: 1, borderColor: 'var(--border)', color: 'var(--muted)' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Join stage 3: Confirmed */}
            {booked && myBooking?.status === 'confirmed' && (
              <div style={{
                background: 'rgba(74,124,89,0.1)', border: '1.5px solid var(--success)',
                borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: 16
              }}>
                <p style={{ fontWeight: 700, color: 'var(--success)', fontSize: 15, marginBottom: 4 }}>Ride Confirmed!</p>
                <p style={{ fontSize: 13, color: 'var(--charcoal)' }}>
                  Your seat is reserved. Pay <strong>₹{ride.farePerSeat}</strong> to the driver.
                </p>
              </div>
            )}

            {/* Request button — only if not yet booked */}
            {canBook && !booked && (
              <button className="btn-primary" onClick={handleBook} disabled={booking}>
                {booking ? 'Sending request...' : `Request Ride (Est ₹${ride.farePerSeat})`}
              </button>
            )}

            {!isDriver && ride.status === 'open' && ride.availableSeats === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--error)', fontSize: 14 }}>
                All seats are filled
              </p>
            )}

            {/* Passenger Requests (Driver Only) */}
            {isDriver && (
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Join Requests
                  </p>
                  {requests.length > 0 && (
                    <span style={{
                      background: requests.some(r => r.status === 'pending') ? 'var(--coral)' : 'var(--cream-dark)',
                      color: requests.some(r => r.status === 'pending') ? 'white' : 'var(--muted)',
                      borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700
                    }}>
                      {requests.filter(r => r.status === 'pending').length} pending
                    </span>
                  )}
                </div>

                {requests.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '24px 20px',
                    background: 'var(--cream)', borderRadius: 'var(--radius-md)',
                    border: '1.5px dashed var(--border)'
                  }}>
                    <p style={{ fontSize: 22, marginBottom: 8 }}>⏳</p>
                    <p style={{ fontSize: 13, color: 'var(--muted)' }}>No requests yet — waiting for passengers</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {requests.map(req => {
                      const isPending = req.status === 'pending';
                      const statusStyles = {
                        pending:            { bg: '#FFF7ED', border: '#FDBA74', color: '#C2410C', label: 'Pending' },
                        accepted_by_driver: { bg: '#F0FDF4', border: '#86EFAC', color: '#166534', label: 'Accepted ✓' },
                        confirmed:          { bg: '#EFF6FF', border: '#93C5FD', color: '#1D4ED8', label: 'Confirmed ✓' },
                        rejected:           { bg: '#FEF2F2', border: '#FCA5A5', color: '#991B1B', label: 'Rejected' },
                        cancelled:          { bg: '#F9FAFB', border: '#D1D5DB', color: '#6B7280', label: 'Cancelled' },
                      };
                      const st = statusStyles[req.status] || statusStyles.pending;
                      return (
                        <div key={req._id} style={{
                          background: 'var(--card-bg)',
                          border: `1.5px solid ${isPending ? 'var(--coral)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '16px 18px',
                          boxShadow: isPending ? '0 2px 12px rgba(229,90,63,0.12)' : 'none',
                          transition: 'all 0.25s'
                        }}>
                          {/* Request Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: isPending ? 'var(--coral)' : 'var(--cream-dark)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 15, fontWeight: 700,
                                color: isPending ? 'white' : 'var(--muted)',
                                flexShrink: 0
                              }}>
                                {req.passengerName?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--charcoal)' }}>
                                  {req.passengerName}
                                </p>
                                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                                  {req.seatsBooked} seat{req.seatsBooked > 1 ? 's' : ''} · ₹{ride.farePerSeat * req.seatsBooked} est.
                                </p>
                              </div>
                            </div>
                            <span style={{
                              padding: '3px 10px', borderRadius: 20,
                              background: st.bg, border: `1px solid ${st.border}`,
                              color: st.color, fontSize: 10, fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.04em'
                            }}>
                              {st.label}
                            </span>
                          </div>

                          {/* Action buttons for pending */}
                          {isPending && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                disabled={actingOn === req._id}
                                onClick={() => handleRequestAction(req._id, 'accept')}
                                style={{
                                  flex: 2, padding: '11px 0',
                                  background: actingOn === req._id ? 'var(--cream-dark)' : '#16A34A',
                                  color: 'white', border: 'none',
                                  borderRadius: 'var(--radius-sm)',
                                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                  boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
                                  transition: 'all 0.2s'
                                }}
                              >
                                {actingOn === req._id
                                  ? <><span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> Processing</>
                                  : '✓ Accept'
                                }
                              </button>
                              <button
                                disabled={actingOn === req._id}
                                onClick={() => handleRequestAction(req._id, 'reject')}
                                style={{
                                  flex: 1, padding: '11px 0',
                                  background: 'var(--cream-dark)', color: 'var(--muted)',
                                  border: '1.5px solid var(--border)',
                                  borderRadius: 'var(--radius-sm)',
                                  fontWeight: 600, fontSize: 12, cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Driver controls */}
            {isDriver && ride.status !== 'completed' && ride.status !== 'cancelled' && (
              <div style={{
                marginTop: 24, padding: 20, background: 'var(--cream-dark)',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                animation: 'slideUp 0.4s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Driver Actions
                  </p>
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 4,
                    background: inProgress ? 'rgba(76,175,80,0.1)' : 'rgba(0,0,0,0.05)',
                    color: inProgress ? '#166534' : 'var(--muted)', fontWeight: 700
                  }}>
                    {inProgress ? '• LIVE TRIP' : 'PRE-TRIP'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {/* Status: Open/Full -> Start Ride */}
                  {(ride.status === 'open' || ride.status === 'full') && (
                    <button
                      className="btn-primary"
                      onClick={() => updateStatus('in_progress')}
                      style={{ flex: 1, minWidth: 140, background: '#16A34A', boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}
                    >
                      ▶ Start Ride Now
                    </button>
                  )}

                  {/* Status: In Progress -> Complete Ride */}
                  {ride.status === 'in_progress' && (
                    <button
                      className="btn-primary"
                      onClick={() => {
                        if (window.confirm('Mark this ride as completed? All passengers will be notified.')) {
                          updateStatus('completed');
                        }
                      }}
                      style={{ flex: 1, minWidth: 140, background: '#2563EB', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
                    >
                      ✓ Complete Ride
                    </button>
                  )}

                  {/* Navigation — always useful for driver */}
                  {hasMap && (
                    <button
                      className="btn-secondary"
                      onClick={() => navigate(`/navigate/${id}`)}
                      style={{ flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      🧭 Navigate
                    </button>
                  )}

                  {/* Cancel Ride */}
                  <button
                    onClick={() => {
                      if (window.confirm('ARE YOU SURE? This will cancel the ride for all passengers and cannot be undone.')) {
                        updateStatus('cancelled');
                      }
                    }}
                    style={{
                      width: '100%', marginTop: 6, padding: '10px',
                      background: 'none', border: '1.5px solid var(--border)',
                      color: '#EF4444', borderRadius: 'var(--radius-sm)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    Cancel Entire Ride
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