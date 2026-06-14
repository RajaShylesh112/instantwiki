"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowRight, Layers, FileText, ChevronDown, ChevronUp, Loader } from "lucide-react"
import { renderMarkdownBody } from "../../lib/markdown-renderer"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
    <Card className="flex flex-col justify-between group hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200 shadow-sm hover:shadow-md">
      <CardHeader className="p-5 pb-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-serif text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {title}
          </CardTitle>
          
          {isPending && !loading && (
            <Badge variant="outline" className="text-[9px] px-2 py-0 font-mono text-amber-600 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-900/50 dark:bg-amber-950/20 shrink-0">
              Pending
            </Badge>
          )}
          {isGenerating && (
            <Badge variant="outline" className="text-[9px] px-2 py-0 font-mono text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-900/50 dark:bg-blue-950/20 shrink-0 animate-pulse flex items-center gap-1">
              <Loader className="h-2 w-2 animate-spin" />
              Synthesizing...
            </Badge>
          )}
          {!isPending && !isGenerating && (
            <Badge variant="outline" className="text-[9px] px-2 py-0 font-mono text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-900/50 dark:bg-emerald-950/20 shrink-0">
              Generated
            </Badge>
          )}
        </div>

        <CardDescription className="text-xs mt-2.5 leading-relaxed line-clamp-3">
          {summary || "No description provided for this topic."}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-5 pt-0 mt-4">
        {isExpanded && (
          <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md font-serif text-sm text-slate-700 dark:text-zinc-300 leading-relaxed space-y-3 overflow-hidden">
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
      </CardContent>

      <CardFooter className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-slate-400 dark:text-zinc-500 text-[10px] font-mono mt-auto">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            {subtopicsCount} subtopics
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
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
      </CardFooter>
    </Card>
  )
}
