"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowRight, Layers, FileText, ChevronDown, ChevronUp, Loader } from "lucide-react"
import { renderMarkdownBody } from "../../lib/markdown-renderer"

interface TopicCardProps {
  wikiId: string
  pageId: string
  title: string
  slug: string
  summary: string
  subtopicsCount: number
  sourcesCount: number
  initialStatus: string
  initialBody?: string
  username: string
  wikiSlug: string
}

export default function TopicCard({
  wikiId,
  pageId,
  title,
  slug,
  summary,
  subtopicsCount,
  sourcesCount,
  initialStatus,
  initialBody = "",
  username,
  wikiSlug
}: TopicCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [status, setStatus] = useState(initialStatus)
  const [body, setBody] = useState(initialBody)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExpandToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isExpanded) {
      setIsExpanded(false)
      return
    }

    setIsExpanded(true)

    // Trigger lazy loading/generation if pending
    if (status === "PENDING" && !body) {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/wiki/${wikiId}/page/${pageId}/generate`, {
          method: "POST"
        })

        if (!response.ok) {
          const res = await response.json()
          throw new Error(res.error || "Generation failed.")
        }

        const data = await response.json()
        setBody(data.page.body || "")
        setStatus("GENERATED")
      } catch (err: any) {
        console.error(err)
        setError(err.message || "Failed to load/generate section content.")
        setIsExpanded(false) // Collapse back on error
      } finally {
        setLoading(false)
      }
    }
  }

  const isPending = status === "PENDING"
  const isGenerating = status === "GENERATING" || loading

  return (
    <div className="flex flex-col justify-between p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-sm hover:shadow-md hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200 group relative">
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-slate-800 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors text-base font-serif">
            {title}
          </h3>
          
          {isPending && !loading && (
            <span className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 border border-amber-150 dark:border-amber-900/50 rounded-sm shrink-0">
              Pending
            </span>
          )}
          {isGenerating && (
            <span className="text-[9px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 border border-blue-200 dark:border-blue-900/50 rounded-sm shrink-0 animate-pulse flex items-center gap-1">
              <Loader className="h-2 w-2 animate-spin" />
              Synthesizing...
            </span>
          )}
          {!isPending && !isGenerating && (
            <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 border border-emerald-150 dark:border-emerald-900/50 rounded-sm shrink-0">
              Generated
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed line-clamp-3">
          {summary || "No description provided for this topic."}
        </p>

        {isExpanded && (
          <div className="mt-4 p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md font-serif text-sm text-slate-700 dark:text-zinc-300 leading-relaxed space-y-3 overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-6 text-xs text-slate-400 dark:text-zinc-500 font-mono gap-2">
                <Loader className="h-5 w-5 animate-spin text-purple-600" />
                <span>Generating chapter content from source documents...</span>
              </div>
            ) : error ? (
              <div className="text-xs text-red-500 font-mono p-1">{error}</div>
            ) : (
              <div className="markdown-body text-slate-800 dark:text-zinc-200 space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {renderMarkdownBody(body)}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-slate-400 dark:text-zinc-500 text-[10px] font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
            {subtopicsCount} subtopics
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
            {sourcesCount} sources
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExpandToggle}
            className="flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 cursor-pointer"
          >
            {isExpanded ? (
              <>
                Collapse <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Expand <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
          
          <Link
            href={`/u/${username}/${wikiSlug}/${slug}`}
            className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 text-[11px] hover:underline"
          >
            Open Page
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
