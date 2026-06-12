"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  ArrowRight, 
  BookOpen, 
  Database, 
  ExternalLink, 
  X, 
  HelpCircle, 
  Loader2, 
  Sparkles, 
  Check, 
  FileText, 
  Image as ImageIcon,
  Network
} from "lucide-react"
import { WikiPage, WikiPageCitation, DocumentImage } from "@/lib/repositories/wiki-generator"
import { renderMarkdownBody } from "@/lib/markdown-renderer"
import GraphPreview from "@/components/wiki/graph-preview"

interface ArticleViewProps {
  username: string
  wikiSlug: string
  wikiId: string
  initialPage: WikiPage
  allPages: WikiPage[]
  initialCitations?: any[]
  initialImages?: any[]
  initialChunkReferences?: any[]
  initialBacklinks?: any[]
  pageLinks?: { source_page_id: string; target_page_id: string }[]
}


interface EnrichedCitation extends WikiPageCitation {
  sourceName?: string
}

interface ChunkReference {
  chunk_id: string
  document_id: string
  filename: string
  page_number: number
  content: string
}

interface Backlink {
  source_page_id: string
  link_type: string
}

interface HeadingItem {
  id: string
  text: string
  level: number
}

const parseHeadings = (markdown: string): HeadingItem[] => {
  const headings: HeadingItem[] = []
  if (!markdown) return headings
  const lines = markdown.split("\n")
  
  lines.forEach((line) => {
    const trimmed = line.trim()
    if (trimmed.startsWith("### ")) {
      const text = trimmed.substring(4).trim()
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      headings.push({ id, text, level: 3 })
    } else if (trimmed.startsWith("#### ")) {
      const text = trimmed.substring(5).trim()
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      headings.push({ id, text, level: 4 })
    }
  })
  
  return headings
}

