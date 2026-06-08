import { auth } from "auth"
import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { WikiRepository, Wiki } from "@/lib/repositories/wiki"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  BookOpen,
  Calendar,
  Lock,
  Globe,
  EyeOff,
  Plus,
  ArrowRight,
  Database,
  User,
  Share2,
  FileText,
  Network,
  Bookmark,
  Sparkles,
} from "lucide-react"
import WikiSearch from "./wiki-search"
import { mockArticles, mockSources } from "./mock-data"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

interface WikiPageProps {
  params: Promise<{
    username: string
    wiki_slug: string
  }>
}

export default async function WikiPage({ params }: WikiPageProps) {
  const { username, wiki_slug } = await params

  // 1. Fetch user by username to resolve ownerId
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
    console.error("Error fetching owner user:", err)
  }

  // 2. Fetch Wiki from Supabase or fallback to mock
  let wiki: Wiki | null = null
  let isMocked = false

  if (ownerUser) {
    try {
      wiki = await WikiRepository.fetchWikiBySlug(ownerUser.id, wiki_slug)
    } catch (dbErr: any) {
      if (dbErr?.code === "42P01") {
        isMocked = true
      } else {
        console.error("Database error fetching wiki:", dbErr)
      }
    }
  } else {
    if (username.toLowerCase() === "raja" || username.toLowerCase() === "user") {
      isMocked = true
    }
  }

  // Setup sandbox mock fallback
  if (isMocked || !wiki) {
    const displayTitle = wiki_slug
      .replace(/-+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
    
    wiki = {
      id: "mock-wiki-id",
      owner_id: ownerUser?.id || "mock-owner-id",
      title: displayTitle || "Machine Learning Atlas",
      slug: wiki_slug,
      description: `A comprehensive knowledge directory and structured handbook mapping concepts, algorithms, and references in ${displayTitle || "Machine Learning"}.`,
      visibility: "PUBLIC",
      status: "READY",
      page_limit: 25,
      page_count: 42,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }
    isMocked = true
  }

  // 3. Resolve permissions
  const session = await auth()
  const isOwner = session?.user?.email === ownerUser?.email

  if (wiki.visibility === "PRIVATE" && !isOwner && !isMocked) {
    return notFound()
  }

  const joinDate = new Date(wiki.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const mainArticles = Object.values(mockArticles)

  return (
    <div className="relative flex flex-col gap-8 py-8 max-w-6xl mx-auto px-6 font-sans">
      
      {/* Search Header Container (home-search-header) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <WikiSearch username={username} wikiSlug={wiki_slug} />
        
        {isMocked && (
          <div className="text-[11px] font-mono text-amber-600 bg-amber-50 border border-amber-100 rounded px-2.5 py-1 flex items-center gap-1.5 shrink-0 select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Sandbox Mock Active
          </div>
        )}
      </div>

      {/* Main Grid: Wikipedia Style */}
      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* Main Content Column (Left, Col-span 2) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Wiki Hero Header */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl" id="home-hero-title">
                {wiki.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-mono">
                <span>From InstantWiki, the structured knowledge hub</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {wiki.visibility === "PUBLIC" && <Globe className="h-3.5 w-3.5 text-blue-600" />}
                  {wiki.visibility === "UNLISTED" && <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                  {wiki.visibility === "PRIVATE" && <Lock className="h-3.5 w-3.5 text-red-500" />}
                  <span className="capitalize">{wiki.visibility.toLowerCase()} Namespace</span>
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex gap-4 border-y border-slate-200/60 py-2.5 font-mono text-xs text-slate-500">
              <div id="home-stat-pages">
                <span className="font-bold text-slate-800">{mockSources.length}</span> Sources
              </div>
              <span className="text-slate-300">|</span>
              <div id="home-stat-concepts">
                <span className="font-bold text-slate-800">{mainArticles.length}</span> Core Chapters
              </div>
              <span className="text-slate-300">|</span>
              <div id="home-stat-relationships">
                <span className="font-bold text-slate-800">8</span> Extracted Nodes
              </div>
            </div>
          </div>

          {/* Overview Card */}
          <div className="rounded-lg border border-slate-150 bg-slate-50/50 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-450 font-mono">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              AI Overview Summary
            </div>
            <p className="text-base text-slate-700 leading-relaxed font-serif pl-3 border-l-2 border-slate-300 italic" id="home-overview-text">
              {wiki.description || `This wiki covers computational research, sequence alignments, analysis pipelines, and machine learning models for predictions. Compiled from ${mockSources.length} core reference documents.`}
            </p>
          </div>

          {/* Wikipedia Table of Contents Widget */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 w-full max-w-sm space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Table of Contents
            </div>
            <ul className="space-y-2 text-xs font-mono text-blue-600">
              <li>
                <a href="#introduction" className="hover:underline">
                  1. Introduction
                </a>
              </li>
              <li>
                <a href="#key-topics" className="hover:underline">
                  2. Navigable Knowledge Pages
                </a>
              </li>
              <li>
                <a href="#bibliography" className="hover:underline">
                  3. Bibliography & Sources
                </a>
              </li>
            </ul>
          </div>

          {/* Section 1: Introduction */}
          <section id="introduction" className="space-y-3 pt-2">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-1.5 tracking-tight">
              1. Introduction
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-serif">
              InstantWiki works by extracting entities, documents, and concepts, converting them automatically into a hyperlinked documentation hub. Each page is a node in the larger knowledge system, enabling semantic exploration. Users can read articles, trace statements to their exact source PDF page via citations, or explore the entire database visually using the interactive relationship graph.
            </p>
          </section>

          {/* Section 2: Key Topics Grid */}
          <section id="key-topics" className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                2. Navigable Knowledge Pages
              </h2>
              {(isOwner || isMocked) && (
                <Link href={`/u/${username}/${wiki_slug}/sources`}>
                  <Button variant="ghost" className="text-indigo-600 font-semibold text-xs border border-slate-150 hover:bg-slate-50 h-7 px-2.5 flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add Document
                  </Button>
                </Link>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {mainArticles.map((article) => (
                <div
                  key={article.slug}
                  id={`home-topic-card-${article.slug}`}
                  className="group flex flex-col justify-between p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-350 hover:shadow-xs transition-all"
                >
                  <div className="space-y-2">
                    <Link
                      href={`/u/${username}/${wiki_slug}/${article.slug}`}
                      className="font-bold text-slate-955 hover:text-indigo-600 text-sm block transition-colors"
                    >
                      {article.title}
                    </Link>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {article.summary}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 mt-auto">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {article.citations.length} Citation{article.citations.length === 1 ? "" : "s"}
                    </span>
                    <Link
                      href={`/u/${username}/${wiki_slug}/${article.slug}`}
                      className="text-xs text-indigo-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      Read Article <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Bibliography & Sources */}
          <section id="bibliography" className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              3. Sources & References
            </h2>
            <ol className="space-y-1.5 text-xs text-slate-500 font-mono list-decimal pl-4">
              {mockSources.map((source) => (
                <li key={source.id} className="hover:text-slate-800 transition-colors">
                  <Link href={`/u/${username}/${wiki_slug}/sources`} className="hover:underline">
                    {source.name}
                  </Link>{" "}
                  — {source.pagesCount} pages, {source.conceptsCount} concepts found.
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Sidebar Column: Wikipedia Infobox & SVG Graph Widget */}
        <div className="space-y-6">
          
          {/* Wikipedia Infobox Widget */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs space-y-4">
            <div className="text-center font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
              {wiki.title}
            </div>

            <table className="w-full text-xs font-mono">
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500 font-bold w-1/3">Owner</td>
                  <td className="py-2 text-slate-900 text-right">@{username}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500 font-bold">Visibility</td>
                  <td className="py-2 text-slate-900 text-right capitalize">
                    {wiki.visibility.toLowerCase()}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500 font-bold">Status</td>
                  <td className="py-2 text-slate-900 text-right">
                    <span className="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                      {wiki.status}
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500 font-bold">Limit</td>
                  <td className="py-2 text-slate-900 text-right">{wiki.page_limit} pages</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-500 font-bold">Created</td>
                  <td className="py-2 text-slate-800 text-right">{joinDate}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SVG Concept Graph Widget */}
          <div id="knowledge-nodes" className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Concept Graph</span>
              <Network className="h-4 w-4 text-slate-400" />
            </div>

            <svg viewBox="0 0 200 180" className="w-full text-slate-800 font-mono">
              <line x1="100" y1="90" x2="100" y2="30" stroke="#E2E8F0" strokeWidth="1.5" />
              <line x1="100" y1="90" x2="40" y2="130" stroke="#E2E8F0" strokeWidth="1.5" />
              <line x1="100" y1="90" x2="160" y2="130" stroke="#E2E8F0" strokeWidth="1.5" />

              {/* Core Node */}
              <circle cx="100" cy="90" r="14" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="1.5" />
              <text x="100" y="93" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#4338CA">Atlas</text>

              {/* Ingestion Node */}
              <circle cx="100" cy="30" r="12" fill="#ECFDF5" stroke="#059669" strokeWidth="1.5" />
              <text x="100" y="33" textAnchor="middle" fontSize="6" fill="#047857">Ingest</text>

              {/* Extract Node */}
              <circle cx="40" cy="130" r="12" fill="#FAF5FF" stroke="#7C3AED" strokeWidth="1.5" />
              <text x="40" y="133" textAnchor="middle" fontSize="6" fill="#6D28D9">Extract</text>

              {/* Entity Node */}
              <circle cx="160" cy="130" r="12" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.5" />
              <text x="160" y="133" textAnchor="middle" fontSize="6" fill="#C2410C">Graph</text>
            </svg>
            <div className="text-[10px] text-slate-400 font-mono text-center">
              Active links: 8 nodes • 7 relationships
            </div>
            
            <Link href={`/u/${username}/${wiki_slug}/graph`} className="block w-full">
              <Button variant="ghost" className="w-full text-xs text-indigo-650 font-semibold border border-slate-150 hover:bg-slate-50 py-1.5 h-8">
                View Full Interactive Graph
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
