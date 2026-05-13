# PDF QA - RAG-Powered Document Q&A Assistant

A modern, full-featured PDF question-answering application powered by **Retrieval Augmented Generation (RAG)**. Upload any PDF and get instant, accurate answers using Claude AI with context retrieved directly from your document.

## Features

- 🚀 **Client-Side RAG Pipeline**: Efficient PDF processing with embeddings generated in-browser
- 📄 **Smart PDF Text Extraction**: Page-by-page text extraction with `pdfjs-dist`
- 🧩 **Intelligent Chunking**: Overlapping text chunks (~500 chars with 100 char overlap) for context preservation
- 🤖 **In-Browser Embeddings**: Free embeddings using `@xenova/transformers` (no API key needed)
- 🔍 **Cosine Similarity Retrieval**: Top-5 most relevant chunks per question
- 💬 **Claude AI Integration**: GPT-like responses using Anthropic's Claude Sonnet
- ✨ **Markdown Rendering**: Beautiful, formatted responses with proper styling
- 📍 **Source Attribution**: Automatic source page citation for every answer
- 💾 **Chat History**: Maintains context across follow-up questions
- 🎨 **Modern UI**: Built with React, Tailwind CSS, and Framer Motion

---

## Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **Framer Motion** (animations)
- **pdfjs-dist** (PDF text extraction)
- **@xenova/transformers** (in-browser embeddings)
- **react-markdown** (markdown rendering)
- **axios** (HTTP client)
- **react-router-dom** (routing)

### Backend
- **FastAPI** (Python web framework)
- **SQLAlchemy** (ORM)
- **SQLite** (database)
- **PyMuPDF** (PDF processing fallback)

### External APIs
- **Anthropic Claude API** (answer generation)

---

## Installation & Setup

