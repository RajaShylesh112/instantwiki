import { supabase } from "@/lib/supabase"
import { Document } from "@/lib/repositories/document"
import { WikiGeneratorRepository } from "@/lib/repositories/wiki-generator"
import { EmbeddingService } from "@/services/ai/embeddings"
import { incrementAiCredits } from "@/services/limits"
import { MarkItDownServiceUnavailableError } from "@/services/pdf-extractor"

import { extractDocumentText, simulateMockExtraction, ExtractedPage } from "./extractor"
import { segmentSemanticChunks } from "./chunker"
import { generateAndInsertEmbeddings } from "./embedder"
import { generateAggregatedDocumentSummary } from "./summarizer"
import { runTopicDiscovery, setupHierarchyAndSkeletons } from "./topic-discovery"
import { generateImmediatePage, generateImmediateRootPage } from "./page-generator"
import { CostTracker, callBedrockProviderJson } from "./utils"

export async function runIngestionPipeline(
  jobId: string, 
  wikiId: string, 
  documents: Document[], 
  isShortcut: boolean = false
) {
  CostTracker.reset()
  try {
    let wikiTitle = ""
    let wikiDesc = ""
    let userId = ""
  try {
    const { data: wiki } = await supabase
      .from("wikis")
      .select("title, description, owner_id")
      .eq("id", wikiId)
      .maybeSingle()
    if (wiki) {
      wikiTitle = wiki.title || ""
      wikiDesc = wiki.description || ""
      userId = wiki.owner_id || ""
    }
  } catch (e) {
    console.warn("Non-fatal: Error fetching wiki in ingestion pipeline:", e)
  }

  let newDocsCount = 0
  let reusedDocsCount = 0

  for (const doc of documents) {
    const { data: existing } = await supabase
      .from("document_chunks")
      .select("id")
      .eq("document_id", doc.id)
      .limit(1)
      
    if (existing && existing.length > 0) {
      reusedDocsCount++
      continue
    }
    
    const { data: other } = await supabase
      .from("documents")
      .select("id")
      .eq("content_hash", doc.content_hash)
      .neq("id", doc.id)
      .limit(1)
      .maybeSingle()
      
    if (other) {
      const { data: otherChunks } = await supabase
        .from("document_chunks")
        .select("id")
        .eq("document_id", other.id)
        .limit(1)
        
      if (otherChunks && otherChunks.length > 0) {
        reusedDocsCount++
        continue
      }
    }
    
    newDocsCount++
  }

  const estTotalSeconds = isShortcut ? ((newDocsCount * 3.5) + 6) : ((newDocsCount * 6.5) + 15)

  // Step 1: Document & Image Extraction
  console.log(`\n=== 1. KNOWLEDGE EXTRACTION ===`)
  await WikiGeneratorRepository.updateJobStep(jobId, "EXTRACTION", "PROCESSING", JSON.stringify({
    new_docs_count: newDocsCount,
    reused_docs_count: reusedDocsCount,
    est_remaining_seconds: Math.round(estTotalSeconds),
    is_shortcut: isShortcut
  }))
  
  const allPagesData: ExtractedPage[] = []
  const newlyExtractedDocs = new Set<string>()
  
  console.log(`[Synthesis Pipeline] Starting extraction for ${documents.length} documents...`)
  await Promise.all(
    documents.map(async (doc) => {
      try {
        console.log(`[Synthesis Pipeline] [${doc.filename}] Checking for cached chunks in database...`)
        const { data: existingChunks } = await supabase
          .from("document_chunks")
          .select("id")
          .eq("document_id", doc.id)
          .limit(1)

        let reuseExistingChunks = false
        if (existingChunks && existingChunks.length > 0) {
          const firstChunk = existingChunks[0]
          const { data: chunkEmbed } = await supabase
            .from("chunk_embeddings")
            .select("embedding, embedding_model")
            .eq("chunk_id", firstChunk.id)
            .limit(1)
            .maybeSingle()

          const targetDim = EmbeddingService.getTargetDimension()
          const targetModel = EmbeddingService.getActiveModelName()
          let isDimMismatch = false

          if (chunkEmbed && chunkEmbed.embedding) {
            let embeddingArray: number[] = []
            if (Array.isArray(chunkEmbed.embedding)) {
              embeddingArray = chunkEmbed.embedding
            } else if (typeof chunkEmbed.embedding === "string") {
              try {
                embeddingArray = JSON.parse(chunkEmbed.embedding)
              } catch (e) {
                const cleanStr = (chunkEmbed.embedding as string).replace(/[\[\]]/g, "")
                embeddingArray = cleanStr.split(",").map((v: string) => parseFloat(v))
              }
            }
            const currentDim = embeddingArray.length
            const currentModel = chunkEmbed.embedding_model
            if (currentDim !== targetDim || currentModel !== targetModel) {
              console.warn(`[Synthesis Pipeline] [${doc.filename}] Embedding mismatch: DB has ${currentModel} (${currentDim} dims), active expects ${targetModel} (${targetDim} dims). Purging cached chunks.`)
              isDimMismatch = true
            }
          } else {
            console.warn(`[Synthesis Pipeline] [${doc.filename}] Cached chunk has no embedding in database. Purging to regenerate.`)
            isDimMismatch = true
          }

          if (isDimMismatch) {
            const { data: allDocChunks } = await supabase
              .from("document_chunks")
              .select("id")
              .eq("document_id", doc.id)

            if (allDocChunks && allDocChunks.length > 0) {
              const chunkIds = allDocChunks.map(c => c.id)
              await supabase.from("chunk_embeddings").delete().in("chunk_id", chunkIds)
              await supabase.from("page_chunk_references").delete().in("chunk_id", chunkIds)
              await supabase.from("document_chunks").delete().eq("document_id", doc.id)
            }
          } else {
            reuseExistingChunks = true
          }
        }

        if (reuseExistingChunks) {
          console.log(`[Synthesis Pipeline] [${doc.filename}] Found cached chunks in DB. Reusing them directly.`)
          const { data: chunks } = await supabase
            .from("document_chunks")
            .select("id, page_number, content, heading, section, chunk_type")
            .eq("document_id", doc.id)

          const pageTextMap: Record<number, string[]> = {}
          const pageBlocksMap: Record<number, any[]> = {}

          for (const c of (chunks || [])) {
            const pageNum = c.page_number || 1
            if (!pageTextMap[pageNum]) {
              pageTextMap[pageNum] = []
              pageBlocksMap[pageNum] = []
            }
            pageTextMap[pageNum].push(c.content)
            pageBlocksMap[pageNum].push({
              type: c.chunk_type || "text",
              content: c.content,
              heading: c.heading,
              section: c.section
            })
          }
          for (const [pageStr, textList] of Object.entries(pageTextMap)) {
            const pageNum = parseInt(pageStr)
            allPagesData.push({
              documentId: doc.id,
              pageNumber: pageNum,
              text: textList.join("\n\n"),
              blocks: pageBlocksMap[pageNum]
            })
          }
          return
        }

        const isFresh = await extractDocumentText(doc, allPagesData, wikiTitle, isShortcut)
        if (isFresh) {
          newlyExtractedDocs.add(doc.id)
        }
        const docPages = allPagesData.filter(p => p.documentId === doc.id)
        const totalChars = docPages.reduce((sum, p) => sum + (p.text?.length || 0), 0)
        console.log(`[Synthesis Pipeline] [${doc.filename}] Extraction finished: ${docPages.length} page(s), ${totalChars} characters extracted.`)
        
      } catch (err) {
        // If the MarkItDown microservice is unreachable, abort the pipeline
        // entirely so the user sees a clear "extraction not possible" failure
        // rather than a silently mocked wiki.
        if (err instanceof MarkItDownServiceUnavailableError) {
          throw err
        }
        console.error(`[Synthesis Pipeline] [${doc.filename}] Failed to process document:`, err)
        simulateMockExtraction(doc, allPagesData, wikiTitle)
      }
    })
  )

  let activeJob = await WikiGeneratorRepository.getJobById(jobId)
  if (activeJob?.status === "FAILED") {
    console.log("Job aborted by user. Exiting pipeline before Chunking.")
    return
  }

  // Process and upload extracted images
  try {
    await processDocumentImages(wikiId, allPagesData)
  } catch (imgErr) {
    console.error("Non-fatal: Image processing failed:", imgErr)
  }

  // Upload the cleaned converted MD files to storage
  const pathModule = require("path")
  for (const doc of documents) {
    if (newlyExtractedDocs.has(doc.id)) {
      try {
        const docPages = allPagesData.filter(p => p.documentId === doc.id)
        const fullMdText = docPages.map((p: any) => p.text).join("\x0c")
        
        const ext = pathModule.extname(doc.filename)
        const basename = pathModule.basename(doc.filename, ext)
        const mdFilename = `${basename}.md`
        const storageDir = pathModule.dirname(doc.storage_path)
        const mdStoragePath = `${storageDir}/${mdFilename}`

        console.log(`[Synthesis Pipeline] [${doc.filename}] Uploading cleaned converted MD file to storage: ${mdStoragePath}...`)
        const { error: uploadErr } = await supabase.storage
          .from("documents")
          .upload(mdStoragePath, Buffer.from(fullMdText, "utf-8"), {
            contentType: "text/markdown",
            upsert: true
          })
        if (uploadErr) {
          console.warn(`[Synthesis Pipeline] [${doc.filename}] Non-fatal: Failed to save clean MD file to storage:`, uploadErr)
        }
      } catch (uploadErr) {
        console.warn(`[Synthesis Pipeline] [${doc.filename}] Failed to save cleaned MD file to storage:`, uploadErr)
      }
    }
  }
  
  // Step 2: Chunking & Embeddings
  console.log(`\n=== 2. KNOWLEDGE UNDERSTANDING ===`)
  console.log(`[Synthesis Pipeline] Segmenting extracted text into chunks...`)
  const estRemainingAfterExtraction = (newDocsCount * 1.5) + 12
  await WikiGeneratorRepository.updateJobStep(jobId, "CHUNKING", "PROCESSING", JSON.stringify({
    new_docs_count: newDocsCount,
    reused_docs_count: reusedDocsCount,
    est_remaining_seconds: Math.round(estRemainingAfterExtraction)
  }))
  
  const chunksToInsert = segmentSemanticChunks(allPagesData, isShortcut)

  console.log(`[Synthesis Pipeline] Bulk inserting ${chunksToInsert.length} document chunks into DB...`)
  const insertedChunks = await WikiGeneratorRepository.insertChunksBulk(chunksToInsert)
  const createdChunks = insertedChunks.map(c => ({
    id: c.id,
    content: c.content,
    embeddingInput: `${c.heading || ""}\n\n${c.section || ""}\n\n${c.content}`.trim(),
    document_id: c.document_id,
    page_number: c.page_number,
    chunk_id: c.id
  }))

  activeJob = await WikiGeneratorRepository.getJobById(jobId)
  if (activeJob?.status === "FAILED") {
    console.log("Job aborted by user. Exiting pipeline before Embeddings.")
    return
  }
  
  // Embeddings generation step
  const embedRes = await generateAndInsertEmbeddings(jobId, createdChunks, isShortcut)
  if (!embedRes.success) return

  activeJob = await WikiGeneratorRepository.getJobById(jobId)
  if (activeJob?.status === "FAILED") {
    console.log("Job aborted. Exiting pipeline before Topic Discovery.")
    return
  }
  
  // Step 3: Topic Discovery
  console.log(`\n=== 3. KNOWLEDGE STRUCTURING ===`)
  console.log(`[Synthesis Pipeline] Running topic discovery...`)
  await WikiGeneratorRepository.updateJobStep(jobId, "TOPIC_DISCOVERY", "PROCESSING", JSON.stringify({
    total_chunks: createdChunks.length,
    est_remaining_seconds: 25
  }))
  
  console.log(`[Synthesis Pipeline] Generating document summaries & document aggregated summary...`)
  const documentSummary = await generateAggregatedDocumentSummary(createdChunks)
  
  // Discover topics and hierarchy
  const discoveredResult = await runTopicDiscovery(wikiId, wikiTitle, wikiDesc, documentSummary, allPagesData, createdChunks)

  activeJob = await WikiGeneratorRepository.getJobById(jobId)
  if (activeJob?.status === "FAILED") {
    console.log("Job aborted by user. Exiting pipeline before Skeletons.")
    return
  }

  // Clear existing pages for this wiki
  await supabase
    .from("wiki_pages")
    .delete()
    .eq("wiki_id", wikiId)
  
  await supabase
    .from("wiki_page_hierarchy")
    .delete()
    .eq("wiki_id", wikiId)

  // Step 4: Page Skeletons & Hierarchy Setup
  console.log(`[Synthesis Pipeline] Bulk inserting page skeletons...`)
  await WikiGeneratorRepository.updateJobStep(jobId, "TOPIC_DISCOVERY")

  const { pageMap, rootPageId, allPages } = await setupHierarchyAndSkeletons(wikiId, discoveredResult, wikiTitle)

  console.log(`[Synthesis Pipeline] Skeletons successfully created for ${allPages.length} pages:`)
  allPages.forEach((p, idx) => {
    const parentSlug = p.parent_slug || "(none)"
    console.log(`  [Page ${idx + 1}] Title: "${p.title}" | Slug: "${p.slug}" | Parent: "${parentSlug}" | Type: ${p.page_type}`)
  })
  console.log()

  // --- IMMEDIATE PAGE GENERATION FLOW ---
  let username = "user"
  let wikiSlug = "wiki"
  
  const { data: userRecord } = await supabase
    .from("users")
    .select("username")
    .eq("id", userId)
    .maybeSingle()
  if (userRecord) username = userRecord.username
  
  const { data: wRecord } = await supabase
    .from("wikis")
    .select("slug")
    .eq("id", wikiId)
    .maybeSingle()
  if (wRecord) wikiSlug = wRecord.slug

  const aliases = await WikiGeneratorRepository.fetchAllWikiAliases(wikiId)

  const rootTopic = discoveredResult.pages?.find(p => p.slug === discoveredResult.root_slug)
  const allNonRootTopics = discoveredResult.pages?.filter(p => p.slug !== discoveredResult.root_slug) || []

  // Separate into TOPIC and SUBTOPIC — generate TOPICs first so context exists for SUBTOPICs
  const topicPages    = allNonRootTopics.filter(p => p.page_type === "TOPIC")
  const subtopicPages = allNonRootTopics.filter(p => p.page_type === "SUBTOPIC")

  const maxTopics    = isShortcut ? 2 : 4
  const maxSubtopics = isShortcut ? 2 : 8   // up to 2 subtopics per topic × 4 topics
  const topicsToGenerate    = topicPages.slice(0, maxTopics)
  const subtopicsToGenerate = subtopicPages.slice(0, maxSubtopics)

  const subpagesToGenerate = [...topicsToGenerate, ...subtopicsToGenerate]
  const pagesToGenerateCount = subpagesToGenerate.length + (rootTopic ? 1 : 0)
  let generatedPagesCount = 0

  console.log(`\n=== 4. KNOWLEDGE SYNTHESIS ===`)
  console.log(`[Synthesis Pipeline] Hierarchy: 1 ROOT + ${topicsToGenerate.length} TOPICs + ${subtopicsToGenerate.length} SUBTOPICs = ${pagesToGenerateCount} pages`)
  await WikiGeneratorRepository.updateJobStep(jobId, "SKELETON", "PROCESSING", JSON.stringify({
    current_page_index: generatedPagesCount,
    total_pages: pagesToGenerateCount,
    current_page_title: topicsToGenerate[0]?.title || rootTopic?.title || "Generating...",
    est_remaining_seconds: Math.round(pagesToGenerateCount * 1.5)
  })).catch(() => {})

  const generatedSubpageSummaries: { title: string; slug: string; summary: string }[] = []

  // === Phase A: Generate TOPIC pages in parallel ===
  await Promise.all(
    topicsToGenerate.map(async (topic) => {
      const pageId = pageMap[topic.slug]
      if (!pageId) return

      try {
        await generateImmediatePage(
          pageId,
          wikiId,
          topic,
          documents,
          allPages,
          aliases,
          discoveredResult.pages || [],
          rootTopic,
          username,
          wikiSlug,
          jobId,
          generatedSubpageSummaries
        )
      } finally {
        generatedPagesCount++
        await WikiGeneratorRepository.updateJobStep(jobId, "SKELETON", "PROCESSING", JSON.stringify({
          current_page_index: generatedPagesCount,
          total_pages: pagesToGenerateCount,
          current_page_title: topic.title,
          est_remaining_seconds: Math.round((pagesToGenerateCount - generatedPagesCount) * 1.5)
        })).catch(() => {})
      }
    })
  )

  // === Phase B: Generate SUBTOPIC pages in parallel (after TOPICs are done) ===
  await Promise.all(
    subtopicsToGenerate.map(async (topic) => {
      const pageId = pageMap[topic.slug]
      if (!pageId) return

      try {
        await generateImmediatePage(
          pageId,
          wikiId,
          topic,
          documents,
          allPages,
          aliases,
          discoveredResult.pages || [],
          rootTopic,
          username,
          wikiSlug,
          jobId,
          generatedSubpageSummaries
        )
      } finally {
        generatedPagesCount++
        await WikiGeneratorRepository.updateJobStep(jobId, "SKELETON", "PROCESSING", JSON.stringify({
          current_page_index: generatedPagesCount,
          total_pages: pagesToGenerateCount,
          current_page_title: topic.title,
          est_remaining_seconds: Math.round((pagesToGenerateCount - generatedPagesCount) * 1.5)
        })).catch(() => {})
      }
    })
  )

  // Lazy-register any pages beyond the cap so they appear in nav but without content generation
  const lazyTopics    = topicPages.slice(maxTopics)
  const lazySubtopics = subtopicPages.slice(maxSubtopics)
  for (const topic of [...lazyTopics, ...lazySubtopics]) {
    generatedSubpageSummaries.push({
      title: topic.title,
      slug: topic.slug,
      summary: topic.description || topic.title
    })
  }


  // Generate ROOT page content
  if (rootTopic && rootPageId) {
    const jobCheck = await WikiGeneratorRepository.getJobById(jobId)
    if (jobCheck?.status === "FAILED") {
      console.log("Job aborted. Skipping ROOT page generation.")
    } else {
      console.log(`[Synthesis Pipeline] Phase 2: Generating ROOT page "${rootTopic.title}"...`)
      try {
        await generateImmediateRootPage(
          rootPageId,
          wikiId,
          rootTopic,
          documents,
          allPages,
          aliases,
          username,
          wikiSlug,
          jobId,
          generatedSubpageSummaries
        )
      } finally {
        generatedPagesCount++
        await WikiGeneratorRepository.updateJobStep(jobId, "SKELETON", "PROCESSING", JSON.stringify({
          current_page_index: generatedPagesCount,
          total_pages: pagesToGenerateCount,
          current_page_title: rootTopic.title,
          est_remaining_seconds: 0
        })).catch(() => {})
      }
    }
  }

  activeJob = await WikiGeneratorRepository.getJobById(jobId)
  if (activeJob?.status === "FAILED") {
    console.log("Job aborted by user. Exiting synthesis pipeline.")
    return
  }

    console.log(`[Synthesis Pipeline] Ingestion pipeline successfully completed.`)
    await WikiGeneratorRepository.updateJobStep(jobId, "FINISHED", "COMPLETED")
    
    if (userId) {
      try {
        await incrementAiCredits(userId, 2)
        console.log(`[Synthesis Pipeline] Charged 2 AI credits to user ${userId}`)
      } catch (err) {
        console.error("[Synthesis Pipeline] Failed to charge AI credits:", err)
      }
    }
  } finally {
    console.log(CostTracker.formatSummary())
  }
}

