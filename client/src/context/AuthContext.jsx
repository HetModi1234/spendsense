import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('spendsense_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('spendsense_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('spendsense_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error('Failed to restore session:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: jwt, user: userData } = res.data;
      setToken(jwt);
      setUser(userData);
      localStorage.setItem('spendsense_token', jwt);
      localStorage.setItem('spendsense_user', JSON.stringify(userData));
      toast.success(`Welcome back, ${userData.name}!`);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      const { token: jwt, user: registeredUser } = res.data;
      setToken(jwt);
      setUser(registeredUser);
      localStorage.setItem('spendsense_token', jwt);
      localStorage.setItem('spendsense_user', JSON.stringify(registeredUser));
      toast.success('Account created successfully! Welcome to SpendSense AI.');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('spendsense_token');
    localStorage.removeItem('spendsense_user');
    toast.success('Logged out successfully.');
  };

  const updateUser = (updated) => {
    setUser(updated);
    localStorage.setItem('spendsense_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
