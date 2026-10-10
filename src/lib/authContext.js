'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8079/api/v1';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('velotales_token');
      const savedUser = localStorage.getItem('velotales_user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.warn('Failed reading auth from localStorage', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/login-json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.access_token) {
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('velotales_token', data.access_token);
      localStorage.setItem('velotales_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    }
    return { success: false, error: data.detail || 'Login failed' };
  };

  const register = async ({ username, email, displayName, password }) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email,
        display_name: displayName,
        password
      })
    });
    const data = await res.json();
    if (res.ok && data.id) {
      // Auto login after registration
      return await login(username, password);
    }
    return { success: false, error: data.detail || 'Registration failed' };
  };

  const resetPassword = async (email, newPassword) => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, new_password: newPassword })
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, message: data.message };
    }
    return { success: false, error: data.detail || 'Password reset failed' };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('velotales_token');
    localStorage.removeItem('velotales_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isLoggedIn: !!user,
        isBlogger: user?.role === 'blogger' || user?.role === 'admin',
        isAdmin: user?.role === 'admin',
        login,
        register,
        resetPassword,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
