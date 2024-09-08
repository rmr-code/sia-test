import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import axios from 'axios';
import HeaderWithMenu from '../components/HeaderWithMenu';
import Footer from '../components/Footer';
import Card from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import Title from '../components/ui/Title';
import AgentInfo from '../components/AgentInfo';
import AgentFiles from '../components/AgentFiles';
import AgentDemo from '../components/AgentDemo';
import { Toaster } from 'react-hot-toast';

const Agent = () => {

  const navigate = useNavigate()
  const { baseUrl, X_REQUEST_STR, } = useAuth()
  const { agentname } = useParams();  // Extracting agentname from the URL parameters
  const [agentData, setAgentData] = useState({
    name: '',
    instructions: '',
    welcome_message: '',
    suggested_prompts: ['','',''],
    files: [],
    status: '',
    embeddings_status: ''
  });
  const [isEditMode, setIsEditMode] = useState(!agentname);
  const [activeTab, setActiveTab] = useState('Info');
  const [isLoading, setIsLoading] = useState(false);
  const [embeddingsStatus, setEmbeddingsStatus] = useState(null);
  const [error, setError] = useState(null);

  const tabs = [
    { label: 'Info', value: 'Info' },
    { label: 'Docs', value: 'Docs' },
    { label: 'Demo', value: 'Demo' },
  ];

  useEffect(() => {
    if (agentname) {
      fetchAgentData(agentname);
    }
  }, [agentname]);

  const fetchAgentData = async (agentname) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`${baseUrl}/api/agents/${agentname}`, {
        withCredentials: true,
        headers: { 'X-Requested-With': X_REQUEST_STR },
      });
      const data = response.data;
      if (data) {
        // Ensure suggested_prompts has 3 elements
        if (data.suggested_prompts.length < 3) {
          data.suggested_prompts = [...data.suggested_prompts, ...Array(3 - data.suggested_prompts.length).fill('')];
        }
        setAgentData(data);
        setEmbeddingsStatus(data.embeddings_status);
      }
      setIsEditMode(false);
    } catch (err) {
      setError('Failed to load agent data.');
    } finally {
      setIsLoading(false);
    }
  };

  const convert2FormData = (data) => {
    const formData = new FormData();
    for (const key in data) {
      if (Array.isArray(data[key])) {
        // append each value with same key
        for(let i=0; i < data[key].length; i++) {
          formData.append(key, data[key][i])
        }
      }
      else {
        // append the key-value
        formData.append(key, data[key]);
      }
    }
    return formData
  }

  const handleSaveInfo = async (upd_data) => {
    try {
      setIsLoading(true);
      setError(null);

      let response;
      const formData = convert2FormData(upd_data)
      if (agentname) {
        // For existing agent (PUT request)

        response = await axios.put(
          `${baseUrl}/api/agents/${agentData.name}/info`,
          formData,
          {
            withCredentials: true,
            headers: { 'X-Requested-With': X_REQUEST_STR },
          }
        );
      } else {
        // For new agent (POST request)
        response = await axios.post(
          `${baseUrl}/api/agents`,
          formData,
          {
            withCredentials: true,
            headers: { 'X-Requested-With': X_REQUEST_STR },
          }
        );
        const newAgentName = response.data.name;
        navigate(`/agent/${newAgentName}`);
      }

      const updatedData = response.data;
      
      // Ensure suggested_prompts has 3 elements
      if (updatedData.suggested_prompts.length < 3) {
          updatedData.suggested_prompts = [...updatedData.suggested_prompts, ...Array(3 - updatedData.suggested_prompts.length).fill('')];
      }
      
      setAgentData((prevData) => ({
        ...prevData,
        ...updatedData,
      }));
      setIsEditMode(false)
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFiles = async (upd_data) => {
    try {
      setIsLoading(true);
      setError(null);
      const formData = new FormData();
      // Append new files to FormData
      upd_data.newfiles.forEach((file) => {
        formData.append('newfiles', file);  // Include actual file objects
      });
  
      // Append deleted files as a list
      upd_data.deletedfiles.forEach((fileName) => {
        formData.append('deletedfiles', fileName);  // Send the list of files to delete
      });
      const response = await axios.put(
        `${baseUrl}/api/agents/${agentData.name}/files`,
        formData,
        {
          withCredentials: true,
          headers: { 'X-Requested-With': X_REQUEST_STR },
        }
      );
      const updatedData = response.data;
      setAgentData((prevData) => ({
        ...prevData,
        ...updatedData,
      }));
    } catch (err) {
      console.log(err)
      setError('Failed to save documents.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEditMode = () => {
    setIsEditMode((prevMode) => !prevMode);
  };

  const handleTabChange = (tab) => {
    if (!isEditMode && !isLoading) {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen flex flex-col h-screen">
      <HeaderWithMenu />
      <div className="flex-grow flex flex-col items-center bg-gray-50 p-6">
        <Card>
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
              <div className="text-gray-700">Saving...</div>
            </div>
          )}
          <div className="flex justify-between items-center mb-6">
            <Title>Agent: {agentname || 'new'}</Title>
          </div>

          {embeddingsStatus === 'A' && (
            <div className="flex justify-between items-center mb-6">
              <div className="bg-red-100 text-red-700 p-4 rounded-md">
                Documents being processed. Refresh to check.
              </div>
            </div>
          )}

          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

          {activeTab === 'Info' && (
            <AgentInfo
              agentData={agentData}
              isEditMode={isEditMode}
              onSave={handleSaveInfo}
              toggleEditMode={toggleEditMode}
              error={error}
              onReturn={() => navigate('/agents')} // Return to Agents button
            />
          )}
          {activeTab === 'Docs' && (
            <AgentFiles
              agentData={agentData}
              isEditMode={isEditMode}
              onSave={handleSaveFiles}
              toggleEditMode={toggleEditMode}
              error={error}
            />
          )}
          {activeTab === 'Demo' && <AgentDemo agentData={agentData} />}
        </Card>
      </div>
      <Footer />
      <Toaster
        position="bottom-center"
        gutter={8}
        toastOptions={{
          duration: 2000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
};


export default Agent;
