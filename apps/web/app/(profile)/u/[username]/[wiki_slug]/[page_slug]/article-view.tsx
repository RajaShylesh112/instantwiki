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

interface ArticleViewProps {
  username: string
  wikiSlug: string
  wikiId: string
  initialPage: WikiPage
  allPages: WikiPage[]
}

interface EnrichedCitation extends WikiPageCitation {
  sourceName?: string
}

export default function ArticleView({ username, wikiSlug, wikiId, initialPage, allPages = [] }: ArticleViewProps) {
  const router = useRouter()
  const [page, setPage] = useState<WikiPage>(initialPage)
  const [generationStatus, setGenerationStatus] = useState<string>(initialPage.generation_status)
  const [selectedCitation, setSelectedCitation] = useState<EnrichedCitation | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [citations, setCitations] = useState<any[]>([])
  const [images, setImages] = useState<any[]>([])
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  // Lazy generation steps (animated visual checklist)
  const [genStep, setGenStep] = useState(0)

  // 1. Trigger lazy generation on mount if status is PENDING
  useEffect(() => {
    if (initialPage.generation_status === "PENDING") {
      triggerLazyGeneration()
    } else {
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
    if (citations.length === 0) return []
    const counts: Record<string, { count: number; filename: string }> = {}
    
    citations.forEach(cit => {
      const docId = cit.document_id
      const filename = cit.sourceName || "Source Document"
      if (!counts[docId]) {
        counts[docId] = { count: 0, filename }
      }
      counts[docId].count += 1
    })

    const total = citations.length
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

  // Custom markdown renderer
  const renderLine = (line: string, index: number) => {
    const trimmed = line.trim()
    if (!trimmed) return null

    // Headers
    if (trimmed.startsWith("###")) {
      return (
        <h3 key={index} className="text-lg font-bold text-slate-900 mt-6 mb-3 tracking-tight font-sans border-b border-slate-100 pb-1">
          {trimmed.replace("###", "").trim()}
        </h3>
      )
    }

    // List items
    if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      return (
        <li key={index} className="text-sm sm:text-base text-slate-700 leading-relaxed font-serif ml-5 list-disc my-1.5">
          {renderTextWithCitations(trimmed.substring(1).trim())}
        </li>
      )
    }

    if (/^\d+\./.test(trimmed)) {
      const dotIndex = trimmed.indexOf(".")
      return (
        <li key={index} className="text-sm sm:text-base text-slate-700 leading-relaxed font-serif ml-5 list-decimal my-1.5">
          {renderTextWithCitations(trimmed.substring(dotIndex + 1).trim())}
        </li>
      )
    }

    // Paragraph
    return (
      <p key={index} className="text-sm sm:text-base text-slate-755 leading-relaxed font-serif mb-4.5">
        {renderTextWithCitations(trimmed)}
      </p>
    )
  }

  // Parse inline redirects, links, and citation numbers
  const renderTextWithCitations = (text: string) => {
    // 1. Process custom HTML links created by the auto-linker
    const parts: React.ReactNode[] = []
    
    // Matches: <a href="URL" class="...">TEXT</a>
    const htmlLinkRegex = /<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g
    let lastIdx = 0
    let match

    const processCitations = (chunk: string, keyPrefix: string) => {
      // Matches bracket citations: [1], [2]
      const subParts = chunk.split(/(\[\d+\])/g)
      return subParts.map((subChunk, subIdx) => {
        const citMatch = subChunk.match(/^\[(\d+)\]$/)
        if (citMatch) {
          const citationIdx = citMatch[1]
          // Find matching citation by page index/id
          const citation = citations[parseInt(citationIdx) - 1] || citations[0]
          if (citation) {
            return (
              <sup
                key={`${keyPrefix}-${subIdx}`}
                onClick={() => handleCitationClick(citation.id)}
                className="cursor-pointer font-bold font-mono text-[#6b38d4] hover:bg-[#6b38d4]/10 rounded px-1 select-none transition-colors mx-0.5"
                title="Click to trace source evidence"
              >
                [{citationIdx}]
              </sup>
            )
          }
        }
        return subChunk
      })
    }

    while ((match = htmlLinkRegex.exec(text)) !== null) {
      const matchIdx = match.index
      const textBefore = text.substring(lastIdx, matchIdx)
      
      if (textBefore) {
        parts.push(...processCitations(textBefore, `pre-${matchIdx}`))
      }

      const href = match[1]
      const linkText = match[2]
      
      parts.push(
        <Link
          key={`link-${matchIdx}`}
          href={href}
          className="text-[#6b38d4] font-semibold hover:underline border-b border-dashed border-[#6b38d4]/30"
        >
          {linkText}
        </Link>
      )

      lastIdx = htmlLinkRegex.lastIndex
    }

    const remaining = text.substring(lastIdx)
    if (remaining) {
      parts.push(...processCitations(remaining, "post"))
    }

    return parts.length > 0 ? parts : text
  }

  // Render Lazy Loading Wizard
  if (generationStatus === "GENERATING") {
    return (
      <div className="flex-1 py-16 flex flex-col items-center justify-center max-w-2xl mx-auto px-6 text-center space-y-6 font-sans">
        <div className="relative">
          <Loader2 className="h-10 w-10 text-[#6b38d4] animate-spin" />
          <Sparkles className="h-5 w-5 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">Synthesizing "{page.title}"</h2>
          <p className="text-xs text-slate-500 max-w-md font-mono leading-relaxed">
            Retrieving pgvector embedding chunks, evaluating source relevance, and auto-linking wiki nodes dynamically.
          </p>
        </div>

        {/* Live Step Checklist */}
        <div className="w-full max-w-xs border border-slate-200 rounded-lg p-4 bg-slate-50 text-left text-xs font-mono space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-slate-800">
            {genStep >= 1 ? (
              <Check className="h-4 w-4 text-emerald-600 bg-emerald-100 rounded-full p-0.5 shrink-0" />
            ) : (
              <Loader2 className="h-4 w-4 text-[#6b38d4] animate-spin shrink-0" />
            )}
            <span className={genStep >= 1 ? "text-slate-800 font-bold" : "text-slate-400"}>1. Similarity Vector Search</span>
          </div>

          <div className="flex items-center gap-2 text-slate-800">
            {genStep >= 2 ? (
              <Check className="h-4 w-4 text-emerald-600 bg-emerald-100 rounded-full p-0.5 shrink-0" />
            ) : genStep === 1 ? (
              <Loader2 className="h-4 w-4 text-[#6b38d4] animate-spin shrink-0" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300 ml-1.5 mr-1" />
            )}
            <span className={genStep >= 2 ? "text-slate-800 font-bold" : "text-slate-400"}>2. Extracting Chunks Content</span>
          </div>

          <div className="flex items-center gap-2 text-slate-800">
            {genStep >= 3 ? (
              <Check className="h-4 w-4 text-emerald-600 bg-emerald-100 rounded-full p-0.5 shrink-0" />
            ) : genStep === 2 ? (
              <Loader2 className="h-4 w-4 text-[#6b38d4] animate-spin shrink-0" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300 ml-1.5 mr-1" />
            )}
            <span className={genStep >= 3 ? "text-slate-800 font-bold" : "text-slate-400"}>3. Synthesizing Wiki Page</span>
          </div>
        </div>
      </div>
    )
  }

  // Render Failure Page
  if (generationStatus === "FAILED") {
    return (
      <div className="flex-1 py-16 flex flex-col items-center justify-center max-w-md mx-auto px-6 text-center space-y-4 font-sans">
        <div className="h-12 w-12 bg-rose-50 border border-rose-200 text-rose-650 rounded-full flex items-center justify-center p-2.5">
          <X className="h-6 w-6" />
        </div>
        <h2 className="text-md font-bold text-slate-900">Synthesis Failed</h2>
        <p className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-3 leading-relaxed font-mono">
          {genError || "The generation worker encountered a database schema or API key failure."}
        </p>
        <button
          onClick={triggerLazyGeneration}
          className="px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-850 transition-all"
        >
          Retry Ingestion
        </button>
      </div>
    )
  }

  const lines = (page.body || "").split("\n")

  return (
    <div className="relative min-h-screen font-sans bg-transparent flex flex-col">
      <div className="flex-1 py-8 max-w-4xl mx-auto px-6 w-full">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-6">
          <Link href={`/u/${username}/${wikiSlug}`} className="hover:text-[#6b38d4] transition-colors">
            {wikiSlug}
          </Link>
          <span>/</span>
          <span className="text-slate-800">Pages</span>
          <span>/</span>
          <span className="text-slate-400 truncate max-w-[150px]">{page.title}</span>
        </div>

        {/* Article Container (article-container) */}
        <article className="space-y-6 max-w-3xl">
          
          {/* Article Title */}
          <div className="border-b border-slate-200 pb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl" id="article-title">
                {page.title}
              </h1>
              <p className="text-xs text-slate-450 font-mono">
                Verified Concept Article • Factual Traceability Enabled
              </p>
            </div>
            
            <div className="flex gap-2 font-mono text-[9px] font-bold">
              <span className={`px-2 py-0.5 rounded border ${
                page.page_type === "ROOT" 
                  ? "bg-purple-50 text-purple-700 border-purple-200" 
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}>
                {page.page_type}
              </span>
              <span className="px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">
                {Math.round(page.confidence_score * 100)}% Confidence
              </span>
            </div>
          </div>

          {/* Summary Box */}
          {page.summary && (
            <div className="border-l-4 border-[#6b38d4] bg-slate-50 p-4 rounded-r-lg italic" id="article-summary-card">
              <p className="text-sm font-medium text-slate-700 font-sans">
                <span className="font-bold font-mono text-slate-450 uppercase text-[10px] block not-italic mb-1 tracking-wider">
                  Summary Overview
                </span>
                {page.summary}
              </p>
            </div>
          )}

          {/* Render Body */}
          <div className="space-y-4" id="article-markdown-body">
            {lines.map((line, idx) => renderLine(line, idx))}
          </div>

          {/* Visual References (extracted images mapped to source pages) */}
          {images.length > 0 && (
            <div className="pt-6 border-t border-slate-200/60 mt-8 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 font-mono flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-[#6b38d4]" />
                Visual References from Cited Pages
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                {images.slice(0, 3).map((img, idx) => (
                  <div key={img.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex flex-col shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="relative aspect-video bg-white flex items-center justify-center p-2">
                      <img
                        src={`https://vecsyzkkqlbrobjjgkgd.supabase.co/storage/v1/object/public/documents/${img.storage_path}`}
                        alt={img.caption || "Extracted Figure"}
                        className="max-h-full object-contain"
                      />
                    </div>
                    <div className="p-3 border-t border-slate-100 bg-white">
                      <p className="text-[10px] text-slate-500 font-mono leading-normal">
                        <span className="font-bold text-slate-700 block">Figure {idx + 1}: {img.caption || "Extracted diagram"}</span>
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
            <div className="pt-6 border-t border-slate-100 mt-8 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 font-mono">
                Subtopics & Sections
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {subtopics.map((sub) => (
                  <Link
                    key={sub.slug}
                    href={`/u/${username}/${wikiSlug}/${sub.slug}`}
                    className="p-3 border border-slate-200 rounded-md bg-white hover:border-[#6b38d4] hover:shadow-2xs transition-all flex justify-between items-center group"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-[#6b38d4] transition-colors">{sub.title}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">{sub.summary}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-350 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related Concepts */}
          {relatedPages.length > 0 && (
            <div className="pt-6 border-t border-slate-100 mt-6 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 font-mono">
                Related Pages
              </h4>
              <div className="flex flex-wrap gap-2.5">
                {relatedPages.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/u/${username}/${wikiSlug}/${related.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-650 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-md transition-colors"
                  >
                    {related.title} <ArrowRight className="h-3 w-3 text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Source References & Citations */}
          {citations.length > 0 && (
            <footer className="pt-6 border-t border-slate-200 mt-12 space-y-6" id="article-references-footer">
              
              {/* Source Ingestion Coverage Gauge */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-[#6b38d4]" />
                  Source Document Ingestion Coverage
                </h5>
                <p className="text-[10px] text-slate-450 font-mono leading-relaxed">
                  Calculated based on percentage distribution of evidence chunks cited in this article.
                </p>
                
                <div className="space-y-2.5 pt-1">
                  {sourceCoverage.map((source) => (
                    <div key={source.docId} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-700 font-semibold truncate max-w-[200px] sm:max-w-xs">{source.filename}</span>
                        <span className="text-[#6b38d4] font-bold">{source.percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#6b38d4] transition-all duration-300" style={{ width: `${source.percentage}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Citations list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Source Citations & References
                </h4>
                <div className="space-y-2.5" id="article-source-list">
                  {citations.map((citation, idx) => (
                    <div
                      key={citation.id}
                      id={`article-source-item-${citation.id}`}
                      onClick={() => handleCitationClick(citation.id)}
                      className="group flex items-start gap-3 p-3 rounded-lg border border-slate-150 bg-slate-50/50 hover:bg-transparent hover:border-slate-350 cursor-pointer transition-all"
                    >
                      <span className="font-mono text-xs font-bold text-[#6b38d4] bg-[#6b38d4]/10 border border-[#6b38d4]/20 rounded px-1.5 py-0.5 shrink-0 select-none">
                        [{idx + 1}]
                      </span>
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1 group-hover:text-[#6b38d4] transition-colors">
                          {citation.sourceName} (Page {citation.page_number})
                          <ExternalLink className="h-3 w-3 text-slate-455 group-hover:text-[#6b38d4]" />
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-mono line-clamp-1 italic">
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

      {/* Slide-out Citation Drawer */}
      {isDrawerOpen && selectedCitation && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/10 z-40 backdrop-blur-[1px] transition-opacity animate-fade-in"
            onClick={() => setIsDrawerOpen(false)}
          />
          
          <aside
            className="fixed top-0 right-0 h-screen w-[420px] max-w-full bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col justify-between animate-slide-in font-sans"
            role="dialog"
            aria-label="Source Citation Document Viewer"
            id="article-source-drawer"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-[#6b38d4]" />
                <span className="font-mono text-xs font-bold text-slate-800">Source Evidence</span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-450 hover:text-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-[#6b38d4]" />
                  <h4 className="text-sm font-bold text-slate-900 break-words">
                    {selectedCitation.sourceName}
                  </h4>
                </div>
                <p className="text-xs font-mono text-slate-500 pl-5">
                  Document Page offset: {selectedCitation.page_number}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 font-mono block">
                  Original Context Snippet
                </span>
                
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-serif italic">
                  {(() => {
                    const highlight = selectedCitation.highlight.trim()
                    const parts = selectedCitation.context.split(highlight)
                    if (parts.length > 1) {
                      return (
                        <>
                          {parts[0]}
                          <mark className="bg-yellow-250 text-slate-900 px-1 py-0.5 rounded font-semibold not-italic">
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

              <div className="text-[11px] text-slate-450 leading-relaxed flex items-start gap-1.5 font-mono">
                <HelpCircle className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  This verification coordinate is linked back directly to the source database chunk indexes.
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-colors"
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
