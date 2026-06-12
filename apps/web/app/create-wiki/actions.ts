"use server"
import { supabase } from "@/lib/supabase";

import { auth } from "auth"
import { WikiRepository } from "@/lib/repositories/wiki"
import { getAIProvider } from "@/services/ai/provider"
import { createWikiSchema } from "@/lib/validation/wiki"
import { revalidatePath } from "next/cache"
import { canCreateWiki, canGenerateNames, incrementAiCredits } from "@/services/limits"



/**
 * Server action to generate wiki title and slug suggestions using DeepSeek AI.
 */
export async function generateWikiNamesAction(topic: string, description: string) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized. Please sign in." }
    }

    if (!topic || topic.trim() === "") {
      return { success: false, error: "Topic is required for suggestions." }
    }

    // Resolve user ID
    let userId = session.user.id
    if (!userId) {
      const { data: dbUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", session.user.email)
        .maybeSingle()
      if (dbUser) {
        userId = dbUser.id
      }
    }

    if (!userId) {
      return { success: false, error: "User not found in database." }
    }

    // Check limit
    const limitCheck = await canGenerateNames(userId)
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.error }
    }

    const { provider, isMocked } = getAIProvider()
    const suggestions = await provider.generateWikiNames(topic, description)

    // Increment credits ONLY if name generation succeeded and returned suggestions
    if (suggestions && suggestions.length > 0) {
      await incrementAiCredits(userId, 1)
    }

    return { success: true, suggestions, isMocked }
  } catch (err: any) {
    console.error("generateWikiNamesAction error:", err)
    return { success: false, error: err.message || "Failed to generate suggestions." }
  }
}

/**
 * Server action to insert a new wiki page.
 */
export async function createWikiAction(data: {
  title: string
  slug: string
  description: string
  visibility: "PRIVATE" | "UNLISTED" | "PUBLIC"
}) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized. Please sign in." }
    }

    // Validate using Zod schema
    const validated = createWikiSchema.parse(data)

    // Resolve user from db
    let dbUser: { id: string; username: string } | null = null
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("id, username")
        .eq("email", session.user.email)
        .maybeSingle()

      if (!error && user) {
        dbUser = user
      }
    } catch (e) {
      console.error("Database user fetch error in createWiki:", e)
    }

    // Fallback if mocked or user table not accessible
    if (!dbUser) {
      dbUser = {
        id: session.user.id || "mock-user-id",
        username: session.user.username || "sandbox",
      }
    }

    // Check workspace limits
    if (dbUser.id !== "mock-user-id") {
      const limitCheck = await canCreateWiki(dbUser.id)
      if (!limitCheck.allowed) {
        return { success: false, error: limitCheck.error }
      }
    }

    // Insert Wiki
    try {
      const wiki = await WikiRepository.insertWiki({
        owner_id: dbUser.id,
        title: validated.title,
        slug: validated.slug,
        description: validated.description ?? "",
        visibility: validated.visibility,
      })

      revalidatePath(`/u/${dbUser.username}`)
      return { success: true, redirectUrl: `/u/${dbUser.username}/${wiki.slug}` }
    } catch (dbErr: any) {
      console.error("Wiki insert db error:", dbErr)
      // If table doesn't exist (42P01) or other relation error, fallback to mock redirect
      if (dbErr?.code === "42P01" || dbErr?.message?.includes("relation") || dbErr?.message?.includes("does not exist")) {
        return {
          success: true,
          redirectUrl: `/u/${dbUser.username}/${validated.slug}`,
          isMocked: true,
        }
      }
      return { success: false, error: dbErr.message || "Database write failure." }
    }
  } catch (err: any) {
    console.error("createWikiAction error:", err)
    return { success: false, error: err.message || "Failed to create wiki." }
  }
}
