import { supabase } from "@/lib/supabase";
import { auth } from "auth"
import ProfileDetails from "./profile-details"
import Header from "@/components/header"



interface ProfilePageProps {
  params: Promise<{
    username: string
  }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params

  // 1. Resolve user profile from Supabase
  let dbUser: { id: string; email: string; username: string; image: string | null; plan: string } | null = null
  let isMocked = false

  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, username, image, plan")
      .eq("username", username.toLowerCase())
      .maybeSingle()

    if (!error && data) {
      dbUser = data
    }
  } catch (err) {
    console.error("Database error fetching profile:", err)
    isMocked = true
  }

  // Fallback to mock profile if not found or database tables are missing
  if (isMocked || !dbUser) {
    dbUser = {
      id: "mock-user-id",
      username: username.toLowerCase(),
      email: `${username.toLowerCase()}@instant.wiki`,
      image: null,
      plan: "FREE"
    }
    isMocked = true
  }

  // 2. Resolve session permission ownership
  const session = await auth()
  const isOwner = session?.user?.email === dbUser.email

  // 3. Resolve user limits and statistics if they exist in the DB
  let usage = {
    plan: "FREE" as "FREE" | "PRO",
    workspacesCount: 0,
    workspacesLimit: 1,
    pagesCount: 0,
    pagesLimit: 25,
    docsCount: 0,
    docsLimit: 10,
    aiCreditsUsed: 0,
    aiCreditsLimit: 5,
    storageBytesUsed: 0,
    storageLimit: 50 * 1024 * 1024,
    chunksCount: 0,
    imagesCount: 0
  }

  if (dbUser && !isMocked) {
    try {
      const { getUserUsage } = require("@/services/limits")
      const liveUsage = await getUserUsage(dbUser.id)
      usage = liveUsage
    } catch (err) {
      console.error("Error retrieving user usage stats:", err)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] dark:bg-zinc-950 text-[#1A1C1B] dark:text-zinc-100">
      <Header />
      
      <main className="flex-1 py-12 max-w-md mx-auto px-6 w-full flex flex-col justify-start">
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              User Profile
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
              Manage your personal identity credentials
            </p>
          </div>

          <ProfileDetails
            user={dbUser}
            isOwner={isOwner || isMocked}
            isMocked={isMocked}
            usage={usage}
          />
        </div>
      </main>
    </div>
  )
}
