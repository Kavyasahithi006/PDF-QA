from typing import Dict, List
import re
import logging
from collections import defaultdict
import math

logger = logging.getLogger(__name__)

class SimpleQAEngine:
    """A simple question-answering engine that works without external LLMs."""
    
    def __init__(self):
        # Store document contents
        self.documents: Dict[str, str] = {}
        # Store processed chunks for each document
        self.document_chunks: Dict[str, List[str]] = {}
        # Store word frequency for each document
        self.document_word_freq: Dict[str, Dict[str, int]] = {}
    
    def index_document(self, document_id: str, text_content: str):
        """
        Index a document for question answering.
        
        Args:
            document_id: Unique identifier for the document
            text_content: Text content of the document
        """
        try:
            # Store the full text
            self.documents[document_id] = text_content
            
            # Split into chunks (paragraphs or sentences)
            chunks = self._split_text(text_content)
            self.document_chunks[document_id] = chunks
            
            # Build word frequency index
            word_freq = defaultdict(int)
            words = self._extract_words(text_content.lower())
            for word in words:
                word_freq[word] += 1
            
            self.document_word_freq[document_id] = dict(word_freq)
            
            logger.info(f"Successfully indexed document {document_id} with {len(chunks)} chunks")
            
        except Exception as e:
            logger.error(f"Error indexing document {document_id}: {str(e)}")
            raise Exception(f"Failed to index document: {str(e)}")
    
    def answer_question(self, document_id: str, question: str) -> str:
        """
        Answer a question about a specific document.
        
        Args:
            document_id: ID of the document to query
            question: Question to answer
            
        Returns:
            Answer to the question
        """
        if document_id not in self.documents:
            raise ValueError(f"Document {document_id} not found")
        
        try:
            # Find relevant chunks
            relevant_chunks = self._find_relevant_chunks(document_id, question)
            
            if not relevant_chunks:
                return "I couldn't find relevant information in the document to answer your question. Please try rephrasing your question or asking about different topics covered in the document."
            
            # Generate answer based on relevant chunks
            answer = self._generate_answer(question, relevant_chunks)
            
            return answer
                
        except Exception as e:
            logger.error(f"Error answering question for document {document_id}: {str(e)}")
            return f"I apologize, but I encountered an error while processing your question: {str(e)}"
    
    def _split_text(self, text: str) -> List[str]:
        """Split text into meaningful chunks."""
        # Split by double newlines (paragraphs) first
        paragraphs = text.split('\n\n')
        chunks = []
        
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if len(paragraph) > 500:  # Split long paragraphs
                sentences = re.split(r'[.!?]+', paragraph)
                current_chunk = ""
                
                for sentence in sentences:
                    sentence = sentence.strip()
                    if not sentence:
                        continue
                    
                    if len(current_chunk) + len(sentence) < 500:
                        current_chunk += sentence + ". "
                    else:
                        if current_chunk:
                            chunks.append(current_chunk.strip())
                        current_chunk = sentence + ". "
                
                if current_chunk:
                    chunks.append(current_chunk.strip())
            else:
                if paragraph:
                    chunks.append(paragraph)
        
        return chunks
    
    def _extract_words(self, text: str) -> List[str]:
        """Extract words from text, removing punctuation and common stop words."""
        # Simple word extraction
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        
        # Remove common stop words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does',
            'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that',
            'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
            'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their'
        }
        
        return [word for word in words if word not in stop_words]
    
    def _find_relevant_chunks(self, document_id: str, question: str) -> List[str]:
        """Find the most relevant chunks for a given question."""
        question_words = self._extract_words(question.lower())
        chunks = self.document_chunks[document_id]
        
        chunk_scores = []
        
        for i, chunk in enumerate(chunks):
            chunk_words = self._extract_words(chunk.lower())
            score = self._calculate_similarity_score(question_words, chunk_words)
            chunk_scores.append((score, i, chunk))
        
        # Sort by score and return top chunks
        chunk_scores.sort(reverse=True, key=lambda x: x[0])
        
        # Return top 3 relevant chunks
        relevant_chunks = []
        for score, _, chunk in chunk_scores[:3]:
            if score > 0:  # Only include chunks with some relevance
                relevant_chunks.append(chunk)
        
        return relevant_chunks
    
    def _calculate_similarity_score(self, question_words: List[str], chunk_words: List[str]) -> float:
        """Calculate similarity score between question and chunk."""
        if not question_words or not chunk_words:
            return 0.0
        
        chunk_word_set = set(chunk_words)
        
        # Count word matches
        matches = sum(1 for word in question_words if word in chunk_word_set)
        
        # Calculate similarity score (Jaccard-like similarity)
        if matches == 0:
            return 0.0
        
        # Boost score based on word frequency and rarity
        score = matches / len(question_words)
        
        # Boost score for longer chunks (more context)
        length_bonus = min(len(chunk_words) / 100, 1.0)
        score += length_bonus * 0.1
        
        return score
    
    def _generate_answer(self, question: str, relevant_chunks: List[str]) -> str:
        """Generate an answer based on relevant chunks."""
        if not relevant_chunks:
            return "I couldn't find relevant information to answer your question."
        
        # Combine relevant chunks
        combined_text = "\n\n".join(relevant_chunks)
        
        # Simple answer generation based on question type
        question_lower = question.lower()
        
        if any(word in question_lower for word in ['what', 'define', 'definition', 'meaning']):
            answer_prefix = "Based on the document, here's what I found about your question:\n\n"
        elif any(word in question_lower for word in ['how', 'process', 'method', 'way']):
            answer_prefix = "Here's the process/method described in the document:\n\n"
        elif any(word in question_lower for word in ['why', 'reason', 'because']):
            answer_prefix = "According to the document, here are the reasons:\n\n"
        elif any(word in question_lower for word in ['when', 'time', 'date']):
            answer_prefix = "Regarding timing/dates mentioned in the document:\n\n"
        elif any(word in question_lower for word in ['where', 'location', 'place']):
            answer_prefix = "Regarding locations mentioned in the document:\n\n"
        else:
            answer_prefix = "Based on the relevant sections of the document:\n\n"
        
        # Limit answer length
        if len(combined_text) > 1000:
            combined_text = combined_text[:1000] + "..."
            suffix = "\n\n(Note: This is a partial response from the most relevant sections. You can ask more specific questions for detailed information.)"
        else:
            suffix = ""
        
        return answer_prefix + combined_text + suffix
    
    def remove_document(self, document_id: str):
        """Remove a document from the index."""
        if document_id in self.documents:
            del self.documents[document_id]
        if document_id in self.document_chunks:
            del self.document_chunks[document_id]
        if document_id in self.document_word_freq:
            del self.document_word_freq[document_id]
        
        logger.info(f"Removed document {document_id} from index")
    
    def get_indexed_documents(self) -> List[str]:
        """Get list of indexed document IDs."""
        return list(self.documents.keys())