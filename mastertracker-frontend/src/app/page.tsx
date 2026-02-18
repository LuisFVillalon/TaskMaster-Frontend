/*
Purpose: This file contains the main page component for the application, responsible for 
handling user authentication and conditionally rendering the TaskManager or PasswordAuth component.

Variables Summary:
- isAuthenticated: Boolean state indicating if the user has been authenticated, checked from localStorage.
- isDemo: Boolean state indicating if the user is in demo mode.
- isLoading: Boolean state for the initial loading phase while checking authentication.
- handleAuthenticated: Function that sets isAuthenticated and isDemo when login succeeds.

These variables manage the authentication flow, showing a loading spinner initially, the auth form if not authenticated, or the main TaskManager if authenticated.
*/

'use client';

import React, { useState } from 'react';
import TaskManager from "./TaskManager";
import PasswordAuth from "./components/PasswordAuth";

// Home page, asks user for a password to access the web application. 
// isLoading is the loading status
// isAuthenticated dictates if the user can access the web app
// isDemo indicates demo mode

export default function Page() {
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

  return <TaskManager isDemo={isDemo} />;
}