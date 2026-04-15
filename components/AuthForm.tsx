'use client'

import { FormEvent, useState } from 'react';
import { AppUser } from '@/lib/types';

export default function AuthForm({ onLogin }: { onLogin: (token: string, user: AppUser) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        onLogin(data.token, data.user);
        return;
      }
      setErrorMessage(data.error || 'Authentication failed.');
    } catch {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 text-xl font-semibold text-slate-900 sm:text-2xl">{isLogin ? 'Welcome back' : 'Create account'}</h2>
        <p className="mb-4 text-sm text-slate-500">{isLogin ? 'Login to continue chatting with AI.' : 'Register to start using the AI chat.'}</p>
        {!isLogin && (
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mb-2 w-full rounded-xl border border-slate-300 p-2 text-sm"
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="mb-2 w-full rounded-xl border border-slate-300 p-2 text-sm"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="mb-2 w-full rounded-xl border border-slate-300 p-2 text-sm"
          required
        />
        {errorMessage && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 p-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300">
          {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
        </button>
        <button type="button" onClick={() => setIsLogin(!isLogin)} className="mt-2 w-full text-sm text-indigo-600 hover:text-indigo-700">
          {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
        </button>
      </form>
    </div>
  );
}