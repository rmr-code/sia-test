import Header from '../components/Header';
import Footer from '../components/Footer';

const Loading = () => {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-grow flex-col justify-center items-center bg-gray-100 p-4">
        <div className="w-full max-w-md p-8">
          <h1 className="text-2xl font-thin text-gray-800 mb-6 text-center">
            Loading ...
          </h1>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Loading