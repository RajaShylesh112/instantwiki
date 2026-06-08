"use server"

import { auth } from "auth"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

interface UpdateProfileResult {
  success: boolean
  error?: string
  redirectUrl?: string
}

export async function updateProfile(
  userId: string,
  newUsername: string,
  newImage: string
): Promise<UpdateProfileResult> {
  try {
    // 1. Authenticate the caller
    const session = await auth()
    if (!session?.user?.email) {
      return { success: false, error: "Unauthorized. Please sign in." }
    }

    // 2. Resolve the logged-in user in Supabase using email
    const { data: dbUser, error: dbError } = await supabase
      .from("users")
      .select("id, username")
      .eq("email", session.user.email)
      .maybeSingle()

    if (dbError || !dbUser) {
      return { success: false, error: "Authenticated user not found in database." }
    }

    // 3. Confirm ownership: caller's database ID must match the profile ID being updated
    if (dbUser.id !== userId) {
      return { success: false, error: "Forbidden. You can only edit your own profile." }
    }

    // 4. Validate the username format
    const cleanUsername = newUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, "")
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return {
        success: false,
        error: "Username must be between 3 and 30 characters (alphanumeric & underscores only).",
      }
    }

    // 5. Check if the username is already taken by another user
    const { data: takenUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("username", cleanUsername)
      .maybeSingle()

    if (checkError) {
      return { success: false, error: "Database error during username validation." }
    }

    if (takenUser && takenUser.id !== userId) {
      return { success: false, error: "Username is already taken by another user." }
    }

    // 6. Validate Image URL format (if provided)
    let cleanImage = newImage.trim()
    if (cleanImage) {
      try {
        new URL(cleanImage)
      } catch (e) {
        return { success: false, error: "Please enter a valid image URL." }
      }
    } else {
      cleanImage = ""
    }

    // 7. Perform the update in Supabase
    const { error: updateError } = await supabase
      .from("users")
      .update({ 
        username: cleanUsername,
        image: cleanImage || null
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Supabase update profile error:", updateError)
      return { success: false, error: "Failed to update profile in database." }
    }

    // 8. Revalidate both old and new username routes
    revalidatePath(`/u/${dbUser.username}`)
    revalidatePath(`/u/${cleanUsername}`)
    
    return { success: true, redirectUrl: `/u/${cleanUsername}` }
  } catch (err) {
    console.error("Error updating profile:", err)
    return { success: false, error: "An unexpected error occurred." }
  }
}
