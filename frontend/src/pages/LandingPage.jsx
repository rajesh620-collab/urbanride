import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { RevealOnScroll } from '../hooks/useScrollReveal.jsx';

/* ─── FEATURE IMAGES ─── */
import imgSmartMatch from '../assets/feature_smart_matching.png';
import imgQuickRides from '../assets/feature_quick_rides.png';
import imgCommunity from '../assets/feature_community.png';
import imgCostSaving from '../assets/feature_cost_saving.png';
import imgEcoFriendly from '../assets/feature_eco_friendly.png';
import imgFemaleSafety from '../assets/feature_female_safety.png';

/* ─── DATA ─── */
const features = [
  { img: imgSmartMatch, title: 'Smart Matching', desc: 'Landmark-based algorithm finds the best ride matches based on route, time, and preferences automatically.', tagline: 'AI-Powered', color: '#6366F1' },
  { img: imgQuickRides, title: 'Rides in Minutes', desc: 'Find and book a pooled ride within minutes. Real-time availability at your fingertips.', tagline: 'Lightning Fast', color: '#EC4899' },
  { img: imgCommunity, title: 'Community First', desc: 'Build connections with daily commuters heading your way. Ride with trusted people.', tagline: 'Social Network', color: '#14B8A6' },
  { img: imgCostSaving, title: 'Save up to 60%', desc: 'Split fuel costs with co-riders. Every shared ride means money saved for everyone.', tagline: 'Cost Effective', color: '#F59E0B' },
  { img: imgEcoFriendly, title: 'Go Green', desc: 'Fewer cars on the road means reduced carbon emissions. An eco-friendly choice every ride.', tagline: 'Eco Friendly', color: '#22C55E' },
  { img: imgFemaleSafety, title: 'Verified and Safe', desc: 'Every rider is verified. Female-only ride options, real-time tracking, and smart alerts.', tagline: 'Trust and Safety', color: '#8B5CF6' },
];

/* SVG icons for steps (no emojis) */
const StepIcon = ({ type }) => {
  const icons = {
    route: <><circle cx="12" cy="5" r="3" stroke="#2A9D8F" strokeWidth="1.5" fill="none"/><circle cx="12" cy="19" r="3" stroke="var(--coral)" strokeWidth="1.5" fill="none"/><path d="M12 8v8" stroke="#2A9D8F" strokeWidth="1.5" strokeDasharray="3 2"/></>,
    match: <><path d="M16 4l4 4-4 4" stroke="#2A9D8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M20 8H9a4 4 0 000 8h2" stroke="#2A9D8F" strokeWidth="1.5" strokeLinecap="round" fill="none"/></>,
    ride: <><rect x="2" y="12" width="20" height="8" rx="3" stroke="#2A9D8F" strokeWidth="1.5" fill="none"/><path d="M6 12V9a6 6 0 0112 0v3" stroke="#2A9D8F" strokeWidth="1.5" fill="none"/><circle cx="7" cy="20" r="2" fill="#2A9D8F"/><circle cx="17" cy="20" r="2" fill="#2A9D8F"/></>,
  };
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none">{icons[type]}</svg>;
};

