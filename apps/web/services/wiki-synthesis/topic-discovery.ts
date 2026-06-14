import { supabase } from "@/lib/supabase"
import { WikiGeneratorRepository } from "@/lib/repositories/wiki-generator"
import { callBedrockProviderJson } from "./utils"
import { ExtractedPage } from "./extractor"

export interface DiscoveredTopic {
  title: string
  slug: string
  parent_slug: string | null
  page_type: "ROOT" | "TOPIC" | "SUBTOPIC"
  description: string
  keywords: string[]
  page_number?: number
  page_numbers?: number[]
}

export interface DiscoveryResult {
  root_slug?: string
  pages?: DiscoveredTopic[]
  links?: { source_slug: string; target_slug: string }[]
}

export function discoverTopicsFromMarkdown(
  allPagesData: ExtractedPage[],
  wikiTitle: string,
  wikiDesc: string
): DiscoveryResult | null {
  const pages: DiscoveredTopic[] = []
  const slugsSeen = new Set<string>()

  // Helper to slugify text
  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

  // Helper to extract clean page title from the first non-empty line
  const extractPageTitle = (text: string): string | null => {
    if (!text) return null
    const lines = text.split(/\r?\n/)
    for (const line of lines) {
      let trimmed = line.trim()
      // Ignore markdown page headers like "## Page X" or "Page X"
      if (/^#*\s*Page\s+\d+$/i.test(trimmed)) continue
      if (/^Page\s+\d+$/i.test(trimmed)) continue
      
      // Remove leading bullet characters or symbols
      trimmed = trimmed.replace(/^[•–▪*\-\s\d\.]+\s*/, "").trim()
      
      if (trimmed.length >= 3 && trimmed.length <= 80) {
        return trimmed
      }
    }
    return null
  }

  let rootTopic: DiscoveredTopic | null = null

  for (const page of allPagesData) {
    if (!page.text) continue
    
    let title = extractPageTitle(page.text)
    if (!title) continue
    
    let slug = slugify(title)
    if (slugsSeen.has(slug)) {
      title = `${title} (Page ${page.pageNumber})`
      slug = slugify(title)
    }
    
    slugsSeen.add(slug)
    
    if (!rootTopic) {
      rootTopic = {
        title: title,
        slug: slug,
        parent_slug: null,
        page_type: "ROOT",
        description: `Overview, historical introduction, and comprehensive narrative of ${title}.`,
        keywords: title.toLowerCase().split(" ").filter(w => w.length > 2).slice(0, 8),
        page_number: page.pageNumber
      }
      pages.push(rootTopic)
    } else {
      const topic: DiscoveredTopic = {
        title: title,
        slug: slug,
        parent_slug: rootTopic.slug,
        page_type: "TOPIC",
        description: `Detailed technical breakdown, core concepts, and workflows of ${title}.`,
        keywords: title.toLowerCase().split(" ").filter(w => w.length > 2).slice(0, 8),
        page_number: page.pageNumber
      }
      pages.push(topic)
    }
  }

  if (pages.length === 0) return null

  // Map links
  const links: { source_slug: string; target_slug: string }[] = []
  pages.slice(1).forEach(p => {
    if (rootTopic) {
      links.push({ source_slug: rootTopic.slug, target_slug: p.slug })
    }
  })

  console.log(`[Topic Discovery] Discovered ${pages.length} topics from slide page titles:`)
  pages.forEach((p, idx) => {
    console.log(`  - [${idx + 1}] Title: "${p.title}" | Slug: "${p.slug}" | Parent: "${p.parent_slug || "(none)"}" | Type: ${p.page_type}`)
  })

  return {
    root_slug: rootTopic?.slug,
    pages,
    links
  }
}

export interface PageVector {
  pageNumber: number
  vector: number[]
  title: string
  text: string
}

export function performAgglomerativeClustering(
  pages: PageVector[],
  targetClustersCount: number
): PageVector[][] {
  let clusters: PageVector[][] = pages.map(p => [p])

  const dotProduct = (a: number[], b: number[]) => {
    let sum = 0
    const len = Math.min(a.length, b.length)
    for (let i = 0; i < len; i++) {
      sum += a[i] * b[i]
    }
    return sum
  }

  const getClusterSimilarity = (c1: PageVector[], c2: PageVector[]) => {
    let sum = 0
    let count = 0
    for (const p1 of c1) {
      for (const p2 of c2) {
        sum += dotProduct(p1.vector, p2.vector)
        count++
      }
    }
    return count > 0 ? sum / count : 0
  }

  while (clusters.length > targetClustersCount) {
    let maxSim = -Infinity
    let mergeIdx1 = -1
    let mergeIdx2 = -1

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const sim = getClusterSimilarity(clusters[i], clusters[j])
        if (sim > maxSim) {
          maxSim = sim
          mergeIdx1 = i
          mergeIdx2 = j
        }
      }
    }

    if (mergeIdx1 !== -1 && mergeIdx2 !== -1) {
      clusters[mergeIdx1] = [...clusters[mergeIdx1], ...clusters[mergeIdx2]]
      clusters.splice(mergeIdx2, 1)
    } else {
      break
    }
  }

  return clusters
}

