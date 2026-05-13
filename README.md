# PDF Q&A Backend Setup

This backend provides a complete API for uploading PDF documents and asking questions about their content using FastAPI, LangChain, and local embeddings.

## Project Structure

```
backend/
├── main.py                 # FastAPI application
├── models.py              # SQLAlchemy database models
├── schemas.py             # Pydantic schemas
├── database.py            # Database configuration
├── pdf_processor.py       # PDF text extraction
├── qa_engine.py           # Question-answering engine
├── requirements.txt       # Python dependencies
├── uploads/               # Directory for uploaded PDFs (created automatically)
└── pdf_qa.db             # SQLite database (created automatically)
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

## Running the Server

```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Document Management
- `POST /upload` - Upload a PDF document
- `GET /documents` - Get all uploaded documents
- `GET /documents/{document_id}` - Get a specific document
- `DELETE /documents/{document_id}` - Delete a document

### Question & Answer
- `POST /ask` - Ask a question about a document
- `GET /documents/{document_id}/questions` - Get all questions for a document

## Frontend Integration


```typescript
// In UploadPage.tsx, the upload response will now include:
// { id, filename, upload_date, size }
```

```typescript
// POST to /ask with:
// { document_id: string, question: string }
```

##install dependencies
pip install fastapi uvicorn python-multipart sqlalchemy PyMuPDF pydantic
##Backend run uvicorn main:app --reload
##frontend run npm install
npm run dev