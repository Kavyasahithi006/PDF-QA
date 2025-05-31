import React, { createContext, useState, useContext, ReactNode } from 'react';

interface Document {
  id: string;
  name: string;
  uploadDate: string;
  size: number;
}

interface Question {
  id: string;
  documentId: string;
  question: string;
  answer: string;
  timestamp: string;
}

interface DocumentContextType {
  documents: Document[];
  selectedDocument: Document | null;
  questions: Question[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  addDocument: (document: Document) => void;
  selectDocument: (documentId: string | null) => void;
  addQuestion: (question: Question) => void;
  getDocumentQuestions: (documentId: string) => Question[];
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  const addDocument = (document: Document) => {
    setDocuments(prevDocuments => [...prevDocuments, document]);
  };

  const selectDocument = (documentId: string | null) => {
    if (!documentId) {
      setSelectedDocument(null);
      return;
    }
    
    const document = documents.find(doc => doc.id === documentId) || null;
    setSelectedDocument(document);
  };

  const addQuestion = (question: Question) => {
    setQuestions(prevQuestions => [...prevQuestions, question]);
  };

  const getDocumentQuestions = (documentId: string) => {
    return questions.filter(q => q.documentId === documentId);
  };

  return (
    <DocumentContext.Provider 
      value={{ 
        documents, 
        selectedDocument,
        questions,
        setDocuments, 
        addDocument, 
        selectDocument,
        addQuestion,
        getDocumentQuestions
      }}
    >
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