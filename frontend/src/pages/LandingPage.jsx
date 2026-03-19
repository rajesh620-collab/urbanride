import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();

  const features = [
    { icon: '📍', title: 'Smart Matching', desc: 'Our landmark-based algorithm finds the best ride matches based on route and your preferences automatically.' },
    { icon: '⏱', title: 'Rides in Minutes', desc: 'No long waits. Find and book a pooled ride within minutes. Real-time availability at your fingertips.' },
    { icon: '👥', title: 'Community First', desc: 'Build connections with your daily commuters. Ride with people heading your way every day.' },
    { icon: '💰', title: 'Save up to 60%', desc: 'Split fuel and travel costs with co-riders heading your way. Every shared ride means money saved.' },
    { icon: '🌿', title: 'Go Green', desc: 'Fewer cars on the road means reduced carbon emissions. Make an eco-friendly choice with every ride.' },
    { icon: '🛡', title: 'Verified & Safe', desc: 'Every rider is verified. Female-only ride options, real-time status updates, and smart notifications.' },
  ];

  const steps = [
    { num: '01', icon: '📍', title: 'Set Your Route', desc: 'Enter your pickup and drop-off landmarks. Our smart system instantly shows available rides heading your way.' },
    { num: '02', icon: '🤝', title: 'Match & Connect', desc: 'Choose your co-rider from verified profiles. Get notified instantly when a matching ride is posted.' },
    { num: '03', icon: '🚗', title: 'Ride & Save', desc: 'Share the journey, split the cost automatically. Rate your experience and build your rider reputation.' },
  ];

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", color: 'var(--charcoal)', overflowX: 'hidden' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: dark ? 'rgba(18,18,18,0.95)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 48px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, background: 'var(--coral)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 2px 8px rgba(204,120,92,0.4)'
          }}>⚡</div>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--charcoal)' }}>
            Urban<span style={{ color: 'var(--coral)' }}>Ride</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {['Features', 'How It Works', 'Contact'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} style={{
              color: 'var(--muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500
            }}>{item}</a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="theme-toggle" onClick={toggle}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={() => navigate('/login')} style={{
            padding: '9px 20px', background: 'transparent',
            border: '1.5px solid var(--border)', borderRadius: 10,
            fontSize: 14, fontWeight: 500, cursor: 'pointer', color: 'var(--muted)'
          }}>Log in</button>
          <button onClick={() => navigate('/register')} style={{
            padding: '9px 22px', background: 'var(--coral)',
            border: 'none', borderRadius: 10,
            fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'white',
            boxShadow: '0 2px 10px rgba(204,120,92,0.35)'
          }}>Get Started</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        background: 'var(--hero-bg)',
        padding: '80px 48px 60px',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 60, alignItems: 'center',
        minHeight: '88vh'
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--coral-pale)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '6px 14px', marginBottom: 28
          }}>
            <span style={{ width: 7, height: 7, background: 'var(--coral)', borderRadius: '50%', display: 'inline-block' }} />
            <span style={{ fontSize: 13, color: 'var(--coral)', fontWeight: 500 }}>Ride-pooling made easy</span>
          </div>

          <h1 style={{
            fontSize: 54, fontWeight: 800, lineHeight: 1.1,
            letterSpacing: '-0.03em', marginBottom: 24,
            color: 'var(--charcoal)'
          }}>
            Share the Ride,{' '}
            <span style={{ color: 'var(--coral)' }}>Split<br />the Cost</span>
          </h1>

          <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 36, maxWidth: 440 }}>
            Connect with commuters heading your way.{' '}
            <strong style={{ color: 'var(--charcoal)' }}>Save money</strong>,{' '}
            <strong style={{ color: 'var(--charcoal)' }}>reduce emissions</strong>, and make every ride count.
          </p>

          <div style={{ display: 'flex', gap: 14, marginBottom: 56 }}>
            <button onClick={() => navigate('/search')} style={{
              padding: '14px 28px', background: 'var(--coral)',
              border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
              cursor: 'pointer', color: 'white',
              boxShadow: '0 4px 16px rgba(204,120,92,0.4)',
              display: 'flex', alignItems: 'center', gap: 8
            }}>Book a Ride →</button>
            <button onClick={() => navigate('/post-ride')} style={{
              padding: '14px 28px', background: 'transparent',
              border: '2px solid var(--coral)', borderRadius: 12, fontSize: 15, fontWeight: 600,
              cursor: 'pointer', color: 'var(--coral)',
              display: 'flex', alignItems: 'center', gap: 8
            }}>Offer a Ride →</button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 0 }}>
            {[
              { val: '10K+', label: 'Active Riders' },
              { val: '50K+', label: 'Rides Shared' },
              { val: '4.9★', label: 'User Rating', accent: true },
            ].map((s, i) => (
              <div key={i} style={{
                paddingRight: 32,
                borderRight: i < 2 ? '1px solid var(--stat-divider)' : 'none',
                marginRight: i < 2 ? 32 : 0
              }}>
                <p style={{ fontSize: 24, fontWeight: 800, margin: 0, color: s.accent ? '#2A9D8F' : 'var(--charcoal)' }}>{s.val}</p>
                <p style={{ fontSize: 13, color: 'var(--text-hint)', margin: '2px 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — illustration */}
        <div style={{ position: 'relative' }}>
          <div style={{
            background: dark
              ? 'linear-gradient(135deg, #1E2A28 0%, #2A2420 100%)'
              : 'linear-gradient(135deg, #E8F4F2 0%, #EDE4DA 100%)',
            borderRadius: 24, padding: '40px 32px', minHeight: 380,
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)'
          }}>
            <svg viewBox="0 0 460 280" style={{ width: '100%' }}>
              <rect x="0" y="220" width="460" height="60" fill={dark ? '#2A2622' : '#D4CEC8'} rx="4"/>
              <rect x="0" y="230" width="460" height="40" fill={dark ? '#252220' : '#C8C2BC'}/>
              {[40,100,160,220,280,340,400].map(x => (
                <rect key={x} x={x} y="248" width="40" height="5" fill={dark ? '#3A3632' : '#E8E0D8'} rx="2"/>
              ))}
              <rect x="60" y="100" width="80" height="125" fill={dark ? '#3A3228' : '#D4C4B4'} rx="4"/>
              <rect x="70" y="110" width="18" height="20" fill="#A8C8C0" rx="2" opacity="0.8"/>
              <rect x="96" y="110" width="18" height="20" fill="#A8C8C0" rx="2" opacity="0.8"/>
              <rect x="122" y="110" width="18" height="20" fill="#A8C8C0" rx="2" opacity="0.6"/>
              <rect x="70" y="138" width="18" height="20" fill="#A8C8C0" rx="2" opacity="0.7"/>
              <rect x="96" y="138" width="18" height="20" fill="#A8C8C0" rx="2" opacity="0.9"/>
              <rect x="170" y="60" width="70" height="165" fill={dark ? '#2A3A38' : '#B8D4D0'} rx="4"/>
              <rect x="180" y="72" width="14" height="18" fill="white" rx="2" opacity="0.5"/>
              <rect x="200" y="72" width="14" height="18" fill="white" rx="2" opacity="0.4"/>
              <rect x="180" y="98" width="14" height="18" fill="white" rx="2" opacity="0.5"/>
              <rect x="200" y="98" width="14" height="18" fill="white" rx="2" opacity="0.6"/>
              <rect x="270" y="90" width="65" height="135" fill={dark ? '#3A3228' : '#D4C4B4'} rx="4"/>
              <rect x="280" y="102" width="14" height="18" fill="#A8C8C0" rx="2" opacity="0.7"/>
              <rect x="300" y="102" width="14" height="18" fill="#A8C8C0" rx="2" opacity="0.5"/>
              <rect x="360" y="110" width="75" height="115" fill={dark ? '#2A3A38' : '#B8D4D0'} rx="4"/>
              <rect x="370" y="122" width="14" height="18" fill="white" rx="2" opacity="0.6"/>
              <rect x="392" y="122" width="14" height="18" fill="white" rx="2" opacity="0.8"/>
              <ellipse cx="255" cy="80" rx="8" ry="13" fill="#5BAD8F" opacity="0.7" transform="rotate(-15,255,80)"/>
              <ellipse cx="345" cy="95" rx="6" ry="10" fill="#5BAD8F" opacity="0.6" transform="rotate(10,345,95)"/>
              <circle cx="130" cy="215" r="10" fill="#2A9D8F" stroke="white" strokeWidth="3"/>
              <circle cx="130" cy="215" r="4" fill="white"/>
              <circle cx="340" cy="195" r="10" fill="var(--coral)" stroke="white" strokeWidth="3"/>
              <circle cx="340" cy="195" r="4" fill="white"/>
              <path d="M140 215 Q220 200 330 200" stroke="#2A9D8F" strokeWidth="2.5" strokeDasharray="8 5" fill="none"/>
              <g transform="translate(195,196)">
                <rect x="-30" y="-14" width="60" height="30" fill="var(--coral)" rx="8"/>
                <rect x="-20" y="-22" width="40" height="18" fill="#E8956B" rx="5"/>
                <rect x="-15" y="-19" width="14" height="12" fill="#A8D0CC" rx="3" opacity="0.9"/>
                <rect x="3" y="-19" width="14" height="12" fill="#A8D0CC" rx="3" opacity="0.9"/>
                <circle cx="-18" cy="16" r="8" fill="#1C1917"/>
                <circle cx="-18" cy="16" r="4" fill="#888"/>
                <circle cx="18" cy="16" r="8" fill="#1C1917"/>
                <circle cx="18" cy="16" r="4" fill="#888"/>
                <circle cx="-8" cy="-10" r="5" fill="#F5D0B0"/>
                <circle cx="5" cy="-10" r="5" fill="#D4956B"/>
                <circle cx="18" cy="-10" r="5" fill="var(--coral)"/>
              </g>
            </svg>
          </div>

          {/* Floating cards */}
          <div style={{
            position: 'absolute', top: -16, right: -16,
            background: 'var(--floating-bg)', borderRadius: 14, padding: '12px 18px',
            boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 12,
            animation: 'floatA 3s ease-in-out infinite'
          }}>
            <div style={{
              width: 32, height: 32, background: dark ? '#1C2E22' : '#EDF5F3',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ color: '#2A9D8F', fontSize: 16 }}>✓</span>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--charcoal)' }}>Ride Matched!</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-hint)' }}>2 riders nearby</p>
            </div>
          </div>

          <div style={{
            position: 'absolute', bottom: -16, left: -8,
            background: 'var(--floating-bg)', borderRadius: 14, padding: '12px 18px',
            boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 12,
            animation: 'floatB 3.5s ease-in-out infinite'
          }}>
            <div style={{
              width: 32, height: 32, background: dark ? '#3A2A22' : '#FDE8D8',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16
            }}>💰</div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--charcoal)' }}>You saved ₹120</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-hint)' }}>On today's ride</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ background: 'var(--section-bg)', padding: '100px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{
            display: 'inline-block', background: 'var(--coral-pale)',
            border: '1px solid var(--border)', borderRadius: 20,
            padding: '5px 16px', marginBottom: 20
          }}>
            <span style={{ fontSize: 13, color: 'var(--coral)', fontWeight: 500 }}>Why UrbanRide?</span>
          </div>
          <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16, color: 'var(--charcoal)' }}>
            Everything you need for a{' '}
            <span style={{ color: 'var(--coral)' }}>smarter commute</span>
          </h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
            UrbanRide combines smart technology with community spirit to transform how you travel.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24, maxWidth: 1100, margin: '0 auto'
        }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: 'var(--card-bg)', borderRadius: 20, padding: 28,
              border: '1px solid var(--feature-border)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'default'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
              <div style={{
                width: 48, height: 48, background: 'var(--coral-pale)',
                borderRadius: 14, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 22, marginBottom: 18
              }}>{f.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: 'var(--charcoal)' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background: 'var(--section-alt-bg)', padding: '100px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{
            display: 'inline-block', background: dark ? '#1C2E22' : '#EDF5F3',
            border: '1px solid var(--border)', borderRadius: 20,
            padding: '5px 16px', marginBottom: 20
          }}>
            <span style={{ fontSize: 13, color: '#2A9D8F', fontWeight: 500 }}>Simple as 1-2-3</span>
          </div>
          <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16, color: 'var(--charcoal)' }}>
            How <span style={{ color: '#2A9D8F' }}>UrbanRide</span> works
          </h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 16 }}>
            Getting started takes less than a minute. Here's how it works.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 28, maxWidth: 1000, margin: '0 auto',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute', top: 56, left: '18%', right: '18%',
            height: 2, background: 'linear-gradient(90deg, var(--border), var(--border))',
            zIndex: 0
          }} />

          {steps.map((s, i) => (
            <div key={i} style={{
              background: 'var(--card-bg)', borderRadius: 20, padding: 32,
              border: '1px solid var(--feature-border)',
              position: 'relative', zIndex: 1,
              boxShadow: i === 1 ? '0 8px 32px rgba(42,157,143,0.12)' : 'var(--shadow-sm)',
              transform: i === 1 ? 'translateY(-8px)' : 'none',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div style={{
                position: 'absolute', top: -14, left: 28,
                background: 'var(--coral)', color: 'white',
                borderRadius: 8, padding: '4px 10px',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.05em'
              }}>{s.num}</div>

              <div style={{
                width: 56, height: 56, background: dark ? '#1C2E22' : '#E8F5F3',
                borderRadius: 16, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 26, marginBottom: 20, marginTop: 8
              }}>{s.icon}</div>

              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--charcoal)' }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ background: dark ? '#0E0E0E' : '#1C1917', padding: '80px 48px' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--coral) 0%, var(--coral-dark) 100%)',
          borderRadius: 24, padding: '48px 56px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          maxWidth: 1100, margin: '0 auto',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', right: 60, bottom: -60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 10 }}>
              Ready to share the ride?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>
              Join thousands of riders saving money every day.
            </p>
          </div>
          <button onClick={() => navigate('/register')} style={{
            padding: '16px 32px', background: 'white',
            border: 'none', borderRadius: 14, fontSize: 15,
            fontWeight: 700, cursor: 'pointer', color: 'var(--coral)',
            whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            transition: 'transform 0.15s'
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            Start Riding Now →
          </button>
        </div>

        {/* Footer */}
        <div style={{ maxWidth: 1100, margin: '64px auto 0', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 34, height: 34, background: 'var(--coral)',
                borderRadius: 10, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 16
              }}>⚡</div>
              <span style={{ fontSize: 17, fontWeight: 700, color: 'white' }}>
                Urban<span style={{ color: 'var(--coral-light)' }}>Ride</span>
              </span>
            </div>
            <p style={{ color: '#888', fontSize: 13, lineHeight: 1.7, maxWidth: 220 }}>
              Making urban commutes affordable, social, and sustainable — one shared ride at a time.
            </p>
          </div>

          {[
            { heading: 'PRODUCT', links: ['Features', 'How It Works', 'Pricing', 'FAQ'] },
            { heading: 'COMPANY', links: ['About Us', 'Careers', 'Blog', 'Press'] },
            { heading: 'LEGAL', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'] },
          ].map(col => (
            <div key={col.heading}>
              <p style={{ color: '#777', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 18 }}>
                {col.heading}
              </p>
              {col.links.map(link => (
                <p key={link} style={{ marginBottom: 12 }}>
                  <a href="#" style={{ color: '#999', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = 'var(--coral)'}
                    onMouseLeave={e => e.target.style.color = '#999'}>
                    {link}
                  </a>
                </p>
              ))}
            </div>
          ))}
        </div>

        <div style={{
          maxWidth: 1100, margin: '40px auto 0',
          borderTop: '1px solid #2A2622', paddingTop: 28,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <p style={{ color: '#666', fontSize: 13 }}>© 2026 UrbanRide. All rights reserved.</p>
          <p style={{ color: '#666', fontSize: 13 }}>Made with 🧡 for a greener planet</p>
        </div>
      </section>
    </div>
  );
}