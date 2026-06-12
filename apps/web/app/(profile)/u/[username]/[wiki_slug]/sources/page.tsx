import { createClient } from "@supabase/supabase-js"
import { WikiRepository } from "@/lib/repositories/wiki"
import { DocumentRepository } from "@/lib/repositories/document"
import SourcesView from "./sources-view"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

interface SourcesPageProps {
  params: Promise<{
    username: string
    wiki_slug: string
  }>
}

export default async function SourcesPage({ params }: SourcesPageProps) {
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
    console.error("Error fetching owner in sources page:", err)
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

  // Fallback mock wiki if not found
  if (isMocked || !wiki) {
    const displayTitle = wiki_slug
      .replace(/-+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
    wiki = {
      id: "00000000-0000-0000-0000-000000000000",
      title: displayTitle || "Wiki Database",
      slug: wiki_slug,
    }
    isMocked = true
  }

  // 3. Fetch Documents
  let initialDocuments: any[] = []
  if (wiki?.id) {
    try {
      initialDocuments = await DocumentRepository.fetchWikiDocuments(wiki.id)
    } catch (err) {
      console.error("Error fetching wiki documents:", err)
    }
  }

  return (
    <SourcesView 
      username={username} 
      wikiSlug={wiki_slug} 
      wikiId={wiki.id}
      initialDocuments={initialDocuments}
    />
  )
}
