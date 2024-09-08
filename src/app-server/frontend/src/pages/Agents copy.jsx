import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import axios from 'axios';
import HeaderWithMenu from '../components/HeaderWithMenu';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { baseUrl, X_REQUEST_STR  } = useAuth()

  useEffect(() => {
    async function fetchAgents() {
      try {
        const response = await axios.get(`${baseUrl}/api/agents`, {withCredentials: true, headers: {'X-Requested-With': X_REQUEST_STR }});
        const data = response.data;
        if(data) {
          setAgents(data);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
      finally {
        setLoading(false)
      }
    }
    fetchAgents();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <HeaderWithMenu />
      <div className="flex flex-grow flex-col justify-start items-center bg-gray-100 p-4">
        <div className="w-full max-w-3xl bg-white p-8 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">List of Agents</h1>
            <Link to="/agent">
              <button className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Create Agent
              </button>
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner /> // Show loading spinner while data is being fetched
          ) : agents.length === 0 ? (
            <p className="text-gray-700 font-thin">No agents found. Create a new agent to list it here.</p>
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
}

export default Agents;
