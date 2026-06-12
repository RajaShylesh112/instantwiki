import { supabase } from "@/lib/supabase";
import { NextRequest } from "next/server"
import { auth } from "auth"
import { WikiGeneratorRepository } from "@/lib/repositories/wiki-generator"



export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wiki_id: string; page_id: string }> }
) {
  try {
    const { wiki_id, page_id } = await params

    // 1. Session Auth Guard
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized session" }, { status: 401 })
    }

    // 2. Fetch citations
    const citations = await WikiGeneratorRepository.fetchPageCitations(page_id)

    // 3. Fetch cited images by mapping chunk references
    const chunkRefs = await WikiGeneratorRepository.fetchPageChunkReferences(page_id)
    const imagesList = []

    // Avoid duplicate requests for same document page numbers
    const processedPageKeys = new Set<string>()

    for (const ref of chunkRefs) {
      const key = `${ref.document_id}-${ref.page_number}`
      if (processedPageKeys.has(key)) continue
      processedPageKeys.add(key)

      const pageImages = await WikiGeneratorRepository.fetchImagesByPageNumber(
        ref.document_id,
        ref.page_number
      )
      
      for (const img of pageImages) {
        imagesList.push({
          ...img,
          sourceFilename: ref.filename
        })
      }
    }

    // Resolve document filenames for the citations
    const enrichedCitations = []
    for (const cit of citations) {
      // Find document filename
      let filename = "Source Document"
      const { data: doc } = await supabase
        .from("documents")
        .select("filename")
        .eq("id", cit.document_id)
        .maybeSingle()
      if (doc) {
        filename = doc.filename
      }

      enrichedCitations.push({
        ...cit,
        sourceName: filename
      })
    }

    // Fetch backlinks where target_page_id is this page
    const { data: backlinksData } = await supabase
      .from("page_links")
      .select("source_page_id, link_type")
      .eq("target_page_id", page_id)

    return Response.json({
      citations: enrichedCitations,
      images: imagesList,
      chunkReferences: chunkRefs,
      backlinks: backlinksData || []
    })

  } catch (err: any) {
    console.error("Error fetching page assets:", err)
    return Response.json({ error: err.message || "Server Error" }, { status: 500 })
  }
}
