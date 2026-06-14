import React from "react"
import { FileText, Database, Layers, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface WikiSummaryProps {
  documentsCount: number
  chunksCount: number
  pagesCount: number
  avgConfidence: number
}

export default function WikiSummary({
  documentsCount,
  chunksCount,
  pagesCount,
  avgConfidence
}: WikiSummaryProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
        <div className="flex items-center gap-3 p-2">
          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800 dark:text-zinc-100 font-mono">{documentsCount}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider font-mono">Sources</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2">
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800 dark:text-zinc-100 font-mono">{chunksCount}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider font-mono">Data Chunks</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2">
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800 dark:text-zinc-100 font-mono">{pagesCount}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider font-mono">Wiki Pages</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2">
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800 dark:text-zinc-100 font-mono">{avgConfidence}%</div>
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider font-mono">Avg Confidence</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
