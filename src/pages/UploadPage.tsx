import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { useDocuments } from '../context/DocumentContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const UploadPage: React.FC = () => {
  const { addDocument } = useDocuments();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post('http://localhost:8000/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const newDocument = {
          id: response.data.id,
          name: file.name,
          uploadDate: new Date().toISOString(),
          size: file.size,
        };

        addDocument(newDocument);
        navigate(`/qa/${newDocument.id}`);
      } catch (err) {
        console.error('Upload error:', err);
        setError('Failed to upload the document. Please try again.');
      } finally {
        setIsUploading(false);
      }
    },
    [addDocument, navigate]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    disabled: isUploading,
    maxFiles: 1,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-16 px-6 sm:px-12 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-3xl w-full bg-white rounded-3xl shadow-2xl p-12 border border-indigo-100"
      >
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-2">
            Upload Your PDF
          </h1>
          <p className="text-lg text-indigo-600 font-medium">
            Get insights powered by <span className="font-bold">Document AI</span>
          </p>
        </header>

        <div
          {...getRootProps()}
          className={`cursor-pointer transition-all duration-300 rounded-2xl border-4 border-dashed
            flex flex-col items-center justify-center py-20 px-10
            ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                : isUploading
                ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-70'
                : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50'
            }`}
          aria-disabled={isUploading}
        >
          <input {...getInputProps()} />
          <Upload
            className={`h-20 w-20 mb-6 transition-transform ${
              isUploading ? 'text-indigo-400 animate-bounce' : 'text-indigo-300 group-hover:text-indigo-500'
            }`}
          />
          <p className="text-xl font-semibold text-gray-700 select-none">
            {isUploading
              ? 'Uploading your document...'
              : isDragActive
              ? 'Drop your PDF here'
              : 'Drag & drop your PDF here, or click to select'}
          </p>
          <p className="mt-3 text-sm text-gray-500 select-none">Only PDF files are accepted.</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8 p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl text-center shadow-sm select-text"
            role="alert"
          >
            {error}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default UploadPage;