async function processDocumentImages(wikiId: string, allPagesData: ExtractedPage[]) {
  console.log(`\n=== PROCESSING EXTRACTED IMAGES ===`)
  
  // Group pages by document to optimize check
  const docIds = Array.from(new Set(allPagesData.map(p => p.documentId)))
  const processedDocs = new Set<string>()
  
  for (const docId of docIds) {
    try {
      const { data: existingImgs } = await supabase
        .from("document_images")
        .select("id")
        .eq("document_id", docId)
        .limit(1)
        
      if (existingImgs && existingImgs.length > 0) {
        console.log(`[Images Ingestion] Document ${docId} already has processed images in database. Skipping.`)
        processedDocs.add(docId)
      }
    } catch (e) {
      console.warn("Non-fatal error checking existing images:", e)
    }
  }

  for (const page of allPagesData) {
    if (processedDocs.has(page.documentId)) continue
    if (!page.text) continue

    const lines = page.text.split('\n')
    const rawImages: { caption: string; src: string }[] = []
    
    // Line-by-line regex scanning to prevent catastrophic backtracking
    for (const line of lines) {
      if (line.includes('![') && line.includes('](')) {
        const regex = /!\[(.*?)\]\((.*?)\)/g
        let match: RegExpExecArray | null
        while ((match = regex.exec(line)) !== null) {
          const caption = (match[1] || "").trim()
          const src = (match[2] || "").trim()
          if (src) {
            rawImages.push({ caption, src })
          }
        }
      }
      if (line.includes('<img') && line.includes('src=')) {
        const regex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["']?/g
        let match: RegExpExecArray | null
        while ((match = regex.exec(line)) !== null) {
          const src = (match[1] || "").trim()
          const caption = (match[2] || "").trim()
          if (src) {
            rawImages.push({ caption, src })
          }
        }
      }
    }

    if (rawImages.length === 0) continue

    console.log(`[Images Ingestion] Page ${page.pageNumber}: Found ${rawImages.length} raw images in markdown. Processing...`)
    const extractedImages: { storagePath: string; caption: string }[] = []

    const extMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg'
    }

    for (let idx = 0; idx < rawImages.length; idx++) {
      const img = rawImages[idx]
      try {
        if (img.src.startsWith('data:image/')) {
          const match = img.src.match(/^data:(image\/[^;]+);base64,(.+)$/)
          if (match) {
            const mimeType = match[1]
            const ext = extMap[mimeType] || mimeType.split('/')[1] || 'png'
            const base64Data = match[2]
            const buffer = Buffer.from(base64Data, 'base64')
            const storagePath = `wiki_images/${wikiId}/${page.documentId}_p${page.pageNumber}_img${idx}.${ext}`
            
            console.log(`[Images Ingestion] Uploading base64 image ${idx + 1} to storage path: ${storagePath}`)
            const { error } = await supabase.storage
              .from("documents")
              .upload(storagePath, buffer, {
                contentType: mimeType,
                upsert: true
              })
              
            if (!error) {
              const { data: { publicUrl } } = supabase.storage
                .from("documents")
                .getPublicUrl(storagePath)

              extractedImages.push({ storagePath, caption: img.caption })
              page.text = page.text.replace(img.src, publicUrl)
              if (page.blocks) {
                for (const block of page.blocks) {
                  if (block.content && block.content.includes(img.src)) {
                    block.content = block.content.replace(img.src, publicUrl)
                  }
                }
              }
            } else {
              console.error(`[Images Ingestion] Upload failed:`, error)
              // Strip base64 on failure to avoid database corruption/token bloat
              page.text = page.text.replace(img.src, "")
              if (page.blocks) {
                for (const block of page.blocks) {
                  if (block.content && block.content.includes(img.src)) {
                    block.content = block.content.replace(img.src, "")
                  }
                }
              }
            }
          }
        } else if (img.src.startsWith('http')) {
          const res = await fetch(img.src)
          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const contentType = res.headers.get('content-type') || 'image/png'
            const ext = extMap[contentType] || img.src.split('.').pop()?.split('?')[0] || "png"
            const storagePath = `wiki_images/${wikiId}/${page.documentId}_p${page.pageNumber}_img${idx}.${ext}`
            
            console.log(`[Images Ingestion] Downloading and uploading external image to: ${storagePath}`)
            const { error } = await supabase.storage
              .from("documents")
              .upload(storagePath, buffer, {
                contentType,
                upsert: true
              })
              
            if (!error) {
              const { data: { publicUrl } } = supabase.storage
                .from("documents")
                .getPublicUrl(storagePath)

              extractedImages.push({ storagePath, caption: img.caption })
              page.text = page.text.replace(img.src, publicUrl)
              if (page.blocks) {
                for (const block of page.blocks) {
                  if (block.content && block.content.includes(img.src)) {
                    block.content = block.content.replace(img.src, publicUrl)
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn(`[Images Ingestion] Failed to process image ${idx}:`, err)
      }
    }

    if (extractedImages.length === 0) continue

    // Ask LLM to evaluate relevance and select at most 1 image
    let selectedImage: { storagePath: string; caption: string } | null = null
    let relevanceScore = 0.8

    try {
      const evalPrompt = `You are an AI editor deciding which images are relevant and important enough to display on a wiki page.
We have a page with the following text content:
---
${page.text.substring(0, 1500)}
---

We extracted the following images from this page:
${extractedImages.map((img, idx) => `[Image ${idx}]: Caption/Alt: "${img.caption}"`).join('\n')}

Evaluate the importance and relevance of each image to the page's core subject.
You must choose at most 1 image to display. If none of the images are important or highly relevant, select none.
Respond with a JSON object matching this schema:
{
  "selected_index": number | null, // The index (0, 1, 2...) of the selected image, or null if none are selected.
  "relevance_score": number | null, // Relevance score from 0.0 to 1.0 of the selected image, or null.
  "caption": string | null // A cleaned, readable caption for the selected image to show on the website, or null.
}`

      const result = await callBedrockProviderJson(evalPrompt)
      if (result && result.selected_index !== null && result.selected_index >= 0 && result.selected_index < extractedImages.length) {
        selectedImage = {
          storagePath: extractedImages[result.selected_index].storagePath,
          caption: result.caption || extractedImages[result.selected_index].caption || "Extracted Figure"
        }
        relevanceScore = result.relevance_score || 0.8
      }
    } catch (err) {
      console.warn(`[Images Ingestion] LLM selection failed, defaulting to first image:`, err)
      selectedImage = extractedImages[0]
    }

    if (selectedImage) {
      console.log(`[Images Ingestion] Inserting selected image to DB: "${selectedImage.caption}" with relevance ${relevanceScore}`)
      await WikiGeneratorRepository.insertImage({
        document_id: page.documentId,
        page_number: page.pageNumber,
        storage_path: selectedImage.storagePath,
        caption: selectedImage.caption,
        relevance_score: relevanceScore
      }).catch((dbErr) => {
        console.error(`[Images Ingestion] DB insertion failed:`, dbErr)
      })
    }
  }
}
