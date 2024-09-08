import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/authContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { HiEye, HiEyeOff } from "react-icons/hi";


const Welcome = () => {
  const inputRef = useRef(null);
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);
  const [isFocusedRepeat, setIsFocusedRepeat] = useState(false);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false)
  const { baseUrl, X_REQUEST_STR, setIsAdminPasswordSet } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true)
    try {
      if (!password || !repeatPassword) {
        setError('Both password fields are required.');
      } else if (password !== repeatPassword) {
        setError('Passwords do not match.');
      } else if (password.length < 6) {
        setError('Password must be at least 6 characters.');
      } else {
        setError(null);
        const response = await axios.post(`${baseUrl}/api/auth/set-admin-password`,
          { "password": password },
          { headers: { 'X-Requested-With': X_REQUEST_STR } }
        );
        setIsAdminPasswordSet(true);
      }
    } catch (e) {
      setError(e.toString())
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  /*
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex flex-grow flex-col justify-center items-center bg-gray-50 p-4">
          <Card className="w-full max-w-md">
            <div className="text-2xl font-thin text-gray-800 mb-2 text-center">Set Admin Password</div>
            <p className="font-light text-gray-800 dark:text-gray-400 text-md md:text-lg lg:text-xl mb-4">
              To get started, set your admin password. Re-enter it to avoid typos.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="mb-2 block">
                <FloatingLabel
                  ref={inputRef}
                  id="password"
                  type="password"
                  variant="standard"
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  helperText="Min of 6 characters"
                  autoComplete="off"
                  required />
              </div>
              <div className="mb-2 block">
                <FloatingLabel
                  id="repeat-password"
                  type="text"
                  variant="standard"
                  label="Repeat Password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  autoComplete="off"
                  required />
              </div>
              {error && <p className="text-xs font-light text-red-500">{error}</p>}
              <Button type="submit" color="blue">Set Password</Button>
            </form>
          </Card>
        </div>
        <Footer />
      </div >
    );
  */
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-grow items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-lg">
          <h1 className="text-3xl font-light text-gray-900 mb-6 text-center">Set Admin Password</h1>

          <form onSubmit={handleSubmit}>
            <div className="relative mb-6">
              <input
                ref={inputRef}
                type="text"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsFocusedPassword(true)}
                onBlur={() => setIsFocusedPassword(password.length > 0 ? true : false)}
                className={`block w-full px-4 py-2 border ${isFocusedPassword ? 'border-gray-700' : 'border-gray-300'} rounded-md bg-transparent text-gray-900 placeholder-transparent focus:outline-none transition-colors`}
                placeholder="Current Password"
                required
              />
              <label
                htmlFor="password"
                className={`absolute left-4 px-1 transition-all bg-white ${isFocusedPassword || password ? 'text-xs top-[-0.5rem]' : 'text-sm top-2'} text-gray-500`}
              >
                Password
              </label>
            </div>

            <div className="relative mb-6">
              <input
                type={showPassword ? 'text' : 'password'}
                id="repeat-password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                onFocus={() => setIsFocusedRepeat(true)}
                onBlur={() => setIsFocusedRepeat(repeatPassword.length > 0 ? true : false)}
                className={`block w-full px-4 py-2 border ${isFocusedRepeat ? 'border-gray-700' : 'border-gray-300'} rounded-md bg-transparent text-gray-900 placeholder-transparent focus:outline-none transition-colors`}
                placeholder="New Password"
                required
              />
              <label
                htmlFor="repeat-password"
                className={`absolute left-4 px-1 transition-all bg-white ${isFocusedRepeat || repeatPassword ? 'text-xs top-[-0.5rem]' : 'text-sm top-2'} text-gray-500`}
              >
                Repeat Password
              </label>
              <button
                type="button"
                className="absolute inset-y-0 right-4 flex items-center"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <HiEyeOff className="h-5 w-5 text-gray-500" />
                ) : (
                  <HiEye className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>

            <blockquote className="mb-4 text-blue-600 border-l-4 border-blue-600 pl-4 text-sm font-light">
              Password must be strong and a minimum of 6 characters.
            </blockquote>

            {error && (
              <blockquote className="mt-4 text-red-600 border-l-4 border-red-600 pl-4 text-sm font-light">
                {error}
              </blockquote>
            )}

            <div className="flex justify-center">
              <button
                type="submit"
                className="mt-6 px-6 py-2 bg-black text-white text-sm font-semibold uppercase tracking-wide rounded-md hover:bg-gray-800 transition-colors"
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
};

export default Welcome;
