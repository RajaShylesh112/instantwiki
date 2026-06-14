"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Compass } from "lucide-react"

interface LearningPathItem {
  title: string
  slug: string
}

interface LearningPathProps {
  path: LearningPathItem[]
  username: string
  wikiSlug: string
}

export default function LearningPath({ path, username, wikiSlug }: LearningPathProps) {
  const [showAll, setShowAll] = useState(false)

  const displayedPath = showAll ? path : path.slice(0, 5)

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm space-y-4">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono border-b border-slate-100 dark:border-zinc-800 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Compass className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          Suggested Reading Journey
        </div>
        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">
          {showAll ? `Full Path (${path.length} Steps)` : `Beginner Path (${Math.min(5, path.length)} Steps)`}
        </span>
      </div>

      {path.length === 0 ? (
        <div className="text-center py-4 text-xs font-mono text-slate-400 dark:text-zinc-500">
          No reading path mapped yet.
        </div>
      ) : (
        <div className="space-y-3">
          <ol className="space-y-0">
            {displayedPath.map((item, idx) => (
              <li key={item.slug} className="flex items-start gap-3 group">
                {/* Step number + vertical connector */}
                <div className="flex flex-col items-center shrink-0">
                  <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-[11px] font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {idx + 1}
                  </span>
                  {idx < displayedPath.length - 1 && (
                    <div className="w-px h-5 bg-purple-200/60 dark:bg-purple-800/40" />
                  )}
                </div>

                {/* Title link */}
                <Link
                  href={`/u/${username}/${wikiSlug}/${item.slug}`}
                  className="text-sm font-semibold text-[#6b38d4] dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline transition-colors pt-0.5"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ol>

          {path.length > 5 && (
            <div className="pt-1">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-xs font-bold text-[#6b38d4] dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline cursor-pointer border border-purple-100/50 dark:border-zinc-800 bg-purple-50/30 dark:bg-purple-950/10 px-4 py-1.5 rounded-lg transition-all"
              >
                {showAll ? "Show Beginner Path" : `Show Full Path (${path.length} steps)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
