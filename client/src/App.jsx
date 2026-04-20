import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import VerifyOtp from './pages/VerifyOtp.jsx';
import Dashboard from './pages/Dashboard.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, logout } = useAuth();
  return (
    <>
      <nav>
        <Link to="/">Home</Link>
        {!user && <Link to="/login">Login</Link>}
        {!user && <Link to="/register">Register</Link>}
        {user && <Link to="/dashboard">Dashboard</Link>}
        {user && <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Logout</a>}
        {user && <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>{user.email}</span>}
      </nav>
      <Routes>
        <Route path="/" element={<div className="container"><h1>Thora bahut Secure MERN App</h1><p className="muted">If u want to break this website, just connect to our seniors : Modassir Da, Adil Da, Koustav Da, Purbayan Da, Pankaj Da :)</p></div>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      </Routes>
    </>
  );
}
