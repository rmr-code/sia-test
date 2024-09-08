import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const Invalid = () => {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-grow flex-col justify-center items-center bg-gray-50 p-4">
        <div className="w-full max-w-md p-8">
          <h1 className="text-2xl font-thin text-gray-800 mb-6 text-center">
            There is no such Page
          </h1>
        </div>
        <Link to="/" className="font-thin text-blue-500">Return to Home</Link>

      </div>
      <Footer />
    </div>
  )
}

export default Invalid