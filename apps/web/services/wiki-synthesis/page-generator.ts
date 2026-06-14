import { supabase } from "@/lib/supabase"
import { WikiGeneratorRepository } from "@/lib/repositories/wiki-generator"
import { DocumentRepository, Document } from "@/lib/repositories/document"
import { EmbeddingService } from "@/services/ai/embeddings"
import { 
  callBedrockProviderJson, 
  rerankChunks, 
  generateMockWikiPage 
} from "./utils"

// Auto-linking helper (same as in route.ts/generate/route.ts)
export function autoLinkContent(
  body: string, 
  aliases: { page_id: string; alias: string; slug: string }[], 
  username: string, 
  wikiSlug: string
): string {
  const sorted = [...aliases].sort((a, b) => b.alias.length - a.alias.length)
  let result = body
  
  for (const item of sorted) {
    if (!item.alias || !item.slug) continue
    if (item.alias.length < 3) continue
    
    const escaped = item.alias.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
    const regex = new RegExp(`(?<!\\[|\\(|href=")(\\*\\*|\\*|__|_)??\\b(${escaped})\\b\\1(?!\\b[^[\\]]*\\])`, "gi")
    
    result = result.replace(regex, (match, g1, g2) => {
      const format = g1 || ''
      return `<a href="/u/${username}/${wikiSlug}/${item.slug}" class="text-[#6b38d4] font-semibold hover:underline">${format}${g2}${format}</a>`
    })
  }
  return result
}

