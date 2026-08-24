import React, { useState, useCallback }  from "react";

export default function UploadContent() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      // Once APi is in-place call for url here
    }
  }, []);

  return (
    <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${isDragging ? 'border-red-500 bg-blue-50' : 'border-blue-500 bg-blue-50 hover:bg-blue-100'}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <div className="flex flex-col items-center justify-center space-y-5">
        <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 20 20">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <p className="text-lg font-medium text-gray-500">
          {selectedFile ? selectedFile.name : 'Drag and drop content PDF here'}
        </p>
        <p className="text-sm text-gray-500" >or browse your PC</p>
        <input type="file" accept="application/pdf" className="hidden" id="file-upload" />
        <label htmlFor="file-upload" className="px-5 py-5 mt-5 text-sm font-medium text-white bg-blue-500 round-md cursor-pointer hover:bg-blue-700">
          Select File
        </label>
      </div>
    </div>
  );
}