### Prerequisites
- **Node.js** 18+ and npm/yarn
- **Python** 3.9+
- **Anthropic API Key** (get it from https://console.anthropic.com/)

### 1. Frontend Setup

```bash
cd PDF-QA-main

# Install dependencies
npm install

# Create .env.local and add your Anthropic API key
echo "VITE_ANTHROPIC_API_KEY=your_key_here" > .env.local

# Start dev server (runs on http://localhost:5173)
npm run dev
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start server (runs on http://localhost:8000)
python -m uvicorn main:app --reload
```

---

## How It Works

### RAG Pipeline (Step-by-Step)

#### **Step 1: PDF Text Extraction**
When you upload a PDF:
- Text is extracted page-by-page using `pdfjs-dist`
- Output: `[{ page: 1, text: "..." }, { page: 2, text: "..." }, ...]`

#### **Step 2: Chunking**
Extracted text is split into overlapping chunks:
- Chunk size: ~500 characters
- Overlap: ~100 characters (preserves context at boundaries)
- Each chunk stores: `{ id, text, pageNumber, chunkIndex }`

#### **Step 3: Embedding Generation**
Embeddings are generated for each chunk:
- Model: `Xenova/all-MiniLM-L6-v2` (runs in browser, free)
- Output: Vector representations stored in memory
- Processing shows progress bar: "Processing PDF..."

#### **Step 4: Query Embedding + Retrieval**
When you ask a question:
- Question is embedded using the same model
- Cosine similarity calculated between question and all chunks
- Top 5 most similar chunks are retrieved

#### **Step 5: Context Building**
Retrieved chunks are formatted for Claude:
```
Relevant sections from the document:

[Page 2]: <chunk text>

[Page 5]: <chunk text>

...
```

#### **Step 6: LLM Answer Generation**
Claude API generates the answer:
- Model: `claude-sonnet-4-20250514`
- System prompt ensures context-only responses
- Max tokens: 1024

#### **Step 7: Display Response**
Answer displayed with:
- Markdown formatting (bold, headings, lists)
- Source pages cited (e.g., "Sources: Page 2, 5, 7")
- Chat history maintained for follow-ups

---

## API Endpoints

### Frontend Flow (Client-Side RAG)
```
Upload PDF
  ↓
Extract text → Create chunks → Generate embeddings (in-browser)
  ↓
User asks question
  ↓
Embed question → Find top 5 chunks → Build context
  ↓
Call Claude API with context
  ↓
Display answer with sources
```

### Backend Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/upload` | POST | Upload PDF, extract & store text |
| `/ask` | POST | Ask question about document |
| `/documents` | GET | List all documents |
| `/documents/{id}` | GET | Get specific document |
| `/documents/{id}/questions` | GET | Get Q&A history |
| `/documents/{id}` | DELETE | Delete document & associated Q&As |

---

## File Structure

```
PDF-QA-main/
├── src/
│   ├── utils/
│   │   └── pdfRag.ts           # RAG pipeline utilities
│   ├── pages/
│   │   ├── UploadPage.tsx      # PDF upload & processing
│   │   ├── QAPage.tsx          # Chat interface
│   │   └── HomePage.tsx        # Landing page
│   ├── context/
│   │   └── DocumentContext.tsx # Global state (PDFs, chunks, history)
│   ├── components/
│   │   └── Navbar.tsx          # Navigation
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles + markdown styles
│
├── backend/
│   ├── main.py                 # FastAPI server
│   ├── models.py               # Database models
│   ├── schemas.py              # Pydantic schemas
│   ├── database.py             # SQLAlchemy setup
│   ├── pdf_processor.py        # PDF extraction
│   ├── simple_qa_engine.py     # Old QA engine (fallback)
│   ├── requirements.txt        # Python dependencies
│   └── uploads/                # Uploaded PDFs storage
│
├── package.json                # Frontend dependencies
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS config
├── tsconfig.json               # TypeScript configuration
├── .env.example                # Environment variables template
└── .env.local                  # Local environment (add API key here)
```

---

## Key Utilities

### `src/utils/pdfRag.ts`

| Function | Purpose |
|----------|---------|
| `extractTextByPage(file)` | Extract text from PDF page-by-page |
| `createTextChunks(pages)` | Split text into overlapping chunks |
| `loadEmbeddingModel()` | Load embedding model (Xenova) |
| `embedText(text, embedder)` | Generate embedding for text |
| `cosineSimilarity(a, b)` | Calculate similarity between vectors |
| `buildContextString(chunks)` | Format chunks for Claude |

---

## Special Cases Handled

### 1. **Scanned PDFs (Image-Only)**
- If no text extracted: Shows "This PDF appears to be scanned..."
- Requires OCR (not implemented in this version)

### 2. **Large PDFs**
- Chunked efficiently to avoid context window limits
- Only top 5 chunks sent to Claude (never full PDF)
- Memory-efficient in-browser processing

### 3. **Chat History**
- Maintains last 4 messages for context
- Follow-up questions understand previous context
- Automatically cleared when new PDF uploaded

### 4. **API Errors**
- Missing API key: "Anthropic API key not configured..."
- API failure: "Something went wrong. Please try again."
- Network issues: Error message displayed with retry option

---

## Configuration

### Environment Variables

Create `.env.local` in the project root:

```env
# Required: Anthropic API Key
# Get from: https://console.anthropic.com/account/keys
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Vite Configuration

The app automatically picks up environment variables prefixed with `VITE_`:

```typescript
// In QAPage.tsx:
const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
```

---

## Usage

### 1. **Start the App**

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python -m uvicorn main:app --reload

# Terminal 2 - Frontend
npm run dev
```

Visit `http://localhost:5173`

### 2. **Upload a PDF**
- Click "Upload Document" or drag & drop
- Wait for processing (extraction → chunking → embedding)
- Progress bar shows real-time status

### 3. **Ask Questions**
- Type questions about the PDF
- Claude answers based on relevant chunks only
- Sources shown below each answer

### 4. **Continue the Conversation**
- Ask follow-up questions
- Chat history maintained automatically
- Context preserved across messages

### 5. **Upload New PDF**
- Click "Upload new" button to reset and upload different PDF
- Clear chat button to start fresh conversation on same PDF

---

## Performance Notes

- **Embedding Generation**: ~5-30 seconds depending on PDF size and computer speed
- **Query Response**: ~1-3 seconds (mostly API latency)
- **Memory Usage**: Embeddings stored in-memory (not persisted after page refresh)
- **Chunk Limit**: Tested with PDFs up to 100 pages

---

## Known Limitations

1. **No OCR**: Scanned PDFs (image-only) are not supported
2. **Browser Memory**: Very large embeddings arrays may cause performance issues
3. **No Persistence**: Embeddings lost on page refresh (re-upload required)
4. **API Rate Limits**: Anthropic API rate limits apply
5. **No Summarization**: "Summarize whole document" feature not implemented (requires chunking strategy)

---

## Troubleshooting

### "Anthropic API key not configured"
- Create `.env.local` with your API key
- Restart the dev server: `npm run dev`
- Clear browser cache and reload

### "Failed to load PDF"
- Ensure PDF is valid and not corrupted
- Try re-uploading the file
- Check browser console for errors

### "Processing is slow"
- Embedding model (~100MB) downloads on first use
- Browser cache stores model for future use
- Large PDFs take longer to chunk and embed

### "No answer from Claude"
- Check network connection
- Verify Anthropic API key is valid
- Check API account for rate limits or quota issues

---

## Future Enhancements

- [ ] OCR support for scanned PDFs
- [ ] Persistent vector database (Pinecone, Weaviate)
- [ ] Document summarization feature
- [ ] Multi-document QA
- [ ] Advanced filtering (date range, topics)
- [ ] Export conversation as PDF
- [ ] Custom embedding models
- [ ] Fine-tuned retrieval (BM25 + semantic hybrid)

---

## License

MIT License - Feel free to use this project for personal or commercial purposes.

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review error messages in browser console
3. Check backend logs in terminal
4. Verify environment configuration

---

**Built with ❤️ using React, FastAPI, and Claude AI**
