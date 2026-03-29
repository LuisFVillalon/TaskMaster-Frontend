'use client';

import React, { useState } from 'react';
import NotesView from '@/app/components/notes/NotesView';
import PasswordAuth from '@/app/components/PasswordAuth';

// Notes page at /notes.
// Reuses the same localStorage-based auth check as the root page so a user
// who hasn't authenticated cannot access the app by navigating directly here.

export default function NotesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('taskmaster_authenticated') === 'true';
  });

  const [isDemo, setIsDemo] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('taskmaster_demo') === 'true';
  });

  const handleAuthenticated = (demo: boolean) => {
    localStorage.setItem('taskmaster_authenticated', 'true');
    localStorage.setItem('taskmaster_demo', demo.toString());
    setIsAuthenticated(true);
    setIsDemo(demo);
  };

  if (!isAuthenticated) {
    return <PasswordAuth onAuthenticated={handleAuthenticated} />;
  }

  return <NotesView isDemo={isDemo} />;
}
