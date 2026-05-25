# RAG Pipeline - Visual Architecture

## 🏗️ Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE (React)                       │
│  - Upload PDF button (drag & drop)                                  │
│  - Progress bar during processing                                   │
│  - Chat interface with messages                                     │
│  - Source attribution (Page X, Y, Z)                               │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────────────┐
        │   BROWSER (Client-Side RAG)    │
        │  (All processing happens here) │
        └────────────────┬───────────────┘
                         │
        ┌────────────────┴───────────────┐
        │                                │
        ↓                                ↓
   ┌─────────────┐             ┌──────────────────┐
   │ STEP 1: PDF │             │ STEP 2: CHUNKS   │
   │ EXTRACTION  │────────────→│ CREATION         │
   │             │             │                  │
   │ pdfjs-dist  │             │ ~500 chars       │
   │ Output:     │             │ ~100 overlap     │
   │ [{page,     │             │ Output:          │
   │  text}, ]   │             │ [{id, text,      │
   │             │             │  page, embed}, ]│
   └─────────────┘             └────────┬─────────┘
                                        │
                    ┌───────────────────┴───────────────┐
                    │                                   │
                    ↓                                   ↓
            ┌──────────────────┐           ┌──────────────────────┐
            │ STEP 3: EMBED    │           │ STEP 4: QUERY        │
            │ GENERATION       │           │ EMBEDDING            │
            │                  │           │                      │
            │ Model:           │◄──────────│ Same model used      │
            │ Xenova/MiniLM    │           │ for question         │
            │                  │           │                      │
            │ Output:          │           │ User enters question │
            │ [{chunk: vect},]│           │ → Convert to vector  │
            │                  │           │                      │
            │ In-Memory Store  │           │ Output:              │
            │ (384-dim vects)  │           │ [0.12, 0.54, ...]   │
            └──────────────────┘           └──────────┬───────────┘
                      │                              │
                      │                              │
                      └──────────────┬───────────────┘
                                     │
                                     ↓
                        ┌────────────────────────┐
                        │  STEP 5: SIMILARITY    │
                        │  CALCULATION           │
                        │                        │
                        │ Cosine Similarity:     │
                        │ Query ⊙ Chunk1 = 0.89 │
                        │ Query ⊙ Chunk2 = 0.85 │
                        │ Query ⊙ Chunk3 = 0.72 │
                        │ Query ⊙ Chunk4 = 0.65 │
                        │ Query ⊙ Chunk5 = 0.58 │
                        │ Query ⊙ Chunk6 = 0.42 │
                        │ ...                    │
                        │                        │
                        │ Top 5: Chunks 1-5      │
                        └────────────┬───────────┘
                                     │
                                     ↓
                        ┌────────────────────────┐
                        │  STEP 6: CONTEXT       │
                        │  BUILDING              │
                        │                        │
                        │ Format top 5 chunks:   │
                        │                        │
                        │ "Relevant sections:    │
                        │  [Page 2]: <text>      │
                        │  [Page 5]: <text>      │
                        │  [Page 3]: <text>      │
                        │  [Page 7]: <text>      │
                        │  [Page 4]: <text>      │
                        │                        │
                        │  Question: <user q>    │
                        │                        │
                        │  Size: ~2KB (cheap!)   │
                        └────────────┬───────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                │
                    ↓                                ↓
                ┌──────────┐              ┌─────────────────────────────┐
                │ HTTPS    │──────────────→│  STEP 7: GROQ API CALL      │
                │ REQUEST  │              │                             │
                │          │              │ Model: llama-3.3-70b-       │
                │ Headers: │              │ versatile                   │
                │ - Key    │              │                             │
                │ - JSON   │              │ System prompt:              │
                │          │              │ "Answer only from provided  │
                │          │              │  sections"                  │
                │          │              │                             │
                │          │              │ Input: ~300 tokens          │
                │          │              │ Output: 1024 max            │
                │          │              │ Ultra-fast: ~1-2 seconds    │
                └──────────┘              └──────────┬──────────────────┘
                                                     │
                                    ┌────────────────┴────────────────┐
                                    │ (Internet/Network)              │
                                    │ api.groq.com/openai/v1/chat    │
                                    └────────────────┬────────────────┘
                                                     │
                                                     ↓
                                    ┌────────────────────────────────┐
                                    │ STEP 8: RESPONSE RENDERING      │
                                    │                                │
                                    │ Groq returns markdown:          │
                                    │ "## Main findings               │
                                    │  1. Point A                     │
                                    │  2. Point B                     │
                                    │  ..."                           │
                                    │                                │
                                    │ React Markdown renders:         │
                                    │ - Bold text                     │
                                    │ - Headings                      │
                                    │ - Lists                         │
                                    │ - Code blocks                   │
                                    │                                │
                                    │ Add sources:                    │
                                    │ "**Sources: Page 2, 5, 7**"     │
                                    │                                │
                                    │ Show in chat                    │
                                    │ (right side, gray box)          │
                                    └────────────────┬───────────────┘
                                                     │
                                                     ↓
                                    ┌────────────────────────────────┐
                                    │  USER SEES ANSWER               │
                                    │  in chat interface              │
                                    │  with sources cited             │
                                    └────────────────────────────────┘
