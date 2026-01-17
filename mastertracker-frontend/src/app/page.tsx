/*
Purpose: This file contains the main page component for the application, responsible for 
handling user authentication and conditionally rendering the TaskManager or PasswordAuth component.

Variables Summary:
- isAuthenticated: Boolean state indicating if the user has been authenticated, checked from localStorage.
- isLoading: Boolean state for the initial loading phase while checking authentication.
- handleAuthenticated: Function that sets isAuthenticated to true when login succeeds.

These variables manage the authentication flow, showing a loading spinner initially, the auth form if not authenticated, or the main TaskManager if authenticated.
*/

'use client';

import React, { useState, useEffect } from 'react';
import TaskManager from "./TaskManager";
import PasswordAuth from "./components/PasswordAuth";

// Home page, asks user for a password to access the web application. 
// isLoading is the loading status
// isAunthenticated dictates if the user can access the web app
export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const authenticated = localStorage.getItem('taskmaster_authenticated') === 'true';
  // eslint-disable-next-line react-hooks/set-state-in-effect    
    setIsAuthenticated(authenticated);
    setIsLoading(false);
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordAuth onAuthenticated={handleAuthenticated} />;
  }

  return <TaskManager />;
}
