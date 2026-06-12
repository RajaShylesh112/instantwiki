import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
export type JobStep = "EXTRACTION" | "CHUNKING" | "EMBEDDINGS" | "TOPIC_DISCOVERY" | "SKELETON" | "FINISHED"

export interface ProcessingJob {
  id: string
  wiki_id: string
  status: JobStatus
  current_step: JobStep
  started_at: string
  finished_at: string | null
  error: string | null
}

export type PageType = "ROOT" | "TOPIC" | "SUBTOPIC" | "REFERENCE"
export type PageGenerationStatus = "PENDING" | "GENERATING" | "GENERATED" | "FAILED"

export interface WikiPage {
  id: string
  wiki_id: string
  parent_page_id: string | null
  slug: string
  title: string
  summary: string | null
  body: string | null
  page_type: PageType
  generation_status: PageGenerationStatus
  confidence_score: number
  created_at: string
  updated_at: string
}

export interface WikiPageAlias {
  id: string
  page_id: string
  alias: string
}

export interface DocumentChunk {
  id: string
  document_id: string
  page_number: number
  chunk_index: number
  content: string
  heading?: string | null
  section?: string | null
  chunk_type?: string | null
  created_at: string
}

export interface DocumentImage {
  id: string
  document_id: string
  page_number: number
  storage_path: string
  caption: string | null
  relevance_score: number
  created_at: string
}

export interface PageChunkReference {
  id: string
  page_id: string
  chunk_id: string
}

export interface WikiPageCitation {
  id: string
  page_id: string
  document_id: string
  page_number: number
  highlight: string
  context: string
}

