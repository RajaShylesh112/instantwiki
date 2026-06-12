import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation"
import { WikiRepository } from "@/lib/repositories/wiki"
import { WikiGeneratorRepository } from "@/lib/repositories/wiki-generator"
import ArticleView from "./article-view"



interface ArticlePageProps {
  params: Promise<{
    username: string
    wiki_slug: string
    page_slug: string
  }>
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { username, wiki_slug, page_slug } = await params

  // 1. Resolve owner user ID
  let ownerUser: { id: string; email: string; username: string } | null = null
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, username")
      .eq("username", username.toLowerCase())
      .maybeSingle()

    if (!error && data) {
      ownerUser = data
    }
  } catch (err) {
    console.error("Error fetching owner:", err)
  }

  // 2. Fetch Wiki
  let wiki: any = null
  let isMocked = false

  if (ownerUser) {
    try {
      wiki = await WikiRepository.getOrCreateWikiBySlug(ownerUser.id, wiki_slug)
      if (wiki.id === "00000000-0000-0000-0000-000000000000") {
        isMocked = true
      }
    } catch (dbErr: any) {
      if (dbErr?.code === "42P01") isMocked = true
    }
  }

  if (!wiki) {
    const displayTitle = wiki_slug
      .replace(/-+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
    wiki = {
      id: "00000000-0000-0000-0000-000000000000",
      title: displayTitle || "Wiki Database",
      slug: wiki_slug,
    }
    isMocked = true
  }

  // 3. Fetch Page by Slug
  let page: any = null
  if (wiki?.id) {
    try {
      page = await WikiGeneratorRepository.fetchPageBySlug(wiki.id, page_slug)
    } catch (err) {
      console.error("Error fetching page:", err)
    }
  }

  // Fallback mock pages if not found/mocked
  if (!page && isMocked) {
    const displayTitle = wiki_slug
      .replace(/-+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
    const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

    const rootSlug = slugify(`introduction-to-${wiki_slug}`)
    const coreSlug = slugify(`${wiki_slug}-core-principles`)
    const methodSlug = slugify(`${wiki_slug}-methodology`)

    const mockDetails: Record<string, any> = {
      [rootSlug]: {
        id: "mock-page-1",
        wiki_id: wiki.id,
        parent_page_id: null,
        slug: rootSlug,
        title: `Introduction to ${displayTitle}`,
        summary: `Foundational overview, scope, and objectives of the ${displayTitle} workspace.`,
        body: `
### Overview of ${displayTitle}

Before diving deep into ${displayTitle}, it is important to establish the core objectives and scope. This workspace serves as a structured repository for all relevant documentation, analysis, and metadata.
`,
        page_type: "ROOT",
        generation_status: "GENERATED",
        confidence_score: 0.98
      },
      [coreSlug]: {
        id: "mock-page-2",
        wiki_id: wiki.id,
        parent_page_id: "mock-page-1",
        slug: coreSlug,
        title: `${displayTitle} Core Principles`,
        summary: `Analyzing key concepts, terminology, and structural models in ${displayTitle}.`,
        body: `
### Key Concepts

This section covers the core principles, terminology, and key concepts that form the basis of **${displayTitle}**.
`,
        page_type: "TOPIC",
        generation_status: "GENERATED",
        confidence_score: 0.94
      },
      [methodSlug]: {
        id: "mock-page-3",
        wiki_id: wiki.id,
        parent_page_id: "mock-page-1",
        slug: methodSlug,
        title: `${displayTitle} Methodology`,
        summary: `Practical applications, processes, and standard workflows for ${displayTitle}.`,
        body: `
### Methodology & Implementation

This section details the practical applications, implementation procedures, and standard workflows of **${displayTitle}**.
`,
        page_type: "TOPIC",
        generation_status: "GENERATED",
        confidence_score: 0.89
      }
    }
    page = mockDetails[page_slug]
  }

  if (!page) {
    return notFound()
  }

  // 4. Fetch all wiki pages (needed for rendering internal links/subtopics tree)
  let allPages: any[] = []
  if (wiki?.id) {
    try {
      allPages = await WikiGeneratorRepository.fetchWikiPages(wiki.id)
    } catch (err) {
      console.error("Error fetching all pages:", err)
    }
  }

  // 5. Fetch Citations, Chunk References, Images, Backlinks and Page Links on the server
  let initialCitations: any[] = []
  let initialImages: any[] = []
  let initialChunkReferences: any[] = []
  let initialBacklinks: any[] = []
  let pageLinks: any[] = []

  if (page && !isMocked) {
    try {
      const page_id = page.id
      initialCitations = await WikiGeneratorRepository.fetchPageCitations(page_id)
      initialChunkReferences = await WikiGeneratorRepository.fetchPageChunkReferences(page_id)
      
      const processedPageKeys = new Set<string>()
      for (const ref of initialChunkReferences) {
        const key = `${ref.document_id}-${ref.page_number}`
        if (processedPageKeys.has(key)) continue
        processedPageKeys.add(key)

        const pageImages = await WikiGeneratorRepository.fetchImagesByPageNumber(
          ref.document_id,
          ref.page_number
        )
        for (const img of pageImages) {
          initialImages.push({
            ...img,
            sourceFilename: ref.filename
          })
        }
      }

      for (const cit of initialCitations) {
        let filename = "Source Document"
        const { data: doc } = await supabase
          .from("documents")
          .select("filename")
          .eq("id", cit.document_id)
          .maybeSingle()
        if (doc) {
          filename = doc.filename
        }
        cit.sourceName = filename
      }

      const { data: backlinksData } = await supabase
        .from("page_links")
        .select("source_page_id, link_type")
        .eq("target_page_id", page_id)
      
      initialBacklinks = backlinksData || []

      const { data: linksData } = await supabase
        .from("page_links")
        .select("source_page_id, target_page_id")
        .eq("wiki_id", wiki.id)
      pageLinks = linksData || []
    } catch (err) {
      console.error("Error fetching page assets on server:", err)
    }
  } else if (isMocked && page) {
    // Provide nice mock values for the Sandbox Mock Active state
    initialBacklinks = [
      { source_page_id: "mock-page-1", link_type: "internal" }
    ].filter(bl => bl.source_page_id !== page.id)

    initialCitations = [
      {
        id: "mock-cit-1",
        page_id: page.id,
        document_id: "mock-doc-1",
        page_number: 3,
        highlight: "This is a highlighted fact from the mock document",
        context: "The context of the document details how the system behaves. This is a highlighted fact from the mock document which is very important.",
        sourceName: "foundation_spec.pdf"
      }
    ]

    initialChunkReferences = [
      {
        chunk_id: "mock-chunk-1",
        document_id: "mock-doc-1",
        filename: "foundation_spec.pdf",
        page_number: 3,
        content: "This is a highlighted fact from the mock document which is very important."
      }
    ]

    pageLinks = [
      { source_page_id: "mock-page-1", target_page_id: "mock-page-2" },
      { source_page_id: "mock-page-1", target_page_id: "mock-page-3" }
    ]
  }

  return (
    <ArticleView
      username={username}
      wikiSlug={wiki_slug}
      wikiId={wiki.id}
      initialPage={page}
      allPages={allPages}
      initialCitations={initialCitations}
      initialImages={initialImages}
      initialChunkReferences={initialChunkReferences}
      initialBacklinks={initialBacklinks}
      pageLinks={pageLinks}
    />
  )
}
