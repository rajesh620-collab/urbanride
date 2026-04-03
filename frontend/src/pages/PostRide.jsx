import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import LocationPicker from '../components/LocationPicker';
import FareEstimator from '../components/FareEstimator';
import RouteMap from '../components/RouteMap';
import { getSocket } from '../hooks/useWebSocket';

/* ── Driver Hub constants ─────────────────────────────────────── */
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

function VehiclePicker({ selected, onChange, disabled }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--muted)', marginBottom: 10 }}>
        Vehicle Type
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {VEHICLES.map(v => (
          <button key={v.key} onClick={() => !disabled && onChange(v.key)} style={{
            padding: '12px 6px', border: `2px solid ${selected === v.key ? v.color : 'var(--border)'}`,
            borderRadius: 14, background: selected === v.key ? `${v.color}18` : 'var(--card-bg)',
            cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .25s', fontFamily: 'inherit',
            transform: selected === v.key ? 'scale(1.04)' : 'scale(1)',
            boxShadow: selected === v.key ? `0 4px 14px ${v.color}30` : 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: 26, marginBottom: 4 }}>{v.icon}</div>
            <p style={{ fontWeight: 700, fontSize: 12, color: selected === v.key ? v.color : 'var(--charcoal)' }}>{v.label}</p>
            <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{v.desc}</p>
          </button>
        ))}
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
      animation: 'slideUp .35s cubic-bezier(.34,1.56,.64,1)',
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
      {/* Header */}
      <div style={{ background: `${meta.color}18`, padding: '14px 18px', borderBottom: `1px solid ${meta.color}33`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: meta.color }}>{meta.label}</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)', marginTop: 2 }}>
            {VEHICLES.find(v => v.key === ride.vehicleType)?.icon} {ride.pickupAddress?.split(',')[0]} → {ride.dropAddress?.split(',')[0]}
          </p>
        </div>
        <p style={{ fontWeight: 800, fontSize: 20, color: 'var(--coral)' }}>{fmtFare(ride.fare)}</p>
      </div>

      {/* Steps */}
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

      {/* OTP input when arrived */}
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

      {/* Actions */}
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
        {ride.status === 'completed' && (
          <div style={{
            flex: 1, padding: 12, borderRadius: 10, background: '#ECFDF5',
            border: '2px solid #10B981', textAlign: 'center', fontWeight: 700, fontSize: 14, color: '#059669',
          }}>✓ Completed · {fmtFare(ride.fare)} earned</div>
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
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>{earnings.todayRides} ride{earnings.todayRides !== 1 ? 's' : ''} today</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>Total Earned</p>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#E8A98A' }}>{fmtFare(earnings.totalEarnings)}</p>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>{earnings.totalRides} all-time</p>
      </div>
    </div>
  );
}

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
      animation: 'slideUp .3s cubic-bezier(.34,1.56,.64,1)',
    }}>
      <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: c[2] }}>{msg}</p>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c[2], fontSize: 16 }}>×</button>
    </div>
  );
}

