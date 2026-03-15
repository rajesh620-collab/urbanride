import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../hooks/useWebSocket';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown]   = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const add = data => setNotifications(p => [{
      id: Date.now(), message: data.message,
      time: new Date().toLocaleTimeString()
    }, ...p].slice(0, 10));
    socket.on('ride_match_found',    add);
    socket.on('new_booking',         add);
    socket.on('ride_status_updated', add);
    return () => {
      socket.off('ride_match_found');
      socket.off('new_booking');
      socket.off('ride_status_updated');
    };
  }, []);

  if (!user) return null;

  const navItems = [
    { label: 'Search',    path: '/search'    },
    { label: 'Post Ride', path: '/post-ride' },
    { label: 'My Rides',  path: '/my-rides'  },
  ];

  return (
    <nav style={{
      background: 'var(--white)', borderBottom: '1px solid var(--border)',
      padding: '0 24px', display: 'flex',
      justifyContent: 'space-between', alignItems: 'center',
      height: 58, position: 'sticky', top: 0, zIndex: 50,
      boxShadow: '0 1px 4px rgba(28,25,23,0.06)'
    }}>

      {/* Logo */}
      <div onClick={() => navigate('/search')} style={{
        display: 'flex', alignItems: 'center',
        gap: 10, cursor: 'pointer'
      }}>
        <div style={{
          width: 32, height: 32, background: 'var(--coral)',
          borderRadius: 10, display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 7v10l8 5 8-5V7L12 2z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="2.5" fill="white"/>
          </svg>
        </div>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 500, fontSize: 17, color: 'var(--charcoal)'
        }}>
          UrbanRide
        </span>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 4 }}>
        {navItems.map(item => (
          <button key={item.path} onClick={() => navigate(item.path)} style={{
            padding: '6px 14px', border: 'none', cursor: 'pointer',
            borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
            background: location.pathname === item.path ? 'var(--coral-pale)' : 'transparent',
            color: location.pathname === item.path ? 'var(--coral-dark)' : 'var(--muted)',
            transition: 'all 0.15s'
          }}>
            {item.label}
          </button>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Bell */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setShowDropdown(!showDropdown); setNotifications([]); }}
            style={{
              background: notifications.length > 0 ? 'var(--coral-pale)' : 'var(--cream)',
              border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
              width: 36, height: 36, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', fontSize: 16, transition: 'background 0.2s'
            }}>
            🔔
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: 'var(--coral)', color: 'white',
                borderRadius: '50%', width: 17, height: 17,
                fontSize: 10, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontWeight: 700
              }}>
                {notifications.length}
              </span>
            )}
          </button>

          {showDropdown && (
            <div style={{
              position: 'absolute', right: 0, top: 44,
              background: 'var(--white)', borderRadius: 'var(--radius-md)',
              width: 290, boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)', zIndex: 100, overflow: 'hidden'
            }}>
              <div style={{
                padding: '12px 16px', borderBottom: '1px solid var(--border)',
                fontWeight: 500, fontSize: 13
              }}>
                Notifications
              </div>
              {notifications.length === 0 ? (
                <p style={{ padding: 20, color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>
                  All caught up!
                </p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} style={{
                    padding: '12px 16px', borderBottom: '1px solid var(--cream-dark)'
                  }}>
                    <p style={{ fontSize: 13, color: 'var(--charcoal)' }}>{n.message}</p>
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{n.time}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, background: 'var(--coral-pale)',
            borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, color: 'var(--coral)', fontSize: 13
          }}>
            {user.name?.[0]?.toUpperCase()}
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--charcoal)' }}>
            {user.name.split(' ')[0]}
          </span>
        </div>

        <button onClick={() => { logout(); navigate('/login'); }} style={{
          padding: '6px 14px', background: 'var(--cream-dark)',
          border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
          fontSize: 12, fontWeight: 500, cursor: 'pointer', color: 'var(--muted)',
          transition: 'all 0.15s'
        }}>
          Logout
        </button>
      </div>
    </nav>
  );
}