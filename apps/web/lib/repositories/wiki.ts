import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

export type WikiVisibility = "PRIVATE" | "UNLISTED" | "PUBLIC"
export type WikiStatus = "DRAFT" | "PROCESSING" | "READY" | "FAILED"

export interface Wiki {
  id: string
  owner_id: string
  title: string
  slug: string
  description: string | null
  visibility: WikiVisibility
  status: WikiStatus
  page_limit: number
  page_count: number
  created_at: string
  updated_at: string
}

export const WikiRepository = {
  /**
   * Fetches all wikis belonging to a specific user ID.
   */
  async fetchUserWikis(userId: string): Promise<Wiki[]> {
    const { data, error } = await supabase
      .from("wikis")
      .select("*")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false })

    if (error) {
      throw error
    }

    return data as Wiki[]
  },

  /**
   * Fetches a single wiki by owner ID and slug.
   */
  async fetchWikiBySlug(ownerId: string, slug: string): Promise<Wiki | null> {
    const { data, error } = await supabase
      .from("wikis")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("slug", slug.toLowerCase())
      .maybeSingle()

    if (error) {
      throw error
    }

    return data as Wiki | null
  },

  /**
   * Inserts a new wiki record into the database.
   */
  async insertWiki(wikiData: {
    owner_id: string
    title: string
    slug: string
    description: string
    visibility: WikiVisibility
    status?: WikiStatus
    page_limit?: number
  }): Promise<Wiki> {
    const { data, error } = await supabase
      .from("wikis")
      .insert({
        owner_id: wikiData.owner_id,
        title: wikiData.title,
        slug: wikiData.slug.toLowerCase(),
        description: wikiData.description || null,
        visibility: wikiData.visibility,
        status: wikiData.status || "READY", // Defaulting to READY for this module
        page_limit: wikiData.page_limit ?? 25,
        page_count: 0,
      })
      .select("*")
      .single()

    if (error) {
      throw error
    }

    return data as Wiki
  },

  /**
   * Deletes a wiki record by ID.
   */
  async deleteWiki(wikiId: string): Promise<void> {
    const { error } = await supabase
      .from("wikis")
      .delete()
      .eq("id", wikiId)

    if (error) {
      throw error
    }
  },

  /**
   * Updates a wiki record by ID.
   */
  async updateWiki(
    wikiId: string,
    updates: Partial<Pick<Wiki, "title" | "description" | "visibility" | "status" | "page_count">>
  ): Promise<Wiki> {
    const { data, error } = await supabase
      .from("wikis")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", wikiId)
      .select("*")
      .single()

    if (error) {
      throw error
    }

    return data as Wiki
  },
}
