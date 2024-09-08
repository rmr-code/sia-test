import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import axios from 'axios';
import HeaderWithMenu from '../components/HeaderWithMenu';
import Footer from '../components/Footer';

function Logout() {
  const { setIsLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { baseUrl, X_REQUEST_STR } = useAuth()

  const handleLogout = async () => {
    try {
      // Clear the cookie by calling the backend logout API
      const response = await axios.post(`${baseUrl}/api/auth/logout`, {}, { headers: { 'X-Requested-With': X_REQUEST_STR } });
      // Redirect to home page after logout
      setIsLoggedIn(false)
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
      setIsLoggedIn(false)
      navigate('/')
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  /*
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-grow flex-col justify-center items-center bg-gray-100 p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">Logout</h1>
            <div>
              <p className="text-gray-700 mb-4">
                Are you sure you want to log out? All local data will be cleared.
              </p>
              <div className="flex justify-between space-x-4">
                <PrimaryButton title="Confirm Logout" handleClick={handleConfirmLogout}/>
                <SecondaryButton title="Cancel" handleClick={handleCancel} />
              </div>
            </div>
        </div>
      </div>
      <Footer />
    </div>
  );
  */

  return (
    <div className="flex flex-col h-screen">
      <HeaderWithMenu />
      <div className="flex flex-grow flex-col justify-center items-center bg-gray-50 p-4">

        <div className="w-full max-w-sm bg-white border border-gray-200 p-8 rounded-lg">
          <h1 className="text-3xl font-light text-gray-900 mb-6 text-center">Logout</h1>

          <blockquote className="text-red-600 border-l-4 border-red-600 pl-4 text-sm font-light mb-8">
            All local data will be cleared. Confirm logout.
          </blockquote>

          <div className="flex justify-between">
            <button
              onClick={handleCancel}
              className="px-6 py-2 text-gray-700 text-sm font-semibold uppercase tracking-wide rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-black text-white text-sm font-semibold uppercase tracking-wide rounded-md hover:bg-gray-800 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Logout;