export default function ArticleView({
  username,
  wikiSlug,
  wikiId,
  initialPage,
  allPages = [],
  initialCitations = [],
  initialImages = [],
  initialChunkReferences = [],
  initialBacklinks = [],
  pageLinks = []
}: ArticleViewProps) {
  const router = useRouter()
  const [page, setPage] = useState<WikiPage>(initialPage)
  const [generationStatus, setGenerationStatus] = useState<string>(initialPage.generation_status)
  const [selectedCitation, setSelectedCitation] = useState<EnrichedCitation | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [citations, setCitations] = useState<any[]>(initialCitations)
  const [images, setImages] = useState<any[]>(initialImages)
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  const [chunkReferences, setChunkReferences] = useState<ChunkReference[]>(initialChunkReferences)
  const [backlinks, setBacklinks] = useState<Backlink[]>(initialBacklinks)
  const [selectedSourceDocId, setSelectedSourceDocId] = useState<string | null>(null)
  const [isSourcePanelOpen, setIsSourcePanelOpen] = useState(false)

  // Lazy generation steps (animated visual checklist)
  const [genStep, setGenStep] = useState(0)

  const [globalCitations, setGlobalCitations] = useState<any[]>([])
  const [loadingGlobalCitations, setLoadingGlobalCitations] = useState(false)

  const handleInspectDocument = async (docId: string) => {
    setSelectedSourceDocId(docId)
    setIsSourcePanelOpen(true)
    setLoadingGlobalCitations(true)
    setGlobalCitations([])
    try {
      const res = await fetch(`/api/wiki/${wikiId}/documents?documentId=${docId}`)
      if (res.ok) {
        const data = await res.json()
        setGlobalCitations(data.citations || [])
      } else {
        const fallback = chunkReferences
          .filter(ref => ref.document_id === docId)
          .map(ref => ({
            chunk_id: ref.chunk_id,
            page_id: page.id,
            page_title: page.title,
            page_slug: page.slug,
            page_number: ref.page_number,
            content: ref.content
          }))
        setGlobalCitations(fallback)
      }
    } catch (e) {
      console.error("Error fetching global citations:", e)
      const fallback = chunkReferences
        .filter(ref => ref.document_id === docId)
        .map(ref => ({
          chunk_id: ref.chunk_id,
          page_id: page.id,
          page_title: page.title,
          page_slug: page.slug,
          page_number: ref.page_number,
          content: ref.content
        }))
      setGlobalCitations(fallback)
    } finally {
      setLoadingGlobalCitations(false)
    }
  }

  // Parse headings and initialize scroll spy state
  const headings = parseHeadings(page.body || "")
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target.id)

        if (visible.length > 0) {
          setActiveId(visible[0])
        }
      },
      {
        rootMargin: "0px 0px -60% 0px",
        threshold: 0.1,
      }
    )

    headings.forEach((h) => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [page.body, headings.length])

  const handleTocClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
      setActiveId(id)
    }
  }

  // 1. Trigger lazy generation or load assets when page ID changes
  useEffect(() => {
    setPage(initialPage)
    setGenerationStatus(initialPage.generation_status)
    setGenError(null)
    setCitations(initialCitations)
    setImages(initialImages)
    setChunkReferences(initialChunkReferences)
    setBacklinks(initialBacklinks)

    if (initialPage.generation_status === "PENDING") {
      triggerLazyGeneration()
    } else if (initialCitations.length === 0 && initialBacklinks.length === 0) {
      // Fetch fallback only if server didn't supply them
      fetchAssets()
    }
  }, [initialPage.id])

  const triggerLazyGeneration = async () => {
    setGenerationStatus("GENERATING")
    setGenStep(1)
    
    // Animate fake progress steps
    const stepInterval = setInterval(() => {
      setGenStep(prev => (prev < 3 ? prev + 1 : prev))
    }, 600)

    try {
      const response = await fetch(`/api/wiki/${wikiId}/page/${initialPage.id}/generate`, {
        method: "POST"
      })

      clearInterval(stepInterval)
      const res = await response.json()
      
      if (!response.ok) {
        throw new Error(res.error || "Lazy generation failed.")
      }

      setPage(res.page)
      setGenerationStatus("GENERATED")
      fetchAssets()
    } catch (err: any) {
      clearInterval(stepInterval)
      setGenerationStatus("FAILED")
      setGenError(err.message || "An unexpected error occurred during page synthesis.")
    }
  }

  const fetchAssets = async () => {
    setLoadingAssets(true)
    try {
      const response = await fetch(`/api/wiki/${wikiId}/page/${initialPage.id}/assets`)
      if (response.ok) {
        const res = await response.json()
        setCitations(res.citations || [])
        setImages(res.images || [])
        setChunkReferences(res.chunkReferences || [])
        setBacklinks(res.backlinks || [])
      }
    } catch (err) {
      console.error("Error loading page assets:", err)
    } finally {
      setLoadingAssets(false)
    }
  }

  const handleCitationClick = (id: string) => {
    const citation = citations.find(c => c.id === id)
    if (citation) {
      setSelectedCitation(citation)
      setIsDrawerOpen(true)
    }
  }

  // Calculate Source Coverage Distribution
  const calculateSourceCoverage = () => {
    const listToUse = chunkReferences.length > 0 ? chunkReferences : citations
    if (listToUse.length === 0) return []
    const counts: Record<string, { count: number; filename: string }> = {}
    
    listToUse.forEach(item => {
      const docId = item.document_id
      const filename = (item as any).filename || (item as any).sourceName || "Source Document"
      if (!counts[docId]) {
        counts[docId] = { count: 0, filename }
      }
      counts[docId].count += 1
    })

    const total = listToUse.length
    return Object.keys(counts).map(docId => ({
      docId,
      filename: counts[docId].filename,
      percentage: Math.round((counts[docId].count / total) * 100)
    })).sort((a, b) => b.percentage - a.percentage)
  }

  const sourceCoverage = calculateSourceCoverage()

  // Find subtopics (pages listing this page as parent_page_id)
  const subtopics = allPages.filter(p => p.parent_page_id === page.id)

  // Find related pages (same level hierarchical pages)
  const relatedPages = allPages
    .filter(p => p.id !== page.id && p.parent_page_id === page.parent_page_id && p.page_type !== "ROOT")
    .slice(0, 3)

  // Resolve backlinks to full WikiPage objects
  const resolvedBacklinks = backlinks
    .map(bl => allPages.find(p => p.id === bl.source_page_id))
    .filter((p): p is WikiPage => !!p)

  const selectedSourceDocChunks = chunkReferences.filter(
    ref => ref.document_id === selectedSourceDocId
  )
  const selectedSourceDocName = selectedSourceDocChunks[0]?.filename || "Source Document"



  // Render Lazy Loading Wizard
  if (generationStatus === "GENERATING") {
    return (
      <div className="flex-1 py-16 flex flex-col items-center justify-center max-w-2xl mx-auto px-6 text-center space-y-6 font-sans">
        <div className="relative">
          <Loader2 className="h-10 w-10 text-[#6b38d4] animate-spin" />
          <Sparkles className="h-5 w-5 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Synthesizing "{page.title}"</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md font-mono leading-relaxed">
            Retrieving pgvector embedding chunks, evaluating source relevance, and auto-linking wiki nodes dynamically.
          </p>
        </div>

        {/* Live Step Checklist */}
        <div className="w-full max-w-xs border border-slate-200 dark:border-zinc-800 rounded-lg p-4 bg-slate-50 dark:bg-zinc-900 text-left text-xs font-mono space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200">
            {genStep >= 1 ? (
              <Check className="h-4 w-4 text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30 rounded-full p-0.5 shrink-0" />
            ) : (
              <Loader2 className="h-4 w-4 text-[#6b38d4] dark:text-purple-400 animate-spin shrink-0" />
            )}
            <span className={genStep >= 1 ? "text-slate-800 dark:text-zinc-200 font-bold" : "text-slate-400 dark:text-zinc-500"}>1. Similarity Vector Search</span>
          </div>

          <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200">
            {genStep >= 2 ? (
              <Check className="h-4 w-4 text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30 rounded-full p-0.5 shrink-0" />
            ) : genStep === 1 ? (
              <Loader2 className="h-4 w-4 text-[#6b38d4] dark:text-purple-400 animate-spin shrink-0" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-zinc-650 ml-1.5 mr-1" />
            )}
            <span className={genStep >= 2 ? "text-slate-800 dark:text-zinc-200 font-bold" : "text-slate-400 dark:text-zinc-500"}>2. Extracting Chunks Content</span>
          </div>

          <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200">
            {genStep >= 3 ? (
              <Check className="h-4 w-4 text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30 rounded-full p-0.5 shrink-0" />
            ) : genStep === 2 ? (
              <Loader2 className="h-4 w-4 text-[#6b38d4] dark:text-purple-400 animate-spin shrink-0" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-zinc-650 ml-1.5 mr-1" />
            )}
            <span className={genStep >= 3 ? "text-slate-800 dark:text-zinc-200 font-bold" : "text-slate-400 dark:text-zinc-500"}>3. Synthesizing Wiki Page</span>
          </div>
        </div>
      </div>
    )
  }

  // Render Failure Page
  if (generationStatus === "FAILED") {
    return (
      <div className="flex-1 py-16 flex flex-col items-center justify-center max-w-md mx-auto px-6 text-center space-y-4 font-sans text-slate-800 dark:text-zinc-200">
        <div className="h-12 w-12 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-655 dark:text-rose-400 rounded-full flex items-center justify-center p-2.5">
          <X className="h-6 w-6" />
        </div>
        <h2 className="text-md font-bold text-slate-900 dark:text-white">Synthesis Failed</h2>
        <p className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-lg p-3 leading-relaxed font-mono">
          {genError || "The generation worker encountered a database schema or API key failure."}
        </p>
        <button
          onClick={triggerLazyGeneration}
          className="px-4 py-2 bg-slate-900 dark:bg-zinc-800 text-white rounded-md text-xs font-semibold hover:bg-slate-850 dark:hover:bg-zinc-700 transition-all cursor-pointer"
        >
          Retry Ingestion
        </button>
      </div>
    )
  }

  const lines = (page.body || "").split("\n")

  return (
    <div className="relative min-h-screen font-sans bg-transparent flex flex-col text-slate-800 dark:text-zinc-200">
      <div className="flex-1 py-8 max-w-[1500px] mx-auto px-6 md:px-10 w-full flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Sticky Table of Contents (TOC) */}
        {headings.length > 0 && (
          <nav className="hidden xl:block w-52 shrink-0 sticky top-24 self-start space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 border-r border-slate-100 dark:border-zinc-800 mr-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 font-mono flex items-center gap-1.5 select-none pb-2 border-b border-slate-100 dark:border-zinc-800">
              <BookOpen className="h-3.5 w-3.5 text-[#6b38d4] dark:text-purple-400" />
              On This Page
            </div>
            <ul className="space-y-1.5 text-xs font-medium pt-1">
              {headings.map((h) => (
                <li key={h.id} style={{ paddingLeft: `${Math.max(0, (h.level - 3) * 8)}px` }}>
                  <a
                    href={`#${h.id}`}
                    onClick={(e) => handleTocClick(e, h.id)}
                    className={`block py-1.5 hover:text-[#6b38d4] dark:hover:text-purple-300 transition-all leading-relaxed truncate ${
                      activeId === h.id
                        ? "text-[#6b38d4] dark:text-purple-300 font-bold border-l-2 border-[#6b38d4] dark:border-purple-400 pl-2.5 -ml-3"
                        : "text-slate-500 dark:text-zinc-400 hover:pl-1"
                    }`}
                    title={h.text}
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Center Column: Main Content Area */}
        <div className="flex-1 min-w-0 max-w-3xl">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-zinc-400 mb-6">
            <Link href={`/u/${username}/${wikiSlug}`} className="hover:text-[#6b38d4] dark:hover:text-purple-355 transition-colors">
              {wikiSlug}
            </Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-zinc-250">Pages</span>
            <span>/</span>
            <span className="text-slate-450 dark:text-zinc-400 truncate max-w-[150px]">{page.title}</span>
          </div>

          {/* Article Container (article-container) */}
          <article className="space-y-6 max-w-3xl">
          
          {/* Article Title */}
          <div className="border-b border-slate-200 dark:border-zinc-800 pb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight sm:text-4xl" id="article-title">
                {page.title}
              </h1>
              <p className="text-xs text-slate-455 dark:text-zinc-400 font-mono">
                Verified Concept Article • Factual Traceability Enabled
              </p>
            </div>
            
            <div className="flex gap-2 font-mono text-[9px] font-bold">
              <span className={`px-2 py-0.5 rounded border ${
                page.page_type === "ROOT" 
                  ? "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/50" 
                  : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50"
              }`}>
                {page.page_type}
              </span>
              <span className="px-2 py-0.5 rounded border bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50">
                {Math.round(page.confidence_score * 100)}% Confidence
              </span>
            </div>
          </div>

          {/* Summary Box */}
          {page.summary && (
            <div className="border-l-4 border-[#6b38d4] bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-r-lg italic" id="article-summary-card">
              <p className="text-sm font-medium text-slate-700 dark:text-zinc-300 font-sans">
                <span className="font-bold font-mono text-slate-450 dark:text-zinc-450 uppercase text-[10px] block not-italic mb-1 tracking-wider">
                  Summary Overview
                </span>
                {page.summary}
              </p>
            </div>
          )}

          {/* Render Body */}
          <div className="space-y-4 font-serif" id="article-markdown-body">
            {renderMarkdownBody(page.body || "", {
              citations,
              onCitationClick: handleCitationClick
            })}
          </div>

          {/* Visual References (extracted images mapped to source pages) */}
          {images.length > 0 && (
            <div className="pt-6 border-t border-slate-200/60 dark:border-zinc-800 mt-8 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-400 font-mono flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-[#6b38d4] dark:text-purple-400" />
                Visual References from Cited Pages
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                {images.slice(0, 3).map((img, idx) => (
                  <div key={img.id} className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-zinc-900 flex flex-col shadow-2xs hover:shadow-xs transition-shadow animate-fade-in">
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

          {/* Subtopics Tree */}
          {subtopics.length > 0 && (
            <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 mt-8 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-400 font-mono">
                Subtopics & Sections
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {subtopics.map((sub) => (
                  <Link
                    key={sub.slug}
                    href={`/u/${username}/${wikiSlug}/${sub.slug}`}
                    className="p-3 border border-slate-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 hover:border-[#6b38d4] dark:hover:border-purple-400 hover:shadow-2xs transition-all flex justify-between items-center group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-[#6b38d4] dark:group-hover:text-purple-400 transition-colors">{sub.title}</p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-450 font-mono mt-0.5 truncate max-w-[200px]">{sub.summary}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-350 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related Concepts */}
          {relatedPages.length > 0 && (
            <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 mt-6 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-400 font-mono">
                Related Pages
              </h4>
              <div className="flex flex-wrap gap-2.5">
                {relatedPages.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/u/${username}/${wikiSlug}/${related.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-650 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                  >
                    {related.title} <ArrowRight className="h-3 w-3 text-slate-400 dark:text-zinc-550" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Incoming Backlinks Section */}
          {resolvedBacklinks.length > 0 && (
            <div className="pt-6 border-t border-slate-200 dark:border-zinc-800 mt-8 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-zinc-450 font-mono flex items-center gap-1.5">
                <Network className="h-4 w-4 text-[#6b38d4] dark:text-purple-400" />
                Incoming Backlinks
              </h4>
              <p className="text-[10px] text-slate-450 dark:text-zinc-500 font-mono leading-relaxed">
                Other pages in this wiki that link back to the current topic.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {resolvedBacklinks.map((blPage) => (
                  <Link
                    key={blPage.id}
                    href={`/u/${username}/${wikiSlug}/${blPage.slug}`}
                    className="p-3 border border-slate-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 hover:border-[#6b38d4] dark:hover:border-purple-400 hover:shadow-2xs transition-all flex justify-between items-center group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-[#6b38d4] dark:group-hover:text-purple-400 transition-colors">{blPage.title}</p>
                      <p className="text-[10px] text-slate-450 dark:text-zinc-500 font-mono mt-0.5 truncate max-w-[220px]">{blPage.summary || "No summary available."}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-350 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Source References & Citations */}
          {citations.length > 0 && (
            <footer className="pt-6 border-t border-slate-200 dark:border-zinc-800 mt-12 space-y-6" id="article-references-footer">
              
              {/* Source Ingestion Coverage Gauge */}
              <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-4 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300 font-mono flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-[#6b38d4] dark:text-purple-400" />
                  Source Ingestion Document Coverage
                </h5>
                <p className="text-[10px] text-slate-450 dark:text-zinc-550 font-mono leading-relaxed">
                  Calculated based on percentage distribution of evidence chunks cited in this article.
                </p>
                
                <div className="space-y-2.5 pt-1">
                  {sourceCoverage.map((source) => (
                    <div key={source.docId} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-700 dark:text-zinc-300 font-semibold truncate max-w-[200px] sm:max-w-xs">{source.filename}</span>
                        <span className="text-[#6b38d4] dark:text-purple-400 font-bold">{source.percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#6b38d4] dark:bg-purple-600 transition-all duration-300" style={{ width: `${source.percentage}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Citations list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono">
                  Source Citations & References
                </h4>
                <div className="space-y-2.5" id="article-source-list">
                  {citations.map((citation, idx) => (
                    <div
                      key={citation.id}
                      id={`article-source-item-${citation.id}`}
                      onClick={() => handleCitationClick(citation.id)}
                      className="group flex items-start gap-3 p-3 rounded-lg border border-slate-150 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 hover:bg-transparent hover:border-slate-350 dark:hover:border-zinc-700 cursor-pointer transition-all"
                    >
                      <span className="font-mono text-xs font-bold text-[#6b38d4] dark:text-purple-400 bg-[#6b38d4]/10 dark:bg-purple-950/30 border border-[#6b38d4]/20 dark:border-purple-900/50 rounded px-1.5 py-0.5 shrink-0 select-none">
                        [{idx + 1}]
                      </span>
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1 group-hover:text-[#6b38d4] dark:group-hover:text-purple-400 transition-colors">
                          {citation.sourceName} (Page {citation.page_number})
                          <ExternalLink className="h-3 w-3 text-slate-455 dark:text-zinc-500 group-hover:text-[#6b38d4] dark:group-hover:text-purple-400" />
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-mono line-clamp-1 italic">
                          "...{citation.highlight}..."
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </footer>
          )}
        </article>
      </div>

      {/* Right Column: Sidebar (Why This Page Exists) */}
      <aside className="w-full lg:w-80 shrink-0 space-y-6 lg:border-l lg:border-slate-200 dark:lg:border-zinc-800 lg:pl-6">
        
        {/* Concept Network Graph */}
        <GraphPreview 
          nodes={allPages.map(p => ({ id: p.id, title: p.title, slug: p.slug }))} 
          links={pageLinks} 
          username={username}
          wikiSlug={wikiSlug}
          activePageId={page.id}
        />        {/* Wikipedia-style Infobox Widget */}
        <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-2xs space-y-4">
          <div className="text-center font-bold text-slate-900 dark:text-white text-sm border-b border-slate-200 dark:border-zinc-800 pb-2 font-serif">
            {page.title}
          </div>

          <div className="flex justify-center">
            <span className={`px-2.5 py-0.5 rounded-full border text-[9px] uppercase font-bold tracking-wider ${
              page.page_type === "ROOT" 
                ? "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/50" 
                : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50"
            }`}>
              {page.page_type}
            </span>
          </div>

          <table className="w-full text-[11px] font-sans">
            <tbody>
              <tr className="border-b border-slate-100 dark:border-zinc-800/80">
                <td className="py-2 text-slate-400 dark:text-zinc-500 font-bold font-mono text-[9px] uppercase tracking-wider">Workspace</td>
                <td className="py-2 text-slate-900 dark:text-white text-right font-semibold">
                  <Link href={`/u/${username}/${wikiSlug}`} className="text-[#6b38d4] dark:text-purple-400 hover:underline">
                    {wikiSlug}
                  </Link>
                </td>
              </tr>
              {page.parent_page_id && (
                <tr className="border-b border-slate-100 dark:border-zinc-800/80">
                  <td className="py-2 text-slate-400 dark:text-zinc-500 font-bold font-mono text-[9px] uppercase tracking-wider">Parent Class</td>
                  <td className="py-2 text-slate-900 dark:text-white text-right font-semibold">
                    {(() => {
                      const parentPage = allPages.find(p => p.id === page.parent_page_id)
                      return parentPage ? (
                        <Link href={`/u/${username}/${wikiSlug}/${parentPage.slug}`} className="text-[#6b38d4] dark:text-purple-400 hover:underline">
                          {parentPage.title}
                        </Link>
                      ) : (
                        <span className="text-slate-500 dark:text-zinc-500 italic">None</span>
                      )
                    })()}
                  </td>
                </tr>
              )}
              <tr className="border-b border-slate-100 dark:border-zinc-800/80">
                <td className="py-2 text-slate-400 dark:text-zinc-500 font-bold font-mono text-[9px] uppercase tracking-wider">Subtopics</td>
                <td className="py-2 text-slate-900 dark:text-white text-right font-semibold font-mono">{subtopics.length} channels</td>
              </tr>
              <tr className="border-b border-slate-100 dark:border-zinc-800/80">
                <td className="py-2 text-slate-400 dark:text-zinc-500 font-bold font-mono text-[9px] uppercase tracking-wider">Backlinks</td>
                <td className="py-2 text-slate-900 dark:text-white text-right font-semibold font-mono">{resolvedBacklinks.length} incoming</td>
              </tr>
              <tr className="border-b border-slate-100 dark:border-zinc-800/80">
                <td className="py-2 text-slate-400 dark:text-zinc-500 font-bold font-mono text-[9px] uppercase tracking-wider">Factual Chunks</td>
                <td className="py-2 text-slate-900 dark:text-white text-right font-semibold font-mono">{chunkReferences.length || citations.length * 3} chunks</td>
              </tr>
              <tr className="border-b border-slate-100 dark:border-zinc-800/80">
                <td className="py-2 text-slate-400 dark:text-zinc-500 font-bold font-mono text-[9px] uppercase tracking-wider">Confidence</td>
                <td className="py-2 text-slate-900 dark:text-white text-right font-semibold font-mono">
                  <span className="inline-flex items-center rounded border border-amber-250 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-400">
                    {Math.round(page.confidence_score * 100)}%
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2 text-slate-400 dark:text-zinc-500 font-bold font-mono text-[9px] uppercase tracking-wider">Core Sources</td>
                <td className="py-2 text-slate-805 dark:text-zinc-200 text-right font-semibold">
                  <div className="flex flex-col gap-0.5 items-end max-w-[180px] ml-auto">
                    {sourceCoverage.slice(0, 3).map((source) => (
                      <span key={source.docId} className="text-[10px] truncate w-full text-right" title={source.filename}>
                        {source.filename}
                      </span>
                    ))}
                    {sourceCoverage.length > 3 && (
                      <span className="text-[9px] text-slate-450 dark:text-zinc-500 italic">+{sourceCoverage.length - 3} more files</span>
                    )}
                    {sourceCoverage.length === 0 && <span className="text-slate-500 dark:text-zinc-500 italic">None</span>}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-5 space-y-4 shadow-2xs">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white font-mono flex items-center gap-1.5">
            <Database className="h-4 w-4 text-[#6b38d4] dark:text-purple-400" />
            Why This Page Exists
          </h5>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-sans leading-relaxed">
            This article is automatically generated based on the source documents listed below. The percentage shows the contribution of each document to the overall wiki article.
          </p>
          
          <div className="space-y-4 pt-1">
            {sourceCoverage.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-zinc-550 font-mono">No cited documents found.</p>
            ) : (
              sourceCoverage.map((source) => (
                <div key={source.docId} className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-sans">
                      <span className="font-semibold text-slate-700 dark:text-zinc-350 truncate max-w-[150px]" title={source.filename}>{source.filename}</span>
                      <span className="text-[#6b38d4] dark:text-purple-400 font-bold">{source.percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#6b38d4] dark:bg-purple-650 transition-all duration-350" style={{ width: `${source.percentage}%` }}></div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleInspectDocument(source.docId)}
                    className="text-[10px] text-[#6b38d4] dark:text-purple-400 hover:underline font-mono flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <BookOpen className="h-3 w-3" /> Inspect Cited Paragraphs &rarr;
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>

      {/* Slide-out Citation Drawer */}
      {isDrawerOpen && selectedCitation && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 z-40 backdrop-blur-[1px] transition-opacity animate-fade-in"
            onClick={() => setIsDrawerOpen(false)}
          />
          
          <aside
            className="fixed top-0 right-0 h-screen w-[420px] max-w-full bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl z-50 flex flex-col justify-between animate-slide-in font-sans"
            role="dialog"
            aria-label="Source Citation Document Viewer"
            id="article-source-drawer"
          >
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950">
              <div className="flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-[#6b38d4] dark:text-purple-400" />
                <span className="font-mono text-xs font-bold text-slate-800 dark:text-white">Source Evidence</span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-450 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-[#6b38d4] dark:text-purple-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white break-words">
                    {selectedCitation.sourceName}
                  </h4>
                </div>
                <p className="text-xs font-mono text-slate-500 dark:text-zinc-400 pl-5">
                  Document Page offset: {selectedCitation.page_number}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500 font-mono block">
                  Original Context Snippet
                </span>
                
                <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-serif italic">
                  {(() => {
                    const highlight = selectedCitation.highlight.trim()
                    const parts = selectedCitation.context.split(highlight)
                    if (parts.length > 1) {
                      return (
                        <>
                          {parts[0]}
                          <mark className="bg-yellow-250 dark:bg-yellow-950/40 dark:text-yellow-200 text-slate-900 dark:text-zinc-100 px-1 py-0.5 rounded font-semibold not-italic">
                            {highlight}
                          </mark>
                          {parts[1]}
                        </>
                      )
                    }
                    return selectedCitation.context
                  })()}
                </p>
              </div>

              <div className="text-[11px] text-slate-450 dark:text-zinc-500 leading-relaxed flex items-start gap-1.5 font-mono">
                <HelpCircle className="h-4.5 w-4.5 text-slate-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                <span>
                  This verification coordinate is linked back directly to the source database chunk indexes.
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex justify-end">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 dark:hover:bg-zinc-700 text-white rounded-md transition-colors cursor-pointer"
              >
                Done Reading
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Slide-out Source Inspection Drawer */}
      {isSourcePanelOpen && selectedSourceDocId && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 z-40 backdrop-blur-[1px] transition-opacity animate-fade-in"
            onClick={() => setIsSourcePanelOpen(false)}
          />
          
          <aside
            className="fixed top-0 right-0 h-screen w-[460px] max-w-full bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl z-50 flex flex-col justify-between animate-slide-in font-sans"
            role="dialog"
            aria-label="Source Document Evidence Viewer"
            id="article-source-inspection-drawer"
          >
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950">
              <div className="flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-[#6b38d4] dark:text-purple-400" />
                <span className="font-mono text-xs font-bold text-slate-800 dark:text-white">Source Evidence Inspection</span>
              </div>
              <button
                onClick={() => setIsSourcePanelOpen(false)}
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-450 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-[#6b38d4] dark:text-purple-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white break-words">
                    {selectedSourceDocName}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans leading-relaxed">
                  The following sections were extracted from the document and cited as factual evidence across this wiki.
                </p>
              </div>

              <div className="space-y-4">
                {loadingGlobalCitations ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-zinc-500 font-mono text-xs gap-2">
                    <Loader2 className="h-6 w-6 text-[#6b38d4] dark:text-purple-400 animate-spin" />
                    Retrieving document references...
                  </div>
                ) : globalCitations.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono text-center py-8">
                    No chunk citations found for this document.
                  </p>
                ) : (
                  globalCitations.map((chunk, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4 space-y-2.5 shadow-2xs hover:border-slate-350 dark:hover:border-zinc-700 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] font-bold text-[#6b38d4] dark:text-purple-400 bg-[#6b38d4]/10 dark:bg-purple-950/30 border border-[#6b38d4]/20 dark:border-purple-900/50 rounded px-1.5 py-0.5 select-none">
                          Ref [{idx + 1}]
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                          Page {chunk.page_number}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-serif italic">
                        "...{chunk.content}..."
                      </p>
                      
                      <div className="pt-2 border-t border-slate-200/50 dark:border-zinc-800/80 flex items-center justify-between text-[9px] font-mono text-slate-400 dark:text-zinc-550">
                        <span>Cited in page:</span>
                        <Link
                          href={`/u/${username}/${wikiSlug}/${chunk.page_slug}`}
                          onClick={() => setIsSourcePanelOpen(false)}
                          className="text-[#6b38d4] dark:text-purple-400 font-bold hover:underline"
                        >
                          {chunk.page_title} &rarr;
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-55 dark:bg-zinc-950 flex justify-end">
              <button
                onClick={() => setIsSourcePanelOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 dark:hover:bg-zinc-700 text-white rounded-md transition-colors cursor-pointer"
              >
                Done Reading
              </button>
            </div>
          </aside>
        </>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out forwards;
        }
        .animate-slide-in {
          animation: slideIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .bg-yellow-250 {
          background-color: #fef08a;
        }
      `}</style>
    </div>
  )
}
