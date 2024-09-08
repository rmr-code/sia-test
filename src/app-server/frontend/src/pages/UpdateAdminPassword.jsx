import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/authContext';
import HeaderWithMenu from '../components/HeaderWithMenu';
import Footer from '../components/Footer';
import { HiEye, HiEyeOff } from "react-icons/hi";
import toast, { Toaster } from 'react-hot-toast';

const UpdateAdminPassword = () => {

  const { baseUrl, X_REQUEST_STR } = useAuth()
  const inputRef = useRef(null)

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatNewPassword, setRepeatNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isFocusedCurrent, setIsFocusedCurrent] = useState(false);
  const [isFocusedNew, setIsFocusedNew] = useState(false);
  const [isFocusedRepeat, setIsFocusedRepeat] = useState(false);

  const [error, setError] = useState(null);
  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      // Validate new passwords
      if (!currentPassword || !newPassword || !repeatNewPassword) {
        setError('All fields are required.');
        return;
      }

      if (newPassword !== repeatNewPassword) {
        setError('New passwords do not match.');
        return;
      }

      //if (newPassword.length < 8) {
      //  setError('New password must be at least 8 characters.');
      //  return;
      //}

      // Make an API call to update the password

      const response = await axios.post(`${baseUrl}/api/auth/change-password`,
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        { withCredentials: true, headers: { 'X-Requested-With': X_REQUEST_STR } });

      toast('Password updated');
    } catch (e) {
      setError(e.toString());
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  /*
  return (
    <div className="flex flex-col h-screen">
      <HeaderWithMenu /> 
      <div className="flex flex-grow flex-col justify-center items-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-lg border border-gray-200">
          <h1 className="text-2xl font-thin text-gray-800 mb-6 text-center">
            Update Admin Password
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="current-password" className="block text-sm font-thin text-gray-700">
                Current Password
              </label>
              <input
                id="current-password"
                name="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 block w-full px-1 py-2 border-b border-gray-300 focus:border-gray-800 focus:outline-none placeholder:font-thin sm:text-sm"
                placeholder="Enter current password"
                required
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="new-password"
                name="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter new password"
                required
              />
            </div>
            <div>
              <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirm-new-password"
                name="confirm-new-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Re-type new password"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            {successMessage && (
              <p className="text-sm text-green-600">{successMessage}</p>
            )}
            <div>
              <button
                type="submit"
                className="w-full flex justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
  */

  return (
    <div className="flex flex-col h-screen">
      <HeaderWithMenu />
      <div className="flex flex-grow items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-lg">
          <h1 className="text-3xl font-light text-gray-900 mb-6 text-center">Update Admin Password</h1>

          <form onSubmit={handleSubmit}>
            <div className="relative mb-6">
              <input
                type="text"
                id="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                onFocus={() => setIsFocusedCurrent(true)}
                onBlur={() => setIsFocusedCurrent(currentPassword.length > 0 ? true : false)}
                className={`block w-full px-4 py-2 border ${isFocusedCurrent ? 'border-gray-700' : 'border-gray-300'} rounded-md bg-transparent text-gray-900 placeholder-transparent focus:outline-none transition-colors`}
                placeholder="Current Password"
                required
              />
              <label
                htmlFor="current-password"
                className={`absolute left-4 px-1 transition-all bg-white ${isFocusedCurrent || currentPassword ? 'text-xs top-[-0.5rem]' : 'text-sm top-2'} text-gray-500`}
              >
                Current Password
              </label>
            </div>

            <div className="relative mb-6">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => setIsFocusedNew(true)}
                onBlur={() => setIsFocusedNew(newPassword.length > 0 ? true : false)}
                className={`block w-full px-4 py-2 border ${isFocusedNew ? 'border-gray-700' : 'border-gray-300'} rounded-md bg-transparent text-gray-900 placeholder-transparent focus:outline-none transition-colors`}
                placeholder="New Password"
                required
              />
              <label
                htmlFor="new-password"
                className={`absolute left-4 px-1 transition-all bg-white ${isFocusedNew || newPassword ? 'text-xs top-[-0.5rem]' : 'text-sm top-2'} text-gray-500`}
              >
                New Password
              </label>
              <button
                type="button"
                className="absolute inset-y-0 right-4 flex items-center"
                onClick={toggleNewPasswordVisibility}
              >
                {showNewPassword ? (
                  <HiEyeOff className="h-5 w-5 text-gray-500" />
                ) : (
                  <HiEye className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>

            <div className="relative mb-6">
              <input
                type="text"
                id="repeat-new-password"
                value={repeatNewPassword}
                onChange={(e) => setRepeatNewPassword(e.target.value)}
                onFocus={() => setIsFocusedRepeat(true)}
                onBlur={() => setIsFocusedRepeat(repeatNewPassword.length > 0 ? true : false)}
                className={`block w-full px-4 py-2 border ${isFocusedRepeat ? 'border-gray-700' : 'border-gray-300'} rounded-md bg-transparent text-gray-900 placeholder-transparent focus:outline-none transition-colors`}
                placeholder="Repeat New Password"
                required
              />
              <label
                htmlFor="repeat-new-password"
                className={`absolute left-4 px-1 transition-all bg-white ${isFocusedRepeat || repeatNewPassword ? 'text-xs top-[-0.5rem]' : 'text-sm top-2'} text-gray-500`}
              >
                Repeat New Password
              </label>
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
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
      <Toaster
        position="bottom-center"
        gutter={8}
        toastOptions={{
          duration: 2000,
        }}
      />
    </div>
  );

}

export default UpdateAdminPassword;
