"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Network, Database, Settings } from "lucide-react"

interface SidebarNavProps {
  username: string
  wikiSlug: string
  isOwner: boolean
}

export default function SidebarNav({ username, wikiSlug, isOwner }: SidebarNavProps) {
  const pathname = usePathname()

  const basePath = `/u/${username}/${wikiSlug}`

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
                ? "bg-[#6b38d4]/10 text-[#6b38d4]"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#6b38d4]" : "text-slate-400"}`} />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
