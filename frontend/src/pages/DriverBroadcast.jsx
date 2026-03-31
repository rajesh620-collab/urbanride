import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../hooks/useWebSocket';

export default function DriverBroadcast() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [broadcasting, setBroadcasting] = useState(false);
  const [status, setStatus]             = useState('');
  const [error, setError]               = useState('');
  const [coords, setCoords]             = useState(null);
  const watchRef = useRef(null);

  const startBroadcast = () => {
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setBroadcasting(true);
    setStatus('Acquiring location...');

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        setStatus(`Broadcasting location`);
        const socket = getSocket();
        if (socket) {
          socket.emit('driver_broadcast_location', {
            lat,
            lng,
            driverName: user?.name || 'Driver'
          });
        }
      },
      (err) => {
        setError('Location access denied. Please allow location permissions.');
        stopBroadcast();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  };

  const stopBroadcast = () => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    const socket = getSocket();
    if (socket) socket.emit('stop_broadcast');
    setBroadcasting(false);
    setStatus('');
    setCoords(null);
  };

  useEffect(() => {
    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, []);

  return (
    <div className="page-wrapper" style={{ maxWidth: 480 }}>
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--muted)', fontSize: 13, display: 'flex',
        alignItems: 'center', gap: 4, padding: 0, marginBottom: 20
      }}>← Back</button>

      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, letterSpacing: '-0.02em' }}>Share My Location</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
          Broadcast your live location to nearby users — no ride needed
        </p>
      </div>

      {/* Status card */}
      <div className="card" style={{ textAlign: 'center', padding: '40px 24px', marginBottom: 24 }}>
        {/* Animated pulse dot */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: broadcasting ? 'rgba(72,187,120,0.15)' : 'var(--cream-dark)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: broadcasting ? '0 0 0 12px rgba(72,187,120,0.1)' : 'none',
            transition: 'all 0.4s'
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: broadcasting ? 'var(--success)' : 'var(--muted)',
              transition: 'background 0.3s',
              animation: broadcasting ? 'pulse 1.5s infinite' : 'none'
            }} />
          </div>
        </div>

        {broadcasting && coords ? (
          <>
            <p style={{ fontWeight: 700, fontSize: 18, color: 'var(--success)', marginBottom: 8 }}>
              You're Live!
            </p>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 4 }}>
              Broadcasting as <strong>{user?.name}</strong>
            </p>
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
              📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          </>
        ) : (
          <>
            <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
              {status || 'Not broadcasting'}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>
              Tap the button below to start sharing your live location with nearby users.
            </p>
          </>
        )}

        {error && (
          <div className="alert-error" style={{ marginTop: 16, textAlign: 'left' }}>{error}</div>
        )}
      </div>

      {/* Action button */}
      {!broadcasting ? (
        <button
          onClick={startBroadcast}
          className="btn-primary"
          style={{ padding: '16px', fontSize: 15, letterSpacing: '-0.01em' }}
        >
          📡 Start Broadcasting Location
        </button>
      ) : (
        <button
          onClick={stopBroadcast}
          style={{
            width: '100%', padding: '16px', fontSize: 15, fontWeight: 600,
            background: 'var(--coral-pale)', color: 'var(--error)',
            border: '1.5px solid var(--coral)', borderRadius: 'var(--radius-md)', cursor: 'pointer'
          }}
        >
          Stop Broadcasting
        </button>
      )}

      <div style={{
        marginTop: 20, borderRadius: 'var(--radius-md)', background: 'var(--cream-dark)',
        padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start'
      }}>
        <span style={{ fontSize: 18 }}>ℹ️</span>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
          Your location is shared in real-time with passengers nearby. Stop broadcasting anytime to keep your location private.
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
