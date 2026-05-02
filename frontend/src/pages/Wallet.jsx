import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';

const TOPUP_AMOUNTS = [100, 200, 500, 1000, 2000];

function Skeleton({ width = '100%', height = 16 }) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: 8, marginBottom: 8 }} />
  );
}

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topping, setTopping] = useState(false);
  const [customAmt, setCustomAmt] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchWallet = async () => {
    try {
      const res = await api.get('/wallet');
      setWallet(res.data.data);
    } catch (e) {
      setError('Could not load wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWallet(); }, []);

  const handleTopup = async (amount) => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError('Enter a valid amount');
    setError(''); setMsg(''); setTopping(true);
    try {
      const res = await api.post('/wallet/topup', { amount: amt });
      setMsg(`✓ ₹${amt} added to your wallet!`);
      setWallet(prev => ({ ...prev, balance: res.data.data.balance }));
      fetchWallet(); // refresh transactions
    } catch (e) {
      setError(e.response?.data?.message || 'Top-up failed');
    } finally {
      setTopping(false);
      setCustomAmt('');
    }
  };

  const txIcon = (type, desc) => {
    if (type === 'credit') return '💰';
    if (desc.toLowerCase().includes('ride')) return '🚕';
    if (desc.toLowerCase().includes('refund')) return '↩️';
    return '💳';
  };
  const txColor = (type) => type === 'credit' ? '#16A34A' : 'var(--charcoal)';

  return (
    <div className="page-wrapper" style={{ maxWidth: 540 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, letterSpacing: '-0.02em' }}>My Wallet</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
          Pay for rides instantly — no cash needed
        </p>
      </div>

      {loading ? (
        <>
          <div style={{ height: 160, borderRadius: 'var(--radius-lg)', background: 'var(--skeleton-bg)', animation: 'pulse 1.5s ease-in-out infinite', marginBottom: 24 }} />
          {[1,2,3].map(i => <Skeleton key={i} height={56} />)}
        </>
      ) : (
        <>
          {/* Balance Card */}
          <div className="wallet-balance-card">
            <p style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Available Balance
            </p>
            <p style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>
              ₹{wallet?.balance?.toLocaleString() || '0'}
            </p>
            <p style={{ fontSize: 12, opacity: 0.7 }}>UrbanRide Wallet</p>
          </div>

          {/* Top-up */}
          <div className="card" style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Add Money
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {TOPUP_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  onClick={() => handleTopup(amt)}
                  disabled={topping}
                  style={{
                    padding: '8px 16px', border: '1.5px solid var(--coral)',
                    borderRadius: 20, background: 'var(--coral-pale)',
                    color: 'var(--coral)', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    opacity: topping ? 0.6 : 1, transition: 'all 0.2s'
                  }}
                >
                  +₹{amt}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                value={customAmt}
                onChange={e => setCustomAmt(e.target.value)}
                placeholder="Custom amount"
                min="1" max="10000"
                style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', background: 'var(--input-bg)', fontSize: 14 }}
              />
              <button
                className="btn-primary"
                style={{ width: 'auto', padding: '10px 20px' }}
                onClick={() => handleTopup(customAmt)}
                disabled={topping || !customAmt}
              >
                {topping ? '...' : 'Add'}
              </button>
            </div>
            {msg && <p style={{ color: 'var(--success)', fontSize: 13, marginTop: 10, fontWeight: 500 }}>{msg}</p>}
            {error && <p style={{ color: 'var(--error)', fontSize: 13, marginTop: 10 }}>{error}</p>}
          </div>

          {/* Transaction History */}
          <div className="card">
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Transaction History
            </p>
            {(!wallet?.transactions || wallet.transactions.length === 0) ? (
              <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                No transactions yet
              </p>
            ) : (
              wallet.transactions.map((tx, i) => (
                <div key={i} className="transaction-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14,
                      background: tx.type === 'credit' ? 'rgba(22,163,74,0.1)' : 'var(--cream-dark)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, border: '1px solid var(--border)'
                    }}>
                      {txIcon(tx.type, tx.description)}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--charcoal)' }}>{tx.description}</p>
                      <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 800, fontSize: 16, color: txColor(tx.type), margin: 0 }}>
                      {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>Success</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
