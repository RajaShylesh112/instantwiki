import { supabase } from "@/lib/supabase";



export type DocumentSourceType = "FILE" | "URL"
export type DocumentMimeType = "pdf" | "md" | "txt" | "docx"
export type DocumentProcessingStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED"

export interface Document {
  id: string
  wiki_id: string
  filename: string
  storage_path: string
  source_type: DocumentSourceType
  mime_type: DocumentMimeType
  content_hash: string
  processing_status: DocumentProcessingStatus
  file_size?: number
  created_at: string
  updated_at: string
}

export const DocumentRepository = {
  /**
   * Fetch all documents belonging to a specific wiki ID.
   */
  async fetchWikiDocuments(wikiId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("wiki_id", wikiId)
      .order("created_at", { ascending: false })

    if (error) {
      // If table doesn't exist, we fallback to empty array for graceful mock runtime
      if (error.code === "42P01") {
        console.warn("Table public.documents does not exist. Returning empty array.")
        return []
      }
      throw error
    }

    return data as Document[]
  },

  /**
   * Find a document by content hash inside the same wiki (local check).
   */
  async findDocumentByHash(wikiId: string, contentHash: string): Promise<Document | null> {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("wiki_id", wikiId)
      .eq("content_hash", contentHash)
      .maybeSingle()

    if (error) {
      if (error.code === "42P01") return null
      throw error
    }

    return data as Document | null
  },

  /**
   * Find a document globally by content hash across any wiki (global search for deduplication).
   */
  async findGlobalDocumentByHash(contentHash: string): Promise<Document | null> {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("content_hash", contentHash)
      .limit(1)
      .maybeSingle()

    if (error) {
      if (error.code === "42P01") return null
      throw error
    }

    return data as Document | null
  },

  /**
   * Insert a new document record.
   */
  async insertDocument(doc: {
    wiki_id: string
    filename: string
    storage_path: string
    source_type: DocumentSourceType
    mime_type: DocumentMimeType
    content_hash: string
    processing_status?: DocumentProcessingStatus
    file_size?: number
  }): Promise<Document> {
    const { data, error } = await supabase
      .from("documents")
      .insert({
        wiki_id: doc.wiki_id,
        filename: doc.filename,
        storage_path: doc.storage_path,
        source_type: doc.source_type,
        mime_type: doc.mime_type,
        content_hash: doc.content_hash,
        processing_status: doc.processing_status || "PENDING",
        file_size: doc.file_size || 0
      })
      .select("*")
      .single()

    if (error) {
      throw error
    }

    return data as Document
  },

  /**
   * Delete a document by ID.
   */
  async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)

    if (error) {
      throw error
    }
  }
}
