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
  FileText,
  FolderOpen,
  ArrowUpRight,
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

  // Build nested tree hierarchy
  const buildTree = (): TreeNode[] => {
    const nodeMap: Record<string, TreeNode> = {}
    const roots: TreeNode[] = []

    pages.forEach((p) => {
      nodeMap[p.id] = {
        id: p.id,
        title: p.title,
        slug: p.slug,
        generationStatus: p.generation_status,
        children: [],
      }
    })

    pages.forEach((p) => {
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
    ...(roots[0] ? { [roots[0].id]: true } : {}),
  })

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const renderNode = (node: TreeNode, depth = 0) => {
    const hasChildren = node.children.length > 0
    const isExpanded = expanded[node.id]
    const isPending = node.generationStatus === "PENDING"
    const nodeHref = `/u/${username}/${wikiSlug}/${node.slug}`
    const isNodeActive = pathname === nodeHref || pathname === `${nodeHref}/`

    const rowBase = `group flex items-center gap-2 w-full rounded-lg py-2 px-2 text-xs font-medium transition-colors cursor-pointer`
    const rowActive = `text-[#6b38d4] dark:text-purple-300 bg-purple-50/80 dark:bg-purple-950/25 font-semibold`
    const rowIdle = `text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/70 dark:hover:bg-zinc-800/50`

    // Shared inner content
    const inner = (
      <>
        {/* Indent spacer */}
        {depth > 0 && <span style={{ width: `${depth * 12}px` }} className="shrink-0" />}

        {/* Chevron or dot */}
        {hasChildren ? (
          <ChevronRight
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            } ${isNodeActive ? "text-[#6b38d4] dark:text-purple-400" : "text-slate-400 dark:text-zinc-500"}`}
          />
        ) : (
          <span className="flex items-center justify-center w-3.5 h-3.5 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-zinc-600" />
          </span>
        )}

        {/* Icon */}
        <FileText
          className={`h-3.5 w-3.5 shrink-0 ${
            isNodeActive ? "text-[#6b38d4] dark:text-purple-400" : "text-slate-400 dark:text-zinc-500"
          }`}
        />

        {/* Title */}
        <span className="truncate flex-1 leading-snug text-left">{node.title}</span>

        {/* Pending badge */}
        {isPending && (
          <span className="shrink-0 text-[8px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 border border-amber-200 dark:border-amber-900/50 rounded">
            Pending
          </span>
        )}

        {/* Enter icon — only for parent nodes, shows on hover */}
        {hasChildren && (
          <Link
            href={nodeHref}
            onClick={(e) => e.stopPropagation()}
            title={`Open ${node.title}`}
            className={`shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-100 dark:hover:bg-purple-900/30 ${
              isNodeActive
                ? "text-[#6b38d4] dark:text-purple-400"
                : "text-slate-400 dark:text-zinc-500 hover:text-[#6b38d4] dark:hover:text-purple-400"
            }`}
          >
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </>
    )

    return (
      <div key={node.id} className="select-none">
        {hasChildren ? (
          // Parent: row is the expand toggle; enter icon navigates
          <button
            onClick={(e) => toggleExpand(node.id, e)}
            className={`${rowBase} ${isNodeActive ? rowActive : rowIdle}`}
          >
            {inner}
          </button>
        ) : (
          // Leaf: entire row navigates
          <Link
            href={nodeHref}
            title={node.title}
            className={`${rowBase} ${isNodeActive ? rowActive : rowIdle}`}
          >
            {inner}
          </Link>
        )}

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-0.5 space-y-0.5">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }


  const navItems = [
    { name: "Overview", href: basePath, icon: BookOpen, exact: true },
    { name: "Graph", href: `${basePath}/graph`, icon: Network, exact: false },
    { name: "Sources", href: `${basePath}/sources`, icon: Database, exact: false },
  ]

  if (isOwner) {
    navItems.push({ name: "Settings", href: `${basePath}/settings`, icon: Settings, exact: false })
  }

  return (
    <div className="space-y-6">
      {/* 1. Main Navigation */}
      <nav className="space-y-0.5" role="navigation" aria-label="Workspace Sidebar">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.exact
            ? pathname === item.href || pathname === `${item.href}/`
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? "bg-purple-50/80 dark:bg-purple-950/25 text-[#6b38d4] dark:text-purple-300"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100/70 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-100"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? "text-[#6b38d4] dark:text-purple-400" : "text-slate-400 dark:text-zinc-500"
                }`}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* 2. Knowledge Vault Tree */}
      <div className="space-y-2 pt-4 border-t border-slate-200/80 dark:border-zinc-800/80">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono px-2 flex items-center gap-1.5 select-none">
          <FolderOpen className="h-3.5 w-3.5 text-[#6b38d4] dark:text-purple-400" />
          Knowledge Vault
        </div>

        {roots.length === 0 ? (
          <div className="px-3 py-2 text-[10px] font-mono text-slate-400 dark:text-zinc-500 italic">
            No pages generated yet.
          </div>
        ) : (
          <div className="space-y-0.5">
            {roots.map((root) => renderNode(root))}
          </div>
        )}
      </div>
    </div>
  )
}
