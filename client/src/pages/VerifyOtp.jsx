import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';

export default function VerifyOtp() {
  const [params] = useSearchParams();
  const nav = useNavigate();

  const [email, setEmail] = useState(params.get('email') || '');
  const [otp, setOtp] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const verify = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');

    try {
      await api.post('/auth/verify-otp', { email, otp });
      setMsg('Verified! Redirecting to login…');
      setTimeout(() => nav('/login'), 800);
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed');
    }
  };

  const resend = async () => {
    setErr('');
    setMsg('');

    try {
      await api.post('/auth/resend-otp', { email });
      setMsg('OTP sent if account exists.');
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed');
    }
  };

  return (
    <div className="container auth-container">
      <div className="auth-card">

        <h2>Verify your email</h2>

        <form onSubmit={verify}>

          <div className="field">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
            />
          </div>

          <div className="field">
            <input
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="makaa laadle 6 digit OTP daal"
            />
          </div>

          {err && <div className="error">{err}</div>}
          {msg && <div className="ok">{msg}</div>}

          <div className="row" style={{ gap: '10px', display: 'flex' }}>
            <button type="submit">Verify</button>
            <button
              type="button"
              className="secondary"
              onClick={resend}
            >
              Resend
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}