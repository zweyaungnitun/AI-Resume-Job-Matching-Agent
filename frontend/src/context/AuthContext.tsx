import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiLoginWithPassword, apiSignup, apiRefreshToken, apiAuthLogout } from '../services/api';

interface AuthUser {
  email: string;
  name?: string;
  picture?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loginWithGoogle: (credentialResponse: any) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeJwt(token: string): Record<string, any> | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  // Treat token as expired 60 s before actual expiry so we can refresh proactively
  return Date.now() / 1000 > payload.exp - 60;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const storeSession = useCallback((accessToken: string, refreshToken: string, userData: AuthUser) => {
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('auth_refresh_token', refreshToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    const current = localStorage.getItem('auth_token');
    if (current) apiAuthLogout(current);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }, []);

  // Restore session on mount, silently refresh if expired
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedRefresh = localStorage.getItem('auth_refresh_token');
    const storedUser = localStorage.getItem('auth_user');

    if (!storedToken || !storedUser) return;

    let parsedUser: AuthUser;
    try {
      parsedUser = JSON.parse(storedUser);
    } catch {
      logout();
      return;
    }

    if (!isTokenExpired(storedToken)) {
      setToken(storedToken);
      setUser(parsedUser);
      return;
    }

    // Access token expired — try refresh
    if (storedRefresh) {
      apiRefreshToken(storedRefresh)
        .then((data) => {
          localStorage.setItem('auth_token', data.access_token);
          if (data.refresh_token) localStorage.setItem('auth_refresh_token', data.refresh_token);
          setToken(data.access_token);
          setUser(parsedUser);
        })
        .catch(() => logout());
    } else {
      logout();
    }
  }, [logout]);

  // Handle OAuth server-side redirect: /?access_token=...&refresh_token=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!accessToken) return;

    const payload = decodeJwt(accessToken);
    if (!payload?.email) return;

    const userData: AuthUser = { email: payload.email, name: payload.name };
    storeSession(accessToken, refreshToken ?? '', userData);

    // Clean up URL without a page reload
    const clean = window.location.pathname;
    window.history.replaceState({}, '', clean);
  }, [storeSession]);

  const loginWithGoogle = async (credentialResponse: any) => {
    const idToken = credentialResponse.credential;
    if (!idToken) throw new Error('No Google credential received');

    const response = await fetch(`${window.location.origin}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Google authentication failed');
    }

    const data = await response.json();
    const payload = decodeJwt(idToken);
    const userData: AuthUser = {
      email: payload?.email ?? '',
      name: payload?.name,
      picture: payload?.picture,
    };
    storeSession(data.access_token, data.refresh_token, userData);
  };

  const loginWithPassword = async (email: string, password: string) => {
    const data = await apiLoginWithPassword(email, password);
    const userData: AuthUser = { email };
    storeSession(data.access_token, data.refresh_token, userData);
  };

  const signup = async (email: string, password: string, name?: string) => {
    const data = await apiSignup(email, password, name);
    const userData: AuthUser = { email, name };
    storeSession(data.access_token, data.refresh_token, userData);
  };

  return (
    <AuthContext.Provider value={{
      user, token,
      isAuthenticated: !!token && !!user,
      loginWithGoogle, loginWithPassword, signup, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
