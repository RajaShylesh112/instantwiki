import { ExtractedPage } from "./extractor"

export function chunkText(text: string, size: number, overlap: number): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + size, text.length)
    chunks.push(text.substring(start, end))
    start += size - overlap
  }
  return chunks
}

export function segmentSemanticChunks(allPagesData: ExtractedPage[], isShortcut: boolean = false): any[] {
  const chunks: any[] = []
  
  for (const page of allPagesData) {
    const { documentId, pageNumber } = page
    if (!page.text || !page.text.trim()) continue
    
    chunks.push({
      document_id: documentId,
      page_number: pageNumber,
      chunk_index: 0,
      content: page.text.trim(),
      heading: `Page ${pageNumber}`,
      section: null,
      chunk_type: "text"
    })
  }
  
  if (isShortcut) {
    return chunks.slice(0, 15)
  }
  return chunks
}
