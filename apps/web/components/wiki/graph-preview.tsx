"use client"

import React from "react"
import { Network } from "lucide-react"
import Link from "next/link"

interface GraphPreviewProps {
  pages: {
    id: string
    parent_page_id: string | null
    slug: string
    title: string
    page_type: string
  }[]
  links: { source_page_id: string; target_page_id: string }[]
  username: string
  wikiSlug: string
  activePageId?: string
}

export default function GraphPreview({ pages = [], links = [], username, wikiSlug, activePageId }: GraphPreviewProps) {
  const width = 800
  const height = 380
  const centerX = width / 2
  const centerY = height / 2

  const nodePositions: Record<
    string,
    { x: number; y: number; label: string; id: string; slug: string; page_type: string }
  > = {}

  const root = pages.find((p) => p.page_type === "ROOT") || pages.find((p) => p.parent_page_id === null) || pages[0]

  if (root) {
    nodePositions[root.id] = {
      id: root.id,
      x: centerX,
      y: centerY,
      label: root.title.split(" ").slice(0, 3).join(" "),
      slug: root.slug,
      page_type: "ROOT",
    }

    // Direct children (Domains/Topics)
    const children = pages.filter((p) => p.parent_page_id === root.id && p.id !== root.id)
    children.forEach((child, idx) => {
      const angle = (idx / children.length) * 2 * Math.PI
      const radius = 100
      const cx = Number((centerX + Math.cos(angle) * radius).toFixed(2))
      const cy = Number((centerY + Math.sin(angle) * radius).toFixed(2))
      nodePositions[child.id] = {
        id: child.id,
        x: cx,
        y: cy,
        label: child.title.split(" ").slice(0, 3).join(" "),
        slug: child.slug,
        page_type: "TOPIC",
      }

      // Grandchildren (Subtopics)
      const grandchildren = pages.filter((p) => p.parent_page_id === child.id && p.id !== child.id)
      grandchildren.forEach((gc, gcIdx) => {
        const gcAngle = angle + (gcIdx - (grandchildren.length - 1) / 2) * 0.45
        const gcRadius = 75
        nodePositions[gc.id] = {
          id: gc.id,
          x: Number((cx + Math.cos(gcAngle) * gcRadius).toFixed(2)),
          y: Number((cy + Math.sin(gcAngle) * gcRadius).toFixed(2)),
          label: gc.title.split(" ").slice(0, 3).join(" "),
          slug: gc.slug,
          page_type: "SUBTOPIC",
        }
      })
    })

    // Fallback for any disconnected pages
    pages.forEach((p, pIdx) => {
      if (!nodePositions[p.id]) {
        const titleHash = p.title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const angle = ((titleHash + pIdx) % 360) * (Math.PI / 180)
        const radius = 160
        nodePositions[p.id] = {
          id: p.id,
          x: Number((centerX + Math.cos(angle) * radius).toFixed(2)),
          y: Number((centerY + Math.sin(angle) * radius).toFixed(2)),
          label: p.title.split(" ").slice(0, 3).join(" "),
          slug: p.slug,
          page_type: p.page_type,
        }
      }
    })
  }

  // Resolve links to actual coordinates
  const renderedLinks = links
    .map((link) => {
      const from = nodePositions[link.source_page_id]
      const to = nodePositions[link.target_page_id]
      if (!from || !to) return null
      return { from, to, source_id: link.source_page_id, target_id: link.target_page_id }
    })
    .filter((l): l is NonNullable<typeof l> => l !== null)

  return (
    <div className="space-y-4 p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono flex items-center gap-1.5">
          <Network className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          Interactive Knowledge Graph
        </span>
        <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
          {pages.length} nodes • {renderedLinks.length} connections
        </span>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-12 text-xs font-mono text-slate-400 dark:text-zinc-500">
          No concepts mapped yet.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border border-slate-100 dark:border-zinc-800 rounded-xl p-3 bg-slate-50/50 dark:bg-zinc-950/40 relative overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full text-slate-800 dark:text-zinc-200 font-mono">
              {/* Draw Links */}
              {renderedLinks.map((link, idx) => {
                const isLinkedToActive =
                  activePageId && (link.source_id === activePageId || link.target_id === activePageId)
                return (
                  <line
                    key={idx}
                    x1={link.from.x}
                    y1={link.from.y}
                    x2={link.to.x}
                    y2={link.to.y}
                    className={
                      isLinkedToActive
                        ? "stroke-purple-400 dark:stroke-purple-400"
                        : "stroke-purple-200/50 dark:stroke-zinc-700"
                    }
                    strokeWidth={isLinkedToActive ? "1.5" : "1.0"}
                    strokeDasharray={isLinkedToActive ? "none" : "3,3"}
                  />
                )
              })}

              {/* Draw Nodes */}
              {Object.values(nodePositions).map((pos) => {
                const isActive = activePageId === pos.id
                const isRoot = pos.page_type === "ROOT"
                const isTopic = pos.page_type === "TOPIC"

                let radiusSize = 6
                let colorClasses = "fill-purple-50 dark:fill-zinc-800 stroke-purple-500 dark:stroke-purple-500"
                
                if (isRoot) {
                  radiusSize = 10
                  colorClasses = "fill-purple-600 dark:fill-purple-500 stroke-purple-400 dark:stroke-purple-300"
                } else if (isTopic) {
                  radiusSize = 8
                  colorClasses = "fill-indigo-100 dark:fill-indigo-950 stroke-indigo-500 dark:stroke-indigo-400"
                }

                if (isActive) {
                  colorClasses = "fill-pink-500 dark:fill-pink-500 stroke-pink-400 dark:stroke-pink-300"
                }

                return (
                  <Link key={pos.id} href={`/u/${username}/${wikiSlug}/${pos.slug}`}>
                    <g className="cursor-pointer group">
                      {isActive && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={radiusSize + 4}
                          fill="none"
                          className="stroke-pink-400 dark:stroke-pink-500 animate-pulse"
                          strokeWidth="1.5"
                        />
                      )}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radiusSize}
                        className={`transition-all duration-200 group-hover:fill-purple-400 dark:group-hover:fill-purple-500 ${colorClasses}`}
                        strokeWidth="1.5"
                      />
                      <text
                        x={pos.x}
                        y={pos.y + radiusSize + 11}
                        textAnchor="middle"
                        fontSize={isRoot ? "8px" : isTopic ? "7px" : "6px"}
                        fontWeight={isRoot || isTopic ? "bold" : "normal"}
                        className={`select-none transition-colors opacity-80 group-hover:opacity-100 group-hover:font-bold ${
                          isActive
                            ? "fill-pink-600 dark:fill-pink-400 font-extrabold"
                            : isRoot
                            ? "fill-purple-900 dark:fill-purple-200"
                            : "fill-slate-600 dark:fill-zinc-400"
                        }`}
                      >
                        {pos.label}
                      </text>
                    </g>
                  </Link>
                )
              })}
            </svg>
          </div>

          <Link href={`/u/${username}/${wikiSlug}/graph`} className="block w-full">
            <button className="w-full text-center text-xs font-bold text-[#6b38d4] dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline border border-purple-100 dark:border-zinc-800 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/40 py-2 rounded-lg transition-all cursor-pointer">
              Open Full Interactive Graph View &rarr;
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}
