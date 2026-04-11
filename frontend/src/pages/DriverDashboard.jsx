import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { getSocket } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';
import RouteMap from '../components/RouteMap';

/* ─── Constants ─────────────────────────────────────────────────── */
const VEHICLE_OPTIONS = [
  { key: 'bike', label: 'Bike',  icon: '🏍️', desc: 'Fast · Budget Friendly',  color: '#F59E0B' },
  { key: 'auto', label: 'Auto',  icon: '🛺', desc: 'Comfortable · City rides', color: '#10B981' },
  { key: 'car',  label: 'Car',   icon: '🚗', desc: 'Premium · AC Ride',        color: '#6366F1' },
];

const STATUS_FLOW = ['requested', 'accepted', 'arrived', 'in_progress', 'completed'];
const STATUS_META = {
  requested:    { label: 'Waiting for Request',  color: '#F59E0B', bg: '#FEF3C7' },
  accepted:     { label: 'Ride Accepted',         color: '#3B82F6', bg: '#EFF6FF' },
  arrived:      { label: 'Arrived at Pickup',     color: '#8B5CF6', bg: '#F5F3FF' },
  otp_verified: { label: 'OTP Verified',          color: '#10B981', bg: '#ECFDF5' },
  in_progress:  { label: 'Ride In Progress',      color: '#EF4444', bg: '#FEF2F2' },
  completed:    { label: 'Ride Completed',         color: '#10B981', bg: '#ECFDF5' },
  cancelled:    { label: 'Cancelled',              color: '#6B7280', bg: '#F9FAFB' },
};

/* ─── Helper ─────────────────────────────────────────────────────── */
function fmt(n) { return `₹${(n || 0).toFixed(0)}`; }

/* ─── Sub-components ─────────────────────────────────────────────── */

/** Top status bar showing online/offline */
function StatusBar({ isOnline, onToggle, vehicleType }) {
  const v = VEHICLE_OPTIONS.find(x => x.key === vehicleType);
  return (
    <div style={{
      background: isOnline
        ? 'linear-gradient(135deg, #0F4C2A 0%, #166534 100%)'
        : 'linear-gradient(135deg, #1C1917 0%, #292524 100%)',
      padding: '20px 24px',
      borderRadius: 20,
      marginBottom: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: isOnline
        ? '0 8px 32px rgba(22,101,52,0.35)'
        : '0 4px 16px rgba(0,0,0,0.25)',
      transition: 'all 0.4s ease',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background pulse when online */}
      {isOnline && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 80% 50%, rgba(74,222,128,0.15) 0%, transparent 70%)',
          animation: 'bgPulse 3s ease-in-out infinite',
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: isOnline ? '#4ADE80' : '#6B7280',
            boxShadow: isOnline ? '0 0 0 3px rgba(74,222,128,0.3)' : 'none',
            animation: isOnline ? 'dot-pulse 2s infinite' : 'none',
          }} />
          <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>
            {isOnline ? 'You are Online' : 'You are Offline'}
          </span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
          {isOnline
            ? `${v?.icon} ${v?.label} · Accepting rides`
            : 'Toggle to start earning'}
        </p>
      </div>

      <button
        onClick={onToggle}
        id="online-toggle-btn"
        style={{
          position: 'relative', zIndex: 1,
          background: isOnline ? '#4ADE80' : '#4B5563',
          border: 'none',
          borderRadius: 30,
          padding: '12px 24px',
          color: isOnline ? '#0F4C2A' : 'white',
          fontWeight: 700,
          fontSize: 13,
          cursor: 'pointer',
          transition: 'all 0.3s',
          boxShadow: isOnline ? '0 4px 12px rgba(74,222,128,0.4)' : 'none',
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}
      >
        {isOnline ? '● Online' : '○ Go Online'}
      </button>
    </div>
  );
}

