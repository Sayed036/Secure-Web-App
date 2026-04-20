import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      await login(email, password);
      nav('/dashboard');
    } catch (e) {
      const msg = e.response?.data?.error || 'Login failed';
      const code = e.response?.data?.code;
      if (code === 'NOT_VERIFIED') {
        setErr('Email not verified. Redirecting…');
        setTimeout(() => nav(`/verify-otp?email=${encodeURIComponent(email)}`), 800);
      } else setErr(msg);
    } finally { setLoading(false); }
  };

  return (
  <div className="container auth-container">
    <div className="auth-card">

      <h2>Login</h2>

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
            autoComplete="current-password"
          />
        </div>

        {err && <div className="error">{err}</div>}

        <button disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="muted">
        No account? <Link to="/register">Register</Link>
      </p>

    </div>
  </div>
);
}
