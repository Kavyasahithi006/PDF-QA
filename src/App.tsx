
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import QAPage from './pages/QAPage';
import { DocumentProvider } from './context/DocumentContext';

function App() {
  return (
    <Router>
      <DocumentProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/qa/:documentId?" element={<QAPage />} />
            </Routes>
          </main>
        </div>
      </DocumentProvider>
    </Router>
  );
}

export default App;