```

---

## 📊 Data Flow Comparison (RAG Pipeline)
```
PDF → Extract → Chunk → Embed
        ↓
   Retrieve Top 5 → Build Context (2KB)
        ↓
   Groq LLaMA API (context only)
        ↓
   High-quality, cheap, relevant answer
  ✅ Never full PDF
  ✅ Small context (~2KB)
  ✅ Cheap API calls
  ✅ Excellent answer relevance
```

---

## 🔐 Data Location Map

```
┌─────────────────────────────────────────────────────────────┐
│ BROWSER (React App)                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DocumentContext (Global State):                           │
│  - PDFPages: [{ page, text }]     ← From pdfjs-dist       │
│  - Chunks: [{ id, text, page, embedding }]               │
│            ↓                                               │
│            In-memory vector store                         │
│            384-dim embeddings                             │
│                                                             │
│  Chat History:                                              │
│  - Messages: [{ role, content }]                           │
│  - Last 4 messages for context                            │
│                                                             │
│  Processing State:                                          │
│  - isProcessing: true/false                               │
│  - processingProgress: 0-100%                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         ↓                                    ↓
    (Temporary)                         (Only on demand)
  Page refresh loses               API calls to Groq
  all state                        (context only, never full PDF)
                                     ↓
                        ┌──────────────────────────────────┐
                        │ GROQ API                         │
                        │                                  │
                        │ Receives:                         │
                        │ - Context (top 5 chunks)          │
                        │ - User question                   │
                        │ - Chat history (opt)              │
                        │                                  │
                        │ Never receives:                   │
                        │ - Full PDF                        │
                        │ - All chunks                      │
                        │ - Embeddings                      │
                        │                                  │
                        │ Responds:                         │
                        │ - Markdown answer                 │
                        │ - ~1-2 seconds                    │
                        └──────────────────────────────────┘
                                     ↓
                        ┌──────────────────────────────────┐
                        │ BACKEND (FastAPI)                │
                        │                                  │
                        │ Stores:                          │
                        │ - Document metadata              │
                        │ - Q&A history                    │
                        │ - PDF files in uploads/          │
                        │                                  │
                        │ Does NOT:                        │
                        │ - Process PDF                    │
                        │ - Generate embeddings            │
                        │ - Call Groq API                │
                        └──────────────────────────────────┘
```

---

## ⚡ Performance Timeline

```
USER ACTION                          TIME        CUMULATIVE
─────────────────────────────────────────────────────────────

1. Click upload                       0ms         0ms
2. Select PDF                         1s          1s
3. Extract text                       2s          3s
4. Create chunks                      1s          4s
5. Load embedding model              10s         14s  ← Takes time once
6. Generate embeddings               10s         24s  ← Parallel processing
   (all chunks)
7. Upload metadata to backend        1s          25s
   [TOTAL: ~25 seconds for 50-page PDF]

─────────────────────────────────────────────────────────────
READY FOR CHAT ✅
─────────────────────────────────────────────────────────────

USER ACTION                          TIME        CUMULATIVE
─────────────────────────────────────────────────────────────

1. Type question                     Variable    Variable
2. Press Enter                       0ms         0ms
3. Embed question                    0.1s        0.1s
4. Calculate similarities            0.5s        0.6s
5. Build context                     0.1s        0.7s
6. Call Groq API                     1.5s        2.2s  ← Network
7. Parse response                    0.1s        2.3s
8. Render markdown                   0.1s        2.4s
   [TOTAL: ~2-3 seconds per question]

─────────────────────────────────────────────────────────────
ANSWER DISPLAYED ✅
─────────────────────────────────────────────────────────────
```

---

## 🎯 Retrieval Example

```
PDF Content (simplified):
─────────────────────────────────────────

