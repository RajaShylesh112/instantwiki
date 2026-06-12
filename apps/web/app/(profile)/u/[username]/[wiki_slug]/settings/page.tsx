import { supabase } from "@/lib/supabase";
import SettingsView from "./settings-view"
import { WikiRepository } from "@/lib/repositories/wiki"



interface SettingsPageProps {
  params: Promise<{
    username: string
    wiki_slug: string
  }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
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
    console.error("Error fetching owner in settings page:", err)
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
      title: displayTitle || "Wiki Database",
      description: `A comprehensive knowledge directory and structured handbook mapping concepts, algorithms, and references in ${displayTitle || "this wiki"}.`,
      visibility: "PUBLIC",
    }
  }

  return (
    <SettingsView 
      username={username} 
      wikiSlug={wiki_slug} 
      initialWiki={{
        id: wiki.id,
        title: wiki.title,
        description: wiki.description || "",
        visibility: wiki.visibility,
      }}
    />
  )
}


