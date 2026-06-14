"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ChevronRight, ChevronDown, BookOpen, FileCode } from "lucide-react"

interface TreeNode {
  id: string
  title: string
  slug: string
  generationStatus: string
  children: TreeNode[]
}

interface TopicTreeProps {
  pages: {
    id: string
    title: string
    slug: string
    parent_page_id: string | null
    generation_status: string
  }[]
  username: string
  wikiSlug: string
}

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function TopicTree({ pages, username, wikiSlug }: TopicTreeProps) {
  // Build tree hierarchy
  const buildTree = (): TreeNode[] => {
    const nodeMap: Record<string, TreeNode> = {}
    const roots: TreeNode[] = []

    // Initialize map
    pages.forEach(p => {
      nodeMap[p.id] = {
        id: p.id,
        title: p.title,
        slug: p.slug,
        generationStatus: p.generation_status,
        children: []
      }
    })

    // Connect parents and children
    pages.forEach(p => {
      const node = nodeMap[p.id]
      if (p.parent_page_id && nodeMap[p.parent_page_id]) {
        nodeMap[p.parent_page_id].children.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  const roots = buildTree()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    // Expand root by default
    ...(roots[0] ? { [roots[0].id]: true } : {})
  })

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const renderNode = (node: TreeNode, depth = 0) => {
    const hasChildren = node.children.length > 0
    const isExpanded = expanded[node.id]
    const isPending = node.generationStatus === "PENDING"

    return (
      <div key={node.id} className="select-none">
        <div 
          className="flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-slate-700 dark:text-zinc-300 text-sm cursor-pointer group"
          style={{ paddingLeft: `${Math.max(8, depth * 20)}px` }}
        >
          {hasChildren ? (
            <button 
              onClick={(e) => toggleExpand(node.id, e)} 
              className="p-0.5 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300 transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <span className="w-4.5 h-4.5 shrink-0 flex items-center justify-center">
              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-zinc-700"></span>
            </span>
          )}
          
          <BookOpen className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
          
          <Link 
            href={`/u/${username}/${wikiSlug}/${node.slug}`}
            className="hover:text-purple-600 dark:hover:text-purple-400 hover:underline font-medium truncate shrink-0 max-w-[250px]"
          >
            {node.title}
          </Link>

          {isPending && (
            <Badge variant="outline" className="text-[9px] font-mono text-amber-600 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-900/50 dark:bg-amber-950/20 px-1 py-0 ml-2 shrink-0">
              Pending
            </Badge>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-0.5 space-y-0.5">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-4 pb-0 border-b border-slate-100 dark:border-zinc-800 mb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono flex items-center gap-1.5 pb-2">
          <FileCode className="h-3.5 w-3.5 text-[#6b38d4] dark:text-purple-400" />
          Explore Knowledge Tree
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        {roots.length === 0 ? (
          <div className="text-center py-4 text-xs font-mono text-slate-400 dark:text-zinc-500">
            No topics discovered yet.
          </div>
        ) : (
          <div className="space-y-1">
            {roots.map(root => renderNode(root))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
