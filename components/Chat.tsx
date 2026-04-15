'use client'

import Image from 'next/image';
import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useState } from 'react';
import { AppUser, ChatMessage } from '@/lib/types';

export default function Chat({ token, user, onLogout }: { token: string, user: AppUser, onLogout: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user.name, profilePic: user.profilePic });
  const [currentUser, setCurrentUser] = useState(user);
  const [uploading, setUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/chat', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages);
        setErrorMessage('');
        return;
      }
      setErrorMessage(data.error || 'Failed to load your messages.');
    } catch {
      setErrorMessage('Network error while loading messages.');
    }
  }, [token]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { role: 'user', content: text }, { role: 'assistant', content: data.response }]);
        setInput('');
        return;
      }
      setErrorMessage(data.error || 'Message failed to send.');
    } catch {
      setErrorMessage('Network error while sending message.');
    } finally {
      setIsSending(false);
    }
  };

  const startNewChat = async () => {
    if (isClearing) return;
    setIsClearing(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/chat', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setMessages([]);
        setInput('');
        return;
      }
      setErrorMessage(data.error || 'Failed to start a new chat.');
    } catch {
      setErrorMessage('Network error while starting a new chat.');
    } finally {
      setIsClearing(false);
    }
  };

  const updateProfile = async () => {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileForm),
    });
    const data = await res.json();
    if (res.ok) {
      setCurrentUser(data.user);
      setProfileForm({ name: data.user.name, profilePic: data.user.profilePic });
      setShowProfile(false);
    } else {
      alert(data.error);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      setProfileForm({ ...profileForm, profilePic: data.url });
    } else {
      alert(data.error);
    }
    setUploading(false);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      void sendMessage();
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-3 py-3 shadow-sm backdrop-blur sm:px-4">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">AI Chat</h1>
            <p className="text-sm text-slate-500">{currentUser.name}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex">
          <button className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 sm:px-4 sm:text-sm" onClick={startNewChat} disabled={isClearing || isSending}>
            {isClearing ? 'Resetting...' : 'New Chat'}
          </button>
          <button className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 sm:px-4 sm:text-sm" onClick={() => setShowProfile(true)}>My Account</button>
          <button className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 sm:px-4 sm:text-sm" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-hidden px-3 py-3 sm:p-4">
        <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block max-w-[90%] rounded-2xl px-3 py-2 text-sm sm:max-w-[80%] sm:px-4 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-400">Start the conversation by sending your first message.</p>
        )}
        </div>
      </div>
      <div className="border-t border-slate-200 bg-white/95 p-3 sm:p-4">
        <div className="mx-auto w-full max-w-5xl">
          {errorMessage && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p>}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            placeholder="Type your message..."
            disabled={isSending}
          />
          <button onClick={sendMessage} disabled={isSending} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300">{isSending ? 'Sending...' : 'Send'}</button>
        </div>
        </div>
      </div>
      {showProfile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">My Account</h2>
            <input
              type="text"
              placeholder="Name"
              value={profileForm.name || currentUser.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="mb-2 w-full rounded-lg border border-slate-300 p-2 text-sm"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="mb-2 w-full rounded-lg border border-slate-300 p-2 text-sm"
              disabled={uploading}
            />
            {uploading && <p>Uploading...</p>}
            {profileForm.profilePic && (
              <Image src={profileForm.profilePic} alt="Profile" width={80} height={80} className="w-20 h-20 mb-2 rounded-full" />
            )}
            <div className="flex justify-between">
              <button onClick={updateProfile} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Update</button>
              <button onClick={() => setShowProfile(false)} className="rounded-lg bg-slate-500 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}