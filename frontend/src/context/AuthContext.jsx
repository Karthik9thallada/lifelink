import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('lifelink_token');
      const storedUser = localStorage.getItem('lifelink_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to parse cached auth state:', e);
      localStorage.removeItem('lifelink_token');
      localStorage.removeItem('lifelink_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    const userInfo = {
      email: data.email,
      name: data.name,
      role: data.role,
    };
    localStorage.setItem('lifelink_token', data.token);
    localStorage.setItem('lifelink_user', JSON.stringify(userInfo));
    setToken(data.token);
    setUser(userInfo);
    return userInfo;
  };

  const register = async (userData) => {
    const data = await authApi.register(userData);
    const userInfo = {
      email: data.email,
      name: data.name,
      role: data.role,
    };
    localStorage.setItem('lifelink_token', data.token);
    localStorage.setItem('lifelink_user', JSON.stringify(userInfo));
    setToken(data.token);
    setUser(userInfo);
    return userInfo;
  };

  const logout = () => {
    localStorage.removeItem('lifelink_token');
    localStorage.removeItem('lifelink_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        isDonor: user?.role === 'DONOR',
        isHospital: user?.role === 'HOSPITAL',
        isAdmin: user?.role === 'ADMIN',
        login,
        register,
        logout,
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