/* ── Driver Hub Panel (self-contained) ──────────────────────────── */
function DriverHubPanel() {
  const [isOnline, setIsOnline]       = useState(false);
  const [vehicleType, setVehicleType] = useState('auto');
  const [incomingRides, setIncoming]  = useState([]);
  const [activeRide, setActiveRide]   = useState(null);
  const [earnings, setEarnings]       = useState(null);
  const [acting, setActing]           = useState(false);
  const [simulating, setSimulating]   = useState(false);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState('ride'); // 'ride' | 'earnings'
  const [toast, setToast]             = useState({ msg: '', type: 'info' });
  const pollRef = useRef(null);

  const showToast = (msg, type = 'info') => setToast({ msg, type });

  const loadEarnings = useCallback(async () => {
    try { const r = await api.get('/driver-rides/earnings'); setEarnings(r.data.data); } catch {}
  }, []);

  const loadRides = useCallback(async () => {
    try {
      const r = await api.get('/driver-rides/my');
      const all = r.data.data?.rides || [];
      const active = all.find(x => ['accepted','arrived','otp_verified','in_progress'].includes(x.status));
      setActiveRide(active || null);
      if (!active) {
        try {
          const avail = await api.get(`/driver-rides/available?vehicleType=${vehicleType}`);
          setIncoming(avail.data.data?.rides || []);
        } catch { setIncoming([]); }
      } else { setIncoming([]); }
    } catch {} finally { setLoading(false); }
  }, [vehicleType]);

  useEffect(() => { loadRides(); loadEarnings(); }, [loadRides, loadEarnings]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (isOnline) pollRef.current = setInterval(loadRides, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
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
      await loadRides();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setActing(false); }
  };
  const handleReject = (id) => { setIncoming(p => p.filter(r => r._id !== id)); showToast('Rejected', 'info'); };
  const handleArrived = async (id) => {
    setActing(true);
    try { await api.patch(`/driver-rides/${id}/arrived`); showToast('Marked arrived! Ask for OTP.', 'success'); await loadRides(); }
    catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
    finally { setActing(false); }
  };
  const handleVerifyOTP = async (id, code, setErr) => {
    setActing(true);
    try { await api.patch(`/driver-rides/${id}/verify-otp`, { otp: code }); showToast('OTP verified! Ride started.', 'success'); await loadRides(); }
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
    setSimulating(true);
    try { await api.post('/driver-rides/simulate-request', { vehicleType }); showToast('New ride request simulated!', 'ride'); await loadRides(); }
    catch { showToast('Simulation failed', 'error'); }
    finally { setSimulating(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>;

  return (
    <>
      <style>{`
        @keyframes dotPulse { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.5)} 50%{box-shadow:0 0 0 6px rgba(74,222,128,0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px) translateX(-50%)} to{opacity:1;transform:translateY(0) translateX(-50%)} }
      `}</style>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--cream-dark)', padding: 3, borderRadius: 10, width: 'fit-content', marginBottom: 16 }}>
        {[{ k: 'ride', lbl: '🛺 Ride' }, { k: 'earnings', lbl: '💰 Earnings' }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{
            padding: '6px 14px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: tab === t.k ? 'var(--white)' : 'transparent',
            color: tab === t.k ? 'var(--charcoal)' : 'var(--muted)',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
            boxShadow: tab === t.k ? 'var(--shadow-sm)' : 'none',
          }}>{t.lbl}</button>
        ))}
      </div>

      {tab === 'ride' ? (
        <>
          <OnlineBar isOnline={isOnline} onToggle={() => setIsOnline(p => !p)} vehicleType={vehicleType} />
          {!activeRide && <VehiclePicker selected={vehicleType} onChange={v => { setVehicleType(v); setIncoming([]); }} disabled={false} />}

          {activeRide && (
            <ActiveRidePanel ride={activeRide} onArrived={handleArrived} onVerifyOTP={handleVerifyOTP} onComplete={handleComplete} onCancel={handleCancel} acting={acting} />
          )}

          {isOnline && !activeRide && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--muted)' }}>Incoming Requests</p>
                  {incomingRides.length > 0 && <span style={{ background: 'var(--coral)', color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{incomingRides.length}</span>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={loadRides} style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', fontSize: 11, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>↻ Refresh</button>
                  <button onClick={handleSimulate} disabled={simulating} style={{ background: 'var(--coral)', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: simulating ? .7 : 1 }}>
                    {simulating ? '...' : '+ Simulate'}
                  </button>
                </div>
              </div>
              {incomingRides.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 20px', background: 'var(--cream)', borderRadius: 14, border: '1.5px dashed var(--border)' }}>
                  <p style={{ fontSize: 36, marginBottom: 10 }}>{VEHICLES.find(v => v.key === vehicleType)?.icon}</p>
                  <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Waiting for Requests</p>
                  <p style={{ color: 'var(--muted)', fontSize: 12 }}>Click <strong>+ Simulate</strong> to test with a demo request</p>
                </div>
              ) : incomingRides.map(r => (
                <RequestCard key={r._id} ride={r} onAccept={handleAccept} onReject={handleReject} acting={acting} />
              ))}
            </>
          )}

          {!isOnline && !activeRide && (
            <div style={{ textAlign: 'center', padding: '32px 20px', background: 'var(--cream)', borderRadius: 14, border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 42, marginBottom: 10 }}>{VEHICLES.find(v => v.key === vehicleType)?.icon}</p>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Start Earning</p>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>Toggle Online above to receive ride requests from nearby passengers.</p>
            </div>
          )}
        </>
      ) : (
        <>
          <EarningsBadge earnings={earnings} />
          {earnings && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { lbl: "Today's Rides",  val: earnings.todayRides,              color: '#10B981' },
                { lbl: 'Total Rides',    val: earnings.totalRides,              color: '#F59E0B' },
                { lbl: "Today's Total",  val: fmtFare(earnings.todayEarnings),  color: '#6366F1' },
                { lbl: 'Lifetime',       val: fmtFare(earnings.totalEarnings),  color: 'var(--coral)' },
              ].map(({ lbl, val, color }) => (
                <div key={lbl} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color }}>{val}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{lbl}</p>
                </div>
              ))}
            </div>
          )}
          <button onClick={loadEarnings} style={{ width: '100%', padding: 12, background: 'var(--cream-dark)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>↻ Refresh Earnings</button>
        </>
      )}

      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'info' })} />
    </>
  );
}

