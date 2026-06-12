import React from "react"
import Link from "next/link"
import { Compass, ChevronRight } from "lucide-react"

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
  return (
    <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-sm space-y-3">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono border-b border-slate-100 dark:border-zinc-800 pb-1.5 flex items-center gap-1.5">
        <Compass className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
        Suggested Reading Order (Learning Path)
      </div>

      {path.length === 0 ? (
        <div className="text-center py-2 text-xs font-mono text-slate-400 dark:text-zinc-500">
          Add topics to generate a learning path.
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-y-2.5 gap-x-2">
          {path.map((item, idx) => (
            <React.Fragment key={item.slug}>
              {idx > 0 && <ChevronRight className="h-4 w-4 text-slate-300 dark:text-zinc-600 shrink-0" />}
              <Link
                href={`/u/${username}/${wikiSlug}/${item.slug}`}
                className="text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50/70 dark:bg-purple-950/20 hover:bg-purple-100/80 dark:hover:bg-purple-900/30 border border-purple-100 dark:border-purple-900/50 hover:border-purple-200 dark:hover:border-purple-800 rounded px-2.5 py-1.5 transition-all flex items-center shrink-0"
              >
                <span className="font-mono text-[10px] text-purple-500 dark:text-purple-400 mr-1.5">{idx + 1}.</span>
                {item.title}
              </Link>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