const steps = [
  { num: '01', type: 'route', title: 'Set Your Route', desc: 'Enter pickup and drop-off landmarks. Our system instantly shows available rides.' },
  { num: '02', type: 'match', title: 'Match and Connect', desc: 'Choose a verified co-rider. Get notified instantly when a match is found.' },
  { num: '03', type: 'ride', title: 'Ride and Save', desc: 'Share the journey, split costs automatically. Rate and build reputation.' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Daily Commuter', text: 'UrbanRide saves me \u20b92000 every month on my office commute. The matching is incredibly accurate!', rating: 5, avatar: 'PS' },
  { name: 'Rahul Mehra', role: 'Student', text: 'As a college student, this app is a lifesaver. I\'ve made great friends through shared rides!', rating: 5, avatar: 'RM' },
  { name: 'Anita Desai', role: 'Working Professional', text: 'The female-only ride option makes me feel so much safer. Brilliant feature!', rating: 5, avatar: 'AD' },
  { name: 'Vikram Patel', role: 'Freelancer', text: 'I offer rides when heading to meetings. It covers my fuel costs completely!', rating: 4, avatar: 'VP' },
  { name: 'Sneha Reddy', role: 'IT Professional', text: 'The real-time tracking gives me peace of mind. My family can see when I reach safely!', rating: 5, avatar: 'SR' },
  { name: 'Arjun Kapoor', role: 'Startup Founder', text: 'I use UrbanRide daily to reduce my carbon footprint. Great initiative and great execution!', rating: 5, avatar: 'AK' },
  { name: 'Meera Joshi', role: 'Teacher', text: 'Affordable, safe, and reliable. The landmark-based matching is incredibly smart.', rating: 5, avatar: 'MJ' },
  { name: 'Karthik Nair', role: 'Delivery Partner', text: 'Split the fuel cost and meet interesting people during my daily commute. Win-win!', rating: 4, avatar: 'KN' },
];

const faqs = [
  { q: 'How does ride matching work?', a: 'Our smart algorithm matches riders based on pickup/drop landmarks, route overlap, and timing preferences for optimal matches.' },
  { q: 'Is UrbanRide safe for women?', a: 'Absolutely! We offer female-only ride options, verified profiles, real-time tracking, and emergency SOS features.' },
  { q: 'How is the fare calculated?', a: 'Fares are dynamically calculated based on distance, time, demand, and split among co-riders for maximum savings.' },
  { q: 'Can I offer rides as a driver?', a: 'Yes! Simply post your route with available seats. Riders heading your way can request to join, and you earn from shared costs.' },
  { q: 'Is the app available in my city?', a: 'UrbanRide is expanding rapidly across major Indian cities. Check the app for availability in your area.' },
];

/* SVG stat icons (no emojis) */
const StatIcon = ({ type }) => {
  const icons = {
    rides: <><rect x="2" y="12" width="20" height="8" rx="3" stroke="white" strokeWidth="1.5" fill="none"/><path d="M6 12V9a6 6 0 0112 0v3" stroke="white" strokeWidth="1.5" fill="none"/><circle cx="7" cy="20" r="1.5" fill="white"/><circle cx="17" cy="20" r="1.5" fill="white"/></>,
    riders: <><circle cx="9" cy="7" r="3" stroke="white" strokeWidth="1.5" fill="none"/><circle cx="15" cy="7" r="3" stroke="white" strokeWidth="1.5" fill="none"/><path d="M3 21c0-4 2.7-6 6-6s6 2 6 6" stroke="white" strokeWidth="1.5" fill="none"/><path d="M15 15c3.3 0 6 2 6 6" stroke="white" strokeWidth="1.5" fill="none" opacity="0.7"/></>,
    money: <><circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" fill="none"/><path d="M12 7v10M9 10h6M9 14h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></>,
    star: <><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" stroke="white" strokeWidth="1.5" fill="none" strokeLinejoin="round"/></>,
  };
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none">{icons[type]}</svg>;
};

const stats = [
  { value: '50K+', label: 'Rides Completed', iconType: 'rides' },
  { value: '10K+', label: 'Active Riders', iconType: 'riders' },
  { value: '\u20b92Cr+', label: 'Money Saved', iconType: 'money' },
  { value: '4.9', label: 'App Rating', iconType: 'star' },
];

/* ─── COUNTER ANIMATION ─── */
function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const num = parseInt(target.replace(/[^0-9]/g, ''));
        const duration = 2000;
        const step = Math.ceil(num / (duration / 16));
        let current = 0;
        const timer = setInterval(() => {
          current += step;
          if (current >= num) { setCount(num); clearInterval(timer); }
          else setCount(current);
        }, 16);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  const prefix = target.includes('₹') ? '₹' : '';
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ─── FAQ ACCORDION ─── */
function FaqItem({ q, a, isOpen, onClick }) {
  return (
    <div style={{
      background: 'var(--card-bg)', borderRadius: 16, border: '1px solid var(--border)',
      marginBottom: 12, overflow: 'hidden', transition: 'box-shadow 0.3s',
      boxShadow: isOpen ? 'var(--shadow-md)' : 'var(--shadow-sm)',
    }}>
      <button onClick={onClick} style={{
        width: '100%', padding: '20px 24px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: "'Montserrat', sans-serif", textAlign: 'left',
      }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--charcoal)', flex: 1 }}>{q}</span>
        <span style={{
          width: 32, height: 32, borderRadius: '50%', background: isOpen ? 'var(--coral)' : 'var(--coral-pale)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s', transform: isOpen ? 'rotate(45deg)' : 'rotate(0)',
          color: isOpen ? 'white' : 'var(--coral)', fontSize: 20, fontWeight: 300, flexShrink: 0,
        }}>+</span>
      </button>
      <div style={{
        maxHeight: isOpen ? 200 : 0, overflow: 'hidden',
        transition: 'max-height 0.4s ease, padding 0.3s',
        padding: isOpen ? '0 24px 20px' : '0 24px 0',
      }}>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>{a}</p>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function LandingPage() {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const [openFaq, setOpenFaq] = useState(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const parallax = (factor) => ({ transform: `translateY(${scrollY * factor}px)` });

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", color: 'var(--charcoal)', overflowX: 'hidden' }}>

      {/* ══════ NAVBAR ══════ */}
      <nav className="landing-nav" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 64,
        background: scrollY > 50
          ? (dark ? 'rgba(18,18,18,0.95)' : 'rgba(255,255,255,0.95)')
          : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(16px)' : 'none',
        borderBottom: scrollY > 50 ? '1px solid var(--border)' : '1px solid transparent',
        padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, background: 'linear-gradient(135deg, var(--coral), var(--coral-light))',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(204,120,92,0.4)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 7v10l8 5 8-5V7L12 2z" stroke="white" strokeWidth="2.2" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="2.5" fill="white" />
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            Urban<span style={{ color: 'var(--coral)' }}>Ride</span>
          </span>
        </div>

        <div className="nav-links-landing" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {['Features', 'How It Works', 'Testimonials', 'FAQ'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} style={{
              color: 'var(--muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500,
              transition: 'color 0.2s',
            }}>{item}</a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="theme-toggle" onClick={toggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {dark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </button>
          <button onClick={() => navigate('/login')} className="landing-btn-ghost">Log in</button>
          <button onClick={() => navigate('/register')} className="landing-btn-primary">Get Started</button>
        </div>
      </nav>

      {/* ══════ HERO ══════ */}
      <section style={{
        background: 'var(--hero-bg)', padding: '140px 48px 80px', minHeight: '100vh',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Parallax background shapes */}
        <div style={{ ...parallax(-0.15), position: 'absolute', top: 100, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(204,120,92,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ ...parallax(-0.1), position: 'absolute', bottom: -100, left: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,157,143,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <RevealOnScroll direction="left">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--coral-pale)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '6px 14px', marginBottom: 28,
          }}>
            <span className="live-dot" />
            <span style={{ fontSize: 13, color: 'var(--coral)', fontWeight: 500 }}>Ride-pooling made easy</span>
          </div>

          <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 24 }}>
            Share the Ride,{' '}
            <span style={{ color: 'var(--coral)', position: 'relative' }}>
              Split<br />the Cost
              <svg style={{ position: 'absolute', bottom: -8, left: 0, width: '100%' }} height="8" viewBox="0 0 200 8" fill="none">
                <path d="M2 6C50 2 150 2 198 6" stroke="var(--coral)" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
              </svg>
            </span>
          </h1>

          <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 36, maxWidth: 440 }}>
            Connect with commuters heading your way. <strong style={{ color: 'var(--charcoal)' }}>Save money</strong>,{' '}
            <strong style={{ color: 'var(--charcoal)' }}>reduce emissions</strong>, and make every ride count.
          </p>

          <div style={{ display: 'flex', gap: 14, marginBottom: 48 }}>
            <button onClick={() => navigate('/register')} className="hero-cta-btn">
              Download App
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14m0 0l-6-6m6 6l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
            <button onClick={() => navigate('/search')} className="hero-cta-outline">
              Book a Ride →
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 0 }}>
            {[
              { val: '10K+', label: 'Active Riders' },
              { val: '50K+', label: 'Rides Shared' },
              { val: '4.9★', label: 'User Rating', accent: true },
            ].map((s, i) => (
              <div key={i} style={{
                paddingRight: 32, borderRight: i < 2 ? '1px solid var(--stat-divider)' : 'none',
                marginRight: i < 2 ? 32 : 0,
              }}>
                <p style={{ fontSize: 24, fontWeight: 800, margin: 0, color: s.accent ? '#2A9D8F' : 'var(--charcoal)' }}>{s.val}</p>
                <p style={{ fontSize: 13, color: 'var(--text-hint)', margin: '2px 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </RevealOnScroll>

        {/* Right — illustration */}
        <RevealOnScroll direction="right" delay={0.2}>
          <div style={{ position: 'relative' }}>
            <div style={{
              background: dark ? 'linear-gradient(135deg, #1E2A28, #2A2420)' : 'linear-gradient(135deg, #E8F4F2, #EDE4DA)',
              borderRadius: 24, padding: '40px 32px', minHeight: 380, position: 'relative', overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            }}>
              <svg viewBox="0 0 460 280" style={{ width: '100%' }}>
                <rect x="0" y="220" width="460" height="60" fill={dark ? '#2A2622' : '#D4CEC8'} rx="4"/>
                <rect x="0" y="230" width="460" height="40" fill={dark ? '#252220' : '#C8C2BC'}/>
                {[40,100,160,220,280,340,400].map(x => <rect key={x} x={x} y="248" width="40" height="5" fill={dark ? '#3A3632' : '#E8E0D8'} rx="2"/>)}
                <rect x="60" y="100" width="80" height="125" fill={dark ? '#3A3228' : '#D4C4B4'} rx="4"/>
                <rect x="70" y="110" width="18" height="20" fill="#A8C8C0" rx="2" opacity="0.8"/>
                <rect x="96" y="110" width="18" height="20" fill="#A8C8C0" rx="2" opacity="0.8"/>
                <rect x="170" y="60" width="70" height="165" fill={dark ? '#2A3A38' : '#B8D4D0'} rx="4"/>
                <rect x="270" y="90" width="65" height="135" fill={dark ? '#3A3228' : '#D4C4B4'} rx="4"/>
                <rect x="360" y="110" width="75" height="115" fill={dark ? '#2A3A38' : '#B8D4D0'} rx="4"/>
                <circle cx="130" cy="215" r="10" fill="#2A9D8F" stroke="white" strokeWidth="3"/>
                <circle cx="340" cy="195" r="10" fill="var(--coral)" stroke="white" strokeWidth="3"/>
                <path d="M140 215 Q220 200 330 200" stroke="#2A9D8F" strokeWidth="2.5" strokeDasharray="8 5" fill="none"/>
                <g transform="translate(195,196)">
                  <rect x="-30" y="-14" width="60" height="30" fill="var(--coral)" rx="8"/>
                  <rect x="-20" y="-22" width="40" height="18" fill="#E8956B" rx="5"/>
                  <circle cx="-18" cy="16" r="8" fill="#1C1917"/>
                  <circle cx="-18" cy="16" r="4" fill="#888"/>
                  <circle cx="18" cy="16" r="8" fill="#1C1917"/>
                  <circle cx="18" cy="16" r="4" fill="#888"/>
                </g>
              </svg>
            </div>
            {/* Floating cards */}
            <div className="float-card float-a" style={{ position: 'absolute', top: -16, right: -16 }}>
              <div style={{ width: 32, height: 32, background: dark ? '#1C2E22' : '#EDF5F3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#2A9D8F', fontSize: 16 }}>✓</span>
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>Ride Matched!</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-hint)' }}>2 riders nearby</p>
              </div>
            </div>
            <div className="float-card float-b" style={{ position: 'absolute', bottom: -16, left: -8 }}>
              <div style={{ width: 32, height: 32, background: dark ? '#3A2A22' : '#FDE8D8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="var(--coral)" strokeWidth="1.5" fill="none"/><path d="M12 7v10M9 10h6M9 14h6" stroke="var(--coral)" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>You saved ₹120</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-hint)' }}>On today's ride</p>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* ══════ STATS BAR ══════ */}
      <section style={{ background: dark ? 'linear-gradient(135deg, #1A1412 0%, #0F1A18 100%)' : 'linear-gradient(135deg, #1C1917 0%, #0F2623 100%)', padding: '52px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(204,120,92,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -40, width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,157,143,0.06) 0%, transparent 70%)' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {stats.map((s, i) => (
            <RevealOnScroll key={i} delay={i * 0.1}>
              <div style={{
                textAlign: 'center', padding: '24px 16px',
                background: 'rgba(255,255,255,0.04)', borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(8px)', transition: 'transform 0.3s, background 0.3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              >
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}><StatIcon type={s.iconType} /></div>
                <p style={{ fontSize: 32, fontWeight: 800, color: 'white', margin: 0 }}>
                  <AnimatedCounter target={s.value} suffix={s.value.includes('+') ? '+' : s.value.includes('Cr') ? 'Cr+' : ''} />
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{s.label}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* ══════ FEATURES ══════ */}
      <section id="features" style={{ background: 'var(--section-bg)', padding: '100px 48px' }}>
        <RevealOnScroll>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-badge" style={{ background: 'var(--coral-pale)' }}>
              <span style={{ fontSize: 13, color: 'var(--coral)', fontWeight: 600 }}>Why UrbanRide?</span>
            </div>
            <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
              Everything for a <span style={{ color: 'var(--coral)' }}>smarter commute</span>
            </h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
              Smart technology combined with community spirit to transform how you travel.
            </p>
          </div>
        </RevealOnScroll>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 1100, margin: '0 auto' }}>
          {features.map((f, i) => (
            <RevealOnScroll key={i} delay={i * 0.08}>
              <div className="feature-card" style={{ background: 'var(--card-bg)', borderRadius: 20, border: '1px solid var(--feature-border)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 18, right: 18, background: `${f.color}18`, borderRadius: 8, padding: '3px 10px', zIndex: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: f.color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{f.tagline}</span>
                </div>
                <div style={{ width: '100%', height: 180, overflow: 'hidden', borderRadius: '20px 20px 0 0' }}>
                  <img src={f.img} alt={f.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} className="feature-img" />
                </div>
                <div style={{ padding: '20px 24px 24px' }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* ══════ HOW IT WORKS ══════ */}
      <section id="how-it-works" style={{ background: 'var(--section-alt-bg)', padding: '100px 48px' }}>
        <RevealOnScroll>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-badge" style={{ background: dark ? '#1C2E22' : '#EDF5F3' }}>
              <span style={{ fontSize: 13, color: '#2A9D8F', fontWeight: 600 }}>Simple as 1-2-3</span>
            </div>
            <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
              How <span style={{ color: '#2A9D8F' }}>UrbanRide</span> works
            </h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 16 }}>Getting started takes less than a minute.</p>
          </div>
        </RevealOnScroll>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28, maxWidth: 1000, margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 56, left: '18%', right: '18%', height: 2, background: 'var(--border)', zIndex: 0 }} />
          {steps.map((s, i) => (
            <RevealOnScroll key={i} delay={i * 0.15}>
              <div className="step-card" style={{
                background: 'var(--card-bg)', borderRadius: 20, padding: 32,
                border: '1px solid var(--feature-border)', position: 'relative', zIndex: 1,
                boxShadow: i === 1 ? '0 8px 32px rgba(42,157,143,0.12)' : 'var(--shadow-sm)',
                transform: i === 1 ? 'translateY(-8px)' : 'none',
              }}>
                <div style={{ position: 'absolute', top: -14, left: 28, background: 'var(--coral)', color: 'white', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em' }}>{s.num}</div>
                <div style={{ width: 56, height: 56, background: dark ? '#1C2E22' : '#E8F5F3', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, marginTop: 8 }}><StepIcon type={s.type} /></div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        {/* Video Section */}
        <RevealOnScroll delay={0.2}>
          <div style={{ maxWidth: 800, margin: '80px auto 0', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', background: dark ? '#111' : '#000', position: 'relative' }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1"
                title="How UrbanRide Works"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* ══════ DOWNLOAD APP ══════ */}
      <section style={{
        background: 'linear-gradient(135deg, var(--coral) 0%, var(--coral-dark) 100%)',
        padding: '80px 48px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -100, top: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', left: -50, bottom: -150, width: 350, height: 350, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <RevealOnScroll direction="left">
            <h2 style={{ fontSize: 38, fontWeight: 800, color: 'white', marginBottom: 16 }}>Download the App</h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
              Get UrbanRide on your phone and start sharing rides today. Available on both platforms.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button className="store-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z"/></svg>
                <div><span style={{ fontSize: 10, opacity: 0.8 }}>GET IT ON</span><br /><span style={{ fontSize: 15, fontWeight: 700 }}>Google Play</span></div>
              </button>
              <button className="store-btn">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 16.56 2.93 11.3 4.7 7.72C5.57 5.94 7.36 4.86 9.28 4.84C10.56 4.82 11.78 5.72 12.56 5.72C13.34 5.72 14.81 4.62 16.39 4.8C17.07 4.83 18.94 5.09 20.13 6.85C20.03 6.92 17.58 8.35 17.61 11.31C17.65 14.84 20.68 16 20.71 16C20.69 16.08 20.17 17.84 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/></svg>
                <div><span style={{ fontSize: 10, opacity: 0.8 }}>Download on the</span><br /><span style={{ fontSize: 15, fontWeight: 700 }}>App Store</span></div>
              </button>
            </div>
          </RevealOnScroll>

          <RevealOnScroll direction="right" delay={0.2}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
              {/* Phone mockup */}
              <div className="phone-mockup">
                <div style={{ background: dark ? '#1a1a1a' : '#f5f5f5', borderRadius: 20, padding: 16, height: 280 }}>
                  <div style={{ height: 24, background: 'var(--coral-pale)', borderRadius: 8, marginBottom: 12 }} />
                  <div style={{ height: 80, background: 'var(--coral)', borderRadius: 12, marginBottom: 12, opacity: 0.7 }} />
                  <div style={{ height: 12, background: 'var(--border)', borderRadius: 4, marginBottom: 8, width: '80%' }} />
                  <div style={{ height: 12, background: 'var(--border)', borderRadius: 4, marginBottom: 8, width: '60%' }} />
                  <div style={{ height: 40, background: 'var(--coral)', borderRadius: 10, marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>Book Ride</span>
                  </div>
                </div>
              </div>
              <div className="phone-mockup" style={{ marginTop: 40 }}>
                <div style={{ background: dark ? '#1a1a1a' : '#f5f5f5', borderRadius: 20, padding: 16, height: 280 }}>
                  <div style={{ height: 120, background: '#2A9D8F', borderRadius: 12, marginBottom: 12, opacity: 0.5 }} />
                  <div style={{ height: 12, background: 'var(--border)', borderRadius: 4, marginBottom: 8, width: '70%' }} />
                  <div style={{ height: 12, background: 'var(--border)', borderRadius: 4, marginBottom: 8, width: '50%' }} />
                  <div style={{ height: 40, background: '#2A9D8F', borderRadius: 10, marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>Track Ride</span>
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ══════ TESTIMONIALS — INFINITE CAROUSEL ══════ */}
      <section id="testimonials" style={{ background: 'var(--section-bg)', padding: '100px 0', overflow: 'hidden' }}>
        <RevealOnScroll>
          <div style={{ textAlign: 'center', marginBottom: 48, padding: '0 48px' }}>
            <div className="section-badge" style={{ background: 'var(--coral-pale)' }}>
              <span style={{ fontSize: 13, color: 'var(--coral)', fontWeight: 600 }}>What Riders Say</span>
            </div>
            <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
              Loved by <span style={{ color: 'var(--coral)' }}>thousands</span>
            </h2>
          </div>
        </RevealOnScroll>

        {/* Infinite scroll track */}
        <div className="testimonial-carousel">
          <div className="testimonial-track">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div key={i} className="testimonial-slide">
                <div className="testimonial-card" style={{
                  background: 'var(--card-bg)', borderRadius: 20, padding: 24,
                  border: '1px solid var(--feature-border)', minWidth: 300, maxWidth: 300,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--coral-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: 'var(--coral)', flexShrink: 0 }}>{t.avatar}</div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{t.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{t.role}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
                    {Array.from({ length: 5 }, (_, j) => (
                      <span key={j} style={{ color: j < t.rating ? '#F59E0B' : 'var(--border)', fontSize: 14 }}>★</span>
                    ))}
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>"{t.text}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ FAQ ══════ */}
      <section id="faq" style={{ background: 'var(--section-alt-bg)', padding: '100px 48px' }}>
        <RevealOnScroll>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-badge" style={{ background: 'var(--coral-pale)' }}>
              <span style={{ fontSize: 13, color: 'var(--coral)', fontWeight: 600 }}>Got Questions?</span>
            </div>
            <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
              Frequently Asked <span style={{ color: 'var(--coral)' }}>Questions</span>
            </h2>
          </div>
        </RevealOnScroll>

        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {faqs.map((f, i) => (
            <RevealOnScroll key={i} delay={i * 0.08}>
              <FaqItem q={f.q} a={f.a} isOpen={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)} />
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* ══════ SOCIAL + CTA ══════ */}
      <section style={{ background: dark ? '#0E0E0E' : '#1C1917', padding: '80px 48px' }}>
        <RevealOnScroll>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 16 }}>Ready to share the ride?</h2>
            <p style={{ color: '#999', fontSize: 16, marginBottom: 32 }}>Join thousands of riders saving money every day.</p>
            <button onClick={() => navigate('/register')} className="hero-cta-btn" style={{ margin: '0 auto' }}>
              Start Riding Now →
            </button>
          </div>

          {/* Social Icons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, margin: '48px 0' }}>
            {[
              { name: 'Instagram', color: '#E4405F', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
              { name: 'X', color: '#fff', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
              { name: 'LinkedIn', color: '#0077B5', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
              { name: 'Facebook', color: '#1877F2', path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
            ].map(s => (
              <a key={s.name} href="#" className="social-icon" style={{ '--brand-color': s.color }} title={s.name}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d={s.path} /></svg>
              </a>
            ))}
          </div>
        </RevealOnScroll>

        {/* Footer */}
        <div style={{ maxWidth: 1100, margin: '48px auto 0', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, background: 'var(--coral)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 7v10l8 5 8-5V7L12 2z" stroke="white" strokeWidth="2" strokeLinejoin="round" /><circle cx="12" cy="12" r="2.5" fill="white" /></svg>
              </div>
              <span style={{ fontSize: 17, fontWeight: 700, color: 'white' }}>Urban<span style={{ color: 'var(--coral-light)' }}>Ride</span></span>
            </div>
            <p style={{ color: '#888', fontSize: 13, lineHeight: 1.7, maxWidth: 220 }}>Making urban commutes affordable, social, and sustainable — one shared ride at a time.</p>
          </div>
          {[
            { heading: 'PRODUCT', links: ['Features', 'How It Works', 'Pricing', 'FAQ'] },
            { heading: 'COMPANY', links: ['About Us', 'Careers', 'Blog', 'Press'] },
            { heading: 'LEGAL', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'] },
          ].map(col => (
            <div key={col.heading}>
              <p style={{ color: '#777', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 18 }}>{col.heading}</p>
              {col.links.map(link => (
                <p key={link} style={{ marginBottom: 12 }}>
                  <a href="#" style={{ color: '#999', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = 'var(--coral)'}
                    onMouseLeave={e => e.target.style.color = '#999'}>{link}</a>
                </p>
              ))}
            </div>
          ))}
        </div>

        <div style={{ maxWidth: 1100, margin: '40px auto 0', borderTop: '1px solid #2A2622', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: '#666', fontSize: 13 }}>© 2026 UrbanRide. All rights reserved.</p>
          <p style={{ color: '#666', fontSize: 13 }}>Made with 🧡 for a greener planet</p>
        </div>
      </section>
    </div>
  );
}