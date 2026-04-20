import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const r = await api.get('/auth/me');
      setUser(r.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMe(); }, []);

  const login = async (email, password) => {
    await api.post('/auth/login', { email, password });
    await fetchMe();
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, refresh: fetchMe }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
