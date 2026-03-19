import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';

export default function FareEstimator({
  sourceLandmark,
  destinationLandmark,
  sourceCoords,
  destCoords,
  onFareSelect
}) {
  const [fareData, setFareData] = useState(null);
  const [selectedFare, setSelectedFare] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    const fetchFare = async () => {
      setLoading(true);
      try {
        const body = {};
        if (sourceLandmark && destinationLandmark) {
          body.sourceLandmark = sourceLandmark;
          body.destinationLandmark = destinationLandmark;
        } else if (sourceCoords?.lat && destCoords?.lat) {
          body.sourceLat = sourceCoords.lat;
          body.sourceLng = sourceCoords.lng;
          body.destLat = destCoords.lat;
          body.destLng = destCoords.lng;
        } else {
          return;
        }

        const res = await api.post('/fare/estimate', body);
        const data = res.data.data;
        setFareData(data);
        setSelectedFare(data.suggestedFare);
        if (onFareSelect) onFareSelect(data.suggestedFare);
      } catch {
        setFareData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFare();
  }, [sourceLandmark, destinationLandmark, sourceCoords?.lat, destCoords?.lat]);

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value);
    setSelectedFare(val);
    if (onFareSelect) onFareSelect(val);
  };

  if (loading) {
    return (
      <div style={{
        padding: '16px', background: 'var(--cream)', borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)', textAlign: 'center', marginBottom: 18
      }}>
        <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, margin: '0 auto' }} />
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Calculating fare...</p>
      </div>
    );
  }

  if (!fareData) return null;

  const bd = fareData.breakdown;

  return (
    <div style={{
      padding: '20px', background: 'var(--cream)', borderRadius: 'var(--radius-md)',
      border: '1.5px solid var(--border)', marginBottom: 18
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <p style={{
            fontSize: 11, fontWeight: 500, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--coral)', marginBottom: 4
          }}>Smart Fare</p>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>AI-powered pricing</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--coral)' }}>
            ₹{selectedFare}
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted)', display: 'block' }}>per seat</span>
        </div>
      </div>

      {/* Fare slider */}
      <div style={{ marginBottom: 14 }}>
        <input
          type="range"
          min={fareData.minFare}
          max={fareData.maxFare}
          value={selectedFare}
          onChange={handleSliderChange}
          style={{
            width: '100%', accentColor: 'var(--coral)',
            height: 6, cursor: 'pointer'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)' }}>
          <span>Min ₹{fareData.minFare}</span>
          <span style={{ color: 'var(--coral)', fontWeight: 600 }}>
            Suggested ₹{fareData.suggestedFare}
          </span>
          <span>Max ₹{fareData.maxFare}</span>
        </div>
      </div>

      {/* Savings badge */}
      {fareData.savingsVsSolo > 0 && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#EDF6F0', color: '#166534', padding: '5px 12px',
          borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 12
        }}>
          💰 Save ₹{fareData.savingsVsSolo} vs solo ride ({fareData.savingsPercent}% off)
        </div>
      )}

      {/* Breakdown toggle */}
      <button
        type="button"
        onClick={() => setShowBreakdown(s => !s)}
        style={{
          background: 'none', border: 'none', fontSize: 12,
          color: 'var(--coral)', cursor: 'pointer', padding: 0,
          fontWeight: 500, display: 'block', marginTop: 4
        }}
      >
        {showBreakdown ? '▾ Hide breakdown' : '▸ View breakdown'}
      </button>

      {showBreakdown && (
        <div style={{
          marginTop: 10, padding: '12px 14px',
          background: 'var(--card-bg)', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)', fontSize: 13
        }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Base fare</span>
              <span>₹{bd.baseFare}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Distance ({bd.distanceKm} km)</span>
              <span>₹{bd.distanceCharge}</span>
            </div>
            {bd.timeMultiplier > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#92400E' }}>
                <span>⏰ {bd.timePeriod} ({bd.timeMultiplier}x)</span>
                <span>+{Math.round((bd.timeMultiplier - 1) * 100)}%</span>
              </div>
            )}
            {bd.demandMultiplier > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#991B1B' }}>
                <span>📈 {bd.demandLabel} ({bd.demandMultiplier}x)</span>
                <span>+{Math.round((bd.demandMultiplier - 1) * 100)}%</span>
              </div>
            )}
            {bd.splitDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534' }}>
                <span>🤝 Ride split discount</span>
                <span>−₹{bd.splitSavings}</span>
              </div>
            )}
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
              <span>Suggested fare</span>
              <span style={{ color: 'var(--coral)' }}>₹{fareData.suggestedFare}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
