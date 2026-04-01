import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { getSocket } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';

const STATUS_COLOR = {
  pending:           { bg: '#FFF7ED', border: '#FDBA74', text: '#C2410C', label: 'Pending' },
  accepted_by_driver:{ bg: '#F0FDF4', border: '#86EFAC', text: '#166534', label: 'Accepted' },
  confirmed:         { bg: '#EFF6FF', border: '#93C5FD', text: '#1D4ED8', label: 'Confirmed' },
  rejected:          { bg: '#FEF2F2', border: '#FCA5A5', text: '#991B1B', label: 'Rejected' },
  cancelled:         { bg: '#F9FAFB', border: '#D1D5DB', text: '#6B7280', label: 'Cancelled' },
};

function RequestCard({ req, rideInfo, onAction, acting }) {
  const s = STATUS_COLOR[req.status] || STATUS_COLOR.pending;
  const isPending = req.status === 'pending';

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: `1.5px solid ${isPending ? 'var(--coral)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-md)',
      padding: '18px 20px',
      marginBottom: 12,
      boxShadow: isPending ? '0 4px 16px rgba(229,90,63,0.10)' : 'var(--shadow-sm)',
      transition: 'all 0.3s',
      animation: isPending ? 'slideIn 0.35s ease' : 'none',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: isPending ? 'var(--coral)' : 'var(--cream-dark)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: isPending ? 'white' : 'var(--muted)',
            flexShrink: 0
          }}>
            {req.passengerName?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--charcoal)' }}>{req.passengerName}</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {req.seatsBooked} seat{req.seatsBooked > 1 ? 's' : ''} requested
            </p>
          </div>
        </div>
        <span style={{
          padding: '3px 10px', borderRadius: 20,
          background: s.bg, border: `1px solid ${s.border}`,
          color: s.text, fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.04em'
        }}>
          {s.label}
        </span>
      </div>

      {/* Route info */}
      {rideInfo && (
        <div style={{
          background: 'var(--cream)', borderRadius: 8,
          padding: '10px 14px', marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>
            {rideInfo.sourceLandmark}
          </span>
          <span style={{ color: 'var(--coral)', fontSize: 16 }}>→</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>
            {rideInfo.destinationLandmark}
          </span>
          {rideInfo.farePerSeat && (
            <span style={{
              marginLeft: 'auto', fontWeight: 800, fontSize: 16, color: 'var(--coral)'
            }}>
              ₹{rideInfo.farePerSeat * req.seatsBooked}
            </span>
          )}
        </div>
      )}

      {/* Timestamp */}
      <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14 }}>
        Requested {new Date(req.bookedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
      </p>

      {/* Action buttons — only for pending */}
      {isPending && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onAction(req._id, 'accept', rideInfo?._id)}
            disabled={acting === req._id}
            style={{
              flex: 2, padding: '12px 0', borderRadius: 'var(--radius-sm)',
              background: acting === req._id ? 'var(--cream-dark)' : 'var(--success)',
              color: 'white', border: 'none', fontWeight: 700, fontSize: 14,
              cursor: acting === req._id ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(74,124,89,0.25)'
            }}
          >
            {acting === req._id ? (
              <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Processing...</>
            ) : (
              <>✓ Accept Passenger</>
            )}
          </button>
          <button
            onClick={() => onAction(req._id, 'reject', rideInfo?._id)}
            disabled={acting === req._id}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 'var(--radius-sm)',
              background: 'var(--cream-dark)', color: 'var(--muted)',
              border: '1.5px solid var(--border)', fontWeight: 600, fontSize: 13,
              cursor: acting === req._id ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Reject
          </button>
        </div>
      )}

      {/* View ride link */}
      <div style={{ marginTop: isPending ? 10 : 0, textAlign: 'right' }}>
        <a
          href={`/ride/${rideInfo?._id}`}
          style={{ fontSize: 11, color: 'var(--coral)', textDecoration: 'none', fontWeight: 500 }}
        >
          View Ride →
        </a>
      </div>
    </div>
  );
}

export default function DriverRequests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myRides, setMyRides]       = useState([]);
  const [requests, setRequests]     = useState([]); // { req, rideInfo }[]
  const [loading, setLoading]       = useState(true);
  const [acting, setActing]         = useState(null);
  const [message, setMessage]       = useState('');
  const [filter, setFilter]         = useState('pending'); // 'pending' | 'all'
  const [liveToast, setLiveToast]   = useState(null);
  const toastTimer = useRef(null);

  const loadAllRequests = async () => {
    try {
      const ridesRes = await api.get('/rides/my');
      const rides = ridesRes.data.data?.rides || ridesRes.data.rides || [];
      setMyRides(rides);

      const allRequests = [];
      await Promise.all(
        rides
          .filter(r => !['completed', 'cancelled'].includes(r.status))
          .map(async (ride) => {
            try {
              const bRes = await api.get(`/bookings/ride/${ride._id}`);
              const bookings = bRes.data.data?.bookings || bRes.data.bookings || [];
              bookings.forEach(b => allRequests.push({ req: b, rideInfo: ride }));
            } catch { /* ignore individual failures */ }
          })
      );

      // Sort: pending first, then by time desc
      allRequests.sort((a, b) => {
        if (a.req.status === 'pending' && b.req.status !== 'pending') return -1;
        if (b.req.status === 'pending' && a.req.status !== 'pending') return 1;
        return new Date(b.req.bookedAt) - new Date(a.req.bookedAt);
      });

      setRequests(allRequests);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllRequests();
  }, []);

  // Real-time: react to new_booking_request from backend
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewRequest = (data) => {
      // Show toast
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setLiveToast(data);
      toastTimer.current = setTimeout(() => setLiveToast(null), 6000);
      // Reload requests
      loadAllRequests();
    };

    const handleStatusUpdate = () => loadAllRequests();

    socket.on('new_booking_request', handleNewRequest);
    socket.on('ride_status_updated', handleStatusUpdate);

    return () => {
      socket.off('new_booking_request', handleNewRequest);
      socket.off('ride_status_updated', handleStatusUpdate);
    };
  }, []);

  const handleAction = async (bookingId, action, rideId) => {
    setActing(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/${action}`);
      setMessage(action === 'accept'
        ? '✓ Passenger accepted! They now need to confirm the fare.'
        : 'Request rejected.'
      );
      await loadAllRequests();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage(err.response?.data?.message || `Failed to ${action}`);
    } finally {
      setActing(null);
    }
  };

  const pendingCount  = requests.filter(r => r.req.status === 'pending').length;
  const filtered      = filter === 'pending'
    ? requests.filter(r => r.req.status === 'pending')
    : requests;

  return (
    <div className="page-wrapper" style={{ maxWidth: 600 }}>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Live toast notification */}
      {liveToast && (
        <div style={{
          position: 'fixed', top: 72, right: 16, zIndex: 9999,
          background: 'var(--card-bg)', border: '2px solid var(--coral)',
          borderRadius: 'var(--radius-md)', padding: '14px 18px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          maxWidth: 320, animation: 'toastIn 0.3s ease',
          display: 'flex', gap: 12, alignItems: 'flex-start'
        }}>
          <span style={{ fontSize: 22 }}>🔔</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--charcoal)', marginBottom: 4 }}>
              New Ride Request!
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
              {liveToast.message}
            </p>
          </div>
          <button onClick={() => setLiveToast(null)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: 16, padding: 0
          }}>×</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: 20, padding: 0, lineHeight: 1
        }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 24, letterSpacing: '-0.02em' }}>Ride Requests</h2>
            {pendingCount > 0 && (
              <span style={{
                background: 'var(--coral)', color: 'white',
                borderRadius: 20, padding: '2px 10px',
                fontSize: 12, fontWeight: 700, animation: 'pulse 1.5s infinite'
              }}>
                {pendingCount} new
              </span>
            )}
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
            Manage passenger join requests for your rides
          </p>
        </div>
        <button
          onClick={loadAllRequests}
          style={{
            background: 'var(--cream)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
            fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={message.startsWith('✓') ? 'alert-success' : 'alert-error'}
          style={{ marginBottom: 16, animation: 'slideIn 0.3s ease' }}>
          {message}
        </div>
      )}

      {/* Stats bar */}
      {!loading && requests.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20
        }}>
          {[
            { label: 'Pending',  count: requests.filter(r => r.req.status === 'pending').length,           color: '#C2410C' },
            { label: 'Accepted', count: requests.filter(r => r.req.status === 'accepted_by_driver').length, color: '#166534' },
            { label: 'Confirmed',count: requests.filter(r => r.req.status === 'confirmed').length,          color: '#1D4ED8' },
            { label: 'Rejected', count: requests.filter(r => r.req.status === 'rejected').length,           color: '#6B7280' },
          ].map(({ label, count, color }) => (
            <div key={label} style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '12px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: 22, fontWeight: 800, color }}>{count}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      {requests.length > 0 && (
        <div style={{
          display: 'flex', gap: 4, marginBottom: 20,
          background: 'var(--cream-dark)', padding: 3,
          borderRadius: 'var(--radius-sm)', width: 'fit-content'
        }}>
          {[
            { key: 'pending', label: `Pending (${pendingCount})` },
            { key: 'all',     label: `All (${requests.length})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
              padding: '7px 16px', border: 'none', cursor: 'pointer',
              borderRadius: 6, fontSize: 12, fontWeight: 500,
              background: filter === tab.key ? 'var(--white)' : 'transparent',
              color: filter === tab.key ? 'var(--charcoal)' : 'var(--muted)',
              boxShadow: filter === tab.key ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s'
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading requests...</p>
        </div>
      ) : myRides.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚗</div>
          <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>No active rides</p>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
            Post a ride to start receiving passenger requests
          </p>
          <button className="btn-primary" onClick={() => navigate('/post-ride')}
            style={{ maxWidth: 200 }}>
            Post a Ride
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '50px 20px',
          background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)',
          border: '1.5px dashed var(--border)'
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>
            {filter === 'pending' ? '⏳' : '📭'}
          </div>
          <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
            {filter === 'pending' ? 'No pending requests' : 'No requests yet'}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>
            {filter === 'pending'
              ? 'All caught up! Switch to "All" to see history.'
              : 'Passengers will appear here when they request to join your ride.'}
          </p>
        </div>
      ) : (
        <div>
          {filtered.map(({ req, rideInfo }) => (
            <RequestCard
              key={req._id}
              req={req}
              rideInfo={rideInfo}
              onAction={handleAction}
              acting={acting}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