export const WikiGeneratorRepository = {
  // --- PROCESSING JOBS ---
  async createJob(wikiId: string, step: JobStep = "EXTRACTION"): Promise<ProcessingJob> {
    const { data, error } = await supabase
      .from("processing_jobs")
      .insert({
        wiki_id: wikiId,
        status: "PROCESSING",
        current_step: step,
      })
      .select("*")
      .single()

    if (error) throw error
    return data as ProcessingJob
  },

  async updateJobStep(jobId: string, step: JobStep, status: JobStatus = "PROCESSING", errorMsg?: string): Promise<ProcessingJob> {
    const { data, error } = await supabase
      .from("processing_jobs")
      .update({
        current_step: step,
        status,
        error: errorMsg || null,
        finished_at: status === "COMPLETED" || status === "FAILED" ? new Date().toISOString() : null
      })
      .eq("id", jobId)
      .select("*")
      .single()

    if (error) throw error
    return data as ProcessingJob
  },

  async getLatestJobByWikiId(wikiId: string): Promise<ProcessingJob | null> {
    const { data, error } = await supabase
      .from("processing_jobs")
      .select("*")
      .eq("wiki_id", wikiId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      if (error.code === "42P01") return null
      throw error
    }
    return data as ProcessingJob | null
  },

  async getJobById(jobId: string): Promise<ProcessingJob | null> {
    const { data, error } = await supabase
      .from("processing_jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle()

    if (error) {
      if (error.code === "42P01") return null
      throw error
    }
    return data as ProcessingJob | null
  },

  // --- WIKI PAGES ---
  async fetchWikiPages(wikiId: string): Promise<WikiPage[]> {
    const { data, error } = await supabase
      .from("wiki_pages")
      .select("*")
      .eq("wiki_id", wikiId)
      .order("title", { ascending: true })

    if (error) {
      if (error.code === "42P01") return []
      throw error
    }
    return data as WikiPage[]
  },

  async fetchPageBySlug(wikiId: string, slug: string): Promise<WikiPage | null> {
    const { data, error } = await supabase
      .from("wiki_pages")
      .select("*")
      .eq("wiki_id", wikiId)
      .eq("slug", slug.toLowerCase())
      .maybeSingle()

    if (error) {
      if (error.code === "42P01") return null
      throw error
    }
    return data as WikiPage | null
  },

  async fetchPageById(pageId: string): Promise<WikiPage | null> {
    const { data, error } = await supabase
      .from("wiki_pages")
      .select("*")
      .eq("id", pageId)
      .maybeSingle()

    if (error) {
      if (error.code === "42P01") return null
      throw error
    }
    return data as WikiPage | null
  },

  async insertPageSkeleton(page: {
    wiki_id: string
    parent_page_id?: string | null
    slug: string
    title: string
    summary?: string
    page_type: PageType
    confidence_score?: number
  }): Promise<WikiPage> {
    const { data, error } = await supabase
      .from("wiki_pages")
      .insert({
        wiki_id: page.wiki_id,
        parent_page_id: page.parent_page_id || null,
        slug: page.slug.toLowerCase(),
        title: page.title,
        summary: page.summary || null,
        page_type: page.page_type,
        generation_status: "PENDING",
        confidence_score: page.confidence_score ?? 1.0
      })
      .select("*")
      .single()

    if (error) throw error
    return data as WikiPage
  },

  async updatePageContent(pageId: string, updates: {
    summary?: string
    body?: string
    generation_status: PageGenerationStatus
  }): Promise<WikiPage> {
    const { data, error } = await supabase
      .from("wiki_pages")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", pageId)
      .select("*")
      .single()

    if (error) throw error
    return data as WikiPage
  },

  // --- ALIASES ---
  async insertPageAlias(pageId: string, alias: string): Promise<WikiPageAlias> {
    const { data, error } = await supabase
      .from("wiki_page_aliases")
      .insert({ page_id: pageId, alias })
      .select("*")
      .single()

    if (error) throw error
    return data as WikiPageAlias
  },

  async fetchAllWikiAliases(wikiId: string): Promise<{ page_id: string; alias: string; slug: string }[]> {
    const { data, error } = await supabase
      .from("wiki_page_aliases")
      .select("page_id, alias, wiki_pages(slug)")
      .eq("wiki_pages.wiki_id", wikiId)

    if (error) {
      if (error.code === "42P01") return []
      throw error
    }

    return (data || []).map((row: any) => ({
      page_id: row.page_id,
      alias: row.alias,
      slug: row.wiki_pages?.slug || ""
    }))
  },

  // --- DOCUMENT CHUNKS & EMBEDDINGS ---
  async insertChunk(chunk: {
    document_id: string
    page_number: number
    chunk_index: number
    content: string
    heading?: string | null
    section?: string | null
    chunk_type?: string | null
  }): Promise<DocumentChunk> {
    const { data, error } = await supabase
      .from("document_chunks")
      .insert(chunk)
      .select("*")
      .single()

    if (error) throw error
    return data as DocumentChunk
  },

  async insertEmbedding(embedding: {
    chunk_id: string
    embedding: number[]
    embedding_model: string
  }): Promise<void> {
    const { error } = await supabase
      .from("chunk_embeddings")
      .insert(embedding)

    if (error) throw error
  },

  async insertChunksBulk(chunks: {
    document_id: string
    page_number: number
    chunk_index: number
    content: string
    heading?: string | null
    section?: string | null
    chunk_type?: string | null
  }[]): Promise<DocumentChunk[]> {
    if (chunks.length === 0) return []
    const { data, error } = await supabase
      .from("document_chunks")
      .insert(chunks)
      .select("*")

    if (error) throw error
    return data as DocumentChunk[]
  },

  async insertEmbeddingsBulk(embeddings: {
    chunk_id: string
    embedding: number[]
    embedding_model: string
  }[]): Promise<void> {
    if (embeddings.length === 0) return
    const { error } = await supabase
      .from("chunk_embeddings")
      .insert(embeddings)

    if (error) throw error
  },

  async insertPageSkeletonsBulk(pages: {
    wiki_id: string
    slug: string
    title: string
    summary?: string
    page_type: PageType
    confidence_score?: number
  }[]): Promise<WikiPage[]> {
    if (pages.length === 0) return []
    const formatted = pages.map(p => ({
      wiki_id: p.wiki_id,
      parent_page_id: null,
      slug: p.slug.toLowerCase(),
      title: p.title,
      summary: p.summary || null,
      page_type: p.page_type,
      generation_status: "PENDING",
      confidence_score: p.confidence_score ?? 1.0
    }))
    const { data, error } = await supabase
      .from("wiki_pages")
      .insert(formatted)
      .select("*")

    if (error) throw error
    return data as WikiPage[]
  },

  async insertPageAliasesBulk(aliases: { page_id: string; alias: string }[]): Promise<void> {
    if (aliases.length === 0) return
    const { error } = await supabase
      .from("wiki_page_aliases")
      .insert(aliases)

    if (error) throw error
  },

  async insertPageLinksBulk(links: {
    wiki_id: string
    source_page_id: string
    target_page_id: string
    link_type: string
  }[]): Promise<void> {
    if (links.length === 0) return
    const { error } = await supabase
      .from("page_links")
      .insert(links)

    if (error) throw error
  },

  async insertPageChunkReferencesBulk(refs: { page_id: string; chunk_id: string }[]): Promise<void> {
    if (refs.length === 0) return
    const { error } = await supabase
      .from("page_chunk_references")
      .insert(refs)

    if (error) throw error
  },

  async insertCitationsBulk(citations: {
    page_id: string
    document_id: string
    page_number: number
    highlight: string
    context: string
  }[]): Promise<void> {
    if (citations.length === 0) return
    const { error } = await supabase
      .from("wiki_page_citations")
      .insert(citations)

    if (error) throw error
  },

  /**
   * Performs pgvector cosine similarity search using the Postgres RPC match_chunks.
   */
  async searchSimilarChunks(
    wikiId: string,
    queryEmbedding: number[],
    limit: number = 15,
    threshold: number = 0.35
  ): Promise<{
    chunk_id: string
    document_id: string
    page_number: number
    chunk_index: number
    content: string
    similarity: number
  }[]> {
    const { data, error } = await supabase.rpc("match_chunks", {
      p_wiki_id: wikiId,
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit
    })

    if (error) {
      console.error("Cosine similarity RPC error:", error)
      return []
    }

    return data || []
  },

  // --- DOCUMENT IMAGES ---
  async insertImage(img: {
    document_id: string
    page_number: number
    storage_path: string
    caption?: string | null
    relevance_score?: number
  }): Promise<DocumentImage> {
    const { data, error } = await supabase
      .from("document_images")
      .insert(img)
      .select("*")
      .single()

    if (error) throw error
    return data as DocumentImage
  },

  async fetchImagesByPageNumber(documentId: string, pageNumber: number): Promise<DocumentImage[]> {
    const { data, error } = await supabase
      .from("document_images")
      .select("*")
      .eq("document_id", documentId)
      .eq("page_number", pageNumber)

    if (error) {
      if (error.code === "42P01") return []
      throw error
    }
    return data as DocumentImage[]
  },

  // --- EVIDENCE REFERENCES ---
  async insertPageChunkReference(pageId: string, chunkId: string): Promise<void> {
    const { error } = await supabase
      .from("page_chunk_references")
      .insert({ page_id: pageId, chunk_id: chunkId })
      .select("*")

    if (error && error.code !== "23505") { // Ignore uniqueness duplicate violations
      throw error
    }
  },

  async fetchPageChunkReferences(pageId: string): Promise<{ chunk_id: string; document_id: string; filename: string; page_number: number; content: string }[]> {
    const { data, error } = await supabase
      .from("page_chunk_references")
      .select("chunk_id, document_chunks(document_id, page_number, content, documents(filename))")
      .eq("page_id", pageId)

    if (error) {
      if (error.code === "42P01") return []
      throw error
    }

    return (data || []).map((row: any) => ({
      chunk_id: row.chunk_id,
      document_id: row.document_chunks?.document_id || "",
      filename: row.document_chunks?.documents?.filename || "Unknown Source",
      page_number: row.document_chunks?.page_number || 1,
      content: row.document_chunks?.content || ""
    }))
  },

  // --- CITATIONS ---
  async insertCitation(citation: {
    page_id: string
    document_id: string
    page_number: number
    highlight: string
    context: string
  }): Promise<WikiPageCitation> {
    const { data, error } = await supabase
      .from("wiki_page_citations")
      .insert(citation)
      .select("*")
      .single()

    if (error) throw error
    return data as WikiPageCitation
  },

  async fetchPageCitations(pageId: string): Promise<WikiPageCitation[]> {
    const { data, error } = await supabase
      .from("wiki_page_citations")
      .select("*")
      .eq("page_id", pageId)

    if (error) {
      if (error.code === "42P01") return []
      throw error
    }
    return data as WikiPageCitation[]
  },

  // --- PAGE LINKS ---
  async insertPageLink(link: {
    wiki_id: string
    source_page_id: string
    target_page_id: string
    link_type?: string
  }): Promise<void> {
    const { error } = await supabase
      .from("page_links")
      .insert({
        wiki_id: link.wiki_id,
        source_page_id: link.source_page_id,
        target_page_id: link.target_page_id,
        link_type: link.link_type || "internal"
      })
    if (error && error.code !== "23505") { // Ignore duplicates
      throw error
    }
  },

  async fetchPageLinks(wikiId: string): Promise<{ source_page_id: string; target_page_id: string; link_type: string }[]> {
    const { data, error } = await supabase
      .from("page_links")
      .select("source_page_id, target_page_id, link_type")
      .eq("wiki_id", wikiId)
    if (error) {
      if (error.code === "42P01") return []
      throw error
    }
    return data || []
  }
}
