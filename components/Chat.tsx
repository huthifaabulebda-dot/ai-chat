'use client'

import { KeyboardEvent, useCallback, useEffect, useState } from 'react';
import { AppUser, ChatMessage } from '@/lib/types';

export default function Chat({ token, user }: { token: string, user: AppUser }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [inputDir, setInputDir] = useState<'ltr' | 'rtl'>('ltr');
  const [isSending, setIsSending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const getDirection = (text: string): 'ltr' | 'rtl' => {
    const trimmed = text.trim();
    if (!trimmed) return 'ltr';
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(trimmed[0]) ? 'rtl' : 'ltr';
  };

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
            <p className="text-sm text-slate-500">{user.name}</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex">
            <button className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 sm:px-4 sm:text-sm" onClick={startNewChat} disabled={isClearing || isSending}>
              {isClearing ? 'Resetting...' : 'New Chat'}
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-hidden px-3 py-3 sm:p-4">
        <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
              <div className={`inline-block max-w-[90%] rounded-2xl px-3 py-2 text-sm sm:max-w-[80%] sm:px-4 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'}`} dir={getDirection(msg.content)}>
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
              dir={inputDir}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setInputDir(getDirection(e.target.value));
              }}
              onKeyDown={handleInputKeyDown}
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              placeholder="Type your message..."
              disabled={isSending}
            />
            <button onClick={sendMessage} disabled={isSending} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300">
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
