import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { pipeline } from '@xenova/transformers';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface PDFPage {
  page: number;
  text: string;
}

export interface PDFChunk {
  id: string;
  text: string;
  pageNumber: number;
  chunkIndex: number;
  embedding: number[];
}

export interface EmbeddingModel {
  (text: string): Promise<number[][]>;
}

export async function extractTextByPage(file: File): Promise<PDFPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;
  const pages: PDFPage[] = [];

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => (item.str ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    pages.push({ page: pageNumber, text });
  }

  return pages;
}

export function createTextChunks(
  pages: PDFPage[],
  chunkSize = 500,
  overlap = 100
): Omit<PDFChunk, 'embedding'>[] {
  const chunks: Array<Omit<PDFChunk, 'embedding'>> = [];

  pages.forEach((page) => {
    const text = page.text.trim();
    if (!text) {
      return;
    }

    let start = 0;
    let chunkIndex = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunkText = text.slice(start, end).trim();
      if (chunkText) {
        chunks.push({
          id: `${page.page}-${chunkIndex}`,
          text: chunkText,
          pageNumber: page.page,
          chunkIndex,
        });
      }
      chunkIndex += 1;
      start += chunkSize - overlap;
    }
  });

  return chunks;
}

export async function loadEmbeddingModel() {
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  return embedder;
}

export async function embedText(text: string, embedder: any): Promise<number[]> {
  const output = await embedder(text, {
    pooling: 'mean',
    normalize: true,
  });

  return Array.from(output.data);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function buildContextString(chunks: Omit<PDFChunk, 'embedding'>[]): string {
  return chunks
    .map((chunk) => `[Page ${chunk.pageNumber}]: ${chunk.text}`)
    .join('\n\n');
}
