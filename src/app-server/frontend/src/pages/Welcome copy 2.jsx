import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/authContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { HiArrowCircleRight } from "react-icons/hi";
import { PiSpinnerLight } from "react-icons/pi";

const Welcome = () => {
  const inputRef = useRef(null);
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
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

  return (
    <div className="flex flex-col h-screen">
      <Header /> {/* Insert the dynamic header */}
      <div className="flex flex-grow flex-col items-center bg-gray-50 p-4">
        <div className="w-full max-w-md p-8">
          <div className="text-4xl font-semibold text-gray-800 mb-6">Hello.</div>
          <div className="text-md md:text-lg lg:text-xl text-black mb-6 font-thin">
            To get started, set your admin password. Re-enter it to avoid typos.
          </div>
          <div className="flex flex-col gap-2 mb-8">
            <input
              ref={inputRef}
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 bg-transparent block w-full py-2 border-b outline-none border-gray-300 focus:border-b focus:border-gray-600 placeholder:font-thin font-normal text-blue-500 sm:text-sm md:text-md"
              placeholder="Enter a strong password of min 6 chars"
              required
            />
            <input
              id="repeat-password"
              name="repeat-password"
              type="text"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className="mt-1 bg-transparent block w-full py-2 border-b outline-none border-gray-300 focus:border-b focus:border-gray-600 placeholder:font-thin font-normal text-blue-500 sm:text-sm md:text-md"
              placeholder="Re-enter the above password"
              required
            />
            {error && <div className="text-red-800 font-thin text-sm">{error}</div>}
            
            {!loading && <HiArrowCircleRight onClick={handleSubmit} className='mt-4 cursor-pointer text-blue-500 text-4xl md:text-5xl lg:text-6xl mb-4' />}
            {loading && <PiSpinnerLight className="mt-4 text-3xl md:text-4xl lg:text-5xl mb-4 animate-spin" />}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Welcome;
