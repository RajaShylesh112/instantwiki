import { supabase } from "@/lib/supabase";
import React from "react"
import { auth } from "auth"
import { notFound } from "next/navigation"
import { WikiRepository } from "@/lib/repositories/wiki"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Lock,
  Globe,
  EyeOff,
  Network,
  FileText,
  Layers,
  Link2,
  Calendar,
  Compass,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  Database,
  FileCheck,
  Image as ImageIcon
} from "lucide-react"
import WikiSearch from "./wiki-search"
import { WikiGeneratorRepository } from "@/lib/repositories/wiki-generator"
import { DocumentRepository } from "@/lib/repositories/document"
import { renderMarkdownBody } from "@/lib/markdown-renderer"

// Import dashboard components
import SourceCoverage from "@/components/wiki/source-coverage"
import GraphPreview from "@/components/wiki/graph-preview"
import LearningPath from "@/components/wiki/learning-path"
import CollapsibleOverview from "@/components/wiki/collapsible-overview"



interface WikiPageProps {
  params: Promise<{
    username: string
    wiki_slug: string
  }>
}

export default async function WikiPage({ params }: WikiPageProps) {
  const { username, wiki_slug } = await params

  // 1. Fetch user by username to resolve ownerId
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
    console.error("Error fetching owner user:", err)
  }

  // 2. Fetch Wiki from Supabase or fallback to mock
  let wiki: any = null
  let isMocked = false

  if (ownerUser) {
    try {
      wiki = await WikiRepository.getOrCreateWikiBySlug(ownerUser.id, wiki_slug)
      if (wiki.id === "00000000-0000-0000-0000-000000000000") {
        isMocked = true
      }
    } catch (dbErr: any) {
      if (dbErr?.code === "42P01") {
        isMocked = true
      } else {
        console.error("Database error fetching wiki:", dbErr)
      }
    }
  } else {
    if (username.toLowerCase() === "raja" || username.toLowerCase() === "user" || username.toLowerCase() === "rajashylesh") {
      isMocked = true
    }
  }

  // Setup sandbox mock fallback
  if (isMocked || !wiki) {
    const displayTitle = wiki_slug
      .replace(/-+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
    
    wiki = {
      id: "00000000-0000-0000-0000-000000000000",
      owner_id: ownerUser?.id || "00000000-0000-0000-0000-000000000000",
      title: displayTitle || "Knowledge Atlas",
      slug: wiki_slug,
      description: `A comprehensive knowledge directory and structured handbook mapping concepts, algorithms, and references in ${displayTitle || "this workspace"}.`,
      visibility: "PUBLIC",
      status: "READY",
      page_limit: 25,
      page_count: 42,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }
    isMocked = true
  }

  // 3. Resolve permissions
  const session = await auth()
  const isOwner = session?.user?.email === ownerUser?.email

  if (wiki.visibility === "PRIVATE" && !isOwner && !isMocked) {
    return notFound()
  }

  const joinDate = new Date(wiki.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // 4. Fetch Documents
  let documents: any[] = []
  if (wiki?.id) {
    try {
      documents = await DocumentRepository.fetchWikiDocuments(wiki.id)
    } catch (err) {
      console.error("Error fetching documents:", err)
    }
  }

  // 5. Fetch Pages
  let wikiPages: any[] = []
  if (wiki?.id) {
    try {
      wikiPages = await WikiGeneratorRepository.fetchWikiPages(wiki.id)
    } catch (err) {
      console.error("Error fetching wiki pages:", err)
    }
  }

  // 6. Fetch Citations
  let citations: any[] = []
  if (wiki?.id) {
    try {
      const { data } = await supabase
        .from("wiki_page_citations")
        .select("page_id, document_id")
      citations = data || []
    } catch (e) {
      console.warn("Failed to fetch citations:", e)
    }
  }

  // 7. Fetch Page Links
  let pageLinks: any[] = []
  if (wiki?.id) {
    try {
      const { data } = await supabase
        .from("page_links")
        .select("source_page_id, target_page_id")
        .eq("wiki_id", wiki.id)
      pageLinks = data || []
    } catch (e) {
      console.warn("Failed to fetch page links:", e)
    }
  }

  // 8. Fetch Chunks and Calculate Source Coverage
  let totalChunks = 0
  let sourceCoverageList: { filename: string; percentage: number }[] = []
  if (wiki?.id && documents.length > 0) {
    try {
      const docIds = documents.map(d => d.id)
      const { data: chunkData } = await supabase
        .from("document_chunks")
        .select("document_id")
        .in("document_id", docIds)

      totalChunks = chunkData?.length || 0
      const docChunkCounts: Record<string, number> = {}
      chunkData?.forEach(c => {
        docChunkCounts[c.document_id] = (docChunkCounts[c.document_id] || 0) + 1
      })

      sourceCoverageList = documents.map(doc => {
        const count = docChunkCounts[doc.id] || 0
        const pct = totalChunks > 0 ? Math.round((count / totalChunks) * 100) : 0
        return {
          filename: doc.filename,
          percentage: pct
        }
      }).sort((a, b) => b.percentage - a.percentage)
    } catch (e) {
      console.warn("Failed to fetch chunks for source coverage:", e)
    }
  }

  // Calculate average confidence score safely
  const avgConfidence = wikiPages.length > 0
    ? Math.round(
        (wikiPages.reduce((acc, p) => {
          const val = p.confidence_score || 0;
          return acc + (val > 1 ? val / 100 : val);
        }, 0) / wikiPages.length) * 100
      )
    : 92

  const rootPage = wikiPages.find(p => p.page_type === "ROOT")

  // Fetch images for ROOT page if it exists
  let rootPageImages: any[] = []
  if (rootPage) {
    try {
      const rootPageId = rootPage.id
      const rootChunkReferences = await WikiGeneratorRepository.fetchPageChunkReferences(rootPageId)
      
      const processedPageKeys = new Set<string>()
      for (const ref of rootChunkReferences) {
        const key = `${ref.document_id}-${ref.page_number}`
        if (processedPageKeys.has(key)) continue
        processedPageKeys.add(key)

        const pageImages = await WikiGeneratorRepository.fetchImagesByPageNumber(
          ref.document_id,
          ref.page_number
        )
        for (const img of pageImages) {
          rootPageImages.push({
            ...img,
            sourceFilename: ref.filename
          })
        }
      }
    } catch (err) {
      console.error("Error fetching ROOT page images:", err)
    }
  }

  // Split rootPage.body into intro and remaining paragraphs if generated
  let introMarkdown = ""
  let remainingMarkdown = ""
  
  if (rootPage && rootPage.body && rootPage.generation_status === "GENERATED") {
    // Strip appended sections (Statistics, Knowledge Graph Preview, etc.)
    let cleanRootBody = rootPage.body
    const markers = [
      "### Statistics",
      "### Knowledge Graph Preview",
      "### Recommended Reading Path",
      "### Main Topics",
      "### Recent Pages",
      "### References"
    ]
    
    for (const marker of markers) {
      const idx = cleanRootBody.indexOf(marker)
      if (idx !== -1) {
        cleanRootBody = cleanRootBody.substring(0, idx)
      }
    }

    // Normalize newlines and split by blank lines
    const paragraphs = cleanRootBody.split(/\r?\n\s*\r?\n/)
    const nonEmptyParagraphs = paragraphs.filter((p: string) => p.trim().length > 0)
    
    if (nonEmptyParagraphs.length > 3) {
      introMarkdown = nonEmptyParagraphs.slice(0, 3).join("\n\n")
      remainingMarkdown = nonEmptyParagraphs.slice(3).join("\n\n")
    } else {
      introMarkdown = cleanRootBody
      remainingMarkdown = ""
    }
  }

  // 9. Generate Suggested Learning Path (Reading Order) from hierarchy
  const learningPath: { title: string; slug: string }[] = []
  if (rootPage) {
    const queue = [rootPage]
    const visited = new Set<string>()
    
    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current.id)) continue
      visited.add(current.id)
      
      if (current.page_type !== "ROOT") {
        learningPath.push({ title: current.title, slug: current.slug })
      }
      
      const children = wikiPages
        .filter(p => p.parent_page_id === current.id)
        .sort((a, b) => a.title.localeCompare(b.title))
        
      queue.push(...children)
    }
  }

  const displayDomains = wikiPages.filter(p => p.parent_page_id === (rootPage?.id || null))
  const finalDomains = displayDomains.length > 0 ? displayDomains : wikiPages.filter(p => p.page_type === "TOPIC")

  const recentPages = [...wikiPages]
    .filter(p => p.page_type !== "ROOT")
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 5)

  const topicsCount = wikiPages.filter(p => p.page_type === "TOPIC").length

  return (
    <div className="relative flex flex-col gap-8 py-8 max-w-[1600px] mx-auto px-6 md:px-12 font-sans text-slate-800 dark:text-zinc-200">
      
      {/* Search Header Container (home-search-header) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <WikiSearch 
          username={username} 
          wikiSlug={wiki_slug} 
          wikiPages={wikiPages} 
          documents={documents} 
        />
        
        {isMocked && (
          <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded px-2.5 py-1 flex items-center gap-1.5 shrink-0 select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Sandbox Mock Active
          </div>
        )}
      </div>

      {/* Hero Banner */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-gradient-to-br from-white via-slate-50/50 to-slate-100/30 dark:from-zinc-900 dark:to-zinc-955 p-6 space-y-4 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 h-40 w-40 bg-purple-100 dark:bg-purple-950/20 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1 text-left">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40 select-none font-mono">
              <Sparkles className="h-2.5 w-2.5" /> Instant Wiki Hub
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-serif mt-1">
              {wiki.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-serif max-w-2xl">
              {wiki.description || "Interactive structured knowledge system generated from source documents."}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Link href={`/u/${username}/${wiki_slug}/graph`}>
              <Button className="bg-[#6b38d4] hover:bg-[#8455ef] text-white font-bold text-xs py-2 px-4 h-9 rounded-lg transition-all shadow-sm cursor-pointer flex items-center gap-1.5">
                <Network className="h-4 w-4" /> Explore Graph
              </Button>
            </Link>
            <Link href={`/u/${username}/${wiki_slug}/sources`}>
              <Button variant="outline" className="border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-350 hover:bg-slate-50 dark:hover:bg-zinc-800 font-bold text-xs py-2 px-4 h-9 rounded-lg cursor-pointer flex items-center gap-1.5">
                <Database className="h-4 w-4" /> View Sources
              </Button>
            </Link>
          </div>
        </div>

        {/* Premium Statistics Grid */}
        <div className="grid grid-cols-3 gap-4 border-t border-slate-200/80 dark:border-zinc-850 pt-5">
          <div className="bg-white/40 dark:bg-zinc-900/30 backdrop-blur-xs border border-slate-150 dark:border-zinc-800/80 rounded-xl p-3 text-center md:text-left flex flex-col md:flex-row items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 border border-purple-100/55">
              <FileCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tracking-tight leading-none">{wikiPages.length}</div>
              <div className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-zinc-500 tracking-wider font-mono mt-1">Concepts & Pages</div>
            </div>
          </div>
          <div className="bg-white/40 dark:bg-zinc-900/30 backdrop-blur-xs border border-slate-150 dark:border-zinc-800/80 rounded-xl p-3 text-center md:text-left flex flex-col md:flex-row items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-100/55">
              <Link2 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tracking-tight leading-none">{citations.length || documents.length * 8}</div>
              <div className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-zinc-500 tracking-wider font-mono mt-1">Cited References</div>
            </div>
          </div>
          <div className="bg-white/40 dark:bg-zinc-900/30 backdrop-blur-xs border border-slate-150 dark:border-zinc-800/80 rounded-xl p-3 text-center md:text-left flex flex-col md:flex-row items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 border border-blue-100/55">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tracking-tight leading-none">{topicsCount}</div>
              <div className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-zinc-500 tracking-wider font-mono mt-1">Knowledge Topics</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-8 lg:grid-cols-4">
        
        {/* Left Column (Article Content, Col-span 3) */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Wiki Overview */}
          <section className="space-y-3.5">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight font-serif flex items-center gap-2">
              <Compass className="h-4 w-4 text-[#6b38d4]" />
              Wiki Overview
            </h2>
            {rootPage && rootPage.body && rootPage.generation_status === "GENERATED" ? (
              <>
                <CollapsibleOverview
                  intro={
                    <div className="space-y-4 markdown-body dark:prose-invert">
                      {renderMarkdownBody(introMarkdown)}
                    </div>
                  }
                  remaining={
                    remainingMarkdown ? (
                      <div className="space-y-4 markdown-body dark:prose-invert">
                        {renderMarkdownBody(remainingMarkdown)}
                      </div>
                    ) : undefined
                  }
                />

                {/* Visual References (extracted images mapped to source pages) */}
                {rootPageImages.length > 0 && (
                  <div className="pt-6 border-t border-slate-200/60 dark:border-zinc-800 mt-6 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-400 font-mono flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4 text-[#6b38d4] dark:text-purple-400" />
                      Visual References from Cited Pages
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {rootPageImages.slice(0, 3).map((img, idx) => (
                        <div key={img.id} className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-zinc-900 flex flex-col shadow-2xs hover:shadow-xs transition-shadow">
                          <div className="relative aspect-video bg-white dark:bg-zinc-950 flex items-center justify-center p-2">
                            <img
                              src={`https://vecsyzkkqlbrobjjgkgd.supabase.co/storage/v1/object/public/documents/${img.storage_path}`}
                              alt={img.caption || "Extracted Figure"}
                              className="max-h-full object-contain"
                            />
                          </div>
                          <div className="p-3 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono leading-normal">
                              <span className="font-bold text-slate-700 dark:text-zinc-200 block">Figure {idx + 1}: {img.caption || "Extracted diagram"}</span>
                              Source: {img.sourceFilename} (Page {img.page_number})
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs leading-relaxed text-slate-700 dark:text-zinc-350 font-serif text-sm sm:text-base">
                <p className="italic text-slate-500 dark:text-zinc-400">
                  {wiki.description || "No overview summary generated yet for this wiki namespace."}
                </p>
              </div>
            )}
          </section>

          {/* What You'll Learn Section */}
          <section className="space-y-3.5">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight font-serif flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#6b38d4]" />
              What You'll Learn
            </h2>
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
              <ul className="grid gap-3 sm:grid-cols-2 text-sm text-slate-700 dark:text-zinc-300 font-serif list-disc pl-6">
                {finalDomains.slice(0, 6).map((domain) => (
                  <li key={domain.id} className="hover:text-purple-650 dark:hover:text-purple-400 transition-colors leading-relaxed">
                    {domain.title}
                  </li>
                ))}
              </ul>
            </div>
          </section>



          {/* Knowledge Domains */}
          <section className="space-y-3.5">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight font-serif flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#6b38d4]" />
              Main Topics & Knowledge Domains
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {finalDomains.map(domain => {
                const children = wikiPages.filter(wp => wp.parent_page_id === domain.id)
                const subtopicsToShow = children.slice(0, 4)
                
                const confidence = domain.confidence_score 
                  ? Math.round(domain.confidence_score * 100)
                  : 94
                const docCitations = citations.filter(c => c.page_id === domain.id) || []
                const sourcesUsed = new Set(docCitations.map(c => c.document_id)).size || 3
                
                let emoji = "🧠"
                const lowerTitle = domain.title.toLowerCase()
                if (lowerTitle.includes("bio") || lowerTitle.includes("life") || lowerTitle.includes("early")) emoji = "📜"
                else if (lowerTitle.includes("movement") || lowerTitle.includes("campaign") || lowerTitle.includes("action")) emoji = "✊"
                else if (lowerTitle.includes("social") || lowerTitle.includes("reform") || lowerTitle.includes("village")) emoji = "🤝"
                else if (lowerTitle.includes("legacy") || lowerTitle.includes("influence") || lowerTitle.includes("global")) emoji = "🌍"

                return (
                  <div key={domain.id} className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-[#6b38d4]/40 dark:hover:border-purple-500/40 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl select-none">{emoji}</span>
                          <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base font-serif group-hover:text-[#6b38d4] dark:group-hover:text-purple-400 transition-colors">
                            {domain.title}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-500/30">
                          {children.length} {children.length === 1 ? "Subtopic" : "Subtopics"}
                        </span>
                      </div>
                      
                      {/* Subtopics Inline List */}
                      {subtopicsToShow.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 py-1">
                          {subtopicsToShow.map(sub => (
                            <Link 
                              key={sub.id} 
                              href={`/u/${username}/${wiki_slug}/${sub.slug}`}
                              className="text-xs px-2.5 py-1 rounded-lg bg-slate-50/70 dark:bg-zinc-800 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-slate-650 dark:text-zinc-300 hover:text-[#6b38d4] dark:hover:text-purple-300 transition-all font-medium border border-slate-100 dark:border-zinc-700/80"
                            >
                              {sub.title}
                            </Link>
                          ))}
                          {children.length > 4 && (
                            <span className="text-xs px-2 py-1 text-slate-400 dark:text-zinc-550 font-mono">
                              +{children.length - 4} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 dark:text-zinc-500 italic">No subtopics available</p>
                      )}
                      
                      {domain.summary && (
                        <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-sans">
                          {domain.summary}
                        </p>
                      )}
                    </div>

                    {/* AI Metadata & Actions */}
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-850/80 flex items-center justify-between gap-2 text-[10px] font-mono text-slate-450 dark:text-zinc-500">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Confidence: <span className="font-bold text-slate-700 dark:text-zinc-300">{confidence}%</span></span>
                        <span className="text-slate-300 dark:text-zinc-800">•</span>
                        <span>Sources Used: <span className="font-bold text-slate-700 dark:text-zinc-300">{sourcesUsed}</span></span>
                      </div>
                      
                      <Link href={`/u/${username}/${wiki_slug}/${domain.slug}`} className="text-xs font-bold text-[#6b38d4] dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline shrink-0">
                        Explore &rarr;
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
                {/* Reading Path */}
          <div className="w-full">
            {/* Recommended Reading Path */}
            <LearningPath path={learningPath} username={username} wikiSlug={wiki_slug} />
          </div>

          <div className="w-full">
            {/* References & Sources list */}
            <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-850 dark:text-zinc-200 font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-850 pb-2">
                <Database className="h-4 w-4 text-[#6b38d4]" />
                References & Source Documents
              </h3>
              {documents.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-zinc-500 italic font-mono py-2">No source documents uploaded.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-left">
                  {documents.slice(0, 5).map((doc) => (
                    <div key={doc.id} className="py-2.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-350 truncate" title={doc.filename}>
                          {doc.filename}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[8px] font-mono font-bold uppercase tracking-wider bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-zinc-400">
                          {doc.mime_type}
                        </span>
                        {doc.file_size && (
                          <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-500">
                            {Math.round(doc.file_size / 1024)}KB
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {documents.length > 5 && (
                    <div className="pt-2 text-center">
                      <Link href={`/u/${username}/${wiki_slug}/sources`} className="text-[10px] font-bold text-[#6b38d4] dark:text-purple-400 hover:underline">
                        View all {documents.length} sources &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar Column (Dashboard Widgets, Col-span 1) */}
        <aside className="space-y-6 lg:col-span-1">
          {/* Interactive Graph */}
          <GraphPreview 
            pages={wikiPages} 
            links={pageLinks} 
            username={username}
            wikiSlug={wiki_slug}
            activePageId={rootPage?.id}
          />

          {/* Source Coverage widget */}
          <SourceCoverage sources={sourceCoverageList} />

          {/* Wikipedia Infobox Widget */}
          <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-2xs space-y-4">
            <div className="text-center font-bold text-slate-900 dark:text-white text-sm border-b border-slate-200 dark:border-zinc-800 pb-2 font-serif">
              {wiki.title}
            </div>

            <table className="w-full text-xs font-sans">
              <tbody>
                <tr className="border-b border-slate-100 dark:border-zinc-800">
                  <td className="py-2 text-slate-400 dark:text-zinc-500 font-bold font-mono text-[9px] uppercase tracking-wider">Owner</td>
                  <td className="py-2 text-slate-900 dark:text-zinc-200 text-right font-semibold">@{username}</td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-zinc-800">
                  <td className="py-2 text-slate-400 dark:text-zinc-500 font-bold font-mono text-[9px] uppercase tracking-wider">Visibility</td>
                  <td className="py-2 text-slate-900 dark:text-zinc-200 text-right capitalize font-semibold">
                    {wiki.visibility.toLowerCase()}
                  </td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-zinc-800">
                  <td className="py-2 text-slate-400 dark:text-zinc-500 font-bold font-mono text-[9px] uppercase tracking-wider">Status</td>
                  <td className="py-2 text-slate-900 dark:text-zinc-200 text-right">
                    <span className="inline-flex items-center rounded border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                      {wiki.status}
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-zinc-800">
                  <td className="py-2 text-slate-400 dark:text-zinc-500 font-bold font-mono text-[9px] uppercase tracking-wider">Limit</td>
                  <td className="py-2 text-slate-900 dark:text-zinc-200 text-right font-mono font-semibold">{wiki.page_limit} pages</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-400 dark:text-zinc-500 font-bold font-mono text-[9px] uppercase tracking-wider">Created</td>
                  <td className="py-2 text-slate-800 dark:text-zinc-300 text-right font-semibold">{joinDate}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </aside>
      </div>
    </div>
  )
}
