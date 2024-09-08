import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Welcome = () => {
  return (
    <div className="flex flex-col h-screen">
      <Header /> {/* Insert the dynamic header */}
      <div className="flex flex-grow flex-col justify-center items-center bg-gray-100 p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">Welcome</h1>
          <p className="text-gray-700 mb-6 font-thin">
            Thank you for downloading the software. To get started, please set your admin password.
          </p>
          <Link to="/set-admin-password">
            <button className="w-full flex justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Set Admin Password
            </button>
          </Link>
        </div>
      </div>
      <Footer/>
    </div>
  );
}

export default Welcome;
