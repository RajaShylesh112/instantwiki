import React from "react"
import { FileText, Award } from "lucide-react"

interface SourceCoverageItem {
  filename: string
  percentage: number
}

interface SourceCoverageProps {
  sources: SourceCoverageItem[]
}

export default function SourceCoverage({ sources }: SourceCoverageProps) {
  return (
    <div className="space-y-3.5 p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-sm">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono border-b border-slate-100 dark:border-zinc-800 pb-1.5 flex items-center gap-1.5">
        <Award className="h-3.5 w-3.5 text-purple-650 dark:text-purple-400" />
        Source Coverage
      </div>

      {sources.length === 0 ? (
        <div className="text-center py-4 text-xs font-mono text-slate-400 dark:text-zinc-500">
          No sources tracked.
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((src, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-600 dark:text-zinc-400 truncate max-w-[200px]" title={src.filename}>
                  {src.filename}
                </span>
                <span className="text-slate-800 dark:text-zinc-200 font-bold ml-2">{src.percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${src.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
