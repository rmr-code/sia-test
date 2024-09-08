import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import axios from 'axios';
import HeaderWithMenu from '../components/HeaderWithMenu';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import { HiPlusCircle } from "react-icons/hi";

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { baseUrl, X_REQUEST_STR, setIsLoggedIn } = useAuth()

  useEffect(() => {
    async function fetchAgents() {
      try {
        const response = await axios.get(`${baseUrl}/api/agents`, { withCredentials: true, headers: { 'X-Requested-With': X_REQUEST_STR } });
        const data = response.data;
        if (data) {
          setAgents(data);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
        if (error.response.status == 403) {
          setIsLoggedIn(false)
        }
      }
      finally {
        setLoading(false)
      }
    }
    fetchAgents();
  }, []);


  /*
    return (
      <div className="flex flex-col h-screen">
        <HeaderWithMenu />
        <div className="flex flex-grow flex-col justify-start items-center bg-gray-50 p-4">
          <div className="w-full max-w-3xl">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-800">List of Agents</h1>
              <Link to="/agent"><HiPlusCircle className="text-3xl md:text-4xl lg:text-5xl"/></Link>
            </div>
  
            {loading ? (
              <LoadingSpinner /> // Show loading spinner while data is being fetched
            ) : agents.length === 0 ? (
              <p className="text-gray-700 font-thin">No agents found. Click on the plus button to create a new agent.</p>
            ) : (
              <table className="min-w-full table-auto">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-700">Agent Name</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id}>
                      <td className="border px-4 py-2">
                        <Link to={`/agent/${agent.name}`} className="text-blue-600 hover:underline">
                          {agent.name}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <Footer />
      </div>
    );
    */

  return (
    <div className="flex flex-col h-screen">
      <HeaderWithMenu />
      <div className="flex flex-grow flex-col justify-start items-center bg-gray-50 p-4">
        <div className="w-full max-w-3xl">
          <h1 className="text-3xl font-light text-gray-900 mb-6">List of Agents</h1>

          {agents.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <ul>
                {agents.map((agent, index) => (
                  <Link to={`/agent/${agent.name}`} key={agent.name} >
                    <li                      
                      className={`flex justify-between px-4 py-2 ${index % 2 === 0 ? 'bg-gray-100' : 'bg-white'
                        }`}
                    >
                      <div className="flex items-center">
                        <span className="mr-4 text-gray-500">{index + 1}.</span>
                        <span className="font-semibold text-gray-900">{agent.name}</span>
                      </div>
                      <div className="text-sm text-gray-500">{agent.lastUpdated}</div>
                    </li>
                  </Link>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex justify-between gap-4 items-center mt-4">
            {agents.length === 0 && (
              <blockquote className="text-blue-600 border-l-4 border-blue-600 pl-4 text-sm font-light">
                No agent found.
              </blockquote>
            )}
            <p className="flex-1"></p>
            <Link to={"/agent/"}>
              <button
                type="button"
                className="text-right whitespace-nowrap ml-auto px-6 py-2 bg-black text-white text-sm font-semibold uppercase tracking-wide rounded-md hover:bg-gray-800 transition-colors"
              >
                Create Agent
              </button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Agents;
