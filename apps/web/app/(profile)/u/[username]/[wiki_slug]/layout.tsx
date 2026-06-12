import { auth } from "auth"
import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { WikiRepository } from "@/lib/repositories/wiki"
import Link from "next/link"
import SidebarNav from "./sidebar-nav"
import ThemeToggle from "@/components/layout/ThemeToggle"

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
      wiki = await WikiRepository.getOrCreateWikiBySlug(ownerUser.id, wiki_slug)
      if (wiki.id === "00000000-0000-0000-0000-000000000000") {
        isMocked = true
      }
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
      id: "00000000-0000-0000-0000-000000000000",
      owner_id: ownerUser?.id || "00000000-0000-0000-0000-000000000000",
      title: displayTitle || "Wiki Database",
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

  // 4. Fetch Pages to render Vault Sidebar Tree
  let wikiPages: any[] = []
  if (wiki?.id && !isMocked) {
    try {
      const { data, error } = await supabase
        .from("wiki_pages")
        .select("id, title, slug, parent_page_id, page_type, generation_status")
        .eq("wiki_id", wiki.id)
        .order("title", { ascending: true })
      if (!error && data) {
        wikiPages = data
      }
    } catch (err) {
      console.error("Error fetching pages in layout:", err)
    }
  } else if (isMocked) {
    // Mock pages tree for Sandbox Mock
    const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    const displayTitle = wiki_slug
      .replace(/-+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
    const rootSlug = slugify(`introduction-to-${wiki_slug}`)
    const coreSlug = slugify(`${wiki_slug}-core-principles`)
    const methodSlug = slugify(`${wiki_slug}-methodology`)
    
    wikiPages = [
      { id: "mock-page-1", wiki_id: wiki.id, parent_page_id: null, slug: rootSlug, title: `Introduction to ${displayTitle}`, page_type: "ROOT", generation_status: "GENERATED" },
      { id: "mock-page-2", wiki_id: wiki.id, parent_page_id: "mock-page-1", slug: coreSlug, title: `${displayTitle} Core Principles`, page_type: "TOPIC", generation_status: "GENERATED" },
      { id: "mock-page-3", wiki_id: wiki.id, parent_page_id: "mock-page-1", slug: methodSlug, title: `${displayTitle} Methodology`, page_type: "TOPIC", generation_status: "GENERATED" }
    ]
  }

  // If the wiki is PRIVATE and the caller is not the owner, return notFound
  if (wiki.visibility === "PRIVATE" && !isOwner && !isMocked) {
    return notFound()
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-150 font-sans">
      {/* Left Sidebar Navigation Component (nav-001) */}
      <aside className="w-60 border-r border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 flex flex-col justify-between shrink-0 h-screen sticky top-0">
        <div className="p-5 flex flex-col h-full overflow-hidden">
          {/* Logo Branding */}
          <Link href="/" className="font-mono font-bold text-slate-900 dark:text-white hover:text-[#6b38d4] transition-colors text-base block shrink-0 mb-6">
            instant.wiki
          </Link>
 
          {/* Navigation Links & Vault Tree - Scrollable content wrapper */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-6">
            <SidebarNav 
              username={username} 
              wikiSlug={wiki_slug} 
              isOwner={isOwner || isMocked} 
              pages={wikiPages}
            />
          </div>
        </div>

        {/* User profile / Plan footer */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 flex flex-col gap-1 text-xs text-slate-500 font-mono">
          <div className="truncate font-semibold text-slate-800 dark:text-zinc-200">
            @{username}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#6b38d4]"></span>
            <span>Free Plan</span>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#FAFAF8] dark:bg-zinc-950">
        {/* Workspace Top Navbar */}
        <header className="h-16 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-8 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-extrabold font-mono text-[#006b5e] bg-[#006b5e]/10 border border-[#006b5e]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Workspace
            </span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-sans truncate max-w-[200px] sm:max-w-[400px]">
              {wiki.title}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 text-sm font-bold text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:border-slate-900 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-900 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200 shadow-sm"
            >
              Exit Workspace
            </Link>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
