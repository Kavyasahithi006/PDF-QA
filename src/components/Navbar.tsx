import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Upload, MessageSquare } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600';
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">PDF QA</span>
            </Link>
          </div>
          <nav className="flex space-x-8">
            <Link 
              to="/" 
              className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/')}`}
            >
              <FileText className="mr-1 h-5 w-5" />
              Documents
            </Link>
            <Link 
              to="/upload" 
              className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/upload')}`}
            >
              <Upload className="mr-1 h-5 w-5" />
              Upload
            </Link>
            <Link 
              to="/qa" 
              className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/qa')}`}
            >
              <MessageSquare className="mr-1 h-5 w-5" />
              Ask
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;