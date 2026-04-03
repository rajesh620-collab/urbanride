import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { getSocket } from '../hooks/useWebSocket';

const VEHICLES = {
  bike: { label: 'Bike', icon: '/assets/bike.png' },
  auto: { label: 'Auto', icon: '/assets/auto.png' },
  car:  { label: 'Cab',  icon: '/assets/car.png' },
};

export default function WaitingScreen() {
  const { poolId } = useParams();
  const navigate = useNavigate();
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPool = useCallback(async () => {
    try {
      const r = await api.get(`/pools/${poolId}`);
      setPool(r.data.data);
    } catch {
      navigate('/post-ride');
    } finally {
      setLoading(false);
    }
  }, [poolId, navigate]);

  useEffect(() => {
    fetchPool();
    const s = getSocket();
    if (s) {
      s.on('pool_joined', fetchPool);
      s.on('status_updated', fetchPool);
      s.on('driver_assigned', fetchPool);
    }
    return () => {
      if (s) {
        s.off('pool_joined');
        s.off('status_updated');
        s.off('driver_assigned');
      }
    };
  }, [fetchPool]);

  if (loading) return <div className="page-wrapper"><div className="loader" /></div>;
  if (!pool) return null;

  const v = VEHICLES[pool.vehicleType] || VEHICLES.auto;
  const progress = (pool.members.length / pool.maxParticipants) * 100;

  return (
    <div className="page-wrapper" style={{ paddingBottom: 60 }}>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
         <div style={{ width: 120, height: 120, margin: '0 auto 20px', position: 'relative' }}>
            <img src={v.icon} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="vehicle" />
            <div className="pulse-ring" style={{ position: 'absolute', inset: -10, border: '3px solid var(--coral)', borderRadius: '50%', animation: 'ripple 2s infinite' }} />
         </div>
         <h2 style={{ fontSize: 24, fontWeight: 800 }}>{pool.status === 'waiting' ? 'Waiting for passengers...' : pool.status === 'finding_driver' ? 'Finding a driver...' : 'Driver Assigned!'}</h2>
         <p style={{ color: 'var(--muted)', marginTop: 8 }}>{pool.sourceCoords.address?.split(',')[0]} → {pool.destCoords.address?.split(',')[0]}</p>
         
         {pool.departureTime && (
           <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--coral)', fontWeight: 700, fontSize: 13, background: 'var(--coral-pale)', padding: '6px 14px', borderRadius: 20, animation: 'slideIn 0.3s' }}>
             <span>🕒 {new Date(pool.departureTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {new Date(pool.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
           </div>
         )}
      </div>

      <div className="card" style={{ padding: 24, borderRadius: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
           <span style={{ fontWeight: 700, fontSize: 14 }}>Pool Progress</span>
           <span style={{ fontWeight: 800, color: 'var(--coral)' }}>{pool.members.length} / {pool.maxParticipants}</span>
        </div>
        <div style={{ height: 12, background: 'var(--cream-dark)', borderRadius: 10, overflow: 'hidden' }}>
           <div style={{ height: '100%', width: `${progress}%`, background: 'var(--coral)', transition: 'width 0.5s ease-out' }} />
        </div>
        
        <div style={{ marginTop: 24 }}>
           <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>Passengers</p>
           <div style={{ display: 'flex', gap: 10 }}>
              {pool.members.map((m, i) => (
                <div key={i} title={m.user?.name} style={{ width: 44, height: 44, background: 'var(--coral-pale)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                   <span style={{ fontWeight: 700, color: 'var(--coral)', fontSize: 14 }}>{m.user?.name?.[0]?.toUpperCase() || 'P'}</span>
                </div>
              ))}
              {[...Array(pool.maxParticipants - pool.members.length)].map((_, i) => (
                <div key={i} style={{ width: 44, height: 44, background: 'var(--cream)', borderRadius: '50%', border: '2px dashed var(--border)' }} />
              ))}
           </div>
        </div>
      </div>

      {pool.status === 'driver_assigned' && (
        <div className="card" style={{ padding: 20, borderRadius: 24, border: '2px solid #10B981', animation: 'slideIn 0.4s' }}>
           <p style={{ fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', marginBottom: 12 }}>Driver Confirmed</p>
           <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, background: '#10B98118', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👨🏻‍✈️</div>
              <div style={{ flex: 1 }}>
                 <p style={{ fontWeight: 800, fontSize: 16 }}>{pool.driverInfo?.name || 'Driver'}</p>
                 <p style={{ fontSize: 12, color: 'var(--muted)' }}>{pool.driverInfo?.vehicleNumber}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                 <p style={{ fontSize: 11, color: 'var(--muted)' }}>Your Fare</p>
                 <p style={{ fontWeight: 800, fontSize: 18, color: '#10B981' }}>₹{Math.round(pool.totalFare / pool.members.length)}</p>
              </div>
           </div>
           
           <div style={{ marginTop: 20, background: '#F0FDF4', padding: '14px 18px', borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>Your Pickup OTP</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#059669', letterSpacing: 4 }}>{pool.otp}</span>
           </div>
        </div>
      )}

      {pool.status === 'waiting' && pool.members.length < pool.minParticipants && (
         <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 20, fontStyle: 'italic' }}>
            Looking for 1 more person to start finding a driver...
         </p>
      )}

      <button onClick={() => navigate('/my-rides')} style={{ width: '100%', marginTop: 30, padding: 16, background: 'var(--cream)', border: 'none', borderRadius: 16, fontWeight: 700, color: 'var(--charcoal)', cursor: 'pointer' }}>Close Waiting Screen</button>

      <style>{`
        @keyframes ripple { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.4); opacity: 0; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } }
      `}</style>
    </div>
  );
}
