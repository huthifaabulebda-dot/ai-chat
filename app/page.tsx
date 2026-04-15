'use client'

import { useState, useEffect } from 'react';
import AuthForm from '@/components/AuthForm';
import Chat from '@/components/Chat';
import { AppUser } from '@/lib/types';

export default function Home() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  });
  const [user, setUser] = useState<AppUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser) as AppUser;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [isLoadingSession, setIsLoadingSession] = useState(() => {
    if (typeof window === 'undefined') return true;
    return Boolean(localStorage.getItem('token'));
  });

  useEffect(() => {
    const storedToken = localStorage.getItem('token');

    if (storedToken) {
      // Verify token and refresh user data from server.
      fetch('/api/profile', {
        headers: { Authorization: `Bearer ${storedToken}` },
      }).then(res => res.json()).then(data => {
        if (data.user) {
          setToken(storedToken);
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }).catch(() => {
        // Keep cached user data if network is temporarily unavailable.
      }).finally(() => {
        setIsLoadingSession(false);
      });
      return;
    }
  }, []);

  const handleLogin = (newToken: string, newUser: AppUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (isLoadingSession) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Loading your session...</p>
      </div>
    );
  }

  if (token && user) {
    return <Chat token={token} user={user} onLogout={handleLogout} />;
  }

  return <AuthForm onLogin={handleLogin} />;
}
