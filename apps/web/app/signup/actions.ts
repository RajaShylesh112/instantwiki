"use server"
import { supabase } from "@/lib/supabase";

import { hashPassword } from "@/lib/password"



interface RegisterResult {
  success: boolean
  error?: string
}

export async function registerUser(
  formData: FormData
): Promise<RegisterResult> {
  try {
    const email = formData.get("email") as string
    const username = formData.get("username") as string
    const password = formData.get("password") as string

    // 1. Basic Validation
    if (!email || !username || !password) {
      return { success: false, error: "All fields are required." }
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "")
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return {
        success: false,
        error: "Username must be between 3 and 30 characters (letters, numbers, and underscores only).",
      }
    }

    const cleanEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: "Please enter a valid email address." }
    }

    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." }
    }

    // 2. Check email uniqueness
    const { data: emailExists, error: emailCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle()

    if (emailCheckError) {
      return { success: false, error: "Database error during validation check." }
    }
    if (emailExists) {
      return { success: false, error: "An account with this email already exists." }
    }

    // 3. Check username uniqueness
    const { data: usernameExists, error: usernameCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("username", cleanUsername)
      .maybeSingle()

    if (usernameCheckError) {
      return { success: false, error: "Database error during validation check." }
    }
    if (usernameExists) {
      return { success: false, error: "Username is already taken by another user." }
    }

    // 4. Hash the password
    const passwordHash = hashPassword(password)

    // 5. Insert new user record
    const { error: insertError } = await supabase.from("users").insert({
      email: cleanEmail,
      username: cleanUsername,
      password_hash: passwordHash,
      plan: "FREE",
    })

    if (insertError) {
      console.error("Database registration insertion error:", insertError)
      return { success: false, error: "Failed to create account. Please try again." }
    }

    return { success: true }
  } catch (err) {
    console.error("User registration crashed:", err)
    return { success: false, error: "An unexpected error occurred during signup." }
  }
}
