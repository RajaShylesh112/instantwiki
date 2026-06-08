import NextAuth, { type DefaultSession } from "next-auth"
import "next-auth/jwt"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { createClient } from "@supabase/supabase-js"
import { verifyPassword } from "@/lib/password"

const hasSupabase = process.env.SUPABASE_URL && 
  process.env.SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
  process.env.SUPABASE_KEY &&
  process.env.SUPABASE_KEY !== "YOUR_SUPABASE_KEY"

const useDatabase = hasSupabase && process.env.AUTH_USE_DATABASE === "true"

const supabase = hasSupabase
  ? createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)
  : null

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: !!process.env.AUTH_DEBUG,
  theme: { logo: "https://authjs.dev/img/logo-sm.png" },
  providers: [
    Google,
    Credentials({
      credentials: {
        usernameOrEmail: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const usernameOrEmail = credentials?.usernameOrEmail as string
        const password = credentials?.password as string
        if (!usernameOrEmail || !password || !supabase) return null

        try {
          const { data: user, error } = await supabase
            .from("users")
            .select("id, email, username, password_hash, plan, image")
            .or(`email.eq.${usernameOrEmail.toLowerCase()},username.eq.${usernameOrEmail.toLowerCase()}`)
            .maybeSingle()

          if (error || !user || !user.password_hash) {
            return null
          }

          const isValid = verifyPassword(password, user.password_hash)
          if (!isValid) return null

          return {
            id: user.id,
            name: user.username,
            email: user.email,
            image: user.image,
            username: user.username,
            plan: user.plan,
          }
        } catch (e) {
          console.error("Credentials authorize exception:", e)
          return null
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        if (useDatabase && supabase) {
          try {
            // Check if user already exists in custom users table
            const { data: existingUser, error: findError } = await supabase
              .from("users")
              .select("id, image")
              .eq("email", user.email)
              .maybeSingle()

            if (findError) {
              console.error("Supabase error finding user:", findError)
              return false
            }

            if (!existingUser) {
              // Derive a unique username from email
              const emailPrefix = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "")
              let username = emailPrefix || "user"
              
              // Verify uniqueness of username, append random number if taken
              const { data: usernameTaken } = await supabase
                .from("users")
                .select("id")
                .eq("username", username)
                .maybeSingle()

              if (usernameTaken) {
                username = `${username}_${Math.floor(Math.random() * 1000)}`
              }

              // Insert new user matching your custom users table schema (Option B + image)
              const { error: insertError } = await supabase
                .from("users")
                .insert({
                  email: user.email,
                  username: username,
                  image: user.image,
                  plan: "FREE",
                })

              if (insertError) {
                console.error("Supabase error inserting user:", insertError)
                return false
              }
            } else {
              // Existing user - Sync their Google image if it has changed or is empty
              if (user.image && existingUser.image !== user.image) {
                await supabase
                  .from("users")
                  .update({ image: user.image })
                  .eq("id", existingUser.id)
              }
            }
          } catch (e) {
            console.error("Database signIn callback crashed:", e)
            return false
          }
        }
      }
      return true
    },
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl
      if (pathname === "/middleware-example") return !!auth
      return true
    },
    async jwt({ token, trigger, session, account }) {
      if (trigger === "update") token.name = session.user.name

      // Inject database user ID and username into JWT
      if (token.email && supabase) {
        try {
          const { data: dbUser } = await supabase
            .from("users")
            .select("id, username")
            .eq("email", token.email)
            .maybeSingle()
          if (dbUser) {
            token.id = dbUser.id
            token.username = dbUser.username
          }
        } catch (e) {
          console.error("Error fetching user ID in jwt callback:", e)
        }
      }

      if (account?.provider === "keycloak") {
        return { ...token, accessToken: account.access_token }
      }
      return token
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string
      }
      if (token?.username) {
        session.user.username = token.username as string
      }
      if (token?.accessToken) {
        session.accessToken = token.accessToken
      }

      return session
    },
  },
  experimental: { enableWebAuthn: true },
})

declare module "next-auth" {
  interface Session {
    accessToken?: string
    user: {
      id?: string
      username?: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    id?: string
    username?: string
  }
}
