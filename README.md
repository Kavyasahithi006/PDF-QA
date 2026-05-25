# PDF Q&A - RAG-Powered Document Assistant

A full-featured PDF question-answering application using **Retrieval Augmented Generation (RAG)**. Upload any PDF and get instant answers powered by Groq LLaMA AI, with context retrieved from your document using in-browser embeddings.

## Project Structure

```
PDF-QA-main/
├── backend/
│   ├── main.py                 # FastAPI application with endpoints
│   ├── models.py              # SQLAlchemy database models
│   ├── schemas.py             # Pydantic schemas for validation
│   ├── database.py            # SQLite database configuration
│   ├── pdf_processor.py       # PDF text extraction
│   ├── simple_qa_engine.py    # Local QA engine
│   ├── groq_client.py         # Groq API integration
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables (API keys)
│   ├── uploads/               # Directory for uploaded PDFs
│   └── pdf_qa.db             # SQLite database
│
└── src/
    ├── pages/                # React page components
    ├── components/           # Reusable UI components
    ├── context/             # React state management
    └── utils/pdfRag.ts      # RAG pipeline utilities
```

## Installation

1. **Create a virtual environment:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Quick Start (5 minutes)

### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows: venv\Scripts\activate, Mac/Linux: source venv/bin/activate)
venv\Scripts\activate  

# Install dependencies
pip install -r requirements.txt

# Create .env and add Groq API key
echo "GROQ_API_KEY=gsk_YOUR_KEY_HERE" > .env

# Start server
python -m uvicorn main:app --reload
```

### 2. Frontend Setup (new terminal)
```bash
# In PDF-QA-main root
npm install
npm run dev
```

Backend: `http://localhost:8000`  
Frontend: `http://localhost:5173`

## API Endpoints

### Document Management
- `POST /upload` - Upload a PDF document
- `GET /documents` - Get all uploaded documents
- `GET /documents/{document_id}` - Get a specific document
- `DELETE /documents/{document_id}` - Delete a document
- `GET /documents/{document_id}/questions` - Get questions for a document

### Question Answering
- `POST /ask` - Ask a question about a document (uses local QA engine)
- `POST /chat` - Send messages for chat completion (uses Groq API)

## How It Works

1. **Upload PDF** - Frontend sends PDF to backend `/upload` endpoint
2. **Extract Text** - Backend extracts text with PyMuPDF and stores in database
3. **Frontend Processing** - Browser extracts text with pdfjs-dist, creates chunks, generates embeddings
4. **Ask Question** - User asks question, browser embeds it and finds top 5 similar chunks
5. **Get Answer** - Context sent to Groq API via `/chat` endpoint
6. **Display Result** - Answer rendered with source attribution