export async function discoverTopicsByClustering(
  wikiId: string,
  allPagesData: ExtractedPage[],
  createdChunks: any[],
  wikiTitle: string,
  wikiDesc: string
): Promise<DiscoveryResult | null> {
  try {
    const chunkIds = createdChunks.map(c => c.id)
    const { data: embeds, error } = await supabase
      .from("chunk_embeddings")
      .select("chunk_id, embedding")
      .in("chunk_id", chunkIds)

    if (error || !embeds || embeds.length === 0) {
      console.warn("Could not fetch embeddings for clustering:", error)
      return null
    }

    const vectorMap = new Map<string, number[]>()
    for (const e of embeds) {
      if (Array.isArray(e.embedding)) {
        vectorMap.set(e.chunk_id, e.embedding)
      } else if (typeof e.embedding === "string") {
        try {
          const parsed = JSON.parse(e.embedding)
          if (Array.isArray(parsed)) {
            vectorMap.set(e.chunk_id, parsed)
          }
        } catch (_) {
          const cleanStr = (e.embedding as string).replace(/[\[\]]/g, "")
          const parsed = cleanStr.split(",").map((v: string) => parseFloat(v))
          vectorMap.set(e.chunk_id, parsed)
        }
      }
    }

    const extractPageTitle = (text: string): string | null => {
      if (!text) return null
      const lines = text.split(/\r?\n/)
      for (const line of lines) {
        let trimmed = line.trim()
        if (/^#*\s*Page\s+\d+$/i.test(trimmed)) continue
        if (/^Page\s+\d+$/i.test(trimmed)) continue
        trimmed = trimmed.replace(/^[•–▪*\-\s\d\.]+\s*/, "").trim()
        if (trimmed.length >= 3 && trimmed.length <= 80) return trimmed
      }
      return null
    }

    const pageVectors: PageVector[] = []
    for (const page of allPagesData) {
      const pageNum = page.pageNumber
      const chunk = createdChunks.find(c => c.page_number === pageNum)
      if (!chunk) continue
      
      const vector = vectorMap.get(chunk.id)
      if (!vector) continue
      
      // Fall back to wikiTitle (not "Page N") when page text has no extractable title
      const title = extractPageTitle(page.text) || wikiTitle || `Document Page ${pageNum}`
      pageVectors.push({
        pageNumber: pageNum,
        vector,
        title,
        text: page.text
      })
    }

    if (pageVectors.length === 0) return null

    const rootPageVec = pageVectors.find(p => p.pageNumber === 1) || pageVectors[0]
    const remainingPages = pageVectors.filter(p => p.pageNumber !== rootPageVec.pageNumber)

    const slugify = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")

    // Never use a raw "Page N" or "Document Page N" string as the root title — always prefer wikiTitle
    const isGenericPageTitle = /^(document\s+)?page\s+\d+$/i.test((rootPageVec.title || "").trim())
    const rootTitle = isGenericPageTitle
      ? (wikiTitle || "Overview")
      : (rootPageVec.title || wikiTitle || "Overview")
    const rootTopic: DiscoveredTopic = {
      title: rootTitle,
      slug: slugify(rootTitle),
      parent_slug: null,
      page_type: "ROOT",
      description: wikiDesc || `Comprehensive introductory overview covering ${rootTitle}.`,
      keywords: rootTitle.toLowerCase().split(" ").filter((w: string) => w.length > 2).slice(0, 8),
      page_numbers: [rootPageVec.pageNumber]
    }

    if (remainingPages.length === 0) {
      return {
        root_slug: rootTopic.slug,
        pages: [rootTopic],
        links: []
      }
    }

    // Target cluster count K — aim for 3-4 TOPIC clusters so we have room for subtopics
    const targetK = Math.min(4, Math.max(2, Math.floor(remainingPages.length / 3)))
    const clusters = performAgglomerativeClustering(remainingPages, targetK)

    const pages: DiscoveredTopic[] = [rootTopic]

    console.log(`[Topic Discovery] Clustering remaining ${remainingPages.length} pages into ${targetK} topic clusters...`)

    // For each cluster: name it as a TOPIC, then sub-cluster large clusters into SUBTOPICs
    const clusterPromises = clusters.map(async (cluster, idx) => {
      const slideInfo = cluster
        .map(p => `Slide (Page ${p.pageNumber}): Title: "${p.title}"\nContent Summary: ${p.text.substring(0, 200)}`)
        .join("\n\n")

      const prompt = `You are a technical knowledge architect.
      We have grouped several slides/pages of a document together based on vector similarity.
      Your task is to analyze these slides and generate a cohesive, high-level topic title, a 3-4 sentence academic description, and 6-8 keywords representing this combined group of slides.
      
      Slides in this group:
      ${slideInfo}
      
      Return your response in this exact JSON format. No markdown wrappers, no preambles:
      {
        "title": "Cohesive Topic Title",
        "description": "A detailed 3-4 sentence academic description of the combined topic.",
        "keywords": ["keyword1", "keyword2", "keyword3"]
      }`

      try {
        const res = await callBedrockProviderJson(prompt)
        return {
          title: res.title || `Topic ${idx + 1}`,
          description: res.description || "Detailed technical concepts.",
          keywords: res.keywords || [],
          page_numbers: cluster.map(p => p.pageNumber),
          clusterPages: cluster
        }
      } catch (err) {
        console.error(`LLM cluster naming failed for cluster ${idx}:`, err)
        const combinedTitles = cluster.slice(0, 2).map(p => p.title).join(" & ")
        return {
          title: combinedTitles || `Topic ${idx + 1}`,
          description: "Technical subtopic concepts.",
          keywords: [],
          page_numbers: cluster.map(p => p.pageNumber),
          clusterPages: cluster
        }
      }
    })

    const discoveredClusters = await Promise.all(clusterPromises)
    const slugsSeen = new Set<string>([rootTopic.slug])

    for (const dc of discoveredClusters) {
      let title = dc.title
      let slug = slugify(title)
      if (slugsSeen.has(slug)) {
        title = `${title} (Group)`
        slug = slugify(title)
      }
      slugsSeen.add(slug)

      pages.push({
        title,
        slug,
        parent_slug: rootTopic.slug,
        page_type: "TOPIC",
        description: dc.description,
        keywords: dc.keywords,
        page_numbers: dc.page_numbers
      })

      // Every TOPIC MUST have SUBTOPICs — enforce 3-level hierarchy (ROOT→TOPIC→SUBTOPIC)
      // For single-page clusters, ask LLM to split the page into 2 conceptual aspects
      const subK = dc.clusterPages.length === 1 ? 2 : Math.min(3, Math.floor(dc.clusterPages.length / 2) + 1)

      if (dc.clusterPages.length === 1) {
        // Single page: ask LLM to divide into 2 distinct aspect subtopics
        const pageContent = dc.clusterPages[0]
        const splitPrompt = `You are a technical knowledge architect.
        The topic "${title}" is covered by a single document page.
        Divide this topic into exactly 2 distinct conceptual subtopics that can each be a standalone wiki page.
        Each subtopic should cover a different aspect, mechanism, or phase of the parent topic.

        Page content:
        ${pageContent.text.substring(0, 400)}

        Return your response in this exact JSON format. No markdown wrappers, no preambles:
        {
          "subtopics": [
            { "title": "Subtopic 1 Title", "description": "2-3 sentences describing this subtopic.", "keywords": ["kw1", "kw2"] },
            { "title": "Subtopic 2 Title", "description": "2-3 sentences describing this subtopic.", "keywords": ["kw1", "kw2"] }
          ]
        }`

        try {
          const splitRes = await callBedrockProviderJson(splitPrompt)
          const subtopicDefs = (splitRes.subtopics || []).slice(0, 2)
          for (let sIdx = 0; sIdx < subtopicDefs.length; sIdx++) {
            const st = subtopicDefs[sIdx]
            let stTitle = st.title || `${title} — Aspect ${sIdx + 1}`
            let stSlug = slugify(stTitle)
            if (slugsSeen.has(stSlug)) { stTitle = `${stTitle} (Detail)`; stSlug = slugify(stTitle) }
            slugsSeen.add(stSlug)
            pages.push({
              title: stTitle, slug: stSlug, parent_slug: slug,
              page_type: "SUBTOPIC", description: st.description || "Focused subtopic.",
              keywords: st.keywords || [], page_numbers: [pageContent.pageNumber]
            })
          }
        } catch (err) {
          // Fallback: create 2 generic subtopics
          for (let sIdx = 0; sIdx < 2; sIdx++) {
            const stTitle = `${title} — Part ${sIdx + 1}`
            const stSlug = slugify(stTitle)
            slugsSeen.add(stSlug)
            pages.push({
              title: stTitle, slug: stSlug, parent_slug: slug,
              page_type: "SUBTOPIC", description: "Focused subtopic concepts.",
              keywords: [], page_numbers: [pageContent.pageNumber]
            })
          }
        }
      } else {
        const subClusters = performAgglomerativeClustering(dc.clusterPages, subK)
        console.log(`[Topic Discovery]   → Sub-clustering "${title}" (${dc.clusterPages.length} pages) into ${subK} subtopics`)

        const subPromises = subClusters.map(async (subCluster, sIdx) => {
          const subSlideInfo = subCluster
            .map(p => `Slide (Page ${p.pageNumber}): Title: "${p.title}"\nContent Summary: ${p.text.substring(0, 150)}`)
            .join("\n\n")

          const subPrompt = `You are a technical knowledge architect.
          We have grouped slides from the topic "${title}" into a focused sub-group.
          Generate a precise subtopic title, a 2-3 sentence description, and 4-6 keywords for this subgroup.
          
          Slides in this subgroup:
          ${subSlideInfo}
          
          Return your response in this exact JSON format. No markdown wrappers, no preambles:
          {
            "title": "Precise Subtopic Title",
            "description": "A focused 2-3 sentence description of this subtopic.",
            "keywords": ["keyword1", "keyword2", "keyword3"]
          }`

          try {
            const subRes = await callBedrockProviderJson(subPrompt)
            return {
              title: subRes.title || `${title} — Part ${sIdx + 1}`,
              description: subRes.description || "Focused subtopic.",
              keywords: subRes.keywords || [],
              page_numbers: subCluster.map(p => p.pageNumber)
            }
          } catch (err) {
            return {
              title: `${title} — Part ${sIdx + 1}`,
              description: "Focused subtopic concepts.",
              keywords: [],
              page_numbers: subCluster.map(p => p.pageNumber)
            }
          }
        })

        const namedSubtopics = await Promise.all(subPromises)
        for (const st of namedSubtopics) {
          let stTitle = st.title
          let stSlug = slugify(stTitle)
          if (slugsSeen.has(stSlug)) { stTitle = `${stTitle} (Detail)`; stSlug = slugify(stTitle) }
          slugsSeen.add(stSlug)
          pages.push({
            title: stTitle, slug: stSlug, parent_slug: slug,
            page_type: "SUBTOPIC", description: st.description,
            keywords: st.keywords, page_numbers: st.page_numbers
          })
        }
      }
    }

    const links: { source_slug: string; target_slug: string }[] = []
    // root → topics
    pages.filter(p => p.parent_slug === rootTopic.slug).forEach(p => {
      links.push({ source_slug: rootTopic.slug, target_slug: p.slug })
    })
    // topics → subtopics
    pages.filter(p => p.page_type === "SUBTOPIC").forEach(p => {
      if (p.parent_slug) links.push({ source_slug: p.parent_slug, target_slug: p.slug })
    })

    return {
      root_slug: rootTopic.slug,
      pages,
      links
    }

  } catch (err) {
    console.error("Clustering topic discovery failed:", err)
    return null
  }
}

/**
 * Post-processing guard: remove any TOPIC page that has no SUBTOPIC children.
 * A TOPIC with no children would create a 2-level dead-end — we only allow:
 *   ROOT → TOPIC → SUBTOPIC (exactly 3 levels)
 */
function enforceThreeLevels(result: DiscoveryResult): DiscoveryResult {
  if (!result.pages || result.pages.length === 0) return result

  const subtopicParentSlugs = new Set(
    result.pages.filter(p => p.page_type === "SUBTOPIC").map(p => p.parent_slug)
  )

  // Keep: ROOT always, TOPIC only if it has at least one SUBTOPIC child, all SUBTOPICs
  const filteredPages = result.pages.filter(p => {
    if (p.page_type === "ROOT") return true
    if (p.page_type === "SUBTOPIC") return true
    // TOPIC: keep only if it has subtopic children
    if (p.page_type === "TOPIC") {
      const hasChildren = subtopicParentSlugs.has(p.slug)
      if (!hasChildren) {
        console.warn(`[Topic Discovery] Dropping bare TOPIC "${p.title}" — no SUBTOPIC children (would create 2-level dead-end)`)
      }
      return hasChildren
    }
    return true
  })

  // Rebuild links to only reference surviving pages
  const survivingSlugs = new Set(filteredPages.map(p => p.slug))
  const filteredLinks = (result.links || []).filter(
    l => survivingSlugs.has(l.source_slug) && survivingSlugs.has(l.target_slug)
  )

  console.log(`[Topic Discovery] enforceThreeLevels: ${result.pages.length} pages → ${filteredPages.length} pages after removing bare TOPICs`)

  return { ...result, pages: filteredPages, links: filteredLinks }
}

export async function runTopicDiscovery(
  wikiId: string,
  wikiTitle: string,
  wikiDesc: string,
  documentSummary: string,
  allPagesData?: ExtractedPage[],
  createdChunks?: any[]
): Promise<DiscoveryResult> {
  if (allPagesData && allPagesData.length > 0 && createdChunks && createdChunks.length > 0) {
    try {
      const clusteredResult = await discoverTopicsByClustering(
        wikiId,
        allPagesData,
        createdChunks,
        wikiTitle,
        wikiDesc
      )
      if (clusteredResult) {
        console.log(`[Topic Discovery] Successfully clustered slides by vector embeddings.`)
        return enforceThreeLevels(clusteredResult)
      }
    } catch (err) {
      console.warn("Failed to cluster topics by embeddings. Falling back to default markdown parser.", err)
    }

    const mdResult = discoverTopicsFromMarkdown(allPagesData, wikiTitle, wikiDesc)
    if (mdResult) {
      console.log(`[Topic Discovery] Using parsed markdown heading hierarchy instead of LLM.`)
      // Markdown path only produces ROOT+TOPIC — skip enforceThreeLevels for it
      return mdResult
    }
  }
  const hierarchyPrompt = `You are a professional technical knowledge architect and documentation designer.
  Analyze the following comprehensive summary of a document collection and design a highly structured, multi-level wiki site tree (hierarchy) of topics and subtopics to completely organize the material.
  
  Document Summary:
  ${documentSummary}
  
  Organization Rules:
  1. Designate EXACTLY one ROOT page as the primary introductory landing page (e.g. "Intro to Hadoop").
  2. Identify EXACTLY 2-4 main TOPIC pages representing key, high-level branches of knowledge. Sibling topics must have absolutely NO conceptual overlap.
  3. For EACH main TOPIC page, identify 2-3 SUBTOPIC pages representing deep-dive modular concepts. Every TOPIC must have at least 2 SUBTOPIC children. Only skip if a topic genuinely has only one distinct sub-concept.
  4. Sibling pages at every level must be distinct, conceptually modular, and well-supported by the source material.
  5. The total page count (ROOT + TOPICs + SUBTOPICs) MUST be between 7 and 10 pages. Sieve out any redundant or overlapping concepts. Keep the tree well-balanced.
  6. For each page in the hierarchy provide:
     - title: Precise encyclopedic title of the page.
     - slug: A URL-safe lowercase slug (alphanumeric and hyphens only).
     - parent_slug: null for ROOT, the ROOT slug for TOPICs, the respective TOPIC slug for SUBTOPICs.
     - page_type: "ROOT" | "TOPIC" | "SUBTOPIC"
     - description: A detailed 3-4 sentence academic description covering what the page will document.
     - keywords: An array of 6-10 specific technical terms/phrases related to this page.
  7. Pre-map cross-links (source_slug → target_slug) between conceptually related pages.
  
  Return your response in this exact JSON format. No markdown wrappers, no preambles:
  {
    "root_slug": "slug-of-the-root-page",
    "pages": [
      {
        "title": "Page Title",
        "slug": "page-slug",
        "parent_slug": "parent-page-slug-or-null",
        "page_type": "ROOT" | "TOPIC" | "SUBTOPIC",
        "description": "Detailed 3-4 sentence academic description.",
        "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"]
      }
    ],
    "links": [
      {
        "source_slug": "source-page-slug",
        "target_slug": "target-page-slug"
      }
    ]
  }`

  try {
    const llmResult = await callBedrockProviderJson(hierarchyPrompt)
    return enforceThreeLevels(llmResult)
  } catch (err) {
    console.error("Hierarchy topic discovery failed. Building fallback.", err)
    const fallbackTopics = getDefaultFallbackTopics(wikiTitle, wikiDesc)
    return {
      root_slug: fallbackTopics[0].slug,
      pages: fallbackTopics.map((t, idx) => ({
        title: t.title,
        slug: t.slug,
        parent_slug: idx === 0 ? null : fallbackTopics[0].slug,
        page_type: t.page_type as any,
        description: t.summary,
        keywords: t.title.toLowerCase().split(" ")
      })),
      links: fallbackTopics.slice(1).map(t => ({
        source_slug: fallbackTopics[0].slug,
        target_slug: t.slug
      }))
    }
  }
}

export function getDefaultFallbackTopics(title: string, description: string) {
  const cleanTitle = title || "Knowledge Base"
  const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  return [
    {
      title: `Introduction to ${cleanTitle}`,
      slug: slugify(`Introduction to ${cleanTitle}`),
      summary: `Foundational overview, scope, and objectives of the ${cleanTitle} workspace.`,
      page_type: "ROOT",
      confidence_score: 0.95
    },
    {
      title: `${cleanTitle} Core Principles`,
      slug: slugify(`${cleanTitle} Core Principles`),
      summary: `Analyzing key concepts, terminology, and structural models in ${cleanTitle}.`,
      page_type: "TOPIC",
      confidence_score: 0.90
    },
    {
      title: `${cleanTitle} Methodology`,
      slug: slugify(`${cleanTitle} Methodology`),
      summary: `Practical applications, processes, and standard workflows for ${cleanTitle}.`,
      page_type: "TOPIC",
      confidence_score: 0.85
    }
  ] as const
}

export async function setupHierarchyAndSkeletons(
  wikiId: string,
  discoveredResult: DiscoveryResult,
  wikiTitle: string
): Promise<{ pageMap: Record<string, string>; rootPageId: string | null; allPages: any[] }> {
  const discoveredPages = discoveredResult.pages || []
  const pageMap: Record<string, string> = {}
  let rootPageId: string | null = null

  const skeletonsToInsert = discoveredPages.map(p => {
    const desc = p.description || "Core subject area."
    const kws = p.keywords ? p.keywords.join(", ") : ""
    let summary = kws ? `${desc} | Keywords: ${kws}` : desc
    if (p.page_number !== undefined) {
      summary += ` | SourcePage: ${p.page_number}`
    }
    return {
      wiki_id: wikiId,
      slug: p.slug,
      title: p.title,
      summary: summary,
      page_type: p.page_type,
      confidence_score: 0.95
    }
  })

  // Enforce page limits for free plan
  const { data: wiki } = await supabase
    .from("wikis")
    .select("owner_id")
    .eq("id", wikiId)
    .maybeSingle()
  
  let allowedSkeletons = skeletonsToInsert
  if (wiki?.owner_id) {
    const { getUserUsage } = require("@/services/limits")
    const usage = await getUserUsage(wiki.owner_id)
    if (usage.plan === "FREE") {
      const remainingSlots = Math.max(0, usage.pagesLimit - usage.pagesCount)
      if (skeletonsToInsert.length > remainingSlots) {
        console.warn(`[Limits] Skeletons count exceeds remaining Free slots. Capping.`)
        allowedSkeletons = skeletonsToInsert.slice(0, remainingSlots)
      }
    }
  }

  const insertedPages = await WikiGeneratorRepository.insertPageSkeletonsBulk(allowedSkeletons)
  insertedPages.forEach(p => {
    pageMap[p.slug] = p.id
    if (p.page_type === "ROOT") {
      rootPageId = p.id
    }
  })

  // Insert page aliases in bulk
  const aliasesToInsert: { page_id: string; alias: string }[] = []
  insertedPages.forEach(page => {
    aliasesToInsert.push({ page_id: page.id, alias: page.title })
    if (page.title.includes(" ")) {
      const acronym = page.title.split(" ").map(w => w[0]).join("").toUpperCase()
      if (acronym.length >= 2) {
        aliasesToInsert.push({ page_id: page.id, alias: acronym })
      }
    }
  })
  if (aliasesToInsert.length > 0) {
    await WikiGeneratorRepository.insertPageAliasesBulk(aliasesToInsert).catch((err: any) => {
      console.warn("Non-fatal: failed to insert aliases in bulk:", err)
    })
  }

  // Map parent page IDs and save hierarchical links
  const parentUpdates = []
  const hierarchyRelations = []
  const hierarchyLinks = []

  for (const p of discoveredPages) {
    const pageId = pageMap[p.slug]
    if (!pageId) continue

    if (p.parent_slug) {
      const parentId = pageMap[p.parent_slug]
      if (parentId) {
        parentUpdates.push(
          supabase
            .from("wiki_pages")
            .update({ parent_page_id: parentId })
            .eq("id", pageId)
        )
        hierarchyRelations.push({
          wiki_id: wikiId,
          parent_id: parentId,
          child_id: pageId
        })
        hierarchyLinks.push({
          wiki_id: wikiId,
          source_page_id: parentId,
          target_page_id: pageId,
          link_type: "child"
        })
        hierarchyLinks.push({
          wiki_id: wikiId,
          source_page_id: pageId,
          target_page_id: parentId,
          link_type: "parent"
        })
      }
    } else if (p.slug !== discoveredResult.root_slug && rootPageId) {
      parentUpdates.push(
        supabase
          .from("wiki_pages")
          .update({ parent_page_id: rootPageId })
          .eq("id", pageId)
      )
      hierarchyRelations.push({
        wiki_id: wikiId,
        parent_id: rootPageId,
        child_id: pageId
      })
      hierarchyLinks.push({
        wiki_id: wikiId,
        source_page_id: rootPageId,
        target_page_id: pageId,
        link_type: "child"
      })
      hierarchyLinks.push({
        wiki_id: wikiId,
        source_page_id: pageId,
        target_page_id: rootPageId,
        link_type: "parent"
      })
    } else {
      hierarchyRelations.push({
        wiki_id: wikiId,
        parent_id: null,
        child_id: pageId
      })
    }
  }

  if (parentUpdates.length > 0) {
    await Promise.all(parentUpdates)
  }

  if (hierarchyRelations.length > 0) {
    try {
      const { error: hierarchyErr } = await supabase.from("wiki_page_hierarchy").insert(hierarchyRelations)
      if (hierarchyErr) {
        console.warn("Non-fatal: failed to insert hierarchy relations:", hierarchyErr)
      }
    } catch (err) {
      console.warn("Non-fatal: failed to insert hierarchy relations:", err)
    }
  }

  if (hierarchyLinks.length > 0) {
    try {
      await WikiGeneratorRepository.insertPageLinksBulk(hierarchyLinks)
    } catch (err) {
      console.warn("Non-fatal: failed to insert hierarchy links:", err)
    }
  }

  // Predefined cross-links from Topic Discovery
  if (discoveredResult.links && Array.isArray(discoveredResult.links)) {
    const crossLinks = []
    for (const link of discoveredResult.links) {
      const sourceId = pageMap[link.source_slug]
      const targetId = pageMap[link.target_slug]
      if (sourceId && targetId) {
        crossLinks.push({
          wiki_id: wikiId,
          source_page_id: sourceId,
          target_page_id: targetId,
          link_type: "related"
        })
      }
    }
    if (crossLinks.length > 0) {
      await WikiGeneratorRepository.insertPageLinksBulk(crossLinks).catch((err: any) => {
        console.warn("Non-fatal: failed to insert cross links in bulk:", err)
      })
    }
  }

  const allPages = await WikiGeneratorRepository.fetchWikiPages(wikiId)
  return { pageMap, rootPageId, allPages }
}
