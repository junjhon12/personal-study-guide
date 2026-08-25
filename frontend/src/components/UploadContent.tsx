import React, { useState, useCallback } from 'react';

export default function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setErrorMessage('Please upload a valid PDF textbook.');
      setUploadStatus('error');
      return;
    }

    try {
      setUploadStatus('uploading');
      setErrorMessage(null);

      // Request the Presigned URL from your backend API Gateway
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/dev';
      const response = await fetch(`${apiUrl}/upload-url`, { method: 'POST' });

      if (!response.ok) throw new Error('Failed to fetch presigned URL.');
      
      const { uploadUrl, fileKey } = await response.json();

      // Upload the PDF directly to AWS S3
      const s3Response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/pdf' },
        body: file,
      });

      if (!s3Response.ok) throw new Error('Failed to upload file to S3.');

      // File is in S3. The backend event trigger will now invoke DeepSeek.
      setUploadStatus('processing');
      console.log('Upload successful. File Key:', fileKey);
      
      
    } catch (error: any) {
      console.error(error);
      setUploadStatus('error');
      setErrorMessage(error.message || 'An unexpected error occurred.');
    }
  };

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
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const pollProcessingStatus = async (fileKey: string) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/dev';
  
  const checkStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/status/${encodeURIComponent(fileKey)}`);
      const data = await response.json();

      if (data.status === 'COMPLETED') {
        setUploadStatus('completed');
        // TODO: Redirect to the study space or fetch the generated questions
      } else if (data.status === 'FAILED') {
        setUploadStatus('error');
        setErrorMessage('AI processing failed. Please try again.');
      } else {
        // Still processing, poll again in 3 seconds
        setTimeout(checkStatus, 3000); 
      }
    } catch (error) {
      console.error("Polling error:", error);
    }
  };

  checkStatus();
};
  return (
    <div 
      className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        
        {uploadStatus === 'idle' && (
          <>
            <p className="text-lg font-medium text-gray-700">Drag and drop your textbook PDF here</p>
            <p className="text-sm text-gray-500">or click to browse from your computer</p>
            <input type="file" accept="application/pdf" className="hidden" id="file-upload" onChange={onFileSelect} />
            <label htmlFor="file-upload" className="px-6 py-2 mt-4 text-sm font-medium text-white bg-blue-600 rounded-md cursor-pointer hover:bg-blue-700">
              Select File
            </label>
          </>
        )}

        {uploadStatus === 'uploading' && <p className="text-lg font-medium text-blue-600">Uploading securely to S3...</p>}
        {uploadStatus === 'processing' && <p className="text-lg font-medium text-purple-600">Upload complete! AI is generating your study guide...</p>}
        {uploadStatus === 'error' && <p className="text-lg font-medium text-red-600">Error: {errorMessage}</p>}
      </div>
    </div>
  );
}