Page 1: "Introduction to machine learning..."
       ↓ Chunk 1-1 (embedding: [0.12, 0.45, ...])

Page 2: "Neural networks are inspired by biological neurons..."
       ↓ Chunk 2-1 (embedding: [0.34, 0.67, ...])

Page 3: "Training uses gradient descent optimization..."
       ↓ Chunk 3-1 (embedding: [0.56, 0.22, ...])

Page 4: "Results show 95% accuracy on test data..."
       ↓ Chunk 4-1 (embedding: [0.78, 0.11, ...])

─────────────────────────────────────────

User Question: "How accurate are the results?"
     ↓
Question embedding: [0.75, 0.14, ...]

─────────────────────────────────────────

Similarity Scores:
  Chunk 1-1: similarity = 0.34 ❌
  Chunk 2-1: similarity = 0.41 ❌
  Chunk 3-1: similarity = 0.48 ❌
  Chunk 4-1: similarity = 0.92 ✅ ← TOP MATCH!
  ... (all others lower)

─────────────────────────────────────────

Selected Chunks: [4-1]

Context sent to Groq:
"Relevant sections from the document:

 [Page 4]: Results show 95% accuracy on test data...

 Question: How accurate are the results?"

─────────────────────────────────────────

Groq Response: "Based on the document, 
the results show 95% accuracy on the 
test data."

Sources: Page 4
```

---

## 🔀 State Management Flow

```
UploadPage
    ↓
    setIsProcessing(true)
    ├─ setProcessingProgress(10)
    ├─ extractTextByPage()
    │  └─ setDocumentPages(pages)
    ├─ createTextChunks()
    ├─ setProcessingProgress(50)
    ├─ loadEmbeddingModel()
    ├─ embedText() for each chunk
    │  └─ setChunks(chunksWithEmbeddings)
    ├─ setProcessingProgress(95)
    ├─ uploadMetadata()
    ├─ setProcessingProgress(100)
    └─ setIsProcessing(false)
    
    navigate(`/qa/${documentId}`)
         ↓
QAPage
    ├─ selectDocument(documentId)
    ├─ chunks loaded from context
    └─ ready for chat
    
User asks question
    ├─ embedText(question)
    ├─ cosineSimilarity() for all chunks
    ├─ topChunks = top 5 most similar
    ├─ context = buildContextString(topChunks)
    ├─ Call Groq API (context in body)
    ├─ Parse response
    ├─ setHistory([...history, user message, assistant response])
    └─ render in UI

User clicks "Clear Chat"
    └─ setHistory([])  ← Just clears messages
       (chunks stay in memory)

User clicks "Upload New"
    └─ navigate('/upload')
       → clearDocumentState() on mount? (optional)
```

---

## 📈 Scalability Notes

### What Works Well
- Single PDF: ✅ Tested up to 100 pages
- Multiple questions: ✅ Unlimited (embeddings cached)
- Chunk size: ✅ Configurable (currently 500)
- Chat history: ✅ Can extend (currently last 4)

### Limitations
- Large PDFs (1000+ pages): ⚠️ May slow embedding
- Many PDFs loaded: ⚠️ Browser memory limits
- On page refresh: ⚠️ State lost (reload needed)
- Concurrent users: ✅ Each has own browser state

### Future Improvements
- Persistent vector DB (Pinecone, Weaviate)
- Hybrid search (BM25 + semantic)
- Multi-document QA
- Advanced chunking strategies
- Caching across sessions

---

## 🎓 Key Concepts

### Embedding (Vector Representation)
```
Text: "Machine learning is a subset of AI"
         ↓
Embedding Model (Xenova/MiniLM)
         ↓
Vector: [0.12, 0.45, 0.67, -0.23, 0.34, ...]
        (384 dimensions)
```

### Cosine Similarity
```
Query vector:   [0.1, 0.9, 0.2]
Chunk vector:   [0.15, 0.85, 0.25]

Similarity = (0.1×0.15 + 0.9×0.85 + 0.2×0.25)
             ─────────────────────────────────
             √(0.1² + 0.9² + 0.2²) × √(0.15² + 0.85² + 0.25²)

           = 0.799 ← High similarity (0-1 scale)
```

### Context Window
```
Groq LLaMA 3.3 context window: 8,192 tokens
Our approach:
- Context: ~300 tokens (5 chunks)
- Question: ~50 tokens
- History: ~200 tokens (4 messages)
- Total: ~550 tokens
Usage: 0.27% of available context ✅
```

---

This is your complete RAG pipeline! 🚀
