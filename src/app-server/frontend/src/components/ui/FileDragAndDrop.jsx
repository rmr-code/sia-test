import React, { useState } from 'react';

const FileDragAndDrop = ({ onFilesAdded, accept, disabled, ...rest }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) {
      setIsDragging(false);
      const files = Array.from(event.dataTransfer.files);
      if (onFilesAdded) {
        onFilesAdded(files);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && document.getElementById('fileInput').click()}
      className={`mt-1 block w-full px-4 py-8 border border-dashed rounded-md text-center cursor-pointer transition-colors ${
        isDragging ? 'border-gray-700 bg-gray-50' : 'border-gray-300'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      {...rest}
    >
      <p className="text-gray-500">
        {isDragging ? 'Drop files here...' : 'Drag and drop files here or click to upload.'}
      </p>
      <input
        type="file"
        id="fileInput"
        accept={accept}
        multiple
        onChange={(e) => onFilesAdded(Array.from(e.target.files))}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
};

export default FileDragAndDrop;
