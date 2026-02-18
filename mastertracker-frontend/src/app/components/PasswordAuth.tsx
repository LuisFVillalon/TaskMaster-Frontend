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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-200">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center">
              <Image
                src="/icon.svg"
                alt="Favicon"
                width={240}
                height={120}
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">TaskMaster</h1>
            <p className="text-gray-600">Type “recruiter” to try the demo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                  placeholder="Enter password"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
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
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Continue'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            Luis Villalón © 2026
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordAuth;