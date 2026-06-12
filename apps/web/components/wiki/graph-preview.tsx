"use client"

import React from "react"
import { Network } from "lucide-react"
import Link from "next/link"

interface GraphPreviewProps {
  nodes: { id: string; title: string; slug: string }[]
  links: { source_page_id: string; target_page_id: string }[]
  username: string
  wikiSlug: string
  activePageId?: string
}

export default function GraphPreview({ nodes, links, username, wikiSlug, activePageId }: GraphPreviewProps) {
  // Pre-calculate positions on a circle
  const width = 200
  const height = 180
  const centerX = width / 2
  const centerY = height / 2
  const radius = 55

  const nodePositions: Record<string, { x: number; y: number; label: string; id: string; slug: string }> = {}
  
  // Arrange nodes on a circle
  nodes.forEach((node, idx) => {
    const angle = (2 * Math.PI * idx) / nodes.length
    nodePositions[node.id] = {
      id: node.id,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      label: node.title.split(" ").slice(0, 2).join(" "), // Shorten labels
      slug: node.slug
    }
  })

  return (
    <div className="space-y-3.5 p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 font-mono">Concept Graph</span>
        <Network className="h-4 w-4 text-[#6b38d4] dark:text-purple-400" />
      </div>

      {nodes.length === 0 ? (
        <div className="text-center py-8 text-xs font-mono text-slate-400 dark:text-zinc-500">
          No concepts to link yet.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="border border-slate-100 dark:border-zinc-800 rounded-lg p-2 bg-slate-50/50 dark:bg-zinc-950/40">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full text-slate-800 dark:text-zinc-200 font-mono">
              {/* Draw Links */}
              {links.map((link, idx) => {
                const from = nodePositions[link.source_page_id]
                const to = nodePositions[link.target_page_id]
                if (!from || !to) return null
                const isLinkedToActive = activePageId && (link.source_page_id === activePageId || link.target_page_id === activePageId)
                return (
                  <line
                    key={idx}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    className={
                      isLinkedToActive 
                        ? "stroke-purple-400 dark:stroke-purple-400" 
                        : "stroke-purple-200/80 dark:stroke-zinc-700/80"
                    }
                    strokeWidth={isLinkedToActive ? "1.2" : "0.8"}
                    strokeDasharray={isLinkedToActive ? "none" : "2,2"}
                  />
                )
              })}

              {/* Draw Nodes */}
              {Object.values(nodePositions).map((pos) => {
                const isActive = activePageId === pos.id
                return (
                  <Link key={pos.id} href={`/u/${username}/${wikiSlug}/${pos.slug}`}>
                    <g className="cursor-pointer group">
                      {isActive && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r="9"
                          fill="none"
                          className="stroke-purple-250 dark:stroke-purple-800 animate-pulse"
                          strokeWidth="1"
                        />
                      )}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isActive ? "7.5" : "5"}
                        className={`transition-all duration-200 group-hover:fill-purple-100 dark:group-hover:fill-purple-900 ${
                          isActive
                            ? "fill-purple-650 dark:fill-purple-450 stroke-purple-400 dark:stroke-purple-300"
                            : "fill-purple-50 dark:fill-zinc-800 stroke-purple-500 dark:stroke-purple-500"
                        }`}
                        strokeWidth={isActive ? "2" : "1.2"}
                      />
                      <text
                        x={pos.x}
                        y={pos.y + (isActive ? 13 : 11)}
                        textAnchor="middle"
                        fontSize={isActive ? "5" : "4.5"}
                        fontWeight={isActive ? "900" : "bold"}
                        className={`select-none transition-colors ${
                          isActive 
                            ? "fill-[#6b38d4] dark:fill-purple-300 font-extrabold" 
                            : "fill-slate-600 dark:fill-zinc-400"
                        } hover:fill-purple-700 dark:hover:fill-purple-300`}
                      >
                        {pos.label}
                      </text>
                    </g>
                  </Link>
                )
              })}
            </svg>
          </div>

          <div className="text-[9px] text-slate-400 dark:text-zinc-550 font-mono text-center">
            Active links: {nodes.length} nodes • {links.length} relationships
          </div>
          
          <Link href={`/u/${username}/${wikiSlug}/graph${activePageId ? `?active=${activePageId}` : ""}`} className="block w-full">
            <button className="w-full text-center text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline border border-purple-100 dark:border-zinc-800 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/40 py-1.5 rounded transition-all cursor-pointer">
              Open Full Interactive Graph →
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}

