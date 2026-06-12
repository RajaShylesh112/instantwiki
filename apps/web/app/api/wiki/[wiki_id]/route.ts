import { supabase } from "@/lib/supabase";
import { NextRequest } from "next/server"
import { auth } from "auth"



export const dynamic = "force-dynamic"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ wiki_id: string }> }
) {
  try {
    const { wiki_id } = await params

    // 1. Session Auth Guard
    const session = await auth()
    if (!session?.user) {
      return Response.json({ error: "Unauthorized session" }, { status: 401 })
    }

    // 2. Fetch the wiki to verify existence and check ownership
    const { data: wiki, error: wikiErr } = await supabase
      .from("wikis")
      .select("*")
      .eq("id", wiki_id)
      .maybeSingle()

    if (wikiErr) {
      console.error("Error fetching wiki for deletion:", wikiErr)
      return Response.json({ error: "Database error fetching wiki properties." }, { status: 500 })
    }

    if (!wiki) {
      return Response.json({ error: "Wiki not found." }, { status: 404 })
    }

    // Resolve authenticated user details to check owner ID
    const { data: dbUser, error: userErr } = await supabase
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .maybeSingle()

    if (userErr || !dbUser) {
      console.error("Error fetching db user during wiki deletion:", userErr)
      return Response.json({ error: "Could not resolve user ownership profile." }, { status: 403 })
    }

    if (wiki.owner_id !== dbUser.id) {
      return Response.json({ error: "Forbidden. You do not own this wiki." }, { status: 403 })
    }

    // 3. Fetch metadata for all documents and pages in this wiki
    const { data: documents } = await supabase
      .from("documents")
      .select("id, storage_path")
      .eq("wiki_id", wiki_id)

    const { data: pages } = await supabase
      .from("wiki_pages")
      .select("id")
      .eq("wiki_id", wiki_id)

    const docIds = (documents || []).map((d) => d.id)
    const pageIds = (pages || []).map((p) => p.id)

    // 4. Purge Files from Supabase Storage
    try {
      // Collect PDF storage paths
      const pdfPaths = (documents || [])
        .map((d) => d.storage_path)
        .filter((path) => path && !path.startsWith("mock-bucket/"))

      if (pdfPaths.length > 0) {
        const { error: pdfStorageErr } = await supabase.storage
          .from("documents")
          .remove(pdfPaths)
        if (pdfStorageErr) {
          console.warn("Non-fatal: Error deleting PDF files from storage:", pdfStorageErr)
        }
      }

      // Collect cropped figure image paths
      if (docIds.length > 0) {
        const { data: images } = await supabase
          .from("document_images")
          .select("storage_path")
          .in("document_id", docIds)

        const imgPaths = (images || [])
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

    // 5. Manual Database Cascade Deletion in strict order (child first)
    // Deleting via Supabase client, ignoring duplicate/not-found constraint errors where safe

    // A. chunk_embeddings & page_chunk_references (by chunk_id)
    if (docIds.length > 0) {
      const { data: chunks } = await supabase
        .from("document_chunks")
        .select("id")
        .in("document_id", docIds)

      const chunkIds = (chunks || []).map((c) => c.id)

      if (chunkIds.length > 0) {
        await supabase.from("chunk_embeddings").delete().in("chunk_id", chunkIds)
        await supabase.from("page_chunk_references").delete().in("chunk_id", chunkIds)
      }
    }

    // B. page_chunk_references, citations, and aliases (by page_id)
    if (pageIds.length > 0) {
      await supabase.from("page_chunk_references").delete().in("page_id", pageIds)
      await supabase.from("wiki_page_citations").delete().in("page_id", pageIds)
      await supabase.from("wiki_page_aliases").delete().in("page_id", pageIds)
    }

    // C. wiki_page_citations (by document_id)
    if (docIds.length > 0) {
      await supabase.from("wiki_page_citations").delete().in("document_id", docIds)
    }

    // D. wiki_page_hierarchy
    await supabase.from("wiki_page_hierarchy").delete().eq("wiki_id", wiki_id)

    // E. wiki_pages
    await supabase.from("wiki_pages").delete().eq("wiki_id", wiki_id)

    // F. processing_jobs
    await supabase.from("processing_jobs").delete().eq("wiki_id", wiki_id)

    // G. document_images
    if (docIds.length > 0) {
      await supabase.from("document_images").delete().in("document_id", docIds)
    }

    // H. document_chunks
    if (docIds.length > 0) {
      await supabase.from("document_chunks").delete().in("document_id", docIds)
    }

    // I. documents
    await supabase.from("documents").delete().eq("wiki_id", wiki_id)

    // J. Delete Core Wiki Record
    const { error: deleteWikiErr } = await supabase
      .from("wikis")
      .delete()
      .eq("id", wiki_id)

    if (deleteWikiErr) {
      console.error("Error deleting wikis record:", deleteWikiErr)
      throw deleteWikiErr
    }

    return Response.json({ success: true })

  } catch (err: any) {
    console.error("Exception in workspace deletion handler:", err)
    return Response.json({ error: err.message || "Failed to delete wiki workspace" }, { status: 500 })
  }
}
