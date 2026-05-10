import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import LocationPicker from '../components/LocationPicker';
import FareEstimator from '../components/FareEstimator';
import RouteMap from '../components/RouteMap';
import { getSocket } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';

/* ── Constants ─────────────────────────────────────── */
const VEHICLES = [
  { key: 'bike', label: 'Bike',  subtext: 'Bike Taxi & Delivery', icon: '/assets/bike.png', color: '#F59E0B' },
  { key: 'auto', label: 'Auto',  subtext: 'Auto Lite, etc',       icon: '/assets/auto.png', color: '#F59E0B' },
  { key: 'car',  label: 'Cab',   subtext: 'Airport Cabs, etc',   icon: '/assets/cab.png',  color: '#F59E0B' },
];

const STATUS_META = {
  accepted:    { label: 'Ride Accepted',       color: '#3B82F6' },
  arrived:     { label: 'Arrived at Pickup',   color: '#8B5CF6' },
  in_progress: { label: 'Ride In Progress',    color: '#EF4444' },
  completed:   { label: 'Completed',           color: '#10B981' },
};

function fmtFare(n) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0); }

function EarningsChart({ data, title }) {
  // If no data, show a placeholder with zeros to keep the UI consistent
  const hasData = data && data.length > 0;
  const chartData = hasData ? data : [
    { label: '...', earnings: 0 }, { label: '...', earnings: 0 }, { label: '...', earnings: 0 },
    { label: '...', earnings: 0 }, { label: '...', earnings: 0 }, { label: '...', earnings: 0 }, { label: '...' }
  ];

  const maxVal = Math.max(...chartData.map(d => d.earnings || 0), 100) * 1.2;
  const width = 340; const height = 140; const padding = 30;
  
  const showAllLabels = chartData.length <= 12;
  const labelInterval = Math.ceil(chartData.length / 7);

  const points = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * (width - padding * 2) + padding;
    const y = height - (((d.earnings || 0) / maxVal) * (height - padding * 2) + padding);
    return { x, y };
  });

  const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length-1].x} ${height - 10} L ${points[0].x} ${height - 10} Z`;

  return (
    <div className="earnings-chart-container" style={{ marginTop: 20, background: 'var(--white)', borderRadius: 24, padding: '24px 20px', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)', position: 'relative', minHeight: 180 }}>
      {!hasData && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(1px)', zIndex: 1, borderRadius: 24 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', background: 'var(--cream)', padding: '4px 10px', borderRadius: 8, border: '1.5px solid var(--border)', textAlign: 'center' }}>No activity found</p>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--coral)' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>Earnings</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible', opacity: hasData ? 1 : 0.4 }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--coral)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--coral)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Y-Axis Grid */}
        {[0, 0.5, 1].map(v => {
          const y = padding + v * (height - padding * 2);
          return (
            <g key={v}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
              <text x={padding - 5} y={y + 3} fontSize="8" fill="var(--muted)" textAnchor="end">{fmtFare(maxVal * (1 - v))}</text>
            </g>
          );
        })}

        <path d={areaD} fill="url(#chartGrad)" />
        <path d={pathD} fill="none" stroke="var(--coral)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 6px 8px rgba(229,90,63,0.25))' }} />
        
        {points.map((p, i) => {
          const shouldShowLabel = showAllLabels || (i % labelInterval === 0) || (i === chartData.length - 1);
          return (
            <g key={i} className="chart-point" style={{ cursor: 'pointer' }}>
              <circle cx={p.x} cy={p.y} r={chartData.length > 20 ? 2 : 4} fill="var(--white)" stroke="var(--coral)" strokeWidth={chartData.length > 20 ? 1.5 : 2.5} />
              {shouldShowLabel && (
                <text x={p.x} y={height + 5} fontSize="8" fontWeight="700" fill="var(--muted)" textAnchor="middle">{chartData[i].label}</text>
              )}
              {chartData[i].earnings > 0 && (
                 <g className="point-label">
                   <rect x={p.x - 25} y={p.y - 24} width="50" height="16" rx="4" fill="var(--charcoal)" />
                   <text x={p.x} y={p.y - 13} fontSize="8" fontWeight="800" fill="var(--white)" textAnchor="middle">{fmtFare(chartData[i].earnings)}</text>
                 </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

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

function VehiclePicker({ onSelect }) {
  return (
    <div style={{ marginBottom: 24, maxWidth: 460, margin: '0 auto 24px' }}>
      <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--charcoal)', marginBottom: 24, textAlign: 'left', letterSpacing: '-0.5px' }}>
        Select your vehicle
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {VEHICLES.map(v => (
          <button key={v.key} onClick={() => onSelect(v.key)} className="vehicle-card-item" style={{
            width: '100%', padding: '14px 22px', border: `2px solid var(--border)`,
            borderRadius: 24, background: 'var(--card-bg)',
            cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 20, textAlign: 'left',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            position: 'relative'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--charcoal)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; }}
          >
            {/* 3D Vehicle Image */}
            <div style={{ width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src={v.icon} alt={v.label} style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
            </div>

            {/* Labels */}
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, fontSize: 19, color: 'var(--charcoal)', margin: 0 }}>{v.label}</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, fontWeight: 500 }}>{v.subtext}</p>
            </div>

            {/* Radio Circle */}
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              border: `2px solid #CBD5E1`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} />
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
          {isOnline ? `${v?.icon === '/assets/bike.png' ? '🏍️' : v?.icon === '/assets/auto.png' ? '🛺' : '🚗'} ${v?.label} · Accepting rides` : 'Tap to go online & start earning'}
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
          <img src={v.icon} alt={v.label} style={{ width: 42, height: 42, objectFit: 'contain' }} />
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
        <button onClick={() => onAccept(ride._id, ride.isPool)} disabled={acting || countdown === 0} style={{
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
  const v = VEHICLES.find(x => x.key === ride.vehicleType);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={v?.icon} alt="vehicle" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: meta.color }}>{meta.label}</p>
            <p style={{ fontSize: 13, fontWeight: 600 }}>{ride.pickupAddress?.split(',')[0]} → {ride.dropAddress?.split(',')[0]}</p>
          </div>
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
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--cream-dark)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--coral)', marginBottom: 10, textTransform: 'uppercase' }}>🔐 Enter Passenger OTP</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10 }}>
            {otp.map((d, i) => (
              <input key={i} ref={refs[i]} type="tel" inputMode="numeric" maxLength={1} value={d}
                onChange={e => handleOtp(i, e.target.value)} onKeyDown={e => handleKey(i, e)}
                style={{
                  width: 52, height: 58, textAlign: 'center', fontSize: 22, fontWeight: 800,
                  border: `2px solid ${otpErr ? 'var(--error)' : d ? 'var(--coral)' : 'var(--border)'}`,
                  borderRadius: 12, background: 'var(--white)',
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
            padding: '12px 16px', background: 'var(--cream-dark)', color: 'var(--muted)',
            border: '1.5px solid var(--border)', borderRadius: 10, fontWeight: 600, fontSize: 13,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
        )}
      </div>
    </div>
  );
}

/* ── Main PostRide Page ──────────────────────────────────────────── */
export default function PostRide() {
  const navigate = useNavigate();
  const [vehicleType, setVehicleType] = useState('auto');
  const [step, setStep]               = useState(1); // 1: Vehicle picker, 2: Hub/Form
  const [activeMode, setActiveMode]   = useState('driver'); // 'driver' | 'manual'
  const [tab, setTab]                 = useState('ride');

  // Logic States
  const [isOnline, setIsOnline]     = useState(false);
  const [incomingRides, setIncoming] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [earnings, setEarnings]     = useState(null);
  const [acting, setActing]         = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [toast, setToast]           = useState({ msg: '', type: 'info' });
  const [dailyTarget, setDailyTarget] = useState(() => Number(localStorage.getItem('urbanride_daily_target')) || 1000);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [chartRange, setChartRange] = useState('weekly'); // 'daily' | 'weekly' | 'monthly'

  // Manual Form State
  const [form, setForm] = useState({ totalSeats: 4, baseTotalRideFare: 0, femaleOnly: false });
  const { user } = useAuth();
  const [sourceCoords, setSourceCoords] = useState(null);
  const [destCoords, setDestCoords]     = useState(null);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [loading, setLoading]           = useState(false);
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [departureTime, setDepartureTime] = useState(new Date(Date.now() + 30 * 60000).toTimeString().slice(0,5));
  const [savedRoutes, setSavedRoutes]   = useState([]);

  const pollRef = useRef(null);
  const showToast = (msg, type = 'info') => setToast({ msg, type });

  const [nearbyPools, setNearbyPools] = useState([]);

  useEffect(() => {
    api.get('/saved-routes').then(r => setSavedRoutes(r.data.data?.routes || []));
    loadEarnings();
    loadRides();
  }, []);

  const loadNearbyPools = useCallback(async (coords) => {
    if (!coords) return;
    try {
      const r = await api.get(`/pools/search?lat=${coords.lat}&lng=${coords.lng}`);
      setNearbyPools(r.data.data?.pools || []);
    } catch {}
  }, []);

  useEffect(() => { loadNearbyPools(sourceCoords); }, [sourceCoords, loadNearbyPools]);

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

  const handleAccept = async (id, isPool) => {
    setActing(true);
    try {
      const endpoint = isPool ? `/pools/${id}/accept` : `/driver-rides/${id}/accept`;
      const r = await api.patch(endpoint);
      const rideData = isPool ? r.data.data : r.data.data?.ride;
      setActiveRide(rideData); setIncoming([]);
      showToast(`Accepted! OTP: ${isPool ? rideData.otp : r.data.data?.otp}`, 'success');
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
  
  const handleUpdateTarget = (val) => {
    const num = Number(val);
    if (isNaN(num) || num <= 0) return;
    setDailyTarget(num);
    localStorage.setItem('urbanride_daily_target', num);
    setIsEditingTarget(false);
    showToast(`Target updated to ${fmtFare(num)}`, 'success');
  };

  const handleManualSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!sourceCoords || !destCoords) return setError('Select both locations');
    if (sourceCoords.lat === destCoords.lat && sourceCoords.lng === destCoords.lng) {
      return setError('No two locations can be the same');
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      const schedule = new Date(`${departureDate}T${departureTime}`);
      const r = await api.post('/pools/create', { 
        vehicleType, 
        sourceCoords: { lat: sourceCoords.lat, lng: sourceCoords.lng, address: sourceCoords.address }, 
        destCoords: { lat: destCoords.lat, lng: destCoords.lng, address: destCoords.address },
        distanceKm: 5, durationMin: 15,
        departureTime: schedule.toISOString(),
        femaleOnly: form.femaleOnly
      });
      setSuccess('Pool created! Redirecting to waiting room...');
      setTimeout(() => navigate(`/waiting/${r.data.data._id}`), 1200);
    } catch (err) { setError(err.response?.data?.message || 'Failed to create pool'); setLoading(false); }
  };

  const handleJoinPool = async (pid) => {
    setLoading(true);
    try {
      await api.post(`/pools/${pid}/join`);
      navigate(`/waiting/${pid}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to join', 'error');
      setLoading(false);
    }
  };

  const selectedV = VEHICLES.find(v => v.key === vehicleType);

  return (
    <div className="page-wrapper" style={{ paddingBottom: 100 }}>
      <style>{`
        @keyframes dotPulse { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.5)} 50%{box-shadow:0 0 0 6px rgba(74,222,128,0)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUpToast { from{opacity:0;transform:translateY(24px) translateX(-50%)} to{opacity:1;transform:translateY(0) translateX(-50%)} }
      `}</style>
      
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => step === 2 ? setStep(1) : navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
          ← {step === 2 ? 'Back to Selection' : 'Back to Map'}
        </button>
      </div>

      {step === 1 ? (
        /* ── STEP 1: VEHICLE PICKER ── */
        <VehiclePicker onSelect={(v) => { setVehicleType(v); setStep(2); }} />
      ) : (
        /* ── STEP 2: ACTIVE HUB / FORM ── */
        <div style={{ animation: 'slideIn 0.3s ease-out' }}>
          
          {/* Chosen Vehicle Summary Bar */}
          <div style={{
            background: 'var(--white)', padding: '16px 20px', borderRadius: 20, marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 16, border: '1.5px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <img src={selectedV?.icon} style={{ width: 64, height: 64, objectFit: 'contain' }} alt="vehicle" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Active Vehicle</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--charcoal)' }}>{selectedV?.label}</p>
            </div>
            <button onClick={() => setStep(1)} style={{ background: 'var(--cream)', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, color: 'var(--charcoal)', cursor: 'pointer' }}>Change</button>
          </div>

          <div className="card" style={{ padding: '24px 20px', borderRadius: 24 }}>
             {/* Tab Switcher */}
             <div style={{ display: 'flex', gap: 6, background: 'var(--cream-dark)', padding: 4, borderRadius: 14, width: 'fit-content', marginBottom: 24 }}>
                {[{ k: 'driver', lbl: '🛺 Active Hub' }, { k: 'manual', lbl: '📍 Plan Route' }].map(m => (
                  <button key={m.k} onClick={() => setActiveMode(m.k)} style={{
                    padding: '10px 18px', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    background: activeMode === m.k ? 'var(--white)' : 'transparent',
                    color: activeMode === m.k ? 'var(--charcoal)' : 'var(--muted)',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.25s',
                    boxShadow: activeMode === m.k ? 'var(--shadow-sm)' : 'none',
                  }}>{m.lbl}</button>
                ))}
             </div>

             {activeMode === 'driver' ? (
                /* Driver Hub View */
                <>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                    {['ride', 'earnings'].map(t => (
                      <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: 8, border: 'none', background: tab === t ? 'var(--coral-pale)' : 'transparent', color: tab === t ? 'var(--coral)' : 'var(--muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', borderRadius: 8 }}>
                        {t === 'ride' ? 'Ride' : 'Earnings'}
                      </button>
                    ))}
                  </div>
                  {tab === 'ride' ? (
                    <>
                      <OnlineBar isOnline={isOnline} onToggle={() => setIsOnline(!isOnline)} vehicleType={vehicleType} />
                      {activeRide ? (
                        <ActiveRidePanel ride={activeRide} onArrived={handleArrived} onVerifyOTP={handleVerifyOTP} onComplete={handleComplete} onCancel={handleCancel} acting={acting} />
                      ) : (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                             <p style={{ fontSize: 12, fontWeight: 800 }}>Requests Nearby</p>
                             <button onClick={handleSimulate} disabled={!isOnline || simulating} style={{ background: 'var(--coral)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Simulate</button>
                          </div>
                          {incomingRides.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--cream)', borderRadius: 20, border: '1.5px dashed var(--border)' }}>
                               <p style={{ fontSize: 40, marginBottom: 12 }}>{isOnline ? '📡' : '🏁'}</p>
                               <p style={{ fontWeight: 800 }}>{isOnline ? 'Searching for rides...' : 'Ready to Earn?'}</p>
                            </div>
                          ) : incomingRides.map(r => <RequestCard key={r._id} ride={r} onAccept={handleAccept} onReject={handleReject} acting={acting} />)}
                        </>
                      )}
                    </>
                  ) : (
                    <div style={{ animation: 'slideIn 0.35s ease' }}>
                        {/* Daily Progress Card */}
                        <div style={{ 
                          background: 'linear-gradient(135deg,#1C1917,#292524)', 
                          borderRadius: 24, padding: '24px 20px', marginBottom: 16,
                          display: 'flex', alignItems: 'center', gap: 20,
                          boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                          position: 'relative', overflow: 'hidden'
                        }}>
                           <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
                           
                           {/* Progress Ring */}
                           <div style={{ position: 'relative', width: 72, height: 72 }}>
                             <svg width="72" height="72" viewBox="0 0 72 72">
                               <circle cx="36" cy="36" r="32" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                               <circle cx="36" cy="36" r="32" fill="none" stroke="#4ADE80" strokeWidth="6" 
                                 strokeDasharray={201} 
                                 strokeDashoffset={201 - (Math.min(earnings?.todayEarnings || 0, dailyTarget) / dailyTarget) * 201}
                                 strokeLinecap="round" transform="rotate(-90 36 36)"
                                 style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                               />
                             </svg>
                             <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#4ADE80' }}>
                               {Math.round((Math.min(earnings?.todayEarnings || 0, dailyTarget) / dailyTarget) * 100)}%
                             </div>
                           </div>

                           <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>Daily Target</p>
                              <p style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginTop: 4 }}>{fmtFare(earnings?.todayEarnings)}</p>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                {isEditingTarget ? (
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <input 
                                      autoFocus
                                      type="number" 
                                      defaultValue={dailyTarget}
                                      onBlur={(e) => handleUpdateTarget(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateTarget(e.target.value)}
                                      style={{ width: 80, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, color: '#fff', padding: '2px 6px', fontSize: 11, fontWeight: 700 }}
                                    />
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => setIsEditingTarget(true)}
                                    style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                                  >
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Goal: {fmtFare(dailyTarget)}</p>
                                    <span style={{ fontSize: 10, color: 'var(--coral)', fontWeight: 800 }}>✎ Edit</span>
                                  </button>
                                )}
                              </div>
                           </div>
                        </div>

                        {/* Grid Stats */}
                        <div className="grid-2" style={{ marginBottom: 16 }}>
                           <div style={{ background: 'var(--white)', padding: '20px', borderRadius: 20, border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                              <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Rides</p>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                                <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--charcoal)' }}>{earnings?.totalRides || 0}</p>
                                <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 700 }}>+12%</span>
                              </div>
                           </div>
                           <div style={{ background: 'var(--white)', padding: '20px', borderRadius: 20, border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                              <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lifetime</p>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                                <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--coral)' }}>{fmtFare(earnings?.totalEarnings)}</p>
                              </div>
                           </div>
                        </div>

                        {/* Activity Range Toggle */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                          {['daily', 'weekly', 'monthly'].map(r => (
                            <button key={r} onClick={() => setChartRange(r)} style={{
                              flex: 1, padding: '6px 0', border: 'none', borderRadius: 8,
                              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                              background: chartRange === r ? 'var(--charcoal)' : 'var(--cream-dark)',
                              color: chartRange === r ? 'var(--white)' : 'var(--muted)',
                              cursor: 'pointer', transition: 'all 0.2s'
                            }}>
                              {r}
                            </button>
                          ))}
                        </div>

                        {/* Earnings Graph */}
                        <EarningsChart 
                          title={`${chartRange} Activity`} 
                          data={earnings?.[`${chartRange}Activity`]} 
                        />
                    </div>
                  )}
                </>
             ) : (
                /* Manual Pool Form */
                <form onSubmit={handleManualSubmit}>
                  {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}
                  <LocationPicker value={sourceCoords} onChange={setSourceCoords} label="Pickup Location" mode="pickup" />
                  <div style={{ height: 24, marginLeft: 22, borderLeft: '2px dashed var(--border)' }} />
                  <LocationPicker value={destCoords} onChange={setDestCoords} label="Destination" mode="dropoff" />
                  
                  {sourceCoords && destCoords && (
                    <div style={{ marginTop: 20 }}>
                       <RouteMap sourceCoords={sourceCoords} destCoords={destCoords} height={180} />
                       <div style={{ marginTop: 18 }}>
                         <label style={{ fontSize: 12, fontWeight: 800, display: 'block', marginBottom: 8 }}>Estimated Fare Recommendation</label>
                         <FareEstimator sourceCoords={sourceCoords} destCoords={destCoords} onFareSelect={f => setForm(p => ({ ...p, baseTotalRideFare: f * 4 }))} />
                         <input type="number" value={form.baseTotalRideFare} onChange={e => setForm({...form, baseTotalRideFare: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid var(--border)', marginTop: 12, fontWeight: 700 }} placeholder="Set trip cost" />
                       </div>
                    </div>
                  )}

                  {/* iOS Style Date & Time Selection */}
                  <div style={{ marginTop: 24 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 12, display: 'block' }}>Departure Schedule</label>
                    
                    {/* Date Scroller */}
                    <div style={{ 
                      display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, 
                      msOverflowStyle: 'none', scrollbarWidth: 'none' 
                    }}>
                      {(() => {
                        const days = [];
                        for(let i=0; i<7; i++) {
                          const d = new Date(); d.setDate(d.getDate() + i);
                          days.push({
                            full: d.toISOString().split('T')[0],
                            day: d.toLocaleDateString('en-US', { day: 'numeric' }),
                            weekday: i === 0 ? 'Today' : i === 1 ? 'Tmro' : d.toLocaleDateString('en-US', { weekday: 'short' })
                          });
                        }
                        return days.map(d => {
                          const isSelected = departureDate === d.full;
                          return (
                            <div key={d.full} 
                              onClick={() => setDepartureDate(d.full)}
                              style={{
                                minWidth: 64, height: 80, borderRadius: 18,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                background: isSelected ? 'var(--coral)' : 'var(--cream)',
                                color: isSelected ? '#fff' : 'var(--charcoal)',
                                cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                boxShadow: isSelected ? '0 8px 20px rgba(229,90,63,0.3)' : 'none',
                                border: `1.5px solid ${isSelected ? 'var(--coral)' : 'transparent'}`
                              }}
                            >
                              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, opacity: isSelected ? 0.9 : 0.6 }}>{d.weekday}</span>
                              <span style={{ fontSize: 20, fontWeight: 800 }}>{d.day}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* iOS Style Time Wheel Simulator */}
                    <div style={{ marginTop: 20 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 12, display: 'block' }}>Departure Time</label>
                      <div style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        gap: 12, background: 'var(--cream)', borderRadius: 24, padding: '20px 10px',
                        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.03)'
                      }}>
                        {/* Hour Selecor */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 60 }}>
                          <button type="button" onClick={() => {
                            const [h, m] = departureTime.split(':');
                            const next = (parseInt(h) + 1) % 24;
                            setDepartureTime(`${next.toString().padStart(2,'0')}:${m}`);
                          }} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--coral)', cursor: 'pointer', padding: 4 }}>▲</button>
                          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--charcoal)', fontFamily: 'inherit' }}>{departureTime.split(':')[0]}</div>
                          <button type="button" onClick={() => {
                            const [h, m] = departureTime.split(':');
                            const next = (parseInt(h) - 1 + 24) % 24;
                            setDepartureTime(`${next.toString().padStart(2,'0')}:${m}`);
                          }} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--coral)', cursor: 'pointer', padding: 4 }}>▼</button>
                        </div>

                        <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--muted)', marginTop: -4 }}>:</div>

                        {/* Minute Selector */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 60 }}>
                          <button type="button" onClick={() => {
                            const [h, m] = departureTime.split(':');
                            const next = (parseInt(m) + 5) % 60;
                            setDepartureTime(`${h}:${next.toString().padStart(2,'0')}`);
                          }} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--coral)', cursor: 'pointer', padding: 4 }}>▲</button>
                          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--charcoal)', fontFamily: 'inherit' }}>{departureTime.split(':')[1]}</div>
                          <button type="button" onClick={() => {
                            const [h, m] = departureTime.split(':');
                            const next = (parseInt(m) - 5 + 60) % 60;
                            setDepartureTime(`${h}:${next.toString().padStart(2,'0')}`);
                          }} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--coral)', cursor: 'pointer', padding: 4 }}>▼</button>
                        </div>

                        <button 
                          type="button"
                          onClick={() => {
                            const [h, m] = departureTime.split(':');
                            const hour = parseInt(h);
                            const nextHour = hour >= 12 ? hour - 12 : hour + 12;
                            setDepartureTime(`${nextHour.toString().padStart(2,'0')}:${m}`);
                          }}
                          style={{ 
                            marginLeft: 12, padding: '10px 16px', background: 'var(--coral)', 
                            borderRadius: 16, fontSize: 13, fontWeight: 800, color: '#fff', 
                            textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(229,90,63,0.3)',
                            border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          {parseInt(departureTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <label style={{ fontSize: 12, fontWeight: 800, display: 'block', marginBottom: 10 }}>Seats Available</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[1,2,3,4].map(n => (
                        <button key={n} type="button" onClick={() => setForm({...form, totalSeats: n})} style={{ flex: 1, padding: 10, borderRadius: 10, border: `2px solid ${form.totalSeats === n ? 'var(--coral)' : 'var(--border)'}`, background: form.totalSeats === n ? 'var(--coral-pale)' : 'transparent', color: form.totalSeats === n ? 'var(--coral)' : 'var(--muted)', fontWeight: 700, cursor: 'pointer' }}>{n}</button>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading || !sourceCoords || !destCoords} style={{ marginTop: 24, fontSize: 16 }}>{loading ? 'Processing...' : '🚀 Create New Pool'}</button>

                  {nearbyPools.length > 0 && (
                    <div style={{ marginTop: 32, animation: 'slideIn 0.4s' }}>
                       <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                          Nearby Active Pools
                       </h4>
                       {nearbyPools.map(p => (
                         <div key={p._id} className="card-soft" style={{ padding: 16, borderRadius: 18, marginBottom: 12, border: '1.5px solid var(--border)', background: 'var(--white)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ width: 36, height: 36, background: 'var(--coral-pale)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--coral)', border: '1px solid white' }}>{p.poolCode?.slice(-1)}</div>
                                  <div>
                                    <p style={{ fontWeight: 700, fontSize: 13 }}>{p.creator?.name}'s Pool</p>
                                    <p style={{ fontSize: 11, color: 'var(--muted)' }}>To: {p.destCoords?.address?.split(',')[0]}</p>
                                  </div>
                               </div>
                               <span style={{ fontSize: 11, fontWeight: 800, background: 'var(--cream)', padding: '4px 8px', borderRadius: 8, height: 'fit-content' }}>{p.members?.length}/{p.maxParticipants}</span>
                            </div>
                            <button type="button" onClick={() => handleJoinPool(p._id)} style={{ width: '100%', padding: '10px 0', borderRadius: 10, background: 'var(--charcoal)', color: 'white', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Join this Pool (Split Fare)</button>
                         </div>
                       ))}
                    </div>
                  )}
                </form>
             )}
          </div>
        </div>
      )}

      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'info' })} />
    </div>
  );
}