/** Vehicle selector */
function VehicleSelector({ selected, onChange, disabled }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 10 }}>
        Vehicle Type
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {VEHICLE_OPTIONS.map(v => (
          <button
            key={v.key}
            onClick={() => !disabled && onChange(v.key)}
            disabled={disabled}
            id={`vehicle-${v.key}-btn`}
            style={{
              padding: '14px 8px',
              border: `2px solid ${selected === v.key ? v.color : 'var(--border)'}`,
              borderRadius: 14,
              background: selected === v.key
                ? `${v.color}15`
                : 'var(--card-bg)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.25s',
              opacity: disabled ? 0.7 : 1,
              transform: selected === v.key ? 'scale(1.04)' : 'scale(1)',
              boxShadow: selected === v.key ? `0 4px 16px ${v.color}30` : 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 4 }}>{v.icon}</div>
            <p style={{
              fontWeight: 700, fontSize: 13, marginBottom: 2,
              color: selected === v.key ? v.color : 'var(--charcoal)'
            }}>{v.label}</p>
            <p style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.3 }}>{v.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Ride Request card (incoming request) */
function RideRequestCard({ ride, onAccept, onReject, acting }) {
  const [countdown, setCountdown] = useState(30);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const v = VEHICLE_OPTIONS.find(x => x.key === ride.vehicleType) || VEHICLE_OPTIONS[1];
  const pct = (countdown / 30) * 100;

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '2px solid var(--coral)',
      borderRadius: 20,
      padding: '20px',
      marginBottom: 16,
      boxShadow: '0 8px 32px rgba(204,120,92,0.2)',
      animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Countdown bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        height: 3,
        width: `${pct}%`,
        background: countdown > 10 ? 'var(--coral)' : '#EF4444',
        transition: 'width 1s linear, background 0.3s',
        borderRadius: '20px 0 0 0',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: `linear-gradient(135deg, ${v.color}22, ${v.color}44)`,
            border: `2px solid ${v.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>
            {v.icon}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--charcoal)' }}>
              {ride.passengerName || 'Passenger'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--muted)' }}>{v.label} Request</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontWeight: 800, fontSize: 22, color: 'var(--coral)' }}>{fmt(ride.fare)}</p>
          <p style={{
            fontSize: 12,
            color: countdown <= 10 ? '#EF4444' : 'var(--muted)',
            fontWeight: countdown <= 10 ? 700 : 400,
          }}>
            {countdown}s left
          </p>
        </div>
      </div>

      {/* Route */}
      <div style={{
        background: 'var(--cream)',
        borderRadius: 12,
        padding: '12px 14px',
        marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', border: '2px solid white', boxShadow: '0 0 0 2px #10B981' }} />
            <div style={{ width: 2, height: 28, background: 'var(--border)', margin: '4px 0' }} />
            <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--coral)', border: '2px solid white', boxShadow: '0 0 0 2px var(--coral)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 14 }}>
              {ride.pickupAddress}
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>
              {ride.dropAddress}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            📍 {ride.distanceKm} km
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            ⏱ ~{ride.durationMin} min
          </span>
        </div>
      </div>
      
      {/* Route Preview Map */}
      {showPreview && (
        <div style={{ marginBottom: 14, animation: 'slideIn 0.3s ease' }}>
          <RouteMap 
            sourceCoords={{
              lat: ride.pickupLocation?.coordinates?.[1] || ride.pickupLat,
              lng: ride.pickupLocation?.coordinates?.[0] || ride.pickupLng,
              address: ride.pickupAddress
            }}
            destCoords={{
              lat: ride.dropLocation?.coordinates?.[1] || ride.dropLat,
              lng: ride.dropLocation?.coordinates?.[0] || ride.dropLng,
              address: ride.dropAddress
            }}
            height={220}
          />
        </div>
      )}

      {/* Toggle Preview Button */}
      <button 
        onClick={() => setShowPreview(!showPreview)}
        style={{
          width: '100%',
          padding: '8px',
          background: 'none',
          border: '1px solid var(--border)',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--coral)',
          cursor: 'pointer',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          transition: 'all 0.2s'
        }}
      >
        {showPreview ? '🗺️ Hide Map Preview' : '🗺️ View Route on Map'}
      </button>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => onReject(ride._id)}
          disabled={acting || countdown === 0}
          id={`reject-ride-${ride._id}`}
          style={{
            flex: 1, padding: '13px',
            border: '1.5px solid var(--border)',
            borderRadius: 12, background: 'var(--cream-dark)',
            color: 'var(--muted)', fontWeight: 600, fontSize: 14,
            cursor: acting || countdown === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', fontFamily: 'inherit',
          }}
        >
          ✕ Reject
        </button>
        <button
          onClick={() => onAccept(ride._id)}
          disabled={acting || countdown === 0}
          id={`accept-ride-${ride._id}`}
          style={{
            flex: 2, padding: '13px',
            border: 'none', borderRadius: 12,
            background: acting ? 'var(--cream-dark)' : 'linear-gradient(135deg, #059669, #10B981)',
            color: acting ? 'var(--muted)' : 'white',
            fontWeight: 700, fontSize: 15,
            cursor: acting || countdown === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', fontFamily: 'inherit',
            boxShadow: acting ? 'none' : '0 4px 16px rgba(16,185,129,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          {acting
            ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Accepting...</>
            : '✓ Accept Ride'
          }
        </button>
      </div>
    </div>
  );
}

/** Active Ride Panel — shows current ride lifecycle */
function ActiveRidePanel({ ride, onArrived, onVerifyOTP, onComplete, onCancel, acting }) {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    setOtpError('');
    if (val && i < 3) otpRefs[i + 1].current?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs[i - 1].current?.focus();
    }
  };

  const handleOtpSubmit = () => {
    const code = otp.join('');
    if (code.length !== 4) { setOtpError('Enter all 4 digits'); return; }
    onVerifyOTP(ride._id, code, setOtpError);
  };

  const v = VEHICLE_OPTIONS.find(x => x.key === ride.vehicleType) || VEHICLE_OPTIONS[1];
  const meta = STATUS_META[ride.status] || STATUS_META.accepted;

  // Step progress
  const steps = [
    { key: 'accepted',    label: 'Accepted',  icon: '✓' },
    { key: 'arrived',     label: 'Arrived',   icon: '📍' },
    { key: 'in_progress', label: 'Started',   icon: '▶' },
    { key: 'completed',   label: 'Done',       icon: '★' },
  ];
  const currentStep = steps.findIndex(s => s.key === ride.status) ?? 0;

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: `2px solid ${meta.color}`,
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 20,
      boxShadow: `0 8px 32px ${meta.color}22`,
    }}>
      {/* Status header */}
      <div style={{
        background: `linear-gradient(135deg, ${meta.color}22, ${meta.color}11)`,
        padding: '16px 20px',
        borderBottom: `1px solid ${meta.color}33`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <span style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: meta.color,
          }}>
            {meta.label}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <span style={{ fontSize: 20 }}>{v.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--charcoal)' }}>
              {v.label} Ride
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--coral)' }}>{fmt(ride.fare)}</p>
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>{ride.distanceKm} km</p>
        </div>
      </div>

      {/* Progress steps */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {steps.map((step, i) => {
            const done = i < currentStep || ride.status === 'completed';
            const active = step.key === ride.status ||
              (ride.status === 'otp_verified' && step.key === 'in_progress');
            return (
              <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: done || active ? meta.color : 'var(--cream-dark)',
                    color: done || active ? 'white' : 'var(--muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: done ? 14 : 12, fontWeight: 700,
                    transition: 'all 0.3s',
                    boxShadow: active ? `0 0 0 4px ${meta.color}33` : 'none',
                  }}>
                    {done && i < currentStep ? '✓' : step.icon}
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 600, marginTop: 4,
                    color: done || active ? meta.color : 'var(--muted)',
                    textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                  }}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, marginBottom: 16, mx: 4,
                    background: i < currentStep ? meta.color : 'var(--border)',
                    transition: 'background 0.4s',
                    margin: '0 8px 16px',
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Route Map Preview */}
      <div style={{ padding: '0 20px 14px' }}>
        <RouteMap 
          sourceCoords={{
            lat: ride.pickupLocation?.coordinates?.[1] || ride.pickupLat,
            lng: ride.pickupLocation?.coordinates?.[0] || ride.pickupLng,
            address: ride.pickupAddress
          }}
          destCoords={{
            lat: ride.dropLocation?.coordinates?.[1] || ride.dropLat,
            lng: ride.dropLocation?.coordinates?.[0] || ride.dropLng,
            address: ride.dropAddress
          }}
          height={180}
        />
      </div>

      {/* Route */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 3px rgba(16,185,129,0.2)' }} />
            <div style={{ width: 2, height: 24, background: 'var(--border)', margin: '4px 0' }} />
            <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--coral)', boxShadow: '0 0 0 3px rgba(204,120,92,0.2)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>Pickup</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 14 }}>
              {ride.pickupAddress}
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>Drop-off</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>
              {ride.dropAddress}
            </p>
          </div>
        </div>
      </div>

      {/* OTP Section — shown when arrived */}
      {(ride.status === 'arrived') && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: '#F5F3FF' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#6D28D9', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            🔐 Enter OTP from Passenger
          </p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, justifyContent: 'center' }}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={otpRefs[i]}
                id={`otp-input-${i}`}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                style={{
                  width: 54, height: 60, textAlign: 'center',
                  fontSize: 24, fontWeight: 800,
                  border: `2px solid ${otpError ? '#EF4444' : digit ? '#8B5CF6' : 'var(--border)'}`,
                  borderRadius: 12,
                  background: digit ? 'white' : 'var(--cream)',
                  color: 'var(--charcoal)',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxShadow: digit ? '0 2px 8px rgba(139,92,246,0.2)' : 'none',
                  fontFamily: 'inherit',
                }}
              />
            ))}
          </div>
          {otpError && (
            <p style={{ fontSize: 12, color: '#EF4444', textAlign: 'center', marginBottom: 10 }}>
              ⚠ {otpError}
            </p>
          )}
          <button
            onClick={handleOtpSubmit}
            disabled={acting || otp.join('').length !== 4}
            id="verify-otp-btn"
            style={{
              width: '100%', padding: '13px',
              background: otp.join('').length === 4
                ? 'linear-gradient(135deg, #6D28D9, #8B5CF6)'
                : 'var(--cream-dark)',
              color: otp.join('').length === 4 ? 'white' : 'var(--muted)',
              border: 'none', borderRadius: 12,
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s',
              boxShadow: otp.join('').length === 4
                ? '0 4px 16px rgba(109,40,217,0.3)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {acting
              ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Verifying...</>
              : '🔓 Start Ride'
            }
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ padding: '16px 20px', display: 'flex', gap: 10 }}>
        {ride.status === 'accepted' && (
          <button
            onClick={() => onArrived(ride._id)}
            disabled={acting}
            id="arrived-btn"
            style={{
              flex: 1, padding: '13px',
              background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)',
              color: 'white', border: 'none', borderRadius: 12,
              fontWeight: 700, fontSize: 14, cursor: acting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s',
              boxShadow: '0 4px 16px rgba(109,40,217,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {acting ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Updating...</> : '📍 Mark Arrived'}
          </button>
        )}

        {ride.status === 'in_progress' && (
          <button
            onClick={() => onComplete(ride._id)}
            disabled={acting}
            id="complete-ride-btn"
            style={{
              flex: 1, padding: '13px',
              background: 'linear-gradient(135deg, #059669, #10B981)',
              color: 'white', border: 'none', borderRadius: 12,
              fontWeight: 700, fontSize: 15, cursor: acting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s',
              boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {acting ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Completing...</> : '★ Complete Ride'}
          </button>
        )}

        {!['completed', 'cancelled', 'in_progress'].includes(ride.status) && (
          <button
            onClick={() => onCancel(ride._id)}
            disabled={acting}
            id="cancel-ride-btn"
            style={{
              flex: ride.status === 'arrived' ? 'none' : 1,
              padding: '13px 18px',
              background: 'var(--cream-dark)', color: 'var(--muted)',
              border: '1.5px solid var(--border)', borderRadius: 12,
              fontWeight: 600, fontSize: 13, cursor: acting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s',
            }}
          >
            Cancel
          </button>
        )}

        {ride.status === 'completed' && (
          <div style={{
            flex: 1, padding: '13px', borderRadius: 12,
            background: '#ECFDF5', border: '2px solid #10B981',
            textAlign: 'center', fontWeight: 700, fontSize: 14, color: '#059669',
          }}>
            ✓ Ride Completed · {fmt(ride.fare)} earned
          </div>
        )}
      </div>
    </div>
  );
}

/** Earnings summary card */
function EarningsCard({ earnings }) {
  if (!earnings) return null;
  const { todayEarnings = 0, totalEarnings = 0, todayRides = 0, totalRides = 0 } = earnings;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1C1917 0%, #292524 100%)',
      borderRadius: 20,
      padding: '20px 24px',
      marginBottom: 20,
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 120, height: 120, borderRadius: '50%',
        background: 'rgba(204,120,92,0.15)',
      }} />
      <div style={{
        position: 'absolute', bottom: -30, right: 60,
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(204,120,92,0.08)',
      }} />

      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
        Today's Earnings
      </p>
      <p style={{ fontSize: 36, fontWeight: 800, color: '#4ADE80', marginBottom: 4 }}>
        {fmt(todayEarnings)}
      </p>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
        {todayRides} ride{todayRides !== 1 ? 's' : ''} completed today
      </p>
      <div style={{ display: 'flex', gap: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Total Earned</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--coral-light, #E8A98A)' }}>{fmt(totalEarnings)}</p>
        </div>
        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
        <div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Total Rides</p>
          <p style={{ fontSize: 18, fontWeight: 700 }}>{totalRides}</p>
        </div>
      </div>
    </div>
  );
}

/** Recent earnings list */
function RecentRidesList({ rides }) {
  if (!rides?.length) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 12 }}>
        Recent Rides
      </p>
      {rides.slice(0, 5).map((r) => (
        <div key={r._id} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', background: 'var(--card-bg)',
          border: '1px solid var(--border)', borderRadius: 12, marginBottom: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>
              {VEHICLE_OPTIONS.find(v => v.key === r.vehicleType)?.icon || '🚗'}
            </span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>
                {r.pickupAddress?.split(',')[0]} → {r.dropAddress?.split(',')[0]}
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>
                {r.distanceKm} km · {new Date(r.completedAt || r.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
          <p style={{ fontWeight: 700, color: '#10B981', fontSize: 15 }}>{fmt(r.fare)}</p>
        </div>
      ))}
    </div>
  );
}

/** Toast notification */
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [msg]);

  if (!msg) return null;
  const colors = {
    success: { bg: '#ECFDF5', border: '#10B981', color: '#065F46' },
    error:   { bg: '#FEF2F2', border: '#EF4444', color: '#991B1B' },
    info:    { bg: '#EFF6FF', border: '#3B82F6', color: '#1E40AF' },
    ride:    { bg: '#FFF7ED', border: '#F97316', color: '#C2410C' },
  };
  const c = colors[type] || colors.info;

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, minWidth: 280, maxWidth: 340,
      background: c.bg, border: `2px solid ${c.border}`,
      borderRadius: 16, padding: '14px 18px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      display: 'flex', gap: 10, alignItems: 'center',
    }}>
      <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: c.color }}>{msg}</p>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.color, fontSize: 16 }}>×</button>
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────── */
export default function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [tab, setTab] = useState('dashboard'); // 'dashboard' | 'earnings'
  const [isOnline, setIsOnline] = useState(false);
  const [vehicleType, setVehicleType] = useState('auto');
  const [incomingRides, setIncomingRides] = useState([]); // pending requests
  const [activeRide, setActiveRide] = useState(null);      // current ride
  const [earnings, setEarnings] = useState(null);
  const [recentRides, setRecentRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'info' });
  const [simulating, setSimulating] = useState(false);

  const pollRef = useRef(null);

  const showToast = (msg, type = 'info') => setToast({ msg, type });

  // Load earnings
  const loadEarnings = useCallback(async () => {
    try {
      const res = await api.get('/driver-rides/earnings');
      const d = res.data.data;
      setEarnings(d);
      setRecentRides(d.recentRides || []);
    } catch (err) {
      console.error('Earnings load error:', err);
    }
  }, []);

  // Load active ride and incoming requests
  const loadRides = useCallback(async () => {
    try {
      const res = await api.get('/driver-rides/my');
      const all = res.data.data?.rides || [];

      // Active ride = any non-terminal ride assigned to this driver
      const active = all.find(r =>
        ['accepted', 'arrived', 'otp_verified', 'in_progress'].includes(r.status)
      );
      setActiveRide(active || null);

      // Incoming = requested rides (available for this vehicle type)
      if (!active) {
        try {
          const avail = await api.get(`/driver-rides/available?vehicleType=${vehicleType}`);
          setIncomingRides(avail.data.data?.rides || []);
        } catch {
          setIncomingRides([]);
        }
      } else {
        setIncomingRides([]);
      }
    } catch (err) {
      console.error('Rides load error:', err);
    } finally {
      setLoading(false);
    }
  }, [vehicleType]);

  // Initial load
  useEffect(() => {
    loadRides();
    loadEarnings();
  }, [loadRides, loadEarnings]);

  // Poll when online (every 8 seconds)
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (isOnline) {
      pollRef.current = setInterval(loadRides, 8000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isOnline, loadRides]);

  // Socket events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewRide = (data) => {
      showToast(`🛺 New ride request! ${data.message || ''}`, 'ride');
      if (isOnline) loadRides();
    };

    socket.on('new_ride_request', handleNewRide);
    socket.on('ride_accepted', () => { showToast('Ride accepted!', 'success'); loadRides(); });
    socket.on('driver_arrived', () => loadRides());
    socket.on('ride_started', () => loadRides());
    socket.on('ride_completed', () => { loadRides(); loadEarnings(); });
    socket.on('ride_cancelled', () => { showToast('Ride cancelled', 'error'); loadRides(); });

    return () => {
      socket.off('new_ride_request', handleNewRide);
      socket.off('ride_accepted');
      socket.off('driver_arrived');
      socket.off('ride_started');
      socket.off('ride_completed');
      socket.off('ride_cancelled');
    };
  }, [isOnline, loadRides, loadEarnings]);

  // ── Ride Actions ──────────────────────────────────────────────────

  const handleAccept = async (rideId) => {
    setActing(true);
    try {
      const res = await api.patch(`/driver-rides/${rideId}/accept`);
      const ride = res.data.data?.ride;
      setActiveRide(ride);
      setIncomingRides([]);
      showToast(`Ride accepted! OTP: ${res.data.data?.otp}`, 'success');
      await loadRides();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to accept', 'error');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async (rideId) => {
    setIncomingRides(prev => prev.filter(r => r._id !== rideId));
    showToast('Ride rejected', 'info');
  };

  const handleArrived = async (rideId) => {
    setActing(true);
    try {
      await api.patch(`/driver-rides/${rideId}/arrived`);
      showToast('📍 Marked as arrived! Ask passenger for OTP.', 'success');
      await loadRides();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating status', 'error');
    } finally {
      setActing(false);
    }
  };

  const handleVerifyOTP = async (rideId, code, setOtpError) => {
    setActing(true);
    try {
      await api.patch(`/driver-rides/${rideId}/verify-otp`, { otp: code });
      showToast('✓ OTP Verified! Ride started.', 'success');
      await loadRides();
    } catch (err) {
      const msg = err.response?.data?.message || 'Incorrect OTP';
      setOtpError(msg);
      showToast(msg, 'error');
    } finally {
      setActing(false);
    }
  };

  const handleComplete = async (rideId) => {
    setActing(true);
    try {
      const res = await api.patch(`/driver-rides/${rideId}/complete`);
      const ride = res.data.data?.ride;
      showToast(`Ride completed! Earned ${fmt(ride?.fare)}`, 'success');
      setActiveRide(null);
      await Promise.all([loadRides(), loadEarnings()]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error completing ride', 'error');
    } finally {
      setActing(false);
    }
  };

  const handleCancel = async (rideId) => {
    setActing(true);
    try {
      await api.patch(`/driver-rides/${rideId}/cancel`);
      showToast('Ride cancelled', 'info');
      setActiveRide(null);
      await loadRides();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error cancelling ride', 'error');
    } finally {
      setActing(false);
    }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await api.post('/driver-rides/simulate-request', { vehicleType });
      showToast('🛺 New ride request simulated!', 'ride');
      await loadRides();
    } catch (err) {
      showToast('Simulation failed', 'error');
    } finally {
      setSimulating(false);
    }
  };

  /* ─── Render ───────────────────────────────────────────────────── */
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cream)',
      fontFamily: "'Montserrat', sans-serif",
    }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) translateX(-50%); }
          to   { opacity: 1; transform: translateY(0) translateX(-50%); }
        }
        @keyframes slideUp-card {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dot-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.5); }
          50%       { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
        }
        @keyframes bgPulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slideUp { animation: slideUp-card 0.35s cubic-bezier(0.34,1.56,0.64,1); }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: 20, padding: 0, lineHeight: 1,
          }}>←</button>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--charcoal)' }}>
              Driver Hub
            </h1>
            <p style={{ fontSize: 11, color: 'var(--muted)' }}>
              Hey {user?.name?.split(' ')[0] || 'Driver'} 👋
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', gap: 3,
          background: 'var(--cream-dark)', padding: 3, borderRadius: 10,
        }}>
          {[
            { key: 'dashboard', label: '🏠 Dashboard' },
            { key: 'earnings',  label: '💰 Earnings' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              id={`tab-${t.key}`}
              style={{
                padding: '6px 12px', border: 'none', borderRadius: 8,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: tab === t.key ? 'var(--white)' : 'transparent',
                color: tab === t.key ? 'var(--charcoal)' : 'var(--muted)',
                boxShadow: tab === t.key ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 100px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading driver hub...</p>
          </div>
        ) : tab === 'dashboard' ? (
          <>
            {/* Status toggle */}
            <StatusBar isOnline={isOnline} onToggle={() => setIsOnline(p => !p)} vehicleType={vehicleType} />

            {/* Vehicle selector — only when no active ride */}
            {!activeRide && (
              <VehicleSelector
                selected={vehicleType}
                onChange={v => { setVehicleType(v); setIncomingRides([]); }}
                disabled={isOnline && incomingRides.length > 0}
              />
            )}

            {/* Active ride panel */}
            {activeRide && (
              <div className="slideUp">
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 10 }}>
                  Current Ride
                </p>
                <ActiveRidePanel
                  ride={activeRide}
                  onArrived={handleArrived}
                  onVerifyOTP={handleVerifyOTP}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                  acting={acting}
                />
              </div>
            )}

            {/* Incoming ride requests */}
            {isOnline && !activeRide && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>
                      Incoming Requests
                    </p>
                    {incomingRides.length > 0 && (
                      <span style={{
                        background: 'var(--coral)', color: 'white', borderRadius: 20,
                        padding: '2px 8px', fontSize: 11, fontWeight: 700,
                        animation: 'bgPulse 1.5s infinite',
                      }}>
                        {incomingRides.length}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={loadRides}
                      style={{
                        background: 'var(--cream)', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                        fontSize: 12, color: 'var(--muted)', fontFamily: 'inherit',
                      }}
                    >
                      ↻ Refresh
                    </button>
                    <button
                      onClick={handleSimulate}
                      disabled={simulating}
                      id="simulate-request-btn"
                      style={{
                        background: 'var(--coral)', color: 'white',
                        border: 'none', borderRadius: 8, padding: '6px 12px',
                        cursor: simulating ? 'not-allowed' : 'pointer',
                        fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                        opacity: simulating ? 0.7 : 1,
                      }}
                    >
                      {simulating ? '...' : '+ Simulate'}
                    </button>
                  </div>
                </div>

                {incomingRides.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '40px 20px',
                    background: 'var(--card-bg)', borderRadius: 20,
                    border: '1.5px dashed var(--border)',
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>
                      {VEHICLE_OPTIONS.find(v => v.key === vehicleType)?.icon || '🛺'}
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                      Waiting for Requests
                    </p>
                    <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
                      You're online and ready. Ride requests will appear here.
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Click <strong>+ Simulate</strong> to test with a demo request
                    </p>
                  </div>
                ) : (
                  incomingRides.map(ride => (
                    <RideRequestCard
                      key={ride._id}
                      ride={ride}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      acting={acting}
                    />
                  ))
                )}
              </>
            )}

            {/* Offline placeholder */}
            {!isOnline && !activeRide && (
              <div style={{
                textAlign: 'center', padding: '40px 20px',
                background: 'var(--card-bg)', borderRadius: 20,
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 56, marginBottom: 12, filter: 'grayscale(0.5)' }}>
                  {VEHICLE_OPTIONS.find(v => v.key === vehicleType)?.icon || '🛺'}
                </div>
                <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--charcoal)' }}>
                  Start Earning Today
                </p>
                <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                  Toggle Online to start receiving ride requests from passengers nearby.
                </p>
                <button
                  onClick={() => setIsOnline(true)}
                  style={{
                    padding: '13px 32px',
                    background: 'linear-gradient(135deg, #059669, #10B981)',
                    color: 'white', border: 'none', borderRadius: 12,
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
                  }}
                  id="start-earning-btn"
                >
                  ▶ Start Earning
                </button>
              </div>
            )}
          </>
        ) : (
          /* ── Earnings Tab ── */
          <>
            <EarningsCard earnings={earnings} />

            {/* Stats grid */}
            {earnings && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Today's Rides",  value: earnings.todayRides,   icon: '🛺', color: '#10B981' },
                  { label: 'Total Rides',     value: earnings.totalRides,   icon: '🏆', color: '#F59E0B' },
                  { label: "Today's Total",   value: fmt(earnings.todayEarnings),  icon: '💵', color: '#6366F1' },
                  { label: 'Lifetime Total',  value: fmt(earnings.totalEarnings),  icon: '💰', color: '#EF4444' },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 16, padding: '16px',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <p style={{ fontSize: 20, marginBottom: 6 }}>{icon}</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color }}>{value}</p>
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{label}</p>
                  </div>
                ))}
              </div>
            )}

            <RecentRidesList rides={recentRides} />

            {!recentRides.length && (
              <div style={{
                textAlign: 'center', padding: '40px 20px',
                background: 'var(--card-bg)', borderRadius: 20,
                border: '1.5px dashed var(--border)',
              }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>💸</p>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>No earnings yet</p>
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                  Complete rides to see your earnings here
                </p>
              </div>
            )}

            <button
              onClick={loadEarnings}
              style={{
                width: '100%', padding: '13px',
                background: 'var(--cream-dark)', border: '1px solid var(--border)',
                borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13, fontWeight: 600, color: 'var(--muted)',
              }}
            >
              ↻ Refresh Earnings
            </button>
          </>
        )}
      </div>

      {/* Toast */}
      {toast.msg && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast({ msg: '', type: 'info' })}
        />
      )}
    </div>
  );
}
