import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

const STRONG = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');

    if (!STRONG.test(password)) {
      return setErr('Password must be 8+ chars with uppercase, lowercase, number, and special char.');
    }

    if (password !== confirm) {
      return setErr('Passwords do not match.');
    }

    setLoading(true);

    try {
      await api.post('/auth/register', { email, password });
      nav(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (e) {
      setErr(e.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container auth-container">
      <div className="auth-card">

        <h2>Create account</h2>

        <form onSubmit={submit}>

          <div className="field">
            <input
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
            />
          </div>

          <div className="field">
            <input
              type="password"
              required
              maxLength={128}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="new-password"
            />
          </div>

          <div className="field">
            <input
              type="password"
              required
              maxLength={128}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Confirm password"
              autoComplete="new-password"
            />
          </div>

          <p className="muted" style={{ fontSize: '13px' }}>
            Min 8 chars with UPPER, lower, number, special char.
          </p>

          {err && <div className="error">{err}</div>}

          <button disabled={loading}>
            {loading ? 'Creating…' : 'Register'}
          </button>

        </form>

        <p className="muted">
          Already registered? <Link to="/login">Login</Link>
        </p>

      </div>
    </div>
  );
}