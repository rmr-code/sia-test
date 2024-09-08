import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/authContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { HiEye, HiEyeOff } from "react-icons/hi";

const Login = () => {

  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { setIsLoggedIn, baseUrl, X_REQUEST_STR } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const username = 'admin'
      const response = await axios.post(`${baseUrl}/api/auth/login`,
        { 'username': username, 'password': password },
        { headers: { 'X-Requested-With': X_REQUEST_STR } }
      );
      setIsLoggedIn(true);
      console.log(4)
      navigate('/agents')

    } catch (e) {
      setError(e.toString())
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

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-grow items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm bg-white border border-gray-200 p-8 rounded-lg">
          <h1 className="text-3xl font-light text-gray-900 mb-6 text-center">Login</h1>
          <p className="text-gray-600 text-center mb-8">Enter Admin Password</p>

          <form onSubmit={handleSubmit}>
            <div className="relative mb-6">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(password.length > 0 ? true : false)}
                className={`block w-full px-4 py-2 border ${isFocused ? 'border-gray-700' : 'border-gray-300'} rounded-md bg-transparent text-gray-900 placeholder-transparent focus:outline-none transition-colors`}
                placeholder="Password"
                autoComplete="off"
                required
              />
              <label
                htmlFor="password"
                className={`absolute left-4 px-1 transition-all bg-white ${isFocused || password ? 'text-xs top-[-0.5rem]' : 'text-sm top-2'} text-gray-500`}
              >
                Password
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

            <div className="flex justify-center">
              <button
                type="submit"
                className="mt-6 px-6 py-2 bg-black text-white text-sm font-semibold uppercase tracking-wide rounded-md hover:bg-gray-800 transition-colors"
              >
                Submit
              </button>
            </div>
          </form>
          {error && (
            <blockquote className="mt-4 text-red-600 border-l-4 border-red-600 pl-4 text-sm font-light">
              {error}
            </blockquote>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
