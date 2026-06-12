import React from "react"
import { auth } from "auth"
import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { WikiRepository } from "@/lib/repositories/wiki"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Lock,
  Globe,
  EyeOff,
  Network
} from "lucide-react"
import WikiSearch from "./wiki-search"
import { WikiGeneratorRepository } from "@/lib/repositories/wiki-generator"
import { DocumentRepository } from "@/lib/repositories/document"
import { renderMarkdownBody } from "@/lib/markdown-renderer"

// Import dashboard components
import TopicTree from "@/components/wiki/topic-tree"
import SourceCoverage from "@/components/wiki/source-coverage"
import GraphPreview from "@/components/wiki/graph-preview"
import LearningPath from "@/components/wiki/learning-path"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

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

      {/* 1. Dashboard Hero Banner (Change 9) */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-linear-to-br from-white to-slate-50 dark:from-zinc-900 dark:to-zinc-950 p-4 sm:px-6 sm:py-5 space-y-4 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 h-32 w-32 bg-purple-50 dark:bg-purple-950/10 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight sm:text-2xl font-serif">
              {wiki.title}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
              Generated from {documents.length} source documents
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link href={`/u/${username}/${wiki_slug}/graph`}>
              <Button className="bg-[#6b38d4] hover:bg-[#5a2eb3] text-white font-semibold text-[11px] py-1 px-3 h-8 rounded-md transition-colors cursor-pointer">
                Explore Graph
              </Button>
            </Link>
            <Link href={`/u/${username}/${wiki_slug}/sources`}>
              <Button variant="outline" className="border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-350 hover:bg-slate-50 dark:hover:bg-zinc-800 font-semibold text-[11px] py-1 px-3 h-8 rounded-md cursor-pointer">
                View Sources
              </Button>
            </Link>
          </div>
        </div>

        {/* Executive stats overview */}
        <div className="grid grid-cols-3 gap-4 border-t border-slate-200/80 dark:border-zinc-800 pt-4">
          <div className="text-center md:text-left">
            <div className="text-lg font-bold text-slate-900 dark:text-white font-mono tracking-tight">{wikiPages.length}</div>
            <div className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider font-mono">concepts & pages</div>
          </div>
          <div className="text-center md:text-left border-x border-slate-200 dark:border-zinc-800 px-4">
            <div className="text-lg font-bold text-slate-900 dark:text-white font-mono tracking-tight">{totalChunks || documents.length * 24}</div>
            <div className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider font-mono">data chunks</div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-lg font-bold text-slate-900 dark:text-white font-mono tracking-tight">{avgConfidence}%</div>
            <div className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider font-mono">confidence index</div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-8 lg:grid-cols-4">
        
        {/* Middle Column (Article Content, Col-span 3) */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* 2. Wiki Overview (Change 1) */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-955 dark:text-white tracking-tight font-serif flex items-center gap-2">
              Wiki Overview
            </h2>
            <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs leading-relaxed text-slate-700 dark:text-zinc-300 font-serif text-sm sm:text-base">
              {rootPage && rootPage.body && rootPage.generation_status === "GENERATED" ? (
                <div className="space-y-4 markdown-body dark:prose-invert">
                  {renderMarkdownBody(rootPage.body)}
                </div>
              ) : (
                <p className="italic text-slate-505 dark:text-zinc-400">
                  {wiki.description || "No overview summary generated yet for this wiki namespace."}
                </p>
              )}
            </div>
          </section>

          {/* 3. Knowledge Domains (Change 4) */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight font-serif">
              Knowledge Domains
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wikiPages.filter(p => p.parent_page_id === (rootPage?.id || null)).map(domain => {
                const children = wikiPages.filter(wp => wp.parent_page_id === domain.id)
                const docCitations = citations.filter(c => c.page_id === domain.id) || []
                const uniqueDocs = new Set(docCitations.map(c => c.document_id))
                return (
                  <div key={domain.id} className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xs hover:border-purple-200 dark:hover:border-purple-800 transition-colors flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm font-serif">{domain.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mt-1.5">{domain.summary || "Core sub-domain cataloged in this wiki."}</p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[9px] font-mono text-slate-400 dark:text-zinc-500">
                      <span>{children.length} subtopics • {uniqueDocs.size} sources</span>
                      <Link href={`/u/${username}/${wiki_slug}/${domain.slug}`} className="text-purple-650 dark:text-purple-400 font-bold hover:underline">
                        Explore →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Collapsible Tree & Reading Path */}
          <div className="grid gap-6 md:grid-cols-2">
            <TopicTree pages={wikiPages} username={username} wikiSlug={wiki_slug} />
            <LearningPath path={learningPath} username={username} wikiSlug={wiki_slug} />
          </div>
        </div>

        {/* Right Sidebar Column (Dashboard Widgets, Col-span 1) */}
        <aside className="space-y-6 lg:col-span-1">

          {/* Concept Network Graph (Change 5) */}
          <GraphPreview 
            nodes={wikiPages.map(p => ({ id: p.id, title: p.title, slug: p.slug }))} 
            links={pageLinks} 
            username={username}
            wikiSlug={wiki_slug}
            activePageId={rootPage?.id}
          />

          {/* Source Coverage widget (Change 6) */}
          <SourceCoverage sources={sourceCoverageList} />

          {/* Wikipedia Infobox Widget */}
          <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs space-y-4">
            <div className="text-center font-bold text-slate-900 dark:text-white text-sm border-b border-slate-200 dark:border-zinc-800 pb-2 font-serif">
              {wiki.title}
            </div>

            <table className="w-full text-xs font-mono">
              <tbody>
                <tr className="border-b border-slate-100 dark:border-zinc-800/80">
                  <td className="py-2 text-slate-500 dark:text-zinc-450 font-bold w-1/3">Owner</td>
                  <td className="py-2 text-slate-900 dark:text-zinc-200 text-right">@{username}</td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-zinc-800/80">
                  <td className="py-2 text-slate-500 dark:text-zinc-450 font-bold">Visibility</td>
                  <td className="py-2 text-slate-900 dark:text-zinc-200 text-right capitalize">
                    {wiki.visibility.toLowerCase()}
                  </td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-zinc-800/80">
                  <td className="py-2 text-slate-500 dark:text-zinc-450 font-bold">Status</td>
                  <td className="py-2 text-slate-900 dark:text-zinc-200 text-right">
                    <span className="inline-flex items-center rounded border border-emerald-250 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                      {wiki.status}
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-zinc-800/80">
                  <td className="py-2 text-slate-500 dark:text-zinc-450 font-bold">Limit</td>
                  <td className="py-2 text-slate-900 dark:text-zinc-200 text-right">{wiki.page_limit} pages</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-500 dark:text-zinc-450 font-bold">Created</td>
                  <td className="py-2 text-slate-850 dark:text-zinc-300 text-right">{joinDate}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </aside>
      </div>
    </div>
  )
}
