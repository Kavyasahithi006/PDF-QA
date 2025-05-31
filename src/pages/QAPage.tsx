import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDocuments } from '../context/DocumentContext';
import { MessageSquare, Send } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const QAPage: React.FC = () => {
  const { documentId } = useParams();
  const { selectedDocument, questions, addQuestion, selectDocument } = useDocuments();
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    selectDocument(documentId || null);
  }, [documentId, selectDocument]);

  const documentQuestions = selectedDocument
    ? questions.filter(q => q.documentId === selectedDocument.id)
    : [];

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion.trim() || !selectedDocument) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:8000/ask', {
        document_id: selectedDocument.id,
        question: currentQuestion,
      });

      addQuestion({
        id: response.data.id,
        documentId: response.data.document_id,
        question: response.data.question,
        answer: response.data.answer,
        timestamp: response.data.timestamp,
      });

      setCurrentQuestion('');
    } catch (error) {
      console.error('Error submitting question:', error);
      setError('Failed to get an answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedDocument) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6 text-center">
        <MessageSquare className="w-20 h-20 text-indigo-300 mb-6 drop-shadow-md" />
        <h2 className="text-3xl font-semibold text-gray-700 mb-3">No Document Selected</h2>
        <p className="text-gray-500 max-w-md">
          Please select a document to start asking questions.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 sm:p-10">
      {/* Document Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="bg-gradient-to-r from-indigo-50 via-white to-indigo-50 rounded-2xl shadow-xl p-7 mb-8 border border-indigo-200"
      >
        <h2 className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">
          Document: <span className="text-indigo-600">{selectedDocument.name}</span>
        </h2>
        <p className="text-sm text-gray-500 font-medium">
          Uploaded on {new Date(selectedDocument.uploadDate).toLocaleDateString()}
        </p>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-5 bg-red-100 border border-red-300 text-red-800 rounded-lg shadow-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Q&A Section */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 mb-10 border border-gray-100">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6 tracking-wide">Q&A</h3>

        {documentQuestions.length === 0 ? (
          <div className="text-center py-12 text-indigo-200 select-none">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 drop-shadow-lg" />
            <p className="text-lg font-medium">No questions asked yet. Start by asking a question about this document!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {documentQuestions.map((qa) => (
              <motion.div
                key={qa.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * documentQuestions.indexOf(qa) }}
                className="rounded-2xl bg-indigo-50 p-6 border border-indigo-200 shadow-sm"
              >
                <p className="text-indigo-700 font-semibold text-lg mb-2 select-text">Q: {qa.question}</p>
                <p className="text-gray-900 whitespace-pre-wrap mb-3 select-text">A: {qa.answer}</p>
                <p className="text-xs text-gray-400 font-mono">{new Date(qa.timestamp).toLocaleString()}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Question Input */}
      <form onSubmit={handleSubmitQuestion} className="flex flex-col sm:flex-row gap-5">
        <input
          type="text"
          value={currentQuestion}
          onChange={(e) => setCurrentQuestion(e.target.value)}
          placeholder="Ask a question about this document..."
          disabled={isLoading}
          className="flex-grow px-5 py-3 rounded-3xl border border-gray-300 shadow-sm placeholder-indigo-400
            focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:border-indigo-600 text-gray-900
            transition duration-300"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={isLoading || !currentQuestion.trim()}
          className="flex items-center justify-center gap-3 px-8 py-3 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold
            shadow-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed
            transition-colors duration-300 select-none"
        >
          <Send className="w-5 h-5" />
          {isLoading ? 'Thinking...' : 'Ask'}
        </button>
      </form>
    </div>
  );
};

export default QAPage;
