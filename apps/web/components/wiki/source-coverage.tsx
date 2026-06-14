import React from "react"
import { Award } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface SourceCoverageItem {
  filename: string
  percentage: number
}

interface SourceCoverageProps {
  sources: SourceCoverageItem[]
}

export default function SourceCoverage({ sources }: SourceCoverageProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="p-4 pb-2 border-b border-slate-100 dark:border-zinc-800">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono flex items-center gap-1.5 leading-none">
          <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          Source Coverage
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-3">
        {sources.length === 0 ? (
          <div className="text-center py-4 text-xs font-mono text-slate-400 dark:text-zinc-500">
            No sources tracked.
          </div>
        ) : (
          <div className="space-y-3">
            {sources.map((src, idx) => {
              // Calculate number of solid blocks (out of 20, 5% each)
              const blocksCount = Math.round(src.percentage / 5)
              const displayBlocks = src.percentage > 0 ? Math.max(1, blocksCount) : 0
              const filledBlocks = "█".repeat(displayBlocks)
              const emptyBlocks = "█".repeat(20 - displayBlocks)

              return (
                <div key={idx} className="flex items-center justify-between gap-2 py-0.5">
                  <span className="text-xs text-slate-600 dark:text-zinc-400 truncate max-w-[130px] font-sans" title={src.filename}>
                    {src.filename}
                  </span>
                  <div className="flex items-center font-mono text-[10px] select-none shrink-0 tracking-tighter">
                    <span className="text-[#6b38d4] dark:text-purple-400">{filledBlocks}</span>
                    <span className="text-slate-100 dark:text-zinc-800">{emptyBlocks}</span>
                    <span className="text-slate-800 dark:text-zinc-200 font-bold min-w-[32px] text-right ml-1 tracking-normal font-mono">
                      {src.percentage}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
