import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface PDFPage {
  page: number;
  text: string;
}

export interface PDFChunk {
  id: string;
  text: string;
  pageNumber: number;
  chunkIndex: number;
  embedding: number[];
}

export interface Document {
  id: string;
  name: string;
  uploadDate: string;
  size: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface DocumentContextType {
  // Documents
  documents: Document[];
  selectedDocument: Document | null;
  addDocument: (document: Document) => void;
  selectDocument: (documentId: string | null) => void;
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;

  // PDF Processing
  documentPages: PDFPage[];
  chunks: PDFChunk[];
  setDocumentPages: React.Dispatch<React.SetStateAction<PDFPage[]>>;
  setChunks: React.Dispatch<React.SetStateAction<PDFChunk[]>>;

  // Chat
  history: ChatMessage[];
  setHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;

  // Processing State
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  processingProgress: number;
  setProcessingProgress: React.Dispatch<React.SetStateAction<number>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Document Management
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // PDF Processing
  const [documentPages, setDocumentPages] = useState<PDFPage[]>([]);
  const [chunks, setChunks] = useState<PDFChunk[]>([]);

  // Chat
  const [history, setHistory] = useState<ChatMessage[]>([]);

  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const addDocument = (document: Document) => {
    setDocuments(prevDocuments => [...prevDocuments, document]);
  };

  const selectDocument = (documentId: string | null) => {
    if (!documentId) {
      setSelectedDocument(null);
      setDocumentPages([]);
      setChunks([]);
      setHistory([]);
      setError(null);
      return;
    }
    
    const document = documents.find(doc => doc.id === documentId) || null;
    setSelectedDocument(document);
  };

  const value: DocumentContextType = {
    documents,
    selectedDocument,
    addDocument,
    selectDocument,
    setDocuments,
    documentPages,
    chunks,
    setDocumentPages,
    setChunks,
    history,
    setHistory,
    isProcessing,
    setIsProcessing,
    processingProgress,
    setProcessingProgress,
    error,
    setError,
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};