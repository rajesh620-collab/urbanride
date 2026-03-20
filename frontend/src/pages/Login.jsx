import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ phone: '', otp: '' });
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
      const res = await api.post('/auth/login', form);
      const { user: userData, token } = res.data.data || res.data;
      login(userData, token);
      navigate('/search');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
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
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
            Smart last-mile connectivity
          </p>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 20, marginBottom: 6 }}>Welcome back</h3>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>
            Sign in to your account with your mobile number
          </p>

          {error && <div className="alert-error">{error}</div>}
          {success && <div className="alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Mobile Number</label>
              <input name="phone" type="text" value={form.phone}
                onChange={handleChange} placeholder="9876543210" required disabled={otpSent} />
            </div>

            {otpSent && (
              <div className="field">
                <label>Enter OTP</label>
                <input name="otp" type="text" value={form.otp}
                  onChange={handleChange} placeholder="123456" autoComplete="one-time-code" required autoFocus />
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}
              style={{ marginTop: 8 }}>
              {loading ? 'Processing...' : (otpSent ? 'Sign In' : 'Send OTP')}
            </button>
          </form>

          <hr className="divider" />
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="link-text">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}