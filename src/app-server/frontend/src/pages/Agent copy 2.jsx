import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import axios from 'axios';
import HeaderWithMenu from '../components/HeaderWithMenu';
import Footer from '../components/Footer';
import { HiChevronDoubleLeft } from "react-icons/hi";
import { MdOutlineEdit } from "react-icons/md";
import { HiArrowCircleRight } from "react-icons/hi";
import { HiX } from "react-icons/hi";
import { HiOutlineTrash } from "react-icons/hi";

import { PiSpinnerLight } from "react-icons/pi";
import toast, { Toaster } from 'react-hot-toast';

function Agent() {

  const navigate = useNavigate()
  const { baseUrl, X_REQUEST_STR, } = useAuth()

  const { agentname } = useParams();  // Get the agentname from the URL if it exists
  const nameRef = useRef(null)
  const dataRef = useRef(null)

  const [tab, setTab] = useState(1)
  const [mode, setMode] = useState('R')
  const [infoerror, setInfoError] = useState('')
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [status, setStatus] = useState('');
  const [embeddingsstatus, setEmbeddingStatus] = useState('')

  const [existingFiles, setExistingFiles] = useState([]);  // Initially empty for new agents
  const [newFiles, setNewFiles] = useState([]);
  const [deletedFiles, setDeletedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);  // Track drag and drop state

  const allowedFileTypes = ['application/pdf', 'text/plain']; // Allowed MIME types

  // Function to normalize backend files into the same structure as uploaded files
  const normalizeFiles = (backendFiles) => {
    const normalized = backendFiles.map((filename) => ({
      name: filename,
      source: 'existing',
    }));
    setExistingFiles(normalized);
    setNewFiles([]) // this is required since the function is called from resetAgent
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

    // Initialize arrays to track invalid and duplicate files
    const invalidFiles = [];
    const duplicateFiles = [];

    const filteredUploadedFiles = uploadedFiles.filter((file) => {
      // Check if the file type is allowed
      if (!allowedFileTypes.includes(file.type)) {
        invalidFiles.push(file.name); // Track invalid file
        return false;
      }

      // Check if the file already exists in existingFiles or newFiles
      const isDuplicateExisting = existingFiles.some(existingFile => existingFile.name === file.name);
      const isDuplicateNew = newFiles.some(newFile => newFile.name === file.name);

      if (isDuplicateExisting || isDuplicateNew) {
        duplicateFiles.push(file.name); // Track duplicate file
        return false; // Exclude duplicate files
      }

      return true; // Keep non-duplicate and valid files
    });

    // Normalize and add the non-duplicate, valid files to the newFiles state
    const normalizedUploadedFiles = filteredUploadedFiles.map((file) => ({
      name: file.name,
      file: file,  // Store the actual file object
      source: 'upload',
    }));

    setNewFiles((prevFiles) => [...prevFiles, ...normalizedUploadedFiles]);

    // Show a single toast for both invalid and duplicate files
    if (invalidFiles.length > 0 || duplicateFiles.length > 0) {
      const invalidFilesMessage = invalidFiles.length > 0 ? `Invalid file types: ${invalidFiles.join(', ')}` : '';
      const duplicateFilesMessage = duplicateFiles.length > 0 ? `Duplicate files: ${duplicateFiles.join(', ')}` : '';
      const message = `${invalidFilesMessage} ${duplicateFilesMessage}`.trim();
      toast.error(message);
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

  // Fetch agent data if we're editing an existing agent
  useEffect(() => {
    if (agentname) {
      async function fetchAgent() {
        try {
          const response = await axios.get(`${baseUrl}/api/agents/${agentname}`, { withCredentials: true, headers: { 'X-Requested-With': X_REQUEST_STR } });
          const data = response.data;
          if (data) {
            // store data for resetting values
            dataRef.current = data
            setName(data.name);
            setInstructions(data.instructions);
            setStatus(data.status);
            setEmbeddingStatus(data.embeddings_status)
            normalizeFiles(data.files || []);
            setMode('R')
          }
        } catch (e) {
          setInfoError(e.toString())
        }
      }
      fetchAgent();
    }
    else {
      setMode('W')
    }
  }, [agentname]);

  const handleBasicInfoSubmit = async (e) => {
    e.preventDefault();

    setMode('R')
    setInfoError('')
    setLoading(true)

    const formData = new FormData();
    formData.append('name', name);
    formData.append('instructions', instructions);
    formData.append('status', status)

    try {
      if (agentname) {
        const response = await axios.put(`${baseUrl}/api/agents/${name}`,
          formData,
          { withCredentials: true, headers: { 'X-Requested-With': X_REQUEST_STR } }
        );
      }
      else {
        const response = await axios.post(`${baseUrl}/api/agents`,
          formData,
          { withCredentials: true, headers: { 'X-Requested-With': X_REQUEST_STR } }
        );
        const data = response.data;
        navigate(`/agent/${data.agentname}`)
      }
    } catch (e) {
      setInfoError(e.toString())
      setMode('W')
    }
    finally {
      setLoading(false)
    }
  }

  const handleFilesSubmit = async (e) => {
    e.preventDefault();

    setMode('R')
    setInfoError('')
    setLoading(true)

    const formData = new FormData();
    // Append new files to FormData
    newFiles.forEach((file) => {
      formData.append('newfiles', file.file);  // Include actual file objects
    });

    // Append deleted files as a list
    deletedFiles.forEach((fileName) => {
      formData.append('deletedfiles', fileName);  // Send the list of files to delete
    });

    try {
      const response = await axios.put(`${baseUrl}/api/agents/${name}/files`,
        formData,
        { withCredentials: true, headers: { 'X-Requested-With': X_REQUEST_STR } }
      );
    } catch (e) {
      setInfoError(e.toString())
      setMode('W')
    }
    finally {
      setLoading(false)
    }
  }

  const handleAgentReset = (e) => {
    setMode('R')
    if (dataRef.current) {
      // update state
      setName(dataRef.current.name)
      setInstructions(dataRef.current.instructions)
      setStatus(dataRef.current.status)
      normalizeFiles(dataRef.current.files || []);
    }
  }

  const onTabClick = (tab) => {
    // ignore if mode is 'W' and if loading
    if (mode != 'W' && !loading) {
      setTab(tab)
    }
  }

  useEffect(() => {
    if (tab == 1) {
      if (nameRef.current && mode == 'W') {
        nameRef.current.focus();
      }
    }
  }, [mode]);

  return (
    <div className="flex flex-col min-h-screen">
      <HeaderWithMenu />
      <div className="flex flex-col flex-grow justify-start items-center bg-gray-50 py-6 px-4">
        <div className="w-full max-w-3xl">
          <Link to="/agents" className="flex items-center mb-8 text-sm text-gray-600 hover:text-blue-500 transition">
            <HiChevronDoubleLeft className="inline-block" />
            &nbsp;Back to&nbsp;
            <span className="text-blue-500 font-medium">List of Agents</span>
          </Link>

          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-light text-gray-600">
              Agent: <span className="font-semibold text-gray-900">{name || 'New'}</span>
            </h1>
            <HiX className="hidden text-3xl text-gray-500 cursor-pointer hover:text-red-500 transition" onClick={handleAgentReset} />
          </div>

          <div className="max-w-fit flex flex gap-8 bg-gray-100 p-2">
            <div
              className={`px-2 py-1 text-sm ${mode === "R" ? "cursor-pointer hover:text-gray-800" : "cursor-not-allowed"} ${tab === 1 ? "bg-white font-normal text-gray-800" : "bg-gray-100 text-gray-500"}`}
              onClick={() => onTabClick(1)}
            >
              Basic Info
            </div>
            <div
              className={`px-2 py-1 text-sm ${mode === "R" ? "cursor-pointer hover:text-gray-800" : "cursor-not-allowed"} ${tab === 2 ? "bg-white font-normal text-gray-800" : "bg-gray-100 text-gray-500"}`}
              onClick={() => onTabClick(2)}
            >
              Documents
            </div>
            <div
              className={`px-2 py-1 text-sm ${mode === "R" ? "cursor-pointer hover:text-gray-800" : "cursor-not-allowed"} ${tab === 3 ? "bg-white font-normal text-gray-800" : "bg-gray-100 text-gray-500"}`}
              onClick={() => onTabClick(3)}
            >
              Demo
            </div>
          </div>

          {tab === 1 && (
            <form onSubmit={handleBasicInfoSubmit} className="w-full space-y-6 mt-8">
              <div className="text-md md:text-lg lg:text-xl text-gray-800 mb-6 font-light">
                Enter a short, unique agent name and detailed instructions for the LLM model.
              </div>

              <div>
                <label htmlFor="name" className="font-semibold text-xs text-gray-600">AGENT NAME</label>
                <input
                  ref={nameRef}
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  pattern="[a-z0-9\-]+"
                  disabled={mode === 'R' || agentname}
                  onChange={(e) => setName(e.target.value)}
                  className="disabled:cursor-not-allowed disabled:text-gray-400 mt-1 bg-transparent block w-full py-2 border-b outline-none border-gray-300 focus:border-b focus:border-gray-500 placeholder:font-light text-gray-900 sm:text-sm md:text-md"
                  placeholder="Only letters, digits, and hyphens; no spaces"
                  required
                  autoComplete="off"
                />
              </div>

              <div>
                <label htmlFor="instructions" className="font-semibold text-xs text-gray-600">INSTRUCTIONS</label>
                <textarea
                  id="instructions"
                  value={instructions}
                  disabled={mode === 'R'}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="disabled:cursor-not-allowed disabled:text-gray-400 p-2 mt-1 bg-transparent block w-full py-2 border outline-none border-gray-300 focus:border focus:border-gray-500 placeholder:font-light text-gray-900 sm:text-sm md:text-md"
                  rows={4}
                  placeholder="e.g. You are a friendly assistant to help with queries."
                  required
                  autoComplete="off"
                />
              </div>

              {infoerror && <div className="text-red-600 text-sm font-light mb-4">{infoerror}</div>}

              {mode === 'R' && tab === 1 && !loading && (
                <MdOutlineEdit
                  onClick={() => setMode('W')}
                  className="mt-12 cursor-pointer text-white bg-gray-700 rounded-full text-2xl md:text-3xl p-2 transition hover:bg-blue-600"
                />
              )}

              {mode === 'W' && tab === 1 && !loading && (
                <div className="flex gap-4 items-center">
                  <Button type="submit">Save</Button>

                  <HiX
                    onClick={handleAgentReset}
                    className="cursor-pointer text-white bg-red-500 rounded-full font-semibold text-2xl md:text-3xl p-2 transition hover:bg-red-600"
                  />
                </div>
              )}

              {tab === 1 && loading && (
                <PiSpinnerLight className="mt-4 text-4xl animate-spin text-gray-500" />
              )}
            </form>
          )}

          {tab === 2 && (
            <form onSubmit={handleFilesSubmit} className="w-full space-y-6 mt-8">
              <div className="text-md md:text-lg lg:text-xl text-gray-800 mb-6 font-light">Upload documents (PDF, TXT).</div>

              <div className="flex flex-col gap-4">
                {existingFiles.map((file, index) => (
                  <div className="flex items-center space-x-2" key={index}>
                    <span className="text-gray-600">{index + 1}.</span>
                    <span className="text-gray-900">{file.name}</span>
                    {mode === 'W' && (
                      <HiOutlineTrash
                        onClick={() => handleFileDelete(file.name)}
                        className="w-6 h-6 text-red-600 cursor-pointer hover:text-red-800 transition"
                      />
                    )}
                  </div>
                ))}

                {newFiles.map((file, index) => (
                  <div className="flex items-center space-x-2" key={index}>
                    <span className="text-gray-600">{index + 1 + existingFiles.length}.</span>
                    <span className="text-gray-900">{file.name}</span>
                    {mode === 'W' && (
                      <HiOutlineTrash
                        onClick={() => handleFileDelete(file.name)}
                        className="w-6 h-6 text-red-600 cursor-pointer hover:text-red-800 transition"
                      />
                    )}
                  </div>
                ))}

                {mode === 'W' && (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => document.getElementById('fileInput').click()}
                    className={`mt-2 flex justify-center px-4 py-4 border-2 border-dashed rounded-lg cursor-pointer transition ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
                  >
                    <div className="text-center text-gray-500">
                      <p>Drag and drop files here, or click to select files</p>
                      <input
                        id="fileInput"
                        type="file"
                        disabled={mode === 'R'}
                        multiple
                        onChange={handleFileUpload}
                        accept=".pdf,.txt"
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </div>

              {infoerror && <div className="text-red-600 text-sm font-light mb-4">{infoerror}</div>}

              {mode === 'W' && tab === 2 && !loading && (
                <div className="flex gap-4 items-center">
                  <button type="submit" class="inline-block rounded border border-indigo-600 bg-indigo-600 px-12 py-3 text-sm font-medium text-white hover:bg-transparent hover:text-indigo-600 focus:outline-none focus:ring active:text-indigo-500">
                    Save
                  </button>
                  <HiX
                    onClick={handleAgentReset}
                    className="cursor-pointer text-white bg-red-500 rounded-full font-semibold text-2xl md:text-3xl p-2 transition hover:bg-red-600"
                  />
                </div>
              )}

              {tab === 2 && loading && (
                <PiSpinnerLight className="mt-4 text-4xl animate-spin text-gray-500" />
              )}
            </form>
          )}

          {tab === 3 && (
            <div className="w-full mt-8">
              <p className="text-xl text-gray-800">Demo Tab Content</p>
            </div>
          )}
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
