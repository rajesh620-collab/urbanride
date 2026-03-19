import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getSocket } from '../hooks/useWebSocket';

/* ─── Profile Dropdown (opens from profile icon) ─── */
function ProfileDropdown({ user, onClose, navigate, logout }) {
  const ref = useRef(null);
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const items = [
    { icon: '👤', label: 'Profile', desc: 'Account details', path: '/profile' },
    { icon: '🚗', label: 'My Rides', desc: 'View past trips', path: '/my-rides' },
    { icon: '⚙️', label: 'Settings', desc: 'Theme & preferences', path: '/settings' },
  ];

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 149,
        background: 'rgba(0,0,0,0.08)', backdropFilter: 'blur(1px)',
      }} />
      <div ref={ref} role="menu" style={{
        position: 'absolute', right: 0, top: 44,
        background: 'var(--card-bg)', borderRadius: 16, width: 280,
        boxShadow: '0 12px 40px rgba(28,25,23,0.15), 0 2px 8px rgba(28,25,23,0.08)',
        border: '1px solid var(--border)', zIndex: 200, overflow: 'hidden',
        animation: 'profileDropIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        transformOrigin: 'top right',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 18px 14px',
          background: 'linear-gradient(135deg, var(--coral-pale) 0%, transparent 100%)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, background: 'var(--coral-pale)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--coral)', flexShrink: 0,
          }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--coral)' }}>{initials}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'User'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || ''}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4CAF50', boxShadow: '0 0 0 2px rgba(76,175,80,0.2)', display: 'inline-block' }} />
            <span style={{ fontSize: 10, color: '#4CAF50', fontWeight: 600 }}>Active</span>
          </div>
        </div>

        {/* Menu Items */}
        <div style={{ padding: '8px 0' }}>
          {items.map(item => (
            <button key={item.label} role="menuitem"
              onClick={() => { navigate(item.path); onClose(); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px', border: 'none', cursor: 'pointer',
                background: 'transparent', textAlign: 'left', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--charcoal)' }}>{item.label}</p>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{item.desc}</p>
              </div>
              <svg style={{ marginLeft: 'auto', color: 'var(--muted)' }} width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          ))}

          <div style={{ borderTop: '1px solid var(--border)', margin: '6px 16px' }} />

          {/* Logout → redirects to homepage "/" */}
          <button role="menuitem"
            onClick={() => { logout(); navigate('/'); onClose(); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 16px', border: 'none', cursor: 'pointer',
              background: 'transparent', textAlign: 'left', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: 18 }}>🚪</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--error)' }}>Logout</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>Sign out of account</p>
            </div>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes profileDropIn {
          from { opacity: 0; transform: scale(0.95) translateY(-6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </>
  );
}

/* ─── Main Navbar ─── */
export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifsRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const add = data => setNotifications(p => [{
      id: Date.now(), message: data.message,
      time: new Date().toLocaleTimeString()
    }, ...p].slice(0, 10));
    socket.on('ride_match_found', add);
    socket.on('new_booking', add);
    socket.on('ride_status_updated', add);
    socket.on('ride_cancelled', add);
    return () => {
      socket.off('ride_match_found');
      socket.off('new_booking');
      socket.off('ride_status_updated');
      socket.off('ride_cancelled');
    };
  }, []);

  useEffect(() => {
    const handleClick = e => {
      if (notifsRef.current && !notifsRef.current.contains(e.target))
        setShowNotifs(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const closeProfile = useCallback(() => setShowProfile(false), []);

  if (!user) return null;

  const navItems = [
    { label: 'Search',    path: '/search',    icon: '🔍' },
    { label: 'Post Ride', path: '/post-ride',  icon: '➕' },
    { label: 'My Rides',  path: '/my-rides',   icon: '🚗' },
  ];

  const initials = user.name?.[0]?.toUpperCase() || '?';

  return (
    <nav style={{
      background: 'var(--card-bg)', borderBottom: '1px solid var(--border)',
      padding: '0 24px', display: 'flex',
      justifyContent: 'space-between', alignItems: 'center',
      height: 58, position: 'sticky', top: 0, zIndex: 50,
      boxShadow: 'var(--shadow-sm)', transition: 'background 0.3s',
    }}>
      {/* Logo → navigates to dashboard/search */}
      <button
        onClick={() => navigate('/search')}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          cursor: 'pointer', background: 'none', border: 'none',
          padding: '4px 8px 4px 2px', borderRadius: 10,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--cream-dark)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <div style={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg, var(--coral), var(--coral-light))',
          borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(204,120,92,0.25)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 7v10l8 5 8-5V7L12 2z" stroke="white" strokeWidth="2.2" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="2.5" fill="white" />
          </svg>
        </div>
        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--charcoal)', letterSpacing: '-0.3px' }}>
          Urban<span style={{ color: 'var(--coral)' }}>Ride</span>
        </span>
      </button>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 4 }}>
        {navItems.map(item => (
          <button key={item.path} onClick={() => navigate(item.path)} style={{
            padding: '6px 14px', border: 'none', cursor: 'pointer',
            borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
            background: location.pathname === item.path ? 'var(--coral-pale)' : 'transparent',
            color: location.pathname === item.path ? 'var(--coral)' : 'var(--muted)',
            transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Right side: Book Ride + theme + notifications + profile icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Book Ride button */}
        <button onClick={() => navigate('/search')} style={{
          padding: '7px 16px', background: 'var(--coral)', border: 'none',
          borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          color: 'white', boxShadow: '0 2px 8px rgba(204,120,92,0.3)',
          transition: 'transform 0.15s, box-shadow 0.15s',
          fontFamily: "'Montserrat', sans-serif",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(204,120,92,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(204,120,92,0.3)'; }}
        >
          Book Ride
        </button>

        {/* Theme toggle */}
        <button className="theme-toggle" onClick={toggle}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {dark ? '☀️' : '🌙'}
        </button>

        {/* Bell */}
        <div style={{ position: 'relative' }} ref={notifsRef}>
          <button onClick={() => setShowNotifs(s => !s)} style={{
            background: notifications.length > 0 ? 'var(--coral-pale)' : 'var(--cream-dark)',
            border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
            width: 36, height: 36, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', fontSize: 16, transition: 'background 0.2s',
          }}>
            🔔
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: 'var(--coral)', color: 'white',
                borderRadius: '50%', width: 17, height: 17,
                fontSize: 10, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontWeight: 700,
              }}>{notifications.length}</span>
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute', right: 0, top: 44,
              background: 'var(--card-bg)', borderRadius: 'var(--radius-md)',
              width: 300, boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)', zIndex: 100, overflow: 'hidden',
            }}>
              <div style={{
                padding: '12px 16px', borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>Notifications</span>
                {notifications.length > 0 && (
                  <button onClick={() => setNotifications([])} style={{
                    fontSize: 11, color: 'var(--muted)', background: 'none',
                    border: 'none', cursor: 'pointer', padding: 0,
                  }}>Clear all</button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p style={{ padding: 20, color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>
                  All caught up! 🎉
                </p>
              ) : notifications.map(n => (
                <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 13, color: 'var(--charcoal)' }}>{n.message}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile icon → opens dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProfile(p => !p)}
            style={{
              width: 36, height: 36, background: showProfile ? 'var(--coral)' : 'var(--coral-pale)',
              borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, color: showProfile ? 'white' : 'var(--coral)', fontSize: 14,
              border: showProfile ? '2px solid var(--coral)' : '2px solid transparent',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {initials}
          </button>

          {showProfile && (
            <ProfileDropdown
              user={user}
              onClose={closeProfile}
              navigate={navigate}
              logout={logout}
            />
          )}
        </div>
      </div>
    </nav>
  );
}