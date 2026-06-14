"use client"

import React, { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface CollapsibleOverviewProps {
  intro: React.ReactNode
  remaining?: React.ReactNode
}

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function CollapsibleOverview({ intro, remaining }: CollapsibleOverviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="shadow-sm overflow-hidden transition-all duration-300">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="w-full">
        <CardContent className="p-6 leading-relaxed text-slate-700 dark:text-zinc-300 font-serif text-sm sm:text-base">
          <div className="space-y-4">{intro}</div>
          
          {remaining && (
            <CollapsibleContent className="mt-4 space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800/60 animate-fade-in data-[state=closed]:animate-fade-out">
              {remaining}
            </CollapsibleContent>
          )}
        </CardContent>

        {/* Expand/Collapse Button Bar */}
        {remaining && (
          <CardFooter className="border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/20 px-6 py-2.5 flex justify-center pb-2.5 pt-2.5">
            <CollapsibleTrigger asChild>
              <button
                className="text-xs font-bold text-[#6b38d4] dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer select-none"
              >
                {isExpanded ? (
                  <>
                    Collapse Overview <ChevronUp className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    Read Full Overview <ChevronDown className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </CollapsibleTrigger>
          </CardFooter>
        )}
      </Collapsible>
    </Card>
  )
}
