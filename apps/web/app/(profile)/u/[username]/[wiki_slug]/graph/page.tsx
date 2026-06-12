import { createClient } from "@supabase/supabase-js"
import { WikiRepository } from "@/lib/repositories/wiki"
import { WikiGeneratorRepository } from "@/lib/repositories/wiki-generator"
import GraphView from "./graph-view"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

interface GraphPageProps {
  params: Promise<{
    username: string
    wiki_slug: string
  }>
  searchParams: Promise<{
    active?: string
  }>
}

export default async function GraphPage({ params, searchParams }: GraphPageProps) {
  const { username, wiki_slug } = await params
  const { active } = await searchParams

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
    console.error("Error fetching owner:", err)
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
      if (dbErr?.code === "42P01") isMocked = true
    }
  }

  if (!wiki) {
    const displayTitle = wiki_slug
      .replace(/-+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
    wiki = {
      id: "00000000-0000-0000-0000-000000000000",
      title: displayTitle || "Knowledge Atlas",
      slug: wiki_slug,
    }
    isMocked = true
  }

  // 3. Fetch all wiki pages and links
  let allPages: any[] = []
  let pageLinks: any[] = []
  if (wiki?.id) {
    try {
      allPages = await WikiGeneratorRepository.fetchWikiPages(wiki.id)
      pageLinks = await WikiGeneratorRepository.fetchPageLinks(wiki.id)
    } catch (err) {
      console.error("Error fetching all pages/links:", err)
    }
  }

  // Sandbox mock pages fallback
  if (allPages.length === 0 && isMocked) {
    const displayTitle = wiki_slug
      .replace(/-+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
    const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

    const rootSlug = slugify(`introduction-to-${wiki_slug}`)
    const coreSlug = slugify(`${wiki_slug}-core-principles`)
    const methodSlug = slugify(`${wiki_slug}-methodology`)

    allPages = [
      { id: "mock-page-1", wiki_id: wiki.id, parent_page_id: null, slug: rootSlug, title: `Introduction to ${displayTitle}`, summary: `Foundational overview, scope, and objectives of the ${displayTitle} workspace.`, page_type: "ROOT" },
      { id: "mock-page-2", wiki_id: wiki.id, parent_page_id: "mock-page-1", slug: coreSlug, title: `${displayTitle} Core Principles`, summary: `Analyzing key concepts, terminology, and structural models in ${displayTitle}.`, page_type: "TOPIC" },
      { id: "mock-page-3", wiki_id: wiki.id, parent_page_id: "mock-page-1", slug: methodSlug, title: `${displayTitle} Methodology`, summary: `Practical applications, processes, and standard workflows for ${displayTitle}.`, page_type: "TOPIC" }
    ]

    pageLinks = [
      { source_page_id: "mock-page-1", target_page_id: "mock-page-2", link_type: "internal" },
      { source_page_id: "mock-page-1", target_page_id: "mock-page-3", link_type: "internal" }
    ]
  }

  return (
    <GraphView 
      username={username} 
      wikiSlug={wiki_slug} 
      wikiId={wiki.id}
      initialPages={allPages}
      initialLinks={pageLinks}
      activePageId={active}
    />
  )
}
