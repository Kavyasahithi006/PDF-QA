import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { useDocuments } from '../context/DocumentContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  extractTextByPage,
  createTextChunks,
  loadEmbeddingModel,
  embedText,
} from '../utils/pdfRag';

const UploadPage: React.FC = () => {
  const {
    addDocument,
    setDocumentPages,
    setChunks,
    setIsProcessing,
    setProcessingProgress,
    setError: setContextError,
    setHistory,
  } = useDocuments();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsUploading(true);
      setLocalError(null);

      try {
        setIsProcessing(true);
        setProcessingProgress(0);
        setHistory([]);

        // Step 1: Extract text by page
        setProcessingProgress(10);
        const pages = await extractTextByPage(file);

        if (pages.every((page) => !page.text.trim())) {
          setLocalError(
            'This PDF appears to be scanned. Text extraction is not supported yet.'
          );
          setIsProcessing(false);
          setIsUploading(false);
          return;
        }

        setProcessingProgress(30);
        setDocumentPages(pages);

        // Step 2: Create chunks
        const pageChunks = createTextChunks(pages);
        setProcessingProgress(50);

        // Step 3: Load embedding model and embed chunks
        const embedder = await loadEmbeddingModel();
        setProcessingProgress(60);

        const chunksWithEmbeddings = [];
        for (let i = 0; i < pageChunks.length; i += 1) {
          const chunk = pageChunks[i];
          const embedding = await embedText(chunk.text, embedder);
          chunksWithEmbeddings.push({
            ...chunk,
            embedding,
          });
          setProcessingProgress(60 + Math.floor((i / pageChunks.length) * 30));
        }

        setChunks(chunksWithEmbeddings);
        setProcessingProgress(95);

        // Step 4: Upload document metadata to backend
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(
          'http://localhost:8000/upload/',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );

        const newDocument = {
          id: response.data.id,
          name: file.name,
          uploadDate: new Date().toISOString(),
          size: file.size,
        };

        addDocument(newDocument);
        setProcessingProgress(100);

        setTimeout(() => {
          setIsProcessing(false);
          navigate(`/qa/${newDocument.id}`);
        }, 500);
      } catch (err) {
        console.error('Upload error:', err);
        const errorMessage =
          (err as any)?.response?.data?.detail ||
          'Failed to process the document. Please try again.';
        setLocalError(errorMessage);
        setContextError(errorMessage);
        setIsProcessing(false);
      } finally {
        setIsUploading(false);
      }
    },
    [addDocument, setDocumentPages, setChunks, setIsProcessing, setProcessingProgress, setContextError, setHistory, navigate]
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
              ? 'Processing your document...'
              : isDragActive
              ? 'Drop your PDF here'
              : 'Drag & drop your PDF here, or click to select'}
          </p>
          <p className="mt-3 text-sm text-gray-500 select-none">Only PDF files are accepted.</p>
        </div>

        {localError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8 p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl text-center shadow-sm select-text"
            role="alert"
          >
            {localError}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default UploadPage;
