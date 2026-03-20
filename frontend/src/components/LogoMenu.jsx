import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/* ─── Sub-panel: Profile ─────────────────────────────────────── */
function ProfilePanel({ user, onClose }) {
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div style={panelWrap}>
      <div style={panelHeaderRow}>
        <button onClick={onClose} style={backBtn} aria-label="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <span style={panelTitle}>Profile</span>
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0 20px' }}>
        <div style={avatarLarge}>
          <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--coral)' }}>{initials}</span>
        </div>
        <p style={{ fontWeight: 700, fontSize: 16, marginTop: 12, color: 'var(--charcoal)' }}>
          {user?.name || 'User'}
        </p>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
          {user?.email || ''}
        </p>
      </div>

      {/* Info rows */}
      <div style={{ borderTop: '1px solid var(--border)', margin: '0 18px' }} />
      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { label: 'Name', value: user?.name || '—' },
          { label: 'Email', value: user?.email || '—' },
          { label: 'Role', value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Passenger' },
        ].map(row => (
          <div key={row.label} style={infoRow}>
            <span style={infoLabel}>{row.label}</span>
            <span style={infoVal}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Sub-panel: Settings ────────────────────────────────────── */
function SettingsPanel({ onClose }) {
  const { dark, toggle } = useTheme();
  const [notif, setNotif] = useState(true);

  return (
    <div style={panelWrap}>
      <div style={panelHeaderRow}>
        <button onClick={onClose} style={backBtn} aria-label="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <span style={panelTitle}>Settings</span>
      </div>

      <div style={{ padding: '8px 0 12px' }}>
        <p style={settingsSection}>Appearance</p>
        <div style={settingRow}>
          <div>
            <p style={settingName}>Dark Mode</p>
            <p style={settingDesc}>{dark ? 'Currently dark' : 'Currently light'}</p>
          </div>
          <ToggleSwitch checked={dark} onChange={toggle} />
        </div>

        <p style={{ ...settingsSection, marginTop: 8 }}>Notifications</p>
        <div style={settingRow}>
          <div>
            <p style={settingName}>Push Notifications</p>
            <p style={settingDesc}>Ride updates & alerts</p>
          </div>
          <ToggleSwitch checked={notif} onChange={() => setNotif(v => !v)} />
        </div>

        <p style={{ ...settingsSection, marginTop: 8 }}>About</p>
        <div style={{ padding: '10px 18px' }}>
          {[
            { label: 'App Version', val: 'v2.0.0' },
            { label: 'Platform', val: 'UrbanRide Web' },
          ].map(r => (
            <div key={r.label} style={{ ...infoRow, marginBottom: 8 }}>
              <span style={infoLabel}>{r.label}</span>
              <span style={{ ...infoVal, color: 'var(--muted)' }}>{r.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Mini toggle switch ─────────────────────────────────────── */
function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        position: 'relative', width: 42, height: 24,
        borderRadius: 12, border: 'none', cursor: 'pointer',
        background: checked ? 'var(--coral)' : 'var(--border)',
        transition: 'background 0.2s', flexShrink: 0,
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        left: checked ? 21 : 3,
        width: 18, height: 18, background: 'white',
        borderRadius: '50%', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        display: 'block',
      }} />
    </button>
  );
}

/* ─── Ride History shortcut ──────────────────────────────────── */
function RideHistoryItem({ navigate, onClose }) {
  return (
    <button
      onClick={() => { navigate('/my-rides'); onClose(); }}
      style={menuItemStyle(false)}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={iconWrap}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
            stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" />
          <rect x="9" y="3" width="6" height="4" rx="1" stroke="var(--coral)" strokeWidth="2" />
          <path d="M9 12h6M9 16h4" stroke="var(--coral)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <div>
        <p style={menuItemLabel}>Ride History</p>
        <p style={menuItemDesc}>View all past trips</p>
      </div>
      <svg style={{ marginLeft: 'auto', color: 'var(--muted)' }} width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/* ─── Main LogoMenu component ────────────────────────────────── */
export default function LogoMenu() {
  const [open, setOpen]     = useState(false);
  const [panel, setPanel]   = useState(null); // null | 'profile' | 'settings'
  const { user, logout }    = useAuth();
  const navigate            = useNavigate();
  const menuRef             = useRef(null);

  const close = useCallback(() => { setOpen(false); setPanel(null); }, []);

  /* Close on outside click */
  useEffect(() => {
    const handler = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) close();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [close]);

  /* Close on Escape */
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') close(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, close]);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <>
      {/* Backdrop dimmer */}
      {open && (
        <div
          onClick={close}
          style={{
            position: 'fixed', inset: 0, zIndex: 149,
            background: 'rgba(0,0,0,0.08)',
            backdropFilter: 'blur(1px)',
            animation: 'fadeInBackdrop 0.15s ease-out',
          }}
        />
      )}

      <div ref={menuRef} style={{ position: 'relative', zIndex: 150 }}>
        {/* ── Logo trigger button ── */}
        <button
          id="logo-menu-trigger"
          onClick={() => { setOpen(o => !o); setPanel(null); }}
          aria-haspopup="true"
          aria-expanded={open}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', background: 'none', border: 'none',
            padding: '4px 8px 4px 2px', borderRadius: 10,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--cream-dark)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          {/* Logo mark */}
          <div style={{
            width: 36, height: 36,
            background: open
              ? 'linear-gradient(135deg, var(--coral-dark), var(--coral))'
              : 'linear-gradient(135deg, var(--coral), var(--coral-light))',
            borderRadius: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.25s',
            boxShadow: open
              ? '0 0 0 3px rgba(204,120,92,0.25), 0 4px 12px rgba(204,120,92,0.3)'
              : '0 2px 6px rgba(204,120,92,0.25)',
            transform: open ? 'scale(0.93) rotate(-4deg)' : 'scale(1) rotate(0deg)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 7v10l8 5 8-5V7L12 2z"
                stroke="white" strokeWidth="2.2" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="2.5" fill="white" />
            </svg>
          </div>

          {/* Brand name */}
          <span style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700, fontSize: 16,
            color: 'var(--charcoal)',
            letterSpacing: '-0.3px',
          }}>
            Urban<span style={{ color: 'var(--coral)' }}>Ride</span>
          </span>

          {/* Chevron */}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
            style={{
              transition: 'transform 0.25s',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              color: 'var(--muted)',
            }}>
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* ── Dropdown panel ── */}
        {open && (
          <div
            role="menu"
            aria-label="Navigation menu"
            style={{
              position: 'absolute', left: 0, top: 50,
              background: 'var(--card-bg)',
              borderRadius: 16,
              width: 300,
              boxShadow: '0 12px 40px rgba(28,25,23,0.15), 0 2px 8px rgba(28,25,23,0.08)',
              border: '1px solid var(--border)',
              zIndex: 200,
              overflow: 'hidden',
              animation: 'logoMenuIn 0.2s cubic-bezier(0.16,1,0.3,1)',
              transformOrigin: 'top left',
            }}
          >
            {/* ── Main menu view ── */}
            {panel === null && (
              <div>
                {/* User header */}
                <div style={{
                  padding: '16px 18px 14px',
                  background: 'linear-gradient(135deg, var(--coral-pale) 0%, transparent 100%)',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  {/* Avatar */}
                  <div style={avatarSmall}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--coral)' }}>
                      {initials}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--charcoal)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.name || 'User'}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.email || ''}
                    </p>
                  </div>
                  {/* Live indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: '#4CAF50',
                      boxShadow: '0 0 0 2px rgba(76,175,80,0.2)',
                      display: 'inline-block',
                    }} />
                    <span style={{ fontSize: 10, color: '#4CAF50', fontWeight: 600 }}>Active</span>
                  </div>
                </div>

                {/* Menu items */}
                <div style={{ padding: '8px 0 4px' }}>

                  {/* Profile */}
                  <button
                    role="menuitem"
                    onClick={() => setPanel('profile')}
                    style={menuItemStyle(false)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={iconWrap}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="4" stroke="var(--coral)" strokeWidth="2" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="var(--coral)"
                          strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                    <div>
                      <p style={menuItemLabel}>Profile</p>
                      <p style={menuItemDesc}>Account details & info</p>
                    </div>
                    <svg style={{ marginLeft: 'auto', color: 'var(--muted)' }} width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>

                  {/* Ride History */}
                  <RideHistoryItem navigate={navigate} onClose={close} />

                  {/* Find Ride */}
                  <button
                    role="menuitem"
                    onClick={() => { navigate('/search'); close(); }}
                    style={menuItemStyle(false)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={iconWrap}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                        <circle cx="11" cy="11" r="7" stroke="var(--coral)" strokeWidth="2" />
                        <path d="M20 20L16.65 16.65" stroke="var(--coral)"
                          strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                    <div>
                      <p style={menuItemLabel}>Find a Ride</p>
                      <p style={menuItemDesc}>Search available rides</p>
                    </div>
                    <svg style={{ marginLeft: 'auto', color: 'var(--muted)' }} width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>

                  {/* Post Ride */}
                  <button
                    role="menuitem"
                    onClick={() => { navigate('/post-ride'); close(); }}
                    style={menuItemStyle(false)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={iconWrap}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="var(--coral)" strokeWidth="2" />
                        <path d="M12 8v8M8 12h8" stroke="var(--coral)"
                          strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                    <div>
                      <p style={menuItemLabel}>Post a Ride</p>
                      <p style={menuItemDesc}>Share your journey</p>
                    </div>
                    <svg style={{ marginLeft: 'auto', color: 'var(--muted)' }} width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>

                  {/* Divider */}
                  <div style={{ borderTop: '1px solid var(--border)', margin: '6px 16px' }} />

                  {/* Settings */}
                  <button
                    role="menuitem"
                    onClick={() => setPanel('settings')}
                    style={menuItemStyle(false)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={iconWrap}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="3" stroke="var(--coral)" strokeWidth="2" />
                        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                          stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                    <div>
                      <p style={menuItemLabel}>Settings</p>
                      <p style={menuItemDesc}>Theme, notifications & more</p>
                    </div>
                    <svg style={{ marginLeft: 'auto', color: 'var(--muted)' }} width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>

                  {/* Divider */}
                  <div style={{ borderTop: '1px solid var(--border)', margin: '6px 16px' }} />

                  <button
                    role="menuitem"
                    onClick={() => { logout(); close(); window.location.href = '/'; }}
                    style={menuItemStyle(true)}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#FEE2E2';
                    }}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ ...iconWrap, background: 'rgba(192,57,43,0.1)' }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
                          stroke="var(--error)" strokeWidth="2" strokeLinecap="round" />
                        <polyline points="16 17 21 12 16 7"
                          stroke="var(--error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="21" y1="12" x2="9" y2="12"
                          stroke="var(--error)" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                    <div>
                      <p style={{ ...menuItemLabel, color: 'var(--error)' }}>Logout</p>
                      <p style={menuItemDesc}>Sign out of your account</p>
                    </div>
                  </button>

                </div>

                {/* Footer */}
                <div style={{
                  padding: '10px 18px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'center',
                  background: 'var(--cream)',
                }}>
                  <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.05em' }}>
                    URBANRIDE · v2.0.0
                  </span>
                </div>
              </div>
            )}

            {/* ── Profile sub-panel ── */}
            {panel === 'profile' && (
              <ProfilePanel user={user} onClose={() => setPanel(null)} />
            )}

            {/* ── Settings sub-panel ── */}
            {panel === 'settings' && (
              <SettingsPanel onClose={() => setPanel(null)} />
            )}
          </div>
        )}
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes logoMenuIn {
          from { opacity: 0; transform: scale(0.95) translateY(-6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @keyframes fadeInBackdrop {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        [data-theme="dark"] #logo-menu-trigger:hover {
          background: var(--cream-dark) !important;
        }
      `}</style>
    </>
  );
}

/* ─── Shared style objects ───────────────────────────────────── */
const avatarSmall = {
  width: 40, height: 40,
  background: 'var(--coral-pale)',
  borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: '2px solid var(--coral)',
  flexShrink: 0,
};

const avatarLarge = {
  width: 72, height: 72,
  background: 'var(--coral-pale)',
  borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: '3px solid var(--coral)',
  boxShadow: '0 4px 16px rgba(204,120,92,0.25)',
};

const iconWrap = {
  width: 34, height: 34,
  background: 'var(--coral-pale)',
  borderRadius: 9,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};

const menuItemStyle = (isDanger) => ({
  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
  padding: '10px 16px', border: 'none', cursor: 'pointer',
  background: 'transparent', textAlign: 'left',
  transition: 'background 0.15s',
  color: isDanger ? 'var(--error)' : 'var(--charcoal)',
});

const menuItemLabel = {
  fontWeight: 600, fontSize: 13, color: 'var(--charcoal)',
};

const menuItemDesc = {
  fontSize: 11, color: 'var(--muted)', marginTop: 1,
};

/* Sub-panel shared */
const panelWrap = { animation: 'logoMenuIn 0.18s cubic-bezier(0.16,1,0.3,1)' };

const panelHeaderRow = {
  display: 'flex', alignItems: 'center',
  padding: '14px 16px',
  borderBottom: '1px solid var(--border)',
  gap: 10,
};

const panelTitle = {
  fontWeight: 700, fontSize: 14, color: 'var(--charcoal)',
};

const backBtn = {
  display: 'flex', alignItems: 'center', gap: 5,
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--muted)', fontSize: 12, fontWeight: 500,
  padding: '4px 8px', borderRadius: 6,
  fontFamily: "'Montserrat', sans-serif",
  transition: 'color 0.15s, background 0.15s',
};

const infoRow = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
};

const infoLabel = {
  fontSize: 12, color: 'var(--muted)', fontWeight: 500,
};

const infoVal = {
  fontSize: 13, fontWeight: 600, color: 'var(--charcoal)',
  maxWidth: '60%', textAlign: 'right',
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
};

const settingsSection = {
  fontSize: 10, fontWeight: 700, color: 'var(--muted)',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  padding: '8px 18px 4px',
};

const settingRow = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '10px 18px', gap: 12,
};

const settingName = { fontWeight: 600, fontSize: 13, color: 'var(--charcoal)' };
const settingDesc = { fontSize: 11, color: 'var(--muted)', marginTop: 2 };
