import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import LocationPicker from '../components/LocationPicker';
import FareEstimator from '../components/FareEstimator';
import RouteMap from '../components/RouteMap';
import { getSocket } from '../hooks/useWebSocket';

/* ── Constants ─────────────────────────────────────── */
const VEHICLES = [
  { key: 'bike', label: 'Bike',  icon: '🏍️', color: '#F59E0B', desc: 'Fast · Budget' },
  { key: 'auto', label: 'Auto',  icon: '🛺', color: '#10B981', desc: 'Comfortable' },
  { key: 'car',  label: 'Car',   icon: '🚗', color: '#6366F1', desc: 'Premium · AC' },
];

const STATUS_META = {
  accepted:    { label: 'Ride Accepted',       color: '#3B82F6' },
  arrived:     { label: 'Arrived at Pickup',   color: '#8B5CF6' },
  in_progress: { label: 'Ride In Progress',    color: '#EF4444' },
  completed:   { label: 'Completed',           color: '#10B981' },
};

function fmtFare(n) { return `₹${(n || 0).toFixed(0)}`; }

/* ── Shared UI Components ────────────────────────────────────────── */

function Toast({ msg, type, onClose }) {
  useEffect(() => { if (msg) { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); } }, [msg]);
  if (!msg) return null;
  const c = { success: ['#ECFDF5','#10B981','#065F46'], error: ['#FEF2F2','#EF4444','#991B1B'], info: ['#EFF6FF','#3B82F6','#1E40AF'], ride: ['#FFF7ED','#F97316','#C2410C'] }[type] || ['#EFF6FF','#3B82F6','#1E40AF'];
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
      minWidth: 280, maxWidth: 340, background: c[0], border: `2px solid ${c[1]}`,
      borderRadius: 14, padding: '12px 16px', boxShadow: '0 8px 28px rgba(0,0,0,.18)',
      display: 'flex', gap: 10, alignItems: 'center',
      animation: 'slideUpToast .3s cubic-bezier(.34,1.56,.64,1)',
    }}>
      <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: c[2] }}>{msg}</p>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c[2], fontSize: 16 }}>×</button>
    </div>
  );
}

