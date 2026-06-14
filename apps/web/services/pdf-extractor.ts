import {
  MarkItDownClient,
  MarkItDownServiceUnavailableError,
  getMarkItDownServiceUrl,
} from "./markitdown/client"

export {
  MarkItDownServiceUnavailableError,
} from "./markitdown/client"

export interface ExtractedBlock {
  type: "text" | "heading" | "table"
  content: string
  level?: number
  table_data?: {
    headers: string[]
    rows: any[][]
    markdown: string
  }
}

export interface ExtractedPage {
  page_number: number
  text: string
  blocks?: ExtractedBlock[]
}

export interface ExtractedImage {
  page_number: number
  filename: string
  width: number
  height: number
  ext: string
  localPath: string
  caption?: string | null
}

export interface ExtractedPdfResult {
  pages: ExtractedPage[]
  images: ExtractedImage[]
}

/**
 * PDF / document extraction service.
 *
 * All conversion goes through the MarkItDown HTTP microservice. The endpoint
 * is configured via the MARKITDOWN_SERVICE_URL environment variable
 * (default http://127.0.0.1:5100).
 *
 * If the service is unreachable, this throws MarkItDownServiceUnavailableError
 * so the caller can clearly report that document extraction is not possible.
 */
export const PdfExtractorService = {
  async extractPdf(pdfPath: string, pageLimit?: number): Promise<ExtractedPdfResult> {
    const healthy = await MarkItDownClient.isHealthy()
    if (!healthy) {
      throw new MarkItDownServiceUnavailableError(getMarkItDownServiceUrl())
    }

    const result = await MarkItDownClient.convert(pdfPath, pageLimit)
    return {
      pages: result.pages.map((p) => ({
        page_number: p.page_number,
        text: p.text,
        blocks: p.blocks,
      })),
      images: [],
    }
  },
}
