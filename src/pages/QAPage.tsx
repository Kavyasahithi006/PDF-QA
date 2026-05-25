import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocuments } from '../context/DocumentContext';
import { MessageSquare, Send, Download, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { cosineSimilarity, buildContextString } from '../utils/pdfRag';
import ReactMarkdown from 'react-markdown';

const QAPage: React.FC = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const {
    selectedDocument,
    chunks,
    history,
    setHistory,
    selectDocument,
    isProcessing,
    error,
    setError,
  } = useDocuments();
       
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    selectDocument(documentId || null);
  }, [documentId, selectDocument]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl font-semibold text-gray-700 mb-2">
            Processing your PDF...
          </p>
          <p className="text-gray-500">This may take a minute.</p>
        </motion.div>
      </div>
    );
  }

  if (!selectedDocument || chunks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6 text-center">
        <MessageSquare className="w-20 h-20 text-indigo-300 mb-6 drop-shadow-md" />
        <h2 className="text-3xl font-semibold text-gray-700 mb-3">
          No Document Selected
        </h2>
        <p className="text-gray-500 max-w-md mb-6">
          Please upload a PDF to start asking questions.
        </p>
        <button
          onClick={() => navigate('/upload')}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Upload PDF
        </button>
      </div>
    );
  }

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion.trim() || !selectedDocument) return;

    setIsLoading(true);
    setError(null);

    try {
      const { loadEmbeddingModel, embedText } = await import('../utils/pdfRag');
      const embedder = await loadEmbeddingModel();
      const questionEmbedding = await embedText(currentQuestion, embedder);

      const similarities = chunks.map((chunk) => ({
        chunk,
        similarity: cosineSimilarity(questionEmbedding, chunk.embedding),
      }));

      similarities.sort((a, b) => b.similarity - a.similarity);
      const topChunks = similarities.slice(0, 5).map(({ chunk }) => chunk);

      const contextString = buildContextString(topChunks);
      const uniquePages = [...new Set(topChunks.map((c) => c.pageNumber))].sort(
        (a, b) => a - b
      );


      const systemPrompt = `You are an intelligent PDF assistant. You will be given relevant sections extracted from a PDF document and a user question. Answer the question accurately based only on the provided sections. If the answer is not in the provided sections, say 'This information was not found in the document.' Always respond in clean structured markdown with headings and bullet points where appropriate.

Provided document sections:
${contextString}`;

      const response = await fetch('http://localhost:8000/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: currentQuestion,
      },
    ],
  }),
});
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get answer from OpenAI');
      }

      const data = await response.json();
     const answer = data.answer;

      const newHistory = [
        ...history,
        { role: 'user' as const, content: currentQuestion },
        {
          role: 'assistant' as const,
          content: answer + `\n\n**Sources: Page ${uniquePages.join(', ')}**`,
        },
      ];
      setHistory(newHistory.slice(Math.max(newHistory.length - 8, 0)));

      setCurrentQuestion('');
    } catch (err) {
      console.error('Error:', err);
      setError((err as any)?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setHistory([]);
    setCurrentQuestion('');
    setError(null);
  };

  const handleUploadNew = () => {
    navigate('/upload');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-10 min-h-screen flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="bg-gradient-to-r from-indigo-50 via-white to-indigo-50 rounded-2xl shadow-xl p-6 mb-6 border border-indigo-200"
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">
              {selectedDocument.name}
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Uploaded on {new Date(selectedDocument.uploadDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClearChat}
              title="Clear chat"
              className="p-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handleUploadNew}
              title="Upload new PDF"
              className="p-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-5 bg-red-100 border border-red-300 text-red-800 rounded-lg shadow-sm"
        >
          {error}
        </motion.div>
      )}

      <div className="flex-grow bg-white rounded-3xl shadow-2xl p-8 mb-6 border border-gray-100 flex flex-col overflow-hidden">
        {history.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-indigo-200">
              <MessageSquare className="w-20 h-20 mx-auto mb-4 drop-shadow-lg" />
              <p className="text-lg font-medium">
                Start asking questions about this PDF!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 overflow-y-auto flex-grow">
            {history.map((message, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
              >
                <div
                  className={`max-w-xl rounded-2xl p-5 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-gray-900 border border-indigo-200'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmitQuestion} className="flex flex-col sm:flex-row gap-5">
        <input
          type="text"
          value={currentQuestion}
          onChange={(e) => setCurrentQuestion(e.target.value)}
          placeholder="Ask a question about this document..."
          disabled={isLoading}
          className="flex-grow px-5 py-3 rounded-3xl border border-gray-300 shadow-sm placeholder-indigo-400
            focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:border-indigo-600 text-gray-900
            transition duration-300 disabled:opacity-50"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={isLoading || !currentQuestion.trim()}
          className="flex items-center justify-center gap-3 px-8 py-3 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold
            shadow-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed
            transition-colors duration-300 select-none whitespace-nowrap"
        >
          <Send className="w-5 h-5" />
          {isLoading ? 'Thinking...' : 'Ask'}
        </button>
      </form>
    </div>
  );
};

export default QAPage;
