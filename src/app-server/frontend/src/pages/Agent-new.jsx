import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import ErrorButton from '../components/ErrorButton';
import { HiX, HiOutlineTrash } from "react-icons/hi";
//import { ToastContainer, toast } from 'react-toastify';
//import 'react-toastify/dist/ReactToastify.css';
import toast, { Toaster } from 'react-hot-toast';

function Agent() {
  const { agentname } = useParams();  // Get the agentname from the URL if it exists
  const [activeTab, setActiveTab] = useState('Basic Info');
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('Draft');

  const [existingFiles, setExistingFiles] = useState([]);  // Initially empty for new agents
  const [newFiles, setNewFiles] = useState([]);
  const [deletedFiles, setDeletedFiles] = useState([]);

  const [mode, setMode] = useState('W') // W for write, R for read
  const [isDragging, setIsDragging] = useState(false);  // Track drag and drop state
  const [error, setError] = useState(null);
  const [shouldDelete, setShouldDelete] = useState(false)
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { baseUrl, X_REQUEST_STR  } = useAuth()


  // Function to normalize backend files into the same structure as uploaded files
  const normalizeFiles = (backendFiles) => {
    const normalized = backendFiles.map((filename) => ({
      name: filename,
      source: 'existing',
    }));
    setExistingFiles(normalized);
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    let uploadedFiles = [];

    // Normalize the file input event and drag-and-drop event
    if (event.target && event.target.files) {
      // File input event
      uploadedFiles = Array.from(event.target.files);
    } else if (event.dataTransfer && event.dataTransfer.files) {
      // Drag-and-drop event
      uploadedFiles = Array.from(event.dataTransfer.files);
    }
    // Track duplicate files
    const duplicateFiles = [];

    const filteredUploadedFiles = uploadedFiles.filter((file) => {
      // Check if the file already exists in existingFiles or newFiles
      const isDuplicateExisting = existingFiles.some(existingFile => existingFile.name === file.name);
      const isDuplicateNew = newFiles.some(newFile => newFile.name === file.name);

      // If the file is a duplicate, add it to the duplicateFiles array
      if (isDuplicateExisting || isDuplicateNew) {
        duplicateFiles.push(file.name);
        return false;  // Exclude duplicate files
      }

      return true;  // Keep non-duplicate files
    });

    // Normalize and add the non-duplicate files to the newFiles state
    const normalizedUploadedFiles = filteredUploadedFiles.map((file) => ({
      name: file.name,
      file: file,  // Store the actual file object
      source: 'upload',
    }));

    setNewFiles((prevFiles) => [...prevFiles, ...normalizedUploadedFiles]);

    // Alert the user if there were any duplicate files
    if (duplicateFiles.length > 0) {
      toast("Duplicate files have been ignored.");
    }
  };

  // Handle file deletion (checking both new and existing files)
  const handleFileDelete = (fileName) => {
    const existingFileToDelete = existingFiles.find(file => file.name === fileName);
    const newFileToDelete = newFiles.find(file => file.name === fileName);

    if (existingFileToDelete) {
      setDeletedFiles([...deletedFiles, existingFileToDelete.name]);  // Mark existing file for deletion
      setExistingFiles(existingFiles.filter(file => file.name !== fileName));  // Remove from existing files list
    } else if (newFileToDelete) {
      setNewFiles(newFiles.filter(file => file.name !== fileName));  // Remove from new files list
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('')
    setIsLoading(true)

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('status', status)
    // Append new files to FormData
    newFiles.forEach((file) => {
      formData.append('newfiles', file.file);  // Include actual file objects
    });

    // Append deleted files as a list
    deletedFiles.forEach((fileName) => {
      formData.append('deletedfiles', fileName);  // Send the list of files to delete
    });

    try {
      if (agentname) {
        const response = await axios.put(`${baseUrl}/api/agents/${name}`, formData, { withCredentials: true });
        setMode('R')
      }
      else {
        const response = await axios.post('${baseUrl}/api/agents', formData, {withCredentials: true, headers: {'X-Requested-With': X_REQUEST_STR }});
        const data = response.data;
        navigate(`/agents/${data.agentname}`)
      }
    } catch (e) {
      setError(e.toString())
    }
    finally {
      setIsLoading(false)
    }
  };

  const editClick = (e) => {
    setMode('W')
  }

  const xClick = (e) => {
    if (mode == 'R') {
      navigate('/')
    }
    else {
      setMode('R')
    }
  }

  const deleteConfirm = (e) => {
    setShouldDelete(true)
  }

  const resetDeleteConfirm = (e) => {
    setShouldDelete(false)
  }

  const handleDeleteAgent = async (e) => {
    e.preventDefault();
    setError('')

    try {
      if (agentname) {
        const response = await axios.delete(`/api/agents/${agentname}`, { withCredentials: true });
        navigate('/agents')
      }
    } catch (e) {
      setError(e.toString())
    }
    finally {
      setShouldDelete(false)
    }
  }

  // Fetch agent data if we're editing an existing agent
  useEffect(() => {
    if (agentname) {
      async function fetchAgent() {
        try {
          const response = await axios.get(`/api/agents/${agentname}`, { withCredentials: true });
          const data = response.data;
          setName(data.name);
          setDescription(data.description);
          setStatus(data.status);
          normalizeFiles(data.files || []);
          setMode('R')
        } catch (e) {
          setError(e.toString())
        }
      }
      fetchAgent();
    }
  }, [agentname]);


  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex-grow flex bg-gray-100 p-4">
        <div className="w-full max-w-3xl bg-white p-8 rounded-lg shadow-lg">
          <div className="flex">
            <h1 className="text-2xl font-semibold text-gray-800 mb-6">
              {agentname ? 'Edit Agent' : 'Create Agent'}
            </h1>
            <div className="flex-1"></div>
            <HiX className='text-3xl text-blue-600 cursor-pointer' onClick={xClick} />
          </div>
          <form onSubmit={handleSubmit} className="space-y-6" enctype="multipart/form-data">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                disabled={agentname || mode == 'R'}
                onChange={(e) => setName(e.target.value)}
                pattern="[a-zA-Z0-9\-]+"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Agent name (letters, digits, hyphens only)"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                disabled={mode == 'R' ? "disabled" : ""}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Agent description"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="block text-sm font-medium text-gray-700">Documents:</label>

              <div className="flex flex-col gap-2">
                {existingFiles.map((file, index) => {
                  return (
                    <div className="flex space-x-2">
                      <span>{index + 1}.</span>
                      <span>{file.name}</span>
                      <span className="flex-1">&nbsp;</span>
                      {mode == "W" && <HiOutlineTrash onClick={(e) => handleFileDelete(file.name)} className="w-6 h-6 text-red-600 cursor-pointer" />}
                    </div>
                  )
                })}
                {newFiles.map((file, index) => {
                  return (
                    <div className="flex space-x-2">
                      <span>{index + 1 + existingFiles.length}.</span>
                      <span>{file.name}</span>
                      <span className="flex-1">&nbsp;</span>
                      {mode == "W" && <HiOutlineTrash onClick={handleFileDelete} className="w-6 h-6 text-red-600 cursor-pointer" />}
                    </div>
                  )
                })}

              </div>

              {mode == 'W' &&
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => document.getElementById('fileInput').click()}  // Trigger file input on click
                  className={`mt-1 flex justify-center px-4 py-2 border-2 border-dashed rounded-md cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
                    }`}
                >
                  <div className="text-center text-gray-500">
                    <p>Drag and drop files here, or click to select files</p>
                    <input
                      id="fileInput"
                      type="file"
                      disabled={mode == 'R' ? "disabled" : ""}
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              }
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                value={status}
                disabled={mode == 'R' ? "disabled" : ""}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="Draft">Draft</option>
                <option value="Production">Production</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {mode == 'W' &&
              <PrimaryButton type="submit" title={agentname ? isLoading ? 'Saving...' : 'Update Agent' : isLoading ? 'Saving...' : 'Create Agent'} />
            }

            {mode == 'R' && agentname != "" && !shouldDelete &&
              <div className="flex gap-2">
                <PrimaryButton title="Edit" handleClick={editClick} />
                <ErrorButton title="Delete" handleClick={deleteConfirm} />
              </div>
            }
            {mode == 'R' && agentname != "" && shouldDelete &&
              <div className="flex flex-col gap-2">
                <label>Are you sure?</label>
                <div className="flex gap-2">
                  <ErrorButton title="Confirm" handleClick={handleDeleteAgent} />
                  <SecondaryButton title="Cancel" handleClick={resetDeleteConfirm} />
                </div>
              </div>
            }
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

export default Agent;
