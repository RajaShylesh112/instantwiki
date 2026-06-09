import { auth } from "auth"
import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { WikiRepository } from "@/lib/repositories/wiki"
import Link from "next/link"
import SidebarNav from "./sidebar-nav"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

interface WikiLayoutProps {
  children: React.ReactNode
  params: Promise<{
    username: string
    wiki_slug: string
  }>
}

export default async function WikiLayout({ children, params }: WikiLayoutProps) {
  const { username, wiki_slug } = await params

  // 1. Resolve owner user ID
  let ownerUser: { id: string; email: string; username: string } | null = null
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, username")
      .eq("username", username.toLowerCase())
      .maybeSingle()

    if (!error && data) {
      ownerUser = data
    }
  } catch (err) {
    console.error("Error fetching owner in layout:", err)
  }

  // 2. Fetch Wiki
  let wiki: any = null
  let isMocked = false

  if (ownerUser) {
    try {
      wiki = await WikiRepository.fetchWikiBySlug(ownerUser.id, wiki_slug)
    } catch (dbErr: any) {
      if (dbErr?.code === "42P01") {
        isMocked = true
      }
    }
  }

  // Fallback mock
  if (isMocked || !wiki) {
    const displayTitle = wiki_slug
      .replace(/-+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())

    wiki = {
      id: "mock-wiki-id",
      owner_id: ownerUser?.id || "mock-owner-id",
      title: displayTitle || "Machine Learning Atlas",
      slug: wiki_slug,
      visibility: "PUBLIC",
      status: "READY",
      page_limit: 25,
      page_count: 42,
    }
    isMocked = true
  }

  // 3. Resolve ownership permissions
  const session = await auth()
  const isOwner = session?.user?.email === ownerUser?.email

  // If the wiki is PRIVATE and the caller is not the owner, return notFound
  if (wiki.visibility === "PRIVATE" && !isOwner && !isMocked) {
    return notFound()
  }

  return (
    <div className="flex min-h-screen bg-white text-slate-900 font-sans">
      {/* Left Sidebar Navigation Component (nav-001) */}
      <aside className="w-60 border-r border-slate-200 bg-slate-50 flex flex-col justify-between shrink-0 h-screen sticky top-0">
        <div className="p-5 space-y-6">
          {/* Logo Branding */}
          <Link href="/" className="font-mono font-bold text-slate-900 hover:text-[#6b38d4] transition-colors text-base block">
            instant.wiki
          </Link>

          {/* Navigation Links */}
          <div className="space-y-1.5">
            <SidebarNav 
              username={username} 
              wikiSlug={wiki_slug} 
              isOwner={isOwner || isMocked} 
            />
          </div>
        </div>

        {/* User profile / Plan footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-1 text-xs text-slate-500 font-mono">
          <div className="truncate font-semibold text-slate-800">
            @{username}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#6b38d4]"></span>
            <span>Free Plan</span>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#FAFAF8]">
        {/* Workspace Top Navbar */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-extrabold font-mono text-[#006b5e] bg-[#006b5e]/10 border border-[#006b5e]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Workspace
            </span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900 font-sans truncate max-w-[200px] sm:max-w-[400px]">
              {wiki.title}
            </span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 text-sm font-bold text-slate-600 hover:text-white border border-slate-200 hover:border-slate-900 bg-white hover:bg-slate-900 rounded-xl transition-all duration-200 shadow-sm"
          >
            Exit Workspace
          </Link>
        </header>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
