import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../hooks/useWebSocket';

export default function RideDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ride, setRide]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get(`/rides/${id}`)
      .then(res => setRide(res.data.ride))
      .catch(() => setError('Ride not found'))
      .finally(() => setLoading(false));
  }, [id]);

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
      setMessage('Seat booked successfully!');
      const res = await api.get(`/rides/${id}`);
      setRide(res.data.ride);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const updateStatus = async status => {
    try {
      const res = await api.patch(`/rides/${id}/status`, { status });
      setRide(res.data.ride);
      setMessage(`Ride marked as ${status.replace('_', ' ')}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>
      Loading ride details...
    </div>
  );

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

  return (
    <div className="page-wrapper" style={{ maxWidth: 560 }}>

      <button onClick={() => navigate('/search')} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--muted)', fontSize: 13, display: 'flex',
        alignItems: 'center', gap: 4, padding: 0, marginBottom: 20
      }}>
        ← Back to Search
      </button>

      <div className="card">

        {/* Route header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            <span className={`badge-status status-${ride.status}`}>
              {ride.status.replace('_', ' ')}
            </span>
            {ride.femaleOnly && <span className="badge-female">Female only</span>}
          </div>
        </div>

        <hr className="divider" />

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Departure', value: new Date(ride.departureTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
            { label: 'Time', value: new Date(ride.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
            { label: 'Fare / Seat', value: `₹${ride.farePerSeat}` },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'var(--cream)', borderRadius: 'var(--radius-sm)',
              padding: '12px 14px'
            }}>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500,
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                {label}
              </p>
              <p style={{ fontWeight: 500, fontSize: 14 }}>{value}</p>
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
              background: seatPct === 100 ? '#dc2626' : 'var(--coral)',
              borderRadius: 3, transition: 'width 0.4s'
            }} />
          </div>
        </div>

        {/* Driver */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', background: 'var(--cream)',
          borderRadius: 'var(--radius-sm)', marginBottom: 20
        }}>
          <div style={{
            width: 36, height: 36, background: 'var(--coral-pale)',
            borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, color: 'var(--coral)', fontSize: 15
          }}>
            {ride.driverName?.[0]?.toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>Driver</p>
            <p style={{ fontWeight: 500, fontSize: 14 }}>{ride.driverName}</p>
          </div>
        </div>

        {/* Alerts */}
        {message && <div className="alert-success">{message}</div>}
        {error   && <div className="alert-error">{error}</div>}

        {/* Book button */}
        {canBook && (
          <button className="btn-primary" onClick={handleBook} disabled={booking}>
            {booking ? 'Booking seat...' : `Book Seat — ₹${ride.farePerSeat}`}
          </button>
        )}

        {!isDriver && ride.status === 'open' && ride.availableSeats === 0 && (
          <p style={{ textAlign: 'center', color: '#dc2626', fontSize: 14 }}>
            All seats are filled
          </p>
        )}

        {/* Driver controls */}
        {isDriver && ride.status !== 'completed' && ride.status !== 'cancelled' && (
          <div>
            <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Driver controls
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {(ride.status === 'open' || ride.status === 'full') && (
                <button className="btn-secondary" onClick={() => updateStatus('in_progress')}>
                  Start Ride
                </button>
              )}
              {ride.status === 'in_progress' && (
                <button className="btn-secondary" onClick={() => updateStatus('completed')}>
                  Complete Ride
                </button>
              )}
              <button onClick={() => updateStatus('cancelled')} style={{
                padding: '9px 18px', background: '#FEE2E2', color: '#991B1B',
                border: '1.5px solid #FECACA', borderRadius: 'var(--radius-sm)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer'
              }}>
                Cancel Ride
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}