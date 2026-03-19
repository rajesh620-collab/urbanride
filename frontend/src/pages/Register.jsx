import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm]       = useState({ name: '', email: '', password: '', gender: '', phone: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      const { user: userData, token } = res.data.data || res.data;
      login(userData, token);
      navigate('/search');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const pwdStrength = form.password.length === 0 ? null : form.password.length >= 6 ? 'good' : 'weak';

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--cream)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, background: 'var(--coral)',
            borderRadius: '16px', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 14, boxShadow: '0 4px 14px rgba(204,120,92,0.35)'
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 7v10l8 5 8-5V7L12 2z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 26, color: 'var(--charcoal)', letterSpacing: '-0.02em' }}>
            UrbanRide
          </h2>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 20, marginBottom: 6 }}>Create your account</h3>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>
            Join thousands of commuters sharing smarter rides
          </p>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Full name</label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="Rajesh Kumar" required />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Phone (optional)</label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  placeholder="9876543210" />
              </div>
            </div>

            <div className="field" style={{ marginTop: 18 }}>
              <label>Email address</label>
              <input name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="you@example.com" required />
            </div>

            <div className="field">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--muted)', fontSize: 16, padding: 0, lineHeight: 1
                  }}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
              {/* Password strength hint */}
              {pwdStrength && (
                <p style={{
                  fontSize: 12, marginTop: 6,
                  color: pwdStrength === 'good' ? 'var(--success)' : '#C0392B'
                }}>
                  {pwdStrength === 'good' ? '✓ Password looks good' : '✗ Password must be at least 6 characters'}
                </p>
              )}
            </div>

            <div className="field">
              <label>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} required>
                <option value="">Select your gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}
              style={{ marginTop: 4 }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <hr className="divider" />
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="link-text">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}