/* ── Main PostRide Page ──────────────────────────────────────────── */
export default function PostRide() {
  const navigate = useNavigate();
  const [activeOption, setActiveOption] = useState(null); // null | 'quick' | 'manual' | 'driver'
  const [landmarks, setLandmarks] = useState([]);
  const [form, setForm] = useState({ sourceLandmark: '', destinationLandmark: '', totalSeats: 4, farePerSeat: 0, baseTotalRideFare: 0, femaleOnly: false });
  const [sourceCoords, setSourceCoords] = useState(null);
  const [destCoords, setDestCoords]     = useState(null);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [recentRides, setRecentRides] = useState([]);

  useEffect(() => {
    api.get('/landmarks').then(r => setLandmarks(r.data.data?.landmarks || r.data.landmarks || []));
    api.get('/saved-routes').then(r => setSavedRoutes(r.data.data?.routes || []));
    api.get('/rides/my').then(r => setRecentRides(r.data.data?.rides?.slice(0, 5) || []));
  }, []);

  const handleSaveRoute = async () => {
    if (!sourceCoords || !destCoords) return;
    try {
      const r = await api.post('/saved-routes', { sourceLandmark: sourceCoords.address, destinationLandmark: destCoords.address, sourceCoords: { lat: sourceCoords.lat, lng: sourceCoords.lng }, destCoords: { lat: destCoords.lat, lng: destCoords.lng } });
      setSavedRoutes([r.data.data.route, ...savedRoutes]); setSuccess('Route saved!');
    } catch (e) { setError(e.response?.data?.message || 'Could not save route'); }
  };

  const resetOptions = () => { setActiveOption(null); setSourceCoords(null); setDestCoords(null); setForm({ sourceLandmark: '', destinationLandmark: '', totalSeats: 4, farePerSeat: 0, baseTotalRideFare: 0, femaleOnly: false }); };

  const handleQuickOption = () => {
    if (!navigator.geolocation) return setError('Geolocation not supported');
    setDetecting(true); setActiveOption('quick');
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        try {
          const r = await api.get('/maps/reverse-geocode', { params: { lat, lng } });
          const addr = r.data.data.shortAddress;
          setSourceCoords({ lat, lng, address: addr }); setForm(f => ({ ...f, sourceLandmark: addr }));
        } catch { setSourceCoords({ lat, lng, address: 'Current Location' }); setForm(f => ({ ...f, sourceLandmark: 'Current Location' })); }
        setDetecting(false);
      },
      () => { setError('Location access denied'); setDetecting(false); setActiveOption(null); },
      { enableHighAccuracy: true }
    );
  };

  const handleChange = e => { const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value; setForm({ ...form, [e.target.name]: v }); };
  const handleSourceChange = loc => { setSourceCoords(loc); setForm(f => ({ ...f, sourceLandmark: loc.address })); };
  const handleDestChange = loc => { setDestCoords(loc); setForm(f => ({ ...f, destinationLandmark: loc.address })); };

  const handleSubmit = async e => {
    if (e) e.preventDefault();
    if (activeOption === 'manual' && form.sourceLandmark === form.destinationLandmark) return setError('Source and destination cannot be the same');
    if (activeOption === 'manual' && (!sourceCoords || !destCoords)) return setError('Please select both pickup and destination');
    if (!form.baseTotalRideFare && activeOption === 'manual') return setError('Please set the trip fare');
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/rides', { ...form, sourceCoords: sourceCoords ? { lat: sourceCoords.lat, lng: sourceCoords.lng, address: sourceCoords.address } : undefined, destCoords: destCoords ? { lat: destCoords.lat, lng: destCoords.lng, address: destCoords.address } : undefined, sourceLandmark: sourceCoords?.address || 'Current Location', destinationLandmark: destCoords?.address || 'Nearby / Broadcast', farePerSeat: form.baseTotalRideFare || 100, baseTotalRideFare: form.baseTotalRideFare || 100 });
      setSuccess('Ride posted! Waiting for acceptance...');
      setTimeout(() => navigate('/my-rides'), 1500);
    } catch (err) { setError(err.response?.data?.message || 'Failed to post ride'); setLoading(false); }
  };

  /* Option cards */
  const OPTIONS = [
    { key: 'quick',  icon: '📡', iconBg: 'var(--coral-pale)', title: 'Quick Post from My Location', desc: 'Share your current coordinates and wait for nearby ride requests.', onClick: handleQuickOption },
    { key: 'manual', icon: '📍', iconBg: 'var(--cream-dark)',  title: 'Plan a Custom Route',         desc: 'Select a specific pickup and destination point manually.',          onClick: () => setActiveOption('manual') },
    { key: 'driver', icon: '🛺', iconBg: 'linear-gradient(135deg,#074D2A22,#1066340A)', title: 'Driver Hub — On-Demand Rides', desc: 'Go online, pick your vehicle type, and accept ride requests in real time.', onClick: () => setActiveOption('driver'), highlight: true },
  ];

  return (
    <div className="page-wrapper">
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(20px) translateX(-50%)} to{opacity:1;transform:translateY(0) translateX(-50%)} }
        .option-card:hover { transform: translateY(-4px) !important; box-shadow: var(--shadow-md) !important; }
      `}</style>

      <div style={{ marginBottom: 28 }}>
        <button onClick={() => activeOption ? resetOptions() : navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, padding: 0, marginBottom: 16 }}>
          ← {activeOption ? 'Change Method' : 'Back'}
        </button>
        <h2 style={{ fontSize: 26, letterSpacing: '-0.02em' }}>Post a Ride</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Choose how you want to share your journey</p>
      </div>

      {/* ── Option selector ── */}
      {!activeOption && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {OPTIONS.map(opt => (
            <div key={opt.key} onClick={opt.onClick} className="card option-card" style={{
              cursor: 'pointer', padding: 22, textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 18,
              transition: 'transform .2s, box-shadow .2s',
              border: opt.highlight ? '2px solid var(--success)' : '1px solid var(--border)',
              background: opt.highlight ? 'linear-gradient(135deg,var(--card-bg) 80%,#ECFDF5)' : 'var(--card-bg)',
            }}>
              <div style={{ width: 54, height: 54, borderRadius: 14, background: opt.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{opt.icon}</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {opt.title}
                  {opt.highlight && <span style={{ fontSize: 10, background: '#10B981', color: '#fff', padding: '2px 8px', borderRadius: 20, fontWeight: 700, letterSpacing: '.04em' }}>NEW</span>}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.4 }}>{opt.desc}</p>
              </div>
              <span style={{ color: 'var(--muted)', fontSize: 18 }}>›</span>
            </div>
          ))}

          {savedRoutes.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>Your Saved Routes</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {savedRoutes.map(route => (
                  <div key={route._id} className="route-chip" onClick={() => { setSourceCoords({ lat: route.sourceCoords.lat, lng: route.sourceCoords.lng, address: route.sourceLandmark }); setDestCoords({ lat: route.destCoords.lat, lng: route.destCoords.lng, address: route.destinationLandmark }); setForm(f => ({ ...f, sourceLandmark: route.sourceLandmark, destinationLandmark: route.destinationLandmark })); setActiveOption('manual'); }}>
                    ⭐ {route.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentRides.length > 0 && (
            <div className="return-trip-banner" style={{ marginTop: 12 }} onClick={() => { const l = recentRides[0]; setSourceCoords({ lat: l.destCoords.lat, lng: l.destCoords.lng, address: l.destinationLandmark }); setDestCoords({ lat: l.sourceCoords.lat, lng: l.sourceCoords.lng, address: l.sourceLandmark }); setForm(f => ({ ...f, sourceLandmark: l.destinationLandmark, destinationLandmark: l.sourceLandmark })); setActiveOption('manual'); }}>
              <div style={{ fontSize: 24 }}>🔄</div>
              <div><p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Plan your return trip?</p><p style={{ fontSize: 12, opacity: .8, margin: 0 }}>Reversed route based on your last ride.</p></div>
            </div>
          )}
        </div>
      )}

      {/* ── Driver Hub Panel ── */}
      {activeOption === 'driver' && (
        <div className="card" style={{ padding: '24px 20px' }}>
          <DriverHubPanel />
        </div>
      )}

      {/* ── Pool ride form (quick / manual) ── */}
      {(activeOption === 'quick' || activeOption === 'manual') && (
        <div className="card">
          {error   && <div className="alert-error">{error}</div>}
          {success && <div className="alert-success">{success}</div>}
          <form onSubmit={handleSubmit}>
            {activeOption === 'quick' ? (
              <div style={{ marginBottom: 24 }}>
                <div style={{ padding: '12px 16px', background: 'var(--coral-pale)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--coral)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>📍</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--coral)' }}>Current Pickup</p>
                    <p style={{ fontSize: 14, fontWeight: 500 }}>{detecting ? 'Detecting your location...' : (sourceCoords?.address || 'Detecting...')}</p>
                  </div>
                </div>
                <div style={{ padding: 16, background: 'var(--cream)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)', textAlign: 'center' }}>
                  <p style={{ fontSize: 14, color: 'var(--charcoal)', fontWeight: 500 }}>Broadcast visibility active</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Your live location is shared. You will be notified of nearby passengers.</p>
                </div>
              </div>
            ) : (
              <>
                <LocationPicker value={sourceCoords} onChange={handleSourceChange} label="Pickup Location" mode="pickup" />
                <div style={{ textAlign: 'center', margin: '0 0 10px', color: 'var(--border)', fontSize: 20 }}>↓</div>
                <LocationPicker value={destCoords} onChange={handleDestChange} label="Destination" mode="dropoff" />
              </>
            )}

            {sourceCoords?.lat && destCoords?.lat && (
              <div style={{ marginBottom: 20 }}><RouteMap sourceCoords={sourceCoords} destCoords={destCoords} height={180} /></div>
            )}

            <hr className="divider" />

            {sourceCoords?.lat && destCoords?.lat ? (
              <>
                <div className="field">
                  <label>System Total Fare Recommendation</label>
                  <FareEstimator sourceCoords={sourceCoords} destCoords={destCoords} onFareSelect={fare => setForm(f => ({ ...f, baseTotalRideFare: fare * 4, farePerSeat: fare * 4 }))} />
                </div>
                <div className="field">
                  <label>Total Trip Cost to be shared (₹)</label>
                  <input type="number" name="baseTotalRideFare" value={form.baseTotalRideFare} onChange={handleChange} placeholder="Set the total fare for this trip" required min={1} />
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>This cost will be split equally among all confirmed passengers.</p>
                  <button type="button" onClick={handleSaveRoute} style={{ marginTop: 10, background: 'none', border: 'none', color: 'var(--coral)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>⭐ Save this route for later</button>
                </div>
              </>
            ) : activeOption === 'manual' ? (
              <div style={{ padding: 16, textAlign: 'center', background: 'var(--cream)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)', marginBottom: 18 }}>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>Select destination to calculate fare</p>
              </div>
            ) : null}

            <div className="field">
              <label>Available Seats</label>
              <select name="totalSeats" value={form.totalSeats} onChange={handleChange}>
                {[1,2,3,4].map(n => <option key={n} value={n}>{n} seat{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>

            <div style={{ padding: '14px 16px', background: 'var(--cream)', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 500, fontSize: 14 }}>Female passengers only</p>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Limit requests to female riders</p>
              </div>
              <label style={{ position: 'relative', width: 44, height: 24, cursor: 'pointer' }}>
                <input type="checkbox" name="femaleOnly" checked={form.femaleOnly} onChange={handleChange} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', inset: 0, background: form.femaleOnly ? 'var(--coral)' : 'var(--border)', borderRadius: 12, transition: 'background .2s' }} />
                <span style={{ position: 'absolute', top: 3, left: form.femaleOnly ? 23 : 3, width: 18, height: 18, background: 'white', borderRadius: '50%', transition: 'left .2s' }} />
              </label>
            </div>

            <button type="submit" className="btn-primary" disabled={loading || !sourceCoords || (activeOption === 'manual' && !destCoords) || !!success} style={{ marginTop: 24 }}>
              {loading ? 'Posting...' : 'Post Ride Now'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
