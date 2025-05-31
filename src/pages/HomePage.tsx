import { FileText } from 'lucide-react';
import { motion } from 'framer-motion';

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-100 via-purple-50 to-pink-50 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="bg-white border border-indigo-200 rounded-3xl shadow-xl p-12 max-w-3xl w-full text-center cursor-default
          hover:shadow-2xl hover:scale-[1.02] transition-transform duration-300"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="flex justify-center mb-8"
        >
          <FileText className="h-24 w-24 text-indigo-600 drop-shadow-xl" />
        </motion.div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 mb-5 leading-tight tracking-tight">
          Welcome to <span className="text-indigo-700">Document AI</span>
        </h1>

        <p className="text-xl sm:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
          Upload your documents and get instant, powerful insights with our advanced AI-driven analysis.
        </p>

        <div className="mt-6">
          <a
            href="/upload"
            className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xl font-semibold shadow-lg 
              hover:from-purple-700 hover:to-indigo-700 transition-colors duration-300"
          >
            Upload Document
          </a>
        </div>
      </motion.div>
    </div>
  );
}

export default HomePage;
