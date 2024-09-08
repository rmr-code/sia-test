import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import HeaderWithMenu from '../components/HeaderWithMenu';
import Footer from '../components/Footer';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import ErrorButton from '../components/ErrorButton';
import { HiX, HiOutlineTrash } from "react-icons/hi";
import { HiChevronDoubleLeft } from "react-icons/hi";
//import { ToastContainer, toast } from 'react-toastify';
//import 'react-toastify/dist/ReactToastify.css';
import toast, { Toaster } from 'react-hot-toast';

function Agent() {
  const { agentname } = useParams();  // Get the agentname from the URL if it exists
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
        const response = await axios.put(`/api/agents/${name}`, formData, { withCredentials: true });
        setMode('R')
      }
      else {
        const response = await axios.post('/api/agents', formData, { withCredentials: true });
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
      <HeaderWithMenu />
      <div className="flex flex-grow flex-col justify-start items-center bg-gray-50 p-4">
        <div className="w-full max-w-3xl">
          <Link to="/agents"><div className="flex items-center mb-2 text-sm text-blue-500 font-thin"><HiChevronDoubleLeft />&nbsp;to&nbsp; <span className="font-normal">List of Agents</span></div></Link>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Agent</h1>
          </div>
          <div className="flex gap-8 font-thin text-gray-800 text-lg">
            <div>Basic Info</div>
            <div>Documents</div>
            <div>Demo</div>
          </div>
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
