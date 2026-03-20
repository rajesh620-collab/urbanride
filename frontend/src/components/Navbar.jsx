import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getSocket } from '../hooks/useWebSocket';

/* ─── Logout Confirmation Modal ─── */
function LogoutModal({ onConfirm, onCancel }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <>
      <div onClick={onCancel} style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        animation: 'fadeInModal 0.2s ease',
      }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', zIndex: 9999,
        background: 'var(--card-bg)', borderRadius: 20, padding: '36px 32px',
        width: 360, maxWidth: '90vw',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        border: '1px solid var(--border)',
        animation: 'scaleInModal 0.25s cubic-bezier(0.16,1,0.3,1)',
        textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)', margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
            <polyline points="16 17 21 12 16 7" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="21" y1="12" x2="9" y2="12" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--charcoal)', margin: '0 0 8px' }}>
          Logout?
        </h3>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 28px' }}>
          Are you sure you want to logout? You'll need to sign in again to access your account.
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '12px 0', borderRadius: 10, fontSize: 14, fontWeight: 600,
            border: '1px solid var(--border)', background: 'var(--card-bg)', cursor: 'pointer',
            color: 'var(--charcoal)', transition: 'background 0.15s',
            fontFamily: "'Montserrat', sans-serif",
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--card-bg)'}
          >
            Cancel
          </button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '12px 0', borderRadius: 10, fontSize: 14, fontWeight: 600,
            border: 'none', background: '#EF4444', color: 'white', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(239,68,68,0.3)', transition: 'transform 0.15s, box-shadow 0.15s',
            fontFamily: "'Montserrat', sans-serif",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(239,68,68,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(239,68,68,0.3)'; }}
          >
            Logout
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInModal { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleInModal {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.92); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1);    }
        }
      `}</style>
    </>
  );
}

/* ─── Profile Dropdown (opens from profile icon) ─── */
function ProfileDropdown({ user, onClose, navigate, onLogout }) {
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
    {
      label: 'Profile', desc: 'Account details', path: '/profile',
      svg: <><circle cx="12" cy="8" r="4" stroke="var(--coral)" strokeWidth="1.5" fill="none"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="var(--coral)" strokeWidth="1.5" strokeLinecap="round" fill="none"/></>
    },
    {
      label: 'My Rides', desc: 'View past trips', path: '/my-rides',
      svg: <><rect x="3" y="7" width="18" height="13" rx="2" stroke="var(--coral)" strokeWidth="1.5" fill="none"/><path d="M7 7V5a5 5 0 0110 0v2" stroke="var(--coral)" strokeWidth="1.5" fill="none"/><circle cx="12" cy="14" r="2" fill="var(--coral)"/></>
    },
    {
      label: 'Settings', desc: 'Theme & preferences', path: '/settings',
      svg: <><circle cx="12" cy="12" r="3" stroke="var(--coral)" strokeWidth="1.5" fill="none"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="var(--coral)" strokeWidth="1.5" strokeLinecap="round"/></>
    },
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
              <div style={{ width: 34, height: 34, background: 'var(--coral-pale)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">{item.svg}</svg>
              </div>
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

          {/* Logout — shows confirmation modal */}
          <button role="menuitem"
            onClick={() => { onLogout(); onClose(); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 16px', border: 'none', cursor: 'pointer',
              background: 'transparent', textAlign: 'left', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: 34, height: 34, background: 'rgba(239,68,68,0.1)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                <polyline points="16 17 21 12 16 7" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="21" y1="12" x2="9" y2="12" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 13, color: '#EF4444' }}>Logout</p>
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
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

  const handleLogoutRequest = useCallback(() => {
    setShowLogoutModal(true);
  }, []);

  const handleLogoutConfirm = useCallback(() => {
    setShowLogoutModal(false);
    logout();
    navigate('/');
  }, [logout, navigate]);

  if (!user) return null;

  const navItems = [
    { label: 'Search',    path: '/search',    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M20 20l-3.35-3.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
    { label: 'Post Ride', path: '/post-ride',  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
    { label: 'My Rides',  path: '/my-rides',   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M7 7V5a5 5 0 0110 0v2" stroke="currentColor" strokeWidth="2" fill="none"/></svg> },
  ];

  const initials = user.name?.[0]?.toUpperCase() || '?';

  return (
    <>
      <nav style={{
        background: 'var(--card-bg)', borderBottom: '1px solid var(--border)',
        padding: '0 24px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        height: 58, position: 'sticky', top: 0, zIndex: 50,
        boxShadow: 'var(--shadow-sm)', transition: 'background 0.3s',
      }}>
        {/* Logo → navigates to home landing page */}
        <button
          onClick={() => navigate('/')}
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
              <span style={{ display: 'flex' }}>{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Right side: theme + notifications + profile icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

          {/* Theme toggle */}
          <button className="theme-toggle" onClick={toggle}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {dark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </button>

          {/* Bell */}
          <div style={{ position: 'relative' }} ref={notifsRef}>
            <button onClick={() => setShowNotifs(s => !s)} style={{
              background: notifications.length > 0 ? 'var(--coral-pale)' : 'var(--cream-dark)',
              border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
              width: 36, height: 36, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', transition: 'background 0.2s',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
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
                    All caught up!
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
                onLogout={handleLogoutRequest}
              />
            )}
          </div>
        </div>
      </nav>

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </>
  );
}