export async function generateImmediatePage(
  pageId: string,
  wikiId: string,
  topic: any,
  documents: Document[],
  allPages: any[],
  aliases: any[],
  discoveredPages: any[],
  rootTopic: any,
  username: string,
  wikiSlug: string,
  jobId: string,
  generatedSubpageSummaries: { title: string; slug: string; summary: string }[]
): Promise<void> {
  const { data: userRecord } = await supabase
    .from("users")
    .select("username")
    .eq("id", (rootTopic ? rootTopic.owner_id : null))
    .maybeSingle()
    
  try {
    await WikiGeneratorRepository.updatePageContent(pageId, {
      generation_status: "GENERATING"
    })

    const description = topic.description || ""
    const keywords: string[] = topic.keywords || []
    
    // Determine the source page numbers if available
    let sourcePageNumbers: number[] = []
    if (topic.page_numbers && Array.isArray(topic.page_numbers)) {
      sourcePageNumbers = topic.page_numbers
    } else if (topic.page_number) {
      sourcePageNumbers = [topic.page_number]
    }

    if (sourcePageNumbers.length === 0 && topic.summary) {
      if (topic.summary.includes(" | SourcePages: ")) {
        const parts = topic.summary.split(" | SourcePages: ")
        const pNumStr = parts[1]?.trim()
        if (pNumStr) {
          sourcePageNumbers = pNumStr.split(",").map((n: string) => parseInt(n.trim())).filter((n: number) => !isNaN(n))
        }
      } else if (topic.summary.includes(" | SourcePage: ")) {
        const parts = topic.summary.split(" | SourcePage: ")
        const pNumStr = parts[1]?.trim()
        if (pNumStr) {
          sourcePageNumbers = [parseInt(pNumStr)]
        }
      }
    }

    let primaryChunks: any[] = []
    let surroundingChunks: any[] = []

    if (sourcePageNumbers.length > 0 && documents.length > 0) {
      try {
        const { data: primaries } = await supabase
          .from("document_chunks")
          .select("id, page_number, content, heading, section")
          .eq("document_id", documents[0].id)
          .in("page_number", sourcePageNumbers)
        if (primaries) {
          primaryChunks = primaries.map(p => ({
            chunk_id: p.id,
            document_id: documents[0].id,
            page_number: p.page_number,
            content: p.content,
            heading: p.heading,
            section: p.section,
            similarity: 1.0 // Force max similarity
          }))

          const surroundingPageNumbers = new Set<number>()
          for (const num of sourcePageNumbers) {
            surroundingPageNumbers.add(num - 1)
            surroundingPageNumbers.add(num + 1)
          }
          for (const num of sourcePageNumbers) {
            surroundingPageNumbers.delete(num)
          }
          const surroundingList = Array.from(surroundingPageNumbers).filter(n => n > 1)

          if (surroundingList.length > 0) {
            const { data: surrounding } = await supabase
              .from("document_chunks")
              .select("id, page_number, content, heading, section")
              .eq("document_id", documents[0].id)
              .in("page_number", surroundingList)
            if (surrounding) {
              surroundingChunks = surrounding.map(s => ({
                chunk_id: s.id,
                document_id: documents[0].id,
                page_number: s.page_number,
                content: s.content,
                heading: s.heading,
                section: s.section,
                similarity: 0.8 // High similarity for context
              }))
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch primary/surrounding chunks:", err)
      }
    }

    const embeddingQuery = `${topic.title}: ${description}`.trim()
    const { embedding } = await EmbeddingService.generateEmbedding(embeddingQuery)

    const similarChunks = await WikiGeneratorRepository.searchSimilarChunks(
      wikiId,
      embedding,
      30,
      0.10
    )

    let generatedContent = { summary: topic.description || "", body: "" }

    if (similarChunks.length === 0 && primaryChunks.length === 0) {
      generatedContent = generateMockWikiPage(topic.title, topic.page_type, topic.title)
      
      await WikiGeneratorRepository.updatePageContent(pageId, {
        summary: generatedContent.summary,
        body: generatedContent.body,
        generation_status: "GENERATED"
      })
      
      if (documents.length > 0) {
        await WikiGeneratorRepository.insertCitation({
          page_id: pageId,
          document_id: documents[0].id,
          page_number: 1,
          highlight: "Default page skeleton created from empty sources.",
          context: "Default page skeleton created from empty sources."
        })
      }
    } else {
      // Merge similarChunks with primary and surrounding chunks, deduplicating by chunk_id
      const mergedMap = new Map<string, any>()
      
      for (const pc of primaryChunks) {
        mergedMap.set(pc.chunk_id, pc)
      }
      for (const sc of surroundingChunks) {
        mergedMap.set(sc.chunk_id, sc)
      }
      for (const c of similarChunks) {
        if (!mergedMap.has(c.chunk_id)) {
          mergedMap.set(c.chunk_id, {
            chunk_id: c.chunk_id,
            document_id: c.document_id,
            page_number: c.page_number,
            content: c.content,
            heading: (c as any).heading || null,
            section: (c as any).section || null,
            similarity: c.similarity
          })
        }
      }

      let detailedChunks = Array.from(mergedMap.values())
      const chunkIds = detailedChunks.map(c => c.chunk_id)
      
      if (chunkIds.length > 0) {
        try {
          const { data: chunkDetails } = await supabase
            .from("document_chunks")
            .select("id, heading, section")
            .in("id", chunkIds)
            
          if (chunkDetails && chunkDetails.length > 0) {
            detailedChunks = detailedChunks.map(c => {
              const detail = chunkDetails.find(d => d.id === c.chunk_id)
              return {
                ...c,
                heading: detail?.heading || c.heading || null,
                section: detail?.section || c.section || null
              }
            })
          }
        } catch (err) {
          console.warn("Failed to fetch chunk details for reranking:", err)
        }
      }

      const rerankedChunks = rerankChunks(detailedChunks, topic.title, keywords)
      const topChunks = rerankedChunks.slice(0, 12)

      let tokenBudgetChars = 6000
      let currentChars = 0
      const budgetedChunks = []

      for (const c of topChunks) {
        if (currentChars + c.content.length > tokenBudgetChars) break
        currentChars += c.content.length
        budgetedChunks.push(c)
      }

      const chunkContents = budgetedChunks
        .map((c, idx) => `[Source ${idx + 1}] (Page ${c.page_number}): ${c.content}`)
        .join("\n---\n")

      let parentTitle = ""
      const childTitles: string[] = []

      if (topic.parent_slug) {
        const parentTopic = discoveredPages.find(t => t.slug === topic.parent_slug)
        if (parentTopic) parentTitle = parentTopic.title
      }
      const children = discoveredPages.filter(h => h.parent_slug === topic.slug)
      children.forEach(c => {
        childTitles.push(c.title)
      })

      const relationshipHint = parentTitle
        ? `\nThis page sits under the broader topic "${parentTitle}".`
        : ""
      const childrenHint = childTitles.length > 0
        ? `\nThis page has sub-articles: ${childTitles.map(t => `"${t}"`).join(", ")}. Mention them naturally where relevant.`
        : ""

      let pagePrompt = ""
      if (topic.page_type === "TOPIC") {
        pagePrompt = `You are writing a Wikipedia-style encyclopedia TOPIC page titled "${topic.title}".
        
        Write a clear, flowing academic narrative of 400–600 words covering the topic based on the sources. Structure the page naturally using H2 headings (##) for main sections to organize the content. Do NOT use H1 (#) headings inside the body, as the page title is already rendered as H1. Keep it structured so that the headings can be displayed on "on this page" panel.
        
        ${relationshipHint}${childrenHint}
        
        Writing rules:
        - Ground your core claims in the source evidence below. Do not make up facts that contradict the sources.
        - **IMPORTANT**: If the source evidence is very brief or contains sparse bullet points, you MUST explain, define, and elaborate on the technical terms, architectures, and concepts mentioned in the sources to write a detailed, rich, and comprehensive article. Use your general knowledge to explain these concepts clearly in-depth, as long as it does not contradict the source evidence.
        - Write in prose paragraphs.
        - Keep it highly information-dense.
        
        Source Evidence:
        ${chunkContents}
        
        Return JSON:
        {
          "summary": "One precise sentence summarizing this topic.",
          "body": "Your complete markdown article body."
        }`
      } else {
        pagePrompt = `You are writing a Wikipedia-style encyclopedia SUBTOPIC page titled "${topic.title}".
        
        Write a clear, flowing academic narrative of 350-500 words covering this specific concept based on the sources. Structure the page naturally using H2 headings (##) for main sections to organize the content. Do NOT use H1 (#) headings inside the body, as the page title is already rendered as H1. Keep it structured so that the headings can be displayed on "on this page" panel.
        
        ${relationshipHint}
        
        Writing rules:
        - Ground your core claims in the source evidence below. Do not make up facts that contradict the sources.
        - **IMPORTANT**: If the source evidence is very brief or contains sparse bullet points, you MUST explain, define, and elaborate on the technical terms, architectures, and concepts mentioned in the sources to write a detailed, rich, and comprehensive article. Use your general knowledge to explain these concepts clearly in-depth, as long as it does not contradict the source evidence.
        - Write in prose paragraphs.
        
        Source Evidence:
        ${chunkContents}
        
        Return JSON:
        {
          "summary": "One precise sentence summarizing this subtopic.",
          "body": "Your complete markdown article body."
        }`
      }

      const jobCheck = await WikiGeneratorRepository.getJobById(jobId)
      if (jobCheck?.status === "FAILED") return

      try {
        console.log(`[Synthesis Pipeline] Generating subpage: "${topic.title}"...`)
        console.log(`  - Type: ${topic.page_type}`)
        console.log(`  - Retrieval: Found ${similarChunks.length} similar chunks, budgeted ${budgetedChunks.length} chunks (${currentChars} chars context)`)
        const pageGenStart = Date.now()
        const apiResult = await callBedrockProviderJson(pagePrompt)
        const duration = ((Date.now() - pageGenStart) / 1000).toFixed(2)
        console.log(`  - Completed in ${duration}s. Result: ${apiResult.summary ? "Success" : "Empty"}`)
        if (apiResult.summary && apiResult.body) {
          generatedContent = apiResult
        }
      } catch (err) {
        console.error(`LLM generation failed for topic ${topic.title}. Using mock content.`, err)
        generatedContent = generateMockWikiPage(topic.title, topic.page_type, parentTitle, budgetedChunks)
      }

      const linkedBody = autoLinkContent(generatedContent.body, aliases, username, wikiSlug)

      const refsToInsert = budgetedChunks.map(c => ({
        page_id: pageId,
        chunk_id: c.chunk_id
      }))
      if (refsToInsert.length > 0) {
        await WikiGeneratorRepository.insertPageChunkReferencesBulk(refsToInsert).catch(() => {})
      }

      const citationsToInsert = []
      for (const chunk of budgetedChunks) {
        if (generatedContent.body.includes(chunk.content.substring(0, 35))) {
          citationsToInsert.push({
            page_id: pageId,
            document_id: chunk.document_id,
            page_number: chunk.page_number,
            highlight: chunk.content.substring(0, 100),
            context: chunk.content
          })
        }
      }
      if (citationsToInsert.length > 0) {
        await WikiGeneratorRepository.insertCitationsBulk(citationsToInsert).catch(() => {})
      }

      await WikiGeneratorRepository.updatePageContent(pageId, {
        summary: generatedContent.summary,
        body: linkedBody,
        generation_status: "GENERATED"
      })
    }

    generatedSubpageSummaries.push({
      title: topic.title,
      slug: topic.slug,
      summary: generatedContent.summary || description || topic.title
    })

  } catch (err) {
    console.error(`Failed to generate subpage content for topic ${topic.title}:`, err)
    try {
      await WikiGeneratorRepository.updatePageContent(pageId, {
        generation_status: "FAILED"
      })
    } catch (dbErr) {}
    generatedSubpageSummaries.push({
      title: topic.title,
      slug: topic.slug,
      summary: topic.description || topic.title
    })
  }
}

export async function generateImmediateRootPage(
  rootPageId: string,
  wikiId: string,
  rootTopic: any,
  documents: Document[],
  allPages: any[],
  aliases: any[],
  username: string,
  wikiSlug: string,
  jobId: string,
  generatedSubpageSummaries: { title: string; slug: string; summary: string }[]
): Promise<void> {
  try {
    await WikiGeneratorRepository.updatePageContent(rootPageId, {
      generation_status: "GENERATING"
    })

    let rootDescription = rootTopic.description || ""
    const rootEmbeddingQuery = `${rootTopic.title}: ${rootDescription}`.trim()
    const { embedding: rootEmbedding } = await EmbeddingService.generateEmbedding(rootEmbeddingQuery)

    const rootSimilarChunks = await WikiGeneratorRepository.searchSimilarChunks(
      wikiId,
      rootEmbedding,
      40,
      0.10
    )

    let rootGeneratedContent = { summary: rootTopic.description || "", body: "" }

    if (rootSimilarChunks.length === 0) {
      rootGeneratedContent = generateMockWikiPage(rootTopic.title, "ROOT", "")
    } else {
      const rootChunkIds = rootSimilarChunks.map(c => c.chunk_id)
      let rootDetailedChunks = rootSimilarChunks.map(c => ({ ...c, heading: null as string | null, section: null as string | null }))
      
      if (rootChunkIds.length > 0) {
        try {
          const { data: chunkDetails } = await supabase
            .from("document_chunks")
            .select("id, heading, section")
            .in("id", rootChunkIds)
          if (chunkDetails && chunkDetails.length > 0) {
            rootDetailedChunks = rootSimilarChunks.map(c => {
              const detail = chunkDetails.find(d => d.id === c.chunk_id)
              return { ...c, heading: detail?.heading || null, section: detail?.section || null }
            })
          }
        } catch (err) {
          console.warn("Failed to fetch chunk details for ROOT reranking:", err)
        }
      }

      const rootReranked = rerankChunks(rootDetailedChunks, rootTopic.title, rootTopic.keywords || [])
      const rootTopChunks = rootReranked.slice(0, 15)

      let rootTokenBudgetChars = 10000
      let rootCurrentChars = 0
      const rootBudgetedChunks = []
      for (const c of rootTopChunks) {
        if (rootCurrentChars + c.content.length > rootTokenBudgetChars) break
        rootCurrentChars += c.content.length
        rootBudgetedChunks.push(c)
      }

      const rootChunkContents = rootBudgetedChunks
        .map((c, idx) => `[Source ${idx + 1}] (Page ${c.page_number}): ${c.content}`)
        .join("\n---\n")

      const subpageDirectory = generatedSubpageSummaries
        .map(sp => `- **${sp.title}** (/u/${username}/${wikiSlug}/${sp.slug}): ${sp.summary}`)
        .join("\n")

      const rootPrompt = `You are writing the main overview landing page for a Wikipedia-style wiki titled "${rootTopic.title}".
      
      This is the landing page. Below is a list of the sub-articles available in this wiki:
      ${subpageDirectory}
      
      Your task: write a cohesive, comprehensive overview narrative (~600-900 words). Use H2 headings (##) to structure the sections of the overview. Do NOT use H1 (#) headings inside the body. Keep it structured so that the headings can be displayed on "on this page" panel.
      (Write a deep-dive narrative introducing the overall subject. Ground facts in the sources, and naturally reference each sub-article by its exact title at least once in your paragraphs so they can be hyperlinked.)
      
      Writing rules:
      - Write in continuous prose. Do not make bullet lists.
      - Refer to sub-articles by their exact title naturally.
      - Ground your core claims in the source evidence below. Do not make up facts that contradict the sources.
      - **IMPORTANT**: If the source evidence is brief or contains sparse bullet points, you MUST explain, define, and elaborate on the technical terms, architectures, and concepts mentioned in the sources to write a detailed, rich, and comprehensive overview. Use your general knowledge to explain these concepts clearly in-depth, as long as it does not contradict the source evidence.
      
      Source Evidence:
      ${rootChunkContents}
      
      Return JSON:
      {
        "summary": "One precise sentence summarizing the entire wiki scope.",
        "body": "## Overview\nYour narrative overview body here..."
      }`

      try {
        console.log(`[Synthesis Pipeline] Calling LLM for ROOT page: "${rootTopic.title}"...`)
        console.log(`  - Retrieval: Found ${rootSimilarChunks.length} similar chunks, budgeted ${rootBudgetedChunks.length} chunks (${rootCurrentChars} chars context)`)
        const rootGenStart = Date.now()
        const apiResult = await callBedrockProviderJson(rootPrompt)
        const duration = ((Date.now() - rootGenStart) / 1000).toFixed(2)
        console.log(`  - Completed in ${duration}s. Result: ${apiResult.summary ? "Success" : "Empty"}`)
        if (apiResult.summary && apiResult.body) {
          rootGeneratedContent = apiResult
        }
      } catch (err) {
        console.error(`LLM ROOT page generation failed. Using mock content.`, err)
        rootGeneratedContent = generateMockWikiPage(rootTopic.title, "ROOT", "", rootBudgetedChunks)
      }

      const rootRefsToInsert = rootBudgetedChunks.map(c => ({
        page_id: rootPageId,
        chunk_id: c.chunk_id
      }))
      if (rootRefsToInsert.length > 0) {
        await WikiGeneratorRepository.insertPageChunkReferencesBulk(rootRefsToInsert).catch(() => {})
      }

      const rootCitationsToInsert = []
      for (const chunk of rootBudgetedChunks) {
        if (rootGeneratedContent.body.includes(chunk.content.substring(0, 35))) {
          rootCitationsToInsert.push({
            page_id: rootPageId,
            document_id: chunk.document_id,
            page_number: chunk.page_number,
            highlight: chunk.content.substring(0, 100),
            context: chunk.content
          })
        }
      }
      if (rootCitationsToInsert.length > 0) {
        await WikiGeneratorRepository.insertCitationsBulk(rootCitationsToInsert).catch(() => {})
      }

      const linkedRootBody = autoLinkContent(rootGeneratedContent.body, aliases, username, wikiSlug)

      await WikiGeneratorRepository.updatePageContent(rootPageId, {
        summary: rootGeneratedContent.summary,
        body: linkedRootBody,
        generation_status: "GENERATED"
      })
    }
  } catch (err) {
    console.error(`Failed to generate ROOT page:`, err)
    try {
      await WikiGeneratorRepository.updatePageContent(rootPageId, {
        generation_status: "FAILED"
      })
    } catch (dbErr) {}
  }
}
