import { useState } from 'react';

export default function SafetyToolkit({ ride, user }) {
  const [isOpen, setIsOpen] = useState(false);

  const tools = [
    {
      id: 'sos',
      label: 'Emergency SOS',
      icon: '🚨',
      desc: 'Instant alert to contacts',
      color: '#EF4444',
      action: () => {
        const txt = encodeURIComponent(
          `🆘 SOS! I'm in UrbanRide from ${ride.sourceLandmark} → ${ride.destinationLandmark}.\nDriver: ${ride.driverName}\nTrack: ${window.location.href}`
        );
        window.open(`https://wa.me/?text=${txt}`, '_blank');
      }
    },
    {
      id: 'share',
      label: 'Share Trip',
      icon: '🔗',
      desc: 'Real-time tracking link',
      color: '#007AFF',
      action: () => {
        if (navigator.share) {
          navigator.share({
            title: 'Track my UrbanRide',
            text: `I'm on a ride from ${ride.sourceLandmark} to ${ride.destinationLandmark}. Follow me live:`,
            url: window.location.href,
          });
        } else {
          navigator.clipboard.writeText(window.location.href);
          alert('Link copied to clipboard!');
        }
      }
    },
    {
      id: 'record',
      label: 'Record Audio',
      icon: '🎙️',
      desc: 'Encrypted safety clip',
      color: '#8B5CF6',
      action: () => alert('Audio recording started. (Simulation)')
    },
    {
      id: 'helpline',
      label: 'Call Helpline',
      icon: '📞',
      desc: '24/7 Support',
      color: '#10B981',
      action: () => window.open('tel:112')
    }
  ];

  return (
    <div style={{ position: 'fixed', bottom: 90, right: 20, zIndex: 10000 }}>
      {/* Expanded Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute', bottom: 70, right: 0, width: 280,
          background: 'var(--card-bg)', borderRadius: 24, padding: 20,
          boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
          animation: 'safetyMenuIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transformOrigin: 'bottom right'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, background: 'rgba(239,68,68,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 16 }}>🛡️</span>
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>Safety Toolkit</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>Your safety is our priority</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tools.map(tool => (
              <button
                key={tool.id}
                onClick={() => { tool.action(); setIsOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: 12,
                  background: 'var(--input-bg)', border: '1px solid var(--border)',
                  borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s',
                  textAlign: 'left', width: '100%'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = tool.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <span style={{ fontSize: 24 }}>{tool.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{tool.label}</p>
                  <p style={{ fontSize: 10, color: 'var(--muted)', margin: 0 }}>{tool.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 56, height: 56, borderRadius: '50%',
          background: isOpen ? 'var(--charcoal)' : 'var(--coral)',
          color: 'white', border: 'none', cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isOpen ? 'rotate(90deg)' : 'none'
        }}
      >
        {isOpen ? (
          <span style={{ fontSize: 24 }}>×</span>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        )}
      </button>

      <style>{`
        @keyframes safetyMenuIn {
          from { opacity: 0; transform: scale(0.8) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
