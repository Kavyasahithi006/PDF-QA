import fitz  # PyMuPDF
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class PDFProcessor:
    """Handle PDF text extraction and processing."""
    
    def extract_text(self, file_path: str) -> str:
        """
        Extract text content from a PDF file.
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Extracted text content
        """
        try:
            # Open the PDF file
            pdf_document = fitz.open(file_path)
            text_content = ""
            
            # Extract text from each page
            for page_num in range(pdf_document.page_count):
                page = pdf_document[page_num]
                text = page.get_text()
                text_content += f"\n--- Page {page_num + 1} ---\n{text}\n"
            
            pdf_document.close()
            
            # Clean up the text
            text_content = self._clean_text(text_content)
            
            return text_content
            
        except Exception as e:
            logger.error(f"Error extracting text from PDF {file_path}: {str(e)}")
            raise Exception(f"Failed to extract text from PDF: {str(e)}")
    
    def _clean_text(self, text: str) -> str:
        """
        Clean and normalize extracted text.
        
        Args:
            text: Raw extracted text
            
        Returns:
            Cleaned text
        """
        # Remove excessive whitespace
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            if line:  # Only keep non-empty lines
                cleaned_lines.append(line)
        
        # Join lines with single newlines
        cleaned_text = '\n'.join(cleaned_lines)
        
        # Remove multiple consecutive newlines
        while '\n\n\n' in cleaned_text:
            cleaned_text = cleaned_text.replace('\n\n\n', '\n\n')
        
        return cleaned_text
    
    def get_document_info(self, file_path: str) -> dict:
        """
        Get metadata information about the PDF.
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Dictionary containing document metadata
        """
        try:
            pdf_document = fitz.open(file_path)
            metadata = pdf_document.metadata
            page_count = pdf_document.page_count
            pdf_document.close()
            
            return {
                "page_count": page_count,
                "title": metadata.get("title", ""),
                "author": metadata.get("author", ""),
                "subject": metadata.get("subject", ""),
                "creator": metadata.get("creator", ""),
                "producer": metadata.get("producer", ""),
                "creation_date": metadata.get("creationDate", ""),
                "modification_date": metadata.get("modDate", "")
            }
            
        except Exception as e:
            logger.error(f"Error getting PDF info for {file_path}: {str(e)}")
            return {"page_count": 0}