import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

export default function RateRide() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ride, setRide]         = useState(null);
  const [bookings, setBookings] = useState([]);
  const [ratings, setRatings]   = useState({});  // { toUserId: { rating, comment } }
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rideRes = await api.get(`/rides/${id}`);
        const rideData = rideRes.data.data?.ride || rideRes.data.ride;
        setRide(rideData);

        if (rideData.status !== 'completed') {
          setError('Can only rate completed rides');
          setLoading(false);
          return;
        }

        // Get bookings for this ride to find participants
        try {
          const bookRes = await api.get(`/bookings/ride/${id}`);
          setBookings(bookRes.data.data?.bookings || bookRes.data.bookings || []);
        } catch {
          // If not the driver, just show driver to rate
          setBookings([]);
        }
      } catch {
        setError('Ride not found');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const isDriver = ride && String(ride.driverId) === String(user?.id);

  // Who to rate: driver rates passengers, passenger rates driver
  const usersToRate = isDriver
    ? bookings.map(b => ({ id: b.passengerId, name: b.passengerName, role: 'passenger' }))
    : ride ? [{ id: ride.driverId, name: ride.driverName, role: 'driver' }] : [];

  const setRatingFor = (userId, field, value) => {
    setRatings(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] || {}), [field]: value }
    }));
  };

  const handleSubmit = async () => {
    setError('');
    const incomplete = usersToRate.filter(u => !ratings[u.id]?.rating);
    if (incomplete.length > 0) {
      return setError(`Please rate all participants`);
    }

    setSubmitting(true);
    try {
      for (const u of usersToRate) {
        await api.post('/ratings', {
          rideId: id,
          toUserId: u.id,
          rating: ratings[u.id].rating,
          comment: ratings[u.id].comment || ''
        });
      }
      setSuccess('Ratings submitted! Thank you 🎉');
      setTimeout(() => navigate('/my-rides'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit ratings');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="page-wrapper" style={{ maxWidth: 520 }}>
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--muted)', fontSize: 13, display: 'flex',
        alignItems: 'center', gap: 4, padding: 0, marginBottom: 20
      }}>← Back</button>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 26, letterSpacing: '-0.02em' }}>Rate Your Ride</h2>
        {ride && (
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
            {ride.sourceLandmark} → {ride.destinationLandmark}
          </p>
        )}
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {!success && usersToRate.length > 0 && (
        <div>
          {usersToRate.map(u => (
            <div key={u.id} className="card" style={{ marginBottom: 16 }}>
              {/* User info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 42, height: 42, background: 'var(--coral-pale)',
                  borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontWeight: 600, color: 'var(--coral)', fontSize: 17
                }}>
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 500, fontSize: 15 }}>{u.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>
                    {u.role}
                  </p>
                </div>
              </div>

              {/* Star rating */}
              <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500,
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Rating
              </p>
              <div className="star-rating" style={{ marginBottom: 14 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button"
                    className={ratings[u.id]?.rating >= star ? 'filled' : ''}
                    onClick={() => setRatingFor(u.id, 'rating', star)}>
                    {ratings[u.id]?.rating >= star ? '★' : '☆'}
                  </button>
                ))}
                {ratings[u.id]?.rating && (
                  <span style={{ fontSize: 13, color: 'var(--muted)', marginLeft: 8, alignSelf: 'center' }}>
                    {ratings[u.id].rating}/5
                  </span>
                )}
              </div>

              {/* Comment */}
              <div className="field">
                <label>Comment (optional)</label>
                <input type="text"
                  placeholder="How was the experience?"
                  value={ratings[u.id]?.comment || ''}
                  onChange={e => setRatingFor(u.id, 'comment', e.target.value)}
                />
              </div>
            </div>
          ))}

          <button className="btn-primary" onClick={handleSubmit}
            disabled={submitting || !!success} style={{ marginTop: 8 }}>
            {submitting ? 'Submitting...' : 'Submit Ratings'}
          </button>
        </div>
      )}

      {!success && usersToRate.length === 0 && !error && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 36, marginBottom: 8 }}>✅</p>
          <p style={{ fontWeight: 500 }}>No one to rate</p>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            There were no confirmed passengers on this ride
          </p>
        </div>
      )}
    </div>
  );
}
