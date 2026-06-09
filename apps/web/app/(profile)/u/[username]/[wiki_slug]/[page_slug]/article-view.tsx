"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, BookOpen, Database, ExternalLink, X, HelpCircle } from "lucide-react"
import { MockArticle, MockCitation, mockCitations, mockArticles } from "../mock-data"

interface ArticleViewProps {
  username: string
  wikiSlug: string
  article: MockArticle
}

export default function ArticleView({ username, wikiSlug, article }: ArticleViewProps) {
  const [selectedCitation, setSelectedCitation] = useState<MockCitation | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleCitationClick = (id: string) => {
    const citation = mockCitations[id]
    if (citation) {
      setSelectedCitation(citation)
      setIsDrawerOpen(true)
    }
  }

  // A lightweight custom markdown parser to enforce strict style tokens
  const renderLine = (line: string, index: number) => {
    const trimmed = line.trim()
    if (!trimmed) return null

    // Headers
    if (trimmed.startsWith("###")) {
      return (
        <h3 key={index} className="text-lg font-bold text-slate-900 mt-6 mb-3 tracking-tight font-sans">
          {trimmed.replace("###", "").trim()}
        </h3>
      )
    }

    // List items
    if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      return (
        <li key={index} className="text-sm sm:text-base text-slate-700 leading-relaxed font-serif ml-5 list-disc my-1">
          {renderTextWithCitations(trimmed.substring(1).trim())}
        </li>
      )
    }

    if (/^\d+\./.test(trimmed)) {
      const dotIndex = trimmed.indexOf(".")
      return (
        <li key={index} className="text-sm sm:text-base text-slate-700 leading-relaxed font-serif ml-5 list-decimal my-1">
          {renderTextWithCitations(trimmed.substring(dotIndex + 1).trim())}
        </li>
      )
    }

    // Paragraph
    return (
      <p key={index} className="text-sm sm:text-base text-slate-700 leading-relaxed font-serif mb-4">
        {renderTextWithCitations(trimmed)}
      </p>
    )
  }

  // Parse inline concepts and citation brackets
  const renderTextWithCitations = (text: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match

    const processCitations = (chunk: string, keyPrefix: string) => {
      const subParts = chunk.split(/(\[\d+\])/g)
      return subParts.map((subChunk, subIdx) => {
        const citMatch = subChunk.match(/^\[(\d+)\]$/)
        if (citMatch) {
          const citationId = citMatch[1]
          return (
            <sup
              key={`${keyPrefix}-${subIdx}`}
              onClick={() => handleCitationClick(citationId)}
              className="cursor-pointer font-bold font-mono text-[#6b38d4] hover:bg-[#6b38d4]/10 rounded px-0.5 select-none transition-colors"
              title="Click to trace source"
            >
              {subChunk}
            </sup>
          )
        }
        return subChunk
      })
    }

    while ((match = linkRegex.exec(text)) !== null) {
      const matchIndex = match.index
      const textBefore = text.substring(lastIndex, matchIndex)
      
      if (textBefore) {
        parts.push(...processCitations(textBefore, `pre-${matchIndex}`))
      }

      const linkText = match[1]
      const linkSlug = match[2]
      parts.push(
        <Link
          key={`link-${matchIndex}`}
          href={`/u/${username}/${wikiSlug}/${linkSlug}`}
          className="text-[#6b38d4] font-semibold hover:underline"
        >
          {linkText}
        </Link>
      )

      lastIndex = linkRegex.lastIndex
    }

    const textRemaining = text.substring(lastIndex)
    if (textRemaining) {
      parts.push(...processCitations(textRemaining, "post"))
    }

    return parts.length > 0 ? parts : text
  }

  const lines = article.body.split("\n")

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
          <span className="text-slate-400 truncate max-w-[150px]">{article.title}</span>
        </div>

        {/* Article Container (article-container) */}
        <article className="space-y-6 max-w-3xl">
          {/* Article Title (article-title) */}
          <div className="border-b border-slate-200 pb-3">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl" id="article-title">
              {article.title}
            </h1>
            <p className="text-xs text-slate-450 font-mono mt-1">
              Verified Concept Article • Factual Traceability Enabled
            </p>
          </div>

          {/* Summary Box (article-summary-card) */}
          <div className="border-l-4 border-slate-355 bg-slate-50 p-4 rounded-r-lg italic" id="article-summary-card">
            <p className="text-sm font-medium text-slate-700 font-sans">
              <span className="font-bold font-mono text-slate-450 uppercase text-xs block not-italic mb-1">
                Summary Overview
              </span>
              {article.summary}
            </p>
          </div>

          {/* Render Body (article-markdown-body) */}
          <div className="space-y-4" id="article-markdown-body">
            {lines.map((line, idx) => renderLine(line, idx))}
          </div>

          {/* Related Concepts */}
          {article.relatedSlugs && article.relatedSlugs.length > 0 && (
            <div className="pt-6 border-t border-slate-100 mt-8">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 font-mono mb-3">
                Related Concepts
              </h4>
              <div className="flex flex-wrap gap-2.5">
                {article.relatedSlugs.map((slug) => {
                  const relatedArt = mockArticles[slug]
                  if (!relatedArt) return null
                  return (
                    <Link
                      key={slug}
                      href={`/u/${username}/${wikiSlug}/${slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-650 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-md transition-colors"
                    >
                      {relatedArt.title} <ArrowRight className="h-3 w-3 text-slate-400" />
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* References Footer */}
          <footer className="pt-6 border-t border-slate-200 mt-12 space-y-4" id="article-references-footer">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Source Citations & References
            </h4>
            <div className="space-y-2.5" id="article-source-list">
              {article.citations.map((citId) => {
                const citation = mockCitations[citId]
                if (!citation) return null
                return (
                  <div
                    key={citId}
                    id={`article-source-item-${citId}`}
                    onClick={() => handleCitationClick(citId)}
                    className="group flex items-start gap-3 p-3 rounded-lg border border-slate-150 bg-slate-50/50 hover:bg-transparent hover:border-slate-350 cursor-pointer transition-all"
                  >
                    <span className="font-mono text-xs font-bold text-[#6b38d4] bg-[#6b38d4]/10 border border-[#6b38d4]/20 rounded px-1.5 py-0.5 shrink-0 select-none">
                      [{citId}]
                    </span>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1 group-hover:text-[#6b38d4] transition-colors">
                        {citation.sourceName} (Page {citation.page})
                        <ExternalLink className="h-3 w-3 text-slate-455 group-hover:text-[#6b38d4]" />
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-mono line-clamp-1 italic">
                        "...{citation.highlight}..."
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </footer>
        </article>
      </div>

      {/* Slide-out Citation Viewer Drawer Component (drw-001) */}
      {isDrawerOpen && selectedCitation && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/10 z-40 backdrop-blur-[1px] transition-opacity animate-fade-in"
            onClick={() => setIsDrawerOpen(false)}
          />
          
          {/* Drawer container */}
          <aside
            className="fixed top-0 right-0 h-screen w-[400px] max-w-full bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col justify-between animate-slide-in font-sans"
            role="dialog"
            aria-label="Source Citation Document Viewer"
            id="article-source-drawer"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-[#6b38d4]" />
                <span className="font-mono text-xs font-bold text-slate-800">Citation Source</span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-450 hover:text-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-900 break-words">
                  {selectedCitation.sourceName}
                </h4>
                <p className="text-xs font-mono text-slate-500">
                  Document Page: {selectedCitation.page}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  Original Context Snippet
                </span>
                
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-serif italic">
                  {(() => {
                    const parts = selectedCitation.context.split(selectedCitation.highlight)
                    if (parts.length > 1) {
                      return (
                        <>
                          {parts[0]}
                          <mark className="bg-yellow-200 text-slate-900 px-1 py-0.5 rounded font-medium not-italic">
                            {selectedCitation.highlight}
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
                  This snippet was extracted via AI extraction pipelines and mapped to the source PDF coordinate offsets.
                </span>
              </div>
            </div>

            {/* Footer */}
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

      {/* Inline styles for basic keyframe animations */}
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
      `}</style>
    </div>
  )
}
