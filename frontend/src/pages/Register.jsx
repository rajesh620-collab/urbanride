import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', address: '', email: '', gender: '', phone: '', otp: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSendOtp = async () => {
    if (!form.phone) {
      setError('Please enter your mobile number first');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { phone: form.phone });
      setSuccess(res.data.message || 'OTP sent successfully. Please check your messages.');
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!otpSent) return handleSendOtp();

    setError('');
    setSuccess('');
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
          {success && <div className="alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Full name</label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="Rajesh Kumar" required disabled={otpSent} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Address</label>
                <input name="address" value={form.address} onChange={handleChange}
                  placeholder="Street, City" required disabled={otpSent} />
              </div>
            </div>

            <div className="field" style={{ marginTop: 18 }}>
              <label>Email address</label>
              <input name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="you@example.com" required disabled={otpSent} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange} required disabled={otpSent}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Mobile Number</label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  placeholder="9876543210" required disabled={otpSent} />
              </div>
            </div>

            {otpSent && (
              <div className="field" style={{ marginTop: 18 }}>
                <label>Enter OTP</label>
                <input name="otp" value={form.otp} onChange={handleChange}
                  placeholder="123456" autoComplete="one-time-code" required autoFocus />
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}
              style={{ marginTop: 24 }}>
              {loading ? 'Processing...' : (otpSent ? 'Verify & Create Account' : 'Send OTP')}
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