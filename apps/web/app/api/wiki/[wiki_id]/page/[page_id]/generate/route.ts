import { supabase } from "@/lib/supabase";
import { NextRequest } from "next/server"
import { auth } from "auth"
import { WikiGeneratorRepository } from "@/lib/repositories/wiki-generator"
import { DocumentRepository } from "@/lib/repositories/document"
import { EmbeddingService } from "@/services/ai/embeddings"
import { getBedrockOpenAIClient } from "@/services/ai/bedrock"
import { callBedrockProviderJson, rerankChunks, generateMockWikiPage } from "@/services/wiki-synthesis/utils"
import { autoLinkContent } from "@/services/wiki-synthesis/page-generator"



export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ wiki_id: string; page_id: string }> }
) {
  try {
    const { wiki_id, page_id } = await params
    
    // Fetch wiki details first to check visibility and owner info
    const { data: wikiData } = await supabase
      .from("wikis")
      .select("slug, owner_id, visibility")
      .eq("id", wiki_id)
      .maybeSingle()

    // 1. Session Auth Guard - Allow unauthenticated generation for PUBLIC wikis
    const session = await auth()
    const isPublic = wikiData?.visibility === "PUBLIC"
    if (!session?.user && !isPublic) {
      return Response.json({ error: "Unauthorized session" }, { status: 401 })
    }

    // 2. Fetch page details
    const page = await WikiGeneratorRepository.fetchPageById(page_id)
    if (!page) {
      return Response.json({ error: "Page not found." }, { status: 404 })
    }

    // 3. If already generated, return content immediately
    if (page.generation_status === "GENERATED") {
      return Response.json({ success: true, page })
    }

    // Update status to GENERATING
    await WikiGeneratorRepository.updatePageContent(page_id, {
      generation_status: "GENERATING"
    })

    // 4. Resolve wiki owner username and slug
    let username = "user"
    let wikiSlug = "wiki"
      
    if (wikiData) {
      wikiSlug = wikiData.slug
      const { data: userData } = await supabase
        .from("users")
        .select("username")
        .eq("id", wikiData.owner_id)
        .maybeSingle()
      if (userData) {
        username = userData.username
      }
    }

    // Parse description, keywords and sourcePageNumber from page.summary
    let description = ""
    let keywords: string[] = []
    let sourcePageNumbers: number[] = []
    const summaryStr = page.summary || ""
    
    // Check for SourcePages first
    let mainSummaryPart = summaryStr
    if (summaryStr.includes(" | SourcePages: ")) {
      const parts = summaryStr.split(" | SourcePages: ")
      mainSummaryPart = parts[0] || ""
      const pNumStr = parts[1]?.trim()
      if (pNumStr) {
        sourcePageNumbers = pNumStr.split(",").map((n: string) => parseInt(n.trim())).filter((n: number) => !isNaN(n))
      }
    } else if (summaryStr.includes(" | SourcePage: ")) {
      const parts = summaryStr.split(" | SourcePage: ")
      mainSummaryPart = parts[0] || ""
      const pNumStr = parts[1]?.trim()
      if (pNumStr) {
        sourcePageNumbers = [parseInt(pNumStr)]
      }
    }

    if (mainSummaryPart.includes(" | Keywords: ")) {
      const parts = mainSummaryPart.split(" | Keywords: ")
      description = parts[0] || ""
      keywords = parts[1] ? parts[1].split(",").map((k: string) => k.trim()) : []
    } else {
      description = mainSummaryPart
    }

    const documents = await DocumentRepository.fetchWikiDocuments(wiki_id)
    
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
        console.warn("Failed to fetch primary/surrounding chunks in route:", err)
      }
    }

    const embeddingQuery = `${page.title} ${description} Keywords: ${keywords.join(", ")}`.trim()
    const { embedding } = await EmbeddingService.generateEmbedding(embeddingQuery)

    // 6. Search top 40 similar document chunks using pgvector RPC
    const similarChunks = await WikiGeneratorRepository.searchSimilarChunks(
      wiki_id,
      embedding,
      40,
      0.10
    )

    let budgetedChunks = []
    let chunkContents = ""

    if (similarChunks.length > 0 || primaryChunks.length > 0) {
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
          console.warn("Failed to fetch chunk details for reranking in route:", err)
        }
      }

      // Run hybrid reranker
      const rerankedChunks = rerankChunks(detailedChunks, page.title, keywords)

      // Take top 15 or 12 depending on ROOT vs TOPIC/SUBTOPIC
      const isRootPage = page.page_type === "ROOT"
      const maxChunks = isRootPage ? 15 : 12
      const tokenBudgetChars = isRootPage ? 10000 : 6000

      const topChunks = rerankedChunks.slice(0, maxChunks)
      let currentChars = 0

      for (const c of topChunks) {
        if (currentChars + c.content.length > tokenBudgetChars) break
        currentChars += c.content.length
        budgetedChunks.push(c)
      }

      chunkContents = budgetedChunks
        .map((c, idx) => `[Source ${idx + 1}] (Page ${c.page_number}): ${c.content}`)
        .join("\n---\n")
    }

    const wikiPages = await WikiGeneratorRepository.fetchWikiPages(wiki_id)
    const isRootPage = page.page_type === "ROOT"
    const isTopicPage = page.page_type === "TOPIC"

    const rootPage = wikiPages.find(p => p.page_type === "ROOT")
    const rootPageTitle = rootPage ? rootPage.title : "Home"

    // Resolve parent and child pages for relationship context
    let parentTitle = ""
    let parentSlug = ""
    if (page.parent_page_id) {
      const parentPage = wikiPages.find(p => p.id === page.parent_page_id)
      if (parentPage) {
        parentTitle = parentPage.title
        parentSlug = parentPage.slug
      }
    }

    const children = wikiPages.filter(p => p.parent_page_id === page.id)
    const childTitles = children.map(c => c.title)

    const relationshipHint = parentTitle
      ? `\nThis page sits under the broader topic "${parentTitle}".`
      : ""
    const childrenHint = childTitles.length > 0
      ? `\nThis page has sub-articles: ${childTitles.map(t => `"${t}"`).join(", ")}. Mention them naturally where relevant.`
      : ""

    let pagePrompt = ""
    if (isRootPage) {
      const subpages = wikiPages.filter(p => p.page_type !== "ROOT")
      const subpageDirectory = subpages
        .map(sp => `- **${sp.title}** (/u/${username}/${wikiSlug}/${sp.slug}): ${sp.summary || sp.title}`)
        .join("\n")

      pagePrompt = `You are writing the main overview landing page for a Wikipedia-style wiki titled "${page.title}".
      
      This is the landing page. Below is a list of the sub-articles available in this wiki:
      ${subpageDirectory}
      
      Your task: write a cohesive, comprehensive overview narrative (~600-900 words) under the header:
      ### Overview
      (Write a deep-dive narrative introducing the overall subject. Ground facts in the sources, and naturally reference each sub-article by its exact title at least once in your paragraphs so they can be hyperlinked.)
      
      Writing rules:
      - Write in continuous prose. Do not make bullet lists.
      - Refer to sub-articles by their exact title naturally.
      - Ground your core claims in the source evidence below. Do not make up facts that contradict the sources.
      - **IMPORTANT**: If the source evidence is brief or contains sparse bullet points, you MUST explain, define, and elaborate on the technical terms, architectures, and concepts mentioned in the sources to write a detailed, rich, and comprehensive overview. Use your general knowledge to explain these concepts clearly in-depth, as long as it does not contradict the source evidence.
      
      Source Evidence:
      ${chunkContents}
      
      Return JSON:
      {
        "summary": "One precise sentence summarizing the entire wiki scope.",
        "body": "### Overview\nYour narrative overview body here..."
      }`
    } else if (isTopicPage) {
      pagePrompt = `You are writing a Wikipedia-style encyclopedia TOPIC page titled "${page.title}".
      
      Write a clear, flowing academic narrative of 400–600 words covering the following sections (use exact ### headings):
      ### Overview
      (Introduce the topic scope, objectives, and importance based on the sources.)
      
      ### Key Concepts
      (Define the main terms, models, components, or parameters mentioned in the sources.)
      
      ### Detailed Explanation
      (Step-by-step description of how it works, workflows, or architectural principles.)
      
      ### Examples
      (Describe specific use cases, tests, or benchmarks mentioned in the sources.)
      
      ${relationshipHint}${childrenHint}
      
      Writing rules:
      - Ground your core claims in the source evidence below. Do not make up facts that contradict the sources.
      - **IMPORTANT**: If the source evidence is very brief or contains sparse bullet points, you MUST explain, define, and elaborate on the technical terms, architectures, and concepts mentioned in the sources to write a detailed, rich, and comprehensive article. Use your general knowledge to explain these concepts clearly in-depth, as long as it does not contradict the source evidence.
      - Write in prose paragraphs. No bullet lists.
      - Keep it highly information-dense.
      
      Source Evidence:
      ${chunkContents}
      
      Return JSON:
      {
        "summary": "One precise sentence summarizing this topic.",
        "body": "Your complete markdown article body."
      }`
    } else {
      // SUBTOPIC page
      pagePrompt = `You are writing a Wikipedia-style encyclopedia SUBTOPIC page titled "${page.title}".
      
      Write a clear, flowing academic narrative of 350-500 words covering the following sections (use exact ### headings):
      ### Detailed Explanation
      (Provide an exhaustive technical breakdown of this specific concept, algorithm, or mechanism based on the sources.)
      
      ### Examples
      (Provide concrete examples, equations, or scenarios described in the sources.)
      
      ${relationshipHint}
      
      Writing rules:
      - Ground your core claims in the source evidence below. Do not make up facts that contradict the sources.
      - **IMPORTANT**: If the source evidence is very brief or contains sparse bullet points, you MUST explain, define, and elaborate on the technical terms, architectures, and concepts mentioned in the sources to write a detailed, rich, and comprehensive article. Use your general knowledge to explain these concepts clearly in-depth, as long as it does not contradict the source evidence.
      - Write in prose paragraphs. No bullet lists.
      
      Source Evidence:
      ${chunkContents}
      
      Return JSON:
      {
        "summary": "One precise sentence summarizing this subtopic.",
        "body": "Your complete markdown article body."
      }`
    }

    let generatedContent = { summary: page.summary || "", body: "" }
    if (similarChunks.length === 0 && primaryChunks.length === 0) {
      generatedContent = generateMockWikiPage(page.title, page.page_type, parentTitle)
    } else {
      try {
        const apiResult = await callBedrockProviderJson(pagePrompt)
        if (apiResult.summary && apiResult.body) {
          generatedContent = apiResult
        }
      } catch (err) {
        console.error("DeepSeek lazy generation failed. Using mock content.", err)
        generatedContent = generateMockWikiPage(page.title, page.page_type, parentTitle)
      }
    }

    let processedBody = ""
    if (isRootPage) {
      const totalPages = wikiPages.length
      const totalCitations = budgetedChunks.length
      const totalTopics = wikiPages.filter(p => p.page_type === "TOPIC").length

      const statisticsMarkdown = `\n\n### Statistics\n• ${totalPages} Pages\n• ${totalCitations} References\n• ${totalTopics} Topics\n`

      let graphPreviewMarkdown = "\n### Knowledge Graph Preview\n```\n"
      if (rootPage) {
        graphPreviewMarkdown += `${rootPage.title}\n`
        const topicPages = wikiPages.filter(p => p.parent_page_id === rootPage.id)
        topicPages.forEach((topic, tIdx) => {
          const isLastTopic = tIdx === topicPages.length - 1
          const prefix = isLastTopic ? "└─ " : "├─ "
          graphPreviewMarkdown += `${prefix}${topic.title}\n`
          
          const subtopics = wikiPages.filter(p => p.parent_page_id === topic.id)
          subtopics.forEach((subtopic, sIdx) => {
            const subPrefix = isLastTopic ? "   " : "│  "
            const isLastSub = sIdx === subtopics.length - 1
            const leafPrefix = isLastSub ? "└─ " : "├─ "
            graphPreviewMarkdown += `${subPrefix}${leafPrefix}${subtopic.title}\n`
          })
        })
      }
      graphPreviewMarkdown += "```\n"

      let readingPathMarkdown = "\n### Recommended Reading Path\n"
      let pathIndex = 1
      if (rootPage) {
        readingPathMarkdown += `${pathIndex++}. ${rootPage.title}\n`
        const topicPages = wikiPages.filter(p => p.parent_page_id === rootPage.id)
        topicPages.forEach(topic => {
          readingPathMarkdown += `${pathIndex++}. ${topic.title}\n`
          const subtopics = wikiPages.filter(p => p.parent_page_id === topic.id)
          subtopics.forEach(sub => {
            readingPathMarkdown += `${pathIndex++}. ${sub.title}\n`
          })
        })
      }

      let mainTopicsMarkdown = "\n### Main Topics\n"
      const topicPages = wikiPages.filter(p => p.page_type === "TOPIC")
      topicPages.forEach(topic => {
        mainTopicsMarkdown += `• [${topic.title}](/u/${username}/${wikiSlug}/${topic.slug})\n`
      })

      let recentPagesMarkdown = "\n### Recent Pages\n"
      wikiPages.slice(0, 8).forEach(p => {
        recentPagesMarkdown += `• [${p.title}](/u/${username}/${wikiSlug}/${p.slug})\n`
      })

      processedBody = generatedContent.body + statisticsMarkdown + graphPreviewMarkdown + readingPathMarkdown + mainTopicsMarkdown + recentPagesMarkdown
    } else if (isTopicPage) {
      const breadcrumb = `Home > ${rootPageTitle} > ${page.title}\n\n---\n\n`
      
      let subtopicsMarkdown = ""
      if (childTitles.length > 0) {
        subtopicsMarkdown = `\n\n### Subtopics\n` + children.map(c => `• [${c.title}](/u/${username}/${wikiSlug}/${c.slug})`).join("\n")
      }
      
      let relatedMarkdown = ""
      const siblingTopics = wikiPages.filter(p => p.page_type === "TOPIC" && p.id !== page.id)
      if (siblingTopics.length > 0) {
        relatedMarkdown = `\n\n### Related Topics\n` + siblingTopics.map(s => `• [${s.title}](/u/${username}/${wikiSlug}/${s.slug})`).join("\n")
      }

      processedBody = breadcrumb + generatedContent.body + subtopicsMarkdown + relatedMarkdown
    } else {
      // SUBTOPIC page
      const breadcrumb = `Home > ${rootPageTitle} > ${parentTitle || "Topic"} > ${page.title}\n\n---\n\n`
      
      let relationshipsMarkdown = ""
      if (parentTitle && parentSlug) {
        relationshipsMarkdown = `\n\n### Relationships\n• **Parent Topic**: [${parentTitle}](/u/${username}/${wikiSlug}/${parentSlug})\n`
      }
      const siblings = wikiPages.filter(p => p.parent_page_id === page.parent_page_id && p.id !== page.id)
      if (siblings.length > 0) {
        relationshipsMarkdown += siblings.map(s => `• **Sibling Subtopic**: [${s.title}](/u/${username}/${wikiSlug}/${s.slug})`).join("\n")
      }

      processedBody = breadcrumb + generatedContent.body + relationshipsMarkdown
    }

    // Append references
    let referencesMarkdown = `\n\n### References\n`
    budgetedChunks.forEach((c, idx) => {
      const docFile = documents.find(d => d.id === c.document_id)
      referencesMarkdown += `*   [Source ${idx + 1}] ${docFile?.filename || "Source File"} (Page ${c.page_number})\n`
    })
    processedBody += referencesMarkdown

    // 8. Auto-Linking
    const aliases = await WikiGeneratorRepository.fetchAllWikiAliases(wiki_id)
    const linkedBody = autoLinkContent(processedBody, aliases, username, wikiSlug)

    // 9. Save Page Chunk References & Citations
    if (similarChunks.length === 0 && budgetedChunks.length === 0) {
      const validDocId = documents.length > 0 ? documents[0].id : null
      if (validDocId) {
        await WikiGeneratorRepository.insertCitation({
          page_id,
          document_id: validDocId,
          page_number: 1,
          highlight: "Default page skeleton created from empty sources.",
          context: "Default page skeleton created from empty sources."
        })
      }
    } else {
      for (const chunk of budgetedChunks) {
        await WikiGeneratorRepository.insertPageChunkReference(page_id, chunk.chunk_id)
        
        if (generatedContent.body.includes(chunk.content.substring(0, 35))) {
          await WikiGeneratorRepository.insertCitation({
            page_id,
            document_id: chunk.document_id,
            page_number: chunk.page_number,
            highlight: chunk.content.substring(0, 100),
            context: chunk.content
          })
        }
      }
    }

    // 10. Update page status in Database
    const updatedPage = await WikiGeneratorRepository.updatePageContent(page_id, {
      summary: generatedContent.summary,
      body: linkedBody,
      generation_status: "GENERATED"
    })

    return Response.json({ success: true, page: updatedPage })

  } catch (err: any) {
    console.error("Error generating page lazily:", err)
    return Response.json({ error: err.message || "Server Error" }, { status: 500 })
  }
}

