import { supabase } from "@/lib/supabase";
import { NextRequest } from "next/server"
import { auth } from "auth"
import { createHash } from "crypto"
import { DocumentRepository, DocumentSourceType, DocumentMimeType } from "@/lib/repositories/document"
import { canUploadDocument } from "@/services/limits"



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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wiki_id: string }> }
) {
  try {
    const { wiki_id } = await params
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("documentId")

    if (!documentId) {
      return Response.json({ error: "Missing documentId" }, { status: 400 })
    }

    // Query chunk references for this document
    const { data: chunkRefs, error } = await supabase
      .from("page_chunk_references")
      .select(`
        chunk_id,
        page_id,
        wiki_pages!inner (title, slug, wiki_id),
        document_chunks!inner (document_id, page_number, content)
      `)
      .eq("document_chunks.document_id", documentId)
      .eq("wiki_pages.wiki_id", wiki_id)

    if (error) throw error

    // Format output
    const citations = (chunkRefs || []).map((row: any) => ({
      chunk_id: row.chunk_id,
      page_id: row.page_id,
      page_title: row.wiki_pages?.title || "Unknown Page",
      page_slug: row.wiki_pages?.slug || "",
      page_number: row.document_chunks?.page_number || 1,
      content: row.document_chunks?.content || ""
    }))

    return Response.json({ citations })
  } catch (err: any) {
    console.error("Error fetching document citations:", err)
    return Response.json({ error: err.message || "Server Error" }, { status: 500 })
  }
}

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

    // Resolve database user ID
    let userId = session.user.id
    if (!userId && session.user.email) {
      const { data: dbUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", session.user.email)
        .maybeSingle()
      if (dbUser) {
        userId = dbUser.id
      }
    }

    if (!userId) {
      return Response.json({ error: "User not found in database." }, { status: 404 })
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
      const fileSize = buffer.length

      // Enforce file upload size and document count limits
      const limitCheck = await canUploadDocument(userId, fileSize)
      if (!limitCheck.allowed) {
        return Response.json({ error: limitCheck.error }, { status: 403 })
      }
      
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
          processing_status: "READY", // Reused files skip processing
          file_size: fileSize
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
            processing_status: "READY",
            file_size: fileSize
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
        processing_status: "READY",
        file_size: fileSize
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
      const fileSize = textBuffer.length

      // Enforce document and storage limit checks for URL import
      const limitCheck = await canUploadDocument(userId, fileSize)
      if (!limitCheck.allowed) {
        return Response.json({ error: limitCheck.error }, { status: 403 })
      }
      
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
          processing_status: "READY",
          file_size: fileSize
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
            processing_status: "READY",
            file_size: fileSize
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
        processing_status: "READY",
        file_size: fileSize
      })

      return Response.json({ status: "NEW", doc: newDoc })
    }

  } catch (err: any) {
    console.error("Error handling document ingestion API:", err)
    return Response.json({ error: err.message || "Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ wiki_id: string }> }
) {
  try {
    const { wiki_id } = await params
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized session" }, { status: 401 })
    }

    const { docId } = await request.json()
    if (!docId) {
      return Response.json({ error: "No document ID provided" }, { status: 400 })
    }

    // 1. Fetch document and verify existence
    const { data: document, error: docErr } = await supabase
      .from("documents")
      .select("*")
      .eq("id", docId)
      .maybeSingle()

    if (docErr) {
      console.error("Error fetching document:", docErr)
      return Response.json({ error: "Database error fetching document." }, { status: 500 })
    }

    if (!document) {
      return Response.json({ error: "Document not found." }, { status: 404 })
    }

    if (document.wiki_id !== wiki_id) {
      return Response.json({ error: "Document does not belong to this wiki." }, { status: 400 })
    }

    // 2. Fetch the wiki properties to verify ownership
    const { data: wiki, error: wikiErr } = await supabase
      .from("wikis")
      .select("owner_id")
      .eq("id", wiki_id)
      .maybeSingle()

    if (wikiErr || !wiki) {
      console.error("Error fetching wiki for document deletion:", wikiErr)
      return Response.json({ error: "Wiki not found or database error." }, { status: 404 })
    }

    // 3. Resolve authenticated user details to check owner ID
    const { data: dbUser, error: userErr } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .maybeSingle()

    if (userErr || !dbUser) {
      console.error("Error fetching db user during document deletion:", userErr)
      return Response.json({ error: "Could not resolve user ownership profile." }, { status: 403 })
    }

    if (wiki.owner_id !== dbUser.id) {
      return Response.json({ error: "Forbidden. You do not own this wiki." }, { status: 403 })
    }

    // 4. Purge Files from Supabase Storage
    try {
      // 4a. Check if the PDF/TXT/MD storage path is shared by other document entries (deduplication)
      if (document.storage_path && !document.storage_path.startsWith("mock-bucket/")) {
        const { count, error: countErr } = await supabase
          .from("documents")
          .select("*", { count: "exact", head: true })
          .eq("storage_path", document.storage_path)

        if (!countErr && (count === null || count <= 1)) {
          // No other documents use this file, safe to delete
          const { error: pdfStorageErr } = await supabase.storage
            .from("documents")
            .remove([document.storage_path])
          if (pdfStorageErr) {
            console.warn("Non-fatal: Error deleting PDF file from storage:", pdfStorageErr)
          }
        }
      }

      // 4b. Collect related cropped figure images and delete them from storage
      const { data: images, error: imagesErr } = await supabase
        .from("document_images")
        .select("storage_path")
        .eq("document_id", docId)

      if (!imagesErr && images && images.length > 0) {
        const imgPaths = images
          .map((img) => img.storage_path)
          .filter((path) => path && !path.startsWith("mock-bucket/"))

        if (imgPaths.length > 0) {
          const { error: imgStorageErr } = await supabase.storage
            .from("documents")
            .remove(imgPaths)
          if (imgStorageErr) {
            console.warn("Non-fatal: Error deleting image files from storage:", imgStorageErr)
          }
        }
      }
    } catch (storageErr) {
      console.error("Non-fatal: Supabase storage purge exception:", storageErr)
    }

    // 5. Database Manual Cascades in order (child first)
    // 5a. Get chunk IDs
    const { data: chunks, error: chunksErr } = await supabase
      .from("document_chunks")
      .select("id")
      .eq("document_id", docId)

    if (!chunksErr && chunks && chunks.length > 0) {
      const chunkIds = chunks.map((c) => c.id)
      
      // Delete chunk embeddings
      await supabase.from("chunk_embeddings").delete().in("chunk_id", chunkIds)
      
      // Delete page chunk references
      await supabase.from("page_chunk_references").delete().in("chunk_id", chunkIds)
    }

    // 5b. Delete wiki page citations
    await supabase.from("wiki_page_citations").delete().eq("document_id", docId)

    // 5c. Delete document images
    await supabase.from("document_images").delete().eq("document_id", docId)

    // 5d. Delete document chunks
    await supabase.from("document_chunks").delete().eq("document_id", docId)

    // 5e. Delete core document record
    const { error: deleteDocErr } = await supabase
      .from("documents")
      .delete()
      .eq("id", docId)

    if (deleteDocErr) {
      console.error("Error deleting document record:", deleteDocErr)
      throw deleteDocErr
    }

    return Response.json({ success: true })

  } catch (err: any) {
    console.error("Error deleting document:", err)
    return Response.json({ error: err.message || "Server Error" }, { status: 500 })
  }
}

