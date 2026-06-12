import { NextRequest } from "next/server"
import { auth } from "auth"
import { createClient } from "@supabase/supabase-js"
import { WikiGeneratorRepository } from "@/lib/repositories/wiki-generator"
import { DocumentRepository } from "@/lib/repositories/document"
import { EmbeddingService } from "@/services/ai/embeddings"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

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

    // 5. Generate embedding for page title to perform vector similarity search
    const { embedding } = await EmbeddingService.generateEmbedding(page.title)

    // 6. Search top 12 similar document chunks using pgvector RPC (reduced from 40 to speed up LLM processing)
    const similarChunks = await WikiGeneratorRepository.searchSimilarChunks(
      wiki_id,
      embedding,
      12,
      0.15 // Lower threshold for candidate selection
    )

    if (similarChunks.length === 0) {
      const docs = await DocumentRepository.fetchWikiDocuments(wiki_id)
      const validDocId = docs.length > 0 ? docs[0].id : null

      const mockResult = generateMockWikiPage(page.title)
      const mockPage = await WikiGeneratorRepository.updatePageContent(page_id, {
        summary: mockResult.summary,
        body: mockResult.body,
        generation_status: "GENERATED"
      })
      
      if (validDocId) {
        await WikiGeneratorRepository.insertCitation({
          page_id,
          document_id: validDocId,
          page_number: 1,
          highlight: "Default page skeleton created from empty sources.",
          context: "Default page skeleton created from empty sources."
        })
      }

      return Response.json({ success: true, page: mockPage })
    }

    // 7. Enforce Token Budget of approx. 10,000 characters (reduced from 32,000 to minimize latency)
    let tokenBudgetChars = 10000
    let currentChars = 0
    const budgetedChunks = []

    for (const c of similarChunks) {
      if (currentChars + c.content.length > tokenBudgetChars) break
      currentChars += c.content.length
      budgetedChunks.push(c)
    }

    const chunkContents = budgetedChunks
      .map((c, idx) => `[Source ${idx + 1}] (Page ${c.page_number}): ${c.content}`)
      .join("\n---\n")

    const wikiPages = await WikiGeneratorRepository.fetchWikiPages(wiki_id)
    const otherTopics = wikiPages.filter(p => p.id !== page_id)
    const chaptersList = otherTopics.map(t => `- "${t.title}": ${t.summary || ""}`).join("\n")
    const isRootPage = page.page_type === "ROOT"

    // Resolve parent and child pages for relationship context
    let parentTitle = ""
    if (page.parent_page_id) {
      const parentPage = wikiPages.find(p => p.id === page.parent_page_id)
      if (parentPage) {
        parentTitle = parentPage.title
      }
    }

    const childrenPages = wikiPages.filter(p => p.parent_page_id === page.id)
    const childTitles = childrenPages.map(p => p.title)

    const relationshipContext = []
    if (parentTitle) relationshipContext.push(`Parent Topic (broader context): "${parentTitle}"`)
    if (childTitles.length > 0) relationshipContext.push(`Child Subtopics: ${childTitles.map(t => `"${t}"`).join(", ")}`)
    
    const relationshipText = relationshipContext.length > 0 
      ? `\nWiki Navigation Hierarchy context:\n${relationshipContext.join("\n")}\nUse this context to weave natural references and links to parent and child subtopics in your paragraphs (e.g. "...under the broader umbrella of ${parentTitle || 'parent'}..." or "...encompassing sub-disciplines like ${childTitles[0] || 'subtopics'}...").`
      : ""

    const pagePrompt = isRootPage
      ? `You are a professional technical documentation synthesizer. Write a comprehensive, highly factual introductory overview article for the wiki workspace: "${page.title}".
    
    This article serves as the primary landing page of the wiki. You MUST write a coherent narrative that introduces the workspace and naturally references and integrates the following chapters/topics in your text:
    ${chaptersList}
    
    CRITICAL:
    1. Refer to these chapters by their exact titles in your paragraphs (e.g. "...as detailed in the chapter on ${otherTopics[0]?.title || 'Topic'}...") so they can be hyperlinked.
    2. Do NOT list them as a bulleted list. Write a flow of paragraphs (like a Wikipedia introduction and overview).
    3. Construct the content ONLY using the source evidence snippets below:
    
    Source Evidence Snippets:
    ${chunkContents}
    
    Return your response in this exact JSON schema:
    {
      "summary": "1-sentence summary of the page.",
      "body": "Your full generated markdown body content goes here."
    }`
      : `You are a professional technical documentation synthesizer. Write a comprehensive, highly factual wiki article for the topic: "${page.title}".
    
    You MUST construct the content ONLY using the source evidence snippets provided below. Do not make up facts.
    ${relationshipText}
    
    Source Evidence Snippets:
    ${chunkContents}
    
    Structure constraints for the article:
    1. Do NOT include generic sections like "Overview", "Subtopics", "Visual References", "Related Pages", or "Sources/References" in your generated markdown. The UI layers these sections automatically.
    2. Instead, write custom, technical, topic-specific markdown headings (using ### and ####) that flow logically based on the concepts found in the source snippets.
    3. Write high-density paragraphs and bullet points detailing the mechanics, architecture, or key ideas. Do NOT include preambles, introductions, or summary concluding remarks that restate the text. Focus entirely on logical technical descriptions.
    
    Return your response in this exact JSON schema:
    {
      "summary": "1-sentence summary of the page.",
      "body": "Your full generated markdown body content goes here."
    }`

    let generatedContent = { summary: page.summary || "", body: "" }
    try {
      const apiResult = await callDeepSeekProviderJson(pagePrompt)
      if (apiResult.summary && apiResult.body) {
        generatedContent = apiResult
      }
    } catch (err) {
      console.error("DeepSeek lazy generation failed. Using mock content.", err)
      generatedContent = generateMockWikiPage(page.title)
    }

    // 8. Auto-Linking
    const aliases = await WikiGeneratorRepository.fetchAllWikiAliases(wiki_id)
    const linkedBody = autoLinkContent(generatedContent.body, aliases, username, wikiSlug)

    // 9. Save Page Chunk References & Citations
    for (const chunk of budgetedChunks) {
      await WikiGeneratorRepository.insertPageChunkReference(page_id, chunk.chunk_id)
      
      if (generatedContent.body.includes(chunk.content.substring(0, 30))) {
        await WikiGeneratorRepository.insertCitation({
          page_id,
          document_id: chunk.document_id,
          page_number: chunk.page_number,
          highlight: chunk.content.substring(0, 100),
          context: chunk.content
        })
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

/**
 * Regex alias replacement helper for Wikipedia style autolinks
 */
function autoLinkContent(
  body: string, 
  aliases: { page_id: string; alias: string; slug: string }[], 
  username: string, 
  wikiSlug: string
): string {
  // Sort aliases by length descending so longer matches ("Machine Learning") take precedence over shorter ones
  const sorted = [...aliases].sort((a, b) => b.alias.length - a.alias.length)
  let result = body
  
  for (const item of sorted) {
    if (!item.alias || !item.slug) continue
    if (item.alias.length < 3) continue // Avoid single/double letter collisions
    
    const escaped = item.alias.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
    // Match only if word boundary and not inside markdown links or html attributes
    const regex = new RegExp(`(?<!\\[|\\(|href=")\\b(${escaped})\\b(?!\\b[^[\\]]*\\])`, "gi")
    
    result = result.replace(regex, (match) => {
      return `<a href="/u/${username}/${wikiSlug}/${item.slug}" class="text-[#6b38d4] font-semibold hover:underline">${match}</a>`
    })
  }
  return result
}

/**
 * Fallback generator for offline/mock development runs
 */
function generateMockWikiPage(title: string) {
  return {
    summary: `Detailed handbook guide and technical breakdown covering ${title}.`,
    body: `
### Architecture and Functional Principles

This section covers the core characteristics and frameworks of **${title}**, establishing structural conventions based on source evidence.

### Core Framework and Systematic Workflows

- **Core Principles:** Understanding the primary components and foundations of **${title}**.
- **Systematic Analysis:** Examining the structural relationships and details within the domain.
- **Applications & Workflows:** Applying these frameworks to practical scenarios.
`
  }
}

/**
 * DeepSeek JSON caller helper
 */
async function callDeepSeekProviderJson(prompt: string): Promise<any> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey || apiKey === "YOUR_DEEPSEEK_API_KEY") {
    throw new Error("No DeepSeek API key configured.")
  }
  
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that outputs only valid JSON matching the requested schema. Do not include markdown wraps."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    }),
    signal: AbortSignal.timeout(15000)
  })
  
  if (!response.ok) {
    throw new Error(`DeepSeek API responded with HTTP status ${response.status}`)
  }
  
  const rawData = await response.json()
  return JSON.parse(rawData.choices?.[0]?.message?.content || "{}")
}
