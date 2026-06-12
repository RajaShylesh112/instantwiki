"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  BookOpen, 
  Network, 
  Database, 
  Settings, 
  ChevronRight, 
  ChevronDown, 
  FileText,
  FolderOpen
} from "lucide-react"

interface SidebarNavProps {
  username: string
  wikiSlug: string
  isOwner: boolean
  pages: any[]
}

interface TreeNode {
  id: string
  title: string
  slug: string
  generationStatus: string
  children: TreeNode[]
}

export default function SidebarNav({ username, wikiSlug, isOwner, pages = [] }: SidebarNavProps) {
  const pathname = usePathname()
  const basePath = `/u/${username}/${wikiSlug}`

  // 1. Build nested tree hierarchy for the Knowledge Vault
  const buildTree = (): TreeNode[] => {
    const nodeMap: Record<string, TreeNode> = {}
    const roots: TreeNode[] = []

    pages.forEach(p => {
      nodeMap[p.id] = {
        id: p.id,
        title: p.title,
        slug: p.slug,
        generationStatus: p.generation_status,
        children: []
      }
    })

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
    const nodeHref = `/u/${username}/${wikiSlug}/${node.slug}`
    const isNodeActive = pathname === nodeHref || pathname === `${nodeHref}/`

    return (
      <div key={node.id} className="select-none">
        <div 
          className={`flex items-center gap-1.5 py-1 px-2 rounded-md transition-colors text-xs font-medium group ${
            isNodeActive 
              ? "bg-[#6b38d4]/10 dark:bg-purple-950/30 text-[#6b38d4] dark:text-purple-300" 
              : "text-slate-605 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100"
          }`}
          style={{ paddingLeft: `${Math.max(6, depth * 14)}px` }}
        >
          {hasChildren ? (
            <button 
              onClick={(e) => toggleExpand(node.id, e)} 
              className="p-0.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded text-slate-400 dark:text-zinc-500 hover:text-slate-650 dark:hover:text-zinc-300 transition-colors shrink-0"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          ) : (
            <span className="w-4 h-4 shrink-0 flex items-center justify-center">
              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-zinc-700"></span>
            </span>
          )}
          
          <FileText className={`h-3.5 w-3.5 shrink-0 ${isNodeActive ? "text-[#6b38d4] dark:text-purple-300" : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300"}`} />
          
          <Link 
            href={nodeHref}
            className="hover:underline truncate shrink-1 max-w-[130px]"
            title={node.title}
          >
            {node.title}
          </Link>

          {isPending && (
            <span className="text-[8px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 border border-amber-100 dark:border-amber-900/50 rounded ml-1 shrink-0 scale-90">
              Pending
            </span>
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

  const navItems = [
    {
      name: "Overview",
      href: basePath,
      icon: BookOpen,
      exact: true,
    },
    {
      name: "Graph",
      href: `${basePath}/graph`,
      icon: Network,
      exact: false,
    },
    {
      name: "Sources",
      href: `${basePath}/sources`,
      icon: Database,
      exact: false,
    },
  ]

  if (isOwner) {
    navItems.push({
      name: "Settings",
      href: `${basePath}/settings`,
      icon: Settings,
      exact: false,
    })
  }

  return (
    <div className="space-y-6">
      {/* 1. Main Navigation links */}
      <nav className="space-y-1" role="navigation" aria-label="Workspace Sidebar">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.exact
            ? pathname === item.href || pathname === `${item.href}/`
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? "bg-[#6b38d4]/10 dark:bg-purple-950/30 text-[#6b38d4] dark:text-purple-300"
                  : "text-slate-605 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#6b38d4] dark:text-purple-300" : "text-slate-400 dark:text-zinc-500"}`} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* 2. Knowledge Vault Tree Panel */}
      <div className="space-y-2 pt-4 border-t border-slate-200/80 dark:border-zinc-800/80">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono px-3 flex items-center gap-1.5 shrink-0 select-none">
          <FolderOpen className="h-3.5 w-3.5 text-[#6b38d4] dark:text-purple-400" />
          Knowledge Vault
        </div>

        {roots.length === 0 ? (
          <div className="px-3 py-2 text-[10px] font-mono text-slate-400 dark:text-zinc-500 italic">
            No pages generated yet.
          </div>
        ) : (
          <div className="space-y-0.5">
            {roots.map(root => renderNode(root))}
          </div>
        )}
      </div>
    </div>
  )
}
