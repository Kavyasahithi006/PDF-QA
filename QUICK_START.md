# Quick Start Guide - Groq-Powered PDF QA

## 🚀 Quick Setup (5 minutes)

### 1. Get Groq API Key
- Go to https://console.groq.com
- Click "API Keys" → "Create API Key"
- Copy the key (starts with `gsk_`)

### 2. Backend Setup
```bash
cd PDF-QA-main/backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
echo "GROQ_API_KEY=gsk_XXXXXXXXXXXX" > .env
python -m uvicorn main:app --reload
```
API runs at: http://localhost:8000

### 3. Frontend Setup (in new terminal)
```bash
cd PDF-QA-main
npm install
npm run dev
```
App runs at: http://localhost:5173

---

## 📖 How to Use

1. **Open browser** → http://localhost:5173
2. **Click "Upload Document"** → Select a PDF
3. **Wait for processing** → Shows "Processing PDF..." with progress
4. **Type your question** → Ask anything about the document
5. **Get answer** → Groq responds with sources cited

---

## 🔧 RAG Pipeline (What's Happening)

### When you upload a PDF:
```
PDF → Extract text → Split into chunks → Generate embeddings
        (text)         (~500 chars)      (in browser, free)
           ↓
        Store in memory
```

### When you ask a question:
```
Question → Embed it → Compare to all chunks → Get top 5 similar
              ↓              ↓
         Same model    Cosine similarity
              ↓
     Build context → Send to Groq → Get answer
```

---

## 📊 Example Questions

- **"What is this document about?"**
- **"Summarize the main points"**
- **"What are the key conclusions?"**
- **"How is X related to Y?"**
- **"What does section 3 say?"**

Each answer shows: "**Sources: Page 2, 5, 7**"

---

## ⚡ Performance Tips

- **First embedding load**: ~10-30 seconds (model downloads)
- **Processing PDFs**: Faster on subsequent runs (cached model)
- **Responses**: 1-3 seconds (mostly Groq API time)
- **Best PDF size**: 10-100 pages

---

## 🔑 Key Technologies

| Component | Tech | Why |
|-----------|------|-----|
| **PDF Extraction** | pdfjs-dist (browser) | Fast client-side processing |
| **Embeddings** | Xenova/all-MiniLM-L6-v2 | Free, runs in browser (no API needed) |
| **Chunking** | Custom algorithm | 500 chars with 100 char overlap |
| **Similarity Search** | Cosine distance | Fast vector similarity |
| **LLM** | Groq LLaMA 3.3 70B | Ultra-fast, affordable AI |
| **Backend** | FastAPI | Python high-performance API |
| **Database** | SQLite | Stores documents and questions |
| **UI** | React + Tailwind | Modern, responsive design |

---

## ✅ Verify Everything Works

### Test 1: Upload works?
- Upload any PDF
- Should show progress bar
- Should navigate to chat page

### Test 2: Embeddings generated?
- Check browser DevTools → Network tab
- Should see no requests to embedding service (runs locally)

### Test 3: Groq responds?
- Ask simple question
- Should get answer within 3 seconds
- Answer shows page sources

---

## ❌ Troubleshooting

### "API key not configured"
→ Check `backend/.env` has `GROQ_API_KEY`
→ Restart frontend and backend

### "PDF processing failed"
→ Try different PDF
→ Check if PDF has text (not scanned image)
→ Check browser console for errors

### "No response from Groq"
→ Check API key is valid (https://console.groq.com)
→ Check internet connection
→ Look for rate limit errors

### Slow embedding generation
→ First time: ~30 seconds (model download)
→ Subsequent: Should be faster (cached)
→ Large PDFs: Takes proportionally longer

---

## 🎯 What's Different from Backend QA?

**Old Approach**: Send full PDF text to Groq
```
PDF → Full text → Groq → Answer
         ❌ Can exceed token limits
         ❌ Less relevant answers
         ❌ Expensive API calls
```

**New RAG Approach**: Send only relevant chunks
```
PDF → Chunks → Embeddings → Top 5 similar → Groq → Answer
                                              ✅ Exact context
                                              ✅ Better answers
                                              ✅ Cheaper API calls
```

---

## 📚 Files to Know

- `src/utils/pdfRag.ts` - All RAG functions
- `src/pages/UploadPage.tsx` - PDF upload & processing
- `src/pages/QAPage.tsx` - Chat interface with retrieval
- `src/context/DocumentContext.tsx` - Global state (PDFs, embeddings, chat)
- `.env.local` - API key configuration

---

## 🎓 Learn More

See `RAG_SETUP.md` for detailed architecture and API documentation.

---

**Ready? Start at terminal with: `npm run dev` and `python -m uvicorn main:app --reload`**
