/**
 * MarkItDown Service Client
 * ==========================
 * TypeScript client for the self-contained MarkItDown Python microservice.
 * All document conversion goes through the HTTP API instead of spawning
 * Python processes directly.
 *
 * Configuration:
 *   Set MARKITDOWN_SERVICE_URL in .env to point at the service endpoint.
 *   Default: http://127.0.0.1:5100
 *
 * Usage:
 *   import { MarkItDownClient } from "@/services/markitdown/client"
 *   const result = await MarkItDownClient.convert(filePath, pageLimit)
 */

export interface ExtractedBlock {
  type: "text" | "heading" | "table"
  content: string
  level?: number
}

export interface ExtractedPage {
  page_number: number
  text: string
  blocks: ExtractedBlock[]
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

export interface ConvertResult {
  success: boolean
  pages: ExtractedPage[]
  images: ExtractedImage[]
  error?: string
}

const DEFAULT_URL = "http://127.0.0.1:5100"

/** Resolve the service URL from env at call time so tests / runtime overrides work. */
export function getMarkItDownServiceUrl(): string {
  return (process.env.MARKITDOWN_SERVICE_URL || DEFAULT_URL).replace(/\/+$/, "")
}

/**
 * Thrown when the MarkItDown microservice is unreachable or refuses connections.
 * Callers should treat this as "document extraction is not possible" rather
 * than retry or fall back to mocks.
 */
export class MarkItDownServiceUnavailableError extends Error {
  readonly url: string
  readonly cause?: unknown

  constructor(url: string, cause?: unknown) {
    const reason =
      cause instanceof Error ? cause.message : cause ? String(cause) : "no response"
    super(
      `Document extraction is not possible: MarkItDown service is unavailable at ${url} (${reason}). ` +
        `Start the service with \`python server.py\` from apps/web/services/markitdown, ` +
        `or set MARKITDOWN_SERVICE_URL in .env to a reachable endpoint.`
    )
    this.name = "MarkItDownServiceUnavailableError"
    this.url = url
    this.cause = cause
  }
}

export interface BatchConvertResult {
  results: Array<{
    file_path: string
    success: boolean
    pages: ExtractedPage[]
    images: ExtractedImage[]
    error?: string
  }>
}

export interface SupportedFormat {
  extension: string
  mime_type: string
  description: string
}

export interface FormatsResponse {
  formats: SupportedFormat[]
  with_ocr: string[]
  requires_llm: string
}

export interface ServiceInfo {
  service: string
  version: string
  markitdown_version: string
  llm_configured: boolean
  ocr_available: boolean
  endpoints: Record<string, string>
}

export const MarkItDownClient = {
  /**
   * Convert a document file to markdown via the MarkItDown microservice.
   * Throws MarkItDownServiceUnavailableError if the service can't be reached.
   */
  async convert(filePath: string, pageLimit?: number): Promise<ConvertResult> {
    const url = getMarkItDownServiceUrl()
    const body: Record<string, unknown> = { file_path: filePath }
    if (pageLimit !== undefined) {
      body.page_limit = pageLimit
    }

    let response: Response
    try {
      response = await fetch(`${url}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    } catch (err) {
      throw new MarkItDownServiceUnavailableError(url, err)
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      throw new Error(
        `MarkItDown service returned ${response.status}: ${text || response.statusText}`
      )
    }

    const data = (await response.json()) as ConvertResult
    if (!data.success) {
      throw new Error(data.error || "MarkItDown conversion failed")
    }
    return data
  },

  /**
   * Convert multiple documents in a single request.
   * Returns an array of results with per-file success/error status.
   * Throws MarkItDownServiceUnavailableError if the service can't be reached.
   */
  async convertBatch(filePaths: string[], pageLimit?: number): Promise<BatchConvertResult> {
    const url = getMarkItDownServiceUrl()
    const body: Record<string, unknown> = { file_paths: filePaths }
    if (pageLimit !== undefined) {
      body.page_limit = pageLimit
    }

    let response: Response
    try {
      response = await fetch(`${url}/convert-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    } catch (err) {
      throw new MarkItDownServiceUnavailableError(url, err)
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      throw new Error(
        `MarkItDown batch service returned ${response.status}: ${text || response.statusText}`
      )
    }

    return (await response.json()) as BatchConvertResult
  },

  /**
   * Convert a document from base64-encoded bytes without requiring filesystem access.
   * Useful for processing uploaded files or in-memory documents.
   * Throws MarkItDownServiceUnavailableError if the service can't be reached.
   */
  async convertFromBytes(
    fileBytes: Buffer | Uint8Array,
    filename: string,
    pageLimit?: number
  ): Promise<ConvertResult> {
    const url = getMarkItDownServiceUrl()
    const base64Data = Buffer.from(fileBytes).toString("base64")
    const body: Record<string, unknown> = {
      file_bytes_base64: base64Data,
      filename,
    }
    if (pageLimit !== undefined) {
      body.page_limit = pageLimit
    }

    let response: Response
    try {
      response = await fetch(`${url}/convert-bytes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    } catch (err) {
      throw new MarkItDownServiceUnavailableError(url, err)
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      throw new Error(
        `MarkItDown bytes service returned ${response.status}: ${text || response.statusText}`
      )
    }

    const data = (await response.json()) as ConvertResult
    if (!data.success) {
      throw new Error(data.error || "MarkItDown conversion from bytes failed")
    }
    return data
  },

  /**
   * Get list of all supported file formats with metadata.
   * Throws MarkItDownServiceUnavailableError if the service can't be reached.
   */
  async getSupportedFormats(): Promise<FormatsResponse> {
    const url = getMarkItDownServiceUrl()

    let response: Response
    try {
      response = await fetch(`${url}/formats`, {
        method: "GET",
      })
    } catch (err) {
      throw new MarkItDownServiceUnavailableError(url, err)
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      throw new Error(
        `MarkItDown formats endpoint returned ${response.status}: ${text || response.statusText}`
      )
    }

    return (await response.json()) as FormatsResponse
  },

  /**
   * Get service information including version, configuration, and available endpoints.
   * Throws MarkItDownServiceUnavailableError if the service can't be reached.
   */
  async getServiceInfo(): Promise<ServiceInfo> {
    const url = getMarkItDownServiceUrl()

    let response: Response
    try {
      response = await fetch(`${url}/info`, {
        method: "GET",
      })
    } catch (err) {
      throw new MarkItDownServiceUnavailableError(url, err)
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      throw new Error(
        `MarkItDown info endpoint returned ${response.status}: ${text || response.statusText}`
      )
    }

    return (await response.json()) as ServiceInfo
  },

  /** Check if the MarkItDown service is running and healthy. */
  async isHealthy(): Promise<boolean> {
    const url = getMarkItDownServiceUrl()
    try {
      const response = await fetch(`${url}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(2000),
      })
      return response.ok
    } catch {
      return false
    }
  },
}
