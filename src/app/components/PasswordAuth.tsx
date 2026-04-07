/*
Purpose: This component handles password-based authentication for the application,
validating the entered password against an environment variable and managing the login flow.

Variables Summary:
- password: String state holding the user's entered password.
- error: String state for displaying error messages (e.g., incorrect password or config issues).
- isLoading: Boolean state indicating if the authentication is in progress.
- onAuthenticated: Function prop called when authentication succeeds to notify the parent component.

These variables are used to manage the form state, validate input, and provide user feedback during the authentication process.
*/

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

interface PasswordAuthProps {
  onAuthenticated: (isDemo: boolean) => void;
}

const PasswordAuth: React.FC<PasswordAuthProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Check password against environment variable
    const correctPassword = process.env.NEXT_PUBLIC_APP_PASSWORD;
    const demoPassword = process.env.NEXT_PUBLIC_APP_DEMO_PASSWORD;

    if (!correctPassword) {
      setError('Password not configured. Please contact administrator.');
      setIsLoading(false);
      return;
    }

    // Simple delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));

    let isDemo = false;
    if (password === correctPassword) {
      isDemo = false;
    } else if (password === demoPassword) {
      isDemo = true;
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
      setIsLoading(false);
      return;
    }

    // Store authentication in localStorage
    localStorage.setItem('taskmaster_authenticated', 'true');
    localStorage.setItem('taskmaster_demo', isDemo ? 'true' : 'false');
    onAuthenticated(isDemo);

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="max-w-md w-full animate-slide-up">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center">
              <Image
                src="/icon.svg"
                alt="Favicon"
                width={240}
                height={120}
              />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">TaskMaster</h1>
            <p className="text-text-secondary text-sm">Type &quot;recruiter&quot; to try the demo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="Enter password"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-secondary transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-center px-3 py-2.5 rounded-xl"
                style={{ color: 'var(--tm-danger)', backgroundColor: 'var(--tm-danger-subtle)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="btn btn-primary w-full py-3 text-base"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Verifying…
                </>
              ) : (
                'Continue'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-text-muted">
            Luis Villalón © 2026
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordAuth;
