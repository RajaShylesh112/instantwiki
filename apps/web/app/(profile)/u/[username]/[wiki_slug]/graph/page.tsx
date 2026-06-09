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
}

export default async function GraphPage({ params }: GraphPageProps) {
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
    console.error("Error fetching owner:", err)
  }

  // 2. Fetch Wiki
  let wiki: any = null
  let isMocked = false

  if (ownerUser) {
    try {
      wiki = await WikiRepository.fetchWikiBySlug(ownerUser.id, wiki_slug)
    } catch (dbErr: any) {
      if (dbErr?.code === "42P01") isMocked = true
    }
  }

  if (!wiki) {
    wiki = {
      id: "mock-wiki-id",
      title: "Machine Learning Atlas",
      slug: wiki_slug,
    }
    isMocked = true
  }

  // 3. Fetch all wiki pages
  let allPages: any[] = []
  if (wiki?.id) {
    try {
      allPages = await WikiGeneratorRepository.fetchWikiPages(wiki.id)
    } catch (err) {
      console.error("Error fetching all pages:", err)
    }
  }

  // Sandbox mock pages fallback
  if (allPages.length === 0 && isMocked) {
    allPages = [
      { id: "mock-page-1", wiki_id: wiki.id, parent_page_id: null, slug: "foundations-of-data-operations", title: "Foundations of Data Operations", summary: "Introductory framework...", page_type: "ROOT" },
      { id: "mock-page-2", wiki_id: wiki.id, parent_page_id: "mock-page-1", slug: "core-algorithmic-frameworks", title: "Core Algorithmic Frameworks", summary: "Analyzing optimization...", page_type: "TOPIC" },
      { id: "mock-page-3", wiki_id: wiki.id, parent_page_id: "mock-page-1", slug: "deployment-vector-indexing", title: "Deployment & Vector Indexing", summary: "Scaling vector databases...", page_type: "TOPIC" }
    ]
  }

  return (
    <GraphView 
      username={username} 
      wikiSlug={wiki_slug} 
      wikiId={wiki.id}
      initialPages={allPages}
    />
  )
}
