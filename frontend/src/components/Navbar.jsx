import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getSocket } from '../hooks/useWebSocket';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown]   = useState(false);
  const dropdownRef = useRef(null);

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
    socket.on('ride_cancelled',      add);
    return () => {
      socket.off('ride_match_found');
      socket.off('new_booking');
      socket.off('ride_status_updated');
      socket.off('ride_cancelled');
    };
  }, []);

  useEffect(() => {
    const handleClick = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  const navItems = [
    { label: 'Search',    path: '/search'    },
    { label: 'Post Ride', path: '/post-ride' },
    { label: 'My Rides',  path: '/my-rides'  },
  ];

  return (
    <nav style={{
      background: 'var(--card-bg)', borderBottom: '1px solid var(--border)',
      padding: '0 24px', display: 'flex',
      justifyContent: 'space-between', alignItems: 'center',
      height: 58, position: 'sticky', top: 0, zIndex: 50,
      boxShadow: 'var(--shadow-sm)', transition: 'background 0.3s'
    }}>
      <div onClick={() => navigate('/search')} style={{
        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer'
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
        }}>UrbanRide</span>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {navItems.map(item => (
          <button key={item.path} onClick={() => navigate(item.path)} style={{
            padding: '6px 14px', border: 'none', cursor: 'pointer',
            borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
            background: location.pathname === item.path ? 'var(--coral-pale)' : 'transparent',
            color: location.pathname === item.path ? 'var(--coral)' : 'var(--muted)',
            transition: 'all 0.15s'
          }}>
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Theme toggle */}
        <button className="theme-toggle" onClick={toggle}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {dark ? '☀️' : '🌙'}
        </button>

        {/* Bell */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button onClick={() => setShowDropdown(s => !s)} style={{
            background: notifications.length > 0 ? 'var(--coral-pale)' : 'var(--cream-dark)',
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
              }}>{notifications.length}</span>
            )}
          </button>

          {showDropdown && (
            <div style={{
              position: 'absolute', right: 0, top: 44,
              background: 'var(--card-bg)', borderRadius: 'var(--radius-md)',
              width: 300, boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)', zIndex: 100, overflow: 'hidden'
            }}>
              <div style={{
                padding: '12px 16px', borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>Notifications</span>
                {notifications.length > 0 && (
                  <button onClick={() => setNotifications([])} style={{
                    fontSize: 11, color: 'var(--muted)', background: 'none',
                    border: 'none', cursor: 'pointer', padding: 0
                  }}>Clear all</button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p style={{ padding: 20, color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>
                  All caught up! 🎉
                </p>
              ) : notifications.map(n => (
                <div key={n.id} style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--border)'
                }}>
                  <p style={{ fontSize: 13, color: 'var(--charcoal)' }}>{n.message}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User avatar */}
        <div style={{
          width: 32, height: 32, background: 'var(--coral-pale)',
          borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontWeight: 600, color: 'var(--coral)', fontSize: 13
        }}>
          {user.name?.[0]?.toUpperCase()}
        </div>

        <button onClick={() => { logout(); navigate('/'); }} style={{
          padding: '6px 14px', background: 'var(--cream-dark)',
          border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
          fontSize: 12, fontWeight: 500, cursor: 'pointer', color: 'var(--muted)',
          transition: 'all 0.15s'
        }}>Logout</button>
      </div>
    </nav>
  );
}