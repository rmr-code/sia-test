import { useState, useEffect } from 'react';
import FileDragAndDrop from './ui/FileDragAndDrop';
import FilledButton from './ui/FilledButton';
import PlainButton from './ui/PlainButton';
import { HiOutlineTrash } from 'react-icons/hi';
import ErrorBlock from './ui/ErrorBlock';
import InfoBlock from './ui/InfoBlock';
import { toast } from 'react-hot-toast';


const AgentFiles = ({ agentData, isEditMode, onSave, toggleEditMode, error }) => {
  const [existingFiles, setExistingFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [filesToDelete, setFilesToDelete] = useState([]);

  const acceptedFileTypes = ['application/pdf', 'text/plain'];

  useEffect(() => {
    normalizeFiles(agentData.files || []);
  }, [agentData]);

  const normalizeFiles = (backendFiles) => {
    const normalized = backendFiles.map((filename) => ({
      name: filename,
      source: 'existing',
    }));
    setExistingFiles(normalized);
    setNewFiles([]); 
    setFilesToDelete([]);
  };

  const handleFileAdd = (files) => {
    let ignoredFiles = 0;
    let duplicateFiles = 0;

    const normalizedFiles = Array.from(files)
      .filter(file => {
        if (!acceptedFileTypes.includes(file.type)) {
          ignoredFiles++;
          return false;
        }
        return true;
      })
      .filter(file => {
        const isDuplicate = existingFiles.some(existingFile => existingFile.name === file.name) ||
                            newFiles.some(newFile => newFile.name === file.name);
        if (isDuplicate) {
          duplicateFiles++;
        }
        return !isDuplicate;
      })
      .map((file) => ({
        file,
        name: file.name,
        source: 'new',
      }));

    if (ignoredFiles > 0 || duplicateFiles > 0) {
      toast('Duplicate files and Unsupported file have been ignored');
    }

    setNewFiles((prevFiles) => [...prevFiles, ...normalizedFiles]);
  };

  const handleExistingFileRemove = (index) => {
    const fileToRemove = existingFiles[index];
    setFilesToDelete((prev) => [...prev, fileToRemove]);
    setExistingFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleNewFileRemove = (index) => {
    setNewFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const newDocuments = newFiles.map((fileObj) => fileObj.file);
    const documentsToDelete = filesToDelete.map((fileObj) => fileObj.name);

    onSave({
      newfiles: newDocuments,
      deletedfiles: documentsToDelete,
    });

    toggleEditMode();
    normalizeFiles([...existingFiles.map((file) => file.name), ...newDocuments.map((file) => file.name)]);
  };

  const handleCancel = () => {
    toggleEditMode();
    normalizeFiles(agentData.documents || []);
  };

  return (
    <div>
      <div className="mb-6">
        {(existingFiles.length > 0 || newFiles.length > 0) && (
          <div>
            {existingFiles.map((file, index) => (
              <div key={`existing-${index}`} className="flex items-center justify-between mb-2">
                <span>{`${index + 1}. ${file.name}`}</span>
                {isEditMode && (
                  <HiOutlineTrash
                    onClick={() => handleExistingFileRemove(index)}
                    className="text-gray-700 cursor-pointer hover:text-red-700 transition-colors"
                  />
                )}
              </div>
            ))}
            {newFiles.map((file, index) => (
              <div key={`new-${index}`} className="flex items-center justify-between mb-2">
                <span>{`${existingFiles.length + index + 1}. ${file.name}`}</span>
                {isEditMode && (
                  <HiOutlineTrash
                    onClick={() => handleNewFileRemove(index)}
                    className="text-gray-700 cursor-pointer hover:text-red-700 transition-colors"
                  />
                )}
              </div>
            ))}
          </div>
          )}
          {!isEditMode &&
          <div className="flex justify-between items-center mt-8">
            {existingFiles.length ==0 && <InfoBlock>No documents available.</InfoBlock>}
            <p className="flex-1"></p>
            <FilledButton onClick={toggleEditMode}>Edit Documents</FilledButton>
          </div>
          }
      </div>

      {isEditMode && (
        <>
          <FileDragAndDrop
            onFilesAdded={handleFileAdd}
            accept=".pdf,.txt"
            disabled={false}
          />
          <div className="flex justify-between items-center mt-8">
            {error && <ErrorBlock>{error}</ErrorBlock>}
            <div className="flex space-x-4 items-center ml-auto">
              <PlainButton onClick={handleCancel}>Cancel</PlainButton>
              <FilledButton onClick={handleSave}>Save Changes</FilledButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
};


export default AgentFiles;
