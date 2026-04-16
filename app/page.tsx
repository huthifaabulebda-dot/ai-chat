'use client'

import { useState, useEffect } from 'react';
import Chat from '@/components/Chat';
import { AppUser } from '@/lib/types';

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const initializeGuest = () => {
    const storedGuestId = localStorage.getItem('guestId') || crypto.randomUUID();
    if (!localStorage.getItem('guestId')) {
      localStorage.setItem('guestId', storedGuestId);
    }
    const guestToken = `guest:${storedGuestId}`;
    const guestUser: AppUser = { id: storedGuestId, name: 'Guest', profilePic: '' };
    setToken(guestToken);
    setUser(guestUser);
  };

  useEffect(() => {
    initializeGuest();
    setIsLoadingSession(false);
  }, []);

  if (isLoadingSession || !token || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Loading chat...</p>
      </div>
    );
  }

  return <Chat token={token} user={user} />;
}
