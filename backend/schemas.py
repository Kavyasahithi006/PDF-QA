from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DocumentResponse(BaseModel):
    id: str
    filename: str
    upload_date: datetime
    size: int

    class Config:
        from_attributes = True

class QuestionCreate(BaseModel):
    document_id: str
    question: str

class QuestionResponse(BaseModel):
    id: str
    document_id: str
    question: str
    answer: str
    timestamp: datetime

    class Config:
        from_attributes = True