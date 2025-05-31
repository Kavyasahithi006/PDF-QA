from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn
import os
import uuid
from datetime import datetime
from typing import List
import logging

# Logging config
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Import your modules
from database import get_db, engine, Base
from models import Document, Question
from schemas import DocumentResponse, QuestionCreate, QuestionResponse
from pdf_processor import PDFProcessor
from simple_qa_engine import SimpleQAEngine

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PDF Q&A API",
    description="API for uploading PDF documents and asking questions about their content",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
pdf_processor = PDFProcessor()
qa_engine = SimpleQAEngine()

# Upload folder
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
async def root():
    return {"message": "PDF QA API is running"}


@app.post("/upload/", response_model=DocumentResponse)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a PDF document and extract its content."""
    file_path = None
    try:
        logging.info(f"Received file: {file.filename} (type: {file.content_type})")

        # Validate file type
        if not file.content_type == "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are supported")

        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"{file_id}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        # Save file to disk
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        logging.info(f"Saved file to: {file_path}")

        # Extract text from PDF
        extracted_text = pdf_processor.extract_text(file_path)
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF. The file might be corrupted or contain only images.")

        # Store document in DB
        db_document = Document(
            id=file_id,
            filename=file.filename,
            file_path=file_path,
            content=extracted_text,
            upload_date=datetime.utcnow()
        )
        db.add(db_document)
        db.commit()
        db.refresh(db_document)

        # Index in QA engine
        qa_engine.index_document(file_id, extracted_text)

        logging.info(f"File processed and indexed: {file_id}")
        return DocumentResponse(
            id=db_document.id,
            filename=db_document.filename,
            upload_date=db_document.upload_date,
            size=len(content)
        )

    except HTTPException:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        raise
    except Exception as e:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        logging.exception("Error during upload:")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing document: {str(e)}"
        )


@app.post("/ask", response_model=QuestionResponse)
async def ask_question(
    question_data: QuestionCreate,
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(Document.id == question_data.document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        answer = qa_engine.answer_question(question_data.document_id, question_data.question)

        db_question = Question(
            id=str(uuid.uuid4()),
            document_id=question_data.document_id,
            question=question_data.question,
            answer=answer,
            created_at=datetime.utcnow()
        )

        db.add(db_question)
        db.commit()
        db.refresh(db_question)

        return QuestionResponse(
            id=db_question.id,
            document_id=db_question.document_id,
            question=db_question.question,
            answer=db_question.answer,
            timestamp=db_question.created_at
        )

    except Exception as e:
        logging.exception("Error processing question")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing question: {str(e)}"
        )


@app.get("/documents", response_model=List[DocumentResponse])
async def get_documents(db: Session = Depends(get_db)):
    documents = db.query(Document).all()
    return [
        DocumentResponse(
            id=doc.id,
            filename=doc.filename,
            upload_date=doc.upload_date,
            size=len(doc.content.encode('utf-8')) if doc.content else 0
        )
        for doc in documents
    ]


@app.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return DocumentResponse(
        id=document.id,
        filename=document.filename,
        upload_date=document.upload_date,
        size=len(document.content.encode('utf-8')) if document.content else 0
    )


@app.get("/documents/{document_id}/questions", response_model=List[QuestionResponse])
async def get_document_questions(document_id: str, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    questions = db.query(Question).filter(Question.document_id == document_id).all()

    return [
        QuestionResponse(
            id=q.id,
            document_id=q.document_id,
            question=q.question,
            answer=q.answer,
            timestamp=q.created_at
        )
        for q in questions
    ]


@app.delete("/documents/{document_id}")
async def delete_document(document_id: str, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        db.query(Question).filter(Question.document_id == document_id).delete()
        db.delete(document)
        db.commit()

        if os.path.exists(document.file_path):
            os.remove(document.file_path)

        qa_engine.remove_document(document_id)

        return {"message": "Document deleted successfully"}

    except Exception as e:
        logging.exception("Error deleting document")
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting document: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
