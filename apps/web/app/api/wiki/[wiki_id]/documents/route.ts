import { NextRequest } from "next/server"
import { auth } from "auth"
import { createClient } from "@supabase/supabase-js"
import { createHash } from "crypto"
import { DocumentRepository, DocumentSourceType, DocumentMimeType } from "@/lib/repositories/document"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

// Media and video domains to reject
const MEDIA_DOMAINS = [
  "youtube.com", "youtu.be", "vimeo.com", "instagram.com", 
  "tiktok.com", "spotify.com", "twitch.tv", "soundcloud.com",
  "netflix.com", "hulu.com", "disneyplus.com"
]

// HTML tag remover helper
function extractTextFromHtml(html: string): string {
  // Remove script and style elements completely
  let text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
  // Replace HTML tags with spaces
  text = text.replace(/<[^>]+>/g, " ")
  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim()
  return text
}

// SHA256 Hashing helper
function calculateHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex")
}

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ wiki_id: string }> }
) {
  try {
    const { wiki_id } = await params

    // 1. Session auth guard
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized session" }, { status: 401 })
    }

    // 2. Parse form data
    const formData = await request.formData()
    const sourceType = formData.get("sourceType") as DocumentSourceType

    if (!sourceType || (sourceType !== "FILE" && sourceType !== "URL")) {
      return Response.json({ error: "Invalid source type specified." }, { status: 400 })
    }

    // --- CASE A: FILE UPLOAD ---
    if (sourceType === "FILE") {
      const file = formData.get("file") as File | null
      if (!file) {
        return Response.json({ error: "No file uploaded." }, { status: 400 })
      }

      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer())
      const filename = file.name
      
      // Determine mime_type
      const ext = filename.split(".").pop()?.toLowerCase() || ""
      let mimeType: DocumentMimeType = "pdf"
      if (ext === "md") mimeType = "md"
      else if (ext === "txt") mimeType = "txt"
      else if (ext === "docx") mimeType = "docx"

      // Calculate SHA256 content hash
      const contentHash = calculateHash(buffer)

      // A1. Local Deduplication: check if hash exists in this wiki
      const localDup = await DocumentRepository.findDocumentByHash(wiki_id, contentHash)
      if (localDup) {
        return Response.json({ status: "EXISTS", doc: localDup })
      }

      // A2. Global Deduplication: check if hash exists in any wiki
      const globalDup = await DocumentRepository.findGlobalDocumentByHash(contentHash)
      if (globalDup) {
        // Reuse existing storage path, skip upload
        const newDoc = await DocumentRepository.insertDocument({
          wiki_id,
          filename,
          storage_path: globalDup.storage_path,
          source_type: "FILE",
          mime_type: mimeType,
          content_hash: contentHash,
          processing_status: "READY" // Reused files skip processing
        })

        return Response.json({ status: "REUSED", doc: newDoc })
      }

      // A3. Completely New File: Upload to Supabase Storage
      const storagePath = `global/${contentHash}/${filename}`
      
      // Upload to bucket 'documents'
      const { error: uploadErr } = await supabase.storage
        .from("documents")
        .upload(storagePath, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: true
        })

      if (uploadErr) {
        console.error("Supabase storage upload error:", uploadErr)
        // Fallback to local DB record insertion even if bucket does not exist (for mock development)
        if (
          uploadErr.message?.includes("does not exist") || 
          uploadErr.message?.includes("Invalid API key") ||
          uploadErr.message?.includes("Bucket not found")
        ) {
          const mockDoc = await DocumentRepository.insertDocument({
            wiki_id,
            filename,
            storage_path: `mock-bucket/${storagePath}`,
            source_type: "FILE",
            mime_type: mimeType,
            content_hash: contentHash,
            processing_status: "READY"
          })
          return Response.json({ status: "NEW", doc: mockDoc, warning: "Uploaded in mock sandbox environment." })
        }
        throw uploadErr
      }

      // Insert record in DB
      const newDoc = await DocumentRepository.insertDocument({
        wiki_id,
        filename,
        storage_path: storagePath,
        source_type: "FILE",
        mime_type: mimeType,
        content_hash: contentHash,
        processing_status: "READY"
      })

      return Response.json({ status: "NEW", doc: newDoc })
    }

    // --- CASE B: URL IMPORT ---
    if (sourceType === "URL") {
      const urlInput = formData.get("url") as string | null
      if (!urlInput) {
        return Response.json({ error: "No URL provided." }, { status: 400 })
      }

      let parsedUrl: URL
      try {
        parsedUrl = new URL(urlInput)
      } catch (e) {
        return Response.json({ error: "Invalid URL format." }, { status: 400 })
      }

      const hostname = parsedUrl.hostname.toLowerCase()

      // B1. Domain Blacklist Validation
      if (MEDIA_DOMAINS.some(domain => hostname.includes(domain))) {
        return Response.json({ 
          error: "Non-textual website rejected. Importing from YouTube, Vimeo, or social media sites is not supported." 
        }, { status: 400 })
      }

      // B2. Scrape Page & Content-Type Check
      let response: Response
      try {
        response = await fetch(urlInput, {
          headers: { "User-Agent": "InstantWikiCrawler/1.0" }
        })
      } catch (err) {
        return Response.json({ error: "Failed to fetch website. Access was blocked or domain is offline." }, { status: 400 })
      }

      const contentType = response.headers.get("content-type") || ""
      if (!contentType.includes("text/html") && !contentType.includes("text/plain") && !contentType.includes("application/xhtml+xml")) {
        return Response.json({ 
          error: "Non-textual website rejected. The destination link does not return readable HTML or text." 
        }, { status: 400 })
      }

      const htmlContent = await response.text()
      const extractedText = extractTextFromHtml(htmlContent)

      // Check text density
      if (extractedText.length < 50) {
        return Response.json({ 
          error: "Website rejected. No substantial textual content could be extracted from this page." 
        }, { status: 400 })
      }

      const textBuffer = Buffer.from(extractedText, "utf-8")
      const contentHash = calculateHash(textBuffer)
      
      // Clean filename derived from hostname + pathname
      const cleanPath = parsedUrl.pathname.replace(/\/$/, "").replace(/\//g, "-")
      const filename = `${hostname}${cleanPath || "-homepage"}.txt`

      // B3. Local check
      const localDup = await DocumentRepository.findDocumentByHash(wiki_id, contentHash)
      if (localDup) {
        return Response.json({ status: "EXISTS", doc: localDup })
      }

      // B4. Global check
      const globalDup = await DocumentRepository.findGlobalDocumentByHash(contentHash)
      if (globalDup) {
        // Reuse path
        const newDoc = await DocumentRepository.insertDocument({
          wiki_id,
          filename,
          storage_path: globalDup.storage_path,
          source_type: "URL",
          mime_type: "txt",
          content_hash: contentHash,
          processing_status: "READY"
        })
        return Response.json({ status: "REUSED", doc: newDoc })
      }

      // B5. Upload extracted text file to Supabase Storage
      const storagePath = `global/${contentHash}/${filename}`

      const { error: uploadErr } = await supabase.storage
        .from("documents")
        .upload(storagePath, textBuffer, {
          contentType: "text/plain",
          upsert: true
        })

      if (uploadErr) {
        console.error("Supabase Storage URL text upload error:", uploadErr)
        // Fallback for mock sandbox environment
        if (
          uploadErr.message?.includes("does not exist") || 
          uploadErr.message?.includes("Invalid API key") ||
          uploadErr.message?.includes("Bucket not found")
        ) {
          const mockDoc = await DocumentRepository.insertDocument({
            wiki_id,
            filename,
            storage_path: `mock-bucket/${storagePath}`,
            source_type: "URL",
            mime_type: "txt",
            content_hash: contentHash,
            processing_status: "READY"
          })
          return Response.json({ status: "NEW", doc: mockDoc, warning: "Uploaded in mock sandbox environment." })
        }
        throw uploadErr
      }

      // Insert record in DB
      const newDoc = await DocumentRepository.insertDocument({
        wiki_id,
        filename,
        storage_path: storagePath,
        source_type: "URL",
        mime_type: "txt",
        content_hash: contentHash,
        processing_status: "READY"
      })

      return Response.json({ status: "NEW", doc: newDoc })
    }

  } catch (err: any) {
    console.error("Error handling document ingestion API:", err)
    return Response.json({ error: err.message || "Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { docId } = await request.json()
    if (!docId) {
      return Response.json({ error: "No document ID provided" }, { status: 400 })
    }

    await DocumentRepository.deleteDocument(docId)
    return Response.json({ success: true })
  } catch (err: any) {
    console.error("Error deleting document:", err)
    return Response.json({ error: err.message || "Server Error" }, { status: 500 })
  }
}