function VehiclePicker({ selected, onChange, disabled }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--muted)', marginBottom: 12 }}>
        Step 1: Choose Your Vehicle
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {VEHICLES.map(v => (
          <button key={v.key} onClick={() => !disabled && onChange(v.key)} style={{
            padding: '16px 8px', border: `2px solid ${selected === v.key ? v.color : 'var(--border)'}`,
            borderRadius: 16, background: selected === v.key ? `${v.color}10` : 'var(--card-bg)',
            cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .25s', fontFamily: 'inherit',
            transform: selected === v.key ? 'scale(1.02)' : 'scale(1)',
            boxShadow: selected === v.key ? `0 6px 16px ${v.color}25` : 'var(--shadow-sm)',
            position: 'relative', overflow: 'hidden'
          }}>
            {selected === v.key && <div style={{ position: 'absolute', top: 0, right: 0, width: 20, height: 20, background: v.color, color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0 0 0 10px' }}>✓</div>}
            <div style={{ fontSize: 32, marginBottom: 6 }}>{v.icon}</div>
            <p style={{ fontWeight: 700, fontSize: 13, color: selected === v.key ? v.color : 'var(--charcoal)' }}>{v.label}</p>
            <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{v.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Driver Hub Sub-components ──────────────────────────────────── */

function OnlineBar({ isOnline, onToggle, vehicleType }) {
  const v = VEHICLES.find(x => x.key === vehicleType);
  return (
    <div onClick={onToggle} style={{
      background: isOnline
        ? 'linear-gradient(135deg,#0F4C2A,#166534)'
        : 'linear-gradient(135deg,#1C1917,#292524)',
      borderRadius: 16, padding: '18px 20px', marginBottom: 16,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      cursor: 'pointer', transition: 'all 0.4s',
      boxShadow: isOnline ? '0 8px 24px rgba(22,101,52,.35)' : '0 4px 16px rgba(0,0,0,.25)',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{
            width: 9, height: 9, borderRadius: '50%',
            background: isOnline ? '#4ADE80' : '#6B7280',
            boxShadow: isOnline ? '0 0 0 3px rgba(74,222,128,.3)' : 'none',
            animation: isOnline ? 'dotPulse 2s infinite' : 'none',
          }} />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
            {isOnline ? 'You are Online' : 'You are Offline'}
          </span>
        </div>
        <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 12 }}>
          {isOnline ? `${v?.icon} ${v?.label} · Accepting rides` : 'Tap to go online & start earning'}
        </p>
      </div>
      <div style={{
        background: isOnline ? '#4ADE80' : '#4B5563',
        borderRadius: 24, padding: '10px 20px',
        color: isOnline ? '#0F4C2A' : '#fff',
        fontWeight: 700, fontSize: 13, transition: 'all .3s',
        boxShadow: isOnline ? '0 4px 12px rgba(74,222,128,.4)' : 'none',
      }}>
        {isOnline ? '● Online' : '○ Offline'}
      </div>
    </div>
  );
}

function RequestCard({ ride, onAccept, onReject, acting }) {
  const [countdown, setCountdown] = useState(30);
  useEffect(() => {
    const t = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(t);
  }, []);
  const v = VEHICLES.find(x => x.key === ride.vehicleType) || VEHICLES[1];
  return (
    <div style={{
      background: 'var(--card-bg)', border: '2px solid var(--coral)',
      borderRadius: 18, padding: 18, marginBottom: 14,
      boxShadow: '0 6px 24px rgba(204,120,92,.2)',
      animation: 'slideIn .35s cubic-bezier(.34,1.56,.64,1)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, height: 3,
        width: `${(countdown / 30) * 100}%`,
        background: countdown > 10 ? 'var(--coral)' : '#EF4444',
        transition: 'width 1s linear', borderRadius: '18px 0 0 0',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: `${v.color}22`, border: `2px solid ${v.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>{v.icon}</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14 }}>{ride.passengerName || 'Passenger'}</p>
            <p style={{ fontSize: 11, color: 'var(--muted)' }}>{v.label} · {ride.distanceKm} km · ~{ride.durationMin} min</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontWeight: 800, fontSize: 22, color: 'var(--coral)' }}>{fmtFare(ride.fare)}</p>
          <p style={{ fontSize: 11, color: countdown <= 10 ? '#EF4444' : 'var(--muted)', fontWeight: countdown <= 10 ? 700 : 400 }}>{countdown}s</p>
        </div>
      </div>
      <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>Pickup</p>
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{ride.pickupAddress}</p>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>Drop-off</p>
        <p style={{ fontSize: 13, fontWeight: 600 }}>{ride.dropAddress}</p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onReject(ride._id)} disabled={acting || countdown === 0} style={{
          flex: 1, padding: 12, border: '1.5px solid var(--border)',
          borderRadius: 10, background: 'var(--cream-dark)', color: 'var(--muted)',
          fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
        }}>✕ Reject</button>
        <button onClick={() => onAccept(ride._id)} disabled={acting || countdown === 0} style={{
          flex: 2, padding: 12, border: 'none', borderRadius: 10,
          background: acting ? 'var(--cream-dark)' : 'linear-gradient(135deg,#059669,#10B981)',
          color: acting ? 'var(--muted)' : '#fff', fontWeight: 700, fontSize: 14,
          cursor: acting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          boxShadow: acting ? 'none' : '0 4px 14px rgba(16,185,129,.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {acting ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />Accepting...</> : '✓ Accept Ride'}
        </button>
      </div>
    </div>
  );
}

function ActiveRidePanel({ ride, onArrived, onVerifyOTP, onComplete, onCancel, acting }) {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpErr, setOtpErr] = useState('');
  const refs = [useRef(), useRef(), useRef(), useRef()];
  const meta = STATUS_META[ride.status] || STATUS_META.accepted;
  const steps = [
    { key: 'accepted', label: 'Accepted', icon: '✓' },
    { key: 'arrived',  label: 'Arrived',  icon: '📍' },
    { key: 'in_progress', label: 'Started', icon: '▶' },
    { key: 'completed', label: 'Done', icon: '★' },
  ];
  const ci = steps.findIndex(s => s.key === ride.status);

  const handleOtp = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next); setOtpErr('');
    if (val && i < 3) refs[i + 1].current?.focus();
  };
  const handleKey = (i, e) => { if (e.key === 'Backspace' && !otp[i] && i > 0) refs[i - 1].current?.focus(); };
  const submitOtp = () => {
    const code = otp.join('');
    if (code.length !== 4) { setOtpErr('Enter all 4 digits'); return; }
    onVerifyOTP(ride._id, code, setOtpErr);
  };

  return (
    <div style={{ border: `2px solid ${meta.color}`, borderRadius: 18, overflow: 'hidden', marginBottom: 16, boxShadow: `0 6px 24px ${meta.color}22` }}>
      <div style={{ background: `${meta.color}18`, padding: '14px 18px', borderBottom: `1px solid ${meta.color}33`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: meta.color }}>{meta.label}</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)', marginTop: 2 }}>
            {VEHICLES.find(v => v.key === ride.vehicleType)?.icon} {ride.pickupAddress?.split(',')[0]} → {ride.dropAddress?.split(',')[0]}
          </p>
        </div>
        <p style={{ fontWeight: 800, fontSize: 20, color: 'var(--coral)' }}>{fmtFare(ride.fare)}</p>
      </div>

      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
        {steps.map((s, i) => {
          const done = i < ci; const active = s.key === ride.status;
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: done || active ? meta.color : 'var(--cream-dark)',
                  color: done || active ? '#fff' : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                  boxShadow: active ? `0 0 0 4px ${meta.color}33` : 'none', transition: 'all .3s',
                }}>{done ? '✓' : s.icon}</div>
                <span style={{ fontSize: 9, color: done || active ? meta.color : 'var(--muted)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 2, margin: '0 6px 14px', background: done ? meta.color : 'var(--border)', transition: 'background .4s' }} />}
            </div>
          );
        })}
      </div>

      {ride.status === 'arrived' && (
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: '#F5F3FF' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6D28D9', marginBottom: 10, textTransform: 'uppercase' }}>🔐 Enter Passenger OTP</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10 }}>
            {otp.map((d, i) => (
              <input key={i} ref={refs[i]} type="tel" inputMode="numeric" maxLength={1} value={d}
                onChange={e => handleOtp(i, e.target.value)} onKeyDown={e => handleKey(i, e)}
                style={{
                  width: 52, height: 58, textAlign: 'center', fontSize: 22, fontWeight: 800,
                  border: `2px solid ${otpErr ? '#EF4444' : d ? '#8B5CF6' : 'var(--border)'}`,
                  borderRadius: 12, background: d ? '#fff' : 'var(--cream)',
                  outline: 'none', fontFamily: 'inherit', color: 'var(--charcoal)',
                }}
              />
            ))}
          </div>
          {otpErr && <p style={{ fontSize: 12, color: '#EF4444', textAlign: 'center', marginBottom: 8 }}>⚠ {otpErr}</p>}
          <button onClick={submitOtp} disabled={acting || otp.join('').length !== 4} style={{
            width: '100%', padding: 12, background: otp.join('').length === 4 ? 'linear-gradient(135deg,#6D28D9,#8B5CF6)' : 'var(--cream-dark)',
            color: otp.join('').length === 4 ? '#fff' : 'var(--muted)', border: 'none', borderRadius: 10,
            fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}>🔓 Start Ride</button>
        </div>
      )}

      <div style={{ padding: '14px 18px', display: 'flex', gap: 10 }}>
        {ride.status === 'accepted' && (
          <button onClick={() => onArrived(ride._id)} disabled={acting} style={{
            flex: 1, padding: 12, background: 'linear-gradient(135deg,#6D28D9,#8B5CF6)',
            color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14,
            cursor: acting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {acting ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />Updating...</> : '📍 Mark Arrived'}
          </button>
        )}
        {ride.status === 'in_progress' && (
          <button onClick={() => onComplete(ride._id)} disabled={acting} style={{
            flex: 1, padding: 12, background: 'linear-gradient(135deg,#059669,#10B981)',
            color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15,
            cursor: acting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {acting ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />Completing...</> : '★ Complete Ride'}
          </button>
        )}
        {!['completed', 'cancelled', 'in_progress'].includes(ride.status) && (
          <button onClick={() => onCancel(ride._id)} disabled={acting} style={{
            flex: ride.status === 'arrived' ? 'none' : 1, padding: '12px 16px',
            background: 'var(--cream-dark)', color: 'var(--muted)',
            border: '1.5px solid var(--border)', borderRadius: 10, fontWeight: 600, fontSize: 13,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
        )}
      </div>
    </div>
  );
}

function EarningsBadge({ earnings }) {
  if (!earnings) return null;
  return (
    <div style={{
      background: 'linear-gradient(135deg,#1C1917,#292524)',
      borderRadius: 14, padding: '14px 18px', marginBottom: 14,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 2 }}>Today's Earnings</p>
        <p style={{ fontSize: 26, fontWeight: 800, color: '#4ADE80' }}>{fmtFare(earnings.todayEarnings)}</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>Today's Rides</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{earnings.todayRides}</p>
      </div>
    </div>
  );
}

/* ── Main PostRide Page ──────────────────────────────────────────── */
export default function PostRide() {
  const navigate = useNavigate();
  const [vehicleType, setVehicleType] = useState('auto'); // Step 1
  const [activeMode, setActiveMode]   = useState('driver'); // 'driver' | 'manual'
  const [tab, setTab]                 = useState('ride'); // for driver hub: 'ride' | 'earnings'

  // Driver Hub State
  const [isOnline, setIsOnline]     = useState(false);
  const [incomingRides, setIncoming] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [earnings, setEarnings]     = useState(null);
  const [acting, setActing]         = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [toast, setToast]           = useState({ msg: '', type: 'info' });

  // Manual Form State
  const [form, setForm] = useState({ sourceLandmark: '', destinationLandmark: '', totalSeats: 4, farePerSeat: 0, baseTotalRideFare: 0, femaleOnly: false });
  const [sourceCoords, setSourceCoords] = useState(null);
  const [destCoords, setDestCoords]     = useState(null);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [loading, setLoading]           = useState(false);
  const [savedRoutes, setSavedRoutes]   = useState([]);

  const pollRef = useRef(null);
  const showToast = (msg, type = 'info') => setToast({ msg, type });

  /* ── Initialization ── */
  useEffect(() => {
    api.get('/saved-routes').then(r => setSavedRoutes(r.data.data?.routes || []));
    loadEarnings();
    loadRides();
  }, []);

  /* ── Driver Hub Logic ── */
  const loadEarnings = useCallback(async () => {
    try { const r = await api.get('/driver-rides/earnings'); setEarnings(r.data.data); } catch {}
  }, []);

  const loadRides = useCallback(async () => {
    try {
      const r = await api.get('/driver-rides/my');
      const all = r.data.data?.rides || [];
      const active = all.find(x => ['accepted','arrived','otp_verified','in_progress'].includes(x.status));
      setActiveRide(active || null);
      if (!active && isOnline) {
        const avail = await api.get(`/driver-rides/available?vehicleType=${vehicleType}`);
        setIncoming(avail.data.data?.rides || []);
      } else { setIncoming([]); }
    } catch {}
  }, [vehicleType, isOnline]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (isOnline) pollRef.current = setInterval(loadRides, 8000);
    return () => clearInterval(pollRef.current);
  }, [isOnline, loadRides]);

  useEffect(() => {
    const s = getSocket(); if (!s) return;
    const onNew = () => { showToast('🛺 New ride request!', 'ride'); if (isOnline) loadRides(); };
    s.on('new_ride_request', onNew);
    s.on('ride_completed', () => { loadRides(); loadEarnings(); });
    return () => { s.off('new_ride_request', onNew); s.off('ride_completed'); };
  }, [isOnline, loadRides, loadEarnings]);

  const handleAccept = async (id) => {
    setActing(true);
    try {
      const r = await api.patch(`/driver-rides/${id}/accept`);
      setActiveRide(r.data.data?.ride); setIncoming([]);
      showToast(`Accepted! OTP: ${r.data.data?.otp}`, 'success');
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setActing(false); }
  };
  const handleReject = (id) => { setIncoming(p => p.filter(r => r._id !== id)); showToast('Rejected', 'info'); };
  const handleArrived = async (id) => {
    setActing(true);
    try { await api.patch(`/driver-rides/${id}/arrived`); showToast('Marked arrived!', 'success'); await loadRides(); }
    catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
    finally { setActing(false); }
  };
  const handleVerifyOTP = async (id, code, setErr) => {
    setActing(true);
    try { await api.patch(`/driver-rides/${id}/verify-otp`, { otp: code }); showToast('OTP verified!', 'success'); await loadRides(); }
    catch (e) { const m = e.response?.data?.message || 'Incorrect OTP'; setErr(m); showToast(m, 'error'); }
    finally { setActing(false); }
  };
  const handleComplete = async (id) => {
    setActing(true);
    try {
      const r = await api.patch(`/driver-rides/${id}/complete`);
      showToast(`Completed! Earned ${fmtFare(r.data.data?.ride?.fare)}`, 'success');
      setActiveRide(null); await Promise.all([loadRides(), loadEarnings()]);
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
    finally { setActing(false); }
  };
  const handleCancel = async (id) => {
    setActing(true);
    try { await api.patch(`/driver-rides/${id}/cancel`); showToast('Ride cancelled', 'info'); setActiveRide(null); await loadRides(); }
    catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
    finally { setActing(false); }
  };
  const handleSimulate = async () => {
    if (!isOnline) return showToast('Please go online first', 'info');
    setSimulating(true);
    try { await api.post('/driver-rides/simulate-request', { vehicleType }); showToast('New request simulated!', 'ride'); await loadRides(); }
    catch { showToast('Simulation failed', 'error'); }
    finally { setSimulating(false); }
  };

  /* ── Manual Pool Logic ── */
  const handleManualSubmit = async (e) => {
    if (e) e.preventDefault();
    if (form.sourceLandmark === form.destinationLandmark) return setError('Same source and destination');
    if (!sourceCoords || !destCoords) return setError('Select both locations');
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/rides', {
        ...form,
        vehicleType,
        sourceCoords: { lat: sourceCoords.lat, lng: sourceCoords.lng, address: sourceCoords.address },
        destCoords:   { lat: destCoords.lat,   lng: destCoords.lng,   address: destCoords.address   },
        sourceLandmark:      sourceCoords.address,
        destinationLandmark: destCoords.address,
        farePerSeat: form.baseTotalRideFare || 100,
        baseTotalRideFare: form.baseTotalRideFare || 100
      });
      setSuccess('Pooling ride posted! Redirecting...');
      setTimeout(() => navigate('/my-rides'), 1500);
    } catch (err) { setError(err.response?.data?.message || 'Failed to post'); setLoading(false); }
  };

  return (
    <div className="page-wrapper" style={{ paddingBottom: 80 }}>
      <style>{`
        @keyframes dotPulse { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.5)} 50%{box-shadow:0 0 0 6px rgba(74,222,128,0)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUpToast { from{opacity:0;transform:translateY(24px) translateX(-50%)} to{opacity:1;transform:translateY(0) translateX(-50%)} }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, padding: 0, marginBottom: 16 }}>
          ← Back to Map
        </button>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>Post a Ride</h2>
      </div>

      {/* Step 1: Vehicle Selector — Always Visible */}
      <VehiclePicker selected={vehicleType} onChange={setVehicleType} disabled={activeRide} />

      {/* Step 2: Mode Selection / Driver Hub */}
      <div className="card" style={{ padding: '24px 20px', borderRadius: 20 }}>

        {/* Tab Switcher (Driver Hub Mode) */}
        {activeMode === 'driver' && (
          <div style={{ display: 'flex', gap: 6, background: 'var(--cream-dark)', padding: 4, borderRadius: 12, width: 'fit-content', marginBottom: 18 }}>
            {[{ k: 'ride', lbl: '🛺 Active Hub' }, { k: 'earnings', lbl: '💰 Earnings' }].map(t => (
              <button key={t.k} onClick={() => setTab(t.k)} style={{
                padding: '8px 16px', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700,
                background: tab === t.k ? 'var(--white)' : 'transparent',
                color: tab === t.k ? 'var(--charcoal)' : 'var(--muted)',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all .25s',
                boxShadow: tab === t.k ? 'var(--shadow-sm)' : 'none',
              }}>{t.lbl}</button>
            ))}
          </div>
        )}

        {/* Mode Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800 }}>{activeMode === 'driver' ? 'On-Demand Driving' : 'Plan Custom Route'}</h3>
          <button onClick={() => setActiveMode(activeMode === 'driver' ? 'manual' : 'driver')} style={{
            background: 'var(--coral-pale)', border: 'none', padding: '6px 12px', borderRadius: 10,
            color: 'var(--coral)', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit'
          }}>
            {activeMode === 'driver' ? 'Switch to Pooling →' : 'Back to Driver Hub'}
          </button>
        </div>

        {activeMode === 'driver' ? (
          /* ── DRIVER HUB SECTION ── */
          tab === 'ride' ? (
            <div style={{ animation: 'slideIn .3s ease' }}>
              <OnlineBar isOnline={isOnline} onToggle={() => setIsOnline(!isOnline)} vehicleType={vehicleType} />

              {activeRide ? (
                <ActiveRidePanel ride={activeRide} onArrived={handleArrived} onVerifyOTP={handleVerifyOTP} onComplete={handleComplete} onCancel={handleCancel} acting={acting} />
              ) : isOnline ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '.07em' }}>
                      Rides Nearby {incomingRides.length > 0 && `(${incomingRides.length})`}
                    </p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={loadRides} style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', fontSize: 11, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>↻ Refresh</button>
                      <button onClick={handleSimulate} disabled={simulating} style={{ background: 'var(--coral)', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        + Simulate
                      </button>
                    </div>
                  </div>
                  {incomingRides.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--cream)', borderRadius: 16, border: '1.5px dashed var(--border)' }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
                      <p style={{ fontWeight: 700, fontSize: 14 }}>Waiting for passengers...</p>
                      <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>Keep the page open to receive real-time pings.</p>
                    </div>
                  ) : incomingRides.map(r => (
                    <RequestCard key={r._id} ride={r} onAccept={handleAccept} onReject={handleReject} acting={acting} />
                  ))}
                </>
              ) : (
                /* Offline State card */
                <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--cream)', borderRadius: 18, border: '1px solid var(--border)' }}>
                   <div style={{ fontSize: 50, marginBottom: 12 }}>🏁</div>
                   <p style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Ready to Earn?</p>
                   <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6, maxWidth: 220, margin: '0 auto' }}>
                     Go online to start receiving on-demand ride requests with {VEHICLES.find(v => v.key === vehicleType)?.icon}.
                   </p>
                </div>
              )}
            </div>
          ) : (
            /* Earnings Hub inside Driver Hub */
            <div style={{ animation: 'slideIn .3s ease' }}>
                <EarningsBadge earnings={earnings} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
                    <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Total Rides</p>
                    <p style={{ fontSize: 24, fontWeight: 800 }}>{earnings?.totalRides || 0}</p>
                  </div>
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
                    <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Lifetime Earned</p>
                    <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--coral)' }}>{fmtFare(earnings?.totalEarnings)}</p>
                  </div>
                </div>
                <button onClick={loadEarnings} style={{ width: '100%', padding: 12, background: 'var(--cream-dark)', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700 }}>↻ Update Statement</button>
            </div>
          )
        ) : (
          /* ── MANUAL POOLING FORM ── */
          <form onSubmit={handleManualSubmit} style={{ animation: 'slideIn .3s ease' }}>
            {error   && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            <LocationPicker value={sourceCoords} onChange={setSourceCoords} label="Pickup Point" mode="pickup" />
            <div style={{ height: 28, position: 'relative', marginLeft: 22 }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 2, background: 'var(--border)', borderStyle: 'dashed' }} />
            </div>
            <LocationPicker value={destCoords} onChange={setDestCoords} label="Drop-off Destination" mode="dropoff" />

            {sourceCoords && destCoords && (
              <div style={{ marginTop: 20 }}>
                <RouteMap sourceCoords={sourceCoords} destCoords={destCoords} height={180} />
                <div style={{ marginTop: 18 }}>
                   <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Estimated Pooling Fare</label>
                   <FareEstimator sourceCoords={sourceCoords} destCoords={destCoords} onFareSelect={f => setForm(prev => ({ ...prev, baseTotalRideFare: f * 4 }))} />
                </div>
                <div style={{ marginTop: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Total Trip Cost (₹)</label>
                  <input type="number" name="baseTotalRideFare" value={form.baseTotalRideFare} onChange={e => setForm({...form, baseTotalRideFare: e.target.value})} placeholder="Set total fare" required style={{ width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 16, fontWeight: 600 }} />
                </div>
              </div>
            )}

            <div style={{ marginTop: 20 }}>
               <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Available Guest Seats</label>
               <div style={{ display: 'flex', gap: 10 }}>
                 {[1,2,3,4].map(n => (
                   <button key={n} type="button" onClick={() => setForm({...form, totalSeats: n})} style={{
                     flex: 1, padding: 10, borderRadius: 10, border: `2px solid ${form.totalSeats === n ? 'var(--coral)' : 'var(--border)'}`,
                     background: form.totalSeats === n ? 'var(--coral-pale)' : 'var(--card-bg)', color: form.totalSeats === n ? 'var(--coral)' : 'var(--muted)',
                     fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                   }}>{n}</button>
                 ))}
               </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading || !sourceCoords || !destCoords} style={{ marginTop: 24, fontSize: 15 }}>
              {loading ? 'Posting...' : 'List Pooling Ride'}
            </button>
            {success && <div className="alert-success" style={{ marginTop: 16 }}>{success}</div>}
          </form>
        )}
      </div>

      {/* Saved Routes for Pooling */}
      {activeMode === 'manual' && savedRoutes.length > 0 && (
         <div style={{ marginTop: 20, padding: '0 4px' }}>
           <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>⭐ Quick Routes</p>
           <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
             {savedRoutes.map(r => (
               <div key={r._id} className="route-chip" style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => { setSourceCoords({ lat: r.sourceCoords.lat, lng: r.sourceCoords.lng, address: r.sourceLandmark }); setDestCoords({ lat: r.destCoords.lat, lng: r.destCoords.lng, address: r.destinationLandmark }); }}>
                 {r.label}
               </div>
             ))}
           </div>
         </div>
      )}

      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'info' })} />
    </div>
  );
}
