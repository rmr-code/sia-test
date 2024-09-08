import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/authContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

const SetAdminPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const {baseUrl, X_REQUEST_STR } = useAuth()
  const { setIsAdminPasswordSet } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!password || !confirmPassword) {
        setError('Both password fields are required.');
      } else if (password !== confirmPassword) {
        setError('Passwords do not match.');
        //    } else if (password.length < 8) {
        //      setError('Password must be at least 8 characters.');
      } else {
        setError(null);
        const response = await axios.post(`${baseUrl}/api/auth/set-admin-password`, 
          {"password": password },
          {headers: {'X-Requested-With': X_REQUEST_STR }}
        );
        setIsAdminPasswordSet(true);
      }
    } catch (e) {
      setError(e.toString())
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header /> {/* Insert the dynamic header */}
      <div className="flex flex-grow flex-col justify-center items-center bg-gray-100 p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Set Admin Password
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Admin Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter a strong password"
                required
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Re-type your password"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div>
              <button
                type="submit"
                className="w-full flex justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Set Password
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default SetAdminPassword;
